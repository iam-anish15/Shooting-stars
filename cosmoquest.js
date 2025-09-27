// =====================
// script.js — Impact enhancements: starfield, shockwave rings, dust particles
// Full file — replace existing script.js with this
// =====================

// ---------------------
// Asteroid dataset
// ---------------------
const asteroids = [
  {name:"2020 Q03", diameter:200, velocity:18, eccentricity:0.12, notes:"Near-Earth asteroid"},
  {name:"2021 PDC", diameter:400, velocity:22, eccentricity:0.18, notes:"Planetary Defense Conference scenario"},
  {name:"Apophis", diameter:370, velocity:7.4, eccentricity:0.191, notes:"Close Earth approach 2029"},
  {name:"2019 OK", diameter:150, velocity:24, eccentricity:0.444, notes:"Surprised scientists in July 2019"},
  {name:"Bennu", diameter:490, velocity:28, eccentricity:0.2037, notes:"Target of NASA OSIRIS-REx mission"}
];

// ---------------------
// DOM elements
// ---------------------
const asteroidSelect = document.getElementById('asteroidSelect');
const infoBtn = document.getElementById('infoBtn');
const infoPopup = document.getElementById('infoPopup');
const closePopup = document.getElementById('closePopup');
const asteroidDetails = document.getElementById('asteroidDetails');

const diameterSlider = document.getElementById('diameter');
const velocitySlider = document.getElementById('velocity');
const angleSlider = document.getElementById('angle');
const diameterVal = document.getElementById('diameterVal');
const velocityVal = document.getElementById('velocityVal');
const angleVal = document.getElementById('angleVal');

const simulateBtn = document.getElementById('simulateBtn');
const resetBtn = document.getElementById('resetBtn');

const impactCanvas = document.getElementById('impactCanvas');
const playImpact = document.getElementById('playImpact');
let ctx = impactCanvas.getContext('2d');

// Quiz
const quizContainer = document.querySelector('.quiz-container');
const prevQuestionBtn = document.getElementById('prevQuestion');
const nextQuestionBtn = document.getElementById('nextQuestion');

// Results
const energyVal = document.getElementById('energyVal');
const craterVal = document.getElementById('craterVal');
const massVal = document.getElementById('massVal');
const velocityResVal = document.getElementById('velocityResVal');

// ---------------------
// Populate asteroid select
// ---------------------
(function populateAsteroidSelect(){
  asteroids.forEach((a, i) => {
    const option = document.createElement('option');
    option.value = i;
    option.textContent = a.name;
    asteroidSelect.appendChild(option);
  });
})();

// ---------------------
// Info popup
// ---------------------
infoBtn.addEventListener('click', ()=>{
  const idx = asteroidSelect.value || 0;
  const a = asteroids[idx];
  asteroidDetails.innerHTML = `
    <strong>${a.name}</strong><br>
    Diameter: ${a.diameter} m<br>
    Velocity: ${a.velocity} km/s<br>
    Eccentricity: ${a.eccentricity}<br>
    Notes: ${a.notes}
  `;
  infoPopup.style.display = 'flex';
});
closePopup.addEventListener('click', ()=> infoPopup.style.display='none');
infoPopup.addEventListener('click', (e)=> { if(e.target === infoPopup) infoPopup.style.display='none'; });

// ---------------------
// Slider mirrors
// ---------------------
diameterSlider.addEventListener('input', ()=> diameterVal.textContent = diameterSlider.value);
velocitySlider.addEventListener('input', ()=> velocityVal.textContent = velocitySlider.value);
angleSlider.addEventListener('input', ()=> angleVal.textContent = angleSlider.value);

// ---------------------
// Simulate / Reset (simple physics placeholders)
// ---------------------
simulateBtn.addEventListener('click', ()=> {
  const d = parseFloat(diameterSlider.value);
  const v = parseFloat(velocitySlider.value);
  const angle = parseFloat(angleSlider.value);

  // rough proxies (for demo only)
  const mass = 0.5 * d * d * d; // arbitrary proxy for "mass"
  const energy = 0.5 * mass * v * v; 
  const crater = d * (angle/45) * 0.8;

  massVal.textContent = mass.toFixed(1);
  energyVal.textContent = energy.toFixed(1);
  craterVal.textContent = crater.toFixed(1);
  velocityResVal.textContent = v;
});

