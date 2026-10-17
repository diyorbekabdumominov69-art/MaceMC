
"use strict";

const ADMIN_EMAIL = "diyorbekabdumominov69@gmail.com";

const videoInput = document.getElementById("videoFile");
const dropzone = document.getElementById("dropzone");
const preview = document.getElementById("preview");
const fileInfo = document.getElementById("fileInfo");
const promptInput = document.getElementById("prompt");
const renderBtn = document.getElementById("renderBtn");
const downloadBtn = document.getElementById("downloadBtn");
const status = document.getElementById("status");

let selectedFile = null;
let previewUrl = null;

function loadVideo(file) {
  if (!file) return;

  if (!file.type.startsWith("video/")) {
    status.textContent = "Iltimos, video fayl tanlang.";
    return;
  }

  if (previewUrl) URL.revokeObjectURL(previewUrl);

  selectedFile = file;
  previewUrl = URL.createObjectURL(file);

  preview.src = previewUrl;
  preview.hidden = false;
  fileInfo.textContent =
    file.name + " · " + (file.size / (1024 * 1024)).toFixed(1) + " MB";

  downloadBtn.hidden = true;
  status.textContent =
    "Video yuklandi. Endi ingliz tilida prompt yozing.";
}

videoInput.addEventListener("change", () => {
  loadVideo(videoInput.files[0]);
});

["dragenter", "dragover"].forEach(eventName => {
  dropzone.addEventListener(eventName, event => {
    event.preventDefault();
    dropzone.classList.add("dragging");
  });
});

["dragleave", "drop"].forEach(eventName => {
  dropzone.addEventListener(eventName, event => {
    event.preventDefault();
    dropzone.classList.remove("dragging");
  });
});

dropzone.addEventListener("drop", event => {
  loadVideo(event.dataTransfer.files[0]);
});

renderBtn.addEventListener("click", () => {
  if (!selectedFile) {
    status.textContent = "Avval video yuklang.";
    return;
  }

  if (!promptInput.value.trim()) {
    status.textContent = "Montaj uchun prompt yozing.";
    promptInput.focus();
    return;
  }

  status.textContent =
    "Demo rejimi: AI montaj serveri ulanmagan. Hozircha asl videoni yuklab olishingiz mumkin.";

  downloadBtn.href = previewUrl;
  downloadBtn.download = "MaceMC-original-" + selectedFile.name;
  downloadBtn.textContent = "⬇ Asl videoni yuklab olish";
  downloadBtn.hidden = false;
});

document.querySelectorAll(".choose").forEach(button => {
  button.addEventListener("click", () => {
    document.getElementById("selectedPlan").textContent =
      "Tanlangan tarif: " + button.dataset.plan +
      ". Hozircha bu tanlov to'lov yoki obunani faollashtirmaydi.";
  });
});

// Ushbu qism faqat namoyish uchun.
// Brauzer ichidagi tekshiruv haqiqiy admin xavfsizligi emas.
document.getElementById("assignBtn").addEventListener("click", () => {
  const adminEmail = document.getElementById("adminEmail")
    .value.trim().toLowerCase();
  const targetEmail = document.getElementById("targetEmail")
    .value.trim().toLowerCase();
  const rank = document.getElementById("rank").value;
  const adminStatus = document.getElementById("adminStatus");
  const results = document.getElementById("rankResults");

  if (adminEmail !== ADMIN_EMAIL) {
    adminStatus.textContent = "Bu demo panelda admin email mos kelmadi.";
    return;
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(targetEmail)) {
    adminStatus.textContent = "To'g'ri Gmail manzilini kiriting.";
    return;
  }

  // Haqiqiy mahsulotda bu amal serverda tekshirilishi shart.
  const item = document.createElement("div");
  item.className = "rank-item";
  item.textContent = targetEmail + " — " + rank + " (demo)";
  results.prepend(item);

  adminStatus.textContent =
    "Demo yozuvi yaratildi. Haqiqiy rank berilmadi.";
});
