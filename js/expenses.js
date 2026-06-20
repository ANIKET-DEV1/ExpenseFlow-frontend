// js/expenses.js
import { api } from "./api.js";
import { showToast, formatCurrency, formatDate, escapeHtml, closeModal } from "./utils.js";
import { countUp } from "./animations.js";

let allExpenses = [];
let allTags = [];
let currentTab = "all";
let pendingDeleteId = null;

export async function initExpenses() {
  bindStaticEvents();
  await Promise.all([loadTags(), loadExpenses()]);
  loadStats();
}

function bindStaticEvents() {
  document.getElementById("addForm")?.addEventListener("submit", handleAddSubmit);
  document.getElementById("confirmDelBtn")?.addEventListener("click", handleConfirmDelete);

  // Default the add-expense date field to today.
  const dateInput = document.getElementById("addDate");
  if (dateInput) dateInput.value = new Date().toISOString().slice(0, 10);
}

async function loadTags() {
  try {
    allTags = await api.get("/tags");
    const select = document.getElementById("addTag");
    if (select) {
      select.innerHTML = allTags.map(t => `<option value="${t.id}">${escapeHtml(t.name)}</option>`).join("");
    }
  } catch {
    allTags = [];
  }
}

async function loadExpenses() {
  const view = document.getElementById("expenseView");
  if (!view) return;
  view.innerHTML = `<div style="padding:24px"><div class="skel skel-row"></div><div class="skel skel-row"></div><div class="skel skel-row"></div></div>`;
  try {
    allExpenses = await api.get("/expenses?sort=-date");
    if (!Array.isArray(allExpenses)) allExpenses = allExpenses.items || [];
    renderCurrentView();
  } catch (err) {
    view.innerHTML = `<div class="empty"><h3>Couldn't load expenses</h3><p>${escapeHtml(err.message)}</p></div>`;
  }
}

async function loadStats() {
  const row = document.getElementById("expenseStats");
  if (!row) return;
  try {
    const data = await api.get("/expenses/stats");
    const stats = [
      { cls: "r", label: "Total Spent",   value: data.total,       foot: "All time" },
      { cls: "a", label: "This Month",    value: data.this_month,  foot: "Current month" },
      { cls: "g", label: "Avg / Expense", value: data.average,     foot: `${data.count ?? 0} entries` },
      { cls: "b", label: "Largest",       value: data.largest,     foot: "Single expense" },
    ];
    row.innerHTML = stats.map((s, i) => `
      <div class="stat-card ${s.cls}" style="animation-delay:${i * 60}ms">
        <div class="stat-label">${s.label}</div>
        <div class="stat-val" id="expStatVal${i}">₹0.00</div>
        <div class="stat-foot">${escapeHtml(s.foot)}</div>
      </div>
    `).join("");
    stats.forEach((s, i) => countUp(document.getElementById(`expStatVal${i}`), Number(s.value) || 0));
  } catch {
    row.innerHTML = "";
  }
}

/* ── View switching (All / By Tag / By Month) ─────────────────────────── */
export function switchTab(tab) {
  currentTab = tab;
  ["All", "Tag", "Month"].forEach(t => {
    document.getElementById(`tab${t}`)?.classList.toggle("active", t.toLowerCase() === tab);
  });
  renderCurrentView();
}
window.switchTab = switchTab;

export function applyFilter() {
  renderCurrentView();
}
window.applyFilter = applyFilter;

function getFiltered() {
  const q = (document.getElementById("searchInp")?.value || "").trim().toLowerCase();
  const pay = document.getElementById("payFilter")?.value || "";
  return allExpenses.filter(exp => {
    const matchesQ = !q || (exp.description || "").toLowerCase().includes(q) || (exp.tag_name || "").toLowerCase().includes(q);
    const matchesPay = !pay || exp.payment_type === pay;
    return matchesQ && matchesPay;
  });
}

function renderCurrentView() {
  const view = document.getElementById("expenseView");
  if (!view) return;
  const filtered = getFiltered();

  if (!filtered.length) {
    view.innerHTML = `
      <div class="empty">
        <div class="empty-icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/></svg>
        </div>
        <h3>No expenses found</h3>
        <p>Try adjusting your filters, or add your first expense.</p>
      </div>`;
    return;
  }

  if (currentTab === "all") renderTable(filtered);
  else if (currentTab === "tag") renderGrouped(filtered, exp => exp.tag_name || "Untagged");
  else renderGrouped(filtered, exp => monthLabel(exp.date));
}

