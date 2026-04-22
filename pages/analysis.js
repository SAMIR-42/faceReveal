import { categories, data } from "./data.js";
document.addEventListener("DOMContentLoaded", () => {

    // ✅ user image
    const img = document.getElementById("userImage");
    const saved = localStorage.getItem("faceImage");
  
    if (saved) {
      img.src = saved;
    }
  
    // ✅ community images pool (15 images)
    const images = [
      "../assets/1.jpg",
      "../assets/2.jpg",
      "../assets/3.jpg",
      "../assets/4.jpg",
      "../assets/5.jpg",
      "../assets/6.jpg",
      "../assets/7.jpg",
      "../assets/8.jpg",
      "../assets/9.jpg",
      "../assets/10.jpg",
      "../assets/11.jpg",
      "../assets/12.jpg",
      "../assets/13.jpg",
      "../assets/14.jpg",
      "../assets/15.jpg"
    ];
  
    // shuffle function
    function getRandomImages(arr, count) {
      const shuffled = [...arr].sort(() => 0.5 - Math.random());
      return shuffled.slice(0, count);
    }
  
    const selected = getRandomImages(images, 3);
  
    const miniFaces = document.querySelectorAll(".mini-face");
  
    miniFaces.forEach((el, i) => {
      el.src = selected[i];
    });


// pick 2 random categories
function getRandomCategories(arr, count) {
  return [...arr].sort(() => 0.5 - Math.random()).slice(0, count);
}

const selectedCats = getRandomCategories(
  Object.keys(data), 
  3   // 👈 2 → 3
);

// free lines collect
let freeLines = [];

selectedCats.forEach(cat => {
  const lines = data[cat].free;
  const randomLine = lines[Math.floor(Math.random() * lines.length)];
  freeLines.push(randomLine);
});


const resultDiv = document.getElementById("freeResults");

freeLines.forEach((line, i) => {
  const div = document.createElement("div");
  div.classList.add("result-line");

  // 👇 last line blur
  if (i === freeLines.length - 1) {
    div.classList.add("blur-line");
  }

  div.innerText = line;
  resultDiv.appendChild(div);
});

document.getElementById("unlockBtn").onclick = () => {
  alert("Payment coming soon 😏");
};


  
  });