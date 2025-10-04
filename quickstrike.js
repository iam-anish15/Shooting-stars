document.addEventListener('DOMContentLoaded', () => {

  const earthContainer = document.getElementById('earth-container');
  const quickstrikeBtn = document.getElementById('quickstrikeBtn');
  const snapshotBtn = document.getElementById('snapshotBtn');
  const downloadBtn = document.getElementById('downloadBtn');
  const reportDiv = document.getElementById('report');

  const blastPanel = document.getElementById('blastReport');
  const energyOutput = document.getElementById('energyOutput');
  const craterOutput = document.getElementById('craterOutput');
  const advisoryOutput = document.getElementById('advisoryOutput');

  let targetX = 0, targetY = 0;

  // ---------- Helper to add report with highlight ----------
  function addReport(text) {
    const p = document.createElement('p');
    p.innerHTML = text;
    p.style.transition = 'background 0.6s';
    reportDiv.appendChild(p);
    reportDiv.scrollTop = reportDiv.scrollHeight;
    p.style.background = 'rgba(0,255,255,0.2)';
    setTimeout(() => p.style.background = 'transparent', 800);
  }

  // ---------- Target selection ----------
  earthContainer.addEventListener('click', e => {
    const rect = earthContainer.getBoundingClientRect();
    targetX = e.clientX - rect.left;
    targetY = e.clientY - rect.top;

    // show target indicator
    let targetDot = document.getElementById('targetDot');
    if (!targetDot) {
      targetDot = document.createElement('div');
      targetDot.id = 'targetDot';
      targetDot.style = `
        position:absolute;width:20px;height:20px;
        border:2px solid cyan;border-radius:50%;
        transform:translate(-50%,-50%);
        pointer-events:none;z-index:9999;
      `;
      document.body.appendChild(targetDot);
    }
    const earthRect = earthContainer.getBoundingClientRect();
    targetDot.style.left = earthRect.left + targetX + 'px';
    targetDot.style.top = earthRect.top + targetY + 'px';

    addReport(`🎯 Target selected at (${Math.round(targetX)}, ${Math.round(targetY)})`);
  });

  // ---------- Blast report calculation ----------
  function calculateBlastReport(diameterKm, density = 3000, velocityKms, angleDeg) {
    const diameter = diameterKm * 1000;
    const velocity = velocityKms * 1000;
    const angleRad = angleDeg * Math.PI / 180;
    const radius = diameter / 2;
    const mass = (4/3) * Math.PI * Math.pow(radius, 3) * density;
    const energy = 0.5 * mass * Math.pow(velocity, 2);
    const energyTNT = energy / 4.184e15;
    const effectiveEnergy = energy * Math.sin(angleRad);
    const g = 9.81, rhoTarget = 2500;
    const crater = 1.161 * Math.pow((g * effectiveEnergy) / rhoTarget, 0.22);
    const craterKm = crater / 1000;

    let advisory = "";
    if (energyTNT < 0.001) advisory = "☑ Harmless – Burns in atmosphere";
    else if (energyTNT < 1) advisory = "⚠ Small – Local damage possible";
    else if (energyTNT < 100) advisory = "🔥 Severe – City-scale destruction";
    else advisory = "🌍 Catastrophic – Global consequences";

    return { energyTNT: energyTNT.toFixed(2), craterKm: craterKm.toFixed(2), advisory };
  }

  // ---------- Asteroid drop animation ----------
  function dropAsteroid(targetX, targetY) {
    const asteroid = document.createElement('div');
    asteroid.classList.add('asteroid');
    asteroid.style.position = 'absolute';
    asteroid.style.width = asteroid.style.height = '30px';
    asteroid.style.left = window.innerWidth / 2 - 15 + 'px';
    asteroid.style.top = '-50px';
    asteroid.style.zIndex = 999;
    document.body.appendChild(asteroid);

    const diameter = (Math.random() * 4 + 0.1).toFixed(2);
    const velocity = (Math.random() * 45 + 5).toFixed(2);
    const angle = (Math.random() * 80 + 10).toFixed(0);

    const rect = earthContainer.getBoundingClientRect();
    const targetPosX = rect.left + targetX - 15;
    const targetPosY = rect.top + targetY - 15;

    const dx = (targetPosX - (window.innerWidth / 2 - 15)) / 50;
    let posY = -50;

    const interval = setInterval(() => {
      posY += 8;
      asteroid.style.top = posY + 'px';
      asteroid.style.left = parseFloat(asteroid.style.left) + dx + 'px';

      // Add mini trail
      const trail = document.createElement('div');
      trail.style = `
        position:absolute;width:8px;height:8px;
        background:rgba(255,204,0,0.5);
        border-radius:50%;pointer-events:none;z-index:998;
        left:${parseFloat(asteroid.style.left)+11}px;
        top:${posY+11}px;
      `;
      document.body.appendChild(trail);
      setTimeout(() => trail.remove(), 300);

      if (posY >= targetPosY) {
        clearInterval(interval);
        asteroid.remove();

        // Mini explosion
        const explosion = document.createElement('div');
        explosion.classList.add('mini-explosion');
        explosion.style.left = targetPosX + 'px';
        explosion.style.top = targetPosY + 'px';
        document.body.appendChild(explosion);
        setTimeout(() => explosion.remove(), 600);

        const report = calculateBlastReport(diameter, 3000, velocity, angle);
        addReport(`💥 Asteroid hit! Diameter: ${diameter} km, Velocity: ${velocity} km/s, Angle: ${angle}°`);

        // Show blast panel with pulse
        blastPanel.classList.remove('update-glow');
        void blastPanel.offsetWidth; // trigger reflow
        blastPanel.classList.add('update-glow');

        blastPanel.classList.remove('hidden');
        energyOutput.innerText = `Impact Energy: ${report.energyTNT} Mt TNT`;
        craterOutput.innerText = `Crater Diameter: ${report.craterKm} km`;
        advisoryOutput.innerText = report.advisory;
      }
    }, 20);
  }

  // ---------- Quickstrike button ----------
  quickstrikeBtn.addEventListener('click', () => {
    if (targetX === 0 && targetY === 0) {
      addReport("⚠ Click on Earth first!");
      return;
    }
    dropAsteroid(targetX, targetY);
  });

  // ---------------- Snapshot overlay helpers ----------------
  function removeSnapshotOverlay() {
    const existing = document.getElementById('snapshotOverlay');
    if (existing) existing.remove();
    const loader = document.getElementById('snapshotLoader');
    if (loader) loader.remove();
  }

  // ---------- Snapshot ----------
  snapshotBtn.addEventListener('click', () => {
    removeSnapshotOverlay();

    const loader = document.createElement('div');
    loader.id = 'snapshotLoader';
    loader.textContent = 'Capturing…';
    loader.style = 'position:fixed;top:16px;right:16px;padding:8px 12px;background:rgba(0,0,0,0.7);color:#fff;border-radius:8px;z-index:10005;';
    document.body.appendChild(loader);

    html2canvas(document.querySelector('.bg-container'), { useCORS: true, scale: window.devicePixelRatio || 1 })
      .then((canvas) => {
        if (loader) loader.remove();

        const overlay = document.createElement('div');
        overlay.id = 'snapshotOverlay';
        overlay.style = `position:fixed;inset:0;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.6);z-index:10000;padding:20px;`;

        const box = document.createElement('div');
        box.style = 'max-width:95vw;max-height:95vh;display:flex;flex-direction:column;align-items:center;gap:12px;';

        canvas.id = 'snapshotCanvas';
        canvas.style.maxWidth = '90vw';
        canvas.style.maxHeight = '75vh';
        canvas.style.borderRadius = '10px';
        canvas.style.boxShadow = '0 10px 30px rgba(0,0,0,0.5)';

        const toolbar = document.createElement('div');
        toolbar.style = 'display:flex;gap:10px;align-items:center;';

        const downloadOverlayBtn = document.createElement('button');
        downloadOverlayBtn.innerText = 'Download Snapshot';
        downloadOverlayBtn.style = 'padding:8px 12px;border-radius:8px;border:none;cursor:pointer;background:#1f8ef1;color:white;';

        const closeBtn = document.createElement('button');
        closeBtn.innerText = 'Close';
        closeBtn.style = 'padding:8px 12px;border-radius:8px;border:none;cursor:pointer;background:#777;color:white;';

        toolbar.appendChild(downloadOverlayBtn);
        toolbar.appendChild(closeBtn);

        box.appendChild(canvas);
        box.appendChild(toolbar);
        overlay.appendChild(box);
        document.body.appendChild(overlay);

        downloadOverlayBtn.addEventListener('click', () => {
          const link = document.createElement('a');
          link.download = `quickstrike_snapshot_${Date.now()}.png`;
          link.href = canvas.toDataURL('image/png');
          link.click();
          removeSnapshotOverlay();
        });

        closeBtn.addEventListener('click', removeSnapshotOverlay);
        overlay.addEventListener('click', (ev) => { if (ev.target === overlay) removeSnapshotOverlay(); });
        document.addEventListener('keydown', e => { if(e.key==='Escape') removeSnapshotOverlay(); });
      })
      .catch(err => {
        if (loader) loader.remove();
        console.error('Snapshot error', err);
        alert('Snapshot failed — check console for details.');
      });
  });

  // ---------- Download button ----------
  downloadBtn.addEventListener('click', () => {
    const overlayCanvas = document.querySelector('#snapshotOverlay canvas#snapshotCanvas');
    if (overlayCanvas) {
      const link = document.createElement('a');
      link.download = `quickstrike_snapshot_${Date.now()}.png`;
      link.href = overlayCanvas.toDataURL('image/png');
      link.click();
      removeSnapshotOverlay();
    } else {
      alert('No snapshot available. Click "Snapshot" first to capture.');
    }
  });

});


