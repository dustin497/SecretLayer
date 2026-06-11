(function () {
  if (!FTSAdmin.requireAuth("index.html")) return;

  const form = document.getElementById("record-form");
  const formError = document.getElementById("form-error");
  const createdBanner = document.getElementById("created-banner");
  const loadStatus = document.getElementById("load-status");
  const tableWrap = document.getElementById("table-wrap");
  const recordRows = document.getElementById("record-rows");

  async function loadRecords() {
    try {
      const res = await FTSAdmin.api("/api/admin/verify-records");
      const data = await res.json();
      renderTable(data.records || []);
    } catch (_err) {
      loadStatus.textContent = "Could not load records. Refresh the page.";
    }
  }

  function renderTable(records) {
    if (!records.length) {
      loadStatus.textContent = "No records yet. Create one above before printing forms.";
      tableWrap.hidden = true;
      return;
    }
    loadStatus.hidden = true;
    tableWrap.hidden = false;
    recordRows.innerHTML = records
      .map(function (r) {
        return (
          "<tr>" +
          "<td><code>" + esc(r.reportId) + "</code></td>" +
          "<td>" + esc(r.firstName) + " " + esc(r.lastName) + "</td>" +
          "<td>" + esc(r.collectionDate) + "</td>" +
          "<td>" + esc(r.testTypeLabel || r.testType) + "</td>" +
          "<td>" + esc(r.result) + "</td>" +
          "</tr>"
        );
      })
      .join("");
  }

  form.addEventListener("submit", async function (e) {
    e.preventDefault();
    formError.classList.remove("show");
    formError.textContent = "";
    createdBanner.hidden = true;

    const payload = {
      firstName: document.getElementById("firstName").value.trim(),
      lastName: document.getElementById("lastName").value.trim(),
      dob: document.getElementById("dob").value.trim(),
      collectionDate: document.getElementById("collectionDate").value.trim(),
      testType: document.getElementById("testType").value,
      result: document.getElementById("result").value,
      authorizedParty: document.getElementById("authorizedParty").value.trim(),
      notes: document.getElementById("notes").value.trim(),
    };

    try {
      const res = await FTSAdmin.api("/api/admin/verify-records", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Save failed");
      }
      const data = await res.json();
      document.getElementById("new-report-id").textContent = data.record.reportId;
      document.getElementById("new-specimen-id").textContent = data.record.specimenId;
      createdBanner.hidden = false;
      form.reset();
      loadRecords();
    } catch (err) {
      formError.textContent = err.message || "Could not save record.";
      formError.classList.add("show");
    }
  });

  document.querySelectorAll(".copy-btn").forEach(function (btn) {
    btn.addEventListener("click", function () {
      const id = btn.getAttribute("data-copy");
      const text = document.getElementById(id).textContent;
      navigator.clipboard.writeText(text).then(function () {
        btn.textContent = "Copied!";
        setTimeout(function () {
          btn.textContent = "Copy";
        }, 1500);
      });
    });
  });

  function esc(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  loadRecords();
})();
