/**
 * api.js — Base URL + typed fetch wrappers that integrate with appState.
 *
 * All requests use { credentials: "include" } so the Vercel FastAPI backend
 * can read/set the HttpOnly session cookie.
 *
 * Cache contract
 * ──────────────
 * fetchExpenses()  → returns appState.expenses (populates if null)
 * fetchDebts()     → returns appState.debts    (populates if null)
 * fetchTags()      → returns appState.tags     (populates if null)
 * fetchUser()      → returns appState.user     (populates if null)
 *
 * Mutating helpers (add / edit / delete) always call the matching invalidator
 * so the next read goes back to the server.
 */

import { appState, invalidateExpenses, invalidateDebts, invalidateTags } from "./state.js";
import { showToast } from "./utils.js";

export const BASE_URL = "https://expense-flow-ag9326107-5763s-projects.vercel.app";

// ── Low-level fetch wrapper ──────────────────────────────────────────────────

/**
 * Thin authenticated fetch.
 * Returns the raw Response, or null on network error / 401 redirect.
 *
 * @param {string} path   - e.g. "/expenses/view_expenses"
 * @param {RequestInit} [opts]
 * @returns {Promise<Response | null>}
 */
export async function apiFetch(path, opts = {}) {
  let res;
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      credentials: "include",                          // HttpOnly cookie handshake
      headers: { "Content-Type": "application/json", ...(opts.headers ?? {}) },
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

// ── Cache-aware read helpers ─────────────────────────────────────────────────

/**
 * Returns the cached expense array, fetching from the server only when the
 * cache has been invalidated (appState.expenses === null).
 *
 * @returns {Promise<Array>}
 */
export async function fetchExpenses() {
  if (appState.expenses !== null) return appState.expenses;

  const res = await apiFetch("/expenses/view_expenses");
  if (!res || !res.ok) return [];
  appState.expenses = await res.json();
  return appState.expenses;
}

/**
 * Returns the cached debts array.
 * @returns {Promise<Array>}
 */
export async function fetchDebts() {
  if (appState.debts !== null) return appState.debts;

  const res = await apiFetch("/settlements/View_debt");
  if (!res || !res.ok) return [];
  appState.debts = await res.json();
  return appState.debts;
}

/**
 * Returns the cached tags array.
 * @returns {Promise<Array>}
 */
export async function fetchTags() {
  if (appState.tags !== null) return appState.tags;

  const res = await apiFetch("/tags/view_tags");
  if (!res || !res.ok) return [];
  appState.tags = await res.json();
  return appState.tags;
}

/**
 * Returns the cached authenticated user object.
 * Redirects to login.html when the session is invalid.
 *
 * @returns {Promise<object | null>}
 */
export async function fetchUser() {
  if (appState.user !== null) return appState.user;

  try {
    const res = await fetch(`${BASE_URL}/auth/me`, { credentials: "include" });
    const data = await res.json();
    if (res.ok && data.authenticated) {
      appState.user = data.user;
      return appState.user;
    }
  } catch { /* fall through */ }

  sessionStorage.setItem("flash", "Please log in to continue.");
  window.location.href = "login.html";
  return null;
}

// ── Mutating helpers (invalidate on success) ─────────────────────────────────

/**
 * POST a new expense. Invalidates the expense cache on success.
 * @param {object} body
 * @returns {Promise<{ok: boolean, data: object}>}
 */
export async function addExpense(body) {
  const res  = await apiFetch("/expenses/add_expenses", { method: "POST", body: JSON.stringify(body) });
  if (!res) return { ok: false, data: {} };
  const data = await res.json();
  if (res.ok) invalidateExpenses();
  return { ok: res.ok, data };
}

/**
 * DELETE an expense by id. Invalidates the expense cache on success.
 * @param {number} id
 * @returns {Promise<boolean>}
 */
export async function deleteExpense(id) {
  const res = await apiFetch(`/expenses/delete_expense?expenseId=${id}`, { method: "DELETE" });
  if (res?.ok) { invalidateExpenses(); return true; }
  return false;
}

/**
 * POST a new debt. Invalidates debts cache on success.
 * @param {object} body
 * @returns {Promise<{ok: boolean, data: object}>}
 */
export async function addDebt(body) {
  const res  = await apiFetch("/settlements/Add_debt", { method: "POST", body: JSON.stringify(body) });
  if (!res) return { ok: false, data: {} };
  const data = await res.json();
  if (res.ok) invalidateDebts();
  return { ok: res.ok, data };
}

/**
 * PUT (update) a debt. Invalidates debts cache on success.
 * @param {number} id
 * @param {object} body
 * @returns {Promise<{ok: boolean, data: object}>}
 */
export async function updateDebt(id, body) {
  const res  = await apiFetch(`/settlements/update_debt/${id}`, { method: "PUT", body: JSON.stringify(body) });
  if (!res) return { ok: false, data: {} };
  const data = await res.json();
  if (res.ok) invalidateDebts();
  return { ok: res.ok, data };
}

/**
 * DELETE a debt. Invalidates debts cache on success.
 * @param {number} id
 * @returns {Promise<boolean>}
 */
export async function deleteDebt(id) {
  const res = await apiFetch(`/settlements/delete_debt?del_id=${id}`, { method: "DELETE" });
  if (res?.ok) { invalidateDebts(); return true; }
  return false;
}

/**
 * POST a new tag. Invalidates tags cache on success.
 * @param {string} tagName
 * @returns {Promise<{ok: boolean, data: object}>}
 */
export async function addTag(tagName) {
  const res  = await apiFetch("/tags/add_tags", { method: "POST", body: JSON.stringify({ tag_name: tagName }) });
  if (!res) return { ok: false, data: {} };
  const data = await res.json();
  if (res.ok) invalidateTags();
  return { ok: res.ok, data };
}

/**
 * DELETE a tag by name. Invalidates tags cache on success.
 * @param {string} tagName
 * @returns {Promise<{ok: boolean, data: object}>}
 */
export async function deleteTag(tagName) {
  const res  = await apiFetch(`/tags/delete_tag?tag=${encodeURIComponent(tagName)}`, { method: "DELETE" });
  if (!res) return { ok: false, data: {} };
  const data = await res.json().catch(() => ({}));
  if (res.ok) invalidateTags();
  return { ok: res.ok, data };
}
