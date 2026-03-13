function formatCurrency(value) {
    if (value === null || value === undefined || isNaN(value)) return "--";
    return new Intl.NumberFormat("en-IE", {
        style: "currency",
        currency: "EUR"
    }).format(value);
}

function formatPercent(value) {
    if (value === null || value === undefined || isNaN(value)) return "--";
    return `${Number(value).toFixed(2)}%`;
}

async function fetchJson(url, options = {}) {
    const response = await fetch(url, options);
    if (!response.ok) {
        const text = await response.text();
        throw new Error(`Request failed: ${url} :: ${text}`);
    }
    return response.json();
}

async function runDetection() {
    await fetchJson("/subscriptions/detect", { method: "POST" });
}

async function loadFullReport() {
    return fetchJson("/insights/full-report");
}

function renderSummary(report) {
    const summary = report.summary;
    const health = report.health;
    const usw = report.usw_summary;

    document.getElementById("incomeTotal").textContent = formatCurrency(summary.income_total);
    document.getElementById("expenseTotal").textContent = formatCurrency(summary.expense_total);
    document.getElementById("netCashflow").textContent = formatCurrency(summary.net_cashflow);
    document.getElementById("savingsRate").textContent = formatPercent(summary.savings_rate || 0);

    document.getElementById("mulahScore").textContent = health.mulah_score ?? "--";
    document.getElementById("riskLevel").textContent = health.risk_level ?? "--";

    document.getElementById("uswSubscriptionsTotal").textContent = formatCurrency(usw.subscription_total_monthly);
    document.getElementById("uswBillsTotal").textContent = formatCurrency(usw.bill_total_monthly);
    document.getElementById("uswUsageTotal").textContent = formatCurrency(usw.usage_total_monthly);
    document.getElementById("uswAnnualTotal").textContent = formatCurrency(usw.annual_recurring_total);
}

function renderSubscriptions(subscriptions) {
    const tbody = document.getElementById("subscriptionsTable");

    if (!subscriptions.length) {
        tbody.innerHTML = `<tr><td colspan="5">No subscriptions detected yet</td></tr>`;
        return;
    }

    tbody.innerHTML = subscriptions.map(sub => `
        <tr>
            <td>${sub.merchant}</td>
            <td>${formatCurrency(sub.average_amount)}</td>
            <td>${sub.billing_cycle_days} days</td>
            <td>${sub.next_billing_date ?? "--"}</td>
            <td>${sub.status}</td>
        </tr>
    `).join("");
}

function renderCategoryBreakdown(categoryBreakdown) {
    const container = document.getElementById("categoryBreakdown");
    const entries = Object.entries(categoryBreakdown || {});

    if (!entries.length) {
        container.innerHTML = `<div class="empty">No category data yet</div>`;
        return;
    }

    const maxValue = Math.max(...entries.map(([, amount]) => amount), 1);

    container.innerHTML = entries.map(([category, amount]) => {
        const width = Math.max(8, Math.round((amount / maxValue) * 100));
        return `
            <div class="bar-item">
                <div class="bar-head">
                    <span>${category}</span>
                    <span>${formatCurrency(amount)}</span>
                </div>
                <div class="bar-track">
                    <div class="bar-fill" style="width:${width}%"></div>
                </div>
            </div>
        `;
    }).join("");
}

function renderAnalysis(analysis) {
    const tbody = document.getElementById("analysisTable");
    const patterns = analysis.patterns || [];

    if (!patterns.length) {
        tbody.innerHTML = `<tr><td colspan="6">No recurring patterns detected yet</td></tr>`;
        return;
    }

    tbody.innerHTML = patterns.map(item => `
        <tr>
            <td>${item.merchant}</td>
            <td>${item.classification}</td>
            <td>${formatCurrency(item.avg_amount)}</td>
            <td>${item.avg_interval_days ?? "--"} days</td>
            <td>${item.recurring_confidence}</td>
            <td>${item.classification_confidence}</td>
        </tr>
    `).join("");
}

function renderForecast(forecast) {
    document.getElementById("forecastTotal").textContent = formatCurrency(forecast.projected_outflow_total || 0);
    document.getElementById("forecastSubscriptions").textContent = formatCurrency((forecast.projected_outflow_by_type || {}).subscription || 0);
    document.getElementById("forecastBills").textContent = formatCurrency((forecast.projected_outflow_by_type || {}).bill || 0);
    document.getElementById("forecastUsage").textContent = formatCurrency((forecast.projected_outflow_by_type || {}).usage_based_recurring || 0);

    const tbody = document.getElementById("forecastTable");
    const items = forecast.upcoming_items || [];

    if (!items.length) {
        tbody.innerHTML = `<tr><td colspan="4">No forecast data yet</td></tr>`;
        return;
    }

    tbody.innerHTML = items.map(item => `
        <tr>
            <td>${item.expected_date}</td>
            <td>${item.merchant}</td>
            <td>${item.classification}</td>
            <td>${formatCurrency(item.amount)}</td>
        </tr>
    `).join("");
}

