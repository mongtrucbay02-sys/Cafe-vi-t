/* ============================================================
   app.js - Các hàm dùng chung cho toàn bộ trang
   (Dark mode, cập nhật navbar theo trạng thái đăng nhập)
   ============================================================ */

const THEME_KEY = "cafe_theme";

function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  const icon = document.getElementById("themeIcon");
  if (icon) {
    icon.className = theme === "dark" ? "fa-solid fa-sun" : "fa-solid fa-moon";
  }
  localStorage.setItem(THEME_KEY, theme);
}

function initTheme() {
  const saved = localStorage.getItem(THEME_KEY) || "light";
  applyTheme(saved);
  const btn = document.getElementById("themeToggleBtn");
  if (btn) {
    btn.addEventListener("click", () => {
      const current = document.documentElement.getAttribute("data-theme");
      applyTheme(current === "dark" ? "light" : "dark");
    });
  }
}

function initNavbarAuth() {
  const session = typeof AuthService !== "undefined" ? AuthService.getSession() : null;
  const userBox = document.getElementById("navUserBox");
  if (!userBox) return;

  if (session) {
    // Chỉ hiển thị badge vai trò cho Admin, tài khoản khách hàng không hiện chữ "Khách hàng" màu xanh nữa
    const roleBadge = session.role === "admin"
      ? `<span class="badge text-bg-danger ms-1">Quản trị viên</span>`
      : "";
    userBox.innerHTML = `
      <div class="dropdown">
        <button class="btn btn-outline-brand btn-pill dropdown-toggle d-flex align-items-center gap-2" data-bs-toggle="dropdown">
          <i class="fa-solid fa-circle-user"></i> ${session.fullname}
          ${roleBadge}
        </button>
        <ul class="dropdown-menu dropdown-menu-end">
          <li><a class="dropdown-item" href="profile.html" id="navProfileLink"><i class="fa-solid fa-address-card me-2"></i>Hồ sơ</a></li>
          <li><a class="dropdown-item" href="#" id="logoutBtn"><i class="fa-solid fa-right-from-bracket me-2"></i>Đăng xuất</a></li>
        </ul>
      </div>`;
    document.getElementById("logoutBtn").addEventListener("click", (e) => {
      e.preventDefault();
      AuthService.logout();
    });
  } else {
    userBox.innerHTML = `<a href="login.html" class="btn btn-brand btn-pill"><i class="fa-solid fa-right-to-bracket me-2"></i>Đăng nhập</a>`;
  }

  restrictNavByRole(session);
}

/** Ẩn các mục menu Admin-only (Menu, Thống kê) khỏi khách hàng / khách chưa đăng nhập */
function restrictNavByRole(session) {
  const adminOnlyHrefs = ["menu.html", "dashboard.html"];
  document.querySelectorAll(".navbar-cafe .nav-link").forEach((link) => {
    const href = link.getAttribute("href");
    if (adminOnlyHrefs.includes(href)) {
      const isAdmin = session && session.role === "admin";
      link.closest(".nav-item").classList.toggle("d-none", !isAdmin);
    }
  });
}

function setActiveNavLink() {
  const page = window.location.pathname.split("/").pop() || "index.html";
  document.querySelectorAll(".navbar-cafe .nav-link").forEach((link) => {
    if (link.getAttribute("href") === page) link.classList.add("active");
  });
}

function showToast(message, type = "success") {
  const container = document.getElementById("toastContainer");
  if (!container) return;
  const icon = type === "success" ? "fa-circle-check" : type === "danger" ? "fa-circle-xmark" : "fa-circle-info";
  const bg = type === "success" ? "text-bg-success" : type === "danger" ? "text-bg-danger" : "text-bg-warning";
  const id = "t" + Date.now();
  const html = `
    <div id="${id}" class="toast toast-cafe align-items-center ${bg} border-0" role="alert">
      <div class="d-flex">
        <div class="toast-body"><i class="fa-solid ${icon} me-2"></i>${message}</div>
        <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
      </div>
    </div>`;
  container.insertAdjacentHTML("beforeend", html);
  const toastEl = document.getElementById(id);
  const toast = new bootstrap.Toast(toastEl, { delay: 2800 });
  toast.show();
  toastEl.addEventListener("hidden.bs.toast", () => toastEl.remove());
}

document.addEventListener("DOMContentLoaded", () => {
  initTheme();
  initNavbarAuth();
  setActiveNavLink();
});
