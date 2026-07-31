/* ============================================================
   menu.js - Logic trang Quản lý sản phẩm (CRUD)
   ============================================================ */

AuthService.guard(["admin"]); // Chỉ Admin mới được quản lý Menu (CRUD)

const PAGE_SIZE = 5;
let currentPage = 1;
let editingId = null;

const els = {
  tbody: document.getElementById("productTableBody"),
  emptyState: document.getElementById("emptyState"),
  pagination: document.getElementById("pagination"),
  search: document.getElementById("searchInput"),
  filterCategory: document.getElementById("filterCategory"),
  filterStatus: document.getElementById("filterStatus"),
  sortBy: document.getElementById("sortBy"),
  modal: document.getElementById("productModal"),
  modalTitle: document.getElementById("modalTitle"),
  fieldCategorySelect: document.getElementById("fieldCategory"),
};

/* ---------- KHỞI TẠO DANH MỤC CHO SELECT ---------- */
function fillCategoryOptions() {
  CATEGORY_LIST.forEach((c) => {
    els.filterCategory.insertAdjacentHTML("beforeend", `<option value="${c}">${c}</option>`);
    els.fieldCategorySelect.insertAdjacentHTML("beforeend", `<option value="${c}">${c}</option>`);
  });
}

/* ---------- LẤY DANH SÁCH ĐÃ LỌC / SẮP XẾP ---------- */
function getFilteredList() {
  let list = MenuService.getAll();
  const kw = els.search.value.trim().toLowerCase();
  const cat = els.filterCategory.value;
  const status = els.filterStatus.value;
  const sort = els.sortBy.value;

  if (kw) {
    list = list.filter(
      (p) => p.name.toLowerCase().includes(kw) || (p.description || "").toLowerCase().includes(kw)
    );
  }
  if (cat) list = list.filter((p) => p.category === cat);
  if (status) list = list.filter((p) => p.status === status);

  if (sort === "price-asc") list.sort((a, b) => a.price - b.price);
  else if (sort === "price-desc") list.sort((a, b) => b.price - a.price);
  else if (sort === "sold-desc") list.sort((a, b) => b.sold - a.sold);
  else if (sort === "name-asc") list.sort((a, b) => a.name.localeCompare(b.name));

  return list;
}

/* ---------- RENDER BẢNG ---------- */
function renderTable() {
  const fullList = getFilteredList();
  const totalPages = Math.max(1, Math.ceil(fullList.length / PAGE_SIZE));
  if (currentPage > totalPages) currentPage = totalPages;
  const start = (currentPage - 1) * PAGE_SIZE;
  const pageList = fullList.slice(start, start + PAGE_SIZE);

  els.tbody.innerHTML = "";
  els.emptyState.classList.toggle("d-none", fullList.length > 0);

  pageList.forEach((p, i) => {
    const statusBadge =
      p.status === "Còn hàng"
        ? `<span class="badge-instock"><i class="fa-solid fa-check me-1"></i>Còn hàng</span>`
        : `<span class="badge-outstock"><i class="fa-solid fa-xmark me-1"></i>Hết hàng</span>`;

    const row = document.createElement("tr");
    if (p.status === "Hết hàng") row.classList.add("row-out-of-stock");
    row.innerHTML = `
      <td>${start + i + 1}</td>
      <td><img src="${escapeHtml(p.image || MenuService.DEFAULT_IMAGE)}" alt="${escapeHtml(p.name)}" class="rounded-3" style="width:52px;height:52px;object-fit:cover;" onerror="this.src='${MenuService.DEFAULT_IMAGE}'"></td>
      <td>
        <div class="fw-bold">${escapeHtml(p.name)}</div>
        <div class="text-muted small">${escapeHtml((p.description || "").slice(0, 50))}${p.description && p.description.length > 50 ? "…" : ""}</div>
      </td>
      <td>${escapeHtml(p.category)}</td>
      <td>${Number(p.price).toLocaleString("vi-VN")}đ</td>
      <td>${p.stock}</td>
      <td>${p.sold || 0}</td>
      <td>${statusBadge}</td>
      <td class="text-end">
        <button class="btn btn-sm btn-outline-brand btn-pill me-1 btn-toggle" data-id="${p.id}" title="Đổi trạng thái">
          <i class="fa-solid fa-rotate"></i>
        </button>
        <button class="btn btn-sm btn-outline-brand btn-pill me-1 btn-edit" data-id="${p.id}" title="Sửa">
          <i class="fa-solid fa-pen"></i>
        </button>
        <button class="btn btn-sm btn-outline-danger btn-pill btn-delete" data-id="${p.id}" title="Xóa">
          <i class="fa-solid fa-trash"></i>
        </button>
      </td>`;
    els.tbody.appendChild(row);
  });

  renderPagination(totalPages);
  renderSummary();
  bindRowEvents();
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str || "";
  return div.innerHTML;
}

