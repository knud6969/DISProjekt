const socket = io();

const queueInfo = document.getElementById("queueInfo");

socket.on("connect", () => {
  console.log("✅ Forbundet til Socket.IO");
});

socket.on("queue:update", (data) => {
  console.log("📡 Event modtaget:", data);

  // Opdater live besked
  if (data.type === "joined") {
    queueInfo.textContent = `Ny bruger tilføjet – kølængde: ${data.queueLength}`;
  }

  if (data.type === "processed") {
    queueInfo.textContent = `Bruger ${data.userId} er færdigbehandlet`;
    if (localStorage.getItem("userId") === data.userId) {
      queueInfo.textContent = "🎉 Du er nu igennem! Sender dig videre...";
      setTimeout(() => {
        window.location.href = data.redirectUrl;
      }, 1500);
    }
  }

  if (data.type === "idle") {
    queueInfo.textContent = "Ingen i køen lige nu.";
  }
});
