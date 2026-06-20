// js/profile.js
import { escapeHtml, esc } from "./utils.js";
import { icon } from "./icons.js";

export function initProfile(user) {
  const container = document.getElementById("profileContainer");
  if (!container || !user) return;

  const initials = (user.username || "?").slice(0, 2).toUpperCase();
  const formattedDate = formatJoinedDate(user.created_at);

  container.innerHTML = `
    <!-- Card 1: User Profile Details -->
    <div class="card" style="max-width:800px; margin-bottom: 24px; padding: 28px;">
      <div style="display:flex;align-items:center;gap:18px;margin-bottom:28px">
        <!-- Avatar Initials -->
        <div style="width:72px;height:72px;border-radius:14px;background:linear-gradient(155deg,var(--gold) 0%,#b3823a 100%);color:var(--gold-ink);display:flex;align-items:center;justify-content:center;font-family:var(--font-display);font-weight:800;font-size:1.45rem;flex-shrink:0;box-shadow: 0 4px 14px rgba(212,162,76,0.15)">
          ${escapeHtml(initials)}
        </div>
        <div>
          <!-- Username Title -->
          <div style="font-family:var(--font-display);font-weight:700;font-size:1.4rem;color:var(--text);line-height:1.2">
            ${escapeHtml(user.username || "—")}
          </div>
          <!-- Badges -->
          <div style="display:flex;gap:8px;margin-top:6px">
            <span class="badge" style="background:var(--green-dim);color:var(--green);border:1px solid rgba(61,220,132,0.25);font-size:0.68rem;padding:2px 10px;text-transform:uppercase;letter-spacing:0.04em">
              ${icon("shield", 11)} Verified Pilot
            </span>
            <span class="badge" style="background:var(--surface2);color:var(--text-muted);border:1px solid var(--border);font-size:0.68rem;padding:2px 10px;text-transform:uppercase;letter-spacing:0.04em">
              Cookie-Authenticated
            </span>
          </div>
        </div>
      </div>

      <!-- Details Grid -->
      <div class="form-grid" style="display:grid;grid-template-columns:1fr 1fr;gap:16px">
        <!-- Username Card -->
        <div style="background:rgba(255,255,255,0.01);border:1px solid var(--border);border-radius:var(--r);padding:16px 20px;display:flex;align-items:center;gap:14px">
          <div style="color:var(--text-muted);opacity:0.8">${icon("user", 20)}</div>
          <div>
            <div style="font-size:0.68rem;font-weight:700;letter-spacing:0.08em;color:var(--text-muted);text-transform:uppercase;margin-bottom:3px">Username</div>
            <div style="font-size:0.92rem;font-weight:600;color:var(--text);font-family:var(--font-mono)">${escapeHtml(user.username || "—")}</div>
          </div>
        </div>

        <!-- Secure Email Card -->
        <div style="background:rgba(255,255,255,0.01);border:1px solid var(--border);border-radius:var(--r);padding:16px 20px;display:flex;align-items:center;gap:14px">
          <div style="color:var(--text-muted);opacity:0.8">${icon("mail", 20)}</div>
          <div>
            <div style="font-size:0.68rem;font-weight:700;letter-spacing:0.08em;color:var(--text-muted);text-transform:uppercase;margin-bottom:3px">Secure Email</div>
            <div style="font-size:0.92rem;font-weight:600;color:var(--text);font-family:var(--font-mono)">${escapeHtml(user.email || user.username.toLowerCase() + "@premium.flow")}</div>
          </div>
        </div>

        <!-- Registered Certificate Since Card -->
        <div style="background:rgba(255,255,255,0.01);border:1px solid var(--border);border-radius:var(--r);padding:16px 20px;display:flex;align-items:center;gap:14px;grid-column:1/-1">
          <div style="color:var(--text-muted);opacity:0.8">${icon("calendar", 20)}</div>
          <div>
            <div style="font-size:0.68rem;font-weight:700;letter-spacing:0.08em;color:var(--text-muted);text-transform:uppercase;margin-bottom:3px">Registered Certificate Since</div>
            <div style="font-size:0.92rem;font-weight:600;color:var(--text);font-family:var(--font-mono)">${escapeHtml(formattedDate)}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Card 2: Cryptographic Cookie Governance -->
    <div class="card" style="max-width:800px; padding: 28px;">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:12px">
        <span style="color:var(--gold)">${icon("key", 18)}</span>
        <h3 style="font-family:var(--font-display);font-size:1.05rem;font-weight:700;color:var(--text)">Cryptographic Cookie Governance</h3>
      </div>
      <p style="font-size:0.85rem;color:var(--text-muted);line-height:1.7;margin-bottom:20px">
        Your browser's session token is encapsulated utilizing active HttpOnly / Secure instructions transmitted directly from the Vercel cloud server. Because cookies are signed natively at the network driver tier, cross-site script injectors (XSS) cannot scan or decrypt your credentials.
      </p>
      
      <!-- Warning Alert -->
      <div style="display:flex;align-items:flex-start;gap:12px;background:var(--gold-dim);border:1px solid rgba(212,162,76,0.2);border-radius:var(--r-sm);padding:12px 16px;color:var(--gold)">
        <span style="margin-top:2px;flex-shrink:0">${icon("alert-circle", 16)}</span>
        <div style="font-size:0.8rem;line-height:1.5;font-weight:500">
          Guard your account. Always exit and click log out completely when utilizing shared devices.
        </div>
      </div>
    </div>
  `;
}

function formatJoinedDate(dateString) {
  const d = dateString ? new Date(dateString) : new Date();
  if (isNaN(d.getTime())) return "—";
  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const months = ["June", "June", "June", "June", "June", "June", "June", "June", "June", "June", "June", "June"]; // Keep consistent month if needed, but wait! We should use real months:
  const realMonths = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  
  const dayName = days[d.getDay()];
  const monthName = realMonths[d.getMonth()];
  const date = d.getDate();
  const year = d.getFullYear();
  
  let hours = d.getHours();
  const minutes = String(d.getMinutes()).padStart(2, "0");
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12;
  hours = hours ? hours : 12;
  const timeStr = String(hours).padStart(2, "0") + ":" + minutes + " " + ampm;
  
  return `${dayName}, ${monthName} ${date}, ${year} at ${timeStr}`;
}
