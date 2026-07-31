/* ============================================================
   tracking.js - Theo dõi trạng thái đơn hàng thời gian thực
   Trạng thái tự chuyển sau mỗi khoảng thời gian bằng setInterval,
   tính theo thời gian đã trôi qua kể từ lúc đặt hàng để dữ liệu
   nhất quán kể cả khi người dùng tải lại trang.
   ============================================================ */

AuthService.guard(["admin", "customer"]);

const STAGE_DURATION_MS = 15000; // mỗi trạng thái kéo dài 15 giây (demo)
const orderId = Number(new URLSearchParams(location.search).get("order"));

function computeStageIndex(order) {
  const elapsed = Date.now() - new Date(order.createdAt).getTime();
  const idx = Math.floor(elapsed / STAGE_DURATION_MS);
  return Math.min(idx, OrderService.TRACKING_STAGES.length - 1);
}

function renderStepper(stageIndex) {
  const stepper = document.getElementById("trackingStepper");
  stepper.innerHTML = "";
  OrderService.TRACKING_STAGES.forEach((stage, i) => {
    const done = i < stageIndex;
    const active = i === stageIndex;
    const step = document.createElement("div");
    step.className = "tracking-step" + (done ? " done" : "") + (active ? " active" : "");
    step.innerHTML = `
      <div class="tracking-dot"><i class="fa-solid ${stage.icon}"></i></div>
      <div class="tracking-label">${stage.label}</div>`;
    stepper.appendChild(step);
  });
}

function renderOrder(order) {
  const stageIndex = computeStageIndex(order);
  const stage = OrderService.TRACKING_STAGES[stageIndex];

  document.getElementById("trackOrderTitle").textContent = `Đơn hàng #${order.id}`;
  document.getElementById("trackStatusBadge").innerHTML = `<i class="fa-solid ${stage.icon} me-2"></i>${stage.label}`;
  renderStepper(stageIndex);

  if (stageIndex >= OrderService.TRACKING_STAGES.length - 1) {
    document.getElementById("trackEta").textContent = "Đơn hàng đã hoàn tất. Cảm ơn bạn đã ủng hộ Cafe Việt!";
  } else {
    const nextLabel = OrderService.TRACKING_STAGES[stageIndex + 1].label;
    document.getElementById("trackEta").textContent = `Tiếp theo: ${nextLabel}...`;
  }

  // Ghi lại trạng thái mới nhất vào lịch sử đơn hàng (nếu thay đổi)
  if (order.trackingStageIndex !== stageIndex) {
    order.trackingStageIndex = stageIndex;
    order.status = stage.label;
    const all = OrderService.getAllOrders();
    const idx = all.findIndex((o) => o.id === order.id);
    if (idx !== -1) {
      all[idx] = order;
      OrderService.saveAllOrders(all);
    }
  }

  const itemsList = document.getElementById("trackItemsList");
  itemsList.innerHTML = order.items
    .map((i) => {
      const desc = OrderService.describeOptions(i.options);
      return `<div class="d-flex justify-content-between align-items-start py-1">
        <div>
          <div class="fw-bold">${i.name} <span class="text-muted">x${i.qty}</span></div>
          ${desc ? `<div class="text-muted small">${desc}</div>` : ""}
        </div>
        <div class="fw-bold">${((i.unitPrice ?? i.price) * i.qty).toLocaleString("vi-VN")}đ</div>
      </div>`;
    })
    .join("");

  document.getElementById("trackSubtotal").textContent = order.subtotal.toLocaleString("vi-VN") + "đ";
  document.getElementById("trackShipping").textContent = (order.shippingFee || 0).toLocaleString("vi-VN") + "đ";
  document.getElementById("trackDiscountRow").classList.toggle("d-none", !order.discount);
  document.getElementById("trackDiscount").textContent = "-" + (order.discount || 0).toLocaleString("vi-VN") + "đ";
  document.getElementById("trackTotal").textContent = order.total.toLocaleString("vi-VN") + "đ";

  const date = new Date(order.createdAt).toLocaleString("vi-VN");
  const methodLabel = order.deliveryMethod === "delivery" ? `Giao tận nơi - ${order.address}` : "Đến quán tự lấy";
  document.getElementById("trackMeta").innerHTML = `
    <div>Khách hàng: <strong>${order.customerName}</strong></div>
    <div>Thời gian đặt: ${date}</div>
    <div>Hình thức nhận hàng: ${methodLabel}</div>
    <div>Thanh toán: ${order.paymentMethod}</div>`;
}

function init() {
  const order = OrderService.getOrderById(orderId);
  if (!order) {
    document.getElementById("trackNotFound").classList.remove("d-none");
    document.getElementById("trackContent").classList.add("d-none");
    return;
  }
  document.getElementById("trackContent").classList.remove("d-none");
  renderOrder(order);

  setInterval(() => {
    const latest = OrderService.getOrderById(orderId);
    if (latest) renderOrder(latest);
  }, 3000);
}

init();
