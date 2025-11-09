// hoverClick.js
(function() {
  // --- Configurable defaults (can be overridden by control panel sliders)
  window.HOVER_TIME = window.HOVER_TIME || 1500;   // ms to trigger click
  window.CURSOR_RADIUS = window.CURSOR_RADIUS || 15; // jitter tolerance radius

  let hoverTarget = null;
  let hoverStart = null;
  let hoverProgress = 0;
  let lastX = 0, lastY = 0;

  // --- Create loading wheel overlay ---
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
    zIndex: 9999, // keep above everything
    transform: "rotate(0deg)",
  });
  document.body.appendChild(wheel);

  // --- Helper to update the wheel’s position and rotation ---
  function updateWheel(x, y, progress) {
    wheel.style.left = `${x - 20}px`;
    wheel.style.top = `${y - 20}px`;
    wheel.style.transform = `rotate(${progress * 360}deg)`;
    wheel.style.opacity = progress > 0 ? 1 : 0;
  }

  // --- Distance helper for jitter tolerance ---
  function distance(x1, y1, x2, y2) {
    return Math.hypot(x2 - x1, y2 - y1);
  }

  // --- Main hover tracking loop ---
  function loop() {
    if (!window.smoothedCursor) {
      requestAnimationFrame(loop);
      return;
    }

    const { x, y } = window.smoothedCursor;
    const hoverRadius = window.CURSOR_RADIUS;
    const hoverTime = window.HOVER_TIME;

    // Find topmost clickable element under cursor
    const elements = document.elementsFromPoint(x, y);
    const clickable = elements.find(el =>
      el.matches("button, [onclick], [data-hover-click], input, .clickable")
    );

    if (clickable) {
      // If a new target, start hover timer
      if (hoverTarget !== clickable) {
        hoverTarget = clickable;
        hoverStart = performance.now();
      }

      // If cursor moved too far, reset timer
      if (distance(x, y, lastX, lastY) > hoverRadius) {
        hoverStart = performance.now();
      }

      const elapsed = performance.now() - hoverStart;
      hoverProgress = Math.min(elapsed / hoverTime, 1);
      updateWheel(x, y, hoverProgress);

      if (hoverProgress >= 1) {
        hoverTarget.click();
        hoverTarget = null;
        hoverStart = null;
        hoverProgress = 0;
        updateWheel(x, y, 0);
      }
    } else {
      // Reset when leaving target
      hoverTarget = null;
      hoverStart = null;
      hoverProgress = 0;
      updateWheel(x, y, 0);
    }

    lastX = x;
    lastY = y;

    requestAnimationFrame(loop);
  }

  // --- CSS animation (for fallback) ---
  const style = document.createElement("style");
  style.textContent = `
    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
  `;
  document.head.appendChild(style);

  loop();
})();
