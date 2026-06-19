import { apiFetch, showToast, esc, inr, fmt, openModal, closeModal, overlayClose } from "./utils.js";
import { validateAmount, validatePersonName } from "./auth.js";
import { icon } from "./icons.js";
import { initPageAnimations } from "./animations.js";

let debts      = [];
let currentTab = "all";
let deleteId   = null;
let editId     = null;

export async function initSettlements() {
  overlayClose("addDebtModal");
  overlayClose("editDebtModal");
  overlayClose("delDebtModal");

  document.getElementById("debtDate").value = new Date().toISOString().split("T")[0];
  document.getElementById("debtAmount").setAttribute("min", "1");
  document.getElementById("editAmount").setAttribute("min", "1");

  window.openModal  = openModal;
  window.closeModal = closeModal;

  document.getElementById("tabAll").addEventListener("click", () => switchTab("all"));
  document.getElementById("tabPending").addEventListener("click", () => switchTab("pending"));
  document.getElementById("tabPaid").addEventListener("click", () => switchTab("paid"));

  document.getElementById("addDebtForm").addEventListener("submit", handleAddDebt);
  document.getElementById("editDebtForm").addEventListener("submit", handleEditDebt);
  document.getElementById("confirmDebtDelBtn").addEventListener("click", handleDeleteDebt);

  await loadDebts();
  initPageAnimations();
}

async function loadDebts() {
  const res = await apiFetch("/settlements/View_debt");
  if (!res) return;
  if (!res.ok) { showToast("Failed to load settlements.", "error"); return; }
  debts = await res.json();
  renderStats();
  renderDebts();
}

function renderStats() {
  const youOwe    = debts.filter(d => d.debt_type === "borrowed" && d.debt_status === "pending").reduce((s, d) => s + Number(d.amount || 0), 0);
  const owedToYou = debts.filter(d => d.debt_type === "lent"     && d.debt_status === "pending").reduce((s, d) => s + Number(d.amount || 0), 0);
  const pending   = debts.filter(d => d.debt_status === "pending").length;
  const paid      = debts.filter(d => d.debt_status === "paid").length;

  document.getElementById("debtStats").innerHTML = `
    <div class="stat-card r">
      <div class="stat-icon-wrap">${icon("arrow-up-right", 20)}</div>
      <div class="stat-label">You Owe</div>
      <div class="stat-val">${inr(youOwe)}</div>
    </div>
    <div class="stat-card g">
      <div class="stat-icon-wrap">${icon("arrow-down-left", 20)}</div>
      <div class="stat-label">Owed to You</div>
      <div class="stat-val">${inr(owedToYou)}</div>
    </div>
    <div class="stat-card a">
      <div class="stat-icon-wrap">${icon("clock", 20)}</div>
      <div class="stat-label">Pending</div>
      <div class="stat-val">${pending}</div>
    </div>
    <div class="stat-card b">
      <div class="stat-icon-wrap">${icon("check-circle", 20)}</div>
      <div class="stat-label">Paid</div>
      <div class="stat-val">${paid}</div>
    </div>
  `;
}

function renderDebts() {
  let data = debts;
  if (currentTab === "pending") data = debts.filter(d => d.debt_status === "pending");
  if (currentTab === "paid")    data = debts.filter(d => d.debt_status === "paid");

  if (!data.length) {
    document.getElementById("debtView").innerHTML = `<div class="empty"><div class="empty-icon">${icon("handshake", 40)}</div><h3>No records found</h3><p>${currentTab === "all" ? "Add your first settlement above." : "Nothing in this category."}</p></div>`;
    return;
  }

  document.getElementById("debtView").innerHTML = `
    <table>
      <thead><tr>
        <th>Person</th><th>Type</th><th>Date</th><th>Status</th><th class="mono">Amount</th><th>Actions</th>
      </tr></thead>
      <tbody>
        ${data.map(d => {
          const isBorrow  = d.debt_type === "borrowed";
          const isPending = d.debt_status === "pending";
          return `
            <tr>
              <td style="font-weight:600">${esc(d.person_name)}</td>
              <td>
                <span class="badge ${isBorrow ? "br" : "bg"}">
                  ${isBorrow ? icon("arrow-up-right", 12) : icon("arrow-down-left", 12)}
                  ${isBorrow ? "I owe" : "Owe me"}
                </span>
              </td>
              <td style="color:var(--text-muted)">${fmt(d.debt_date)}</td>
              <td>
                <span class="badge ${isPending ? "ba" : "bg"}">
                  ${isPending ? icon("clock", 12) : icon("check", 12)}
                  ${isPending ? "Pending" : "Paid"}
                </span>
              </td>
              <td class="mono ${isBorrow ? "debit" : "credit"}">${inr(d.amount)}</td>
              <td style="display:flex;gap:6px;align-items:center">
                <button class="btn btn-outline btn-sm" data-action="edit" data-id="${esc(d.id)}">${icon("pencil", 13)} Edit</button>
                <button class="btn btn-danger btn-sm btn-icon" data-action="delete" data-id="${esc(d.id)}" data-name="${esc(d.person_name)}" title="Delete">${icon("trash-2", 14)}</button>
              </td>
            </tr>
          `;
        }).join("")}
      </tbody>
    </table>
  `;

  document.querySelectorAll('[data-action="edit"]').forEach(btn => {
    btn.addEventListener("click", () => openEdit(Number(btn.dataset.id)));
  });
  document.querySelectorAll('[data-action="delete"]').forEach(btn => {
    btn.addEventListener("click", () => confirmDelete(Number(btn.dataset.id), btn.dataset.name));
  });
}

