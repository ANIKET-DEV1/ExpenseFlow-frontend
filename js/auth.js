// Shared validation rules used across login/register/reset pages and forms.

export const USERNAME_RULES = [
  { test: v => v.length >= 3 && v.length <= 20, msg: "3–20 characters" },
  { test: v => /^[A-Za-z]/.test(v),             msg: "Must start with a letter" },
  { test: v => /^[A-Za-z0-9_]+$/.test(v),       msg: "Letters, numbers, _ only" },
];

export const PASSWORD_RULES = [
  { id: "pw-len",   test: v => v.length >= 8,                                     msg: "At least 8 characters" },
  { id: "pw-upper", test: v => /[A-Z]/.test(v),                                   msg: "Uppercase letter" },
  { id: "pw-lower", test: v => /[a-z]/.test(v),                                   msg: "Lowercase letter" },
  { id: "pw-num",   test: v => /\d/.test(v),                                      msg: "Number" },
  { id: "pw-sym",   test: v => /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(v), msg: "Special character" },
];

export function validateUsername(v) {
  return USERNAME_RULES.filter(r => !r.test(v)).map(r => r.msg);
}

// Full strength check — used on register / reset pages
export function validatePassword(v) {
  return PASSWORD_RULES.filter(r => !r.test(v)).map(r => r.msg);
}

// Lightweight check used only on the LOGIN page (just non-empty)
export function validateLoginPassword(v) {
  if (!v || v.length === 0) return ["Password is required"];
  return [];
}

export function validateEmail(v) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v) ? [] : ["Enter a valid email address"];
}

export function validateAmount(v) {
  const n = Number(v);
  if (v === "" || v === null || Number.isNaN(n)) return ["Enter a valid amount"];
  if (n < 1) return ["Amount must be 1 or greater"];
  if (n > 10000000) return ["Amount is too large"];
  return [];
}

export function validatePersonName(v) {
  const errs = [];
  if (!v || v.length < 2) errs.push("Name must be at least 2 characters");
  if (v && v.length > 50) errs.push("Name must be under 50 characters");
  return errs;
}

// Safe: msgs are always our own static strings
export function showErr(boxId, msgs) {
  const el = document.getElementById(boxId);
  if (!el) return;
  if (!msgs || !msgs.length) { el.classList.remove("show"); el.textContent = ""; return; }
  // Build content safely with DOM methods
  el.innerHTML = "";
  msgs.forEach((m, i) => {
    if (i > 0) el.appendChild(document.createElement("br"));
    const span = document.createElement("span");
    span.textContent = m;
    el.appendChild(span);
  });
  el.classList.add("show");
}

export function clearErr(boxId) {
  const el = document.getElementById(boxId);
  if (el) { el.classList.remove("show"); el.innerHTML = ""; }
}