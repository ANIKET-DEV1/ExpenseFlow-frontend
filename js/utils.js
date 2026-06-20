import { BASE_URL } from "./api.js";
import { icon } from "./icons.js";

// ── Inject cursor elements once ───────────────────
(function injectCursor() {
  if (document.getElementById("cursor-dot")) return;
  const dot  = document.createElement("div"); dot.id  = "cursor-dot";
  const ring = document.createElement("div"); ring.id = "cursor-ring";
  document.body.appendChild(dot);
  document.body.appendChild(ring);
})();

// ── Toast notifications ───────────────────────────
let toastArea = null;
function getArea() {
  if (!toastArea) {
    toastArea = document.createElement("div");
    toastArea.id = "toast-area";
    document.body.appendChild(toastArea);
  }
  return toastArea;
}

export function showToast(msg, type = "info") {
  const iconMap = { success: "check-circle", error: "alert-circle", info: "info" };
  const t = document.createElement("div");
  t.className = `toast toast-${type}`;
  t.innerHTML = `
    <span class="toast-icon-wrap">${icon(iconMap[type] || "info", 16)}</span>
    <span class="toast-msg"></span>
    <button class="toast-close" type="button" aria-label="Dismiss">${icon("x", 14)}</button>
  `;
  // Use textContent to safely set the message
  t.querySelector(".toast-msg").textContent = msg;
  t.querySelector(".toast-close").addEventListener("click", () => t.remove());
  getArea().appendChild(t);
  setTimeout(() => {
    t.classList.add("toast-out");
    setTimeout(() => t.remove(), 250);
  }, 3500);
}

