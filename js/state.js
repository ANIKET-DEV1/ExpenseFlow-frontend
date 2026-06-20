/**
 * state.js — Central in-memory singleton.
 *
 * Rules:
 *  - Never import sessionStorage / localStorage here.
 *  - All keys are null until a successful fetch populates them.
 *  - Setting a key back to null triggers a fresh background fetch
 *    on the next page that needs it.
 */

export const appState = {
  /** @type {import('./types').User | null} */
  user: null,

  /** @type {Array | null}  raw expense objects from /expenses/view_expenses */
  expenses: null,

  /** @type {Array | null}  raw debt objects from /settlements/View_debt */
  debts: null,

  /** @type {Array | null}  tag objects from /tags/view_tags */
  tags: null,
};

// ── Granular invalidators ────────────────────────────────────────────────────

/** Wipe every API-sourced slice (call on logout). */
export function purgeState() {
  appState.user     = null;
  appState.expenses = null;
  appState.debts    = null;
  appState.tags     = null;
}

/** Invalidate only the expenses slice (call after add / delete expense). */
export function invalidateExpenses() {
  appState.expenses = null;
}

/** Invalidate only the debts slice (call after add / edit / delete debt). */
export function invalidateDebts() {
  appState.debts = null;
}

/** Invalidate only the tags slice (call after add / delete tag). */
export function invalidateTags() {
  appState.tags = null;
}
