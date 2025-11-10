// hoverClick.js
(() => {
  window.HOVER_TIME    = window.HOVER_TIME    || 1500; // ms dwell time
  window.CURSOR_RADIUS = window.CURSOR_RADIUS || 15;   // px hover radius

  let hoverTarget = null;
  let hoverStart  = null;
  let hoverProgress = 0;

  // --- Progress Wheel (visual feedback) ---
  const wheel = document.createElement("div");
  Object.assign(wheel.style, {
    position: "fixed",
    width: "40px",
    height: "40px",
    border: "3px solid rgba(0,255,255,0.3)",
    borderTopColor: "#00ffff",
    borderRadius: "50%",
    pointerEvents: "none",
    transition: "opacity 0.2s ease, transform 0.1s linear",
    opacity: 0,
    zIndex: 5,
    transform: "rotate(0deg)",
    left: "-9999px",
    top: "-9999px"
  });
  document.body.appendChild(wheel);

  // --- Hover highlight style ---
  const style = document.createElement("style");
  style.textContent = `
    .gaze-hover {
      outline: 2px solid #00ffff !important;
      box-shadow: 0 0 10px #00ffff88 !important;
      transition: box-shadow 0.1s ease;
    }
  `;
  document.head.appendChild(style);

  // --- Utility: find nearest clickable ancestor ---
  const findClickable = el => {
    const selector = "button, [onclick], [data-hover-click], input, .clickable";
    while (el && el !== document.body) {
      if (el.matches && el.matches(selector)) return el;
      el = el.parentElement;
    }
    return null;
  };

  // --- Update wheel position/rotation ---
  function updateWheel(x, y, progress) {
    wheel.style.left = `${x - 20}px`;
    wheel.style.top  = `${y - 20}px`;
    wheel.style.transform = `rotate(${progress * 360}deg)`;
    wheel.style.opacity = progress > 0 ? 1 : 0;
  }

  // --- Reset hover state ---
  function endHover() {
    if (hoverTarget) hoverTarget.classList.remove("gaze-hover");
    hoverTarget = null;
    hoverStart = null;
    hoverProgress = 0;
    wheel.style.opacity = 0;
  }

  // --- Main Loop ---
  function loop() {
    if (!window.smoothedCursor) return requestAnimationFrame(loop);
    const { x, y } = window.smoothedCursor;

    // ✨ Critical: ensure canvas doesn't block detection
    // temporarily disable pointer events to "see through"
    const canvases = document.querySelectorAll("canvas");
    canvases.forEach(c => c.style.pointerEvents = "none");

    // Now find the topmost clickable element under the cursor
    const elUnder = document.elementFromPoint(x, y);
    const clickable = findClickable(elUnder);

    // Restore pointer events immediately
    canvases.forEach(c => c.style.pointerEvents = "none");

    if (!clickable) {
      endHover();
      updateWheel(x, y, 0);
      requestAnimationFrame(loop);
      return;
    }

    // New hover target
    if (hoverTarget !== clickable) {
      if (hoverTarget) hoverTarget.classList.remove("gaze-hover");
      hoverTarget = clickable;
      hoverTarget.classList.add("gaze-hover");
      hoverStart = performance.now();
      hoverProgress = 0;
    } else {
      // Continue dwell timer
      const elapsed = performance.now() - hoverStart;
      hoverProgress = Math.min(elapsed / window.HOVER_TIME, 1);
    }

    // Update progress wheel
    updateWheel(x, y, hoverProgress);

    // Trigger click when dwell completes
    if (hoverProgress >= 1) {
      hoverTarget.click();
      endHover();
      updateWheel(x, y, 0);
    }

    requestAnimationFrame(loop);
  }

  loop();
})();
