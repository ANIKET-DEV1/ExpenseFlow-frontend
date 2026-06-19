import { apiFetch, showToast, esc, inr, fmt, openModal, closeModal, overlayClose } from "./utils.js";
import { validateAmount } from "./auth.js";
import { icon } from "./icons.js";
import { initPageAnimations } from "./animations.js";

let allExpenses = [];
let allTags     = [];
let currentTab  = "all";
let deleteId    = null;

export async function initExpenses() {
  overlayClose("addModal");
  overlayClose("delModal");

  document.getElementById("addDate").value = new Date().toISOString().split("T")[0];
  document.getElementById("addAmount").setAttribute("min", "1");

  document.getElementById("addForm").addEventListener("submit", handleAddExpense);
  document.getElementById("confirmDelBtn").addEventListener("click", handleDeleteExpense);

  window.openModal      = openModal;
  window.closeModal     = closeModal;
  window.switchTab      = switchTab;
  window.applyFilter    = applyFilter;
  window.confirmDelete  = confirmDelete;
  window.toggleGroup    = toggleGroup;

  await loadTags();
  await loadExpenses();
  initPageAnimations();
}

async function loadTags() {
  const res = await apiFetch("/tags/view_tags");
  if (!res || !res.ok) return;
  allTags = await res.json();
  const sel = document.getElementById("addTag");
  sel.innerHTML = allTags.length
    ? allTags.map(t => `<option value="${esc(t.tag_name)}">${esc(t.tag_name)}</option>`).join("")
    : `<option disabled>No tags yet — add one in Tags page</option>`;
}

async function loadExpenses() {
  const res = await apiFetch("/expenses/view_expenses");
  if (!res) return;
  if (!res.ok) { showToast("Failed to load expenses.", "error"); return; }
  allExpenses = await res.json();
  renderStats();
  renderView();
}

