/* ============================================================
   profile.js - Trang Hồ sơ: Sổ địa chỉ, Hạng thành viên/Ví điểm,
   Lịch sử đơn hàng + Đặt lại đơn nhanh
   ============================================================ */

AuthService.guard(["admin", "customer"]);

const session = AuthService.getSession();
const addressModalEl = document.getElementById("addressModal");
const addressModal = new bootstrap.Modal(addressModalEl);

/* ---------- THÔNG TIN CÁ NHÂN (lưu từ lúc đăng ký) ---------- */
function renderProfileInfo() {
  document.getElementById("infoFullname").textContent = session.fullname || "--";
  document.getElementById("infoPhone").textContent = session.phone || "Chưa cập nhật";
  document.getElementById("infoEmail").textContent = session.email || "Chưa cập nhật";
}

function toggleProfileEdit(editing) {
  document.getElementById("profileInfoView").classList.toggle("d-none", editing);
  document.getElementById("profileInfoForm").classList.toggle("d-none", !editing);
  if (editing) {
    document.getElementById("editFullname").value = session.fullname || "";
    document.getElementById("editPhone").value = session.phone || "";
    document.getElementById("editEmail").value = session.email || "";
  }
}

document.getElementById("btnEditProfile").addEventListener("click", () => toggleProfileEdit(true));
document.getElementById("btnCancelEditProfile").addEventListener("click", () => toggleProfileEdit(false));

document.getElementById("profileInfoForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const fullname = document.getElementById("editFullname").value.trim();
  const phone = document.getElementById("editPhone").value.trim();
  const email = document.getElementById("editEmail").value.trim();

  if (!fullname) {
    showToast("Vui lòng nhập họ tên.", "danger");
    return;
  }

  AuthService.updateProfile(session.username, { fullname, phone, email });
  session.fullname = fullname;
  session.phone = phone;
  session.email = email;

  renderProfileInfo();
  toggleProfileEdit(false);
  initNavbarAuth(); // cập nhật lại tên hiển thị trên navbar
  showToast("Đã cập nhật thông tin cá nhân.", "success");
});

/* ---------- HẠNG THÀNH VIÊN ---------- */
function renderLoyalty() {
  const points = LoyaltyService.getPoints(session.username);
  const tier = LoyaltyService.getTier(points);
  const next = LoyaltyService.getNextTier(points);

  document.getElementById("tierIcon").className = "fa-solid " + tier.icon;
  document.getElementById("tierIcon").style.color = tier.color;
  document.getElementById("tierName").textContent = tier.name;
  document.getElementById("tierPoints").textContent = points.toLocaleString("vi-VN");

  if (next) {
    document.getElementById("tierNextInfo").textContent = `Còn ${(next.min - points).toLocaleString("vi-VN")} điểm để lên ${next.name}`;
    const progress = Math.min(100, Math.round((points / next.min) * 100));
    document.getElementById("tierProgressBar").style.width = progress + "%";
  } else {
    document.getElementById("tierNextInfo").textContent = "Bạn đang ở hạng thành viên cao nhất!";
    document.getElementById("tierProgressBar").style.width = "100%";
  }
}

/* ---------- SỔ ĐỊA CHỈ ---------- */
function renderAddresses() {
  const list = AddressService.getAddresses();
  const listEl = document.getElementById("addressList");
  const emptyEl = document.getElementById("addressEmpty");
  listEl.innerHTML = "";
  emptyEl.classList.toggle("d-none", list.length > 0);

  list.forEach((a) => {
    const div = document.createElement("div");
    div.className = "cafe-card p-3 mb-2";
    div.innerHTML = `
      <div class="d-flex justify-content-between align-items-start">
        <div>
          <div class="fw-bold">${a.label} ${a.isDefault ? '<span class="badge-instock ms-1">Mặc định</span>' : ""}</div>
          <div class="text-muted small">${a.detail}</div>
        </div>
        <div class="dropdown">
          <button class="btn btn-sm btn-link text-muted" data-bs-toggle="dropdown"><i class="fa-solid fa-ellipsis-vertical"></i></button>
          <ul class="dropdown-menu dropdown-menu-end">
            ${!a.isDefault ? `<li><a class="dropdown-item addr-default" href="#" data-id="${a.id}">Đặt làm mặc định</a></li>` : ""}
            <li><a class="dropdown-item addr-edit" href="#" data-id="${a.id}">Chỉnh sửa</a></li>
            <li><a class="dropdown-item text-danger addr-delete" href="#" data-id="${a.id}">Xóa</a></li>
          </ul>
        </div>
      </div>`;
    listEl.appendChild(div);
  });

  listEl.querySelectorAll(".addr-default").forEach((el) =>
    el.addEventListener("click", (e) => {
      e.preventDefault();
      AddressService.setDefault(el.dataset.id);
      renderAddresses();
      showToast("Đã đặt làm địa chỉ mặc định.", "success");
    })
  );
  listEl.querySelectorAll(".addr-edit").forEach((el) =>
    el.addEventListener("click", (e) => {
      e.preventDefault();
      const addr = AddressService.getAddresses().find((a) => a.id === el.dataset.id);
      openAddressModal(addr);
    })
  );
  listEl.querySelectorAll(".addr-delete").forEach((el) =>
    el.addEventListener("click", (e) => {
      e.preventDefault();
      Swal.fire({
        title: "Xóa địa chỉ này?",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Xóa",
        cancelButtonText: "Đóng",
        confirmButtonColor: "#B4432B",
      }).then((res) => {
        if (res.isConfirmed) {
          AddressService.remove(el.dataset.id);
          renderAddresses();
          showToast("Đã xóa địa chỉ.", "danger");
        }
      });
    })
  );
}

