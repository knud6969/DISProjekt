// public/js/script.js
console.log("✅ script.js (click-to-join) er loadet");

const joinBtn   = document.getElementById("joinBtn");
const statusDiv = document.getElementById("status");
const BASE_URL  = window.location.origin;

function setStatus(t){ if (statusDiv) statusDiv.textContent = t; }

// VIGTIGT: Ingen auto-redirect her. Man join’er KUN når man klikker.
joinBtn?.addEventListener("click", async () => {
  joinBtn.disabled = true;
  setStatus("⏳ Tilmeldes køen...");

  // Stabilt userId
  let userId;
  try { userId = crypto.randomUUID(); }
  catch { userId = "user_" + Math.random().toString(36).slice(2, 10); }

  try {
    const res = await fetch(`${BASE_URL}/queue/join`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || `Serverfejl: ${res.status}`);

    // Gem userId og send til køstatus-siden
    localStorage.setItem("userId", userId);
    setStatus(`🙌 Du er nu i køen som nr. ${data.position ?? "?"} – sender dig til status…`);
    window.location.href = `/queue/status?userId=${encodeURIComponent(userId)}`;
  } catch (err) {
    console.error("🌐 Fejl ved tilmelding:", err);
    setStatus("❌ Kunne ikke tilmelde dig køen: " + (err?.message || "ukendt fejl"));
    joinBtn.disabled = false;
  }
});
