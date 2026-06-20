// js/utils.js
// Renders the shared top navbar + sidebar on every authenticated page,
// so the chrome feels like one persistent app shell (SPA-style) even
// though each page is its own .html file. Also holds modal/toast helpers
// used across dashboard, expenses, settlements, tags.

import { BASE_URL } from "./api.js";
import { initRipples } from "./animations.js";

// Ripple effect is a global micro-interaction — wire it up as soon as utils.js loads,
// so every page that imports utils.js gets it for free.
initRipples();

const NAV_ITEMS = [
  { href: "dashboard.html",   label: "Dashboard",   icon: iconGrid() },
  { href: "expenses.html",    label: "Expenses",    icon: iconWallet() },
  { href: "settlements.html", label: "Settlements", icon: iconHandshake() },
  { href: "tags.html",        label: "Tags Manager", icon: iconTag() },
];

function currentPage() {
  return window.location.pathname.split("/").pop() || "dashboard.html";
}

function initials(name) {
  if (!name) return "?";
  return name.trim().slice(0, 2).toUpperCase();
}

/** Renders the fixed top navbar into #global-navbar. Safe to call once per page. */
export function renderNavbar(user) {
  const nav = document.getElementById("global-navbar");
  if (!nav) return;
  const page = currentPage();

  nav.innerHTML = `
    <button class="menu-btn" id="menuBtn" aria-label="Open menu">
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="18" y2="18"/></svg>
    </button>
    <a href="dashboard.html" class="topnav-logo">
      <span class="licon">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/><path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/><path d="M18 12a2 2 0 0 0 0 4h4v-4Z"/></svg>
      </span>
      ExpenseFlow
    </a>
    <div class="topnav-links">
      ${NAV_ITEMS.map(item => `
        <a href="${item.href}" class="topnav-link${page === item.href ? " active" : ""}">${item.label}</a>
      `).join("")}
    </div>
    <div class="topnav-right">
      <span class="status-pill">Secure Session</span>
      <div class="profile-wrap" id="profileWrap">
        <button class="profile-btn" id="profileBtn">${initials(user?.username)}</button>
        <div class="profile-dropdown" id="profileDropdown">
          <div class="pd-header">
            <div class="pd-name">${escapeHtml(user?.username || "Account")}</div>
            <div class="pd-sub">${escapeHtml(user?.email || "")}</div>
          </div>
          <a href="profile.html" class="pd-link">
            <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            My Profile
          </a>
          <div class="pd-link danger" id="signOutBtn">
            <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/></svg>
            Sign Out
          </div>
        </div>
      </div>
    </div>
  `;

  // Profile dropdown toggle
  const profileBtn = document.getElementById("profileBtn");
  const dropdown = document.getElementById("profileDropdown");
  profileBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    profileBtn.classList.toggle("open");
    dropdown.classList.toggle("open");
  });
  document.addEventListener("click", () => {
    profileBtn.classList.remove("open");
    dropdown.classList.remove("open");
  });

  // Sign out
  document.getElementById("signOutBtn").addEventListener("click", async () => {
    try {
      await fetch(`${BASE_URL}/auth/logout`, { method: "POST", credentials: "include" });
    } catch { /* ignore network errors on logout */ }
    window.location.href = "login.html";
  });

  // Mobile hamburger opens the sidebar drawer
  const menuBtn = document.getElementById("menuBtn");
  if (menuBtn) {
    menuBtn.addEventListener("click", () => {
      document.getElementById("sidebar")?.classList.add("mobile-open");
      document.getElementById("sidebarBackdrop")?.classList.add("show");
    });
  }
}

/** Renders the persistent left sidebar into #sidebar. Safe to call once per page. */
export function renderSidebar(user) {
  const sidebar = document.getElementById("sidebar");
  if (!sidebar) return;
  const page = currentPage();

  sidebar.innerHTML = `
    <div class="nav-section">
      <div class="nav-label">Workspace</div>
      ${NAV_ITEMS.map(item => `
        <a href="${item.href}" class="nav-link${page === item.href ? " active" : ""}">
          ${item.icon}
          <span>${item.label}</span>
        </a>
      `).join("")}
    </div>
    <div class="nav-section">
      <div class="nav-label">Account</div>
      <a href="profile.html" class="nav-link${page === "profile.html" ? " active" : ""}">
        ${iconUser()}
        <span>My Profile</span>
      </a>
    </div>
    <div class="sidebar-foot">
      <div class="sidebar-user">
        <div class="avatar">${initials(user?.username)}</div>
        <div>
          <div class="name">${escapeHtml(user?.username || "Account")}</div>
          <div class="sub">Member</div>
        </div>
      </div>
      <div class="sidebar-signout" id="sidebarSignOut">
        ${iconLogout()}
        <span>Sign Out</span>
      </div>
    </div>
  `;

  document.getElementById("sidebarSignOut")?.addEventListener("click", async () => {
    try {
      await fetch(`${BASE_URL}/auth/logout`, { method: "POST", credentials: "include" });
    } catch { /* ignore */ }
    window.location.href = "login.html";
  });

  // Backdrop closes the mobile drawer
  const backdrop = document.getElementById("sidebarBackdrop");
  if (backdrop) {
    backdrop.addEventListener("click", () => {
      sidebar.classList.remove("mobile-open");
      backdrop.classList.remove("show");
    });
  }
}