function renderTable(rows) {
  const view = document.getElementById("expenseView");
  view.innerHTML = `
    <table>
      <thead>
        <tr><th>Description</th><th>Tag</th><th>Method</th><th>Date</th><th>Amount</th><th></th></tr>
      </thead>
      <tbody>
        ${rows.map(exp => `
          <tr>
            <td>${escapeHtml(exp.description || "—")}</td>
            <td><span class="badge ba">${escapeHtml(exp.tag_name || "—")}</span></td>
            <td>${escapeHtml(paymentLabel(exp.payment_type))}</td>
            <td class="mono">${escapeHtml(formatDate(exp.date))}</td>
            <td class="debit">-${formatCurrency(exp.amount)}</td>
            <td><button class="btn-icon" onclick="window.__deleteExpense('${exp.id}')" aria-label="Delete">
              <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
            </button></td>
          </tr>
        `).join("")}
      </tbody>
    </table>
  `;
}

function renderGrouped(rows, keyFn) {
  const groups = {};
  rows.forEach(exp => {
    const key = keyFn(exp);
    (groups[key] = groups[key] || []).push(exp);
  });

  const view = document.getElementById("expenseView");
  view.innerHTML = `<div style="padding:18px">` + Object.entries(groups).map(([key, items], idx) => {
    const total = items.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
    return `
      <div class="group-header" onclick="window.__toggleGroup(${idx})">
        <span>${escapeHtml(key)} <span style="color:var(--text-faint);font-weight:400">(${items.length})</span></span>
        <span class="group-total">${formatCurrency(total)}</span>
      </div>
      <div class="group-body" id="group${idx}">
        <table>
          <tbody>
            ${items.map(exp => `
              <tr>
                <td>${escapeHtml(exp.description || "—")}</td>
                <td><span class="badge ba">${escapeHtml(exp.tag_name || "—")}</span></td>
                <td class="mono">${escapeHtml(formatDate(exp.date))}</td>
                <td class="debit">-${formatCurrency(exp.amount)}</td>
                <td><button class="btn-icon" onclick="window.__deleteExpense('${exp.id}')" aria-label="Delete">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                </button></td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    `;
  }).join("") + `</div>`;
}

window.__toggleGroup = (idx) => {
  const el = document.getElementById(`group${idx}`);
  el?.classList.toggle("collapsed");
  if (el) el.style.display = el.style.display === "none" ? "block" : "none";
};

function monthLabel(dateStr) {
  const d = new Date(dateStr);
  if (isNaN(d)) return "Unknown";
  return d.toLocaleDateString("en-IN", { month: "long", year: "numeric" });
}

function paymentLabel(type) {
  return { CASH: "Cash", UPI: "UPI", CARD: "Card" }[type] || type || "—";
}

/* ── Add expense ──────────────────────────────────────────────────────── */
async function handleAddSubmit(e) {
  e.preventDefault();
  const btn = document.getElementById("addBtn");
  const payload = {
    tag_id: document.getElementById("addTag").value,
    amount: parseFloat(document.getElementById("addAmount").value),
    date: document.getElementById("addDate").value,
    payment_type: document.getElementById("addPayment").value,
    description: document.getElementById("addDesc").value.trim() || null,
  };

  btn.disabled = true;
  try {
    await api.post("/expenses", payload);
    showToast("Expense added.", "success");
    closeModal("addModal");
    document.getElementById("addForm").reset();
    document.getElementById("addDate").value = new Date().toISOString().slice(0, 10);
    await loadExpenses();
    loadStats();
  } catch (err) {
    showToast(err.message || "Could not add expense.", "error");
  } finally {
    btn.disabled = false;
  }
}

/* ── Delete expense ───────────────────────────────────────────────────── */
window.__deleteExpense = (id) => {
  pendingDeleteId = id;
  document.getElementById("delModal")?.classList.add("open");
};

async function handleConfirmDelete() {
  if (!pendingDeleteId) return;
  const btn = document.getElementById("confirmDelBtn");
  btn.disabled = true;
  try {
    await api.delete(`/expenses/${pendingDeleteId}`);
    showToast("Expense deleted.", "success");
    closeModal("delModal");
    await loadExpenses();
    loadStats();
  } catch (err) {
    showToast(err.message || "Could not delete expense.", "error");
  } finally {
    btn.disabled = false;
    pendingDeleteId = null;
  }
}
