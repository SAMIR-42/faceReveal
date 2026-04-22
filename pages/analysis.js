document.addEventListener("DOMContentLoaded", () => {
    const img = document.getElementById("userImage");
  
    const saved = localStorage.getItem("faceImage");
  
    if (saved) {
      img.src = saved;
    }
  });