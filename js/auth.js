// Shared validation rules used across login/register/reset pages and forms.
// Keeping all the rules here means every page checks input the same way.

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

export function validatePassword(v) {
  return PASSWORD_RULES.filter(r => !r.test(v)).map(r => r.msg);
}

export function validateEmail(v) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v) ? [] : ["Enter a valid email address"];
}

// Amount must be a real number, at least 1 (per API rules), and not absurdly large.
export function validateAmount(v) {
  const n = Number(v);
  if (v === "" || v === null || Number.isNaN(n)) return ["Enter a valid amount"];
  if (n < 1) return ["Amount must be 1 or greater"];
  if (n > 10000000) return ["Amount is too large"];
  return [];
}

// Person name for settlements
export function validatePersonName(v) {
  const errs = [];
  if (v.length < 2) errs.push("Name must be at least 2 characters");
  if (v.length > 50) errs.push("Name must be under 50 characters");
  return errs;
}

export function showErr(boxId, msgs) {
  const el = document.getElementById(boxId);
  if (!el) return;
  if (!msgs.length) { el.classList.remove("show"); el.innerHTML = ""; return; }
  // msgs are always our own static strings, never user input, so this is safe.
  el.innerHTML = msgs.map(m => `<span>${m}</span>`).join("<br>");
  el.classList.add("show");
}

export function clearErr(boxId) {
  const el = document.getElementById(boxId);
  if (el) { el.classList.remove("show"); el.innerHTML = ""; }
}
