/* ============================================================
   cartWidget.js - Sidebar Giỏ hàng trượt ra từ cạnh phải (Offcanvas)
   Gắn icon giỏ hàng lên Navbar + badge số lượng, dùng chung mọi trang.
   ============================================================ */

const CartWidget = {
  init() {
    if (typeof OrderService === "undefined") return;
    CartWidget._injectNavIcon();
    CartWidget._injectOffcanvas();
    CartWidget.refreshBadge();
    CartWidget.render();
  },

  _injectNavIcon() {
    const themeBtn = document.getElementById("themeToggleBtn");
    if (!themeBtn || document.getElementById("cartNavBtn")) return;
    const navBox = themeBtn.parentElement;
    const wrap = document.createElement("button");
    wrap.id = "cartNavBtn";
    wrap.className = "theme-toggle-btn position-relative me-1";
    wrap.setAttribute("data-bs-toggle", "offcanvas");
    wrap.setAttribute("data-bs-target", "#cartOffcanvas");
    wrap.title = "Giỏ hàng";
    wrap.innerHTML = `<i class="fa-solid fa-cart-shopping"></i>
      <span id="cartBadge" class="badge rounded-pill bg-danger position-absolute" style="top:-2px; right:-2px; font-size:.65rem; display:none;">0</span>`;
    // Giỏ hàng chiếm vị trí cũ của nút darkmode (đầu tiên trong nhóm), darkmode nay nằm cạnh khối tài khoản
    navBox.insertBefore(wrap, navBox.firstChild);
  },

  _injectOffcanvas() {
    if (document.getElementById("cartOffcanvas")) return;
    const html = `
    <div class="offcanvas offcanvas-end" tabindex="-1" id="cartOffcanvas">
      <div class="offcanvas-header">
        <h5 class="offcanvas-title"><i class="fa-solid fa-cart-shopping me-2"></i>Giỏ hàng của bạn</h5>
        <button type="button" class="btn-close" data-bs-dismiss="offcanvas"></button>
      </div>
      <div class="offcanvas-body d-flex flex-column">
        <div id="cwList" class="flex-grow-1" style="overflow-y:auto;"></div>
        <div id="cwEmpty" class="text-muted text-center py-5 d-none">
          <i class="fa-solid fa-basket-shopping fa-2x mb-2"></i>
          <p class="mb-0">Giỏ hàng đang trống.</p>
        </div>
        <hr>
        <div class="d-flex justify-content-between fw-bold fs-5 mb-3">
          <span>Tạm tính</span><span id="cwTotal" style="color:var(--brand)">0đ</span>
        </div>
        <a href="order.html" class="btn btn-brand btn-pill w-100"><i class="fa-solid fa-bag-shopping me-2"></i>Xem giỏ hàng & Đặt hàng</a>
      </div>
    </div>`;
    document.body.insertAdjacentHTML("beforeend", html);
  },

  refreshBadge() {
    const badge = document.getElementById("cartBadge");
    if (!badge) return;
    const count = OrderService.getCartCount();
    badge.textContent = count > 99 ? "99+" : count;
    badge.style.display = count > 0 ? "inline-block" : "none";
  },

  render() {
    const listEl = document.getElementById("cwList");
    const emptyEl = document.getElementById("cwEmpty");
    const totalEl = document.getElementById("cwTotal");
    if (!listEl) return;

    const cart = OrderService.getCart();
    listEl.innerHTML = "";
    emptyEl.classList.toggle("d-none", cart.length > 0);

    cart.forEach((item) => {
      const desc = OrderService.describeOptions(item.options);
      const row = document.createElement("div");
      row.className = "cart-item";
      row.innerHTML = `
        <img src="${item.image || (typeof MenuService !== "undefined" ? MenuService.DEFAULT_IMAGE : "")}" class="cart-thumb" alt="${item.name}">
        <div class="flex-grow-1">
          <div class="fw-bold small">${item.name}</div>
          ${desc ? `<div class="text-muted" style="font-size:.75rem;">${desc}</div>` : ""}
          <div class="d-flex align-items-center gap-2 mt-1">
            <button class="btn btn-sm btn-outline-secondary btn-pill cw-dec" data-id="${item.cartItemId}" style="width:26px;height:26px;padding:0;">-</button>
            <span class="fw-bold">${item.qty}</span>
            <button class="btn btn-sm btn-outline-secondary btn-pill cw-inc" data-id="${item.cartItemId}" style="width:26px;height:26px;padding:0;">+</button>
            <span class="ms-auto fw-bold" style="color:var(--brand)">${((item.unitPrice ?? item.price) * item.qty).toLocaleString("vi-VN")}đ</span>
          </div>
        </div>
        <button class="btn btn-sm btn-link text-danger cw-remove" data-id="${item.cartItemId}"><i class="fa-solid fa-trash"></i></button>`;
      listEl.appendChild(row);
    });

    totalEl.textContent = OrderService.getCartTotal().toLocaleString("vi-VN") + "đ";

    listEl.querySelectorAll(".cw-inc").forEach((b) =>
      b.addEventListener("click", () => {
        const item = OrderService.getCart().find((i) => i.cartItemId === b.dataset.id);
        if (item) OrderService.updateQtyByCartId(b.dataset.id, item.qty + 1);
        CartWidget.render();
        CartWidget.refreshBadge();
        if (typeof renderCart === "function") renderCart();
      })
    );
    listEl.querySelectorAll(".cw-dec").forEach((b) =>
      b.addEventListener("click", () => {
        const item = OrderService.getCart().find((i) => i.cartItemId === b.dataset.id);
        if (!item) return;
        if (item.qty <= 1) {
          OrderService.removeCartItem(b.dataset.id);
        } else {
          OrderService.updateQtyByCartId(b.dataset.id, item.qty - 1);
        }
        CartWidget.render();
        CartWidget.refreshBadge();
        if (typeof renderCart === "function") renderCart();
      })
    );
    listEl.querySelectorAll(".cw-remove").forEach((b) =>
      b.addEventListener("click", () => {
        OrderService.removeCartItem(b.dataset.id);
        CartWidget.render();
        CartWidget.refreshBadge();
        if (typeof renderCart === "function") renderCart();
      })
    );
  },

  refresh() {
    CartWidget.render();
    CartWidget.refreshBadge();
  },
};

document.addEventListener("DOMContentLoaded", () => CartWidget.init());
