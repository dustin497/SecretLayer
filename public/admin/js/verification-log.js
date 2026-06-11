(function () {
  if (!FTSAdmin.requireAuth("index.html")) return;

  const form = document.getElementById("record-form");
  const formError = document.getElementById("form-error");
  const createdBanner = document.getElementById("created-banner");
  const loadStatus = document.getElementById("load-status");
  const tableWrap = document.getElementById("table-wrap");
  const recordRows = document.getElementById("record-rows");

  const DOC_URLS = {
    "nail-14": "documents/test-results-negative.html",
    "urine-12": "documents/test-results-urine-12panel-negative.html",
    "custody-only": "documents/proof-of-testing.html",
  };

  function todayUs() {
    const d = new Date();
    return (
      String(d.getMonth() + 1).padStart(2, "0") +
      "/" +
      String(d.getDate()).padStart(2, "0") +
      "/" +
      d.getFullYear()
    );
  }

  function printUrl(record) {
    const base = DOC_URLS[record.testType] || DOC_URLS["urine-12"];
    return base + "?record=" + encodeURIComponent(record.id);
  }

  function negativePrintUrl(record) {
    if (record.testType === "nail-14") return DOC_URLS["nail-14"] + "?record=" + encodeURIComponent(record.id);
    if (record.testType === "urine-12") return DOC_URLS["urine-12"] + "?record=" + encodeURIComponent(record.id);
    return DOC_URLS["urine-12"] + "?record=" + encodeURIComponent(record.id);
  }

  function setDefaultDates() {
    const today = todayUs();
    if (!document.getElementById("collectionDate").value) {
      document.getElementById("collectionDate").value = today;
    }
    if (!document.getElementById("reportDate").value) {
      document.getElementById("reportDate").value = today;
    }
  }

  function showCreated(record) {
    document.getElementById("new-report-id").textContent = record.reportId;
    document.getElementById("new-specimen-id").textContent = record.specimenId;
    document.getElementById("new-lab-id").textContent = record.labAccessionNumber || "—";

    const printBtn = document.getElementById("print-negative-btn");
    const custodyBtn = document.getElementById("print-custody-btn");

    if (record.testType === "custody-only") {
      printBtn.hidden = true;
      custodyBtn.hidden = false;
      custodyBtn.href = printUrl(record);
    } else {
      printBtn.hidden = false;
      custodyBtn.hidden = true;
      printBtn.href = negativePrintUrl(record);
      printBtn.textContent =
        record.testType === "nail-14"
          ? "Print Pre-Filled Nail Negative Report →"
          : "Print Pre-Filled Urine Negative Report →";
    }

    createdBanner.hidden = false;
    createdBanner.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

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
      loadStatus.textContent = "No records yet. Enter donor info above to generate lab numbers and print.";
      tableWrap.hidden = true;
      return;
    }
    loadStatus.hidden = true;
    tableWrap.hidden = false;
    recordRows.innerHTML = records
      .map(function (r) {
        const printed = r.printCount
          ? "Yes (" + r.printCount + "×)"
          : '<span class="muted">Not yet</span>';
        const printLabel =
          r.testType === "nail-14"
            ? "Print Nail"
            : r.testType === "urine-12"
              ? "Print Urine"
              : "Print COC";
        return (
          "<tr>" +
          "<td><code>" + esc(r.reportId) + "</code></td>" +
          "<td>" + esc(r.lastName) + ", " + esc(r.firstName) + "</td>" +
          "<td>" + esc(r.collectionDate) + "</td>" +
          "<td>" + esc(r.testTypeLabel || r.testType) + "</td>" +
          "<td>" + printed + "</td>" +
          '<td><a class="table-print-btn" href="' + esc(printUrl(r)) + '" target="_blank" rel="noopener">' + printLabel + "</a></td>" +
          "</tr>"
        );
      })
      .join("");
  }

  function collectPayload() {
    return {
      firstName: document.getElementById("firstName").value.trim(),
      middleName: document.getElementById("middleName").value.trim(),
      lastName: document.getElementById("lastName").value.trim(),
      dob: document.getElementById("dob").value.trim(),
      donorId: document.getElementById("donorId").value.trim(),
      phone: document.getElementById("phone").value.trim(),
      address: document.getElementById("address").value.trim(),
      city: document.getElementById("city").value.trim(),
      state: document.getElementById("state").value.trim(),
      zip: document.getElementById("zip").value.trim(),
      collectionDate: document.getElementById("collectionDate").value.trim(),
      collectionTime: document.getElementById("collectionTime").value.trim(),
      reportDate: document.getElementById("reportDate").value.trim(),
      testType: document.getElementById("testType").value,
      result: document.getElementById("result").value,
      laboratory: document.getElementById("laboratory").value.trim(),
      collector: document.getElementById("collector").value.trim(),
      reasonForTest: document.getElementById("reasonForTest").value.trim(),
      authorizedParty: document.getElementById("authorizedParty").value.trim(),
      notes: document.getElementById("notes").value.trim(),
    };
  }

  form.addEventListener("submit", async function (e) {
    e.preventDefault();
    formError.classList.remove("show");
    formError.textContent = "";
    createdBanner.hidden = true;

    try {
      const res = await FTSAdmin.api("/api/admin/verify-records", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(collectPayload()),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Save failed");
      }
      const data = await res.json();
      showCreated(data.record);
      setDefaultDates();
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
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  setDefaultDates();
  loadRecords();
})();
