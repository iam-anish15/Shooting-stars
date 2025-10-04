// ---------- UI Elements ----------
const sizeSlider = document.getElementById('sizeSlider');
const speedSlider = document.getElementById('speedSlider');
const angleSlider = document.getElementById('angleSlider');

const sizeValue = document.getElementById('sizeValue');
const speedValue = document.getElementById('speedValue');
const angleValue = document.getElementById('angleValue');

const asteroidList = document.getElementById('asteroidList');
const resultContent = document.getElementById('resultContent');
const clearBtn = document.getElementById('clearBtn');
const mapWrap = document.getElementById('mapWrap');
const previewCanvas = document.getElementById('previewCanvas');

// Update slider values live
[sizeSlider, speedSlider, angleSlider].forEach(slider => {
  slider.addEventListener('input', () => {
    sizeValue.textContent = sizeSlider.value;
    speedValue.textContent = speedSlider.value;
    angleValue.textContent = angleSlider.value;
  });
});

// ---------- Map ----------
const map = L.map('map').setView([20,78], 4);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom:18 }).addTo(map);
let impactLayers = [];

// ---------- Physics ----------
function calculateImpactZones(size_m, velocity_kms){
  const density = 3000;
  const r = size_m / 2;
  const volume = (4/3) * Math.PI * r**3;
  const mass = density * volume;
  const v = velocity_kms*1000;
  const energyJ = 0.5 * mass * v**2;

  const craterRadius = Math.cbrt(energyJ)/1000;
  const blastRadius = craterRadius*3;
  const thermalRadius = craterRadius*7;
  const tnt_kilotons = energyJ / 4.184e12;

  return { energyJ, tnt_kilotons, craterRadius, blastRadius, thermalRadius };
}

// ---------- Draw / clear ----------
function clearImpactLayers(){
  impactLayers.forEach(l => map.removeLayer(l));
  impactLayers = [];
  const existing = mapWrap.querySelectorAll('.meteor, .explosion');
  existing.forEach(el => el.remove());
  resultContent.innerHTML = `<p>Click map to run a simulation.</p>`;
}

clearBtn.addEventListener('click', clearImpactLayers);

function drawImpactCircles(lat,lng,zones){
  const crater = L.circle([lat,lng], { radius: zones.craterRadius*1000, color:'red', fillOpacity:0.5 }).addTo(map);
  const blast = L.circle([lat,lng], { radius: zones.blastRadius*1000, color:'orange', fillOpacity:0.25 }).addTo(map);
  const thermal = L.circle([lat,lng], { radius: zones.thermalRadius*1000, color:'yellow', fillOpacity:0.15 }).addTo(map);
  impactLayers.push(crater, blast, thermal);

  crater.bindPopup(`Crater Radius: ${zones.craterRadius.toFixed(2)} km`);
  blast.bindPopup(`Blast Radius: ${zones.blastRadius.toFixed(2)} km`);
  thermal.bindPopup(`Thermal Radius: ${zones.thermalRadius.toFixed(2)} km`);
}

function showResults(zones, chosenName){
  const html = `
    <div class="result-row"><span>Asteroid</span><strong>${chosenName || 'Custom'}</strong></div>
    <div class="result-row"><span>Energy</span><strong>${zones.energyJ.toExponential(2)} J</strong></div>
    <div class="result-row"><span>TNT equivalent</span><strong>${zones.tnt_kilotons.toFixed(2)} kilotons</strong></div>
    <div class="result-row"><span>Crater radius</span><strong>${zones.craterRadius.toFixed(2)} km</strong></div>
    <div class="result-row"><span>Blast radius</span><strong>${zones.blastRadius.toFixed(2)} km</strong></div>
    <div class="result-row"><span>Thermal radius</span><strong>${zones.thermalRadius.toFixed(2)} km</strong></div>
    <div style="margin-top:8px;color:var(--muted);font-size:12px">Demo uses simplified scaling for visualization.</div>
  `;
  resultContent.innerHTML = html;
}

// ---------- Meteor animation ----------
function playMeteorAnimation(targetPointPx, callback){
  clearImpactLayers();
  const meteor = document.createElement('div');
  meteor.className='meteor';
  mapWrap.appendChild(meteor);

  const startX = targetPointPx.x;
  const startY = -40;
  meteor.style.left=`${startX}px`;
  meteor.style.top=`${startY}px`;
  meteor.style.opacity='1';
  meteor.style.transform='translate(-50%,-50%) scale(1)';

  const speed = asteroidList.value ? parseFloat(asteroidList.selectedOptions[0].getAttribute('data-speed')) : parseFloat(speedSlider.value);
  const clamped = Math.max(5, Math.min(70, speed));
  const duration = (4-(clamped-5)/(70-5)*3)*1000;

  meteor.style.transition=`top ${duration}ms linear, transform ${duration}ms linear, opacity 300ms`;
  requestAnimationFrame(()=>{ meteor.style.top=`${targetPointPx.y}px`; meteor.style.transform='translate(-50%,-50%) scale(0.9)'; });

  meteor.addEventListener('transitionend', function onEnd(e){
    if(e.propertyName==='top'){
      meteor.removeEventListener('transitionend',onEnd);
      const flash = document.createElement('div');
      flash.className='explosion';
      mapWrap.appendChild(flash);
      const size=120;
      flash.style.left=`${targetPointPx.x - size/2}px`;
      flash.style.top=`${targetPointPx.y - size/2}px`;
      flash.style.width=`${size}px`; flash.style.height=`${size}px`;
      flash.style.background='radial-gradient(circle, rgba(255,255,255,0.9) 0%, rgba(255,200,80,0.6) 30%, rgba(255,100,30,0.25) 60%, rgba(0,0,0,0) 70%)';
      flash.style.opacity='1'; flash.style.borderRadius='50%';
      flash.style.transition='opacity 800ms ease-out, transform 800ms ease-out';
      requestAnimationFrame(()=>{ flash.style.transform='scale(1.2)'; flash.style.opacity='0'; });
      setTimeout(()=>{ flash.remove(); meteor.remove(); if(typeof callback==='function') callback(); },900);
    }
  });
}

