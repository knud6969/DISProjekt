console.log("✅ admin.js loaded");

// Når siden er klar
window.addEventListener("DOMContentLoaded", () => {
  // Generér mock-data
  const stats = {
    queueLength: Math.floor(Math.random() * 80) + 20, // 20–100
    avgWait: Math.floor(Math.random() * 45) + 15, // 15–60 sek
    totalUsers: 200 + Math.floor(Math.random() * 500),
  };

  // Sæt værdierne i DOM
  const queueLen = document.getElementById("queueLen");
  const avgWait = document.getElementById("avgWait");
  const totalUsers = document.getElementById("totalUsers");

  if (queueLen && avgWait && totalUsers) {
    queueLen.textContent = stats.queueLength;
    avgWait.textContent = `${stats.avgWait} sek`;
    totalUsers.textContent = stats.totalUsers;
  }

  // SMS-knap: viser mock-statusbesked
  const sendBtn = document.getElementById("send-sms");
  const msg = document.getElementById("sms-msg");
  if (sendBtn && msg) {
    sendBtn.addEventListener("click", () => {
        sendBtn.addEventListener("click", async () => {
            try {
              const res = await fetch("/admin/send-sms", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(stats),
              });
          
              if (res.ok) {
                msg.textContent = "SMS sendt til administrator!";
              } else {
                msg.textContent = "Fejl ved SMS-afsendelse.";
              }
          
              setTimeout(() => (msg.textContent = ""), 5000);
            } catch (err) {
              console.error("Frontend SMS fejl:", err);
              msg.textContent = "Netværksfejl ved SMS-afsendelse.";
            }
          });
    });
  }

  console.log("Mock data indlæst:", stats);
});