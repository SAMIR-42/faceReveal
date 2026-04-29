import { data } from "./data.js";

document.addEventListener("DOMContentLoaded", async () => {
  // Force fresh flow: analysis page must come from a scan in this tab
  const scanId = sessionStorage.getItem("scanId");
  const faceImage = sessionStorage.getItem("faceImage");

  if (!scanId || !faceImage) {
    window.location.replace("scan.html");
    return;
  }

  // Per-scan identity for backend (prevents "pay once unlock forever")
  const userId = "scan_" + scanId;

  function clearScanContext() {
    sessionStorage.removeItem("scanId");
    sessionStorage.removeItem("faceImage");
    sessionStorage.removeItem("orderId");
    sessionStorage.removeItem("paidConfirmed");
    sessionStorage.removeItem("paymentInProgress");
    sessionStorage.removeItem("result_" + userId);
  }

  // Industrial rule:
  // - If payment redirect is happening, DO NOT clear state (otherwise it bounces to scan.html).
  // - If paid is confirmed and user leaves after viewing, clear so next time they must re-scan.
  // - If unpaid and user leaves, clear (fresh scan required).
  window.addEventListener("pagehide", () => {
    const paymentInProgress = sessionStorage.getItem("paymentInProgress") === "true";
    const paidConfirmed = sessionStorage.getItem("paidConfirmed") === "true";

    if (paymentInProgress && !paidConfirmed) return;

    clearScanContext();
  });

  // =========================
  // HELPERS
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

  async function sleep(ms) {
    return new Promise((r) => setTimeout(r, ms));
  }

  // =========================
  // USER IMAGE
  // =========================
  const img = document.getElementById("userImage");
  img.src = faceImage;

  // =========================
  // COMMUNITY IMAGES
  // =========================
  const images = [
    "../assets/1.jpg", "../assets/2.jpg", "../assets/3.jpg",
    "../assets/4.jpg", "../assets/5.jpg", "../assets/6.jpg",
    "../assets/7.jpg", "../assets/8.jpg", "../assets/9.jpg",
    "../assets/10.jpg", "../assets/11.jpg", "../assets/12.jpg",
    "../assets/13.jpg", "../assets/14.jpg", "../assets/15.jpg"
  ];

  const miniFaces = document.querySelectorAll(".mini-face");
  const selectedImages = getRandomImages(images, 3);
  miniFaces.forEach((el, i) => {
    el.src = selectedImages[i];
  });

  // =========================
  // RESULT GENERATE / LOAD (stable across refresh)
  // =========================
  const stored = sessionStorage.getItem("result_" + userId);

  let freeLines = [];
  let mainCat;

  if (stored) {
    const parsed = JSON.parse(stored);
    freeLines = parsed.freeLines;
    mainCat = parsed.mainCat;
  } else {
    mainCat = randomFrom(Object.keys(data));
    const others = Object.keys(data).filter((c) => c !== mainCat);
    const sideCats = getRandomCategories(others, 2);

    const usedLines = new Set();
    const mainLine = randomFrom(data[mainCat].free);
    usedLines.add(mainLine);
    freeLines.push(mainLine);

    sideCats.forEach((cat) => {
      let line;
      do {
        line = randomFrom(data[cat].free);
      } while (usedLines.has(line));
      usedLines.add(line);
      freeLines.push(line);
    });

    sessionStorage.setItem(
      "result_" + userId,
      JSON.stringify({ mainCat, freeLines })
    );

    // Persist on server (so webhook can mark this scan as paid)
    await fetch("/save-result", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, mainCat, freeLines })
    });
  }

  // =========================
  // RENDER
  // =========================
  let isPaidUI = false;

  const unlockBtn = document.getElementById("unlockBtn");
  const resultDiv = document.getElementById("freeResults");

  function setUnlockBtnState(state) {
    // state: "locked" | "unlocking" | "unlocked"
    if (state === "unlocked") {
      unlockBtn.innerHTML = `<i class="fa-solid fa-lock-open"></i> Unlocked`;
      unlockBtn.disabled = true;
      unlockBtn.style.pointerEvents = "none";
      unlockBtn.style.opacity = "0.65";
      return;
    }

    if (state === "unlocking") {
      unlockBtn.innerHTML = `<span class="btn-spinner" aria-hidden="true"></span> Processing...`;
      unlockBtn.disabled = true;
      unlockBtn.style.pointerEvents = "none";
      unlockBtn.style.opacity = "0.85";
      return;
    }

    unlockBtn.innerHTML = `<i class="fa-solid fa-lock"></i> Unlock Full Analysis`;
    unlockBtn.disabled = false;
    unlockBtn.style.pointerEvents = "auto";
    unlockBtn.style.opacity = "1";
  }

  function renderLocked() {
    resultDiv.innerHTML = "";

    freeLines.forEach((line) => {
      const div = document.createElement("div");
      div.classList.add("result-line");
      div.innerText = line;
      resultDiv.appendChild(div);
    });

    // Paid placeholders only (no real text on client)
    const placeholderCount = 2;
    for (let i = 0; i < placeholderCount; i++) {
      const div = document.createElement("div");
      div.classList.add("result-line", "blur-line");
      div.innerText = "••••••••••••••••••••••••••••••";
      resultDiv.appendChild(div);
    }

    resultDiv.style.opacity = "1";
    isPaidUI = false;
  }

  function renderPaid(paidLines) {
    resultDiv.innerHTML = "";

    freeLines.forEach((line) => {
      const div = document.createElement("div");
      div.classList.add("result-line");
      div.innerText = line;
      resultDiv.appendChild(div);
    });

    paidLines.forEach((line) => {
      const div = document.createElement("div");
      div.classList.add("result-line", "paid-line", "paid-reveal");
      div.innerText = line;
      resultDiv.appendChild(div);
    });

    resultDiv.style.opacity = "1";
    document.querySelector(".result-box")?.classList.add("paid-active");
    isPaidUI = true;
  }

  async function refreshPaymentState() {
    const check = await fetch("/check-payment/" + userId);
    const status = await check.json();

    if (!status.paid) {
      setUnlockBtnState("locked");
      // Payment cancel/back ke case me polling runs hoti rehti hai.
      // Agar locked UI ko har baar re-render kiya, to animations restart ho ke "loop" jaisa lagta hai.
      if (!isPaidUI) return false;
      renderLocked();
      return false;
    }

    // Paid: fetch paid lines from server
    const paidRes = await fetch("/paid-lines/" + userId);
    const paidData = await paidRes.json();
    renderPaid(paidData.paidLines || []);
    setUnlockBtnState("unlocked");
    sessionStorage.setItem("paidConfirmed", "true");
    sessionStorage.removeItem("paymentInProgress");
    return true;
  }

  // Initial render: never show paid text without server confirmation
  renderLocked();
  await refreshPaymentState();

  // =========================
  // UNLOCK BUTTON (Cashfree)
  // =========================
  unlockBtn.onclick = async () => {
    setUnlockBtnState("unlocking");
    sessionStorage.setItem("paymentInProgress", "true");

    const res = await fetch("/create-order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId })
    });

    const dataRes = await res.json();

    if (!dataRes.payment_session_id || !dataRes.order_id) {
      console.log("BACKEND ERROR:", dataRes);
      alert("Payment error. Please try again.");
      setUnlockBtnState("locked");
      sessionStorage.removeItem("paymentInProgress");
      return;
    }

    sessionStorage.setItem("orderId", dataRes.order_id);

    const cashfree = Cashfree({ mode: "production" });
    cashfree.checkout({
      paymentSessionId: dataRes.payment_session_id,
      redirectTarget: "_self"
    });
  };

  // If user returns from Cashfree, keep UI stable and poll for webhook confirmation
  const urlParams = new URLSearchParams(window.location.search);
  const returnedOrderId = urlParams.get("order_id");
  if (returnedOrderId) {
    sessionStorage.setItem("orderId", returnedOrderId);
    sessionStorage.setItem("paymentInProgress", "true");
    window.history.replaceState({}, document.title, window.location.pathname);
  }

  const orderId = sessionStorage.getItem("orderId");
  if (orderId && sessionStorage.getItem("paidConfirmed") !== "true") {
    setUnlockBtnState("unlocking");

    // Poll a short time; unlock only after webhook flips DB state
    for (let i = 0; i < 15; i++) {
      const paidNow = await refreshPaymentState();
      if (paidNow) break;
      await sleep(2000);
    }

    if (sessionStorage.getItem("paidConfirmed") !== "true") {
      // Payment may be pending or cancelled; keep locked
      setUnlockBtnState("locked");
    }
  }
});