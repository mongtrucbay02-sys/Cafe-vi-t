/* ============================================================
   auth.js - Đăng nhập / Đăng ký, phân quyền Admin & Khách hàng
   Lưu session + danh sách user trong LocalStorage
   Tài khoản demo: admin / 123456 (role: admin)
   Khách hàng: tự đăng ký (role: customer)
   ============================================================ */

const AUTH_KEY = "cafe_auth_session";
const USERS_KEY = "cafe_users";

const DEFAULT_ADMIN = {
  username: "admin",
  password: "123456",
  fullname: "Quản trị viên",
  role: "admin",
};

const AuthService = {
  /** Khởi tạo danh sách user (chạy 1 lần, đảm bảo luôn có tài khoản admin) */
  _initUsers() {
    let users = JSON.parse(localStorage.getItem(USERS_KEY) || "[]");
    if (!users.some((u) => u.username === DEFAULT_ADMIN.username)) {
      users.push(DEFAULT_ADMIN);
      localStorage.setItem(USERS_KEY, JSON.stringify(users));
    }
    return users;
  },

  getUsers() {
    return this._initUsers();
  },

  /** Đăng ký tài khoản khách hàng mới */
  register(username, password, fullname, phone, email) {
    username = username.trim();
    fullname = fullname.trim();
    phone = (phone || "").trim();
    email = (email || "").trim();
    const users = this.getUsers();

    if (!username || !password || !fullname) {
      return { ok: false, message: "Vui lòng nhập đầy đủ thông tin." };
    }
    if (password.length < 6) {
      return { ok: false, message: "Mật khẩu phải có tối thiểu 6 ký tự." };
    }
    if (users.some((u) => u.username.toLowerCase() === username.toLowerCase())) {
      return { ok: false, message: "Tên đăng nhập đã tồn tại, vui lòng chọn tên khác." };
    }

    users.push({ username, password, fullname, phone, email, role: "customer" });
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
    return { ok: true, message: "Đăng ký thành công! Vui lòng đăng nhập." };
  },

  /** Cập nhật thông tin cá nhân của tài khoản đang đăng nhập */
  updateProfile(username, { fullname, phone, email }) {
    const users = this.getUsers();
    const user = users.find((u) => u.username === username);
    if (!user) return false;
    if (fullname !== undefined) user.fullname = fullname.trim();
    if (phone !== undefined) user.phone = phone.trim();
    if (email !== undefined) user.email = email.trim();
    localStorage.setItem(USERS_KEY, JSON.stringify(users));

    // Đồng bộ lại session nếu đang đăng nhập chính tài khoản này
    const session = this.getSession();
    if (session && session.username === username) {
      session.fullname = user.fullname;
      session.phone = user.phone;
      session.email = user.email;
      localStorage.setItem(AUTH_KEY, JSON.stringify(session));
    }
    return user;
  },

  login(username, password) {
    const users = this.getUsers();
    const found = users.find(
      (u) => u.username === username && u.password === password
    );
    if (!found) return false;

    const session = {
      username: found.username,
      fullname: found.fullname,
      phone: found.phone || "",
      email: found.email || "",
      role: found.role,
      loginAt: new Date().toISOString(),
    };
    localStorage.setItem(AUTH_KEY, JSON.stringify(session));
    return true;
  },

  logout() {
    localStorage.removeItem(AUTH_KEY);
    window.location.href = "login.html";
  },

  getSession() {
    const raw = localStorage.getItem(AUTH_KEY);
    return raw ? JSON.parse(raw) : null;
  },

  isLoggedIn() {
    return !!AuthService.getSession();
  },

  /**
   * Bảo vệ trang: bắt buộc đăng nhập, tùy chọn giới hạn theo vai trò.
   * @param {string[]} roles - danh sách role được phép vào trang (bỏ trống = mọi role đã đăng nhập)
   */
  guard(roles) {
    const session = AuthService.getSession();
    if (!session) {
      window.location.href = "login.html";
      return;
    }
    if (roles && roles.length && !roles.includes(session.role)) {
      window.location.href = "order.html"; // khách hàng cố vào trang admin -> đưa về trang đặt hàng
    }
  },
};