// ---------- MiniBlast canvas ----------
function drawMiniBlast(size){
  const ctx=previewCanvas.getContext('2d');
  previewCanvas.width=300; previewCanvas.height=300;
  let radius=0;
  const maxRadius=size*0.5;

  function animate(){
    ctx.clearRect(0,0,previewCanvas.width,previewCanvas.height);
    const grad=ctx.createRadialGradient(150,150,0,150,150,radius);
    grad.addColorStop(0,'yellow'); grad.addColorStop(0.5,'orange'); grad.addColorStop(1,'rgba(255,0,0,0)');
    ctx.fillStyle=grad; ctx.beginPath(); ctx.arc(150,150,radius,0,Math.PI*2); ctx.fill();
    ctx.strokeStyle=`rgba(255,255,255,${1-radius/maxRadius})`; ctx.lineWidth=3;
    ctx.beginPath(); ctx.arc(150,150,radius*1.3,0,Math.PI*2); ctx.stroke();
    radius+=2;
    if(radius<maxRadius){ requestAnimationFrame(animate); }
  }
  animate();
}

// ---------- Map click ----------
map.on('click', function(e){
  let chosenName=null;
  let diameter=parseFloat(sizeSlider.value);
  let velocity=parseFloat(speedSlider.value);

  if(asteroidList.value){
    diameter=parseFloat(asteroidList.value);
    velocity=parseFloat(asteroidList.selectedOptions[0].getAttribute('data-speed'));
    chosenName=asteroidList.selectedOptions[0].textContent.split('|')[0].trim();
  }

  const zones=calculateImpactZones(diameter,velocity);
  const containerPoint=map.latLngToContainerPoint(e.latlng);
  const targetPx={x:containerPoint.x,y:containerPoint.y};

  playMeteorAnimation(targetPx,function(){
    drawImpactCircles(e.latlng.lat,e.latlng.lng,zones);
    drawMiniBlast(diameter);
    showResults(zones,chosenName);
    const maxRadius=Math.max(zones.thermalRadius,zones.blastRadius)*1000;
    map.fitBounds(L.circle([e.latlng.lat,e.latlng.lng],{radius:maxRadius}).getBounds(),{maxZoom:8});
  });
});

// ---------- NASA NEO API ----------
const apiKey='DEMO_KEY'; // Replace with valid NASA API key
const today=new Date().toISOString().split('T')[0];
fetch(`https://api.nasa.gov/neo/rest/v1/feed?start_date=${today}&end_date=${today}&api_key=${apiKey}`)
.then(r=>r.json())
.then(data=>{
  const list=data.near_earth_objects && data.near_earth_objects[today];
  asteroidList.innerHTML='';
  if(!list || list.length===0){ asteroidList.innerHTML=`<option value="">No NEOs today — use sliders</option>`; return; }
  const emptyOpt=document.createElement('option'); emptyOpt.value=''; emptyOpt.textContent='-- Use sliders (or pick a real asteroid) --'; asteroidList.appendChild(emptyOpt);
  list.forEach(neo=>{
    const maxSize=Math.round(neo.estimated_diameter.meters.estimated_diameter_max);
    const velocity=parseFloat(neo.close_approach_data[0].relative_velocity.kilometers_per_second);
    const option=document.createElement('option'); option.value=maxSize; option.setAttribute('data-speed',velocity); option.textContent=`${neo.name} | ${maxSize}m | ${velocity.toFixed(2)} km/s`; asteroidList.appendChild(option);
  });
}).catch(e=>{ asteroidList.innerHTML=`<option value="">Error loading NEO feed</option>`; });

// ---------- Starfield ----------
const starfieldCanvas=document.getElementById('starfield-canvas');
const sctx=starfieldCanvas.getContext('2d');
function resizeStarfield(){ starfieldCanvas.width=window.innerWidth; starfieldCanvas.height=window.innerHeight; }
window.addEventListener('resize',resizeStarfield); resizeStarfield();

let stars=[];
for(let i=0;i<150;i++){ stars.push({x:Math.random()*starfieldCanvas.width, y:Math.random()*starfieldCanvas.height, r:Math.random()*1.2+0.2, dx:(Math.random()-0.5)*0.15, dy:(Math.random()-0.5)*0.15}); }

function animateStars(){
  sctx.clearRect(0,0,starfieldCanvas.width,starfieldCanvas.height);
  stars.forEach(s=>{
    s.x+=s.dx; s.y+=s.dy;
    if(s.x<0)s.x=starfieldCanvas.width;if(s.x>starfieldCanvas.width)s.x=0;
    if(s.y<0)s.y=starfieldCanvas.height;if(s.y>starfieldCanvas.height)s.y=0;
    sctx.fillStyle='white'; sctx.globalAlpha=Math.random(); sctx.beginPath(); sctx.arc(s.x,s.y,s.r,0,Math.PI*2); sctx.fill();
  });
  requestAnimationFrame(animateStars);
}
animateStars();