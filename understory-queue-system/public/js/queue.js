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
  queueInfo.textContent = `📊 Du er nr. ${pos ?? "?"} i køen (${aheadVal ?? "?"} foran dig) • ETA ≈ ${Math.round(eta)}s`;
}

function redirectReady(data) {
  console.log("🎉 READY → redirecter nu til /done", data);
  queueInfo.textContent = "🎉 Du er igennem køen! Sender dig videre…";
  window.location.href = "/done";
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
    console.warn("🚫 userId mangler → hjem");
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
    console.log("📊 Status respons:", res.status, data);

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
    console.error("❌ Poll fejl:", err);
    queueInfo.textContent = "⚠️ Fejl – prøver igen…";
    backoffMs = Math.min(MAX_MS, Math.max(MIN_MS, backoffMs * 2));
    scheduleNext(backoffMs);
  }
}

poll();

document.addEventListener("visibilitychange", () => {
  if (!document.hidden) scheduleNext(500);
});
