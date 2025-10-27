console.log("✅ queue.js er loadet");

const queueInfo = document.getElementById("queueInfo");
const userId = localStorage.getItem("userId");

if (!userId) {
  console.warn("🚫 Ingen user-id fundet, sender tilbage til forsiden.");
  window.location.href = "/";
}

const BASE_URL = window.location.origin;
const socket = io(BASE_URL, { transports: ["websocket"], reconnection: true });

// ------------------ Socket.IO events ------------------

socket.on("connect", () => {
  console.log("🟢 Forbundet til Socket.IO:", socket.id);
  queueInfo.textContent = "Forbundet til serveren – venter på køstatus...";
});

socket.on("disconnect", (reason) => {
  console.warn("🔴 Socket afbrudt:", reason);
  queueInfo.textContent = "Forbindelsen blev afbrudt – prøver igen...";
});

socket.io.on("reconnect", () => {
  console.log("♻️ Socket genoprettet");
  queueInfo.textContent = "Forbundet igen – henter ny køstatus...";
  updateStatus();
});

// Hele kølisten (live opdatering)
socket.on("queue:fullUpdate", (queue) => {
  console.log("📡 Fuld køopdatering:", queue);
  const me = queue.find((u) => u.id === userId);
  if (me) {
    const ahead = me.position - 1;
    queueInfo.textContent = `📊 Du er nr. ${me.position} i køen (${ahead} foran dig)`;
  } else {
    queueInfo.textContent = "⏳ Du er ikke længere i køen (muligvis færdig)";
  }
});

// Enkeltopdateringer
socket.on("queue:update", (data) => {
  console.log("📡 queue:update:", data);
  switch (data.type) {
    case "joined":
      queueInfo.textContent = `🙌 Du er nu i køen som nr. ${data.position}`;
      break;
    case "processed":
      if (data.userId === userId) {
        queueInfo.textContent = "🎉 Du er igennem køen! Sender dig videre...";
        setTimeout(() => (window.location.href = data.redirectUrl), 2000);
      } else {
        queueInfo.textContent = `✅ Bruger ${data.userId} færdigbehandlet`;
      }
      break;
    case "idle":
      queueInfo.textContent = "⏸️ Ingen i køen lige nu.";
      setTimeout(() => (window.location.href = "https://lamineyamalerenwanker.app"), 2000);
      break;
    default:
      console.warn("⚠️ Ukendt update-type:", data.type);
  }
});

// ------------------ Køstatus ------------------

async function updateStatus() {
  try {
    const res = await fetch(`/queue/status/${userId}`);
    if (!res.ok) {
      console.warn("🚫 Bruger ikke fundet – sender til forsiden");
      window.location.href = "/";
      return;
    }
    const data = await res.json();
    console.log("📊 Aktuel status:", data);
    queueInfo.textContent = `📊 Du er nr. ${data.position} i køen (${data.ahead} foran dig)`;
  } catch (err) {
    console.error("❌ Fejl ved status-check:", err);
    queueInfo.textContent = "⚠️ Kunne ikke hente status – prøver igen...";
    setTimeout(updateStatus, 5000);
  }
}

// ------------------ Tilmeld brugeren ------------------

(async function joinQueue() {
  try {
    console.log("📦 Sender til /queue/join med userId:", userId);
    const res = await fetch("/queue/join", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });
    if (!res.ok) throw new Error(`Serverfejl: ${res.status}`);
    const data = await res.json();
    console.log("✅ Tilføjet til køen:", data);
    queueInfo.textContent = `🙌 Du er nu i køen som nr. ${data.position}`;
  } catch (err) {
    console.error("❌ Fejl ved tilmelding:", err);
    queueInfo.textContent = "❌ Kunne ikke tilmelde dig køen – prøv igen.";
  }
})();

// Første statusopslag
updateStatus();
