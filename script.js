// Theme Toggle
const toggle = document.querySelector(".theme-toggle");
//states
const statsSection = document.querySelector("#statsSection");
const counters = document.querySelectorAll(".count");


toggle.addEventListener("click", () => {
  document.body.classList.toggle("light");

  if (document.body.classList.contains("light")) {
    toggle.innerHTML = '<i class="fa-solid fa-wand-magic-sparkles"></i>';
  } else {
    toggle.innerHTML = '<i class="fa-solid fa-eye"></i>';
  }
});

// CTA click (future navigation)
document.querySelector(".cta-btn").addEventListener("click", () => {
  // future: camera page redirect
  console.log("Start Scan Clicked");
});

const slides = document.querySelectorAll(".slider .slide");

let index = 0;

setInterval(() => {
  // current slide left jata hai
  slides[index].classList.remove("active");
  slides[index].classList.add("exit");

  // next slide
  index = (index + 1) % slides.length;

  // new slide aata hai
  slides[index].classList.remove("exit");
  slides[index].classList.add("active");
}, 5000);



let started = false;

function startCounters() {
  counters.forEach(counter => {
    const target = +counter.getAttribute("data-target");
    let count = 0;

    const speed = target / 80;

    const update = () => {
      count += speed;

      if (count < target) {
        counter.innerText = Math.floor(count);
        requestAnimationFrame(update);
      } else {
        counter.innerText = target;
      }
    };

    update();
  });
}

const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting && !started) {
      started = true;
      startCounters();
    }
  });
}, {
  threshold: 0.6   // center ke paas aaye tab trigger
});

observer.observe(statsSection);

const slider = document.querySelector(".card-slider");

let isDown = false;
let startX;
let scrollLeft;

slider.addEventListener("mousedown", (e) => {
  isDown = true;
  startX = e.pageX - slider.offsetLeft;
  scrollLeft = slider.scrollLeft;
});

slider.addEventListener("mouseleave", () => isDown = false);
slider.addEventListener("mouseup", () => isDown = false);

slider.addEventListener("mousemove", (e) => {
  if (!isDown) return;
  e.preventDefault();
  const x = e.pageX - slider.offsetLeft;
  const walk = (x - startX) * 2;
  slider.scrollLeft = scrollLeft - walk;
});


const mindSection = document.getElementById("mindSwipe");
const mindCards = document.querySelectorAll(".mind-card");
const mindImgs = document.querySelectorAll(".mind-img");

let mindIndex = 0;
let mindStarted = false;

function startMindLoop(){

  if(mindStarted) return;
  mindStarted = true;

  setInterval(()=>{

    mindCards[mindIndex].classList.remove("active");
    mindImgs[mindIndex].classList.remove("active");

    mindIndex = (mindIndex + 1) % (mindCards.length - 1);

    mindCards[mindIndex].classList.add("active");
    mindImgs[mindIndex].classList.add("active");

  }, 4500);

}

/* scroll trigger (only when visible) */
const mindObserver = new IntersectionObserver((entries)=>{
  entries.forEach(entry=>{
    if(entry.isIntersecting){
      startMindLoop();
    }
  });
},{ threshold:0.5 });

mindObserver.observe(mindSection);