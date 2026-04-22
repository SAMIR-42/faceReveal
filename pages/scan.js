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
    captureBtn.onclick = () => {

      if (!faceOk) return;
    
      const wrapper = document.querySelector(".camera-wrapper");
      const oldImg = wrapper.querySelector("img");
      if (oldImg) oldImg.remove();
    
      clearInterval(detectInterval);
    
      // 👇 animation hide
      scanAnimation.classList.add("hide-scan");
    
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
    
      retryBtn.disabled = false;
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
    };
});