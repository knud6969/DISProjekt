console.log("✅ queue.js (polling) er loadet");

const queueInfo = document.getElementById("queueInfo");
const userId = localStorage.getItem("userId");

if (!userId) {
  console.warn("🚫 Ingen user-id fundet, sender tilbage til forsiden.");
  window.location.href = "/";
}

const BASE = window.location.origin;

// --- UI helpers ---
function renderPending({ position, ahead, etaSeconds }) {
  if (position == null) {
    queueInfo.textContent = "⏳ Du er ikke længere i køen – prøver igen om lidt…";
    return;
  }
  const eta = Math.max(0, Math.round(etaSeconds ?? ahead * 2));
  queueInfo.textContent = `📊 Du er nr. ${position} i køen (${ahead} foran dig) • ETA ≈ ${eta}s`;
}
function renderReadyAndRedirect({ token, redirectUrl }) {
  queueInfo.textContent = "🎉 Du er igennem køen! Sender dig videre…";
  // foretræk claim-token for engangsadgang; fallback til redirectUrl
  if (token) {
    window.location.href = `${BASE}/queue/claim/${token}`;
  } else if (redirectUrl) {
    window.location.href = redirectUrl;
  } else {
    // absolut fallback hvis backend ikke giver URL
    window.location.href = "https://lamineyamalerenwanker.app";
  }
}

// --- Tilmeld brugeren (idempotent) ---
async function joinQueue() {
  try {
    console.log("📦 POST /queue/join", userId);
    const res = await fetch(`${BASE}/queue/join`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });
    if (!res.ok) throw new Error(`Serverfejl: ${res.status}`);
    const data = await res.json();
    queueInfo.textContent = `🙌 Du er nu i køen som nr. ${data.position}`;
  } catch (err) {
    console.error("❌ Fejl ved tilmelding:", err);
    queueInfo.textContent = "❌ Kunne ikke tilmelde dig køen – prøver igen om lidt…";
  }
}

// --- Polling med backoff/jitter ---
let backoffMs = 30_000;      // normal interval
const MIN_MS   = 15_000;
const MAX_MS   = 120_000;
let pollTimer  = null;

function scheduleNextPoll(ms = backoffMs) {
  clearTimeout(pollTimer);
  const jitter = Math.floor(Math.random() * 1000); // undgå sync-storms
  pollTimer = setTimeout(poll, ms + jitter);
}

async function poll() {
  try {
    // respekter tab-visibility for at skåne backend
    if (document.hidden) {
      scheduleNextPoll(Math.min(MAX_MS, backoffMs * 1.5));
      return;
    }

    const res = await fetch(`${BASE}/queue/status/${encodeURIComponent(userId)}`, {
      headers: { "Accept": "application/json" },
    });

    if (res.status === 404) {
      console.warn("🚫 Bruger ikke fundet – sender til forsiden");
      window.location.href = "/";
      return;
    }

    if (res.status === 429) {
      // ratelimit – brug Retry-After hvis sat, ellers backoff
      const ra = res.headers.get("Retry-After");
      const delay = ra ? Number(ra) * 1000 : Math.min(MAX_MS, backoffMs * 2);
      queueInfo.textContent = "⏳ Mange forespørgsler – sænker hastigheden…";
      scheduleNextPoll(delay);
      return;
    }

    if (!res.ok) throw new Error(`Status ${res.status}`);

    const data = await res.json();
    console.log("📊 Aktuel status:", data);

    if (data.ready) {
      renderReadyAndRedirect(data);
      return; // stop yderligere polling
    }

    // pending
    renderPending({
      position: data.position ?? null,
      ahead: data.ahead ?? (data.position ? data.position - 1 : null),
      etaSeconds: data.etaSeconds,
    });

    // succes → reset backoff til baseline (30s)
    backoffMs = 30_000;
    scheduleNextPoll(backoffMs);
  } catch (err) {
    console.error("❌ Fejl ved status-check:", err);
    queueInfo.textContent = "⚠️ Kunne ikke hente status – prøver igen…";
    // eksponentiel backoff på fejl
    backoffMs = Math.min(MAX_MS, Math.max(MIN_MS, Math.floor(backoffMs * 2)));
    scheduleNextPoll(backoffMs);
  }
}

// genoptag poll straks når brugeren vender tilbage til fanen
document.addEventListener("visibilitychange", () => {
  if (!document.hidden) {
    backoffMs = 30_000;
    scheduleNextPoll(500); // hurtigt tjek
  }
});

// startsekvens
(async () => {
  await joinQueue();  // O(log N), idempotent
  await poll();       // første statuskald
})();
