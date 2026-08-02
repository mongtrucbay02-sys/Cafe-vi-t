/* ============================================================
   order.js - Logic trang Đặt hàng (Chọn món + Tùy chọn + Giỏ hàng + Thanh toán)
   ============================================================ */

AuthService.guard(["admin", "customer"]); // Admin & Khách hàng đều được đặt hàng

const pickListEl = document.getElementById("menuPickList");
const pickEmptyEl = document.getElementById("pickEmptyState");
const cartListEl = document.getElementById("cartList");
const cartEmptyEl = document.getElementById("cartEmpty");
const cartTotalEl = document.getElementById("cartTotal");
const orderHistoryEl = document.getElementById("orderHistoryList");
const orderHistoryEmptyEl = document.getElementById("orderHistoryEmpty");
const orderCountBadge = document.getElementById("orderCountBadge");
const pickSearch = document.getElementById("pickSearch");

let currentOptionProduct = null;
let currentOptionState = { size: "M", sugar: "50%", ice: "50%", toppings: [] };
let currentOptionQty = 1;
let appliedPromo = null; // { code, discount, message }

/* ---------- RENDER DANH SÁCH MÓN ĐỂ CHỌN ---------- */
function renderPickList() {
  const kw = pickSearch.value.trim().toLowerCase();
  const list = MenuService.getAll().filter(
    (p) => p.status === "Còn hàng" && p.name.toLowerCase().includes(kw)
  );

  pickListEl.innerHTML = "";
  pickEmptyEl.classList.toggle("d-none", list.length > 0);

  list.forEach((p) => {
    const col = document.createElement("div");
    col.className = "col-md-6";
    col.innerHTML = `
      <div class="cafe-card p-3 menu-pick-card h-100" data-id="${p.id}">
        <img src="${p.image || MenuService.DEFAULT_IMAGE}" alt="${p.name}" class="pick-thumb" onerror="this.src='${MenuService.DEFAULT_IMAGE}'">
        <div class="d-flex justify-content-between align-items-start">
          <div>
            <div class="fw-bold">${p.name}</div>
            <div class="text-muted small">${p.category}</div>
          </div>
          <span class="badge-instock">Còn ${p.stock}</span>
        </div>
        <div class="d-flex justify-content-between align-items-center mt-3">
          <span class="fw-bold" style="color:var(--brand)">${Number(p.price).toLocaleString("vi-VN")}đ</span>
          <button class="btn btn-sm btn-brand btn-pill btn-add-cart" data-id="${p.id}">
            <i class="fa-solid fa-cart-plus me-1"></i>Chọn món
          </button>
        </div>
      </div>`;
    pickListEl.appendChild(col);
  });

  // Cả thẻ và nút "Chọn món" đều mở modal tùy chọn (bắt buộc chọn size/đường/đá)
  document.querySelectorAll(".menu-pick-card").forEach((card) =>
    card.addEventListener("click", () => openOptionModal(Number(card.dataset.id)))
  );
}

/* ---------- MODAL TÙY CHỌN (Size / Đường / Đá / Topping) ---------- */
const optionModalEl = document.getElementById("optionModal");
const optionModal = new bootstrap.Modal(optionModalEl);

function openOptionModal(productId) {
  const product = MenuService.getById(productId);
  if (!product) return;
  currentOptionProduct = product;
  currentOptionState = { size: "M", sugar: "50%", ice: "50%", toppings: [] };
  currentOptionQty = 1;

  document.getElementById("optionModalImg").src = product.image || MenuService.DEFAULT_IMAGE;
  document.getElementById("optionModalName").textContent = product.name;
  document.getElementById("optionModalPrice").textContent = Number(product.price).toLocaleString("vi-VN") + "đ / phần cơ bản";
  document.getElementById("optQty").value = 1;

  renderOptionGroups();
  updateOptionTotal();
  optionModal.show();
}

