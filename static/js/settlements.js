// js/settlements.js
import { api } from "./api.js";
import { showToast, formatCurrency, formatDate, escapeHtml, closeModal } from "./utils.js";
import { countUp } from "./animations.js";

let allDebts = [];
let currentTab = "all";
let pendingDeleteId = null;
let pendingEditId = null;

export async function initSettlements() {
  bindStaticEvents();
  await loadDebts();
  loadStats();
}

function bindStaticEvents() {
  document.getElementById("addDebtForm")?.addEventListener("submit", handleAddSubmit);
  document.getElementById("editDebtForm")?.addEventListener("submit", handleEditSubmit);
  document.getElementById("confirmDebtDelBtn")?.addEventListener("click", handleConfirmDelete);

  const dateInput = document.getElementById("debtDate");
  if (dateInput) dateInput.value = new Date().toISOString().slice(0, 10);

  document.getElementById("tabAll")?.addEventListener("click", () => switchTab("all"));
  document.getElementById("tabPending")?.addEventListener("click", () => switchTab("pending"));
  document.getElementById("tabPaid")?.addEventListener("click", () => switchTab("paid"));
}

function switchTab(tab) {
  currentTab = tab;
  ["All", "Pending", "Paid"].forEach(t => {
    document.getElementById(`tab${t}`)?.classList.toggle("active", t.toLowerCase() === tab);
  });
  render();
}

async function loadDebts() {
  const view = document.getElementById("debtView");
  if (!view) return;
  view.innerHTML = `<div style="padding:24px"><div class="skel skel-row"></div><div class="skel skel-row"></div><div class="skel skel-row"></div></div>`;
  try {
    allDebts = await api.get("/settlements");
    if (!Array.isArray(allDebts)) allDebts = allDebts.items || [];
    render();
  } catch (err) {
    view.innerHTML = `<div class="empty"><h3>Couldn't load settlements</h3><p>${escapeHtml(err.message)}</p></div>`;
  }
}

async function loadStats() {
  const row = document.getElementById("debtStats");
  if (!row) return;
  try {
    const data = await api.get("/settlements/summary");
    const stats = [
      { cls: "r", label: "You Owe",        value: data.total_borrowed, foot: "Pending, borrowed" },
      { cls: "g", label: "Owed To You",    value: data.total_lent,     foot: "Pending, lent" },
      { cls: "a", label: "Net Position",   value: data.net_position,   foot: "Lent minus borrowed" },
      { cls: "b", label: "Settled Total",  value: data.total_settled,  foot: "All-time cleared" },
    ];
    row.innerHTML = stats.map((s, i) => `
      <div class="stat-card ${s.cls}" style="animation-delay:${i * 60}ms">
        <div class="stat-label">${s.label}</div>
        <div class="stat-val" id="debtStatVal${i}">₹0.00</div>
        <div class="stat-foot">${escapeHtml(s.foot)}</div>
      </div>
    `).join("");
    stats.forEach((s, i) => countUp(document.getElementById(`debtStatVal${i}`), Number(s.value) || 0));
  } catch {
    row.innerHTML = "";
  }
}

