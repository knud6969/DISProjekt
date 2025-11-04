// public/js/queue.js
console.log("✅ queue.js (final redirect version) er loadet");

const queueInfo = document.getElementById("queueInfo");
const BASE = window.location.origin;

function getQueryUserId() {
  const id = new URLSearchParams(window.location.search).get("userId");
  return id && id.trim() ? id.trim() : null;
}
function getUserId() {
  return getQueryUserId() || localStorage.getItem("userId");
}

function renderPending(position, ahead, etaSeconds) {
  const pos = typeof position === "number" ? position : null;
  const aheadVal = typeof ahead === "number" ? ahead : (pos !== null ? pos - 1 : null);
  const eta = typeof etaSeconds === "number" ? etaSeconds : (aheadVal ?? 0) * 2;
  queueInfo.textContent = `Du er nr. ${pos ?? "?"} i køen (${aheadVal ?? "?"} foran dig) • ETA ≈ ${Math.round(eta)}s`;
}

function redirectReady(data) {
  console.log("READY → redirecter nu", data);
  queueInfo.textContent = "Du er igennem køen! Sender dig videre…";

  try {
    // Ingen data → direkte fallback
    if (!data) {
      console.warn("⚠️  Ingen data modtaget fra serveren");
      window.location.href = "/done";
      return;
    }

    // 1️⃣  Foretrukket: token-flow
    if (data.token && typeof data.token === "string" && data.token.length > 5) {
      console.log("➡️  Redirect via token:", data.token);
      window.location.href = `/queue/claim/${encodeURIComponent(data.token)}`;
      return;
    }

    // 2️⃣  Fallback: direkte redirect-url
    if (data.redirectUrl) {
      console.log("➡️  Redirect via redirectUrl:", data.redirectUrl);
      window.location.href = data.redirectUrl;
      return;
    }

    // 3️⃣  Sidste fallback
    console.warn("Ingen token eller redirectUrl, sender til /done");
    window.location.href = "/done";
  } catch (err) {
    console.error("redirectReady fejl:", err);
    queueInfo.textContent = "⚠️  Fejl under viderestilling… prøver igen om lidt.";
    setTimeout(() => (window.location.href = "/done"), 2000);
  }
}

let backoffMs = 30000;
const MIN_MS = 10000, MAX_MS = 120000;
let pollTimer = null;

function scheduleNext(ms) {
  clearTimeout(pollTimer);
  pollTimer = setTimeout(poll, ms + Math.floor(Math.random() * 800));
}

async function poll() {
  const userId = getUserId();
  if (!userId) {
    console.warn("userId mangler → hjem");
    window.location.href = "/";
    return;
  }

  if (document.hidden) {
    scheduleNext(Math.min(MAX_MS, backoffMs * 1.5));
    return;
  }

  try {
    const res = await fetch(`${BASE}/queue/status/${encodeURIComponent(userId)}`);
    const data = await res.json().catch(() => ({}));
    console.log("Status respons:", res.status, data);

    if (res.status === 404) { window.location.href = "/"; return; }
    if (res.status === 429) { scheduleNext(Math.min(MAX_MS, backoffMs * 2)); return; }
    if (!res.ok) throw new Error(`Status ${res.status}`);

    if (data.ready === true) {
      redirectReady(data);
      return;
    }

    renderPending(data.position, data.ahead, data.etaSeconds);
    backoffMs = 30000;
    scheduleNext(backoffMs);

  } catch (err) {
    console.error("Poll fejl:", err);
    queueInfo.textContent = "⚠️ Fejl – prøver igen…";
    backoffMs = Math.min(MAX_MS, Math.max(MIN_MS, backoffMs * 2));
    scheduleNext(backoffMs);
  }
}

poll();

document.addEventListener("visibilitychange", () => {
  if (!document.hidden) scheduleNext(500);
});

function renderPending(position, ahead, etaSeconds) {
  const pos = typeof position === "number" ? position : null;
  const aheadVal = typeof ahead === "number" ? ahead : (pos !== null ? pos - 1 : null);
  const eta = typeof etaSeconds === "number" ? etaSeconds : (aheadVal ?? 0) * 2;

  queueInfo.textContent = `Du er nr. ${pos ?? "?"} i køen (${aheadVal ?? "?"} foran dig) • ETA ≈ ${Math.round(eta)} sek`;

  // Progress-bar beregning (jo lavere position, jo højere procent)
  const totalEstimate = Math.max(aheadVal + 1, 1);
  const progress = Math.min(100, ((totalEstimate - aheadVal) / totalEstimate) * 100);
  document.getElementById("progress-bar").style.width = `${progress}%`;
}

// --- Forlad køen knap ---
const leaveBtn = document.getElementById("leaveBtn");

if (leaveBtn) {
  leaveBtn.addEventListener("click", async () => {
    const userId = localStorage.getItem("userId");
    if (!userId) {
      console.warn("🚫 Ingen userId fundet, redirecter til forsiden");
      window.location.href = "/";
      return;
    }

    try {
      console.log("🚪 Forlader køen:", userId);
      await fetch(`${BASE}/queue/leave/${encodeURIComponent(userId)}`, {
        method: "DELETE",
      });
    } catch (err) {
      console.error("❌ Fejl ved forlad kø:", err);
    } finally {
      // Fjern userId og send brugeren hjem
      localStorage.removeItem("userId");
      window.location.href = "/";
    }
  });
}