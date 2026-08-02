/* ============================================================
   orderService.js - Xử lý Giỏ hàng & Đơn hàng với LocalStorage
   Hỗ trợ: tùy biến món (size/đường/đá/topping), giao hàng/tự lấy,
   phương thức thanh toán, mã khuyến mãi, tích điểm, đặt lại đơn.
   ============================================================ */

const CART_KEY = "cafe_cart";
const ORDERS_KEY = "cafe_orders";

/* Danh sách topping/tùy chọn dùng chung cho Modal chọn món */
const OPTION_CONFIG = {
  sizes: [
    { value: "M", label: "Size M", extra: 0 },
    { value: "L", label: "Size L", extra: 5000 },
  ],
  sugarLevels: ["0%", "30%", "50%", "70%", "100%"],
  iceLevels: ["0%", "30%", "50%", "70%", "100%"],
  toppings: [
    { value: "tran_chau", label: "Trân châu đen", extra: 5000 },
    { value: "thach", label: "Thạch trái cây", extra: 5000 },
    { value: "pudding", label: "Pudding trứng", extra: 7000 },
    { value: "kem_cheese", label: "Kem cheese", extra: 10000 },
  ],
};

/* Phí giao hàng cố định cho demo */
const SHIPPING_FEE = 15000;

const OrderService = {
  OPTION_CONFIG,
  SHIPPING_FEE,

  /* ---------- GIỎ HÀNG (localStorage.persist) ---------- */
  getCart() {
    const data = localStorage.getItem(CART_KEY);
    return data ? JSON.parse(data) : [];
  },

  saveCart(cart) {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
  },

  _sameOptions(a, b) {
    if (!a && !b) return true;
    if (!a || !b) return false;
    const topA = [...(a.toppings || [])].sort().join(",");
    const topB = [...(b.toppings || [])].sort().join(",");
    return a.size === b.size && a.sugar === b.sugar && a.ice === b.ice && topA === topB && (a.note || "") === (b.note || "");
  },

  /** Tính đơn giá 1 món dựa trên option đã chọn */
  computeUnitPrice(product, options) {
    let price = Number(product.price) || 0;
    const sizeCfg = OPTION_CONFIG.sizes.find((s) => s.value === (options?.size || "M"));
    if (sizeCfg) price += sizeCfg.extra;
    (options?.toppings || []).forEach((tKey) => {
      const t = OPTION_CONFIG.toppings.find((x) => x.value === tKey);
      if (t) price += t.extra;
    });
    return price;
  },

  /** Thêm món vào giỏ kèm theo tùy chọn (size/đường/đá/topping) */
  addToCartWithOptions(product, options, qty = 1) {
    const cart = OrderService.getCart();
    const unitPrice = OrderService.computeUnitPrice(product, options);
    const existing = cart.find((i) => i.productId === product.id && OrderService._sameOptions(i.options, options));
    if (existing) {
      existing.qty += qty;
    } else {
      cart.push({
        cartItemId: "ci" + Date.now() + Math.floor(Math.random() * 1000),
        productId: product.id,
        name: product.name,
        image: product.image,
        price: Number(product.price) || 0,
        unitPrice,
        options: options || null,
        qty,
      });
    }
    OrderService.saveCart(cart);
    return cart;
  },

  /** Thêm nhanh không tùy chọn (giữ tương thích ngược) */
  addToCart(product, qty = 1) {
    return OrderService.addToCartWithOptions(product, { size: "M", sugar: "100%", ice: "100%", toppings: [] }, qty);
  },

  updateQtyByCartId(cartItemId, qty) {
    const cart = OrderService.getCart();
    const item = cart.find((i) => i.cartItemId === cartItemId);
    if (!item) return;
    item.qty = Math.max(1, qty);
    OrderService.saveCart(cart);
  },

  // Giữ tương thích với code cũ (cập nhật theo productId, món đầu tiên khớp)
  updateQty(productId, qty) {
    const cart = OrderService.getCart();
    const item = cart.find((i) => i.productId === Number(productId));
    if (!item) return;
    item.qty = Math.max(1, qty);
    OrderService.saveCart(cart);
  },

  removeCartItem(cartItemId) {
    let cart = OrderService.getCart();
    cart = cart.filter((i) => i.cartItemId !== cartItemId);
    OrderService.saveCart(cart);
  },

  removeFromCart(productId) {
    let cart = OrderService.getCart();
    cart = cart.filter((i) => i.productId !== Number(productId));
    OrderService.saveCart(cart);
  },

  clearCart() {
    localStorage.removeItem(CART_KEY);
  },

  getCartCount() {
    return OrderService.getCart().reduce((sum, i) => sum + i.qty, 0);
  },

  getCartTotal() {
    return OrderService.getCart().reduce((sum, i) => sum + (i.unitPrice ?? i.price) * i.qty, 0);
  },

  /** Mô tả ngắn các option để hiển thị trong giỏ / lịch sử */
  describeOptions(options) {
    if (!options) return "";
    const parts = [];
    if (options.size) parts.push(`Size ${options.size}`);
    if (options.sugar) parts.push(`Đường ${options.sugar}`);
    if (options.ice) parts.push(`Đá ${options.ice}`);
    if (options.toppings && options.toppings.length) {
      const names = options.toppings.map((tk) => OPTION_CONFIG.toppings.find((t) => t.value === tk)?.label || tk);
      parts.push(names.join(", "));
    }
    return parts.join(" · ");
  },

  /* ---------- ĐƠN HÀNG ĐÃ THANH TOÁN ---------- */
  getAllOrders() {
    const data = localStorage.getItem(ORDERS_KEY);
    return data ? JSON.parse(data) : [];
  },

  saveAllOrders(list) {
    localStorage.setItem(ORDERS_KEY, JSON.stringify(list));
  },

  getOrderById(id) {
    return OrderService.getAllOrders().find((o) => o.id === Number(id));
  },

  generateOrderId() {
    const list = OrderService.getAllOrders();
    const maxId = list.reduce((max, o) => Math.max(max, o.id || 0), 0);
    return maxId + 1;
  },

  /** Các bước theo dõi đơn hàng thời gian thực */
  TRACKING_STAGES: [
    { key: "confirm", label: "Đang chờ quán xác nhận", icon: "fa-hourglass-half" },
    { key: "brewing", label: "Quán đang pha chế", icon: "fa-mug-hot" },
    { key: "shipping", label: "Tài xế đang giao", icon: "fa-motorcycle" },
    { key: "done", label: "Đã giao hàng", icon: "fa-circle-check" },
  ],

  /**
   * Thanh toán: chốt đơn hàng, trừ tồn kho, cộng số lượng đã bán, cộng điểm tích lũy.
   * payload: { customerName, phone, deliveryMethod, address, paymentMethod, promoCode, discount, shippingFee }
   */
  checkout(payload) {
    const cart = OrderService.getCart();
    if (cart.length === 0) return null;

    const subtotal = OrderService.getCartTotal();
    const shippingFee = payload.deliveryMethod === "delivery" ? (payload.shippingFee ?? SHIPPING_FEE) : 0;
    const discount = payload.discount || 0;
    const total = Math.max(0, subtotal + shippingFee - discount);

    const order = {
      id: OrderService.generateOrderId(),
      customerName: payload.customerName || "Khách lẻ",
      phone: payload.phone || "",
      items: cart,
      subtotal,
      shippingFee,
      discount,
      promoCode: payload.promoCode || null,
      total,
      deliveryMethod: payload.deliveryMethod || "pickup",
      address: payload.deliveryMethod === "delivery" ? payload.address || "" : "",
      paymentMethod: payload.paymentMethod || "Tiền mặt",
      createdAt: new Date().toISOString(),
      status: OrderService.TRACKING_STAGES[0].label,
      trackingStageIndex: 0,
      username: (typeof AuthService !== "undefined" && AuthService.getSession()?.username) || null,
    };

    const orders = OrderService.getAllOrders();
    orders.unshift(order);
    OrderService.saveAllOrders(orders);

    // Cập nhật tồn kho & số lượng đã bán trong menu
    cart.forEach((item) => {
      const product = MenuService.getById(item.productId);
      if (!product) return;
      const newStock = Math.max(0, (product.stock || 0) - item.qty);
      MenuService.update(product.id, {
        stock: newStock,
        sold: (product.sold || 0) + item.qty,
        status: newStock === 0 ? "Hết hàng" : "Còn hàng",
      });
    });

    // Tích điểm thành viên: 1.000đ = 1 điểm
    if (order.username && typeof LoyaltyService !== "undefined") {
      LoyaltyService.addPoints(order.username, Math.floor(total / 1000));
    }

    OrderService.clearCart();
    return order;
  },

  /** Đặt lại đơn nhanh: thêm toàn bộ món của 1 đơn cũ vào giỏ hàng hiện tại */
  reorder(orderId) {
    const order = OrderService.getOrderById(orderId);
    if (!order) return false;
    const cart = OrderService.getCart();
    order.items.forEach((item) => {
      const existing = cart.find((i) => i.productId === item.productId && OrderService._sameOptions(i.options, item.options));
      if (existing) {
        existing.qty += item.qty;
      } else {
        cart.push({
          cartItemId: "ci" + Date.now() + Math.floor(Math.random() * 1000) + item.productId,
          productId: item.productId,
          name: item.name,
          image: item.image,
          price: item.price,
          unitPrice: item.unitPrice ?? item.price,
          options: item.options || null,
          qty: item.qty,
        });
      }
    });
    OrderService.saveCart(cart);
    return true;
  },

  removeOrder(id) {
    let orders = OrderService.getAllOrders();
    orders = orders.filter((o) => o.id !== Number(id));
    OrderService.saveAllOrders(orders);
  },

  getOrderStats() {
    const orders = OrderService.getAllOrders();
    const totalOrders = orders.length;
    const totalRevenue = orders.reduce((s, o) => s + o.total, 0);
    return { totalOrders, totalRevenue };
  },
};
