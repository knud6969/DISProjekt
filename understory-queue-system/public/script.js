const joinBtn = document.getElementById("joinBtn");
const statusDiv = document.getElementById("status");

joinBtn.addEventListener("click", async () => {
  statusDiv.textContent = "Tilmeldes køen...";
  joinBtn.disabled = true;

  try {
    const res = await fetch("/queue/join", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: crypto.randomUUID() }),
    });
    if (!res.ok) throw new Error("Fejl ved tilmelding");

    const data = await res.json();
    statusDiv.textContent = `Du er nu i køen. Din plads: ${data.position}`;
  } catch (err) {
    statusDiv.textContent = "Der opstod en fejl. Prøv igen.";
    console.error(err);
  }
});
