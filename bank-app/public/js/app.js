const state = {
  token: localStorage.getItem("cloudbank_token"),
  user: null,
  accounts: [],
};

const $ = (sel) => document.querySelector(sel);

function formatMoney(value) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(Number(value));
}

function formatDate(iso) {
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function txLabel(type) {
  return {
    deposit: "Deposit",
    withdrawal: "Withdrawal",
    transfer_in: "Transfer in",
    transfer_out: "Transfer out",
  }[type] || type;
}

function showError(el, message) {
  el.textContent = message;
  el.classList.remove("hidden");
}

function hideError(el) {
  el.textContent = "";
  el.classList.add("hidden");
}

async function api(path, options = {}) {
  const headers = { "Content-Type": "application/json", ...(options.headers || {}) };
  if (state.token) headers.Authorization = `Bearer ${state.token}`;
  const res = await fetch(path, { ...options, headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Request failed");
  return data;
}

function showScreen(name) {
  $("#auth-screen").classList.toggle("hidden", name !== "auth");
  $("#dashboard-screen").classList.toggle("hidden", name !== "dashboard");
}

function setAuthTab(tab) {
  document.querySelectorAll(".tab").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.tab === tab);
  });
  $("#login-form").classList.toggle("hidden", tab !== "login");
  $("#register-form").classList.toggle("hidden", tab !== "register");
  hideError($("#auth-error"));
}

document.querySelectorAll(".tab").forEach((btn) => {
  btn.addEventListener("click", () => setAuthTab(btn.dataset.tab));
});

$("#login-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  hideError($("#auth-error"));
  const form = new FormData(e.target);
  try {
    const data = await api("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({
        email: form.get("email"),
        password: form.get("password"),
      }),
    });
    state.token = data.token;
    state.user = data.user;
    localStorage.setItem("cloudbank_token", data.token);
    await loadDashboard();
    showScreen("dashboard");
  } catch (err) {
    showError($("#auth-error"), err.message);
  }
});

$("#register-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  hideError($("#auth-error"));
  const form = new FormData(e.target);
  try {
    const data = await api("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({
        fullName: form.get("fullName"),
        email: form.get("email"),
        password: form.get("password"),
      }),
    });
    state.token = data.token;
    state.user = data.user;
    localStorage.setItem("cloudbank_token", data.token);
    await loadDashboard();
    showScreen("dashboard");
  } catch (err) {
    showError($("#auth-error"), err.message);
  }
});

$("#logout-btn").addEventListener("click", async () => {
  try {
    await api("/api/auth/logout", { method: "POST" });
  } catch {
    /* ignore */
  }
  state.token = null;
  state.user = null;
  localStorage.removeItem("cloudbank_token");
  showScreen("auth");
});

$("#action-type").addEventListener("change", (e) => {
  const isTransfer = e.target.value === "transfer";
  $("#transfer-target-wrap").classList.toggle("hidden", !isTransfer);
});

function renderAccounts(accounts) {
  const list = $("#accounts-list");
  list.innerHTML = accounts
    .map(
      (a) => `
      <div class="account-card">
        <div class="type">${a.type}</div>
        <div class="number">•••• ${String(a.account_number).slice(-4)}</div>
        <div class="balance">${formatMoney(a.balance)}</div>
      </div>`,
    )
    .join("");

  const select = $("#action-account");
  const transferSelect = $("#transfer-target");
  select.innerHTML = accounts
    .map((a) => `<option value="${a.id}">${a.type} (•••• ${String(a.account_number).slice(-4)})</option>`)
    .join("");
  transferSelect.innerHTML = accounts
    .map((a) => `<option value="${a.id}">${a.type} (•••• ${String(a.account_number).slice(-4)})</option>`)
    .join("");
}

function renderTransactions(transactions) {
  const body = $("#transactions-body");
  if (!transactions.length) {
    body.innerHTML = `<tr><td colspan="6" style="color: var(--text-muted)">No transactions yet.</td></tr>`;
    return;
  }
  body.innerHTML = transactions
    .map((tx) => {
      const isCredit = tx.type === "deposit" || tx.type === "transfer_in";
      const sign = isCredit ? "+" : "−";
      return `
      <tr>
        <td>${formatDate(tx.created_at)}</td>
        <td style="text-transform: capitalize">${tx.account_type}</td>
        <td>${txLabel(tx.type)}</td>
        <td>${tx.description}</td>
        <td class="num ${isCredit ? "tx-positive" : "tx-negative"}">${sign}${formatMoney(tx.amount)}</td>
        <td class="num">${formatMoney(tx.balance_after)}</td>
      </tr>`;
    })
    .join("");
}

async function loadDashboard() {
  const data = await api("/api/dashboard");
  if (!state.user) {
    const me = await api("/api/me");
    state.user = me.user;
  }
  state.accounts = data.accounts;
  $("#user-greeting").textContent = state.user?.fullName || state.user?.email || "";
  $("#total-balance").textContent = formatMoney(data.totalBalance);
  renderAccounts(data.accounts);
  renderTransactions(data.recentTransactions);
}

$("#action-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  hideError($("#action-error"));
  hideError($("#action-success"));

  const accountId = $("#action-account").value;
  const actionType = $("#action-type").value;
  const amount = $("#action-amount").value;
  const description = $("#action-description").value;

  try {
    if (actionType === "transfer") {
      await api("/api/transfers", {
        method: "POST",
        body: JSON.stringify({
          fromAccountId: accountId,
          toAccountId: $("#transfer-target").value,
          amount,
          description,
        }),
      });
      showError($("#action-success"), "Transfer completed successfully.");
      $("#action-success").classList.remove("hidden");
      $("#action-success").classList.remove("error");
    } else {
      await api(`/api/accounts/${accountId}/${actionType}`, {
        method: "POST",
        body: JSON.stringify({ amount, description }),
      });
      showError($("#action-success"), `${actionType === "deposit" ? "Deposit" : "Withdrawal"} completed.`);
      $("#action-success").classList.remove("hidden");
      $("#action-success").classList.remove("error");
    }
    e.target.reset();
    $("#action-type").value = actionType;
    await loadDashboard();
  } catch (err) {
    showError($("#action-error"), err.message);
  }
});

async function init() {
  if (state.token) {
    try {
      await loadDashboard();
      showScreen("dashboard");
      return;
    } catch {
      localStorage.removeItem("cloudbank_token");
      state.token = null;
    }
  }
  showScreen("auth");
}

init();