/* ── Modal helpers (used via inline onclick="openModal('id')" in the HTML) ── */
export function openModal(id) {
  document.getElementById(id)?.classList.add("open");
}
export function closeModal(id) {
  document.getElementById(id)?.classList.remove("open");
}
// Expose globally since the HTML markup calls these via inline onclick attributes.
window.openModal = window.openModal || openModal;
window.closeModal = window.closeModal || closeModal;

// Click outside modal content closes it; Escape closes the topmost open modal.
document.addEventListener("click", (e) => {
  if (e.target.classList.contains("overlay") && e.target.classList.contains("open")) {
    e.target.classList.remove("open");
  }
});
document.addEventListener("keydown", (e) => {
  if (e.key !== "Escape") return;
  document.querySelectorAll(".overlay.open").forEach((el) => el.classList.remove("open"));
});

/* ── Toast helper ─────────────────────────────────────────────────────── */
function ensureToastArea() {
  let area = document.getElementById("toast-area");
  if (!area) {
    area = document.createElement("div");
    area.id = "toast-area";
    document.body.appendChild(area);
  }
  return area;
}

const TOAST_ICONS = {
  success: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>`,
  error:   `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>`,
  info:    `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>`,
};

export function showToast(message, type = "info", duration = 3800) {
  const area = ensureToastArea();
  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <span class="toast-icon-wrap">${TOAST_ICONS[type] || TOAST_ICONS.info}</span>
    <span class="toast-msg">${escapeHtml(message)}</span>
    <button class="toast-close" aria-label="Dismiss">
      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
    </button>
  `;
  area.appendChild(toast);

  const remove = () => {
    toast.classList.add("toast-out");
    setTimeout(() => toast.remove(), 240);
  };
  toast.querySelector(".toast-close").addEventListener("click", remove);
  setTimeout(remove, duration);
}

/* ── Misc shared helpers ─────────────────────────────────────────────── */
export function escapeHtml(str) {
  if (str == null) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export function formatCurrency(amount, decimals = 2) {
  const n = Number(amount) || 0;
  return `₹${n.toLocaleString("en-IN", { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}`;
}

export function formatDate(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isNaN(d)) return dateStr;
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

/* ── Inline icon helpers (kept here so utils.js has no extra deps) ──────── */
function iconGrid() {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="7" height="7" x="3" y="3" rx="1"/><rect width="7" height="7" x="14" y="3" rx="1"/><rect width="7" height="7" x="14" y="14" rx="1"/><rect width="7" height="7" x="3" y="14" rx="1"/></svg>`;
}
function iconWallet() {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/><path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/><path d="M18 12a2 2 0 0 0 0 4h4v-4Z"/></svg>`;
}
function iconHandshake() {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m11 17 2 2a1 1 0 1 0 3-3"/><path d="m14 14 2.5 2.5a1 1 0 1 0 3-3l-3.88-3.88a3 3 0 0 0-4.24 0l-.88.88a1 1 0 1 1-3-3l2.81-2.81a5.79 5.79 0 0 1 7.06-.87l.47.28a2 2 0 0 0 1.42.25L21 4"/><path d="m21 3 1 11h-2"/><path d="M3 3 2 14l6.5 6.5a1 1 0 1 0 3-3"/><path d="M3 4h8"/></svg>`;
}
function iconTag() {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8.704 8.704a2.426 2.426 0 0 0 3.42 0l6.58-6.58a2.426 2.426 0 0 0 0-3.42z"/><circle cx="7.5" cy="7.5" r="1.5"/></svg>`;
}
function iconUser() {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`;
}
function iconLogout() {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/></svg>`;
}
