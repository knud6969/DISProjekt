// public/js/admin.js
console.log("admin.js loaded");

window.addEventListener("DOMContentLoaded", () => {
  const queueLenEl = document.getElementById("queueLen");
  const avgWaitEl = document.getElementById("avgWait");
  const totalUsersEl = document.getElementById("totalUsers");
  const sendBtn = document.getElementById("send-sms");
  const msgEl = document.getElementById("sms-msg");

  // Her gemmer vi seneste stats, så vi kan sende dem i SMS
  let currentStats = null;

  async function loadStats() {
    try {
      const res = await fetch("/admin/dashboard-data");
      if (!res.ok) throw new Error("HTTP " + res.status);
      const stats = await res.json();
      currentStats = stats;

      if (queueLenEl) queueLenEl.textContent = stats.queueLength ?? "–";
      if (avgWaitEl)
        avgWaitEl.textContent =
          stats.avgWait != null ? `${stats.avgWait} sek` : "–";
      if (totalUsersEl) totalUsersEl.textContent = stats.totalUsers ?? "–";

      console.log("Dashboard stats:", stats);
    } catch (err) {
      console.error("Kunne ikke hente dashboard-data:", err);
      if (msgEl) msgEl.textContent = "Kunne ikke hente dashboard-data.";
      setTimeout(() => (msgEl.textContent = ""), 5000);
    }
  }

  // Hent stats når siden loader
  loadStats();

  // SMS-knap: send de nuværende stats til backend
  if (sendBtn && msgEl) {
    sendBtn.addEventListener("click", async () => {
      try {
        const payload = currentStats || {};

        const res = await fetch("/admin/send-sms", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (res.ok) {
          msgEl.textContent = "SMS sendt til administrator!";
        } else {
          msgEl.textContent = "Fejl ved SMS-afsendelse.";
        }

        setTimeout(() => (msgEl.textContent = ""), 5000);
      } catch (err) {
        console.error("Frontend SMS fejl:", err);
        msgEl.textContent = "Netværksfejl ved SMS-afsendelse.";
        setTimeout(() => (msgEl.textContent = ""), 5000);
      }
    });
  }
});