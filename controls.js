// 
(function() {
  const panel = document.createElement('div');
  panel.id = 'controls';
  panel.innerHTML = `
    <h3>Tracking Settings</h3>
    <div class="slider-group">
      ${[
        ['SMOOTHING_ALPHA', 0.1, 0.01, 0.5, 0.01],
        ['NOSE_SMOOTH_ALPHA', 0.08, 0.01, 0.5, 0.01],
        ['CURSOR_ALPHA', 0.2, 0.01, 0.5, 0.01],
        ['SENSITIVITY_X', 1.0, 0.1, 3, 0.1],
        ['SENSITIVITY_Y', 1.0, 0.1, 3, 0.1],
        ['VIRTUAL_SCALE', 15, 1, 30, 1],
        ['CLAMP_THRESHOLD', 1.0, 0, 10, 0.1],
        ['CLAMP_EASE', 0.05, 0.01, 0.5, 0.01],
        ['VERTICAL_FINE_TUNE', 15, -100, 100, 1],
        ['HORIZONTAL_FINE_TUNE', 25, -100, 100, 1]
      ].map(([id, val, min, max, step]) => `
        <label>${id} <span id="val_${id}">${val}</span></label>
        <input id="${id}" type="range" min="${min}" max="${max}" step="${step}" value="${val}">
      `).join('')}
    </div>
    <button id="toggleBtn">⚙️</button>
  `;
  document.body.appendChild(panel);

  // Styles
  const style = document.createElement('style');
  style.textContent = `
    #controls {
      position: fixed; bottom: 10px; right: 10px;
      background: rgba(0,0,0,0.7);
      color: #0ff;
      padding: 10px 14px;
      border: 1px solid #0ff;
      border-radius: 10px;
      font-family: monospace;
      width: 260px;
      max-height: 90vh;
      overflow-y: auto;
      z-index: 9999;
      transition: transform 0.3s ease, opacity 0.3s ease;
    }
    #controls.collapsed { transform: translateY(90%); opacity: 0.5; }
    #controls h3 {
      margin: 0 0 10px; font-size: 14px; text-align: center; color: #00ffff;
    }
    .slider-group label { display:block; margin-top:6px; font-size:12px; }
    .slider-group input[type=range] { width:100%; accent-color:#00ffff; }
    #toggleBtn {
      position:absolute; top:-30px; right:0;
      background:#00ffff; color:#000;
      border:none; border-radius:6px 6px 0 0;
      cursor:pointer; padding:4px 8px;
    }
  `;
  document.head.appendChild(style);

  // Toggle visibility
  const toggleBtn = panel.querySelector('#toggleBtn');
  toggleBtn.addEventListener('click', () => panel.classList.toggle('collapsed'));

  // Attach live updates to globals
  const ids = [
    'SMOOTHING_ALPHA','NOSE_SMOOTH_ALPHA','CURSOR_ALPHA',
    'SENSITIVITY_X','SENSITIVITY_Y','VIRTUAL_SCALE',
    'CLAMP_THRESHOLD','CLAMP_EASE','VERTICAL_FINE_TUNE','HORIZONTAL_FINE_TUNE'
  ];
  ids.forEach(id => {
    const input = document.getElementById(id);
    const valLabel = document.getElementById(`val_${id}`);
    input.addEventListener('input', () => {
      window[id] = parseFloat(input.value);
      valLabel.textContent = input.value;
    });
  });
})();

