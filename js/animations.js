// Animation helpers used on every page.

function attachRipple(btn) {
  btn.addEventListener("click", e => {
    const rect = btn.getBoundingClientRect();
    const circle = document.createElement("span");
    const size = Math.max(rect.width, rect.height);
    circle.className = "ripple";
    circle.style.width = circle.style.height = size + "px";
    circle.style.left = (e.clientX - rect.left - size / 2) + "px";
    circle.style.top  = (e.clientY - rect.top  - size / 2) + "px";
    btn.appendChild(circle);
    setTimeout(() => circle.remove(), 600);
  });
}

export function initRipples() {
  document.querySelectorAll(".btn").forEach(attachRipple);
  const observer = new MutationObserver(mutations => {
    mutations.forEach(m => {
      m.addedNodes.forEach(node => {
        if (!(node instanceof HTMLElement)) return;
        if (node.matches?.(".btn")) attachRipple(node);
        node.querySelectorAll?.(".btn").forEach(attachRipple);
      });
    });
  });
  observer.observe(document.body, { childList: true, subtree: true });
}

export function staggerIn(selector, delayStep = 60) {
  document.querySelectorAll(selector).forEach((el, i) => {
    el.style.animationDelay = `${i * delayStep}ms`;
  });
}

export function initScrollReveal(selector = ".reveal") {
  const items = document.querySelectorAll(selector);
  if (!items.length) return;
  const io = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add("in");
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });
  items.forEach(el => io.observe(el));
}

// Custom cursor — attach once per page
export function initCursor() {
  // Skip on touch devices
  if (window.matchMedia("(hover: none) and (pointer: coarse)").matches) return;

  const dot  = document.getElementById("cursor-dot");
  const ring = document.getElementById("cursor-ring");
  if (!dot || !ring) return;

  let mouseX = 0, mouseY = 0;
  let ringX  = 0, ringY  = 0;
  let rafId;

  document.addEventListener("mousemove", e => {
    mouseX = e.clientX;
    mouseY = e.clientY;
    dot.style.left = mouseX + "px";
    dot.style.top  = mouseY + "px";
  });

  // Ring follows with slight lag for fluid feel
  function animateRing() {
    ringX += (mouseX - ringX) * 0.14;
    ringY += (mouseY - ringY) * 0.14;
    ring.style.left = ringX + "px";
    ring.style.top  = ringY + "px";
    rafId = requestAnimationFrame(animateRing);
  }
  animateRing();

  // Hover state on interactive elements
  const hoverEls = "a, button, [data-action], .seg-tab, .group-header, .tag-pill, .faq-q, input, select, textarea";
  document.addEventListener("mouseover", e => {
    if (e.target.closest(hoverEls)) document.body.classList.add("cursor-hover");
  });
  document.addEventListener("mouseout", e => {
    if (e.target.closest(hoverEls)) document.body.classList.remove("cursor-hover");
  });

  document.addEventListener("mousedown", () => document.body.classList.add("cursor-click"));
  document.addEventListener("mouseup",   () => document.body.classList.remove("cursor-click"));

  document.addEventListener("mouseleave", () => { dot.style.opacity = "0"; ring.style.opacity = "0"; });
  document.addEventListener("mouseenter", () => { dot.style.opacity = "1"; ring.style.opacity = "1"; });
}

export function initPageAnimations() {
  initRipples();
  staggerIn(".stat-card");
  initCursor();
}