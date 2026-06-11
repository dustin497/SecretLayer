(function () {
  const form = document.getElementById("verify-form");
  const resultEl = document.getElementById("verify-result");

  function showResult(html, type) {
    resultEl.hidden = false;
    resultEl.className = "verify-result " + type;
    resultEl.innerHTML = html;
    resultEl.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  form.addEventListener("submit", async function (e) {
    e.preventDefault();
    const reportId = document.getElementById("reportId").value.trim();
    const lastName = document.getElementById("lastName").value.trim();
    const dob = document.getElementById("dob").value.trim();

    if (!reportId || !lastName || !dob) {
      showResult("<strong>Missing information</strong><p>Please enter Report ID, last name, and date of birth.</p>", "fail");
      return;
    }

    const btn = form.querySelector(".verify-submit");
    btn.disabled = true;
    btn.textContent = "Checking…";

    try {
      const res = await fetch("/api/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reportId, lastName, dob }),
      });
      const data = await res.json();

      if (data.verified) {
        showResult(
          "<strong>Record verified</strong>" +
            "<p>" + data.message + "</p>" +
            "<dl>" +
            "<dt>Report ID</dt><dd>" + escapeHtml(data.reportId) + "</dd>" +
            "<dt>Specimen ID</dt><dd>" + escapeHtml(data.specimenId) + "</dd>" +
            "<dt>Collection date</dt><dd>" + escapeHtml(data.collectionDate) + "</dd>" +
            "<dt>Test type</dt><dd>" + escapeHtml(data.testType) + "</dd>" +
            "</dl>",
          "success"
        );
      } else {
        showResult("<strong>Could not verify</strong><p>" + escapeHtml(data.message) + "</p>", "fail");
      }
    } catch (_err) {
      showResult(
        "<strong>Unable to check right now</strong><p>Please call (205) 579-0707 with your Report ID during business hours.</p>",
        "fail"
      );
    } finally {
      btn.disabled = false;
      btn.textContent = "Verify Record";
    }
  });

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }
})();
