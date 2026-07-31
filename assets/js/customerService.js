/* ============================================================
   customerService.js
   Sổ địa chỉ nhận hàng + Hạng thành viên/Ví điểm + Mã khuyến mãi
   ============================================================ */

const ADDRESS_KEY = "cafe_addresses";
const LOYALTY_KEY = "cafe_loyalty";

/* ---------- SỔ ĐỊA CHỈ (theo từng tài khoản) ---------- */
const AddressService = {
  _all() {
    const data = localStorage.getItem(ADDRESS_KEY);
    return data ? JSON.parse(data) : {};
  },
  _saveAll(map) {
    localStorage.setItem(ADDRESS_KEY, JSON.stringify(map));
  },
  _username() {
    return (typeof AuthService !== "undefined" && AuthService.getSession()?.username) || null;
  },

  getAddresses() {
    const username = AddressService._username();
    if (!username) return [];
    const map = AddressService._all();
    return map[username] || [];
  },

  getDefault() {
    const list = AddressService.getAddresses();
    return list.find((a) => a.isDefault) || list[0] || null;
  },

  add({ label, detail }) {
    const username = AddressService._username();
    if (!username) return false;
    const map = AddressService._all();
    const list = map[username] || [];
    const item = {
      id: "addr" + Date.now(),
      label: label || "Nhà riêng",
      detail: detail.trim(),
      isDefault: list.length === 0,
    };
    list.push(item);
    map[username] = list;
    AddressService._saveAll(map);
    return item;
  },

  update(id, { label, detail }) {
    const username = AddressService._username();
    if (!username) return false;
    const map = AddressService._all();
    const list = map[username] || [];
    const item = list.find((a) => a.id === id);
    if (!item) return false;
    item.label = label;
    item.detail = detail;
    map[username] = list;
    AddressService._saveAll(map);
    return true;
  },

  remove(id) {
    const username = AddressService._username();
    if (!username) return false;
    const map = AddressService._all();
    let list = map[username] || [];
    list = list.filter((a) => a.id !== id);
    if (list.length && !list.some((a) => a.isDefault)) list[0].isDefault = true;
    map[username] = list;
    AddressService._saveAll(map);
    return true;
  },

  setDefault(id) {
    const username = AddressService._username();
    if (!username) return false;
    const map = AddressService._all();
    const list = map[username] || [];
    list.forEach((a) => (a.isDefault = a.id === id));
    map[username] = list;
    AddressService._saveAll(map);
    return true;
  },
};

/* ---------- HẠNG THÀNH VIÊN & VÍ ĐIỂM ---------- */
const LoyaltyService = {
  TIERS: [
    { name: "Thành viên Đồng", min: 0, icon: "fa-medal", color: "#B08D57" },
    { name: "Thành viên Bạc", min: 200, icon: "fa-medal", color: "#9AA3AC" },
    { name: "Thành viên Vàng", min: 500, icon: "fa-crown", color: "#D4AF37" },
    { name: "Thành viên Kim Cương", min: 1000, icon: "fa-gem", color: "#5AC8FA" },
  ],

  _all() {
    const data = localStorage.getItem(LOYALTY_KEY);
    return data ? JSON.parse(data) : {};
  },
  _saveAll(map) {
    localStorage.setItem(LOYALTY_KEY, JSON.stringify(map));
  },

  getPoints(username) {
    if (!username) return 0;
    const map = LoyaltyService._all();
    return map[username] || 0;
  },

  addPoints(username, pts) {
    if (!username || pts <= 0) return;
    const map = LoyaltyService._all();
    map[username] = (map[username] || 0) + pts;
    LoyaltyService._saveAll(map);
  },

  redeemPoints(username, pts) {
    const map = LoyaltyService._all();
    const current = map[username] || 0;
    if (pts > current) return false;
    map[username] = current - pts;
    LoyaltyService._saveAll(map);
    return true;
  },

  getTier(points) {
    return [...LoyaltyService.TIERS].reverse().find((t) => points >= t.min) || LoyaltyService.TIERS[0];
  },

  getNextTier(points) {
    return LoyaltyService.TIERS.find((t) => t.min > points) || null;
  },
};

/* ---------- MÃ KHUYẾN MÃI ---------- */
const PromoService = {
  CODES: {
    FREESHIP: { type: "freeship", label: "Miễn phí vận chuyển" },
    CAFE50: { type: "fixed", amount: 50000, minSubtotal: 150000, label: "Giảm 50.000đ cho đơn từ 150.000đ" },
    CAFE10: { type: "percent", percent: 10, maxAmount: 30000, minSubtotal: 50000, label: "Giảm 10% (tối đa 30.000đ) cho đơn từ 50.000đ" },
  },

  /** Kiểm tra & tính số tiền được giảm cho 1 mã, dựa trên subtotal & phí ship hiện tại */
  validate(code, subtotal, shippingFee) {
    const key = (code || "").trim().toUpperCase();
    const promo = PromoService.CODES[key];
    if (!promo) return { valid: false, message: "Mã khuyến mãi không tồn tại." };

    if (promo.minSubtotal && subtotal < promo.minSubtotal) {
      return {
        valid: false,
        message: `Đơn hàng cần tối thiểu ${promo.minSubtotal.toLocaleString("vi-VN")}đ để dùng mã này.`,
      };
    }

    if (promo.type === "freeship") {
      if (!shippingFee) {
        return { valid: false, message: "Mã này chỉ áp dụng cho đơn giao hàng." };
      }
      return { valid: true, discount: shippingFee, message: `Đã áp dụng "${key}": ${promo.label}.` };
    }

    if (promo.type === "fixed") {
      return { valid: true, discount: promo.amount, message: `Đã áp dụng "${key}": ${promo.label}.` };
    }

    if (promo.type === "percent") {
      const discount = Math.min(Math.round((subtotal * promo.percent) / 100), promo.maxAmount || Infinity);
      return { valid: true, discount, message: `Đã áp dụng "${key}": ${promo.label}.` };
    }

    return { valid: false, message: "Mã khuyến mãi không hợp lệ." };
  },
};
