// js/profile.js
import { escapeHtml } from "./utils.js";

export function initProfile(user) {
  const card = document.getElementById("profileCard");
  if (!card || !user) return;

  const initials = (user.username || "?").slice(0, 2).toUpperCase();
  const joined = user.created_at
    ? new Date(user.created_at).toLocaleDateString("en-IN", { weekday: "long", year: "numeric", month: "long", day: "numeric" })
    : "—";

  card.innerHTML = `
    <div style="display:flex;align-items:center;gap:16px;margin-bottom:24px">
      <div style="width:64px;height:64px;border-radius:14px;background:linear-gradient(155deg,var(--gold) 0%,#b3823a 100%);color:var(--gold-ink);display:flex;align-items:center;justify-content:center;font-family:var(--font-display);font-weight:800;font-size:1.3rem;flex-shrink:0">${escapeHtml(initials)}</div>
      <div>
        <div style="font-family:var(--font-display);font-weight:700;font-size:1.15rem">${escapeHtml(user.username || "—")}</div>
        <span class="badge bg" style="margin-top:4px">Verified Account</span>
      </div>
    </div>
    <div class="form-grid">
      <div class="form-group">
        <span class="form-label">Username</span>
        <div class="form-input" style="background:var(--surface2);cursor:default">${escapeHtml(user.username || "—")}</div>
      </div>
      <div class="form-group">
        <span class="form-label">Email</span>
        <div class="form-input" style="background:var(--surface2);cursor:default">${escapeHtml(user.email || "—")}</div>
      </div>
      <div class="form-group full">
        <span class="form-label">Member Since</span>
        <div class="form-input" style="background:var(--surface2);cursor:default">${escapeHtml(joined)}</div>
      </div>
    </div>
  `;
}