/* ---------- PHÂN TRANG ---------- */
function renderPagination(totalPages) {
  els.pagination.innerHTML = "";
  if (totalPages <= 1) return;
  for (let i = 1; i <= totalPages; i++) {
    const li = document.createElement("li");
    li.className = `page-item ${i === currentPage ? "active" : ""}`;
    li.innerHTML = `<a class="page-link" href="#">${i}</a>`;
    li.addEventListener("click", (e) => {
      e.preventDefault();
      currentPage = i;
      renderTable();
    });
    els.pagination.appendChild(li);
  }
}

/* ---------- TỔNG HỢP SỐ LIỆU ---------- */
function renderSummary() {
  const all = MenuService.getAll();
  document.getElementById("sumTotal").textContent = all.length;
  document.getElementById("sumInStock").textContent = all.filter((p) => p.status === "Còn hàng").length;
  document.getElementById("sumOutStock").textContent = all.filter((p) => p.status === "Hết hàng").length;
  document.getElementById("sumSold").textContent = all.reduce((s, p) => s + (Number(p.sold) || 0), 0);
}

/* ---------- SỰ KIỆN DÒNG (TOGGLE / EDIT / DELETE) ---------- */
function bindRowEvents() {
  document.querySelectorAll(".btn-toggle").forEach((btn) =>
    btn.addEventListener("click", () => {
      MenuService.toggleStatus(btn.dataset.id);
      renderTable();
      showToast("Đã cập nhật trạng thái sản phẩm.", "success");
    })
  );

  document.querySelectorAll(".btn-edit").forEach((btn) =>
    btn.addEventListener("click", () => openEditModal(btn.dataset.id))
  );

  document.querySelectorAll(".btn-delete").forEach((btn) =>
    btn.addEventListener("click", () => confirmDelete(btn.dataset.id))
  );
}

function confirmDelete(id) {
  Swal.fire({
    title: "Xóa sản phẩm?",
    text: "Hành động này không thể hoàn tác.",
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "Xóa",
    cancelButtonText: "Hủy",
    confirmButtonColor: "#B4432B",
    cancelButtonColor: "#7A6A5C",
  }).then((res) => {
    if (res.isConfirmed) {
      MenuService.remove(id);
      renderTable();
      showToast("Đã xóa sản phẩm.", "danger");
    }
  });
}

/* ---------- MODAL THÊM / SỬA ---------- */
function resetForm() {
  document.getElementById("productForm").reset();
  document.querySelectorAll(".was-validated-field").forEach((f) => f.classList.remove("is-invalid"));
  document.getElementById("productId").value = "";
  document.getElementById("fieldStatus").value = "Còn hàng";
  document.getElementById("fieldSold").value = 0;
  document.getElementById("fieldImage").value = "";
  document.getElementById("fieldImagePreview").src = MenuService.DEFAULT_IMAGE;
  editingId = null;
  els.modalTitle.innerHTML = `<i class="fa-solid fa-mug-hot me-2"></i>Thêm sản phẩm mới`;
}

document.getElementById("btnAdd").addEventListener("click", resetForm);

