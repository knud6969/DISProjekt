console.log("✅ admin.js loaded");

// Simuler visning af stats
document.addEventListener("DOMContentLoaded", () => {
  const stats = {
    queueLength: Math.floor(Math.random() * 50),
    avgWait: Math.floor(Math.random() * 60),
    totalUsers: 200 + Math.floor(Math.random() * 300),
  };

  document.getElementById("queueLen")?.textContent = stats.queueLength;
  document.getElementById("avgWait")?.textContent = stats.avgWait + " sek";
  document.getElementById("totalUsers")?.textContent = stats.totalUsers;
});