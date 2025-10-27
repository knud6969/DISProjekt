console.log("✅ script.js er loadet");

const joinBtn = document.getElementById("joinBtn");
const statusDiv = document.getElementById("status");

joinBtn.addEventListener("click", async () => {
  joinBtn.disabled = true;
  statusDiv.textContent = "Tilmeldes køen...";

  let userId;
  try {
    userId = crypto.randomUUID();
  } catch {
    userId = "user_" + Math.random().toString(36).substring(2, 9);
  }

  console.log("📦 Sender til /queue/join med userId:", userId);

  try {
    const res = await fetch("/queue/join", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });

    const data = await res.json();

    if (res.ok) {
      // gem brugerens ID lokalt og send videre til køstatus
      localStorage.setItem("userId", userId);
      window.location.href = "/queue/status";
    } else {
      statusDiv.textContent = "Fejl: " + (data.error || "Ukendt fejl");
    }
  } catch (err) {
    console.error("🌐 Netværksfejl:", err);
    statusDiv.textContent = "Kunne ikke kontakte serveren.";
  }

  joinBtn.disabled = false;
});