function openEditModal(id) {
  const p = MenuService.getById(id);
  if (!p) return;
  resetForm();
  editingId = p.id;
  document.getElementById("productId").value = p.id;
  document.getElementById("fieldName").value = p.name;
  document.getElementById("fieldCategory").value = p.category;
  document.getElementById("fieldPrice").value = p.price;
  document.getElementById("fieldStock").value = p.stock;
  document.getElementById("fieldSold").value = p.sold || 0;
  document.getElementById("fieldStatus").value = p.status;
  document.getElementById("fieldDescription").value = p.description || "";
  document.getElementById("fieldImage").value = p.image || "";
  document.getElementById("fieldImagePreview").src = p.image || MenuService.DEFAULT_IMAGE;
  els.modalTitle.innerHTML = `<i class="fa-solid fa-pen me-2"></i>Cập nhật sản phẩm`;
  new bootstrap.Modal(els.modal).show();
}

/* ---------- VALIDATION ---------- */
function validateForm() {
  let valid = true;
  const name = document.getElementById("fieldName");
  const category = document.getElementById("fieldCategory");
  const price = document.getElementById("fieldPrice");
  const stock = document.getElementById("fieldStock");
  const sold = document.getElementById("fieldSold");
  const desc = document.getElementById("fieldDescription");

  const check = (field, condition) => {
    const wrap = field.closest(".was-validated-field");
    if (!condition) {
      wrap.classList.add("is-invalid");
      valid = false;
    } else {
      wrap.classList.remove("is-invalid");
    }
  };

  check(name, name.value.trim().length > 0);
  check(category, category.value !== "");
  check(price, Number(price.value) > 0);
  check(stock, stock.value !== "" && Number(stock.value) >= 0);
  check(sold, sold.value === "" || Number(sold.value) >= 0);
  check(desc, desc.value.trim().length >= 10);

  return valid;
}

// Validation realtime khi gõ
["fieldName", "fieldPrice", "fieldStock", "fieldDescription", "fieldCategory"].forEach((id) => {
  document.getElementById(id).addEventListener("input", validateForm);
});

document.getElementById("btnSaveProduct").addEventListener("click", () => {
  if (!validateForm()) return;

  const data = {
    name: document.getElementById("fieldName").value.trim(),
    category: document.getElementById("fieldCategory").value,
    price: Number(document.getElementById("fieldPrice").value),
    stock: Number(document.getElementById("fieldStock").value),
    sold: Number(document.getElementById("fieldSold").value) || 0,
    status: document.getElementById("fieldStatus").value,
    description: document.getElementById("fieldDescription").value.trim(),
    image: document.getElementById("fieldImage").value.trim() || MenuService.DEFAULT_IMAGE,
  };

  if (editingId) {
    MenuService.update(editingId, data);
    showToast("Đã cập nhật sản phẩm thành công.", "success");
  } else {
    MenuService.create(data);
    showToast("Đã thêm sản phẩm mới.", "success");
  }

  bootstrap.Modal.getInstance(els.modal).hide();
  currentPage = 1;
  renderTable();
});

/* ---------- FILTER / SEARCH / SORT ---------- */
[els.search, els.filterCategory, els.filterStatus, els.sortBy].forEach((el) =>
  el.addEventListener("input", () => {
    currentPage = 1;
    renderTable();
  })
);

document.getElementById("btnResetFilter").addEventListener("click", () => {
  els.search.value = "";
  els.filterCategory.value = "";
  els.filterStatus.value = "";
  els.sortBy.value = "";
  currentPage = 1;
  renderTable();
});

/* ---------- CLEAR ALL ---------- */
document.getElementById("btnClearAll").addEventListener("click", () => {
  Swal.fire({
    title: "Xóa toàn bộ sản phẩm?",
    text: "Toàn bộ dữ liệu menu sẽ bị xóa vĩnh viễn.",
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "Xóa tất cả",
    cancelButtonText: "Hủy",
    confirmButtonColor: "#B4432B",
  }).then((res) => {
    if (res.isConfirmed) {
      MenuService.clearAll();
      currentPage = 1;
      renderTable();
      showToast("Đã xóa toàn bộ dữ liệu.", "danger");
    }
  });
});

document.getElementById("fieldImage").addEventListener("input", (e) => {
  document.getElementById("fieldImagePreview").src = e.target.value.trim() || MenuService.DEFAULT_IMAGE;
});

/* ---------- INIT ---------- */
fillCategoryOptions();
renderTable();
