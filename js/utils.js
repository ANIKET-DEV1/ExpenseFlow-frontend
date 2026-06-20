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
// ── Top navbar ─────────────────────────────────────
export function renderTopnav(user) {
  const nav = document.getElementById("topnav");
  if (!nav) return;
  nav.innerHTML = `
    <button class="menu-btn" id="menuBtn" type="button" aria-label="Open menu" style="margin-right:8px">${icon("menu", 20)}</button>
    <div style="font-family:var(--font-display);font-weight:700;font-size:1.1rem;color:var(--text)">
      Welcome, ${esc(user.username)}
    </div>
    <div class="topnav-right">
      <button id="themeToggle" type="button" style="color:var(--text-muted);display:flex;align-items:center;justify-content:center;width:32px;height:32px;border-radius:50%;cursor:pointer">
        ${icon("moon", 16)}
      </button>
      <span class="status-pill">
        Secure Node Active
      </span>
    </div>
  `;

  document.getElementById("menuBtn").addEventListener("click", () => {
    document.dispatchEvent(new CustomEvent("open-mobile-sidebar"));
  });

  // Setup theme toggle icon placeholder interaction
  const toggleBtn = document.getElementById("themeToggle");
  toggleBtn.addEventListener("click", () => {
    const isDark = document.body.style.filter === "";
    document.body.style.filter = isDark ? "invert(0.92) hue-rotate(180deg)" : "";
    toggleBtn.innerHTML = isDark ? icon("sun", 16) : icon("moon", 16);
  });
}

// ── Sidebar ────────────────────────────────────────
export function renderSidebar(user) {
  const sb = document.getElementById("sidebar");
  if (!sb) return;
  const page = location.pathname.split("/").pop() || "index.html";

  const initials = user ? esc((user.username || "?").slice(0, 2).toUpperCase()) : "??";
  const name = user ? esc(user.username) : "Account";

  sb.innerHTML = `
    <!-- Brand Logo -->
    <div style="display:flex;align-items:center;gap:10px;padding: 10px 10px 24px;font-family:var(--font-display);font-weight:700;font-size:1.15rem;letter-spacing:-0.01em;color:var(--text);border-bottom:1px solid var(--border);margin-bottom:20px">
      <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="filter: drop-shadow(0 0 4px var(--gold-glow))">
        <rect x="5" y="5" width="14" height="14" rx="2" transform="rotate(45 12 12)" />
        <rect x="9" y="9" width="6" height="6" rx="1" transform="rotate(45 12 12)" />
      </svg>
      EXPENSEFLOW
    </div>

    <!-- Workspace section -->
    <div class="nav-section" style="flex: 1">
      <a href="dashboard.html"   class="nav-link${page === "dashboard.html" ? " active" : ""}"   data-nav="dashboard.html">${icon("layout-dashboard", 16)} <span>Dashboard</span></a>
      <a href="expenses.html"    class="nav-link${page === "expenses.html" ? " active" : ""}"    data-nav="expenses.html">${icon("credit-card", 16)} <span>Expenses</span></a>
      <a href="settlements.html" class="nav-link${page === "settlements.html" ? " active" : ""}" data-nav="settlements.html">${icon("handshake", 16)} <span>Settlements</span></a>
      <a href="tags.html"        class="nav-link${page === "tags.html" ? " active" : ""}"        data-nav="tags.html">${icon("tag", 16)} <span>Tags Manager</span></a>
      <a href="profile.html"     class="nav-link${page === "profile.html" ? " active" : ""}"     data-nav="profile.html">${icon("user", 16)} <span>My Profile</span></a>
    </div>

    <!-- Sidebar Foot -->
    <div class="sidebar-foot" style="margin-top: auto; padding-top: 16px; border-top: 1px solid var(--border);">
      <div class="sidebar-user" style="display: flex; align-items: center; gap: 10px; padding: 8px 6px; margin-bottom: 8px;">
        <div class="avatar" style="width: 36px; height: 36px; border-radius: 8px; background: linear-gradient(155deg, var(--gold) 0%, #b3823a 100%); color: var(--gold-ink); display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 0.85rem; font-family: var(--font-display); flex-shrink: 0;">
          ${initials}
        </div>
        <div>
          <div class="name" style="font-size: 0.85rem; font-weight: 700; color: var(--text)">${name}</div>
          <div class="sub" style="font-size: 0.7rem; color: var(--text-faint)">Premium Pilot</div>
        </div>
      </div>
      <div class="sidebar-signout" id="sidebarSignOut" style="display: flex; align-items: center; gap: 8px; padding: 8px 10px; font-size: 0.83rem; font-weight: 600; color: var(--red); border-radius: var(--r-sm); transition: background var(--t); cursor: pointer;">
        ${icon("log-out", 15)}
        <span>Sign Out</span>
      </div>
    </div>
  `;

  document.getElementById("sidebarSignOut").addEventListener("click", logout);

  // Setup mobile drawer toggle handling
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
