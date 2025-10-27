async function fetchStatus() {
  const userId = localStorage.getItem("userId");
  if (!userId) return;

  const res = await fetch(`/queue/status/${userId}`);
  const data = await res.json();

  if (res.ok) {
    if (data.ahead <= 0) {
      console.log("🎉 Du er igennem køen!");
      window.location.href = "https://understory.dk"; // eller dynamisk
      return;
    }

    document.getElementById("queueInfo").textContent =
      `Du er nr. ${data.position} i køen (${data.ahead} foran dig). 
      Estimeret ventetid: ${data.estTime}s`;
  } else {
    document.getElementById("queueInfo").textContent = "Fejl ved hentning af status.";
  }
}

fetchStatus();
setInterval(fetchStatus, 5000);
