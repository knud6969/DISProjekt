const joinBtn = document.getElementById("joinBtn");
const statusDiv = document.getElementById("status");

joinBtn.addEventListener("click", async () => {
  joinBtn.disabled = true;
  statusDiv.textContent = "Tilmeldes køen...";

  let userId;
  try {
    userId = crypto.randomUUID();
  } catch {
    userId = "user_" + Math.random().toString(36).substring(2, 9);
  }

  const res = await fetch("/queue/join", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId }),
  });

  const data = await res.json();
  if (res.ok) {
    localStorage.setItem("userId", userId);
    window.location.href = "/queue/status"; // redirect
  } else {
    statusDiv.textContent = "Fejl: " + (data.error || "Ukendt");
    joinBtn.disabled = false;
  }
});
