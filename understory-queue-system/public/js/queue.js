const socket = io();
const queueInfo = document.getElementById("queueInfo");

const userId = localStorage.getItem("userId");
if (!userId) {
  console.warn("🚫 Ingen bruger-id fundet, sender tilbage til forsiden.");
  window.location.href = "/";
}

// Socket.IO events
socket.on("connect", () => {
  console.log("✅ Forbundet til Socket.IO-server:", socket.id);
  queueInfo.textContent = "✅ Forbundet til serveren – venter på køstatus...";
});

socket.on("connected", (msg) => {
  console.log("🔌 Server siger:", msg);
});

socket.on("queue:update", (data) => {
  console.log("📡 Event modtaget:", data);

  if (data.type === "joined") {
    queueInfo.textContent = `👥 Ny bruger tilføjet – kølængde: ${data.queueLength}`;
  }

  if (data.type === "processed") {
    queueInfo.textContent = `✅ Bruger ${data.userId} færdigbehandlet`;
    if (userId === data.userId) {
      queueInfo.textContent = "🎉 Du er igennem køen! Sender dig videre...";
      setTimeout(() => (window.location.href = data.redirectUrl), 2000);
    }
  }

  if (data.type === "idle") {
    queueInfo.textContent = "⏸️ Ingen i køen lige nu.";
  }
});

// Tjek status med backend, så vi kan fange 404 (ikke i køen)
(async function checkQueueStatus() {
  try {
    const res = await fetch(`/queue/status/${userId}`);
    if (!res.ok) {
      console.warn("🚫 Bruger ikke fundet i køen – redirecter til forsiden");
      window.location.href = "/";
      return;
    }
    const data = await res.json();
    console.log("📊 Aktuel køstatus:", data);
  } catch (err) {
    console.error("❌ Fejl ved status-check:", err);
    window.location.href = "/";
  }
})();
