document.addEventListener("DOMContentLoaded", () => {
    const params = new URLSearchParams(window.location.search);
    const err = params.get("error");
  
    if (err === "wrongpass") {
      const errorEl = document.getElementById("error-msg");
      if (errorEl) errorEl.textContent = "Forkert adgangskode";
    }
  });