function renderOptionGroups() {
  const sizeGroup = document.getElementById("optSizeGroup");
  sizeGroup.innerHTML = "";
  OrderService.OPTION_CONFIG.sizes.forEach((s) => {
    const el = document.createElement("div");
    el.className = "pay-method-option text-center" + (currentOptionState.size === s.value ? " active" : "");
    el.textContent = s.label + (s.extra ? ` (+${s.extra.toLocaleString("vi-VN")}đ)` : "");
    el.addEventListener("click", () => {
      currentOptionState.size = s.value;
      renderOptionGroups();
      updateOptionTotal();
    });
    sizeGroup.appendChild(el);
  });

  const sugarGroup = document.getElementById("optSugarGroup");
  sugarGroup.innerHTML = "";
  OrderService.OPTION_CONFIG.sugarLevels.forEach((lvl) => {
    const el = document.createElement("div");
    el.className = "pay-method-option text-center flex-fill" + (currentOptionState.sugar === lvl ? " active" : "");
    el.style.minWidth = "60px";
    el.textContent = lvl;
    el.addEventListener("click", () => {
      currentOptionState.sugar = lvl;
      renderOptionGroups();
    });
    sugarGroup.appendChild(el);
  });

  const iceGroup = document.getElementById("optIceGroup");
  iceGroup.innerHTML = "";
  OrderService.OPTION_CONFIG.iceLevels.forEach((lvl) => {
    const el = document.createElement("div");
    el.className = "pay-method-option text-center flex-fill" + (currentOptionState.ice === lvl ? " active" : "");
    el.style.minWidth = "60px";
    el.textContent = lvl;
    el.addEventListener("click", () => {
      currentOptionState.ice = lvl;
      renderOptionGroups();
    });
    iceGroup.appendChild(el);
  });

  const toppingGroup = document.getElementById("optToppingGroup");
  toppingGroup.innerHTML = "";
  OrderService.OPTION_CONFIG.toppings.forEach((t) => {
    const checked = currentOptionState.toppings.includes(t.value);
    const wrap = document.createElement("div");
    wrap.className = "form-check";
    wrap.innerHTML = `
      <input class="form-check-input" type="checkbox" id="topping_${t.value}" ${checked ? "checked" : ""}>
      <label class="form-check-label d-flex justify-content-between" for="topping_${t.value}">
        <span>${t.label}</span><span class="text-muted">+${t.extra.toLocaleString("vi-VN")}đ</span>
      </label>`;
    wrap.querySelector("input").addEventListener("change", (e) => {
      if (e.target.checked) {
        currentOptionState.toppings.push(t.value);
      } else {
        currentOptionState.toppings = currentOptionState.toppings.filter((x) => x !== t.value);
      }
      updateOptionTotal();
    });
    toppingGroup.appendChild(wrap);
  });
}

function updateOptionTotal() {
  if (!currentOptionProduct) return;
  const unitPrice = OrderService.computeUnitPrice(currentOptionProduct, currentOptionState);
  document.getElementById("optionModalTotal").textContent = (unitPrice * currentOptionQty).toLocaleString("vi-VN") + "đ";
}

document.getElementById("optQtyMinus").addEventListener("click", () => {
  currentOptionQty = Math.max(1, currentOptionQty - 1);
  document.getElementById("optQty").value = currentOptionQty;
  updateOptionTotal();
});
document.getElementById("optQtyPlus").addEventListener("click", () => {
  currentOptionQty += 1;
  document.getElementById("optQty").value = currentOptionQty;
  updateOptionTotal();
});

document.getElementById("btnConfirmAddCart").addEventListener("click", () => {
  if (!currentOptionProduct) return;
  OrderService.addToCartWithOptions(currentOptionProduct, { ...currentOptionState }, currentOptionQty);
  optionModal.hide();
  renderCart();
  if (typeof CartWidget !== "undefined") CartWidget.refresh();
  showToast(`Đã thêm "${currentOptionProduct.name}" vào giỏ hàng.`, "success");
});

