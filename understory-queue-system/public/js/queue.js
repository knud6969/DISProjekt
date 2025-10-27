console.log("✅ queue.js er loadet");

async function fetchStatus() {
  const userId = localStorage.getItem("userId");
  if (!userId) {
    document.getElementById("queueInfo").textContent = "Ingen bruger fundet.";
    return;
  }

  const res = await fetch(`/queue/status/${userId}`);
  const data = await res.json();

  if (res.ok) {
    document.getElementById("queueInfo").textContent =
      `Du er nr. ${data.position} i køen (${data.ahead} foran dig). Estimeret ventetid: ${data.estTime}s`;
  } else {
    document.getElementById("queueInfo").textContent = "Fejl ved hentning af status.";
  }
}

fetchStatus();
setInterval(fetchStatus, 5000);