function dropAsteroid(targetX, targetY) {
  const asteroid = document.createElement('div');
  asteroid.classList.add('asteroid');
  asteroid.style.position = 'absolute';

  // responsive asteroid size
  const asteroidSize = Math.max(12, Math.min(30, window.innerWidth * 0.03));
  asteroid.style.width = asteroid.style.height = asteroidSize + 'px';

  asteroid.style.left = window.innerWidth / 2 - asteroidSize/2 + 'px';
  asteroid.style.top = '-50px';
  document.body.appendChild(asteroid);

  const diameter = (Math.random() * 4 + 0.1).toFixed(2);
  const velocity = (Math.random() * 45 + 5).toFixed(2);
  const angle = (Math.random() * 80 + 10).toFixed(0);

  const rect = earthContainer.getBoundingClientRect();
  const targetPosX = rect.left + targetX - asteroidSize/2;
  const targetPosY = rect.top + targetY - asteroidSize/2;

  const dx = (targetPosX - (window.innerWidth / 2 - asteroidSize/2)) / 50;
  let posY = -50;

  const interval = setInterval(() => {
    posY += Math.max(4, window.innerHeight * 0.01); // speed scales with screen
    asteroid.style.top = posY + 'px';
    asteroid.style.left = parseFloat(asteroid.style.left) + dx + 'px';

    // asteroid trail
    const trail = document.createElement('div');
    trail.classList.add('asteroid-trail');
    const trailSize = Math.max(3, Math.min(8, window.innerWidth * 0.01));
    trail.style.width = trail.style.height = trailSize + 'px';
    trail.style.left = asteroid.style.left;
    trail.style.top = asteroid.style.top;
    document.body.appendChild(trail);
    setTimeout(() => trail.remove(), 300);

    if (posY >= targetPosY) {
      clearInterval(interval);
      asteroid.remove();

      // mini explosion
      const explosion = document.createElement('div');
      explosion.classList.add('mini-explosion');
      const expSize = Math.max(15, Math.min(40, window.innerWidth * 0.05));
      explosion.style.width = explosion.style.height = expSize + 'px';
      explosion.style.left = targetPosX + 'px';
      explosion.style.top = targetPosY + 'px';
      document.body.appendChild(explosion);
      setTimeout(() => explosion.remove(), 600);

      const report = calculateBlastReport(diameter, 3000, velocity, angle);
      reportDiv.innerHTML += `<p>💥 Asteroid hit! Diameter: ${diameter} km, Velocity: ${velocity} km/s, Angle: ${angle}°</p>`;
      reportDiv.scrollTop = reportDiv.scrollHeight;

      // Show blast panel
      blastPanel.classList.remove('hidden');
      energyOutput.innerText = `Impact Energy: ${report.energyTNT} Mt TNT`;
      craterOutput.innerText = `Crater Diameter: ${report.craterKm} km`;
      advisoryOutput.innerText = report.advisory;
      blastPanel.classList.add('update-glow');
      setTimeout(() => blastPanel.classList.remove('update-glow'), 600);
    }
  }, 20);
}


window.addEventListener('resize', () => {
  const size = Math.max(120, Math.min(250, window.innerWidth * 0.25));
  earthContainer.style.width = earthContainer.style.height = size + 'px';
});