/* ---------- RENDER GIỎ HÀNG ---------- */
function renderCart() {
  const cart = OrderService.getCart();
  cartListEl.innerHTML = "";
  cartEmptyEl.classList.toggle("d-none", cart.length > 0);

  cart.forEach((item) => {
    const desc = OrderService.describeOptions(item.options);
    const row = document.createElement("div");
    row.className = "cart-item";
    row.innerHTML = `
      <img src="${item.image || MenuService.DEFAULT_IMAGE}" alt="${item.name}" class="cart-thumb" onerror="this.src='${MenuService.DEFAULT_IMAGE}'">
      <div class="flex-grow-1">
        <div class="fw-bold">${item.name}</div>
        ${desc ? `<div class="text-muted" style="font-size:.78rem;">${desc}</div>` : ""}
        <div class="text-muted small">${(item.unitPrice ?? item.price).toLocaleString("vi-VN")}đ / món</div>
      </div>
      <input type="number" min="1" value="${item.qty}" class="form-control form-control-sm qty-box qty-input" data-id="${item.cartItemId}">
      <button class="btn btn-sm btn-outline-danger btn-pill btn-remove-item" data-id="${item.cartItemId}">
        <i class="fa-solid fa-xmark"></i>
      </button>`;
    cartListEl.appendChild(row);
  });

  document.querySelectorAll(".qty-input").forEach((input) =>
    input.addEventListener("change", () => {
      OrderService.updateQtyByCartId(input.dataset.id, Number(input.value));
      renderCart();
      if (typeof CartWidget !== "undefined") CartWidget.refresh();
    })
  );
  document.querySelectorAll(".btn-remove-item").forEach((btn) =>
    btn.addEventListener("click", () => {
      OrderService.removeCartItem(btn.dataset.id);
      renderCart();
      if (typeof CartWidget !== "undefined") CartWidget.refresh();
    })
  );

  renderCheckoutSummary();
}

/* ---------- GIAO HÀNG / TỰ LẤY + SỔ ĐỊA CHỈ ---------- */
const deliveryOptPickup = document.getElementById("deliveryOptPickup");
const deliveryOptDelivery = document.getElementById("deliveryOptDelivery");
const addressBlock = document.getElementById("addressBlock");
const addressSelect = document.getElementById("addressSelect");
const addressManual = document.getElementById("addressManual");
let deliveryMethod = "pickup";

function renderAddressOptions() {
  const list = AddressService.getAddresses();
  if (list.length === 0) {
    addressSelect.classList.add("d-none");
    addressManual.classList.remove("d-none");
    return;
  }
  addressSelect.classList.remove("d-none");
  addressManual.classList.add("d-none");
  addressSelect.innerHTML = list
    .map((a) => `<option value="${a.id}">${a.label} - ${a.detail}${a.isDefault ? " (Mặc định)" : ""}</option>`)
    .join("") + `<option value="__manual">+ Nhập địa chỉ khác...</option>`;
  const def = AddressService.getDefault();
  if (def) addressSelect.value = def.id;
}

addressSelect.addEventListener("change", () => {
  if (addressSelect.value === "__manual") {
    addressSelect.classList.add("d-none");
    addressManual.classList.remove("d-none");
    addressManual.value = "";
  }
});

deliveryOptPickup.addEventListener("click", () => {
  deliveryMethod = "pickup";
  deliveryOptPickup.classList.add("active");
  deliveryOptDelivery.classList.remove("active");
  addressBlock.classList.add("d-none");
  renderCheckoutSummary();
});
deliveryOptDelivery.addEventListener("click", () => {
  deliveryMethod = "delivery";
  deliveryOptDelivery.classList.add("active");
  deliveryOptPickup.classList.remove("active");
  addressBlock.classList.remove("d-none");
  renderAddressOptions();
  renderCheckoutSummary();
});

/* ---------- MÃ KHUYẾN MÃI ---------- */
document.getElementById("btnApplyPromo").addEventListener("click", () => {
  const code = document.getElementById("promoInput").value;
  const promoMsg = document.getElementById("promoMsg");
  const subtotal = OrderService.getCartTotal();
  const shippingFee = deliveryMethod === "delivery" ? OrderService.SHIPPING_FEE : 0;

  if (!code.trim()) {
    appliedPromo = null;
    promoMsg.textContent = "";
    renderCheckoutSummary();
    return;
  }

  const result = PromoService.validate(code, subtotal, shippingFee);
  if (result.valid) {
    appliedPromo = { code: code.trim().toUpperCase(), discount: result.discount };
    promoMsg.className = "small mt-1 text-success";
    promoMsg.textContent = result.message;
  } else {
    appliedPromo = null;
    promoMsg.className = "small mt-1 text-danger";
    promoMsg.textContent = result.message;
  }
  renderCheckoutSummary();
});