function renderStats() {
  const total   = allExpenses.reduce((s, e) => s + Number(e.amount || 0), 0);
  const now     = new Date();
  const month   = allExpenses.filter(e => {
    const d = new Date(e.expense_date);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).reduce((s, e) => s + Number(e.amount || 0), 0);
  const cash    = allExpenses.filter(e => e.payment_type === "CASH").reduce((s, e) => s + Number(e.amount || 0), 0);
  const digital = allExpenses.filter(e => e.payment_type !== "CASH").reduce((s, e) => s + Number(e.amount || 0), 0);

  document.getElementById("expenseStats").innerHTML = `
    <div class="stat-card r">
      <div class="stat-icon-wrap">${icon("receipt", 20)}</div>
      <div class="stat-label">Total Spent</div>
      <div class="stat-val">${inr(total)}</div>
    </div>
    <div class="stat-card a">
      <div class="stat-icon-wrap">${icon("calendar", 20)}</div>
      <div class="stat-label">This Month</div>
      <div class="stat-val">${inr(month)}</div>
    </div>
    <div class="stat-card g">
      <div class="stat-icon-wrap">${icon("banknote", 20)}</div>
      <div class="stat-label">Cash</div>
      <div class="stat-val">${inr(cash)}</div>
    </div>
    <div class="stat-card b">
      <div class="stat-icon-wrap">${icon("smartphone", 20)}</div>
      <div class="stat-label">Digital</div>
      <div class="stat-val">${inr(digital)}</div>
    </div>
  `;
}

function filtered() {
  const q   = document.getElementById("searchInp").value.toLowerCase().trim();
  const pay = document.getElementById("payFilter").value;
  return allExpenses.filter(e => {
    const matchQ   = !q || (e.tag_name || "").toLowerCase().includes(q) || (e.description || "").toLowerCase().includes(q);
    const matchPay = !pay || e.payment_type === pay;
    return matchQ && matchPay;
  });
}

function renderView() {
  const data = filtered();
  if (currentTab === "all")   renderTable(data);
  if (currentTab === "tag")   renderGrouped(data, "tag");
  if (currentTab === "month") renderGrouped(data, "month");
}

function payBadge(pt) {
  const map = {
    CASH: { cls: "ba", label: "Cash" },
    UPI:  { cls: "bb", label: "UPI" },
    CARD: { cls: "bg", label: "Card" },
  };
  const b = map[pt] || { cls: "bs", label: pt || "—" };
  return `<span class="badge ${b.cls}">${esc(b.label)}</span>`;
}

function renderTable(data) {
  if (!data.length) {
    document.getElementById("expenseView").innerHTML = `<div class="empty"><div class="empty-icon">${icon("credit-card", 40)}</div><h3>No expenses found</h3><p>Try a different search or add a new expense.</p></div>`;
    return;
  }
  document.getElementById("expenseView").innerHTML = `
    <table>
      <thead><tr>
        <th>Tag</th><th>Description</th><th>Date</th><th>Payment</th><th class="mono">Amount</th><th></th>
      </tr></thead>
      <tbody>
        ${data.sort((a,b) => new Date(b.expense_date) - new Date(a.expense_date)).map(e => `
          <tr>
            <td><span class="badge bg">${esc(e.tag_name)}</span></td>
            <td style="color:var(--text-muted)">${esc(e.description) || "—"}</td>
            <td style="color:var(--text-muted)">${fmt(e.expense_date)}</td>
            <td>${payBadge(e.payment_type)}</td>
            <td class="mono debit">${inr(e.amount)}</td>
            <td><button class="btn btn-danger btn-sm btn-icon" data-id="${esc(e.id)}" data-action="delete" title="Delete">${icon("trash-2", 14)}</button></td>
          </tr>
        `).join("")}
      </tbody>
    </table>
  `;
  wireRowActions();
}

function renderGrouped(data, by) {
  if (!data.length) {
    document.getElementById("expenseView").innerHTML = `<div class="empty"><div class="empty-icon">${icon("credit-card", 40)}</div><h3>No expenses found</h3></div>`;
    return;
  }
  const groups = {};
  data.forEach(e => {
    const key = by === "tag"
      ? (e.tag_name || "Untagged")
      : new Date(e.expense_date).toLocaleDateString("en-IN", { month: "long", year: "numeric" });
    if (!groups[key]) groups[key] = [];
    groups[key].push(e);
  });

  const sortedKeys = Object.keys(groups).sort((a, b) =>
    by === "month" ? new Date("1 " + b) - new Date("1 " + a) : a.localeCompare(b)
  );

  document.getElementById("expenseView").innerHTML = `<div style="padding:16px">` + sortedKeys.map((key, idx) => {
    const items = groups[key];
    const total = items.reduce((s, e) => s + Number(e.amount || 0), 0);
    const gid   = "grp-" + idx; // index-based id avoids any character-escaping issues
    return `
      <div class="group-header" data-toggle="${gid}">
        <span>${esc(key)} <span style="color:var(--text-faint);font-weight:400;font-size:0.78rem">(${items.length})</span></span>
        <span class="group-total">${inr(total)}</span>
      </div>
      <div class="group-body" id="${gid}">
        <table style="margin-bottom:8px">
          <thead><tr><th>Description</th><th>Date</th><th>Payment</th><th class="mono">Amount</th><th></th></tr></thead>
          <tbody>
            ${items.map(e => `
              <tr>
                <td>${esc(e.description) || `<span style="color:var(--text-faint)">—</span>`}</td>
                <td style="color:var(--text-muted)">${fmt(e.expense_date)}</td>
                <td>${payBadge(e.payment_type)}</td>
                <td class="mono debit">${inr(e.amount)}</td>
                <td><button class="btn btn-danger btn-sm btn-icon" data-id="${esc(e.id)}" data-action="delete" title="Delete">${icon("trash-2", 14)}</button></td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    `;
  }).join("") + `</div>`;

  document.querySelectorAll("[data-toggle]").forEach(el => {
    el.addEventListener("click", () => toggleGroup(el.dataset.toggle));
  });
  wireRowActions();
}

function wireRowActions() {
  document.querySelectorAll('[data-action="delete"]').forEach(btn => {
    btn.addEventListener("click", () => confirmDelete(Number(btn.dataset.id)));
  });
}

function switchTab(tab) {
  currentTab = tab;
  ["all", "tag", "month"].forEach(t => {
    document.getElementById("tab" + t.charAt(0).toUpperCase() + t.slice(1)).classList.toggle("active", t === tab);
  });
  renderView();
}

function applyFilter() { renderView(); }

function toggleGroup(id) {
  const el = document.getElementById(id);
  if (el) el.style.display = el.style.display === "none" ? "" : "none";
}

function confirmDelete(id) {
  deleteId = id;
  openModal("delModal");
}

async function handleDeleteExpense() {
  if (!deleteId) return;
  const btn = document.getElementById("confirmDelBtn");
  btn.disabled = true;
  btn.innerHTML = `${icon("refresh-cw", 14)} Deleting…`;
  try {
    const res = await apiFetch(`/expenses/delete_expense?expenseId=${deleteId}`, { method: "DELETE" });
    if (res && res.ok) {
      allExpenses = allExpenses.filter(e => e.id !== deleteId);
      renderStats();
      renderView();
      closeModal("delModal");
      showToast("Expense deleted.", "success");
    } else {
      showToast("Could not delete expense.", "error");
    }
  } catch {
    showToast("Network error.", "error");
  } finally {
    btn.innerHTML = `${icon("trash-2", 14)} Delete`;
    btn.disabled = false;
    deleteId = null;
  }
}

async function handleAddExpense(e) {
  e.preventDefault();
  const btn = document.getElementById("addBtn");

  const amountVal = document.getElementById("addAmount").value;
  const amountErrs = validateAmount(amountVal);
  if (amountErrs.length) { showToast(amountErrs[0], "error"); return; }

  if (!document.getElementById("addTag").value) { showToast("Please select a tag.", "error"); return; }

  btn.disabled = true;
  btn.innerHTML = `${icon("refresh-cw", 14)} Saving…`;

  const body = {
    tag_name:     document.getElementById("addTag").value,
    amount:       Number(amountVal),
    expense_date: document.getElementById("addDate").value,
    payment_type: document.getElementById("addPayment").value,
    description:  document.getElementById("addDesc").value.trim() || null,
  };

  try {
    const res = await apiFetch("/expenses/add_expenses", {
      method: "POST",
      body: JSON.stringify(body),
    });
    if (!res) return;
    const data = await res.json();
    if (res.ok) {
      closeModal("addModal");
      showToast("Expense added!", "success");
      document.getElementById("addForm").reset();
      document.getElementById("addDate").value = new Date().toISOString().split("T")[0];
      await loadExpenses();
    } else {
      showToast(data.detail || "Failed to add expense.", "error");
    }
  } catch {
    showToast("Network error.", "error");
  } finally {
    btn.innerHTML = `${icon("plus", 14)} Add Expense`;
    btn.disabled = false;
  }
}
