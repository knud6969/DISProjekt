console.log("✅ script.js er loadet");

// Hent knap og statusfelt
const joinBtn = document.getElementById("joinBtn");
const statusDiv = document.getElementById("status");

// Base-URL (automatisk korrekt uanset domæne)
const BASE_URL = window.location.origin;

// Socket.IO setup
let socket;

// Initialiser socket.io — men kun når brugeren trykker "Tilmeld kø"
function initSocket() {
  try {
    socket = io(BASE_URL, { transports: ["websocket"], reconnection: true });
    console.log("🔌 Socket.IO initialiseret:", BASE_URL);

    socket.on("connect", () => {
      console.log("🟢 Forbundet til Socket.IO:", socket.id);
      statusDiv.textContent = "Forbundet til serveren – du er nu i køen.";
    });

    socket.on("disconnect", (reason) => {
      console.warn("🔴 Socket frakoblet:", reason);
      statusDiv.textContent = "⚠️ Forbindelse mistet – forsøger at genoprette...";
    });

    socket.io.on("reconnect", () => {
      console.log("♻️ Socket-forbindelse genetableret");
      statusDiv.textContent = "🔁 Forbundet igen – opdaterer køstatus...";
    });

    // Opdater kødata
    socket.on("queue:fullUpdate", (queue) => {
      console.log("📡 Fuld køopdatering:", queue);
    });

    socket.on("queue:update", (data) => {
      console.log("📡 Event:", data);
      if (data.type === "joined") {
        statusDiv.textContent = `📊 Du er i køen – position: ${data.position} (antal i kø: ${data.queueLength})`;
      }
      if (data.type === "processed") {
        if (data.userId === localStorage.getItem("userId")) {
          statusDiv.textContent = "🎉 Du er igennem køen! Sender dig videre...";
          setTimeout(() => (window.location.href = data.redirectUrl), 2000);
        }
      }
      if (data.type === "idle") {
        statusDiv.textContent = "⏸️ Køen er tom – du sendes videre...";
        setTimeout(() => (window.location.href = "https://lamineyamalerenwanker.app"), 2000);
      }
    });
  } catch (err) {
    console.error("❌ Socket-fejl:", err);
  }
}

// 🧠 "Tilmeld kø"-knap
joinBtn.addEventListener("click", async () => {
  joinBtn.disabled = true;
  statusDiv.textContent = "⏳ Tilmeldes køen...";

  let userId;
  try {
    userId = crypto.randomUUID();
  } catch {
    userId = "user_" + Math.random().toString(36).substring(2, 9);
  }

  console.log("📦 Sender til /queue/join med userId:", userId);

  try {
    const res = await fetch(`${BASE_URL}/queue/join`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });

    const data = await res.json();

    if (!res.ok) throw new Error(data.error || "Ukendt serverfejl");

    // Gem bruger-ID lokalt
    localStorage.setItem("userId", userId);

    // ✅ Socket initialiseres nu (efter tilmelding)
    initSocket();

    // Redirect til korrekt køstatus-URL (param som path)
    window.location.href = `/queue/status?userId=${userId}`;
  } catch (err) {
    console.error("🌐 Fejl ved tilmelding:", err);
    statusDiv.textContent = "❌ Kunne ikke tilmelde dig køen: " + err.message;
  } finally {
    joinBtn.disabled = false;
  }
});