/* ---------- TÓM TẮT THANH TOÁN ---------- */
function renderCheckoutSummary() {
  const subtotal = OrderService.getCartTotal();
  const shippingFee = deliveryMethod === "delivery" ? OrderService.SHIPPING_FEE : 0;
  const discount = appliedPromo ? Math.min(appliedPromo.discount, subtotal + shippingFee) : 0;
  const total = Math.max(0, subtotal + shippingFee - discount);

  document.getElementById("sumSubtotal").textContent = subtotal.toLocaleString("vi-VN") + "đ";
  document.getElementById("sumShippingRow").classList.toggle("d-none", deliveryMethod !== "delivery");
  document.getElementById("sumShipping").textContent = shippingFee.toLocaleString("vi-VN") + "đ";
  document.getElementById("sumDiscountRow").classList.toggle("d-none", discount <= 0);
  document.getElementById("sumDiscount").textContent = "-" + discount.toLocaleString("vi-VN") + "đ";
  cartTotalEl.textContent = total.toLocaleString("vi-VN") + "đ";
}

/* ---------- LỊCH SỬ ĐƠN HÀNG ---------- */
function renderOrderHistory() {
  const orders = OrderService.getAllOrders();
  orderHistoryEl.innerHTML = "";
  orderHistoryEmptyEl.classList.toggle("d-none", orders.length > 0);
  orderCountBadge.textContent = `${orders.length} đơn`;

  orders.forEach((o) => {
    const date = new Date(o.createdAt).toLocaleString("vi-VN");
    const itemsText = o.items.map((i) => `${i.name} x${i.qty}`).join(", ");
    const div = document.createElement("div");
    div.className = "order-history-item";
    div.innerHTML = `
      <div class="d-flex justify-content-between">
        <span class="fw-bold">Đơn #${o.id} - ${o.customerName}</span>
        <span class="fw-bold" style="color:var(--brand)">${o.total.toLocaleString("vi-VN")}đ</span>
      </div>
      <div class="text-muted small">${itemsText}</div>
      <div class="text-muted small d-flex justify-content-between align-items-center flex-wrap gap-2">
        <span>${date} · <i class="fa-solid ${o.paymentMethod === "QR Code" ? "fa-qrcode" : "fa-money-bill-wave"} me-1"></i>${o.paymentMethod || "Tiền mặt"}</span>
        <div class="d-flex gap-2">
          <a href="tracking.html?order=${o.id}" class="btn btn-sm btn-outline-brand btn-pill">Theo dõi</a>
          <button class="btn btn-sm btn-brand btn-pill btn-reorder" data-id="${o.id}"><i class="fa-solid fa-rotate-right me-1"></i>Đặt lại</button>
        </div>
      </div>`;
    orderHistoryEl.appendChild(div);
  });

  document.querySelectorAll(".btn-reorder").forEach((btn) =>
    btn.addEventListener("click", () => {
      OrderService.reorder(Number(btn.dataset.id));
      renderCart();
      if (typeof CartWidget !== "undefined") CartWidget.refresh();
      showToast("Đã thêm các món của đơn cũ vào giỏ hàng hiện tại.", "success");
    })
  );
}

/* ---------- SỰ KIỆN ---------- */
pickSearch.addEventListener("input", renderPickList);

document.getElementById("btnClearCart").addEventListener("click", () => {
  if (OrderService.getCart().length === 0) return;
  Swal.fire({
    title: "Hủy đơn hàng hiện tại?",
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "Hủy đơn",
    cancelButtonText: "Đóng",
    confirmButtonColor: "#B4432B",
  }).then((res) => {
    if (res.isConfirmed) {
      OrderService.clearCart();
      renderCart();
      if (typeof CartWidget !== "undefined") CartWidget.refresh();
      showToast("Đã hủy đơn hàng.", "danger");
    }
  });
});