function render() {
  const view = document.getElementById("debtView");
  if (!view) return;
  const rows = allDebts.filter(d => currentTab === "all" || d.status === currentTab);

  if (!rows.length) {
    view.innerHTML = `
      <div class="empty">
        <div class="empty-icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="m11 17 2 2a1 1 0 1 0 3-3"/><path d="m14 14 2.5 2.5a1 1 0 1 0 3-3l-3.88-3.88a3 3 0 0 0-4.24 0l-.88.88a1 1 0 1 1-3-3l2.81-2.81a5.79 5.79 0 0 1 7.06-.87l.47.28a2 2 0 0 0 1.42.25L21 4"/></svg>
        </div>
        <h3>No settlements found</h3>
        <p>Add a record to start tracking who owes who.</p>
      </div>`;
    return;
  }

  view.innerHTML = `
    <table>
      <thead>
        <tr><th>Person</th><th>Type</th><th>Status</th><th>Date</th><th>Amount</th><th></th></tr>
      </thead>
      <tbody>
        ${rows.map(d => `
          <tr>
            <td>${escapeHtml(d.person_name)}</td>
            <td>${d.type === "lent"
              ? `<span class="badge bg">Owes Me</span>`
              : `<span class="badge br">I Owe</span>`}</td>
            <td>${d.status === "paid"
              ? `<span class="badge bs">Settled</span>`
              : `<span class="badge ba">Pending</span>`}</td>
            <td class="mono">${escapeHtml(formatDate(d.date))}</td>
            <td class="${d.type === "lent" ? "credit" : "debit"}">${formatCurrency(d.amount)}</td>
            <td style="display:flex;gap:4px">
              <button class="btn-icon" onclick="window.__editDebt('${d.id}')" aria-label="Edit">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>
              </button>
              <button class="btn-icon" onclick="window.__deleteDebt('${d.id}','${escapeHtml(d.person_name)}')" aria-label="Delete">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
              </button>
            </td>
          </tr>
        `).join("")}
      </tbody>
    </table>
  `;
}

/* ── Add ──────────────────────────────────────────────────────────────── */
async function handleAddSubmit(e) {
  e.preventDefault();
  const btn = document.getElementById("addDebtBtn");
  const payload = {
    person_name: document.getElementById("debtPerson").value.trim(),
    amount: parseFloat(document.getElementById("debtAmount").value),
    date: document.getElementById("debtDate").value,
    type: document.getElementById("debtType").value,
    status: document.getElementById("debtStatus").value,
  };

  btn.disabled = true;
  try {
    await api.post("/settlements", payload);
    showToast("Settlement added.", "success");
    closeModal("addDebtModal");
    document.getElementById("addDebtForm").reset();
    document.getElementById("debtDate").value = new Date().toISOString().slice(0, 10);
    await loadDebts();
    loadStats();
  } catch (err) {
    showToast(err.message || "Could not add settlement.", "error");
  } finally {
    btn.disabled = false;
  }
}

/* ── Edit ─────────────────────────────────────────────────────────────── */
window.__editDebt = (id) => {
  const debt = allDebts.find(d => String(d.id) === String(id));
  if (!debt) return;
  pendingEditId = id;
  document.getElementById("editPerson").value = debt.person_name;
  document.getElementById("editAmount").value = debt.amount;
  document.getElementById("editType").value = debt.type;
  document.getElementById("editStatus").value = debt.status;
  document.getElementById("editDebtModal")?.classList.add("open");
};

async function handleEditSubmit(e) {
  e.preventDefault();
  if (!pendingEditId) return;
  const btn = document.getElementById("editDebtBtn");
  const payload = {
    person_name: document.getElementById("editPerson").value.trim(),
    amount: parseFloat(document.getElementById("editAmount").value),
    type: document.getElementById("editType").value,
    status: document.getElementById("editStatus").value,
  };

  btn.disabled = true;
  try {
    await api.put(`/settlements/${pendingEditId}`, payload);
    showToast("Settlement updated.", "success");
    closeModal("editDebtModal");
    await loadDebts();
    loadStats();
  } catch (err) {
    showToast(err.message || "Could not update settlement.", "error");
  } finally {
    btn.disabled = false;
    pendingEditId = null;
  }
}

/* ── Delete ───────────────────────────────────────────────────────────── */
window.__deleteDebt = (id, name) => {
  pendingDeleteId = id;
  document.getElementById("delDebtName").textContent = name;
  document.getElementById("delDebtModal")?.classList.add("open");
};

async function handleConfirmDelete() {
  if (!pendingDeleteId) return;
  const btn = document.getElementById("confirmDebtDelBtn");
  btn.disabled = true;
  try {
    await api.delete(`/settlements/${pendingDeleteId}`);
    showToast("Settlement deleted.", "success");
    closeModal("delDebtModal");
    await loadDebts();
    loadStats();
  } catch (err) {
    showToast(err.message || "Could not delete settlement.", "error");
  } finally {
    btn.disabled = false;
    pendingDeleteId = null;
  }
}
