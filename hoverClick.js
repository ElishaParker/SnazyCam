// hoverClick.js — rectangle hit-test + dwell, no elementFromPoint, no z-index dependency
(() => {
  // Tunables (overridable by controls panel)
  window.HOVER_TIME    = window.HOVER_TIME    ?? 1500; // ms to trigger click
  window.CURSOR_RADIUS = window.CURSOR_RADIUS ?? 15;   // px jitter radius
  const HOVER_OUT_GRACE = 10; // px grace when leaving briefly

  // Style for visual feedback
  const style = document.createElement("style");
  style.textContent = `
    .gaze-hover {
      outline: 2px solid #00ffff !important;
      box-shadow: 0 0 10px #00ffff88 !important;
      transition: box-shadow 0.08s ease;
    }
  `;
  document.head.appendChild(style);

  // Optional progress wheel near the cursor
  const wheel = document.createElement("div");
  Object.assign(wheel.style, {
    position: "fixed",
    width: "40px",
    height: "40px",
    border: "3px solid rgba(0,255,255,0.3)",
    borderTopColor: "#00ffff",
    borderRadius: "50%",
    pointerEvents: "none",
    opacity: 0,
    zIndex: 5,
    transform: "rotate(0deg)",
    transition: "opacity 0.15s ease, transform 0.08s linear",
    left: "-9999px",
    top: "-9999px",
  });
  document.body.appendChild(wheel);

  const updateWheel = (x, y, progress) => {
    wheel.style.left = `${x - 20}px`;
    wheel.style.top  = `${y - 20}px`;
    wheel.style.transform = `rotate(${progress * 360}deg)`;
    wheel.style.opacity = progress > 0 ? 1 : 0;
  };

  // Track dwell per element
  let activeEl = null;
  let hoverStart = 0;
  let progress = 0;

  // Collect clickable elements
  const CLICK_SELECTOR = "button, [onclick], [data-hover-click], input, .clickable";
  let clickables = [];

  function refreshClickables() {
    clickables = Array.from(document.querySelectorAll(CLICK_SELECTOR))
      // Ignore hidden or display:none
      .filter(el => el.offsetParent !== null || el === document.body);
  }
  refreshClickables();

  // Rebuild list if DOM changes
  const mo = new MutationObserver(refreshClickables);
  mo.observe(document.body, { childList: true, subtree: true, attributes: true });

  function insideRect(x, y, rect, radius) {
    // Expand rect by radius for jitter tolerance
    const left   = rect.left   - radius;
    const right  = rect.right  + radius;
    const top    = rect.top    - radius;
    const bottom = rect.bottom + radius;
    return x >= left && x <= right && y >= top && y <= bottom;
  }

  function loop() {
    const sc = window.smoothedCursor;
    if (!sc) {
      requestAnimationFrame(loop);
      return;
    }
    const x = window.innerWidth - sc.x; // CSS pixels (your code already uses CSS pixel coords)
    const y = sc.y;

    // Update progress wheel position even if no target
    updateWheel(x, y, progress);

    // If we have an active element, check if we're still within a grace envelope
    if (activeEl) {
      const rect = activeEl.getBoundingClientRect();
      const stillInside = insideRect(x, y, rect, Math.max(window.CURSOR_RADIUS, HOVER_OUT_GRACE));

      if (stillInside) {
        // Continue dwell
        const elapsed = performance.now() - hoverStart;
        progress = Math.min(elapsed / (window.HOVER_TIME || 1500), 1);
        updateWheel(x, y, progress);

        if (progress >= 1) {
          // Fire and reset
          activeEl.click();
          activeEl.classList.remove("gaze-hover");
          activeEl = null;
          hoverStart = 0;
          progress = 0;
          updateWheel(x, y, 0);
        }

        requestAnimationFrame(loop);
        return;
      } else {
        // Left the active element
        activeEl.classList.remove("gaze-hover");
        activeEl = null;
        hoverStart = 0;
        progress = 0;
        updateWheel(x, y, 0);
      }
    }

    // No active element → find first clickable whose rect contains the point
    let found = null;
    for (const el of clickables) {
      const rect = el.getBoundingClientRect();
      if (insideRect(x, y, rect, window.CURSOR_RADIUS || 15)) {
        found = el;
        break;
      }
    }

    if (found) {
  // 🟢 Diagnostic logging — shows what element is being hovered
  console.log(
    "Hovering:", 
    found.tagName, 
    found.textContent.trim() || found.getAttribute("id") || found.className || "(no label)"
  );

  // Highlight the hovered element visually
  activeEl = found;
  activeEl.classList.add("gaze-hover");

  // Reset dwell tracking
  hoverStart = performance.now();
  progress = 0;

  // Reset progress wheel at cursor position
  updateWheel(x, y, 0);
} else {
  // No target found — reset progress and hide wheel
  progress = 0;
  updateWheel(x, y, 0);
}


    requestAnimationFrame(loop);
  }

  loop();
})();