document.getElementById("btnCheckout").addEventListener("click", () => {
  const cart = OrderService.getCart();
  if (cart.length === 0) {
    showToast("Vui lòng chọn ít nhất 1 món trước khi thanh toán.", "danger");
    return;
  }

  let address = "";
  if (deliveryMethod === "delivery") {
    if (!addressSelect.classList.contains("d-none") && addressSelect.value !== "__manual") {
      const found = AddressService.getAddresses().find((a) => a.id === addressSelect.value);
      address = found ? `${found.label} - ${found.detail}` : "";
    } else {
      address = addressManual.value.trim();
    }
    if (!address) {
      showToast("Vui lòng chọn hoặc nhập địa chỉ giao hàng.", "danger");
      return;
    }
  }

  const name = document.getElementById("customerName").value.trim() || "Khách lẻ";
  const subtotal = OrderService.getCartTotal();
  const shippingFee = deliveryMethod === "delivery" ? OrderService.SHIPPING_FEE : 0;
  const discount = appliedPromo ? Math.min(appliedPromo.discount, subtotal + shippingFee) : 0;
  const total = Math.max(0, subtotal + shippingFee - discount);

  const qrPayload = encodeURIComponent(`CAFEVIET|KH:${name}|SO_TIEN:${total}|ND:Thanh toan don hang Cafe Viet`);
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${qrPayload}`;

  Swal.fire({
    title: "Chọn phương thức thanh toán",
    width: 480,
    html: `
      <div class="d-flex justify-content-between fs-5 fw-bold mb-3">
        <span>Tổng tiền</span><span style="color:#5C3A21">${total.toLocaleString("vi-VN")}đ</span>
      </div>
      <div class="d-flex flex-wrap gap-2 mb-3">
        <div class="pay-method-option active" id="payCashOpt"><i class="fa-solid fa-money-bill-wave me-2"></i>COD</div>
        <div class="pay-method-option" id="payQrOpt"><i class="fa-solid fa-qrcode me-2"></i>VietQR</div>
        <div class="pay-method-option" id="payMomoOpt"><i class="fa-solid fa-wallet me-2"></i>MoMo</div>
        <div class="pay-method-option" id="payZaloOpt"><i class="fa-solid fa-wallet me-2"></i>ZaloPay</div>
      </div>
      <div id="qrBoxWrap" class="d-none">
        <div class="qr-box">
          <img src="${qrUrl}" alt="Mã QR thanh toán">
          <div class="text-muted small mt-2" id="qrCaption">Quét mã bằng ứng dụng ngân hàng để thanh toán ${total.toLocaleString("vi-VN")}đ</div>
        </div>
      </div>
    `,
    showCancelButton: true,
    confirmButtonText: "Xác nhận thanh toán",
    cancelButtonText: "Hủy",
    confirmButtonColor: "#5C3A21",
    didOpen: () => {
      const opts = {
        cash: document.getElementById("payCashOpt"),
        qr: document.getElementById("payQrOpt"),
        momo: document.getElementById("payMomoOpt"),
        zalo: document.getElementById("payZaloOpt"),
      };
      const qrWrap = document.getElementById("qrBoxWrap");
      const qrCaption = document.getElementById("qrCaption");
      const captions = {
        qr: `Quét mã VietQR bằng ứng dụng ngân hàng để thanh toán ${total.toLocaleString("vi-VN")}đ`,
        momo: `Quét mã bằng ví MoMo để thanh toán ${total.toLocaleString("vi-VN")}đ`,
        zalo: `Quét mã bằng ví ZaloPay để thanh toán ${total.toLocaleString("vi-VN")}đ`,
      };
      Object.entries(opts).forEach(([key, el]) => {
        el.addEventListener("click", () => {
          Object.values(opts).forEach((o) => o.classList.remove("active"));
          el.classList.add("active");
          if (key === "cash") {
            qrWrap.classList.add("d-none");
          } else {
            qrWrap.classList.remove("d-none");
            qrCaption.textContent = captions[key];
          }
        });
      });
    },
    preConfirm: () => {
      const active = document.querySelector(".pay-method-option.active");
      return active ? active.id : "payCashOpt";
    },
  }).then((res) => {
    if (res.isConfirmed) {
      const methodMap = { payCashOpt: "COD (Tiền mặt)", payQrOpt: "VietQR", payMomoOpt: "MoMo", payZaloOpt: "ZaloPay" };
      const method = methodMap[res.value] || "COD (Tiền mặt)";

      const order = OrderService.checkout({
        customerName: name,
        deliveryMethod,
        address,
        paymentMethod: method,
        promoCode: appliedPromo?.code || null,
        discount,
        shippingFee,
      });

      renderCart();
      renderPickList();
      renderOrderHistory();
      if (typeof CartWidget !== "undefined") CartWidget.refresh();
      document.getElementById("customerName").value = "";
      document.getElementById("promoInput").value = "";
      document.getElementById("promoMsg").textContent = "";
      appliedPromo = null;

      Swal.fire({
        title: "Thanh toán thành công!",
        text: `Đơn hàng #${order.id} đã được ghi nhận (${method}). Đang chuyển đến trang theo dõi đơn hàng...`,
        icon: "success",
        confirmButtonColor: "#5C3A21",
        timer: 1800,
        showConfirmButton: false,
      }).then(() => {
        window.location.href = `tracking.html?order=${order.id}`;
      });
    }
  });
});

