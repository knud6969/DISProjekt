const joinBtn = document.getElementById("joinBtn");
const statusDiv = document.getElementById("status");

joinBtn.addEventListener("click", async () => {
  statusDiv.textContent = "Tilmeldes køen...";
  joinBtn.disabled = true;

  // Generer et tilfældigt ID (fallback hvis crypto ikke findes)
  let userId;
  try {
    userId = crypto.randomUUID();
  } catch {
    userId = "user_" + Math.random().toString(36).substring(2, 9);
  }

  try {
    const res = await fetch("/queue/join", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });

    const data = await res.json();

    if (!res.ok) {
      console.error("Server fejl:", data);
      statusDiv.textContent = data.errors
        ? data.errors.map(e => e.msg).join(", ")
        : "Der opstod en fejl. Prøv igen.";
      joinBtn.disabled = false;
      return;
    }

    statusDiv.textContent = `✅ Du er nu i køen! Din plads: ${data.position}`;
    console.log("User added:", data);
  } catch (err) {
    console.error("Network error:", err);
    statusDiv.textContent = "Der opstod en netværksfejl. Prøv igen.";
    joinBtn.disabled = false;
  }
});
