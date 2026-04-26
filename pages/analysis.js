import { data } from "./data.js";

document.addEventListener ("DOMContentLoaded", async () => {

  function getUserId() {
    let id = localStorage.getItem("userId");
  
    if (!id) {
      const img = localStorage.getItem("faceImage") || "default";
      id = "user_" + btoa(img).replace(/[^a-zA-Z0-9]/g, "").slice(0, 20);
  
      localStorage.setItem("userId", id);
    }
  
    return id;
  }

  const userId = getUserId();
  const urlParams = new URLSearchParams(window.location.search);
  const paidFromURL = urlParams.get("paid");

  if (paidFromURL === "true") {

    await fetch("/mark-paid", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ userId })
    });
  
    // URL clean
    window.history.replaceState({}, document.title, window.location.pathname);
    
  }

  // =========================
  // ✅ HELPERS (TOP pe rakhna MUST)
  // =========================
  function randomFrom(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  function getRandomCategories(arr, count) {
    const shuffled = [...arr];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled.slice(0, count);
  }

  function getRandomImages(arr, count) {
    return getRandomCategories(arr, count);
  }

  
  

  // =========================
  // ✅ USER IMAGE
  // =========================
  const img = document.getElementById("userImage");
  const saved = localStorage.getItem("faceImage");

  if (saved) img.src = saved;

  // =========================
  // ✅ COMMUNITY IMAGES
  // =========================
  const images = [
    "../assets/1.jpg","../assets/2.jpg","../assets/3.jpg",
    "../assets/4.jpg","../assets/5.jpg","../assets/6.jpg",
    "../assets/7.jpg","../assets/8.jpg","../assets/9.jpg",
    "../assets/10.jpg","../assets/11.jpg","../assets/12.jpg",
    "../assets/13.jpg","../assets/14.jpg","../assets/15.jpg"
  ];

  const miniFaces = document.querySelectorAll(".mini-face");
  const selectedImages = getRandomImages(images, 3);

  miniFaces.forEach((el, i) => {
    el.src = selectedImages[i];
  });

  // =========================
  // ✅ RESULT LOCK SYSTEM
  // =========================
  
  const stored = localStorage.getItem("result_" + userId);

  let freeLines = [];
  let mainCat;
  let paidLines = [];

  if (stored) {
    const parsed = JSON.parse(stored);
    freeLines = parsed.lines;
    mainCat = parsed.mainCat;

  } else {

    mainCat = randomFrom(Object.keys(data));

    const others = Object.keys(data).filter(c => c !== mainCat);
    const sideCats = getRandomCategories(others, 2);

    const usedLines = new Set();

    // MAIN
    const mainLine = randomFrom(data[mainCat].free);
    usedLines.add(mainLine);
    freeLines.push(mainLine);

    // SIDE
    sideCats.forEach(cat => {
      let line;
      do {
        line = randomFrom(data[cat].free);
      } while (usedLines.has(line));

      usedLines.add(line);
      freeLines.push(line);
    });

    localStorage.setItem("result_" + userId, JSON.stringify({
      mainCat,
      lines: freeLines
    }));
  }

  
 // =========================
// ✅ CHECK PAYMENT
// =========================
const check = await fetch("/check-payment/" + userId);
const status = await check.json();

// =========================
// ✅ DISPLAY
// =========================
const resultDiv = document.getElementById("freeResults");
resultDiv.innerHTML = "";

if (status.paid) {

  // 👉 PAID USER
  paidLines = data[mainCat].paid;

  paidLines.forEach(line => {
    const div = document.createElement("div");
    div.classList.add("result-line");
    div.innerText = line;
    resultDiv.appendChild(div);
  });

} else {

  // 👉 FREE USER
  freeLines.forEach((line, i) => {
    const div = document.createElement("div");
    div.classList.add("result-line");

    div.innerText = line;

    if (i === freeLines.length - 1) {
      div.classList.add("blur-line");
    }

    resultDiv.appendChild(div);
  });
}


fetch("/save-result", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    userId,
    mainCat,
    freeLines
  })
});


  // =========================
  // ✅ BUTTON
  // =========================
  let unlocked = false;
  document.getElementById("unlockBtn").onclick = async () => {

    const res = await fetch("/create-order", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        userId: userId
      })
    });
  
    const data = await res.json();
  
    // ✅ SAFETY CHECK
    if (!data.payment_link) {
      console.error("Payment failed:", data);
      alert("Payment start nahi hua, backend error hai");
      return;
    }
  
    // ✅ ONLY VALID CASE
    window.location.href = data.payment_link;
  };

});