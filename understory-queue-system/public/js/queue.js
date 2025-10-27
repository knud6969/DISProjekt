async function fetchStatus() {
  const userId = localStorage.getItem("userId");
  if (!userId) return;

  const res = await fetch(`/queue/status/${userId}`);
  const data = await res.json();

  if (res.ok) {
    const info = document.getElementById("queueInfo");

    if (data.ahead <= 0) {
      info.textContent = "🎉 Du er nu igennem køen! Sender dig videre...";
      // Vent et sekund og redirect til Understory
      setTimeout(() => {
        window.location.href = "https://understory.dk";
      }, 1500);
      return;
    }

    info.textContent = `Du er nr. ${data.position} i køen (${data.ahead} foran dig). 
      Estimeret ventetid: ${data.estTime}s`;
  } else {
    console.error("Kunne ikke hente køstatus:", data.error);
  }
}

fetchStatus();
setInterval(fetchStatus, 5000);
