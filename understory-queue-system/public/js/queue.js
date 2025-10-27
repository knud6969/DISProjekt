// public/js/queue.js
console.log("✅ queue.js (polling) er loadet");

const queueInfo = document.getElementById("queueInfo");
const BASE = window.location.origin;

function getQueryUserId() {
  const id = new URLSearchParams(window.location.search).get("userId");
  return id && id.trim() ? id.trim() : null;
}
function getUserId() {
  // Læs fra URL først (så man kan dele link), ellers localStorage
  return getQueryUserId() || localStorage.getItem("userId");
}

function renderPending({ position, ahead, etaSeconds }) {
  const pos = (typeof position === "number") ? position : null;
  const aheadVal = (typeof ahead === "number") ? ahead : (pos ? pos - 1 : null);
  const eta = Math.max(0, Math.round(typeof etaSeconds === "number" ? etaSeconds : (aheadVal ?? 0) * 2));
  queueInfo.textContent = `📊 Du er nr. ${pos ?? "?"} i køen (${aheadVal ?? "?"} foran dig) • ETA ≈ ${eta}s`;
}

function redirectReady({ token, redirectUrl }) {
  queueInfo.textContent = "🎉 Du er igennem køen! Sender dig videre…";
  // Brug engangstoken hvis muligt
  if (token) {
    window.location.href = `${BASE}/queue/claim/${token}`;
  } else if (redirectUrl) {
    window.location.href = redirectUrl;
  } else {
    // sidste fallback
    window.location.href = "https://lamineyamalerenwanker.app";
  }
}

// Polling m. jitter + backoff + visibility-awareness
let backoffMs = 30_000;
const MIN_MS = 10_000, MAX_MS = 120_000;
let pollTimer;

function scheduleNext(ms) {
  clearTimeout(pollTimer);
  const jitter = Math.floor(Math.random() * 800);
  pollTimer = setTimeout(poll, ms + jitter);
}

async function poll() {
  const userId = getUserId();
  if (!userId) {
    console.warn("🚫 Mangler userId – tilbage til forsiden");
    window.location.href = "/";
    return;
  }

  // Skån backend når fanen er skjult
  if (document.hidden) { scheduleNext(Math.min(MAX_MS, backoffMs * 1.5)); return; }

  try {
    const res = await fetch(`${BASE}/queue/status/${encodeURIComponent(userId)}`, {
      headers: { "Accept": "application/json" }
    });

    if (res.status === 404) { window.location.href = "/"; return; }
    if (res.status === 429) { scheduleNext(Math.min(MAX_MS, backoffMs * 2)); return; }
    if (!res.ok) throw new Error(`Status ${res.status}`);

    const data = await res.json();
    console.log("📊 Status:", data);

    if (data.ready) { redirectReady(data); return; }

    renderPending({
      position: data.position ?? null,
      ahead: data.ahead ?? (typeof data.position === "number" ? data.position - 1 : null),
      etaSeconds: data.etaSeconds
    });

    backoffMs = 30_000;
    scheduleNext(backoffMs);
  } catch (e) {
    console.error("❌ Fejl ved status:", e);
    queueInfo.textContent = "⚠️ Kunne ikke hente status – prøver igen…";
    backoffMs = Math.min(MAX_MS, Math.max(MIN_MS, backoffMs * 2));
    scheduleNext(backoffMs);
  }
}

// start polling og reagér når man vender tilbage til fanen
poll();
document.addEventListener("visibilitychange", () => { if (!document.hidden) scheduleNext(500); });
