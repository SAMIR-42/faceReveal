document.addEventListener("DOMContentLoaded", () => {

    const video = document.getElementById("video");
    const btn = document.getElementById("startBtn");
    const statusText = document.getElementById("statusText");
    const captureBtn = document.getElementById("captureBtn");
    const retryBtn = document.getElementById("retryBtn");
    const ring = document.querySelector(".ring-progress");
  
    let detectInterval;
    let faceOk = false;
  
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
  
        detectFace();
  
      } catch (err) {
        console.error(err);
        statusText.innerText = "Camera / Model error ❌";
      }
    };

    let isProcessing = false;
  
    function detectFace() {
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
            statusText.innerText = "No face detected ❌";
            captureBtn.disabled = true;
            faceOk = false;
            captureBtn.classList.remove("active");
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
            statusText.innerText = "Come closer 📸";
            captureBtn.disabled = true;
            ring.style.strokeDashoffset = 500;
          
            isProcessing = false; 
            return;
          }
  
        // ❌ not centered
        if (!isCentered) {
            statusText.innerText = "Center your face 🎯";
            captureBtn.disabled = true;
            ring.style.strokeDashoffset = 300;
          
            isProcessing = false; 
            return;
          }
  
        // ✅ PERFECT
        statusText.innerText = "Perfect! Ready ✅";
        captureBtn.disabled = false;
        captureBtn.classList.add("active");
        faceOk = true;
        
        ring.style.strokeDashoffset = 0;
        
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
  
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
  
      const ctx = canvas.getContext("2d");
      ctx.drawImage(video, 0, 0);
  
      const img = document.createElement("img");
      img.src = canvas.toDataURL("image/png");
  
      img.style.width = "100%";
      img.style.height = "100%";
      img.style.objectFit = "cover";
      img.style.borderRadius = "50%";
  
      video.style.display = "none";
      document.querySelector(".camera-wrapper").appendChild(img);
    };
  
    // 🔁 RETRY
    retryBtn.onclick = () => location.reload();
  
  });