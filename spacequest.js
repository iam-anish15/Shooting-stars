/* ================= Canvas Setup ================= */
const canvas = document.getElementById('meteorCanvas');
const ctx = canvas.getContext('2d');

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
resizeCanvas();
window.addEventListener('resize', () => {
  resizeCanvas();
  adjustStarMeteorCounts();
});

/* ================= Mouse Tracking ================= */
let mouseX = 0, mouseY = 0;
window.addEventListener('mousemove', e => { 
  mouseX = e.clientX; 
  mouseY = e.clientY; 
});

/* ================= Nebula Background ================= */
function drawNebula() {
  const offsetX = (mouseX - canvas.width/2) * 0.02;
  const offsetY = (mouseY - canvas.height/2) * 0.02;

  const gradient = ctx.createRadialGradient(
    canvas.width/2 + offsetX, canvas.height/2 + offsetY, 0,
    canvas.width/2 + offsetX, canvas.height/2 + offsetY, canvas.width
  );
  gradient.addColorStop(0,'rgba(56,32,70,0.9)');
  gradient.addColorStop(0.3,'rgba(35,23,42,0.7)');
  gradient.addColorStop(0.6,'rgba(100,92,105,0.5)');
  gradient.addColorStop(0.8,'rgba(217,214,218,0.2)');
  gradient.addColorStop(1,'rgba(0,0,0,0)');

  ctx.fillStyle = gradient;
  ctx.fillRect(0,0,canvas.width,canvas.height);
}

/* ================= Star Class ================= */
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
    const offsetX = (mouseX - canvas.width/2) * this.parallaxFactor;
    const offsetY = (mouseY - canvas.height/2) * this.parallaxFactor;
    ctx.save();
    ctx.globalAlpha = this.alpha;
    const starColors = ['#fefefe','#d9d6da','#645c69','#23172a'];
    ctx.fillStyle = starColors[Math.floor(Math.random() * starColors.length)];
    ctx.beginPath();
    ctx.arc(this.x + offsetX, this.y + offsetY, this.radius, 0, Math.PI*2);
    ctx.fill();
    ctx.restore();
    this.alpha += this.delta;
    if(this.alpha > 1 || this.alpha < 0.1) this.delta = -this.delta;
  }
}

/* ================= Meteor Class ================= */
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
    if(this.isShootingStar){
      this.length *= 2;
      this.speed *= 2;
      this.color = '#ffffff';
    }
  }
  update() {
    this.x += this.speed * Math.cos(this.angle);
    this.y += this.speed * Math.sin(this.angle);
    if(this.x > canvas.width || this.y > canvas.height) this.reset();
  }
  draw() {
    ctx.save();
    const glow = this.isShootingStar ? 20 : 8;
    ctx.shadowBlur = glow;
    ctx.shadowColor = this.color;
    ctx.strokeStyle = this.color;
    ctx.lineWidth = this.isShootingStar ? 2.5 : 1.5;
    ctx.beginPath();
    ctx.moveTo(this.x, this.y);
    ctx.lineTo(this.x - this.length * Math.cos(this.angle), this.y - this.length * Math.sin(this.angle));
    ctx.stroke();
    ctx.restore();
  }
}

/* ================= Responsive Star/Meteor Counts ================= */
let stars = [];
let meteors = [];

function adjustStarMeteorCounts() {
  const width = window.innerWidth;

  let starCount = 300;
  let meteorCount = 50;

  if(width < 768) { starCount = 150; meteorCount = 25; }
  if(width < 480) { starCount = 80; meteorCount = 15; }

  stars = Array.from({length: starCount}, () => new Star());
  meteors = Array.from({length: meteorCount}, () => new Meteor());
}
adjustStarMeteorCounts();

/* ================= Animate Canvas ================= */
function animate() {
  ctx.clearRect(0,0,canvas.width,canvas.height);
  drawNebula();
  stars.forEach(s => s.draw());
  meteors.forEach(m => { m.update(); m.draw(); });
  requestAnimationFrame(animate);
}
animate();

/* ================= Handle Resize ================= */
window.addEventListener('resize', () => {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
});

/* ================= Quiz Data ================= */
const quizData = [
  {question:"What is a meteor?", options:["A shooting star","A type of comet","A planet fragment","A star"], answer:"A shooting star"},
  {question:"Main difference between meteor and asteroid?", options:["Size","Color","Orbit speed","Surface temperature"], answer:"Size"},
  {question:"Which asteroid is closest to Earth?", options:["Ceres","Apophis","Vesta","Pallas"], answer:"Apophis"},
  {question:"What is a meteoroid?", options:["Space debris","A small asteroid","A planet","A comet"], answer:"A small asteroid"},
  {question:"Which planet has the most impact craters?", options:["Earth","Mercury","Mars","Venus"], answer:"Mercury"},
  {question:"What is the Kuiper Belt?", options:["A region of asteroids beyond Neptune","A meteor shower","A comet tail","A space station"], answer:"A region of asteroids beyond Neptune"},
  {question:"Composition of most asteroids?", options:["Ice","Rock and metal","Gas","Water"], answer:"Rock and metal"},
  {question:"Meteor shower every August?", options:["Perseids","Geminids","Leonids","Orionids"], answer:"Perseids"},
  {question:"Asteroid visited by OSIRIS-REx?", options:["Bennu","Ceres","Vesta","Pallas"], answer:"Bennu"},
  {question:"What happens when meteoroid enters atmosphere?", options:["Becomes comet","Becomes meteor","Becomes planet","Evaporates instantly"], answer:"Becomes meteor"}
];

let currentQuestion = 0, score = 0;
const questionEl = document.getElementById('question');
const optionsEl = document.getElementById('options');
const quizContainer = document.getElementById('quizContainer');

/* ================= Load & Display Question ================= */
function loadQuestion(){
  optionsEl.innerHTML = '';
  questionEl.textContent = quizData[currentQuestion].question;
  quizContainer.classList.remove('show');
  setTimeout(()=>quizContainer.classList.add('show'),50);

  quizData[currentQuestion].options.forEach(option => {
    const label = document.createElement('label');
    label.innerHTML = `<input type="radio" name="option" value="${option}"> ${option}`;
    optionsEl.appendChild(label);
  });
}

/* ================= Handle Quiz Navigation ================= */
function nextQuestion(){
  const selectedOption = document.querySelector('input[name="option"]:checked');
  if(selectedOption){
    if(selectedOption.value === quizData[currentQuestion].answer) score++;
    currentQuestion++;
    if(currentQuestion < quizData.length) loadQuestion();
    else {
      document.getElementById('nextButton').style.display = 'none';
      document.getElementById('submitButton').style.display = 'inline-block';
    }
  } else alert("Select an answer before proceeding.");
}

function submitQuiz(){
  document.getElementById('resultContainer').innerHTML = `<h3>Your Score: ${score} / ${quizData.length}</h3>`;
  document.querySelector(".question-container").style.display = 'none';
  document.getElementById('submitButton').style.display='none';
}

loadQuestion();

/* ================= Parallax Quiz ================= */
window.addEventListener('mousemove', e => {
  const moveX = (e.clientX - window.innerWidth / 2) * 0.01;
  const moveY = (e.clientY - window.innerHeight / 2) * 0.01;
  quizContainer.style.transform = `translate(${moveX}px, ${moveY}px)`;
});
