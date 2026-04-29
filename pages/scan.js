document.addEventListener("DOMContentLoaded", () => {

    const video = document.getElementById("video");
    const btn = document.getElementById("startBtn");
    const statusText = document.getElementById("statusText");
    const captureBtn = document.getElementById("captureBtn");
    const retryBtn = document.getElementById("retryBtn");
    const ring = document.querySelector(".ring-progress");
    const scanAnimation = document.getElementById("scanAnimation");
   
    retryBtn.disabled = true;
  
    let detectInterval;
    let faceOk = false;
    let isCaptured = false;
    let progress = 0;
    let blinkDetected = false;
  
    async function loadModels() {
      await faceapi.nets.tinyFaceDetector.loadFromUri("/models");
      await faceapi.nets.faceLandmark68Net.loadFromUri("/models");
    }
  
    btn.onclick = async () => {
      
      statusText.innerText = "Loading AI models...";
  
      try {
        await loadModels();
  
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        video.srcObject = stream;
  
        statusText.innerText = "Camera started...";
        btn.style.display = "none";

         // 👇 yaha add kar
         scanAnimation.classList.add("hide-scan");

         retryBtn.disabled = true;
  
        detectFace();
  
      } catch (err) {
        console.error(err);
        statusText.innerText = "Camera / Model error ❌";
      }

      
    };

    let isProcessing = false;
  
    function detectFace() {
        if (detectInterval) clearInterval(detectInterval);
      detectInterval = setInterval(async () => {

        if (isProcessing) return;
        isProcessing = true;

        
        
        if (!video.videoWidth) {
          isProcessing = false;
          return;
        }
  
        const detections = await faceapi
          .detectSingleFace(video, new faceapi.TinyFaceDetectorOptions())
          .withFaceLandmarks();
  
        // ❌ no face
        if (!detections) {
          statusText.innerHTML = 'No face detected <i class="fa-solid fa-face-frown"></i>';
            captureBtn.disabled = true;
            faceOk = false;
            captureBtn.classList.remove("active");
            progress = 0;
            ring.style.strokeDashoffset = 754;
          
            isProcessing = false; 
            return;
          }
  
        const box = detections.detection.box;
  
        const centerX = video.videoWidth / 2;
        const faceCenter = box.x + box.width / 2;
  
        const tolerance = video.videoWidth * 0.25;
        const isCentered = Math.abs(centerX - faceCenter) < tolerance;
  
        const isClose = box.width > video.videoWidth * 0.18;
  
        // ❌ too far
        if (!isClose) {
          statusText.innerHTML = 'Come closer <i class="fa-solid fa-camera"></i>';
            captureBtn.disabled = true;
            faceOk = false;
            progress = Math.min(progress + 10, 30);
ring.style.strokeDashoffset = 754 - (progress * 7.54);
          
            isProcessing = false; 
            return;
          }
  
        // ❌ not centered
        if (!isCentered) {
          statusText.innerHTML = 'Center your face <i class="fa-solid fa-crosshairs"></i>';
            captureBtn.disabled = true;
            faceOk = false;
            progress = Math.min(progress + 10, 60);
ring.style.strokeDashoffset = 754 - (progress * 7.54);
          
            isProcessing = false; 
            return;
          }


          const landmarks = detections.landmarks;

const leftEye = landmarks.getLeftEye();
const rightEye = landmarks.getRightEye();

// simple blink logic (distance check)
const eyeHeight = Math.abs(leftEye[1].y - leftEye[5].y);
const eyeWidth = Math.abs(leftEye[0].x - leftEye[3].x);

const eyeRatio = eyeHeight / eyeWidth;

if (eyeRatio < 0.25) {
  blinkDetected = true;
}

          
        // ✅ PERFECT
// face already good → allow capture instantly
statusText.innerHTML = 'Face Verified <i class="fa-solid fa-circle-check"></i>';
captureBtn.disabled = false;
captureBtn.classList.add("active");
faceOk = true;

// optional blink boost
if (blinkDetected) {
  progress = 100;
} else {
  progress = Math.min(progress + 10, 90);
}

ring.style.strokeDashoffset = 754 - (progress * 7.54);

isProcessing = false;
      }, 400);
    }
  
    // 📸 CAPTURE
   // 📸 CAPTURE
captureBtn.onclick = () => {

  // 👇 agar already capture ho chuka hai
  if (isCaptured) {
    window.location.href = "analysis.html";
    return;
  }

  if (!faceOk) return;

  const wrapper = document.querySelector(".camera-wrapper");
  const oldImg = wrapper.querySelector("img");
  if (oldImg) oldImg.remove();

  clearInterval(detectInterval);

  // 👇 animation hide
  scanAnimation.classList.add("hide-scan");

  // =========================
  // 📸 IMAGE CAPTURE
  // =========================
  const canvas = document.createElement("canvas");
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;

  const ctx = canvas.getContext("2d");
  ctx.translate(canvas.width, 0);
  ctx.scale(-1, 1);
  ctx.filter = "brightness(1.05) contrast(1.05) saturate(1.1)";
  ctx.drawImage(video, 0, 0);

  const img = document.createElement("img");
  img.src = canvas.toDataURL("image/png");

  img.style.width = "100%";
  img.style.height = "100%";
  img.style.objectFit = "cover";
  img.style.borderRadius = "50%";

  video.style.display = "none";
  wrapper.appendChild(img);

  // =========================
  // 💾 SAVE FACE
  // =========================
  // Use sessionStorage so back/leave forces re-scan
  sessionStorage.setItem("faceImage", img.src);

  // =========================
  // 🆔 SCAN ID (fresh per capture)
  // =========================
  const scanId = crypto.randomUUID();
  sessionStorage.setItem("scanId", scanId);

  // Clear any old unlock/payment UI state for new scan
  sessionStorage.removeItem("orderId");
  sessionStorage.removeItem("paidConfirmed");
  // =========================
  // 🎯 UI STATE UPDATE
  // =========================
  retryBtn.disabled = false;
  isCaptured = true;

  captureBtn.innerText = "Reveal Personality";
  captureBtn.classList.add("active");
};
    // 🔁 RETRY
    retryBtn.onclick = () => {

      const wrapper = document.querySelector(".camera-wrapper");
    
      // ❌ old image remove
      const oldImg = wrapper.querySelector("img");
      if (oldImg) oldImg.remove();
    
      // ✅ video wapas
      video.style.display = "block";
    
      // ✅ animation wapas show
      scanAnimation.classList.remove("hide-scan");
    
      // ✅ reset states
      faceOk = false;
      blinkDetected = false;
      progress = 0;
    
      captureBtn.disabled = true;
      captureBtn.classList.remove("active");
    
      retryBtn.disabled = true;
    
      statusText.innerText = "Align your face";
    
      // ✅ IMPORTANT: detection restart kar
      detectFace();

      // 🔁 reset button back
      isCaptured = false;
      captureBtn.innerText = "Capture";
    };

    // =========================
    // LIVE RECENTLY ANALYZED (fake UI)
    // =========================
    const liveCountEl = document.getElementById("liveCount");
    const liveFaces = [
      document.getElementById("liveFace1"),
      document.getElementById("liveFace2"),
      document.getElementById("liveFace3")
    ].filter(Boolean);

    function shuffleInPlace(arr) {
      for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
      }
      return arr;
    }

    function setLiveFaces(pool) {
      if (!liveFaces.length || !pool?.length) return;
      const chosen = shuffleInPlace([...pool]).slice(0, liveFaces.length);
      liveFaces.forEach((img, idx) => {
        img.src = chosen[idx];
      });
    }

    // Fallback pool: agar `assets/live-scan` images available na ho to bhi UI smooth rahe
    const fallbackPool = Array.from({ length: 15 }, (_, i) => `../assets/${i + 1}.jpg`);
    let livePool = fallbackPool;

    // Counter: hamesha 200+ rahe, kabhi up kabhi down
    let liveCount = Math.floor(210 + Math.random() * 120);
    if (liveCountEl) liveCountEl.textContent = liveCount;

    const minCount = 200;
    const bumpCounter = () => {
      if (!liveCountEl) return;
      liveCountEl.classList.remove("count-bump");
      // force reflow so animation re-triggers
      void liveCountEl.offsetWidth;
      liveCountEl.classList.add("count-bump");
    };

    setInterval(() => {
      if (!liveCountEl) return;
      const delta = Math.floor(Math.random() * 7) - 2; // -2..+4
      liveCount = Math.max(minCount, liveCount + delta);
      // keep within a reasonable display range
      liveCount = Math.min(999, liveCount);
      liveCountEl.textContent = liveCount;
      bumpCounter();
    }, 1800);

    // Update avatar faces occasionally
    setInterval(() => {
      setLiveFaces(livePool);
    }, 5200);

    // Load live-scan images once per visit
    (async () => {
      try {
        const loaded = [];
        const maxTry = 30; // `live-scan/1.jpg` ... `live-scan/30.jpg`
        const candidates = [];
        for (let i = 1; i <= maxTry; i++) {
          candidates.push(`../assets/live-scan/${i}.jpg`);
          candidates.push(`../assets/live-scan/${i}.png`);
        }

        const checks = candidates.map((url) => {
          return new Promise((resolve) => {
            const im = new Image();
            im.onload = () => resolve({ ok: true, url });
            im.onerror = () => resolve({ ok: false, url });
            im.src = url;
          });
        });

        const results = await Promise.all(checks);
        results.forEach((r) => {
          if (r.ok) loaded.push(r.url);
        });

        if (loaded.length >= 3) {
          livePool = loaded;
          setLiveFaces(livePool);
        } else {
          setLiveFaces(fallbackPool);
        }
      } catch {
        setLiveFaces(fallbackPool);
      }
    })();

    // initial render
    setLiveFaces(livePool);

    // =========================
    // GUIDE POPUP (scan help)
    // =========================
    const guideBtn = document.getElementById("guideBtn");
    const guideOverlay = document.getElementById("guideOverlay");
    const guideModal = document.getElementById("guideModal");
    const guideClose = document.getElementById("guideClose");

    function openGuide() {
      if (!guideOverlay) return;
      guideOverlay.classList.add("open");
      guideOverlay.setAttribute("aria-hidden", "false");
    }

    function closeGuide() {
      if (!guideOverlay) return;
      guideOverlay.classList.remove("open");
      guideOverlay.setAttribute("aria-hidden", "true");
    }

    guideBtn?.addEventListener("click", (e) => {
      e.stopPropagation();
      openGuide();
    });

    guideClose?.addEventListener("click", () => closeGuide());

    // Backdrop click pe close (mobile + laptop friendly)
    guideOverlay?.addEventListener("click", (e) => {
      if (e.target === guideOverlay) closeGuide();
    });

    // Modal ke andar click close na kare
    guideModal?.addEventListener("click", (e) => e.stopPropagation());

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closeGuide();
    });
});

