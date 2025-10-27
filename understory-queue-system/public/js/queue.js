const socket = io();
const queueInfo = document.getElementById("queueInfo");

// Når forbindelsen er etableret
socket.on("connect", () => {
  console.log("✅ Forbundet til Socket.IO-server:", socket.id);
  queueInfo.textContent = "✅ Forbundet til serveren – venter på opdateringer...";
});

// Hvis forbindelsen mistes
socket.on("disconnect", () => {
  console.warn("⚠️ Forbindelse mistet til Socket.IO");
  queueInfo.textContent = "🚫 Forbindelsen blev afbrudt";
});

// Event fra server (når køen ændres)
socket.on("queue:update", (data) => {
  console.log("📡 Event modtaget:", data);

  // Forskellige typer events
  if (data.type === "joined") {
    queueInfo.textContent = `👥 Ny bruger tilføjet — kølængde: ${data.queueLength}`;
  }

  if (data.type === "processed") {
    queueInfo.textContent = `✅ Bruger ${data.userId} er færdigbehandlet`;

    // Hvis det er mig (min bruger)
    if (localStorage.getItem("userId") === data.userId) {
      queueInfo.textContent = "🎉 Du er igennem køen! Sender dig videre...";
      setTimeout(() => (window.location.href = data.redirectUrl), 2000);
    }
  }

  if (data.type === "idle") {
    queueInfo.textContent = "⏸️ Ingen i køen lige nu.";
  }
});

// Til debug – hvis serveren sender velkomst
socket.on("connected", (msg) => {
  console.log("🔌 Server siger:", msg);
});
