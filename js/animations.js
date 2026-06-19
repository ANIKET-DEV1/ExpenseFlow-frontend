// Tiny animation helpers used on every page.
// Kept simple on purpose — just plain DOM + CSS, no animation library.

// Adds a ripple circle inside a button when clicked (Material-style feedback).
function attachRipple(btn) {
  btn.addEventListener("click", e => {
    const rect = btn.getBoundingClientRect();
    const circle = document.createElement("span");
    const size = Math.max(rect.width, rect.height);
    circle.className = "ripple";
    circle.style.width = circle.style.height = size + "px";
    circle.style.left = (e.clientX - rect.left - size / 2) + "px";
    circle.style.top  = (e.clientY - rect.top - size / 2) + "px";
    btn.appendChild(circle);
    setTimeout(() => circle.remove(), 600);
  });
}

// Call once on page load to wire ripple effect onto every .btn (current and future).
export function initRipples() {
  document.querySelectorAll(".btn").forEach(attachRipple);
  // Watch for buttons added later (e.g. after a fetch re-renders a list)
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

// Staggers a fade/slide-in for a group of elements (e.g. stat cards).
export function staggerIn(selector, delayStep = 60) {
  document.querySelectorAll(selector).forEach((el, i) => {
    el.style.animationDelay = `${i * delayStep}ms`;
  });
}

// Reveals elements as they scroll into view (used on the landing page).
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

// Run the common setup that every authenticated page wants.
export function initPageAnimations() {
  initRipples();
  staggerIn(".stat-card");
}
