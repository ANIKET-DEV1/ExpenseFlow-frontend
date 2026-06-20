// js/tags.js
import { api } from "./api.js";
import { showToast, escapeHtml, closeModal } from "./utils.js";

let allTags = [];
let pendingDeleteId = null;

export async function initTags() {
  document.getElementById("addTagForm")?.addEventListener("submit", handleAddSubmit);
  document.getElementById("confirmTagDelBtn")?.addEventListener("click", handleConfirmDelete);
  await loadTags();
}

async function loadTags() {
  const list = document.getElementById("tagList");
  if (!list) return;
  try {
    allTags = await api.get("/tags");
    if (!Array.isArray(allTags)) allTags = allTags.items || [];
    render();
  } catch (err) {
    list.innerHTML = `<div class="empty"><h3>Couldn't load tags</h3><p>${escapeHtml(err.message)}</p></div>`;
  }
}

function render() {
  const list = document.getElementById("tagList");
  if (!list) return;

  if (!allTags.length) {
    list.innerHTML = `
      <div class="empty">
        <div class="empty-icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8.704 8.704a2.426 2.426 0 0 0 3.42 0l6.58-6.58a2.426 2.426 0 0 0 0-3.42z"/></svg>
        </div>
        <h3>No tags yet</h3>
        <p>Create your first tag to start categorizing expenses.</p>
      </div>`;
    return;
  }

  list.innerHTML = `<div class="tag-grid">` + allTags.map(tag => `
    <div class="tag-pill">
      <span>${escapeHtml(tag.name)}</span>
      <button class="tag-del" onclick="window.__deleteTag('${tag.id}','${escapeHtml(tag.name)}')" aria-label="Delete tag">
        <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
      </button>
    </div>
  `).join("") + `</div>`;
}

async function handleAddSubmit(e) {
  e.preventDefault();
  const btn = document.getElementById("addTagBtn");
  const input = document.getElementById("tagNameInp");
  const name = input.value.trim().toLowerCase();

  if (name.length < 2 || name.length > 20 || !/^[a-z]+$/i.test(name)) {
    showToast("Tag name must be 2–20 letters only.", "error");
    return;
  }

  btn.disabled = true;
  try {
    await api.post("/tags", { name });
    showToast("Tag created.", "success");
    closeModal("addTagModal");
    document.getElementById("addTagForm").reset();
    await loadTags();
  } catch (err) {
    showToast(err.message || "Could not create tag.", "error");
  } finally {
    btn.disabled = false;
  }
}

window.__deleteTag = (id, name) => {
  pendingDeleteId = id;
  document.getElementById("delTagName").textContent = name;
  document.getElementById("delTagModal")?.classList.add("open");
};

async function handleConfirmDelete() {
  if (!pendingDeleteId) return;
  const btn = document.getElementById("confirmTagDelBtn");
  btn.disabled = true;
  try {
    await api.delete(`/tags/${pendingDeleteId}`);
    showToast("Tag deleted.", "success");
    closeModal("delTagModal");
    await loadTags();
  } catch (err) {
    showToast(err.message || "Could not delete tag.", "error");
  } finally {
    btn.disabled = false;
    pendingDeleteId = null;
  }
}
