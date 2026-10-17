
"use strict";

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("renderForm");
  if (!form) return;

  const status = document.getElementById("renderStatus");
  const jobs = document.getElementById("jobList");
  const button = document.getElementById("renderButton");

  async function api(path, options = {}) {
    const response = await fetch(path, {
      credentials: "include",
      ...options
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || "Server xatosi.");
    return data;
  }

  async function loadJobs() {
    try {
      const data = await api("/api/montage/jobs");
      jobs.replaceChildren();

      if (!data.jobs?.length) {
        jobs.textContent = "Hozircha render loyihalari yo‘q.";
        return;
      }

      data.jobs.forEach(job => {
        const item = document.createElement("div");
        item.className = "job-item";

        const title = document.createElement("strong");
        title.textContent = job.title || "Video loyihasi";
        const state = document.createElement("p");
        state.textContent = "Holat: " + (job.status || "queued");
        item.append(title, state);

        if (job.downloadUrl) {
          const link = document.createElement("a");
          link.href = job.downloadUrl;
          link.textContent = "Videoni yuklab olish";
          link.rel = "noopener";
          item.append(link);
        }

        jobs.append(item);
      });
    } catch (error) {
      jobs.textContent = error.message;
    }
  }

  form.addEventListener("submit", async event => {
    event.preventDefault();
    const file = document.getElementById("videoFile").files[0];
    if (!file) {
      status.textContent = "Avval video faylni tanlang.";
      return;
    }

    const maxSize = 200 * 1024 * 1024;
    if (file.size > maxSize) {
      status.textContent = "Video 200 MB dan katta. Kichikroq fayl tanlang.";
      return;
    }

    const formData = new FormData();
    formData.append("video", file);
    formData.append("title", document.getElementById("videoTitle").value.trim());
    formData.append("instructions", document.getElementById("instructions").value.trim());
    formData.append("quality", document.getElementById("quality").value);

    button.disabled = true;
    status.textContent = "Video serverga yuborilmoqda...";

    try {
      const result = await api("/api/montage/render", {
        method: "POST",
        body: formData
      });
      status.textContent = result.message || "Render vazifasi qabul qilindi.";
      await loadJobs();
    } catch (error) {
      status.textContent = error.message.includes("Failed to fetch")
        ? "Backend server ishlamayapti yoki manzil noto‘g‘ri."
        : error.message;
    } finally {
      button.disabled = false;
    }
  });

  loadJobs();
});