function openAddressModal(addr) {
  document.getElementById("addressModalTitle").textContent = addr ? "Chỉnh sửa địa chỉ" : "Thêm địa chỉ";
  document.getElementById("addressId").value = addr ? addr.id : "";
  document.getElementById("addressLabel").value = addr ? addr.label : "Nhà riêng";
  document.getElementById("addressDetail").value = addr ? addr.detail : "";
  addressModal.show();
}

document.getElementById("btnAddAddress").addEventListener("click", () => openAddressModal(null));

document.getElementById("btnSaveAddress").addEventListener("click", () => {
  const id = document.getElementById("addressId").value;
  const label = document.getElementById("addressLabel").value;
  const detail = document.getElementById("addressDetail").value.trim();
  if (!detail) {
    showToast("Vui lòng nhập địa chỉ chi tiết.", "danger");
    return;
  }
  if (id) {
    AddressService.update(id, { label, detail });
    showToast("Đã cập nhật địa chỉ.", "success");
  } else {
    AddressService.add({ label, detail });
    showToast("Đã thêm địa chỉ mới.", "success");
  }
  addressModal.hide();
  renderAddresses();
});

/* ---------- LỊCH SỬ ĐƠN HÀNG ---------- */
function renderOrders() {
  const orders = OrderService.getAllOrders().filter((o) => !o.username || o.username === session.username);
  const listEl = document.getElementById("profileOrderList");
  const emptyEl = document.getElementById("profileOrderEmpty");
  listEl.innerHTML = "";
  emptyEl.classList.toggle("d-none", orders.length > 0);
  document.getElementById("profileOrderCount").textContent = `${orders.length} đơn`;

  orders.forEach((o) => {
    const date = new Date(o.createdAt).toLocaleString("vi-VN");
    const itemsText = o.items.map((i) => `${i.name} x${i.qty}`).join(", ");
    const div = document.createElement("div");
    div.className = "order-history-item";
    div.innerHTML = `
      <div class="d-flex justify-content-between">
        <span class="fw-bold">Đơn #${o.id}</span>
        <span class="fw-bold" style="color:var(--brand)">${o.total.toLocaleString("vi-VN")}đ</span>
      </div>
      <div class="text-muted small">${itemsText}</div>
      <div class="text-muted small d-flex justify-content-between align-items-center flex-wrap gap-2 mt-1">
        <span><i class="fa-solid fa-clock me-1"></i>${date} · ${o.status || "Đã đặt hàng"}</span>
        <div class="d-flex gap-2">
          <a href="tracking.html?order=${o.id}" class="btn btn-sm btn-outline-brand btn-pill">Theo dõi</a>
          <button class="btn btn-sm btn-brand btn-pill btn-reorder" data-id="${o.id}"><i class="fa-solid fa-rotate-right me-1"></i>Đặt lại đơn nhanh</button>
        </div>
      </div>`;
    listEl.appendChild(div);
  });

  listEl.querySelectorAll(".btn-reorder").forEach((btn) =>
    btn.addEventListener("click", () => {
      OrderService.reorder(Number(btn.dataset.id));
      if (typeof CartWidget !== "undefined") CartWidget.refresh();
      showToast("Đã thêm các món vào giỏ hàng. Chuyển đến trang đặt hàng...", "success");
      setTimeout(() => (window.location.href = "order.html"), 900);
    })
  );
}

renderProfileInfo();
renderLoyalty();
renderAddresses();
renderOrders();
