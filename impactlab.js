/* ---------- Meteor background (robust) ---------- */
(function(){
  const canvas = document.getElementById('meteorCanvas');
  if(!canvas) return;
  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  function resize(){
    canvas.width = Math.floor(window.innerWidth * dpr);
    canvas.height = Math.floor(window.innerHeight * dpr);
    canvas.style.width = window.innerWidth + 'px';
    canvas.style.height = window.innerHeight + 'px';
    ctx.setTransform(dpr,0,0,dpr,0,0);
  }
  resize();

  class Meteor {
    constructor(){ this.reset(); }
    reset(){
      this.x = Math.random()*window.innerWidth;
      this.y = Math.random()*window.innerHeight;
      this.len = Math.random()*80+20;
      this.speed = Math.random()*4+2;
      this.angle = (Math.PI/4) + (Math.random()-0.5)*0.4;
      this.alpha = 0.5 + Math.random()*0.5;
    }
    update(){
      this.x += this.speed*Math.cos(this.angle);
      this.y += this.speed*Math.sin(this.angle);
      if(this.x > window.innerWidth+150 || this.y > window.innerHeight+150) {
        this.reset(); this.x = -60+Math.random()*120; this.y = -Math.random()*100;
      }
    }
    draw(){
      ctx.save();
      ctx.globalAlpha = this.alpha;
      ctx.strokeStyle = 'rgba(255,255,255,0.9)';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(this.x,this.y);
      ctx.lineTo(this.x - this.len*Math.cos(this.angle), this.y - this.len*Math.sin(this.angle));
      ctx.stroke();
      ctx.restore();
    }
  }

  const arr = Array.from({length:70}, ()=> new Meteor());
  function anim(){
    ctx.clearRect(0,0, canvas.width, canvas.height);
    arr.forEach(m => { m.draw(); m.update(); });
    requestAnimationFrame(anim);
  }
  anim();

  window.addEventListener('resize', ()=>{ resize(); arr.forEach(m=>{ if(m.x>window.innerWidth) m.x = Math.random()*window.innerWidth; if(m.y>window.innerHeight) m.y = Math.random()*window.innerHeight; }); });
})();

/* ---------- Map + overlay + UI logic ---------- */
let map, impactMarker, blastCircle, thermalCircle;
const overlay = document.getElementById('overlayCanvas');
function initMap(){
  map = L.map('map', {zoomControl:true}).setView([20.5937,78.9629], 3);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:18, attribution:''}).addTo(map);

  map.on('click', function(e){
    document.getElementById('lat').value = e.latlng.lat.toFixed(4);
    document.getElementById('lon').value = e.latlng.lng.toFixed(4);
    simulate(false);
  });

  // overlay canvas sizing
  function resizeOverlay(){
    const box = document.getElementById('map').getBoundingClientRect();
    overlay.width = box.width;
    overlay.height = box.height;
    overlay.style.left = box.left + 'px';
    overlay.style.top = box.top + 'px';
  }
  window.addEventListener('resize', resizeOverlay);
  setTimeout(resizeOverlay,300);
}
initMap();

/* overlay shockwave draw (canvas positioned absolutely over map) */
function playShockwaveAnimation(radiusKm){
  if(!impactMarker) return;
  const canvas = overlay;
  const ctx = canvas.getContext('2d');
  const rect = document.getElementById('map').getBoundingClientRect();
  canvas.width = rect.width; canvas.height = rect.height;
  const latlng = impactMarker.getLatLng();
  const p = map.latLngToContainerPoint(latlng);
  const cx = p.x, cy = p.y;

  // approximate pixels per km (rough)
  const lat1 = map.getCenter().lat;
  const pt1 = map.latLngToContainerPoint([lat1, map.getCenter().lng]);
  const pt2 = map.latLngToContainerPoint([lat1+0.01, map.getCenter().lng]);
  const metersPerPixel = (111320*0.01)/Math.abs(pt2.y - pt1.y || 1);
  const pixelsPerKm = 1000/metersPerPixel;
  let maxR = radiusKm * pixelsPerKm;
  if(!isFinite(maxR) || maxR < 30) maxR = Math.min(canvas.width, canvas.height)/4;

  let start = performance.now();
  const dur = 1600;
  function frame(now){
    let t = Math.min(1, (now-start)/dur);
    ctx.clearRect(0,0,canvas.width,canvas.height);

    // halo
    const r = t*maxR;
    const grd = ctx.createRadialGradient(cx,cy,r*0.4,cx,cy,r);
    grd.addColorStop(0, 'rgba(255,120,100,0.14)');
    grd.addColorStop(1, 'rgba(255,120,100,0)');
    ctx.fillStyle = grd; ctx.beginPath(); ctx.arc(cx,cy,r,0,Math.PI*2); ctx.fill();

    // ring
    ctx.beginPath();
    ctx.lineWidth = 3*(1-t)+1;
    ctx.strokeStyle = 'rgba(255,120,100,' + (0.9*(1-t)) + ')';
    ctx.arc(cx,cy,r,0,Math.PI*2);
    ctx.stroke();

    if(t < 1) requestAnimationFrame(frame);
    else setTimeout(()=>ctx.clearRect(0,0,canvas.width,canvas.height), 300);
  }
  requestAnimationFrame(frame);
}

/* simple physics approximations */
function computeAll(diameter_m, velocity_kms){
  const density = 3000;
  const r = diameter_m/2;
  const vol = (4/3)*Math.PI*Math.pow(r,3);
  const mass = density * vol;
  const vms = velocity_kms*1000;
  const E = 0.5 * mass * vms * vms;
  const megatons = E / 4.184e15;
  const crater_m = Math.pow(E, 1/3.4) * 0.01;
  const blast_km = (Math.pow(Math.max(megatons, 1e-9), 1/3) * 1.8);
  return {E,megatons,crater_km:crater_m/1000,blast_km};
}

