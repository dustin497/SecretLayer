(function () {
  if (!window.FTSAdmin || !FTSAdmin.requireAuth("../index.html")) return;

  const params = new URLSearchParams(window.location.search);
  const recordId = params.get("record");
  if (!recordId) return;

  function formatName(r) {
    const parts = [r.lastName, r.firstName];
    if (r.middleName) parts.push(r.middleName);
    if (r.lastName && r.firstName) {
      return r.lastName + ", " + r.firstName + (r.middleName ? " " + r.middleName : "");
    }
    return [r.firstName, r.middleName, r.lastName].filter(Boolean).join(" ");
  }

  function formatAddress(r) {
    const line1 = [r.address, r.address2].filter(Boolean).join(", ");
    const line2 = [r.city, r.state, r.zip].filter(Boolean).join(", ");
    return [line1, line2].filter(Boolean).join(" · ");
  }

  function fieldValue(record, key) {
    const map = {
      donorName: formatName(record),
      fullAddress: formatAddress(record),
      reportId: record.reportId,
      specimenId: record.specimenId,
      labAccessionNumber: record.labAccessionNumber || record.specimenId,
      firstName: record.firstName,
      middleName: record.middleName,
      lastName: record.lastName,
      dob: record.dobDisplay || record.dob,
      phone: record.phone,
      donorId: record.donorId,
      address: record.address,
      city: record.city,
      state: record.state,
      zip: record.zip,
      collectionDate: record.collectionDate,
      collectionTime: record.collectionTime,
      reportDate: record.reportDate,
      laboratory: record.laboratory,
      collector: record.collector,
      reasonForTest: record.reasonForTest,
      authorizedParty: record.authorizedParty,
    };
    return map[key] || record[key] || "";
  }

  function setBlank(el, value) {
    if (!value) return;
    el.textContent = value;
    el.classList.add("prefilled");
  }

  async function loadAndFill() {
    try {
      const res = await FTSAdmin.api("/api/admin/verify-records/" + encodeURIComponent(recordId));
      if (!res.ok) return;
      const data = await res.json();
      const record = data.record;
      if (!record) return;

      document.querySelectorAll("[data-field]").forEach(function (el) {
        const key = el.getAttribute("data-field");
        let value = fieldValue(record, key);
        if (el.classList.contains("doc-id")) {
          if (key === "reportId" && record.reportId) {
            value = "Report ID: " + record.reportId;
          } else if (key === "specimenId" && record.specimenId) {
            value = "Specimen ID: " + record.specimenId;
          }
        }
        setBlank(el, value);
      });

      document.title = (document.title.split("|")[0] || "Document") + "| " + record.reportId;

      window.addEventListener("afterprint", function markPrinted() {
        FTSAdmin.api("/api/admin/verify-records/" + encodeURIComponent(recordId) + "/printed", {
          method: "POST",
        }).catch(function () {});
        window.removeEventListener("afterprint", markPrinted);
      });
    } catch (_err) {
      /* blank form if record missing */
    }
  }

  loadAndFill();
})();
