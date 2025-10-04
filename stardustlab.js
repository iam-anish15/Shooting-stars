
// =================== METEOR DATA ===================
const meteors = [
  {name:"Chelyabinsk ", img:"rock.png", diameter:20, velocity:"19 km/s", energy:"~500 kt TNT", type:"Airburst", risk:"Moderate",
   description:"Chelyabinsk meteor entered Earth's atmosphere over Russia in 2013, causing airburst and windows damage."},
  {name:"Tunguska", img:"rock2.png", diameter:60, velocity:"27 km/s", energy:"~15 Mt TNT", type:"Airburst", risk:"High",
   description:"Tunguska event (1908) flattened 2,000 km² of Siberian forest. Largest recorded impact on land."},
  {name:"Hoba", img:"rock3.png", diameter:18, velocity:"22 km/s", energy:"~100 Mt TNT", type:"Impact", risk:"Extreme",
   description:"Meteor Madness is a hypothetical scenario used for educational purposes, illustrating extreme impact events."},
  {name:"Apophis", img:"rock4.png", diameter:370, velocity:"30.7 km/s", energy:"~500 Mt TNT", type:"Impact", risk:"High",
   description:"Apophis is a near-Earth asteroid that will pass close in 2029. Studying its trajectory helps impact mitigation."},
  {name:"Bennu", img:"rock.png", diameter:492, velocity:"28.1 km/s", energy:"~1 Gt TNT", type:"Impact", risk:"High",
   description:"Bennu is a potentially hazardous asteroid. NASA's OSIRIS-REx mission collected samples to study its composition."}
];

// =================== POPULATE SIDEBAR ===================
const meteorList = document.getElementById("meteorList");
meteors.forEach((m, index) => {
  const card = document.createElement("div");
  card.className = "meteor-card";
  card.innerHTML = `
    <img src="${m.img}" alt="${m.name}">
    <span class="meteor-name">${m.name}</span>
    <span class="arrow">&#9654;</span>
  `;
  card.addEventListener("click", () => selectMeteor(index));
  meteorList.appendChild(card);
});

// =================== MAIN DISPLAY ===================
const meteorImg = document.getElementById("meteorImg");
const meteorInfo = document.getElementById("meteorInfo");
const extendedInfo = document.getElementById("extendedInfo");
let angle = 0;
let currentMeteorIndex = 0;

// =================== SELECT METEOR ===================
function selectMeteor(index) {
  currentMeteorIndex = index;
  const data = meteors[index];
  meteorImg.src = data.img;
  extendedInfo.style.display = "none"; // hide extended info by default

  let riskClass = "";
  switch(data.risk.toLowerCase()) {
    case "low": riskClass="risk-low"; break;
    case "moderate": riskClass="risk-moderate"; break;
    case "high": riskClass="risk-high"; break;
    case "extreme": riskClass="risk-extreme"; break;
  }

  meteorInfo.innerHTML = `
    <h2>${data.name}</h2>
    <div class="detail-grid">
      <div class="detail-card"><p class="label">Diameter</p><p class="value">${data.diameter} m</p></div>
      <div class="detail-card"><p class="label">Velocity</p><p class="value">${data.velocity}</p></div>
      <div class="detail-card"><p class="label">Impact Energy</p><p class="value">${data.energy}</p></div>
      <div class="detail-card"><p class="label">Impact Type</p><p class="value">${data.type}</p></div>
      <div class="detail-card ${riskClass}"><p class="label">Risk Level</p><p class="value">${data.risk}</p></div>
    </div>
    <button id="knowMoreBtn">Know More</button>
  `;

  // Add listener for Know More
  document.getElementById("knowMoreBtn").addEventListener("click", () => {
    extendedInfo.innerHTML = `
      <h3>${data.name} - Detailed Info</h3>
      <p>${data.description}</p>
    `;
    extendedInfo.style.display = "block";
    extendedInfo.scrollIntoView({ behavior: "smooth" });
  });
}

// =================== ROTATION ANIMATION ===================
const clockwise = true;
function animateClockwiseSpin() {
  requestAnimationFrame(animateClockwiseSpin);
  angle += clockwise ? 1 : -1;
  meteorImg.style.transform = `rotate(${angle}deg)`;
}
animateClockwiseSpin();

// =================== INITIALIZE ===================
selectMeteor(0); // show first meteor by default
