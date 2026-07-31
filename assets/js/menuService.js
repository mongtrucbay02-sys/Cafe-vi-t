/* ============================================================
   menuService.js
   Xử lý toàn bộ thao tác với LocalStorage cho Sản phẩm quán cà phê
   ============================================================ */

const STORAGE_KEY = "cafe_products";
const CATEGORY_LIST = ["Cà phê", "Trà", "Đá xay", "Bánh ngọt", "Đồ uống khác"];

const MenuService = {
  /** Lấy toàn bộ sản phẩm */
  getAll() {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) {
      const seed = MenuService._seedData();
      MenuService.saveAll(seed);
      return seed;
    }
    try {
      return JSON.parse(data);
    } catch (e) {
      console.error("Lỗi đọc dữ liệu:", e);
      return [];
    }
  },

  /** Lưu toàn bộ danh sách */
  saveAll(list) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  },

  /** Sinh ID tự động */
  generateId() {
    const list = MenuService.getAll();
    const maxId = list.reduce((max, p) => Math.max(max, p.id || 0), 0);
    return maxId + 1;
  },

  /** Thêm sản phẩm mới */
  create(product) {
    const list = MenuService.getAll();
    product.id = MenuService.generateId();
    product.createdAt = new Date().toISOString();
    list.push(product);
    MenuService.saveAll(list);
    return product;
  },

  /** Lấy sản phẩm theo id */
  getById(id) {
    return MenuService.getAll().find((p) => p.id === Number(id));
  },

  /** Cập nhật sản phẩm */
  update(id, updated) {
    const list = MenuService.getAll();
    const idx = list.findIndex((p) => p.id === Number(id));
    if (idx === -1) return false;
    list[idx] = { ...list[idx], ...updated, id: Number(id) };
    MenuService.saveAll(list);
    return true;
  },

  /** Xóa sản phẩm */
  remove(id) {
    let list = MenuService.getAll();
    list = list.filter((p) => p.id !== Number(id));
    MenuService.saveAll(list);
  },

  /** Toggle trạng thái còn hàng / hết hàng */
  toggleStatus(id) {
    const list = MenuService.getAll();
    const idx = list.findIndex((p) => p.id === Number(id));
    if (idx === -1) return;
    list[idx].status = list[idx].status === "Còn hàng" ? "Hết hàng" : "Còn hàng";
    MenuService.saveAll(list);
  },

  /** Xóa toàn bộ */
  clearAll() {
    localStorage.removeItem(STORAGE_KEY);
  },

  /** Thống kê nhanh */
  getStats() {
    const list = MenuService.getAll();
    const totalProducts = list.length;
    const totalSold = list.reduce((sum, p) => sum + (Number(p.sold) || 0), 0);
    const revenue = list.reduce((sum, p) => sum + (Number(p.sold) || 0) * (Number(p.price) || 0), 0);
    const outOfStock = list.filter((p) => p.status === "Hết hàng").length;
    return { totalProducts, totalSold, revenue, outOfStock };
  },

  /** Top sản phẩm bán chạy (Best Sale) */
  getBestSellers(limit = 5) {
    return [...MenuService.getAll()]
      .sort((a, b) => (b.sold || 0) - (a.sold || 0))
      .slice(0, limit);
  },

  /** Thống kê theo danh mục */
  getStatsByCategory() {
    const list = MenuService.getAll();
    const map = {};
    CATEGORY_LIST.forEach((c) => (map[c] = 0));
    list.forEach((p) => {
      map[p.category] = (map[p.category] || 0) + 1;
    });
    return map;
  },

  /** Dữ liệu mẫu ban đầu */
  _seedData() {
    return [
      { id: 1, name: "Cà phê sữa đá", category: "Cà phê", price: 29000, stock: 120, sold: 340, status: "Còn hàng", description: "Cà phê phin truyền thống pha cùng sữa đặc, đá viên mát lạnh.", image: "https://images.unsplash.com/photo-1517701604599-bb29b565090c?auto=format&fit=crop&w=600&q=80", createdAt: new Date().toISOString() },
      { id: 2, name: "Bạc xỉu", category: "Cà phê", price: 32000, stock: 80, sold: 210, status: "Còn hàng", description: "Cà phê nhiều sữa ít đắng, thích hợp cho người mới uống.", image: "https://images.unsplash.com/photo-1461023058943-07fcbe16d735?auto=format&fit=crop&w=600&q=80", createdAt: new Date().toISOString() },
      { id: 3, name: "Trà đào cam sả", category: "Trà", price: 39000, stock: 60, sold: 275, status: "Còn hàng", description: "Trà trái cây thơm mát với đào, cam và sả tươi.", image: "https://images.unsplash.com/photo-1556679343-c7306c1976bc?auto=format&fit=crop&w=600&q=80", createdAt: new Date().toISOString() },
      { id: 4, name: "Trà sen vàng", category: "Trà", price: 35000, stock: 0, sold: 95, status: "Hết hàng", description: "Trà ô long ướp hương sen thanh mát.", image: "https://images.unsplash.com/photo-1597481499750-3e6b22637e12?auto=format&fit=crop&w=600&q=80", createdAt: new Date().toISOString() },
      { id: 5, name: "Cà phê đá xay caramel", category: "Đá xay", price: 45000, stock: 40, sold: 150, status: "Còn hàng", description: "Đá xay caramel béo ngậy phủ kem tươi.", image: "https://images.unsplash.com/photo-1499636136210-6f4ee915583e?auto=format&fit=crop&w=600&q=80", createdAt: new Date().toISOString() },
      { id: 6, name: "Matcha đá xay", category: "Đá xay", price: 45000, stock: 35, sold: 130, status: "Còn hàng", description: "Đá xay matcha Nhật Bản vị đậm đà.", image: "https://images.unsplash.com/photo-1536013455962-0e2c2dfb01d5?auto=format&fit=crop&w=600&q=80", createdAt: new Date().toISOString() },
      { id: 7, name: "Bánh croissant bơ", category: "Bánh ngọt", price: 25000, stock: 25, sold: 180, status: "Còn hàng", description: "Bánh sừng bò bơ Pháp giòn xốp nhiều lớp.", image: "https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=600&q=80", createdAt: new Date().toISOString() },
      { id: 8, name: "Bánh tiramisu", category: "Bánh ngọt", price: 35000, stock: 15, sold: 88, status: "Còn hàng", description: "Bánh tiramisu vị cà phê rượu rum béo mịn.", image: "https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?auto=format&fit=crop&w=600&q=80", createdAt: new Date().toISOString() },
      { id: 9, name: "Nước ép cam", category: "Đồ uống khác", price: 30000, stock: 50, sold: 60, status: "Còn hàng", description: "Nước cam vắt nguyên chất không đường.", image: "https://images.unsplash.com/photo-1613478223719-2ab802602423?auto=format&fit=crop&w=600&q=80", createdAt: new Date().toISOString() },
      { id: 10, name: "Soda việt quất", category: "Đồ uống khác", price: 38000, stock: 0, sold: 42, status: "Hết hàng", description: "Soda vị việt quất chua ngọt sảng khoái.", image: "https://images.unsplash.com/photo-1497534446932-c925b458314e?auto=format&fit=crop&w=600&q=80", createdAt: new Date().toISOString() },
    ];
  },

  /** Ảnh mặc định khi sản phẩm chưa có ảnh */
  DEFAULT_IMAGE: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=600&q=80",
};