resetBtn.addEventListener('click', ()=>{
  diameterSlider.value = 100;
  velocitySlider.value = 20;
  angleSlider.value = 45;
  diameterVal.textContent = 100;
  velocityVal.textContent = 20;
  angleVal.textContent = 45;

  massVal.textContent = '--';
  energyVal.textContent = '--';
  craterVal.textContent = '--';
  velocityResVal.textContent = '--';

  // clear canvas using CSS dims
  const {cssW, cssH} = scaleCanvasToDisplaySize(impactCanvas, ctx);
  ctx.clearRect(0,0, cssW, cssH);
});

// ---------------------
// DPR-aware canvas scaling helper (robust)
// ---------------------
function scaleCanvasToDisplaySize(canvas, context){
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  const cssW = Math.max(1, Math.round(rect.width || canvas.clientWidth || parseInt(canvas.getAttribute('width')) || 300));
  const cssH = Math.max(1, Math.round(rect.height || canvas.clientHeight || parseInt(canvas.getAttribute('height')) || 200));
  const displayWidth = Math.round(cssW * dpr);
  const displayHeight = Math.round(cssH * dpr);
  if (canvas.width !== displayWidth || canvas.height !== displayHeight) {
    canvas.width = displayWidth;
    canvas.height = displayHeight;
  }
  canvas.style.width = cssW + 'px';
  canvas.style.height = cssH + 'px';
  context.setTransform(dpr, 0, 0, dpr, 0, 0); // draw in CSS pixels
  return { cssW, cssH, dpr };
}

// Initial scale
scaleCanvasToDisplaySize(impactCanvas, ctx);
window.addEventListener('resize', ()=> scaleCanvasToDisplaySize(impactCanvas, ctx));

// ---------------------
// Starfield (twinkling stars) — generated once per canvas size
// ---------------------
let stars = [];
function generateStarfield(cssW, cssH, count = 60){
  stars = [];
  for(let i=0;i<count;i++){
    stars.push({
      x: Math.random()*cssW,
      y: Math.random()*cssH*0.6, // upper area mostly
      r: Math.random()*1.4 + 0.2,
      baseA: 0.08 + Math.random()*0.4,
      phase: Math.random()*Math.PI*2
    });
  }
}

// regenerate stars when canvas size changes
(function initStars(){
  const {cssW, cssH} = scaleCanvasToDisplaySize(impactCanvas, ctx);
  generateStarfield(cssW, cssH, 80);
})();

// ---------------------
// Cinematic enhanced impact animation + shockwaves + dust
// ---------------------
let rafId = null;