/* UI helpers */
function onRange(id){
  const el = document.getElementById(id);
  if(!el) return;
  if(id==='diameter') document.getElementById('diam-val').innerText = el.value + ' m';
  if(id==='velocity') document.getElementById('vel-val').innerText = el.value + ' km/s';
  if(id==='angle') document.getElementById('ang-val').innerText = el.value + '°';
}

function applyPreset(name){
  if(name==='small'){ document.getElementById('diameter').value=30; document.getElementById('velocity').value=15; document.getElementById('angle').value=30; }
  if(name==='medium'){ document.getElementById('diameter').value=250; document.getElementById('velocity').value=22; document.getElementById('angle').value=45; }
  if(name==='large'){ document.getElementById('diameter').value=900; document.getElementById('velocity').value=35; document.getElementById('angle').value=60; }
  onRange('diameter'); onRange('velocity'); onRange('angle');
}

function placeImpact(lat, lon, blast_km){
  if(impactMarker) map.removeLayer(impactMarker);
  if(blastCircle) map.removeLayer(blastCircle);
  if(thermalCircle) map.removeLayer(thermalCircle);

  impactMarker = L.marker([lat,lon]).addTo(map);
  blastCircle = L.circle([lat,lon], {radius: blast_km*1000, color:'#ff7b6b', fillOpacity:0.06, weight:2}).addTo(map);
  thermalCircle = L.circle([lat,lon], {radius: blast_km*200, color:'#ffb86b', fillOpacity:0.02, weight:1}).addTo(map);
  map.flyTo([lat,lon], Math.max(3, Math.round(6 - Math.log10(blast_km+1))), {duration:1.0});
}

/* simulate */
function simulate(showModal=true){
  const d = Number(document.getElementById('diameter').value);
  const v = Number(document.getElementById('velocity').value);
  const lat = Number(document.getElementById('lat').value);
  const lon = Number(document.getElementById('lon').value);
  const angle = Number(document.getElementById('angle').value);

  const res = computeAll(d,v);
  document.getElementById('energy').innerText = isFinite(res.megatons) ? res.megatons.toFixed(2) + ' Mt TNT' : '—';
  document.getElementById('crater').innerText = isFinite(res.crater_km) ? res.crater_km.toFixed(2) + ' km' : '—';
  document.getElementById('radius').innerText = isFinite(res.blast_km) ? res.blast_km.toFixed(2) + ' km' : '—';

  // action suggestion
  let action = 'Public Advisory';
  if(res.blast_km > 200) action = 'Global Emergency';
  else if(res.blast_km > 50) action = 'Large-scale Evacuation';
  else if(res.blast_km > 5) action = 'Local Evacuation & Shelter';
  document.getElementById('action').innerText = action;

  // place on map & animate
  placeImpact(lat,lon,res.blast_km);
  playShockwaveAnimation(res.blast_km);

  // modal summary
  const html = `<div><strong>Diameter:</strong> ${d} m<br><strong>Velocity:</strong> ${v} km/s<br>
    <strong>Energy:</strong> ${isFinite(res.megatons) ? res.megatons.toFixed(2)+' Mt' : '—'}<br>
    <strong>Damage radius:</strong> ${isFinite(res.blast_km) ? res.blast_km.toFixed(2)+' km' : '—'}<br>
    <strong>Recommended:</strong> ${action}</div>`;
  if(showModal) openModal(html);
}

function openModal(html){
  document.getElementById('modalBody').innerHTML = html;
  const m = document.getElementById('modal'); if(m){ m.style.display='flex'; m.setAttribute('aria-hidden','false'); }
}

function closeModal(){ const m = document.getElementById('modal'); if(m){ m.style.display='none'; m.setAttribute('aria-hidden','true'); } }

function playShockwave(){ if(!impactMarker) { alert('No impact set. Click map or simulate first.'); return; }
  const latlng = impactMarker.getLatLng(); const r = Number(document.getElementById('radius').innerText.split(' ')[0]) || 10;
  playShockwaveAnimation(r);
}

/* export PDF / share */
async function exportPDF(){
  const main = document.querySelector('.app');
  const canvas = await html2canvas(main, {useCORS:true, scale:1.4});
  const img = canvas.toDataURL('image/png');
  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF({orientation:'landscape', unit:'px', format:[canvas.width, canvas.height]});
  pdf.addImage(img,'PNG',0,0,canvas.width, canvas.height);
  pdf.save('meteor_report.pdf');
}

function copyPermalink(){
  const params = new URLSearchParams();
  ['diameter','velocity','angle','lat','lon'].forEach(k=>{
    const el = document.getElementById(k);
    if(el) params.set(k, el.value);
  });
  const url = location.origin + location.pathname + '?' + params.toString();
  navigator.clipboard.writeText(url).then(()=> alert('Permalink copied.'));
}

/* init values */
(function init(){
  // read query
  const qs = new URLSearchParams(location.search);
  ['diameter','velocity','angle','lat','lon'].forEach(k=>{ if(qs.has(k)) document.getElementById(k).value = qs.get(k); });

  onRange('diameter'); onRange('velocity'); onRange('angle');
  // run initial simulate without modal
  simulate(false);
})();

function resetAll(){ document.getElementById('diameter').value=100; document.getElementById('velocity').value=20; document.getElementById('angle').value=45;
  document.getElementById('lat').value=20.5937; document.getElementById('lon').value=78.9629;
  onRange('diameter'); onRange('velocity'); onRange('angle'); simulate(false);
}
