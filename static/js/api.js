// js/api.js
// Central place for the backend base URL and a couple of shared fetch helpers.
// Edit BASE_URL to point at your actual backend.

export const BASE_URL = "/api";

/**
 * Fetches the currently logged-in user.
 * Returns the user object on success, or null if not authenticated / on error.
 * Used as the auth guard on every protected page.
 */
export async function fetchUser() {
  try {
    const res = await fetch(`${BASE_URL}/auth/me`, { credentials: "include" });
    if (!res.ok) return null;
    const data = await res.json();
    if (!data.authenticated) return null;
    return data.user || data;
  } catch {
    return null;
  }
}

/**
 * Generic JSON request helper. Throws an Error with a readable message on failure.
 */
export async function apiRequest(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    credentials: "include",
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    ...options,
  });

  let data = null;
  try { data = await res.json(); } catch { /* empty body is fine */ }

  if (!res.ok) {
    const msg = (data && (data.detail || data.message)) || `Request failed (${res.status})`;
    throw new Error(msg);
  }
  return data;
}

export const api = {
  get:    (path)        => apiRequest(path, { method: "GET" }),
  post:   (path, body)  => apiRequest(path, { method: "POST",   body: JSON.stringify(body) }),
  put:    (path, body)  => apiRequest(path, { method: "PUT",    body: JSON.stringify(body) }),
  patch:  (path, body)  => apiRequest(path, { method: "PATCH",  body: JSON.stringify(body) }),
  delete: (path)        => apiRequest(path, { method: "DELETE" }),
};
