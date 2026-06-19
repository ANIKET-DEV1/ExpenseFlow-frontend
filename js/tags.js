import { apiFetch, showToast, esc, openModal, closeModal, overlayClose } from "./utils.js";
import { icon } from "./icons.js";
import { initPageAnimations } from "./animations.js";

let tags        = [];
let deleteTagId = null;

export async function initTags() {
  overlayClose("addTagModal");
  overlayClose("delTagModal");

  window.openModal  = openModal;
  window.closeModal = closeModal;

  document.getElementById("addTagForm").addEventListener("submit", handleAddTag);
  document.getElementById("confirmTagDelBtn").addEventListener("click", handleDeleteTag);

  await loadTags();
  initPageAnimations();
}

async function loadTags() {
  const res = await apiFetch("/tags/view_tags");
  if (!res || !res.ok) { showToast("Failed to load tags.", "error"); return; }
  tags = await res.json();
  renderTags();
}

function renderTags() {
  const el = document.getElementById("tagList");
  if (!tags.length) {
    el.innerHTML = `<div class="empty"><div class="empty-icon">${icon("tag", 40)}</div><h3>No tags yet</h3><p>Create a tag to start categorising expenses.</p></div>`;
    return;
  }
  el.innerHTML = `<div class="tag-grid">${tags.map(t => `
    <div class="tag-pill">
      ${icon("tag", 13)} <span>${esc(t.tag_name)}</span>
      <button class="tag-del" data-id="${esc(t.id)}" data-name="${esc(t.tag_name)}" title="Delete tag">${icon("x", 12)}</button>
    </div>
  `).join("")}</div>`;

  el.querySelectorAll(".tag-del").forEach(btn => {
    btn.addEventListener("click", () => confirmTagDelete(btn.dataset.id, btn.dataset.name));
  });
}

function confirmTagDelete(id, name) {
  deleteTagId = id;
  document.getElementById("delTagName").textContent = name;
  openModal("delTagModal");
}

async function handleDeleteTag() {
  if (!deleteTagId) return;
  const btn = document.getElementById("confirmTagDelBtn");
  btn.disabled = true;
  btn.innerHTML = `${icon("refresh-cw", 14)} Deleting…`;
  try {
    const tag = tags.find(t => String(t.id) === String(deleteTagId));
    const tagName = tag ? tag.tag_name : null;
    const res = await apiFetch(`/tags/delete_tag?tag=${encodeURIComponent(tagName)}`, { method: "DELETE" });
    if (res && res.ok) {
      tags = tags.filter(t => String(t.id) !== String(deleteTagId));
      renderTags();
      closeModal("delTagModal");
      showToast("Tag deleted.", "success");
    } else {
      const d = res ? await res.json().catch(() => ({})) : {};
      showToast(d.detail || "Could not delete tag.", "error");
    }
  } catch {
    showToast("Network error.", "error");
  } finally {
    btn.innerHTML = `${icon("trash-2", 14)} Delete`;
    btn.disabled = false;
    deleteTagId = null;
  }
}

async function handleAddTag(e) {
  e.preventDefault();
  const btn     = document.getElementById("addTagBtn");
  const tagName = document.getElementById("tagNameInp").value.trim().toLowerCase();

  if (!/^[a-z]{2,20}$/.test(tagName)) {
    showToast("Tag name: 2–20 letters only.", "error");
    return;
  }

  btn.disabled = true;
  btn.innerHTML = `${icon("refresh-cw", 14)} Creating…`;
  try {
    const res = await apiFetch("/tags/add_tags", {
      method: "POST",
      body: JSON.stringify({ tag_name: tagName }),
    });
    if (!res) return;
    const data = await res.json();
    if (res.ok) {
      closeModal("addTagModal");
      document.getElementById("tagNameInp").value = "";
      showToast(`Tag "${tagName}" created!`, "success");
      await loadTags();
    } else {
      showToast(data.detail || "Could not create tag.", "error");
    }
  } catch {
    showToast("Network error.", "error");
  } finally {
    btn.innerHTML = `${icon("plus", 14)} Create Tag`;
    btn.disabled = false;
  }
}
