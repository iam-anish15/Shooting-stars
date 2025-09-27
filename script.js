// ===== CANVAS SETUP =====
const canvas = document.getElementById('meteorCanvas');
const ctx = canvas.getContext('2d');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// Mouse parallax
let mouseX = 0, mouseY = 0;
window.addEventListener('mousemove', e => {
  mouseX = e.clientX;
  mouseY = e.clientY;
});

// ===== NEBULA BACKGROUND =====
function drawNebula() {
  const offsetX = (mouseX - canvas.width / 2) * 0.02;
  const offsetY = (mouseY - canvas.height / 2) * 0.02;

  const gradient = ctx.createRadialGradient(
    canvas.width / 2 + offsetX,
    canvas.height / 2 + offsetY,
    0,
    canvas.width / 2 + offsetX,
    canvas.height / 2 + offsetY,
    canvas.width
  );

  gradient.addColorStop(0, 'rgba(24,13,28,0.9)');
  gradient.addColorStop(0.3, 'rgba(15,7,17,0.7)');
  gradient.addColorStop(0.6, 'rgba(12,6,15,0.5)');
  gradient.addColorStop(0.8, 'rgba(12,6,15,0.2)');
  gradient.addColorStop(1, 'rgba(0,0,0,0)');

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}



// ===== STAR CLASS =====
class Star {
  constructor() { this.reset(); }
  reset() {
    this.x = Math.random() * canvas.width;
    this.y = Math.random() * canvas.height;
    this.radius = Math.random() * 1.2;
    this.alpha = Math.random();
    this.delta = Math.random() * 0.02;
    this.parallaxFactor = Math.random() * 0.05 + 0.02;
  }
  draw() {
    const offsetX = (mouseX - canvas.width / 2) * this.parallaxFactor;
    const offsetY = (mouseY - canvas.height / 2) * this.parallaxFactor;

    ctx.save();
    ctx.globalAlpha = this.alpha;
    const starColors = ['#d1b3ff', '#c4a6ff', '#b78fff', '#a18da8'];
    ctx.fillStyle = starColors[Math.floor(Math.random() * starColors.length)];
    ctx.beginPath();
    ctx.arc(this.x + offsetX, this.y + offsetY, this.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    this.alpha += this.delta;
    if (this.alpha > 1 || this.alpha < 0.1) this.delta = -this.delta;
  }
}

// ===== METEOR DATA =====
const meteorData = [
  { name: "Halley's Comet", year: 1986, size: "11 km" },
  { name: "Chelyabinsk Meteor", year: 2013, size: "20 m" },
  { name: "2010 TK7", year: 2010, size: "300 m" },
  { name: "Shoemaker-Levy 9", year: 1994, size: "2 km" },
  { name: "Tunguska Event", year: 1908, size: "60 m" }
];

// ===== METEOR CLASS =====
class Meteor {
  constructor() { this.reset(); }
  reset() {
    this.x = Math.random() * canvas.width;
    this.y = Math.random() * canvas.height;
    this.length = Math.random() * 80 + 20;
    this.speed = Math.random() * 4 + 2;
    this.angle = Math.PI / 4;

    const colors = ['#ffffff','#c8a2ff','#9b30ff','#6a0dad','#ff66ff','#b266ff','#a18da8'];
    this.color = colors[Math.floor(Math.random() * colors.length)];

    this.isShootingStar = Math.random() < 0.05;
    this.isEasterEgg = Math.random() < 0.08;
    this.sparkleAlpha = Math.random() * 0.5 + 0.5;
    this.sparkleDelta = Math.random() * 0.02 + 0.01;

    if (this.isShootingStar) {
      this.length *= 2;
      this.speed *= 2;
      this.color = '#ffffff';
      this.isEasterEgg = false;
    }

    if (this.isEasterEgg) {
      this.info = meteorData[Math.floor(Math.random() * meteorData.length)];
    }
  }
  update() {
    this.x += this.speed * Math.cos(this.angle);
    this.y += this.speed * Math.sin(this.angle);

    if (this.isEasterEgg) {
      this.sparkleAlpha += this.sparkleDelta;
      if (this.sparkleAlpha > 1 || this.sparkleAlpha < 0.4) this.sparkleDelta = -this.sparkleDelta;
    }

    if (this.x > canvas.width || this.y > canvas.height) this.reset();
  }
  draw() {
    ctx.save();
    const glow = this.isEasterEgg ? this.sparkleAlpha * 25 : (this.isShootingStar ? 20 : 8);
    ctx.shadowBlur = glow;
    ctx.shadowColor = this.isEasterEgg ? '#ff99ff' : this.color;
    ctx.strokeStyle = this.color;
    ctx.lineWidth = this.isShootingStar ? 2.5 : 1.5;
    ctx.beginPath();
    ctx.moveTo(this.x, this.y);
    ctx.lineTo(this.x - this.length * Math.cos(this.angle), this.y - this.length * Math.sin(this.angle));
    ctx.stroke();
    ctx.restore();
  }
}

// ===== CREATE OBJECTS =====
const stars = Array.from({ length: 300 }, () => new Star());
const meteors = Array.from({ length: 50 }, () => new Meteor());

// ===== CLICKABLE EASTER EGGS =====
canvas.addEventListener('click', e => {
  const rect = canvas.getBoundingClientRect();
  const mx = e.clientX - rect.left;
  const my = e.clientY - rect.top;
  meteors.forEach(meteor => {
    if (meteor.isEasterEgg) {
      const dx = mx - meteor.x;
      const dy = my - meteor.y;
      if (Math.sqrt(dx*dx + dy*dy) < 30) showMeteorInfo(meteor.info);
    }
  });
});

function showMeteorInfo(info) {
  let modal = document.getElementById('meteorModal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'meteorModal';
    Object.assign(modal.style, {
      position: 'fixed',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      background: 'rgba(20,0,30,0.95)',
      color: '#ff33ff',
      padding: '20px 30px',
      border: '2px solid #ff33ff',
      borderRadius: '10px',
      zIndex: '100',
      textAlign: 'center',
      fontFamily: 'Arial,sans-serif',
      cursor: 'pointer'
    });
    modal.addEventListener('click', () => modal.remove());
    document.body.appendChild(modal);
  }
  modal.innerHTML = `
    <h2>${info.name}</h2>
    <p><strong>Year:</strong> ${info.year}</p>
    <p><strong>Size:</strong> ${info.size}</p>
    <small>(Click to close)</small>
  `;
}

// ===== ANIMATE LOOP =====
function animate() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawNebula();
  stars.forEach(s => s.draw());
  meteors.forEach(m => { m.update(); m.draw(); });
  requestAnimationFrame(animate);
}
animate();

