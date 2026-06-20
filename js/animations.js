// js/animations.js
// Shared micro-interactions: button ripple, custom cursor (auth pages),
// scroll-reveal (landing page), and the count-up "odometer" effect for amounts.

/** Adds a ripple effect to every .btn on click (event-delegated, safe to call once). */
export function initRipples() {
  if (window.__ripplesInit) return;
  window.__ripplesInit = true;

  document.addEventListener("click", (e) => {
    const btn = e.target.closest(".btn");
    if (!btn) return;

    const rect = btn.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height) * 1.2;
    const span = document.createElement("span");
    span.className = "ripple";
    span.style.width = span.style.height = `${size}px`;
    span.style.left = `${e.clientX - rect.left - size / 2}px`;
    span.style.top  = `${e.clientY - rect.top  - size / 2}px`;
    btn.appendChild(span);
    span.addEventListener("animationend", () => span.remove());
  });
}

/** Custom dot+ring cursor follower, used on auth pages. No-op if elements aren't present. */
export function initCursor() {
  const dot = document.getElementById("cursor-dot");
  const ring = document.getElementById("cursor-ring");
  if (!dot || !ring) return;
  if (window.matchMedia("(pointer: coarse)").matches) return; // skip on touch devices

  let mouseX = 0, mouseY = 0, ringX = 0, ringY = 0;

  window.addEventListener("mousemove", (e) => {
    mouseX = e.clientX; mouseY = e.clientY;
    dot.style.transform = `translate(${mouseX - 3}px, ${mouseY - 3}px)`;
  });

  function loop() {
    ringX += (mouseX - ringX) * 0.18;
    ringY += (mouseY - ringY) * 0.18;
    ring.style.transform = `translate(${ringX - 14}px, ${ringY - 14}px)`;
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);

  document.querySelectorAll("a, button, input, .btn").forEach((el) => {
    el.addEventListener("mouseenter", () => ring.classList.add("hover"));
    el.addEventListener("mouseleave", () => ring.classList.remove("hover"));
  });
}

/** IntersectionObserver-based reveal-on-scroll for landing page sections. */
export function initScrollReveal(selector = ".reveal") {
  const els = document.querySelectorAll(selector);
  if (!els.length) return;

  const obs = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry, i) => {
        if (entry.isIntersecting) {
          setTimeout(() => entry.target.classList.add("in"), i * 40);
          obs.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12 }
  );
  els.forEach((el) => obs.observe(el));
}

/**
 * Animates a number from 0 (or its current value) up to `target`, ledger-odometer style.
 * Formats as currency by default. Call after setting el's data-target, or pass target directly.
 */
export function countUp(el, target, { duration = 700, prefix = "₹", decimals = 2 } = {}) {
  if (!el) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    el.textContent = `${prefix}${formatAmount(target, decimals)}`;
    return;
  }
  const start = 0;
  const startTime = performance.now();
  el.classList.add("counting");

  function tick(now) {
    const progress = Math.min((now - startTime) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3); // ease-out-cubic
    const value = start + (target - start) * eased;
    el.textContent = `${prefix}${formatAmount(value, decimals)}`;
    if (progress < 1) {
      requestAnimationFrame(tick);
    } else {
      el.textContent = `${prefix}${formatAmount(target, decimals)}`;
      el.classList.remove("counting");
    }
  }
  requestAnimationFrame(tick);
}

function formatAmount(value, decimals) {
  return value.toLocaleString("en-IN", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

/** Applies a staggered entrance delay to a NodeList/array of elements (used for stat cards). */
export function stagger(elements, baseDelay = 60) {
  Array.from(elements).forEach((el, i) => {
    el.style.animationDelay = `${i * baseDelay}ms`;
  });
}
