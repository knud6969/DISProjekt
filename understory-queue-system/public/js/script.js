// public/js/script.js
console.log("✅ script.js (poll-first) er loadet");

const joinBtn   = document.getElementById("joinBtn");
const statusDiv = document.getElementById("status");
const BASE_URL  = window.location.origin;

// Hvis brugeren allerede har et userId, så send dem direkte til køstatus
(function autoResume() {
  const existing = localStorage.getItem("userId");
  if (existing) {
    console.log("↩️  Eksisterende userId fundet – sender til køstatus");
    window.location.href = `/queue/status?userId=${encodeURIComponent(existing)}`;
  }
})();

function setStatus(text) {
  if (statusDiv) statusDiv.textContent = text;
}

joinBtn?.addEventListener("click", async () => {
  joinBtn.disabled = true;
  setStatus("⏳ Tilmeldes køen...");

  // Stabil ID-generation
  let userId;
  try {
    userId = crypto.randomUUID();
  } catch {
    userId = "user_" + Math.random().toString(36).slice(2, 10);
  }

  try {
    const res = await fetch(`${BASE_URL}/queue/join`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });

    // Håndter rate limit venligt
    if (res.status === 429) {
      const ra = res.headers.get("Retry-After");
      const wait = ra ? Number(ra) : 10;
      setStatus(`🐢 Serveren er travl. Prøver igen om ${wait}s…`);
      setTimeout(() => joinBtn.click(), wait * 1000);
      return;
    }

    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || `Serverfejl: ${res.status}`);

    // Gem userId så kø-siden kan poll’e uden ekstra state
    localStorage.setItem("userId", userId);

    // (Valgfrit) vis initial position kort
    if (typeof data.position === "number") {
      setStatus(`🙌 Du er nu i køen som nr. ${data.position} – sender dig til status…`);
    } else {
      setStatus("🙌 Du er nu i køen – sender dig til status…");
    }

    // Send videre til din køstatus-side (som bruger polling)
    window.location.href = `/queue/status?userId=${encodeURIComponent(userId)}`;
  } catch (err) {
    console.error("🌐 Fejl ved tilmelding:", err);
    setStatus("❌ Kunne ikke tilmelde dig køen: " + (err?.message || "ukendt fejl"));
    joinBtn.disabled = false;
  }
});