/* ---------- CLEAR ALL / EXPORT / IMPORT JSON ---------- */
const btnClearAllOrders = document.getElementById("btnClearAllOrders");
const btnExportOrdersJson = document.getElementById("btnExportOrdersJson");
const btnImportOrdersJson = document.getElementById("btnImportOrdersJson");
const inputImportOrdersJson = document.getElementById("inputImportOrdersJson");

if (btnClearAllOrders) {
  btnClearAllOrders.addEventListener("click", () => {
    if (OrderService.getAllOrders().length === 0) {
      showToast("Không có đơn hàng nào để xóa.", "danger");
      return;
    }
    Swal.fire({
      title: "Xóa toàn bộ đơn hàng?",
      text: "Toàn bộ lịch sử đơn hàng đã lưu trong trình duyệt sẽ bị xóa vĩnh viễn. Hành động này không thể hoàn tác.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Xóa hết",
      cancelButtonText: "Hủy",
      confirmButtonColor: "#B4432B",
      cancelButtonColor: "#8B5E3C",
    }).then((result) => {
      if (result.isConfirmed) {
        OrderService.clearAllOrders();
        renderOrderHistory();
        showToast("Đã xóa toàn bộ đơn hàng.", "success");
      }
    });
  });
}

if (btnExportOrdersJson) {
  btnExportOrdersJson.addEventListener("click", () => {
    if (OrderService.getAllOrders().length === 0) {
      showToast("Không có đơn hàng nào để xuất.", "danger");
      return;
    }
    const count = OrderService.exportOrdersToJson();
    showToast(`Đã xuất ${count} đơn hàng ra file JSON.`, "success");
  });
}

if (btnImportOrdersJson && inputImportOrdersJson) {
  btnImportOrdersJson.addEventListener("click", () => inputImportOrdersJson.click());

  inputImportOrdersJson.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const finishImport = (mode) => {
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const count = OrderService.importOrdersFromJson(reader.result, mode);
          renderOrderHistory();
          showToast(`Đã nhập ${count} đơn hàng từ file JSON.`, "success");
        } catch (err) {
          Swal.fire("Lỗi", err.message || "Không thể đọc file JSON.", "error");
        } finally {
          inputImportOrdersJson.value = "";
        }
      };
      reader.onerror = () => {
        Swal.fire("Lỗi", "Không thể đọc file đã chọn.", "error");
        inputImportOrdersJson.value = "";
      };
      reader.readAsText(file);
    };

    if (OrderService.getAllOrders().length > 0) {
      Swal.fire({
        title: "Nhập dữ liệu đơn hàng",
        text: "Bạn muốn ghi đè toàn bộ đơn hàng hiện có hay gộp thêm vào?",
        icon: "question",
        showCancelButton: true,
        showDenyButton: true,
        confirmButtonText: "Ghi đè",
        denyButtonText: "Gộp thêm",
        cancelButtonText: "Hủy",
        confirmButtonColor: "#B4432B",
        denyButtonColor: "#8B5E3C",
      }).then((result) => {
        if (result.isConfirmed) finishImport("replace");
        else if (result.isDenied) finishImport("merge");
        else inputImportOrdersJson.value = "";
      });
    } else {
      finishImport("replace");
    }
  });
}

/* ---------- INIT ---------- */
const orderParams = new URLSearchParams(location.search);
const preselect = orderParams.get("q");
if (preselect) {
  pickSearch.value = preselect;
  setTimeout(() => pickListEl.scrollIntoView({ behavior: "smooth", block: "start" }), 200);
}
renderPickList();
renderCart();
renderOrderHistory();