// ===== RESIZE CANVAS =====
window.addEventListener('resize', () => {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
});

// ===== TYPEWRITER EFFECT =====
const titles = ["Meteor Madness", "Shooting Stars"];
let currentTitle = 0;
let charIndex = 0;

const heroTitle = document.querySelector(".hero-title");
const cursor = document.createElement("span");
cursor.classList.add("cursor");
cursor.textContent = "|";
heroTitle.appendChild(cursor);

const typingSpeed = 150;
const deletingSpeed = 70;
const pauseTime = 1500;

function typeWriter() {
  const fullText = titles[currentTitle];
  if (charIndex < fullText.length) {
    heroTitle.innerHTML = fullText.substring(0, charIndex + 1) + cursor.outerHTML;
    charIndex++;
    setTimeout(typeWriter, typingSpeed);
  } else {
    setTimeout(deleteWriter, pauseTime);
  }
}

function deleteWriter() {
  const fullText = titles[currentTitle];
  if (charIndex > 0) {
    heroTitle.innerHTML = fullText.substring(0, charIndex - 1) + cursor.outerHTML;
    charIndex--;
    setTimeout(deleteWriter, deletingSpeed);
  } else {
    currentTitle = (currentTitle + 1) % titles.length;
    setTimeout(typeWriter, typingSpeed);
  }
}

typeWriter();

//carousel

const slider = document.querySelector('.slider');

function activate(e) {
  const items = document.querySelectorAll('.item');
  e.target.matches('.next') && slider.append(items[0])
  e.target.matches('.prev') && slider.prepend(items[items.length-1]);
}

document.addEventListener('click',activate,false);


