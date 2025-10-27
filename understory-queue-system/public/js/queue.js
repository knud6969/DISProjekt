const socket = io();
const queueInfo = document.getElementById("queueInfo");

const userId = localStorage.getItem("userId");
if (!userId) {
  console.warn("🚫 Ingen bruger-id fundet, sender tilbage til forsiden.");
  window.location.href = "/";
}

// ------------------ Socket.IO events ------------------

socket.on("connect", () => {
  console.log("✅ Forbundet til Socket.IO-server:", socket.id);
  queueInfo.textContent = "✅ Forbundet til serveren – venter på køstatus...";
});

// Når hele kølisten sendes (live opdatering)
socket.on("queue:fullUpdate", (queue) => {
  console.log("📡 Fuld køopdatering:", queue);

  if (!queue.length) {
    queueInfo.textContent = "🚀 Ingen kø – du sendes videre...";
    setTimeout(() => (window.location.href = "https://understory.dk"), 1500);
    return;
  }

  const me = queue.find((u) => u.id === userId);
  if (me) {
    const ahead = me.position - 1;
    queueInfo.textContent = `📊 Du er nr. ${me.position} i køen (${ahead} foran dig)`;
  } else {
    queueInfo.textContent = "⏳ Du er ikke længere i køen (muligvis færdig)";
  }
});

// Når der sker ændringer i køen (join / process / idle)
socket.on("queue:update", (data) => {
  console.log("📡 Event modtaget:", data);

  switch (data.type) {
    case "joined":
      queueInfo.textContent = `👥 Ny bruger tilføjet – kølængde: ${data.queueLength}`;
      break;

    case "processed":
      if (userId === data.userId) {
        queueInfo.textContent = "🎉 Du er igennem køen! Sender dig videre...";
        setTimeout(() => (window.location.href = data.redirectUrl), 2000);
      } else {
        queueInfo.textContent = `✅ Bruger ${data.userId} færdigbehandlet`;
      }
      break;

    case "idle":
      queueInfo.textContent = "⏸️ Ingen i køen lige nu.";
      setTimeout(() => (window.location.href = "https://understory.dk"), 2000);
      break;

    default:
      console.warn("⚠️ Ukendt queue:update-type:", data.type);
  }
});

// ------------------ Fejl- og disconnect-håndtering ------------------

socket.on("disconnect", (reason) => {
  console.warn("🔴 Socket.IO afbrudt:", reason);
  queueInfo.textContent = "⚠️ Forbindelse tabt – forsøger at genoprette...";
});

socket.io.on("reconnect", () => {
  console.log("🔁 Socket.IO genoprettet");
  queueInfo.textContent = "🔁 Forbindelse genoprettet – opdaterer køstatus...";
});

// ------------------ Tilmeld brugeren køen ------------------

(async function joinQueue() {
  try {
    console.log("📦 Sender til /queue/join med userId:", userId);
    const res = await fetch("/queue/join", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });

    if (!res.ok) {
      throw new Error(`Fejl fra server: ${res.status}`);
    }

    const data = await res.json();
    console.log("✅ Tilføjet til køen:", data);
    queueInfo.textContent = `🙌 Du er nu i køen som nr. ${data.position}`;
  } catch (err) {
    console.error("❌ Fejl ved tilmelding til kø:", err);
    queueInfo.textContent =
      "❌ Kunne ikke tilmelde dig køen – prøv at genindlæse siden.";
  }
})();

// ------------------ Første backend-status-check ------------------

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
    queueInfo.textContent =
      "⚠️ Kunne ikke hente status – prøver igen om lidt...";
    setTimeout(() => window.location.reload(), 4000);
  }
})();
