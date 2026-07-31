/* ============================================================
   dashboard.js - Biểu đồ thống kê & Best Sale
   ============================================================ */

AuthService.guard(["admin"]); // Chỉ Admin mới xem được Thống kê

const stats = MenuService.getStats();
document.getElementById("statTotal").textContent = stats.totalProducts;
document.getElementById("statSold").textContent = stats.totalSold;
document.getElementById("statRevenue").textContent = stats.revenue.toLocaleString("vi-VN") + "đ";
document.getElementById("statOut").textContent = stats.outOfStock;

const orderStats = OrderService.getOrderStats();
document.getElementById("statOrders").textContent = orderStats.totalOrders;
document.getElementById("statOrderRevenue").textContent = orderStats.totalRevenue.toLocaleString("vi-VN") + "đ";

/* ---------- XUẤT BÁO CÁO EXCEL ---------- */
document.getElementById("btnExportExcel").addEventListener("click", () => {
  const wb = XLSX.utils.book_new();

  // Sheet 1: Tổng quan
  const overviewSheet = XLSX.utils.json_to_sheet([
    { "Chỉ số": "Tổng sản phẩm", "Giá trị": stats.totalProducts },
    { "Chỉ số": "Tổng số đã bán", "Giá trị": stats.totalSold },
    { "Chỉ số": "Doanh thu ước tính (đ)", "Giá trị": stats.revenue },
    { "Chỉ số": "Sản phẩm hết hàng", "Giá trị": stats.outOfStock },
    { "Chỉ số": "Tổng đơn hàng", "Giá trị": orderStats.totalOrders },
    { "Chỉ số": "Doanh thu từ đơn hàng (đ)", "Giá trị": orderStats.totalRevenue },
  ]);
  XLSX.utils.book_append_sheet(wb, overviewSheet, "Tổng quan");

  // Sheet 2: Sản phẩm
  const productRows = MenuService.getAll().map((p) => ({
    "Tên sản phẩm": p.name,
    "Danh mục": p.category,
    "Giá (đ)": p.price,
    "Tồn kho": p.stock,
    "Đã bán": p.sold || 0,
    "Trạng thái": p.status,
  }));
  const productSheet = XLSX.utils.json_to_sheet(productRows);
  XLSX.utils.book_append_sheet(wb, productSheet, "Sản phẩm");

  // Sheet 3: Đơn hàng
  const orderRows = OrderService.getAllOrders().map((o) => ({
    "Mã đơn": o.id,
    "Khách hàng": o.customerName,
    "SĐT": o.phone,
    "Số món": o.items.reduce((s, i) => s + i.qty, 0),
    "Tổng tiền (đ)": o.total,
    "Hình thức": o.deliveryMethod === "delivery" ? "Giao hàng" : "Tự đến lấy",
    "Thanh toán": o.paymentMethod,
    "Trạng thái": o.status,
    "Thời gian": new Date(o.createdAt).toLocaleString("vi-VN"),
  }));
  const orderSheet = XLSX.utils.json_to_sheet(orderRows);
  XLSX.utils.book_append_sheet(wb, orderSheet, "Đơn hàng");

  XLSX.writeFile(wb, `bao-cao-cafe-viet-${Date.now()}.xlsx`);
  if (typeof showToast === "function") showToast("Đã xuất báo cáo Excel.", "success");
});

const brandColor = "#8B5E3C";
const accentColor = "#D98E4A";
const palette = ["#8B5E3C", "#D98E4A", "#C98A2C", "#B4703A", "#E7C9A9", "#5C3A21"];

/* ---------- BEST SALE BAR CHART ---------- */
const bestSellers = MenuService.getBestSellers(5);
new Chart(document.getElementById("bestSaleChart"), {
  type: "bar",
  data: {
    labels: bestSellers.map((p) => p.name),
    datasets: [
      {
        label: "Số lượng đã bán",
        data: bestSellers.map((p) => p.sold || 0),
        backgroundColor: accentColor,
        borderRadius: 10,
      },
    ],
  },
  options: {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: { y: { beginAtZero: true } },
  },
});

/* ---------- BEST SELLER RANKING LIST ---------- */
const rankListEl = document.getElementById("bestSellerList");
const rankClasses = ["gold", "silver", "bronze"];
bestSellers.forEach((p, i) => {
  rankListEl.insertAdjacentHTML(
    "beforeend",
    `<div class="best-seller-item">
      <div class="best-seller-rank ${rankClasses[i] || ""}">${i + 1}</div>
      <div class="flex-grow-1">
        <div class="fw-bold">${p.name}</div>
        <div class="text-muted small">${p.category} · ${Number(p.price).toLocaleString("vi-VN")}đ</div>
      </div>
      <div class="fw-bold text-end">${p.sold || 0}<div class="text-muted small fw-normal">đã bán</div></div>
    </div>`
  );
});
if (bestSellers.length === 0) {
  rankListEl.innerHTML = `<p class="text-muted text-center py-4">Chưa có dữ liệu bán hàng.</p>`;
}

/* ---------- CATEGORY PIE CHART ---------- */
const categoryStats = MenuService.getStatsByCategory();
new Chart(document.getElementById("categoryChart"), {
  type: "doughnut",
  data: {
    labels: Object.keys(categoryStats),
    datasets: [
      {
        data: Object.values(categoryStats),
        backgroundColor: palette,
        borderWidth: 2,
        borderColor: "#fff",
      },
    ],
  },
  options: {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { position: "bottom" } },
  },
});

/* ---------- STOCK CHART ---------- */
const allProducts = MenuService.getAll();
new Chart(document.getElementById("stockChart"), {
  type: "bar",
  data: {
    labels: allProducts.map((p) => p.name),
    datasets: [
      {
        label: "Tồn kho",
        data: allProducts.map((p) => p.stock),
        backgroundColor: allProducts.map((p) => (p.stock === 0 ? "#B4432B" : brandColor)),
        borderRadius: 8,
      },
    ],
  },
  options: {
    indexAxis: "y",
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
  },
});