function renderChanges(changes) {
    const meta = document.getElementById("changeMeta");
    meta.textContent = changes.latest_month && changes.previous_month
        ? `Comparing ${changes.latest_month} vs ${changes.previous_month}`
        : `Not enough monthly data yet`;

    const tbody = document.getElementById("changesTable");
    const rows = changes.month_over_month || [];

    if (!rows.length) {
        tbody.innerHTML = `<tr><td colspan="4">No change data yet</td></tr>`;
        return;
    }

    tbody.innerHTML = rows.map(row => `
        <tr>
            <td>${row.category}</td>
            <td>${formatCurrency(row.latest_value)}</td>
            <td>${formatCurrency(row.previous_value)}</td>
            <td>${row.pct_change === null ? "--" : formatPercent(row.pct_change)}</td>
        </tr>
    `).join("");
}

function renderAnomalies(anomalies) {
    const container = document.getElementById("anomalyFlags");
    const flags = anomalies.flags || [];

    if (!flags.length) {
        container.innerHTML = `<div class="empty">No anomalies detected</div>`;
        return;
    }

    container.innerHTML = flags.map(flag => `
        <div class="stack-item warning">
            <div class="label">${flag.title}</div>
            <div class="value">${flag.message}</div>
        </div>
    `).join("");
}

function renderCards(cards) {
    const diagnosis = document.getElementById("diagnosisCards");
    const warnings = document.getElementById("warningsList");
    const recommendations = document.getElementById("recommendationsList");

    diagnosis.innerHTML = (cards.diagnosis || []).length
        ? cards.diagnosis.map(item => `
            <div class="stack-item info">
                <div class="label">${item.title}</div>
                <div class="value">${item.message}</div>
            </div>
        `).join("")
        : `<div class="empty">No diagnosis yet</div>`;

    warnings.innerHTML = (cards.warnings || []).length
        ? cards.warnings.map(item => `
            <div class="stack-item warning">
                <div class="label">Warning</div>
                <div class="value">${item}</div>
            </div>
        `).join("")
        : `<div class="empty">No warnings</div>`;

    recommendations.innerHTML = (cards.recommendations || []).length
        ? cards.recommendations.map(item => `
            <div class="stack-item recommendation">
                <div class="label">Recommendation</div>
                <div class="value">${item}</div>
            </div>
        `).join("")
        : `<div class="empty">No recommendations yet</div>`;
}

async function refreshDashboard() {
    const [report, subscriptions] = await Promise.all([
        loadFullReport(),
        fetchJson("/subscriptions/")
    ]);

    renderSummary(report);
    renderSubscriptions(subscriptions);
    renderCategoryBreakdown(report.summary.category_breakdown || {});
    renderAnalysis(report.analysis);
    renderForecast(report.forecast);
    renderChanges(report.changes);
    renderAnomalies(report.anomalies);
    renderCards(report.cards);
}

async function uploadCsvAndRun() {
    const fileInput = document.getElementById("csvFile");
    const file = fileInput.files[0];

    if (!file) {
        alert("Choose a CSV file first.");
        return;
    }

    const formData = new FormData();
    formData.append("file", file);

    await fetchJson("/transactions/upload", {
        method: "POST",
        body: formData,
    });

    await runDetection();
    await refreshDashboard();
    alert("CSV uploaded and analysis refreshed.");
}

async function loadScenario(scenario) {
    await fetchJson(`/demo/load-scenario/${scenario}`, { method: "POST" });
    await runDetection();
    await refreshDashboard();
}

async function resetAll() {
    await fetchJson("/demo/reset", { method: "POST" });
    await refreshDashboard();
}

document.getElementById("refreshBtn").addEventListener("click", async () => {
    try {
        await refreshDashboard();
    } catch (error) {
        console.error(error);
        alert("Refresh failed.");
    }
});

document.getElementById("uploadBtn").addEventListener("click", async () => {
    try {
        await uploadCsvAndRun();
    } catch (error) {
        console.error(error);
        alert("Upload failed. Check the CSV format and try again.");
    }
});

document.getElementById("resetBtn").addEventListener("click", async () => {
    try {
        await resetAll();
    } catch (error) {
        console.error(error);
        alert("Reset failed.");
    }
});

document.querySelectorAll(".scenarioBtn").forEach(btn => {
    btn.addEventListener("click", async () => {
        try {
            await loadScenario(btn.dataset.scenario);
        } catch (error) {
            console.error(error);
            alert(`Failed to load scenario: ${btn.dataset.scenario}`);
        }
    });
});

window.addEventListener("DOMContentLoaded", async () => {
    try {
        await refreshDashboard();
    } catch (error) {
        console.error(error);
    }
});