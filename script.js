
/* MaceMC - JavaScript */

"use strict";

// Minecraft server IP manzili
const SERVER_IP = "PLAY.MACEMC.NET";

// Server IP manzilini nusxalash
async function copyIP() {
    try {
        await navigator.clipboard.writeText(SERVER_IP);
        showMessage("Server IP nusxalandi: " + SERVER_IP);
    } catch (error) {
        const input = document.createElement("textarea");
        input.value = SERVER_IP;
        input.style.position = "fixed";
        input.style.opacity = "0";

        document.body.appendChild(input);
        input.select();

        const copied = document.execCommand("copy");
        input.remove();

        if (copied) {
            showMessage("Server IP nusxalandi!");
        } else {
            window.prompt("IP manzilni nusxalang:", SERVER_IP);
        }
    }
}

// Saytda xabar ko'rsatish
function showMessage(message) {
    let notification = document.getElementById("mace-notification");

    if (!notification) {
        notification = document.createElement("div");
        notification.id = "mace-notification";

        Object.assign(notification.style, {
            position: "fixed",
            bottom: "25px",
            left: "50%",
            transform: "translateX(-50%)",
            background: "#a855f7",
            color: "#ffffff",
            padding: "14px 22px",
            borderRadius: "10px",
            fontSize: "14px",
            fontWeight: "bold",
            zIndex: "9999",
            boxShadow: "0 5px 25px #0008"
        });

        document.body.appendChild(notification);
    }

    notification.textContent = message;
    notification.style.display = "block";

    clearTimeout(notification.hideTimer);
    notification.hideTimer = setTimeout(() => {
        notification.style.display = "none";
    }, 2500);
}

// Sahifa tayyor bo'lganda ishga tushadi
document.addEventListener("DOMContentLoaded", () => {
    console.log("MaceMC website loaded successfully!");

    // Barcha IP nusxalash tugmalarini ulash
    document.querySelectorAll("[data-copy-ip]").forEach(button => {
        button.addEventListener("click", copyIP);
    });
});

"use strict";

const ADMIN_EMAIL = "diyorbekabdumominov69@gmail.com";
const SESSION_KEY = "macemc_demo_session";
const USERS_KEY = "macemc_demo_users";

function getUsers() {
  try {
    return JSON.parse(localStorage.getItem(USERS_KEY) || "{}");
  } catch {
    return {};
  }
}

function currentEmail() {
  return (localStorage.getItem(SESSION_KEY) || "").toLowerCase();
}

function isAdmin(email) {
  return email.toLowerCase() === ADMIN_EMAIL;
}

function updateNavigation() {
  const email = currentEmail();
  const register = document.querySelector(".register-btn");
  const account = document.getElementById("accountLink");

  if (register) {
    register.classList.toggle("hidden", Boolean(email));
  }

  if (account) {
    account.classList.toggle("hidden", !email);
    account.textContent = email && isAdmin(email)
      ? "Admin / Hisobim"
      : "Hisobim";
  }
}

function assignRank(email, rank) {
  // Faqat interfeys uchun demo tekshiruvi.
  if (!isAdmin(currentEmail())) {
    throw new Error("Admin ruxsati yo'q.");
  }

  if (!["Plus", "Pro", "Ultra"].includes(rank)) {
    throw new Error("Noto'g'ri rank.");
  }

  const users = getUsers();
  const target = email.trim().toLowerCase();

  if (!users[target]) {
    throw new Error("Foydalanuvchi topilmadi.");
  }

  if (isAdmin(target)) {
    throw new Error("Admin hisobining rankini o'zgartirib bo'lmaydi.");
  }

  users[target].rank = rank;
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

document.addEventListener("DOMContentLoaded", () => {
  updateNavigation();

  // Sayt ichidagi boshqa sahifalarda ham menyuni yangilash.
  const email = currentEmail();
  if (email) {
    console.log("MaceMC account loaded.");
  }
});

// Boshqa skriptlar foydalanishi uchun.
window.MaceMC = {
  ADMIN_EMAIL,
  isAdmin,
  assignRank
};

"use strict";

document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener("click", event => {
      const target = document.querySelector(link.getAttribute("href"));
      if (target) {
        event.preventDefault();
        target.scrollIntoView({ behavior: "smooth" });
      }
    });
  });

  // Frontend server mavjudligini tekshiradi.
  // Haqiqiy login va admin huquqi backend tomonidan tekshirilishi shart.
  async function checkServer() {
    try {
      const response = await fetch("/api/health");
      if (!response.ok) throw new Error("Server javob bermadi");
      return await response.json();
    } catch {
      return null;
    }
  }

  window.MaceMC = { checkServer };

  const userLabel = document.querySelector("[data-user-email]");
  if (userLabel) {
    fetch("/api/auth/me", { credentials: "include" })
      .then(response => response.ok ? response.json() : null)
      .then(data => {
        if (data?.user) userLabel.textContent = data.user.email;
      })
      .catch(() => {});
  }
});
