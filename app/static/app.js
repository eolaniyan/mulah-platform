function formatCurrency(value) {
    if (value === null || value === undefined || isNaN(value)) return "--";
    return new Intl.NumberFormat("en-IE", {
        style: "currency",
        currency: "EUR"
    }).format(value);
}

function formatPercent(value) {
    if (value === null || value === undefined || isNaN(value)) return "--";
    return `${value.toFixed(2)}%`;
}

async function fetchJson(url) {
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Request failed: ${url}`);
    }
    return response.json();
}

function renderSummary(summary, healthWrapper) {
    document.getElementById("incomeTotal").textContent = formatCurrency(summary.income_total);
    document.getElementById("expenseTotal").textContent = formatCurrency(summary.expense_total);
    document.getElementById("netCashflow").textContent = formatCurrency(summary.net_cashflow);
    document.getElementById("savingsRate").textContent = formatPercent(summary.savings_rate || 0);

    document.getElementById("mulahScore").textContent = healthWrapper.health?.mulah_score ?? "--";
    document.getElementById("riskLevel").textContent = healthWrapper.health?.risk_level ?? "--";
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

    container.innerHTML = entries.map(([category, amount]) => `
        <div class="stack-item">
            <span class="label">${category}</span>
            <span class="value">${formatCurrency(amount)}</span>
        </div>
    `).join("");
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

async function loadDashboard() {
    try {
        const [summary, healthWrapper, subscriptions, analysis] = await Promise.all([
            fetchJson("/insights/summary"),
            fetchJson("/insights/health-score"),
            fetchJson("/subscriptions/"),
            fetchJson("/subscriptions/analysis")
        ]);

        renderSummary(summary, healthWrapper);
        renderSubscriptions(subscriptions);
        renderCategoryBreakdown(summary.category_breakdown || {});
        renderAnalysis(analysis);
    } catch (error) {
        console.error(error);
        alert("Failed to load dashboard data. Make sure you uploaded the sample CSV and ran subscription detection.");
    }
}

document.getElementById("refreshBtn").addEventListener("click", loadDashboard);
window.addEventListener("DOMContentLoaded", loadDashboard);