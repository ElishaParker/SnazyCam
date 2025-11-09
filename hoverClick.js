// hoverClick.js
(function() {
  // --- Configurable defaults (will be overridden by menu sliders if present)
  window.HOVER_TIME = window.HOVER_TIME || 1500;  // ms to trigger click
  window.CURSOR_RADIUS = window.CURSOR_RADIUS || 15; // detection radius

  let hoverTarget = null;
  let hoverStart = null;
  let hoverProgress = 0;

  // Create loading wheel overlay
  const wheel = document.createElement("div");
  wheel.style.position = "fixed";
  wheel.style.width = "40px";
  wheel.style.height = "40px";
  wheel.style.border = "3px solid rgba(0,255,255,0.4)";
  wheel.style.borderTopColor = "#00ffff";
  wheel.style.borderRadius = "50%";
  wheel.style.pointerEvents = "none";
  wheel.style.zIndex = 9998;
  wheel.style.transition = "opacity 0.2s ease";
  wheel.style.opacity = 0;
  wheel.style.zIndex = 9999; // keep wheel and cursor above everything
  document.body.appendChild(wheel);

  function updateWheel(x, y, progress) {
    wheel.style.left = (x - 20) + "px";
    wheel.style.top = (y - 20) + "px";
    wheel.style.transform = `rotate(${progress * 360}deg)`;
    wheel.style.opacity = progress > 0 ? 1 : 0;
  }

  function isHoveringOver(el, x, y, radius) {
    const rect = el.getBoundingClientRect();
    const cx = (rect.left + rect.right) / 2;
    const cy = (rect.top + rect.bottom) / 2;
    const dx = x - cx;
    const dy = y - cy;
    return (
      x >= rect.left - radius &&
      x <= rect.right + radius &&
      y >= rect.top - radius &&
      y <= rect.bottom + radius
    );
  }

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
      if (hoverTarget !== clickable) {
        hoverTarget = clickable;
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
      hoverTarget = null;
      hoverStart = null;
      hoverProgress = 0;
      updateWheel(x, y, 0);
    }

    requestAnimationFrame(loop);
  }

  loop();
})();
