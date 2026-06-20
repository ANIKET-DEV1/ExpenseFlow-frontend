// js/auth.js
// Shared validation + error/success display helpers for all auth pages
// (login, register, forgot-password, reset-password).

export function showErr(boxId, messages) {
  const box = document.getElementById(boxId);
  const textEl = document.getElementById(boxId.replace("Box", "Text")) || box.querySelector("span");
  if (!box) return;
  const list = Array.isArray(messages) ? messages : [messages];
  textEl.textContent = list.join(" ");
  box.classList.add("show");
}

export function clearErr(boxId) {
  const box = document.getElementById(boxId);
  if (box) box.classList.remove("show");
}

export function validateUsername(username) {
  const errs = [];
  if (!username || username.length < 3) errs.push("Username must be at least 3 characters.");
  if (username && username.length > 30) errs.push("Username must be under 30 characters.");
  if (username && !/^[a-zA-Z0-9_]+$/.test(username)) errs.push("Username can only contain letters, numbers, and underscores.");
  return errs;
}

export function validateEmail(email) {
  const errs = [];
  if (!email) { errs.push("Email is required."); return errs; }
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!re.test(email)) errs.push("Enter a valid email address.");
  return errs;
}

// Full password rules used at registration / reset time.
export const PASSWORD_RULES = [
  { id: "pw-len",   msg: "8+ characters",      test: (v) => v.length >= 8 },
  { id: "pw-upper", msg: "Uppercase letter",   test: (v) => /[A-Z]/.test(v) },
  { id: "pw-lower", msg: "Lowercase letter",   test: (v) => /[a-z]/.test(v) },
  { id: "pw-num",   msg: "Number",             test: (v) => /[0-9]/.test(v) },
  { id: "pw-sym",   msg: "Special character",  test: (v) => /[^A-Za-z0-9]/.test(v) },
];

export function validatePassword(password) {
  const errs = [];
  if (!password) { errs.push("Password is required."); return errs; }
  PASSWORD_RULES.forEach((rule) => {
    if (!rule.test(password)) errs.push(`Password needs: ${rule.msg.toLowerCase()}.`);
  });
  return errs;
}

// Login only needs a non-empty check — not full strength validation.
export function validateLoginPassword(password) {
  const errs = [];
  if (!password || password.length < 1) errs.push("Password is required.");
  return errs;
}
