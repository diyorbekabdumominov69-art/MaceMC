
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