// ── XSS guard ─────────────────────────────────────
export function esc(str) {
  if (str == null) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// ── Money ──────────────────────────────────────────
export function inr(n) {
  const num = Number(n);
  return "₹" + (Number.isFinite(num) ? num : 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// ── Date ──────────────────────────────────────────
export function fmt(d) {
  if (!d) return "—";
  const date = new Date(d);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

// ── API fetch wrapper ──────────────────────────────
export async function apiFetch(path, opts = {}) {
  let res;
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      credentials: "include",
      headers: { "Content-Type": "application/json", ...(opts.headers || {}) },
      ...opts,
    });
  } catch {
    showToast("Could not reach the server. Check your connection.", "error");
    return null;
  }
  if (res.status === 401) {
    sessionStorage.setItem("flash", "Session expired. Please log in again.");
    window.location.href = "login.html";
    return null;
  }
  return res;
}

// ── Auth guard ─────────────────────────────────────
export async function requireAuth() {
  try {
    const res = await fetch(`${BASE_URL}/auth/me`, { credentials: "include" });
    const d = await res.json();
    if (res.ok && d.authenticated) return d.user;
  } catch {}
  sessionStorage.setItem("flash", "Please log in to continue.");
  window.location.href = "login.html";
  return null;
}

// ── Logout ─────────────────────────────────────────
export async function logout() {
  try { await apiFetch("/auth/logout", { method: "POST" }); } catch {}
  sessionStorage.removeItem("flash");
  window.location.href = "index.html";
}

// ── Active nav link ────────────────────────────────
export function setActive() {
  const page = location.pathname.split("/").pop() || "index.html";
  document.querySelectorAll("[data-nav]").forEach(el => {
    el.classList.toggle("active", el.dataset.nav === page);
  });
}

// ── Top navbar ─────────────────────────────────────
export function renderTopnav(user) {
  const nav = document.getElementById("topnav");
  if (!nav) return;
  const init = esc(user.username[0].toUpperCase());
  nav.innerHTML = `
    <button class="menu-btn" id="menuBtn" type="button" aria-label="Open menu">${icon("menu", 20)}</button>
    <div class="topnav-logo">
      <div class="licon">${icon("wallet", 18)}</div>
      ExpenseTracker
    </div>
    <div class="topnav-links">
      <a href="dashboard.html"   class="topnav-link" data-nav="dashboard.html">${icon("layout-dashboard", 15)} Dashboard</a>
      <a href="expenses.html"    class="topnav-link" data-nav="expenses.html">${icon("credit-card", 15)} Expenses</a>
      <a href="tags.html"        class="topnav-link" data-nav="tags.html">${icon("tag", 15)} Tags</a>
      <a href="settlements.html" class="topnav-link" data-nav="settlements.html">${icon("handshake", 15)} Settlements</a>
    </div>
    <div class="topnav-right">
      <div class="profile-wrap">
        <button class="profile-btn" id="profileBtn" type="button" title="${esc(user.username)}">${init}</button>
        <div class="profile-dropdown" id="profileDrop">
          <div class="pd-header">
            <div class="pd-name">${esc(user.username)}</div>
            <div class="pd-sub">${esc(user.email || "")}</div>
          </div>
          <a href="dashboard.html"   class="pd-link">${icon("layout-dashboard", 15)} Dashboard</a>
          <a href="expenses.html"    class="pd-link">${icon("credit-card", 15)} Expenses</a>
          <a href="tags.html"        class="pd-link">${icon("tag", 15)} Tags</a>
          <a href="settlements.html" class="pd-link">${icon("handshake", 15)} Settlements</a>
          <button class="pd-link danger" id="logoutBtn" type="button" style="width:100%;text-align:left">${icon("log-out", 15)} Logout</button>
        </div>
      </div>
    </div>
  `;
  setActive();

  const btn  = document.getElementById("profileBtn");
  const drop = document.getElementById("profileDrop");
  btn.addEventListener("click", e => {
    e.stopPropagation();
    const open = drop.classList.toggle("open");
    btn.classList.toggle("open", open);
  });
  document.addEventListener("click", () => {
    drop.classList.remove("open");
    btn.classList.remove("open");
  });
  document.getElementById("logoutBtn").addEventListener("click", logout);
  document.getElementById("menuBtn").addEventListener("click", () => {
    document.dispatchEvent(new CustomEvent("open-mobile-sidebar"));
  });
}

// ── Sidebar ────────────────────────────────────────
export function renderSidebar() {
  const sb = document.getElementById("sidebar");
  if (!sb) return;
  sb.innerHTML = `
    <div class="nav-section">
      <div class="nav-label">Overview</div>
      <a href="dashboard.html" class="nav-link" data-nav="dashboard.html">${icon("layout-dashboard", 16)} Dashboard</a>
    </div>
    <div class="nav-section">
      <div class="nav-label">Finances</div>
      <a href="expenses.html"    class="nav-link" data-nav="expenses.html">${icon("credit-card", 16)} Expenses</a>
      <a href="tags.html"        class="nav-link" data-nav="tags.html">${icon("tag", 16)} Tags</a>
      <a href="settlements.html" class="nav-link" data-nav="settlements.html">${icon("handshake", 16)} Settlements</a>
    </div>
  `;
  setActive();

  let backdrop = document.getElementById("sidebarBackdrop");
  if (!backdrop) {
    backdrop = document.createElement("div");
    backdrop.id = "sidebarBackdrop";
    backdrop.className = "sidebar-backdrop";
    document.body.appendChild(backdrop);
  }

  function openDrawer()  { sb.classList.add("mobile-open");    backdrop.classList.add("show"); }
  function closeDrawer() { sb.classList.remove("mobile-open"); backdrop.classList.remove("show"); }

  document.addEventListener("open-mobile-sidebar", openDrawer);
  backdrop.addEventListener("click", closeDrawer);
  sb.querySelectorAll("a").forEach(a => a.addEventListener("click", closeDrawer));
}

// ── Modal ──────────────────────────────────────────
export function openModal(id) {
  document.getElementById(id)?.classList.add("open");
  document.body.style.overflow = "hidden";
}

export function closeModal(id) {
  document.getElementById(id)?.classList.remove("open");
  document.body.style.overflow = "";
}

export function overlayClose(id) {
  document.getElementById(id)?.addEventListener("click", e => {
    if (e.target === e.currentTarget) closeModal(id);
  });
}

// ── Flash banner ───────────────────────────────────
export function showFlash() {
  const flash = sessionStorage.getItem("flash");
  if (!flash) return;
  const banner = document.getElementById("flashBanner");
  const text   = document.getElementById("flashText");
  if (banner && text) {
    text.textContent = flash;
    banner.classList.add("show");
    setTimeout(() => banner.classList.remove("show"), 4000);
  }
  sessionStorage.removeItem("flash");
}