// js/dashboard.js
import { fetchUser, api } from "./api.js";
import { renderNavbar, renderSidebar, formatCurrency, formatDate, showToast, escapeHtml } from "./utils.js";
import { countUp, stagger } from "./animations.js";

/**
 * Boots the dashboard: auth guard, renders shared navbar/sidebar, then loads
 * stats, recent expenses, tag breakdown, and settlement summary in parallel.
 * Returns the user object (or null if not authenticated) — dashboard.html
 * uses this to build the "Good morning, X" greeting itself.
 */
export async function initDashboard() {
  const user = await fetchUser();
  if (!user) return null;

  renderNavbar(user);
  renderSidebar(user);
  showFlashIfAny();

  // Fire all data loads independently so one slow/failed endpoint doesn't block the rest.
  loadStats();
  loadRecentExpenses();
  loadTagBreakdown();
  loadSettlementSummary();

  return user;
}

function showFlashIfAny() {
  const msg = sessionStorage.getItem("flash");
  if (!msg) return;
  sessionStorage.removeItem("flash");
  const banner = document.getElementById("flashBanner");
  const text = document.getElementById("flashText");
  if (banner && text) {
    text.textContent = msg;
    banner.classList.add("show");
    setTimeout(() => banner.classList.remove("show"), 5000);
  }
}

async function loadStats() {
  const row = document.getElementById("statRow");
  if (!row) return;
  try {
    const data = await api.get("/dashboard/summary");
    const stats = [
      { cls: "g", label: "Total Logged", value: data.total_expenses, icon: iconWallet(), foot: `${data.expense_count ?? 0} expenses logged` },
      { cls: "r", label: "Owed By You",  value: data.total_borrowed, icon: iconArrowDown(), foot: "Owed by you to peers" },
      { cls: "a", label: "Owed To You",  value: data.total_lent,     icon: iconArrowUp(), foot: "Owed to you by peers" },
      { cls: "b", label: "Net Position", value: data.net_position,   icon: iconScale(), foot: "Lent minus borrowed" },
    ];
    row.innerHTML = stats.map((s, i) => `
      <div class="stat-card ${s.cls}" style="animation-delay:${i * 60}ms">
        <div class="stat-icon-wrap">${s.icon}</div>
        <div class="stat-label">${s.label}</div>
        <div class="stat-val" id="statVal${i}">₹0.00</div>
        <div class="stat-foot">${escapeHtml(s.foot)}</div>
      </div>
    `).join("");
    stats.forEach((s, i) => countUp(document.getElementById(`statVal${i}`), Number(s.value) || 0));
  } catch (err) {
    row.innerHTML = `<div class="empty"><p>Couldn't load your summary. ${escapeHtml(err.message)}</p></div>`;
  }
}

async function loadRecentExpenses() {
  const list = document.getElementById("recentList");
  if (!list) return;
  try {
    const expenses = await api.get("/expenses?limit=5&sort=-date");
    const items = Array.isArray(expenses) ? expenses : expenses.items || [];
    if (!items.length) {
      list.innerHTML = `<div class="empty"><p>No expenses logged yet.</p></div>`;
      return;
    }
    list.innerHTML = items.slice(0, 5).map(exp => `
      <div class="recent-item">
        <span class="recent-dot"></span>
        <div class="recent-text">
          ${escapeHtml(exp.description || exp.tag_name || "Expense")}
          <div class="recent-tag">${escapeHtml(exp.tag_name || "")} · ${escapeHtml(formatDate(exp.date))}</div>
        </div>
        <div class="recent-amt">-${formatCurrency(exp.amount)}</div>
      </div>
    `).join("");
  } catch (err) {
    list.innerHTML = `<div class="empty"><p>Couldn't load recent expenses.</p></div>`;
  }
}

async function loadTagBreakdown() {
  const el = document.getElementById("tagBreakdown");
  if (!el) return;
  try {
    const breakdown = await api.get("/expenses/by-tag");
    const items = Array.isArray(breakdown) ? breakdown : breakdown.items || [];
    if (!items.length) {
      el.innerHTML = `<div class="empty"><p>No tagged expenses yet.</p></div>`;
      return;
    }
    const max = Math.max(...items.map(i => Number(i.total) || 0), 1);
    el.innerHTML = items.slice(0, 6).map(item => `
      <div class="recent-item" style="flex-direction:column;align-items:stretch;gap:6px">
        <div style="display:flex;justify-content:space-between;font-size:0.84rem">
          <span>${escapeHtml(item.tag_name)}</span>
          <span class="mono">${formatCurrency(item.total)}</span>
        </div>
        <div style="height:6px;background:var(--surface2);border-radius:4px;overflow:hidden">
          <div style="height:100%;width:${Math.max(4, (Number(item.total) / max) * 100)}%;background:var(--gold);border-radius:4px"></div>
        </div>
      </div>
    `).join("");
  } catch {
    el.innerHTML = `<div class="empty"><p>Couldn't load tag breakdown.</p></div>`;
  }
}

async function loadSettlementSummary() {
  const el = document.getElementById("debtStats");
  if (!el) return;
  try {
    const data = await api.get("/settlements/summary");
    el.innerHTML = `
      <div class="stat-card r" style="margin-bottom:0">
        <div class="stat-label">You Owe</div>
        <div class="stat-val" id="debtVal0">₹0.00</div>
      </div>
      <div class="stat-card g" style="margin-bottom:0">
        <div class="stat-label">Owed To You</div>
        <div class="stat-val" id="debtVal1">₹0.00</div>
      </div>
    `;
    countUp(document.getElementById("debtVal0"), Number(data.total_borrowed) || 0);
    countUp(document.getElementById("debtVal1"), Number(data.total_lent) || 0);
  } catch {
    el.innerHTML = `<div class="empty"><p>Couldn't load settlement summary.</p></div>`;
  }
}

/* ── Inline icons ─────────────────────────────────────────────────────── */
function iconWallet() { return `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/><path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/><path d="M18 12a2 2 0 0 0 0 4h4v-4Z"/></svg>`; }
function iconArrowDown() { return `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14"/><path d="m19 12-7 7-7-7"/></svg>`; }
function iconArrowUp() { return `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 19V5"/><path d="m5 12 7-7 7 7"/></svg>`; }
function iconScale() { return `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 16h6"/><path d="M2 16h6"/><path d="M9 8l3-6 3 6"/><path d="m17 16-3-8-3 8"/><path d="M2 16c0 1.7 1.3 3 3 3s3-1.3 3-3"/><path d="M16 16c0 1.7 1.3 3 3 3s3-1.3 3-3"/></svg>`; }
