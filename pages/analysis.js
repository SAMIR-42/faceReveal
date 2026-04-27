import { data } from "./data.js";

document.addEventListener("DOMContentLoaded", async () => {

  // =========================
  // ✅ USER ID
  // =========================
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

  // =========================
  // ✅ PAYMENT RETURN + 1HR SYSTEM
  // =========================
  const urlParams = new URLSearchParams(window.location.search);
  const paidFromURL = urlParams.get("paid");

  

  if (paidFromURL === "true") {
    // ✅ 1 hour validity save
    localStorage.setItem("paidTime", Date.now());

    // URL clean
    window.history.replaceState({}, document.title, window.location.pathname);
  }

  // ✅ check 1 hour validity
  let isLocallyPaid = false;
  const paidTime = localStorage.getItem("paidTime");
  if (paidTime && (Date.now() - paidTime < 3600000)) {

    isLocallyPaid = true;

  }

  // =========================
  // ✅ HELPERS
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
  // ✅ RESULT GENERATE / LOAD
  // =========================
  const scanId = localStorage.getItem("scanId");
  const stored = localStorage.getItem("result_" + userId + "_" + scanId);

  let freeLines = [];
  let mainCat;

  if (stored) {
    const parsed = JSON.parse(stored);
    freeLines = parsed.lines;
    mainCat = parsed.mainCat;

  } else {

    mainCat = randomFrom(Object.keys(data));

    const others = Object.keys(data).filter(c => c !== mainCat);
    const sideCats = getRandomCategories(others, 2);

    const usedLines = new Set();

    const mainLine = randomFrom(data[mainCat].free);
    usedLines.add(mainLine);
    freeLines.push(mainLine);

    sideCats.forEach(cat => {
      let line;
      do {
        line = randomFrom(data[cat].free);
      } while (usedLines.has(line));

      usedLines.add(line);
      freeLines.push(line);
    });

    const scanId = localStorage.getItem("scanId");

    localStorage.setItem(
      "result_" + userId + "_" + scanId,
      JSON.stringify({
        mainCat,
        lines: freeLines
      })
    );
  }

  // =========================
  // ✅ SAVE RESULT FIRST (IMPORTANT FIX)
  // =========================
  await fetch("/save-result", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      userId,
      mainCat,
      freeLines
    })
  });

  // =========================
  // ✅ CHECK PAYMENT
  // =========================
  const check = await fetch("/check-payment/" + userId);
  const status = await check.json();

  renderResults();
  
  // =========================
  // ✅ DISPLAY
  // =========================
  function renderResults() {
    const resultDiv = document.getElementById("freeResults");
    resultDiv.innerHTML = "";
  
    // ✅ FREE LINES
    freeLines.forEach((line) => {
      const div = document.createElement("div");
      div.classList.add("result-line");
      div.innerText = line;
      resultDiv.appendChild(div);
    });
  
    const isPaidUser = status.paid || isLocallyPaid;
  
    if (isPaidUser) {
      // ✅ SHOW FULL
      data[mainCat].paid.forEach(line => {
        const div = document.createElement("div");
        div.classList.add("result-line", "paid-line");
        div.innerText = line;
        resultDiv.appendChild(div);
      });
  
      resultDiv.classList.add("paid-active");
  
    } else {
      // 🔒 BLURRED LINES
      data[mainCat].paid.forEach(line => {
        const div = document.createElement("div");
        div.classList.add("result-line", "blur-line");
        div.innerText = line;
        resultDiv.appendChild(div);
      });
    }
  }

  // =========================
  // ✅ UNLOCK BUTTON
  // =========================
  document.getElementById("unlockBtn").onclick = async () => {

    const res = await fetch("/create-order", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ userId })
    });
  
    const dataRes = await res.json();
  
    if (!dataRes.payment_session_id) {
      console.log("BACKEND ERROR:", dataRes);
      alert("Payment error: " + JSON.stringify(dataRes));
      return;
    }
  
    const cashfree = Cashfree({
      mode: "production"
    });
  
    cashfree.checkout({
      paymentSessionId: dataRes.payment_session_id,
      redirectTarget: "_self"
    });
  };

  const unlockBtn = document.getElementById("unlockBtn");
  const isPaidUser = status.paid || isLocallyPaid;
  if (isPaidUser) {
    unlockBtn.innerText = "Unlocked ✓";
    unlockBtn.disabled = true;
    unlockBtn.style.pointerEvents = "none";
    unlockBtn.style.opacity = "0.6";
  }


  window.addEventListener("focus", async () => {
    const res = await fetch("/check-payment/" + userId);
    const newStatus = await res.json();
  
    if (newStatus.paid || isLocallyPaid) {
      renderResults();
    }
  });

});