/**
 * dashboard.js
 *
 * Uses fetchExpenses() and fetchDebts() from api.js so both calls hit the
 * in-memory cache if the data was already loaded by another page in the same
 * session. The navbar is rendered via renderNavbar() from utils.js.
 */

import { fetchExpenses, fetchDebts, fetchUser } from "./api.js";
import { showToast, inr, esc, fmt, renderNavbar, renderSidebar, showFlash } from "./utils.js";
import { icon }      from "./icons.js";
import { staggerIn } from "./animations.js";

export async function initDashboard() {
  showFlash();

  const user = await fetchUser();   // cached after first call; redirects on 401
  if (!user) return;

  renderNavbar(user);
  renderSidebar();

  await loadDashboard();
  return user;   // returned so dashboard.html can set the personalised greeting
}

async function loadDashboard() {
  try {
    const [expenses, debts] = await Promise.all([fetchExpenses(), fetchDebts()]);

    renderStats(expenses, debts);
    renderRecent(expenses);
    renderTagBreakdown(expenses);
    renderDebtStats(debts);
    staggerIn(".stat-card");
  } catch (err) {
    clearSkeletons();
    showToast("Could not load dashboard data.", "error");
  }
}

function clearSkeletons() {
  const empty = `<div class="empty" style="grid-column:1/-1"><p>Could not load stats.</p></div>`;
  ["statRow", "recentList", "tagBreakdown", "debtStats"].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.innerHTML = empty;
  });
}

function renderStats(expenses, debts) {
  const total = expenses.reduce((s, e) => s + Number(e.amount || 0), 0);
  const now = new Date();
  const thisMonth = expenses
    .filter(e => {
      const d = new Date(e.expense_date);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    })
    .reduce((s, e) => s + Number(e.amount || 0), 0);

  const youOwe = debts
    .filter(d => d.debt_type === "borrowed" && d.debt_status === "pending")
    .reduce((s, d) => s + Number(d.amount || 0), 0);
  const owedToYou = debts
    .filter(d => d.debt_type === "lent" && d.debt_status === "pending")
    .reduce((s, d) => s + Number(d.amount || 0), 0);

  document.getElementById("statRow").innerHTML = `
    <div class="stat-card g">
      <div class="stat-icon-wrap">${icon("wallet", 20)}</div>
      <div class="stat-label">Total Spent</div>
      <div class="stat-val">${inr(total)}</div>
    </div>
    <div class="stat-card r">
      <div class="stat-icon-wrap">${icon("calendar", 20)}</div>
      <div class="stat-label">This Month</div>
      <div class="stat-val">${inr(thisMonth)}</div>
    </div>
    <div class="stat-card a">
      <div class="stat-icon-wrap">${icon("arrow-up-right", 20)}</div>
      <div class="stat-label">You Owe</div>
      <div class="stat-val">${inr(youOwe)}</div>
    </div>
    <div class="stat-card b">
      <div class="stat-icon-wrap">${icon("arrow-down-left", 20)}</div>
      <div class="stat-label">Owed to You</div>
      <div class="stat-val">${inr(owedToYou)}</div>
    </div>
  `;
}

function renderRecent(expenses) {
  const recent = [...expenses]
    .sort((a, b) => new Date(b.expense_date) - new Date(a.expense_date))
    .slice(0, 6);

  if (!recent.length) {
    document.getElementById("recentList").innerHTML = `
      <div class="empty">
        <div class="empty-icon">${icon("credit-card", 36)}</div>
        <h3>No expenses yet</h3>
        <p><a href="expenses.html" style="color:var(--green)">Add your first expense →</a></p>
      </div>`;
    return;
  }
  document.getElementById("recentList").innerHTML = recent.map(e => `
    <div class="recent-item">
      <div class="recent-dot"></div>
      <div class="recent-text">
        <div style="font-weight:500;font-size:0.84rem">${esc(e.tag_name)}</div>
        <div class="recent-date">${fmt(e.expense_date)}</div>
      </div>
      <div class="recent-amt debit">${inr(e.amount)}</div>
    </div>
  `).join("");
}

function renderTagBreakdown(expenses) {
  if (!expenses.length) {
    document.getElementById("tagBreakdown").innerHTML = `
      <div class="empty">
        <div class="empty-icon">${icon("bar-chart", 36)}</div>
        <h3>No data yet</h3>
        <p>Expenses will appear here once added.</p>
      </div>`;
    return;
  }
  const map = {};
  expenses.forEach(e => { map[e.tag_name] = (map[e.tag_name] || 0) + Number(e.amount || 0); });
  const total  = Object.values(map).reduce((s, v) => s + v, 0);
  const sorted = Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 6);

  document.getElementById("tagBreakdown").innerHTML = sorted.map(([tag, amt]) => {
    const pct = total > 0 ? Math.round((amt / total) * 100) : 0;
    return `
      <div style="margin-bottom:12px">
        <div style="display:flex;justify-content:space-between;font-size:0.82rem;margin-bottom:5px">
          <span style="font-weight:500">${esc(tag)}</span>
          <span class="mono debit">${inr(amt)}</span>
        </div>
        <div style="height:5px;background:var(--surface2);border-radius:4px;overflow:hidden">
          <div style="height:100%;width:${pct}%;background:var(--green);border-radius:4px;transition:width 0.6s ease"></div>
        </div>
      </div>
    `;
  }).join("");
}

function renderDebtStats(debts) {
  const pending = debts.filter(d => d.debt_status === "pending").length;
  const paid    = debts.filter(d => d.debt_status === "paid").length;
  document.getElementById("debtStats").innerHTML = `
    <div class="stat-card a">
      <div class="stat-icon-wrap">${icon("clock", 20)}</div>
      <div class="stat-label">Pending Settlements</div>
      <div class="stat-val">${pending}</div>
    </div>
    <div class="stat-card g">
      <div class="stat-icon-wrap">${icon("check-circle", 20)}</div>
      <div class="stat-label">Settled</div>
      <div class="stat-val">${paid}</div>
    </div>
  `;
}