function switchTab(tab) {
  currentTab = tab;
  ["all", "pending", "paid"].forEach(t => {
    document.getElementById("tab" + t.charAt(0).toUpperCase() + t.slice(1))?.classList.toggle("active", t === tab);
  });
  renderDebts();
}

function openEdit(id) {
  const d = debts.find(x => x.id === id);
  if (!d) return;
  editId = id;
  document.getElementById("editPerson").value = d.person_name;
  document.getElementById("editAmount").value = d.amount;
  document.getElementById("editType").value   = d.debt_type;
  document.getElementById("editStatus").value = d.debt_status;
  openModal("editDebtModal");
}

function confirmDelete(id, name) {
  deleteId = id;
  document.getElementById("delDebtName").textContent = name;
  openModal("delDebtModal");
}

async function handleDeleteDebt() {
  if (!deleteId) return;
  const btn = document.getElementById("confirmDebtDelBtn");
  btn.disabled = true;
  btn.innerHTML = `${icon("refresh-cw", 14)} Deleting…`;
  try {
    const res = await apiFetch(`/settlements/delete_debt?del_id=${deleteId}`, { method: "DELETE" });
    if (res && res.ok) {
      debts = debts.filter(d => d.id !== deleteId);
      renderStats();
      renderDebts();
      closeModal("delDebtModal");
      showToast("Settlement deleted.", "success");
    } else {
      showToast("Could not delete.", "error");
    }
  } catch {
    showToast("Network error.", "error");
  } finally {
    btn.innerHTML = `${icon("trash-2", 14)} Delete`;
    btn.disabled = false;
    deleteId = null;
  }
}

async function handleEditDebt(e) {
  e.preventDefault();
  const btn = document.getElementById("editDebtBtn");

  const person = document.getElementById("editPerson").value.trim();
  const amountVal = document.getElementById("editAmount").value;
  const errs = [...validatePersonName(person), ...validateAmount(amountVal)];
  if (errs.length) { showToast(errs[0], "error"); return; }

  btn.disabled = true;
  btn.innerHTML = `${icon("refresh-cw", 14)} Saving…`;

  const body = {
    person_name: person,
    amount:      Number(amountVal),
    debt_type:   document.getElementById("editType").value,
    debt_status: document.getElementById("editStatus").value,
  };

  try {
    const res = await apiFetch(`/settlements/update_debt?int_id=${editId}`, {
      method: "PUT",
      body: JSON.stringify(body),
    });
    if (!res) return;
    const data = await res.json();
    if (res.ok) {
      closeModal("editDebtModal");
      showToast("Settlement updated!", "success");
      await loadDebts();
    } else {
      showToast(data.detail || "Could not update.", "error");
    }
  } catch {
    showToast("Network error.", "error");
  } finally {
    btn.innerHTML = `${icon("check", 14)} Save Changes`;
    btn.disabled = false;
  }
}

async function handleAddDebt(e) {
  e.preventDefault();
  const btn = document.getElementById("addDebtBtn");

  const person = document.getElementById("debtPerson").value.trim();
  const amountVal = document.getElementById("debtAmount").value;
  const errs = [...validatePersonName(person), ...validateAmount(amountVal)];
  if (errs.length) { showToast(errs[0], "error"); return; }

  btn.disabled = true;
  btn.innerHTML = `${icon("refresh-cw", 14)} Adding…`;

  const body = {
    person_name: person,
    amount:      Number(amountVal),
    debt_date:   document.getElementById("debtDate").value,
    debt_type:   document.getElementById("debtType").value,
    debt_status: document.getElementById("debtStatus").value,
  };

  try {
    const res = await apiFetch("/settlements/Add_debt", {
      method: "POST",
      body: JSON.stringify(body),
    });
    if (!res) return;
    const data = await res.json();
    if (res.ok) {
      closeModal("addDebtModal");
      document.getElementById("addDebtForm").reset();
      document.getElementById("debtDate").value = new Date().toISOString().split("T")[0];
      showToast("Settlement added!", "success");
      await loadDebts();
    } else {
      showToast(data.detail || "Could not add settlement.", "error");
    }
  } catch {
    showToast("Network error.", "error");
  } finally {
    btn.innerHTML = `${icon("plus", 14)} Add Settlement`;
    btn.disabled = false;
  }
}