playImpact.addEventListener('click', () => {
  // ensure crisp canvas and get CSS dims
  const {cssW, cssH, dpr} = scaleCanvasToDisplaySize(impactCanvas, ctx);
  // regenerate stars to fit size (keeps density consistent)
  if(!stars || stars.length === 0) generateStarfield(cssW, cssH, 80);

  // clear in CSS pixels
  ctx.clearRect(0, 0, cssW, cssH);

  // read controls
  const diameter = parseFloat(diameterSlider.value); // meters
  const velocity = parseFloat(velocitySlider.value); // km/s
  const angleDeg = parseFloat(angleSlider.value);
  const angleRad = angleDeg * Math.PI / 180;

  // visual tuning
  const scale = Math.max(0.5, Math.min(1.8, diameter / 180)); // slightly larger visuals
  const speedFactor = Math.max(0.6, Math.min(3.0, velocity / 15));

  // meteor initial state (CSS pixel coords)
  const meteor = {
    x: Math.max(40, cssW*0.08), // move a bit right so path is larger
    y: -30,
    radius: Math.max(5, (diameter / 18) * scale),
    vx: (Math.cos(angleRad) * velocity * 0.9) * 0.6 * speedFactor,
    vy: (Math.sin(angleRad) * velocity * 0.9) * 0.6 * speedFactor,
    trail: []
  };

  // particle containers
  const trailMax = 90; // longer trails
  const sparks = [];
  const debris = [];
  const shockwaves = [];
  const dust = []; // dust particles for aftermath

  let shake = 0;
  let stage = 1;
  let impactRadius = 0;
  const groundY = cssH - 14; // CSS pixels, a bit higher room for crater

  const rand = (a,b) => a + Math.random()*(b-a);

  // seed trail
  meteor.trail.push({x: meteor.x, y: meteor.y, r: meteor.radius*0.85, a: 1});

  // cancel previous RAF if running
  if (rafId) cancelAnimationFrame(rafId);

  function animateEnhanced(){
    // re-calc dims in case layout changed
    const dims = scaleCanvasToDisplaySize(impactCanvas, ctx);
    const w = dims.cssW, h = dims.cssH;

    // Draw starfield first (twinkling)
    ctx.save();
    // Fill background subtle gradient then stars
    ctx.fillStyle = 'rgba(4,8,22,0.3)';
    ctx.fillRect(0,0,w,h);
    for(let s of stars){
      // twinkle via sinusoidal alpha
      const tw = 0.5 + 0.5*Math.sin((Date.now()*0.002) + s.phase);
      const alpha = Math.max(0.03, s.baseA * tw);
      ctx.beginPath();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = 'white';
      ctx.arc(s.x, s.y, s.r, 0, Math.PI*2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }
    ctx.restore();

    // overlay a very subtle vignette / darkening to keep focus on meteor
    ctx.fillStyle = 'rgba(0,0,0,0.08)';
    ctx.fillRect(0,0,w,h);

    // camera shake
    ctx.save();
    if (shake > 0) {
      const sx = rand(-shake, shake);
      const sy = rand(-shake, shake);
      ctx.translate(sx, sy);
      shake *= 0.9;
    }

    if(stage === 1){
      // update meteor (scale movement to fit canvas)
      meteor.x += meteor.vx * 0.05 * Math.max(0.6, w/300);
      meteor.y += meteor.vy * 0.05 * Math.max(0.6, h/200);

      // add trail particle
      meteor.trail.push({
        x: meteor.x,
        y: meteor.y,
        r: meteor.radius * (0.6 + Math.random()*0.9),
        a: 1,
        life: rand(24, 44) * (1 / speedFactor)
      });
      if (meteor.trail.length > trailMax) meteor.trail.shift();

      // sparks
      if(Math.random() < 0.42 * Math.min(1.4, speedFactor/1.2)) {
        sparks.push({
          x: meteor.x + rand(-meteor.radius, meteor.radius),
          y: meteor.y + rand(-meteor.radius, meteor.radius),
          vx: rand(-1.8, 1.8) + meteor.vx*0.02,
          vy: rand(-1.8, 1.8) + meteor.vy*0.02,
          r: rand(0.6,2.6),
          a: 1
        });
      }

      // draw trail: oldest to newest for nice blur layering
      for(let i=0;i<meteor.trail.length;i++){
        const p = meteor.trail[i];
        ctx.beginPath();
        ctx.globalAlpha = Math.max(0, p.a * 0.9);
        const glow = Math.min(1, 0.4 + speedFactor*0.35);
        ctx.fillStyle = `rgba(255,${200 - Math.floor(30*speedFactor)},${120},${p.a})`;
        ctx.shadowBlur = 10 * Math.min(2.6, speedFactor);
        ctx.shadowColor = `rgba(255,${220 - Math.floor(60*speedFactor)},150,${p.a})`;
        ctx.arc(p.x, p.y, p.r, 0, Math.PI*2);
        ctx.fill();
        ctx.globalAlpha = 1;
        p.a -= 0.022 * (1 + (1/speedFactor)*0.5);
      }
      meteor.trail = meteor.trail.filter(p=>p.a>0);

      // meteor body (bigger and shinier)
      ctx.beginPath();
      ctx.shadowBlur = 28 * Math.min(2.6, speedFactor);
      ctx.shadowColor = 'rgba(255,245,200,0.96)';
      ctx.fillStyle = 'rgba(255,220,120,1)';
      ctx.arc(meteor.x, meteor.y, meteor.radius, 0, Math.PI*2);
      ctx.fill();
      ctx.shadowBlur = 0;

      // sparks update/draw
      for(let i=sparks.length-1;i>=0;i--){
        const s = sparks[i];
        s.x += s.vx;
        s.y += s.vy;
        s.vy += 0.04; // gravity to sparks
        s.a -= 0.02;
        if(s.a <= 0) { sparks.splice(i,1); continue; }
        ctx.beginPath();
        ctx.globalAlpha = s.a;
        ctx.fillStyle = 'rgba(255,240,160,1)';
        ctx.arc(s.x, s.y, s.r, 0, Math.PI*2);
        ctx.fill();
        ctx.globalAlpha = 1;
      }

      // impact check
      if (meteor.y + meteor.radius >= groundY) {
        stage = 2;

        // push multiple concentric shockwave rings for richer aftermath
        const ringCount = 3 + Math.round(Math.min(4, diameter/120));
        for(let r=0;r<ringCount;r++){
          shockwaves.push({
            x: meteor.x,
            y: groundY,
            r: 6 + r*6,
            maxR: Math.max(80, diameter * (1.6 + r*0.18)),
            a: 0.95 - r*0.12
          });
        }

        // debris
        const debrisCount = Math.round(26 + 12 * (diameter/200));
        for(let i=0;i<debrisCount;i++){
          const angle = rand(0, Math.PI*2);
          const speed = rand(1,4) * (speedFactor/1.05);
          debris.push({
            x: meteor.x,
            y: groundY,
            vx: Math.cos(angle)*speed,
            vy: Math.sin(angle)*speed * 0.6 - 1,
            r: rand(1.6,5.2),
            a: 1,
            gravity: 0.12 + Math.random()*0.08
          });
        }

        // dust particles (slower, fill the area with light gray dust)
        const dustCount = Math.round(40 + 20 * (diameter/200));
        for(let i=0;i<dustCount;i++){
          const ang = rand(0, Math.PI*2);
          const sp = rand(0.4, 2.2) * (speedFactor/1.1);
          dust.push({
            x: meteor.x,
            y: groundY - rand(0,3),
            vx: Math.cos(ang) * sp,
            vy: Math.sin(ang) * sp * 0.35 - 0.4,
            r: rand(0.6, 2.6),
            a: 0.9 + Math.random()*0.4,
            gravity: 0.02 + Math.random()*0.03,
            fade: 0.004 + Math.random()*0.01
          });
        }

        shake = 7 + speedFactor*4;
      }

    } else if(stage === 2){
      // impact visuals: rings + debris + dust + crater
      impactRadius += 3.2 * (1 + speedFactor*0.45);

      // shockwaves (update multiple rings)
      for(let i = shockwaves.length-1; i>=0; i--){
        const sw = shockwaves[i];
        sw.r += 3.6 * (1 + speedFactor*0.4);
        sw.a -= 0.013;
        if(sw.a <= 0 || sw.r > sw.maxR + 60) shockwaves.splice(i,1);
        else {
          ctx.beginPath();
          ctx.globalAlpha = Math.max(0, sw.a*0.95);
          ctx.lineWidth = 2 + (1.2 * Math.min(3, speedFactor));
          ctx.strokeStyle = `rgba(255,170,90,${sw.a})`;
          ctx.arc(sw.x, sw.y, sw.r, 0, Math.PI*2);
          ctx.stroke();
          ctx.globalAlpha = 1;
        }
      }

      // debris updates (same as before)
      for(let i=debris.length-1;i>=0;i--){
        const d = debris[i];
        d.x += d.vx;
        d.y += d.vy;
        d.vy += d.gravity;
        d.vx *= 0.996;
        d.a -= 0.012;
        if(d.a <= 0 || d.y > groundY + 80) { debris.splice(i,1); continue; }
        ctx.beginPath();
        ctx.globalAlpha = d.a;
        ctx.fillStyle = 'rgba(120,110,100,1)';
        ctx.arc(d.x, d.y, d.r, 0, Math.PI*2);
        ctx.fill();
        ctx.globalAlpha = 1;
      }

      // dust update & draw (finer, gives sense of spreading ash)
      for(let i=dust.length-1;i>=0;i--){
        const p = dust[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += p.gravity;
        p.vx *= 0.998;
        p.a -= p.fade;
        if(p.a <= 0 || p.y > groundY + 80) { dust.splice(i,1); continue; }
        ctx.beginPath();
        ctx.globalAlpha = Math.max(0, p.a*0.9);
        ctx.fillStyle = `rgba(160,150,140,${p.a})`;
        ctx.arc(p.x, p.y, p.r, 0, Math.PI*2);
        ctx.fill();
        ctx.globalAlpha = 1;
      }

      // crater (growing dark circle)
      ctx.beginPath();
      const craterGrow = Math.min(impactRadius, diameter * 1.8);
      ctx.fillStyle = 'rgba(35,35,35,0.96)';
      ctx.arc(meteor.x, groundY, craterGrow, 0, Math.PI*2);
      ctx.fill();

      // heated ejecta glow (subtle)
      ctx.beginPath();
      ctx.globalAlpha = 0.22;
      ctx.fillStyle = 'rgba(255,140,70,1)';
      ctx.arc(meteor.x, groundY - 2, craterGrow * 0.6, 0, Math.PI*2);
      ctx.fill();
      ctx.globalAlpha = 1;

      // finish criteria: wait until rings & debris & dust decay sufficiently
      if(shockwaves.length === 0 && debris.length === 0 && dust.length === 0 && craterGrow > diameter*1.3){
        // final pause then clear and stop
        setTimeout(()=> {
          ctx.clearRect(0,0, w, h);
          if (rafId) cancelAnimationFrame(rafId);
        }, 1100);
        ctx.restore();
        return;
      }
    }

    ctx.restore(); // undo camera shake

    // next frame
    rafId = requestAnimationFrame(animateEnhanced);
  }

  // start
  animateEnhanced();
});

// ---------------------
// Educational Quiz with scoring + restart
// ---------------------
const quizQuestions = [
  {q:"Which asteroid is predicted to make a very close approach in 2029?", options:["Apophis","Bennu","2019 OK"], answer:0},
  {q:"Which asteroid was the target of NASA's OSIRIS-REx mission?", options:["2021 PDC","Bennu","2020 Q03"], answer:1},
  {q:"What major hazard can an asteroid like 2019 OK cause if it hit the ocean?", options:["Earthquake","Tsunami","Aurora"], answer:1},
  {q:"Impact energy is usually expressed in what equivalent unit?", options:["Joules","Megatons of TNT","Watts"], answer:1},
  {q:"Which factor has the biggest influence on crater size?", options:["Impact angle","Diameter","Color of asteroid"], answer:1},
];

let currentQuestion = 0;

function renderQuiz(){
  quizContainer.innerHTML = '';
  quizQuestions.forEach((q,i)=>{
    const div = document.createElement('div');
    div.className = 'quiz-question';
    div.style.transform = `translateX(${(i-currentQuestion)*100}%)`;

    const h3 = document.createElement('h3');
    h3.textContent = q.q;
    div.appendChild(h3);

    q.options.forEach((opt, idx) => {
      const btn = document.createElement('button');
      btn.textContent = opt;
      if(q.user === idx) btn.style.background = '#3E98FF';
      btn.addEventListener('click', ()=> {
        q.user = idx;
        Array.from(div.querySelectorAll('button')).forEach(b=>{
          b.style.background = '#1E1E1E';
        });
        btn.style.background = '#3E98FF';
      });
      div.appendChild(btn);
    });

    quizContainer.appendChild(div);
  });
}

prevQuestionBtn.addEventListener('click', ()=> {
  if(currentQuestion>0) currentQuestion--;
  renderQuiz();
});

nextQuestionBtn.addEventListener('click', ()=> {
  if(currentQuestion < quizQuestions.length-1){
    currentQuestion++;
    renderQuiz();
  } else {
    // calculate score
    let score = 0;
    quizQuestions.forEach(q=> { if(q.user === q.answer) score++; });

    quizContainer.innerHTML = `
      <h3>Quiz Completed!</h3>
      <p>Your Score: ${score} / ${quizQuestions.length}</p>
      <div style="margin-top:12px;">
        <button id="restartQuiz">Restart Quiz</button>
      </div>
    `;
    document.getElementById('restartQuiz').addEventListener('click', ()=>{
      currentQuestion = 0;
      quizQuestions.forEach(q=> delete q.user);
      renderQuiz();
    });
  }
});

// initial render
renderQuiz();


