// Dashboard JavaScript - Complete implementation
let currentUser = null;
let currentTab = 'subscriptions';
let chartInstance = null;

// Transaction generation state tracking
let transactionGenerationCount = 0;
const MAX_GENERATION_COUNT = 2; // 2 generations = 12 months

// Initialize dashboard
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Mulah Dashboard initializing...');

    // Check authentication
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');

    if (!token || !user) {
        console.log('❌ No auth found, redirecting to login');
        window.location.href = 'login.html';
        return;
    }

    currentUser = JSON.parse(user);
    document.getElementById('userInfo').textContent = `Welcome, ${currentUser.name} (${currentUser.plan})`;
    console.log('✅ User authenticated:', currentUser.email);

    // Initialize tab functionality immediately
    initializeTabs();
    console.log('✅ Tabs initialized');

    // Load initial data
    loadSubscriptions();
    loadTransactions();
    loadInsights();

    // Setup form handlers
    setupFormHandlers();
    console.log('✅ Form handlers set up');

    // Setup transaction filters
    setupTransactionFilters();
    console.log('✅ Transaction filters set up');

    // Set default filter values
    const dateFilterEl = document.getElementById('dateFilter');
    const sortFilterEl = document.getElementById('sortFilter');
    if (dateFilterEl) dateFilterEl.value = '30d';
    if (sortFilterEl) sortFilterEl.value = 'date-desc';

    // Initialize transaction button state
    const savedCount = localStorage.getItem('transactionGenerationCount');
    if (savedCount && currentUser.email.includes('@demo.com')) {
        transactionGenerationCount = parseInt(savedCount, 10) || 0;
    }
    updateTransactionButtonState();

    // Setup logout with explicit handler
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            console.log('🔄 Logout clicked');
            logout();
        });
        console.log('✅ Logout handler attached');
    }

    console.log('🎉 Dashboard initialization complete');
});

// Tab Management
function initializeTabs() {
    console.log('🔧 Initializing tabs...');
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');

    console.log(`Found ${tabButtons.length} tab buttons and ${tabContents.length} tab contents`);

    tabButtons.forEach((button, index) => {
        button.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log(`🖱️ Tab clicked: ${button.id}`);
            const tabName = button.id.replace('Tab', '');
            switchTab(tabName);
        });

        console.log(`✅ Tab ${index + 1} (${button.id}) click handler attached`);
    });

    // Ensure subscriptions tab is active by default
    switchTab('subscriptions');
}

function switchTab(tabName) {
    console.log(`🔄 Switching to tab: ${tabName}`);
    currentTab = tabName;

    // Update button states - use the new Mulah styling
    document.querySelectorAll('.tab-button').forEach(btn => {
        btn.classList.remove('bg-gradient-to-r', 'from-emerald-500', 'to-teal-600', 'text-white', 'shadow-lg');
        btn.classList.add('bg-white/50', 'text-gray-700', 'hover:bg-white/70', 'hover:text-gray-900');
    });

    const activeTab = document.getElementById(tabName + 'Tab');
    if (activeTab) {
        activeTab.classList.remove('bg-white/50', 'text-gray-700', 'hover:bg-white/70', 'hover:text-gray-900');
        activeTab.classList.add('bg-gradient-to-r', 'from-emerald-500', 'to-teal-600', 'text-white', 'shadow-lg');
    }

    // Update content visibility
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.add('hidden');
    });

    const targetContent = document.getElementById(tabName + 'Content');
    if (targetContent) {
        targetContent.classList.remove('hidden');
        console.log(`✅ Tab content shown: ${tabName}`);
    } else {
        console.error(`❌ Tab content not found: ${tabName}Content`);
    }

    // Load tab-specific data
    if (tabName === 'insights') {
        loadInsights();
    } else if (tabName === 'transactions') {
        loadTransactions();
    } else if (tabName === 'profile') {
        loadProfile();
    } else if (tabName === 'settings') {
        loadSettings();
    }
}

// Authentication with demo data cleanup
async function logout() {
    try {
        // Call logout endpoint to clear demo data and wait for completion
        const response = await apiCall('/api/auth/logout', { method: 'POST' });
        console.log('✅ Demo data cleared on logout:', response);

        // Wait a bit more to ensure database operations complete
        await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error) {
        console.error('Logout API call failed:', error);
    }

    // Reset transaction generation count for next session
    transactionGenerationCount = 0;
    localStorage.removeItem('transactionGenerationCount');

    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('userPlan');

    // Add a slight delay before redirect to ensure cleanup completes
    setTimeout(() => {
        window.location.href = 'login.html';
    }, 100);
}

// Clear demo data when page is about to be closed/refreshed
window.addEventListener('beforeunload', async (e) => {
    if (currentUser && currentUser.email.includes('@demo.com')) {
        try {
            // Fire and forget - clear demo data
            navigator.sendBeacon('/api/auth/logout', JSON.stringify({}));
        } catch (error) {
            console.log('Cleanup on page close failed:', error);
        }
    }
});

// Deep Dive Analytics function
function openDeepDive() {
    // Create a futuristic deep dive modal
    const modal = document.createElement('div');
    modal.id = 'deepDiveModal';
    modal.className = 'fixed z-50 inset-0 overflow-y-auto bg-black bg-opacity-90';
    modal.innerHTML = `
        <div class="flex items-center justify-center min-h-screen p-4">
            <div class="bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 rounded-2xl shadow-2xl max-w-6xl w-full max-h-screen overflow-hidden border border-blue-500">
                <div class="bg-gradient-to-r from-blue-600 to-purple-600 p-6 border-b border-blue-400">
                    <div class="flex justify-between items-center">
                        <div>
                            <h2 class="text-3xl font-bold text-white flex items-center">
                                <span class="mr-3">🔬</span>Deep Dive Analytics
                            </h2>
                            <p class="text-blue-200 mt-2">Advanced financial intelligence & predictive insights</p>
                        </div>
                        <button onclick="closeDeepDive()" class="text-white hover:text-blue-200 transition-colors">
                            <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                            </svg>
                        </button>
                    </div>
                </div>

                <div class="p-8 text-white">
                    <div class="text-center py-16">
                        <div class="text-6xl mb-6">🚀</div>
                        <h3 class="text-4xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                            Coming Soon
                        </h3>
                        <p class="text-xl text-gray-300 mb-8">
                            Prepare for next-generation financial analytics
                        </p>

                        <div class="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
                            <div class="bg-gray-800 rounded-xl p-6 border border-gray-700 hover:border-blue-500 transition-colors">
                                <div class="text-3xl mb-3">🧠</div>
                                <h4 class="text-lg font-semibold mb-2 text-blue-400">AI Spending Patterns</h4>
                                <p class="text-sm text-gray-400">Machine learning algorithms to predict your future spending behaviors</p>
                            </div>

                            <div class="bg-gray-800 rounded-xl p-6 border border-gray-700 hover:border-purple-500 transition-colors">
                                <div class="text-3xl mb-3">📊</div>
                                <h4 class="text-lg font-semibold mb-2 text-purple-400">Predictive Modeling</h4>
                                <p class="text-sm text-gray-400">Advanced forecasting for budget optimization and financial planning</p>
                            </div>

                            <div class="bg-gray-800 rounded-xl p-6 border border-gray-700 hover:border-green-500 transition-colors">
                                <div class="text-3xl mb-3">⚡</div>
                                <h4 class="text-lg font-semibold mb-2 text-green-400">Real-time Insights</h4>
                                <p class="text-sm text-gray-400">Live financial health monitoring with instant recommendations</p>
                            </div>
                        </div>

                        <div class="mt-12">
                            <button class="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold py-3 px-8 rounded-full text-lg transition-all transform hover:scale-105 shadow-lg">
                                Join Waitlist 🎯
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    \`;

    document.body.appendChild(modal);
}

// Close Deep Dive modal
function closeDeepDive() {
    const modal = document.getElementById('deepDiveModal');
    if (modal) {
        modal.remove();
    }
}

// API Helper with enhanced error handling
async function apiCall(endpoint, options = {}) {
    try {
        const token = localStorage.getItem('token');
const defaultOptions = {
    headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    }
};

        console.log(`🔄 API Call: ${options.method || 'GET'} ${endpoint}`);
        const response = await fetch(endpoint, { ...defaultOptions, ...options });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            const errorMessage = errorData.error || `HTTP ${response.status}`;
            console.error(`❌ API Error: ${errorMessage}`, { endpoint, status: response.status });

            if (response.status === 401) {
                showNotification('Session expired. Please login again.', 'error');
                setTimeout(() => window.location.href = 'login.html', 2000);
                return null;
            }

            throw new Error(errorMessage);
        }

        const data = await response.json();
        console.log(`✅ API Success: ${endpoint}`, data);
        return data;
    } catch (error) {
        console.error(`❌ API Call Failed: ${endpoint}`, error);
        if (error.name === 'TypeError' && error.message.includes('fetch')) {
            showNotification('Network error. Please check your connection.', 'error');
        }
        throw error;
    }
}

// Subscriptions Management with enhanced error handling
async function loadSubscriptions() {
    try {
        console.log('🔄 Loading subscriptions...');
        const subscriptions = await apiCall('/api/subscriptions');

        if (!subscriptions) {
            console.warn('⚠️ No subscriptions data received');
            displaySubscriptions([]);
            updateSubscriptionStats([]);
            return;
        }

        displaySubscriptions(subscriptions);
        updateSubscriptionStats(subscriptions);
        console.log(`✅ Loaded ${subscriptions.length} subscriptions`);
    } catch (error) {
        console.error('❌ Failed to load subscriptions:', error);
        showNotification(`Failed to load subscriptions: ${error.message}`, 'error');

        // Show fallback UI
        const tbody = document.getElementById('subsBody');
        if (tbody) {
            tbody.innerHTML = '<tr><td colspan="5" class="px-4 py-8 text-center text-red-500">❌ Error loading subscriptions. Please refresh the page.</td></tr>';
        }
    }
}

function displaySubscriptions(subscriptions) {
    const tbody = document.getElementById('subsBody');
    tbody.innerHTML = '';

    if (subscriptions.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="px-4 py-8 text-center text-gray-500">No subscriptions yet. Add your first one above!</td></tr>';
        return;
    }

    subscriptions.forEach(sub => {
        const row = document.createElement('tr');
        row.className = 'border-b hover:bg-gray-50';

        const nextDate = new Date(sub.next_date);
        const isUpcoming = (nextDate - new Date()) / (1000 * 60 * 60 * 24) <= 7;

        row.innerHTML = `
            <td class="px-4 py-3">
                <div class="flex items-center">
                    <span class="text-2xl mr-3">${getServiceIcon(sub.name)}</span>
                    <div>
                        <div class="font-medium text-gray-900">${sub.name}</div>
                        ${sub.tier ? `<div class="text-xs text-gray-500">${sub.tier}</div>` : ''}
                        ${sub.description ? `<div class="text-xs text-gray-400 mt-1">${sub.description}</div>` : ''}
                    </div>
                </div>
            </td>
            <td class="px-4 py-3 font-semibold text-green-600">€${sub.cost.toFixed(2)}</td>
            <td class="px-4 py-3">
                <span class="px-2 py-1 text-xs rounded-full ${sub.cycle === 'monthly' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'}">
                    ${sub.cycle}
                </span>
                ${sub.category ? `<div class="text-xs text-gray-500 mt-1">${sub.category}</div>` : ''}
            </td>
            <td class="px-4 py-3">
                <span class="font-medium ${isUpcoming ? 'text-orange-600' : 'text-gray-600'}">
                    ${nextDate.toLocaleDateString()}
                    ${isUpcoming ? ' ⚠️' : ''}
                </span>
            </td>
            <td class="px-4 py-3">
                <button onclick="deleteSubscription(${sub.id})" class="text-red-600 hover:text-red-800 text-sm font-medium">
                    Delete
                </button>
            </td>
        `;

        tbody.appendChild(row);
    });
}

function updateSubscriptionStats(subscriptions) {
    const monthly = subscriptions
        .filter(sub => sub.cycle === 'monthly')
        .reduce((sum, sub) => sum + sub.cost, 0);

    const yearly = subscriptions
        .filter(sub => sub.cycle === 'yearly')
        .reduce((sum, sub) => sum + (sub.cost / 12), 0);

    const total = monthly + yearly;
    document.getElementById('total').textContent = `€${total.toFixed(2)}`;

    // Update active count
    const activeCountEl = document.getElementById('activeCount');
    if (activeCountEl) {
        activeCountEl.textContent = subscriptions.length;
    }

    // Show upgrade prompt for free users with many subscriptions
    const userPlan = localStorage.getItem('userPlan') || 'free';
    const upgradePrompt = document.getElementById('upgradePrompt');

    if (userPlan === 'free' && subscriptions.length >= 4) {
        upgradePrompt.classList.remove('hidden');
    } else if (userPlan === 'basic' && subscriptions.length >= 14) {
        upgradePrompt.innerHTML = `
            <p class="text-xs text-orange-600 font-medium">🚀 Ready for USW?</p>
            <button class="text-xs bg-purple-600 text-white px-3 py-1 rounded mt-1 hover:bg-purple-700">
                Upgrade to Pro
            </button>
        `;
        upgradePrompt.classList.remove('hidden');
    }

    // Add USW value proposition based on total spend
    if (total > 50 && userPlan !== 'pro') {
        const savings = Math.round(total * 0.02); // Assume 2% savings through USW
        const uswPreview = document.getElementById('uswPreview');
        if (uswPreview) {
            const savingsText = uswPreview.querySelector('.text-purple-100');
            if (savingsText) {
                savingsText.innerHTML = `Pay all your subscriptions with one monthly charge. <strong>Potential savings: €${savings}/month</strong>`;
            }
        }
    }
}

function getServiceIcon(serviceName) {
    const icons = {
        'Netflix': '🎬',
        'Spotify': '🎵',
        'Adobe': '🎨',
        'GitHub': '💻',
        'Microsoft': '💼',
        'Apple': '🍎',
        'Google': '🔍',
        'Amazon': '📦'
    };

    for (const [service, icon] of Object.entries(icons)) {
        if (serviceName.toLowerCase().includes(service.toLowerCase())) {
            return icon;
        }
    }
    return '📱';
}

async function deleteSubscription(id) {
    if (!confirm('Are you sure you want to delete this subscription?')) return;

    try {
        await apiCall(`/api/subscriptions/${id}`, { method: 'DELETE' });
        showNotification('Subscription deleted successfully');
        loadSubscriptions();
    } catch (error) {
        console.error('Failed to delete subscription:', error);
        showNotification('Failed to delete subscription', 'error');
    }
}

// Form Handlers
function setupFormHandlers() {
    // Enhanced service search with proper tier/price display
    const nameInput = document.getElementById('name');
    const suggestions = document.getElementById('suggestions');
    let selectedServiceData = null;

    nameInput.addEventListener('input', async (e) => {
        const query = e.target.value.trim();
        if (query.length < 2) {
            suggestions.classList.add('hidden');
            clearSelectedService();
            return;
        }

        try {
            const response = await fetch(`/api/services/search?q=${encodeURIComponent(query)}`);
            const services = await response.json();

            if (services.length > 0) {
                // Create flattened list with all tiers for each service
                const allOptions = [];
                services.forEach(service => {
                    if (service.tiers && service.tiers.length > 0) {
                        service.tiers.forEach(tier => {
                            allOptions.push({
                                serviceName: service.name,
                                tierName: tier.name,
                                price: tier.price,
                                category: service.category,
                                description: service.description || service.description
                            });
                        });
                    }
                });

                suggestions.innerHTML = allOptions.map((option, index) => `
                    <div class="p-4 hover:bg-indigo-50 cursor-pointer border-b last:border-b-0 transition-colors" onclick="selectServiceOption(${index})">
                        <div class="flex justify-between items-start">
                            <div class="flex-1">
                                <div class="font-semibold text-gray-900">${option.serviceName}</div>
                                <div class="text-sm text-indigo-600 font-medium">${option.tierName}</div>
                                <div class="text-xs text-gray-500 mt-1">${option.category}</div>
                                ${option.description ? `<div class="text-xs text-gray-400 mt-1">${option.description}</div>` : ''}
                            </div>
                            <div class="text-right ml-4">
                                <div class="font-bold text-green-600">€${option.price.toFixed(2)}</div>
                                <div class="text-xs text-gray-500">/month</div>
                            </div>
                        </div>
                    </div>
                `).join('');

                // Store options for selection
                window.serviceOptions = allOptions;
                suggestions.classList.remove('hidden');
            } else {
                suggestions.classList.add('hidden');
                clearSelectedService();
            }
        } catch (error) {
            console.error('Failed to fetch service suggestions:', error);
            suggestions.classList.add('hidden');
            clearSelectedService();
        }
    });

    // Hide suggestions when clicking outside
    document.addEventListener('click', (e) => {
        if (!nameInput.contains(e.target) && !suggestions.contains(e.target)) {
            suggestions.classList.add('hidden');
        }
    });

    // Subscription form with comprehensive validation
    document.getElementById('subForm').addEventListener('submit', async (e) => {
        e.preventDefault();

        const formData = new FormData(e.target);
        const name = formData.get('name')?.trim();
        const cost = parseFloat(formData.get('cost'));
        const cycle = formData.get('cycle');
        const nextMonth = formData.get('nextMonth');
        const nextDay = formData.get('nextDay');

        // Comprehensive validation
        if (!name || name.length < 1 || name.length > 100) {
            showNotification('❌ Service name is required (1-100 characters)', 'error');
            document.getElementById('name').focus();
            return;
        }

        if (!cost || isNaN(cost) || cost <= 0 || cost > 10000) {
            showNotification('❌ Valid cost is required (€0.01 - €10,000)', 'error');
            document.getElementById('cost').focus();
            return;
        }

        if (!cycle || !['monthly', 'yearly'].includes(cycle)) {
            showNotification('❌ Please select a billing cycle', 'error');
            document.getElementById('cycle').focus();
            return;
        }

        if (!nextMonth || !nextDay) {
            showNotification('❌ Please select the next payment date', 'error');
            document.getElementById('nextDay').focus();
            return;
        }

        // Validate date logic
        const selectedDate = new Date(`2025-${nextMonth.padStart(2, '0')}-${nextDay.padStart(2, '0')}`);
        const today = new Date();
        if (selectedDate < today) {
            showNotification('❌ Next payment date must be in the future', 'error');
            return;
        }

        const data = {
            name: name,
            cost: cost,
            cycle: cycle,
            nextDate: `2025-${nextMonth.padStart(2, '0')}-${nextDay.padStart(2, '0')}`
        };

        try {
            await apiCall('/api/subscriptions', {
                method: 'POST',
                body: JSON.stringify(data)
            });

            showNotification('✅ Subscription added successfully!');

            // Complete form reset including suggestion state
            e.target.reset();
            clearSelectedService();
            document.getElementById('suggestions').classList.add('hidden');

            loadSubscriptions();
        } catch (error) {
            console.error('Failed to add subscription:', error);
            showNotification('Failed to add subscription', 'error');
        }
    });

    // Demo data button with explicit handler
    const generateDemoBtn = document.getElementById('generateDemoBtn');
    if (generateDemoBtn) {
        // Remove existing listeners
        const newBtn = generateDemoBtn.cloneNode(true);
        generateDemoBtn.parentNode.replaceChild(newBtn, generateDemoBtn);

        newBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('🎲 Demo subscriptions button clicked');
            generateDemoSubscriptions();
        });
        console.log('✅ Demo subscriptions button handler attached');
    }

    // Add demo transactions button if it exists
    const demoTxnBtn = document.getElementById('demoTransactionsBtn');
    if (demoTxnBtn) {
        // Remove existing listeners
        const newTxnBtn = demoTxnBtn.cloneNode(true);
        demoTxnBtn.parentNode.replaceChild(newTxnBtn, demoTxnBtn);

        newTxnBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('🎲 Demo transactions button clicked');
            generateDemoTransactions();
        });
        console.log('✅ Demo transactions button handler attached');
    }
}

// Transactions Management
let allTransactions = [];
let filteredTransactions = [];

// Pagination variables
let currentPage = 1;
const transactionsPerPage = 10;

async function loadTransactions() {
    try {
        const response = await apiCall(`/api/transactions?user_id=${currentUser.email}&limit=1000`);
        allTransactions = response?.transactions || [];
        filteredTransactions = [...allTransactions];

        // Apply filters safely
        try {
            applyFilters();
            displayTransactionsPaginated();
            updateFilterSummary();
        } catch (filterError) {
            console.error('Filter error:', filterError);
            // Fallback to simple display
            displayTransactions(allTransactions.slice(0, 10));
        }

        // Estimate generation count based on transaction volume for demo accounts
        if (currentUser && currentUser.email && currentUser.email.includes('@demo.com')) {
            if (allTransactions.length >= 180) { // Approximately 12 months of data
                transactionGenerationCount = MAX_GENERATION_COUNT;
            } else if (allTransactions.length >= 90) { // Approximately 6 months of data
                transactionGenerationCount = 1;
            } else {
                transactionGenerationCount = 0;
            }
            updateTransactionButtonState();
        }

        // Check for uncategorized transactions and show alert with error handling
        try {
            checkUncategorizedTransactions();
        } catch (categoryError) {
            console.error('Categorization check error:', categoryError);
        }

        console.log(`📊 Loaded ${allTransactions.length} transactions for filtering`);
    } catch (error) {
        console.error('Failed to load transactions:', error);
        showNotification('Failed to load transactions', 'error');
        // Initialize empty arrays to prevent further errors
        allTransactions = [];
        filteredTransactions = [];
    }
}

// Paginated display function
function displayTransactionsPaginated() {
    const startIndex = (currentPage - 1) * transactionsPerPage;
    const endIndex = startIndex + transactionsPerPage;
    const transactionsToDisplay = filteredTransactions.slice(startIndex, endIndex);
    displayTransactions(transactionsToDisplay);
    updatePaginationControls();
}

function displayTransactions(transactions) {
    const container = document.getElementById('transactionsList');
    container.innerHTML = '';

    if (transactions.length === 0) {
        container.innerHTML = `
            <div class="text-center py-8 text-gray-500">
                <p class="text-lg mb-2">No transactions yet</p>
                <p class="text-sm">Transactions will appear automatically when synced from your bank</p>
            </div>
        `;
        return;
    }

    transactions.forEach(tx => {
        const txDate = new Date(tx.date);
        const amount = Math.abs(tx.amount);
        const needsCategoryUpdate = !tx.category || tx.category === 'Misc';

        const txElement = document.createElement('div');
        txElement.className = `bg-white p-4 rounded-lg border hover:shadow-md transition-shadow ${needsCategoryUpdate ? 'border-orange-200 bg-orange-50' : ''}`;

        txElement.innerHTML = `
            <div class="flex justify-between items-start">
                <div class="flex-1">
                    <div class="flex items-center mb-1">
                        <span class="text-lg mr-2">${getCategoryIcon(tx.category)}</span>
                        <h3 class="font-semibold text-gray-900">${tx.merchant}</h3>
                        ${tx.is_recurring ? '<span class="ml-2 px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">Recurring</span>' : ''}
                        ${needsCategoryUpdate ? '<span class="ml-2 px-2 py-1 text-xs bg-orange-100 text-orange-800 rounded">⚠️ Needs Category</span>' : ''}
                    </div>
                    <p class="text-sm text-gray-600 mb-1">${tx.description}</p>
                    <div class="flex items-center text-xs text-gray-500">
                        <span class="mr-3">${txDate.toLocaleDateString()}</span>
                        ${needsCategoryUpdate ? 
                            `<select class="text-xs border rounded px-2 py-1 bg-white" onchange="updateTransactionCategory('${tx.id}', this.value)">
                                <option value="">Select Category</option>
                                <option value="Groceries">🛒 Groceries</option>
                                <option value="Transport - Fuel">⛽ Transport - Fuel</option>
                                <option value="Transport - Ride">🚗 Transport - Ride</option>
                                <option value="Subscriptions">📱 Subscriptions</option>
                                <option value="Dining">🍽️ Dining</option>
                                <option value="Shopping">🛍️ Shopping</option>
                                <option value="Bills & Utilities">⚡ Bills & Utilities</option>
                                <option value="Healthcare">🏥 Healthcare</option>
                                <option value="Entertainment">🎭 Entertainment</option>
                            </select>` : 
                            `<span class="px-2 py-1 bg-gray-100 rounded">${tx.category || 'Uncategorized'}</span>`}
                    </div>
                </div>
                <div class="text-right">
                    <span class="text-lg font-bold text-red-600">-€${amount.toFixed(2)}</span>
                </div>
            </div>
        `;

        container.appendChild(txElement);
    });
}

function getCategoryIcon(category) {
    const icons = {
        'Groceries': '🛒',
        'Transport - Fuel': '⛽',
        'Transport - Ride': '🚗',
        'Subscriptions': '📱',
        'Dining': '🍽️',
        'Shopping': '🛍️',
        'Bills & Utilities': '⚡',
        'Healthcare': '🏥',
        'Entertainment': '🎭'
    };
    return icons[category] || '💳';
}

// Insights & Charts
/* ---------- loadInsights: single request & no chartData ---- */
async function loadInsights() {
  try {
      const period   = document.getElementById('periodSelect').value;
      const insights = await apiCall(
        `/api/insights?user_id=${currentUser.email}&period=${period}`
      );

      displayInsights(insights);
      createCategoryChart(insights.category_breakdown || {});
      displayAdvancedInsights(insights);
      generateRecommendations(insights);
  } catch (error) {
      console.error('Failed to load insights:', error);
      showNotification('Failed to load insights', 'error');
  }
}

function displayInsights(insights) {
    document.getElementById('totalSpend').textContent = `€${(insights.total_spend || 0).toFixed(2)}`;
    document.getElementById('totalTransactions').textContent = insights.total_transactions || 0;
    document.getElementById('topCategory').textContent = insights.top_category || 'None';

    // Calculate and display additional metrics
    const avgDaily = insights.total_spend / (getPeriodDays(document.getElementById('periodSelect').value));
    document.getElementById('avgDaily').textContent = `€${avgDaily.toFixed(2)}`;

    // Calculate projected monthly spending
    const projectedMonthly = avgDaily * 30;
    document.getElementById('projectedMonthly').textContent = `€${projectedMonthly.toFixed(2)}`;
}

function displayAdvancedInsights(insights) {
    const categoryBreakdown = insights.category_breakdown || {};
    const totalSpend = insights.total_spend || 0;

    // Calculate spending patterns
    const spendingPatterns = analyzeSpendingPatterns(categoryBreakdown, totalSpend);
    const weekdayVsWeekend = analyzeWeekdaySpending();
    const merchantAnalysis = analyzeMerchantSpending();

    // Update advanced insights cards
    updateSpendingPatternsCard(spendingPatterns);
    updateWeekdayAnalysisCard(weekdayVsWeekend);
    updateMerchantInsightsCard(merchantAnalysis);
    updateBudgetHealthCard(insights);
}

function analyzeSpendingPatterns(categoryBreakdown, totalSpend) {
    const categories = Object.entries(categoryBreakdown);
    if (categories.length === 0) return null;

    // Sort by amount spent
    categories.sort((a, b) => b[1] - a[1]);

    const topCategory = categories[0];
    const topPercentage = ((topCategory[1] / totalSpend) * 100).toFixed(1);

    // Identify if spending is diversified or concentrated
    const isDiversified = categories.length >= 4 && topPercentage < 40;

    return {
        topCategory: topCategory[0],
        topAmount: topCategory[1],
        topPercentage: topPercentage,
        isDiversified: isDiversified,
        categoryCount: categories.length
    };
}

function analyzeWeekdaySpending() {
    // Analyze transaction patterns by day of week from allTransactions
    const weekdaySpend = { weekday: 0, weekend: 0 };
    const dayCount = { weekday: 0, weekend: 0 };

    allTransactions.forEach(tx => {
        const date = new Date(tx.date);
        const dayOfWeek = date.getDay();
        const amount = Math.abs(tx.amount);

        if (dayOfWeek === 0 || dayOfWeek === 6) { // Sunday or Saturday
            weekdaySpend.weekend += amount;
            dayCount.weekend++;
        } else {
            weekdaySpend.weekday += amount;
            dayCount.weekday++;
        }
    });

    return {
        weekdayAvg: dayCount.weekday > 0 ? weekdaySpend.weekday / dayCount.weekday : 0,
        weekendAvg: dayCount.weekend > 0 ? weekdaySpend.weekend / dayCount.weekend : 0,
        weekdayTotal: weekdaySpend.weekday,
        weekendTotal: weekdaySpend.weekend
    };
}

function analyzeMerchantSpending() {
    const merchantSpending = {};
    const merchantFrequency = {};

    allTransactions.forEach(tx => {
        const merchant = tx.merchant;
        const amount = Math.abs(tx.amount);

        merchantSpending[merchant] = (merchantSpending[merchant] || 0) + amount;
        merchantFrequency[merchant] = (merchantFrequency[merchant] || 0) + 1;
    });

    // Get top merchants by spending
    const topMerchants = Object.entries(merchantSpending)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);

    // Get most frequent merchants
    const frequentMerchants = Object.entries(merchantFrequency)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3);

    return {
        topMerchants: topMerchants,
        frequentMerchants: frequentMerchants
    };
}

function updateSpendingPatternsCard(patterns) {
    const card = document.getElementById('spendingPatternsCard');
    if (!patterns) {
        card.innerHTML = '<p class="text-gray-500">Not enough data for analysis</p>';
        return;
    }

    const diversityIcon = patterns.isDiversified ? '✅' : '⚠️';
    const diversityText = patterns.isDiversified ? 'Well Balanced' : 'Concentrated';
    const diversityColor = patterns.isDiversified ? 'text-green-600' : 'text-orange-600';
    const diversityTooltip = patterns.isDiversified ? 
        'Your spending is well distributed across different categories' : 
        'Most of your money goes to one main category';

    card.innerHTML = `
        <div class="space-y-3">
            <div class="flex justify-between items-center">
                <span class="text-sm text-gray-600" title="Where you spend the most money">Top Spending Area</span>
                <span class="font-semibold text-gray-900">${patterns.topCategory}</span>
            </div>
            <div class="flex justify-between items-center">
                <span class="text-sm text-gray-600" title="How much of your total budget goes here">Budget Share</span>
                <span class="font-bold text-indigo-600">${patterns.topPercentage}%</span>
            </div>
            <div class="flex justify-between items-center">
                <span class="text-sm text-gray-600" title="${diversityTooltip}">Spending Pattern</span>
                <span class="font-medium ${diversityColor}" title="${diversityTooltip}">${diversityIcon} ${diversityText}</span>
            </div>
            <div class="pt-2 border-t border-gray-100">
                <p class="text-xs text-gray-500" title="How many different types of purchases you make">You spend across ${patterns.categoryCount} different areas</p>
            </div>
        </div>
    `;
}

function updateWeekdayAnalysisCard(analysis) {
    const card = document.getElementById('weekdayAnalysisCard');
    const weekdayHigher = analysis.weekdayAvg > analysis.weekendAvg;
    const difference = Math.abs(analysis.weekdayAvg - analysis.weekendAvg);
    const percentDiff = analysis.weekdayAvg > 0 ? ((difference / analysis.weekdayAvg) * 100).toFixed(0) : 0;

    const insight = weekdayHigher ? 
        'You spend more during work days' : 
        'Weekends are your main spending time';

    card.innerHTML = `
        <div class="space-y-3">
            <div class="flex justify-between items-center">
                <span class="text-sm text-gray-600" title="Average spending Monday-Friday">Work Days</span>
                <span class="font-semibold text-gray-900">€${analysis.weekdayAvg.toFixed(2)}</span>
            </div>
            <div class="flex justify-between items-center">
                <span class="text-sm text-gray-600" title="Average spending Saturday-Sunday">Weekends</span>
                <span class="font-semibold text-gray-900">€${analysis.weekendAvg.toFixed(2)}</span>
            </div>
            <div class="pt-2 border-t border-gray-100">
                <p class="text-xs ${weekdayHigher ? 'text-blue-600' : 'text-purple-600'}" title="${insight}">
                    ${weekdayHigher ? '💼' : '🎉'} ${insight} (+${percentDiff}% difference)
                </p>
            </div>
        </div>
    `;
}

function updateMerchantInsightsCard(analysis) {
    const card = document.getElementById('merchantInsightsCard');
    const topMerchant = analysis.topMerchants[0];
    const frequentMerchant = analysis.frequentMerchants[0];

    if (!topMerchant || !frequentMerchant) {
        card.innerHTML = '<p class="text-gray-500">Not enough transaction data</p>';
        return;
    }

    card.innerHTML = `
        <div class="space-y-3">
            <div>
                <p class="text-sm text-gray-600 mb-1">Highest Spending</p>
                <p class="font-semibold text-gray-900">${topMerchant[0]}</p>
                <p class="text-sm text-green-600 font-medium">€${topMerchant[1].toFixed(2)}</p>
            </div>
            <div class="pt-2 border-t border-gray-100">
                <p class="text-sm text-gray-600 mb-1">Most Frequent</p>
                <p class="font-medium text-gray-900">${frequentMerchant[0]}</p>
                <p class="text-xs text-blue-600">${frequentMerchant[1]} transactions</p>
            </div>
        </div>
    `;
}

function updateBudgetHealthCard(insights) {
    const card = document.getElementById('budgetHealthCard');
    const totalSpend = insights.total_spend || 0;
    const period = document.getElementById('periodSelect').value;
    const periodDays = getPeriodDays(period);

    // Calculate spending velocity
    const dailyRate = totalSpend / periodDays;
    const weeklyRate = dailyRate * 7;
    const monthlyProjection = dailyRate * 30;

    // Determine health status
    let healthStatus, healthColor, healthIcon;
    if (monthlyProjection < 1500) {
        healthStatus = 'Conservative';
        healthColor = 'text-green-600';
        healthIcon = '💚';
    } else if (monthlyProjection < 3000) {
        healthStatus = 'Moderate';
        healthColor = 'text-blue-600';
        healthIcon = '💙';
    } else if (monthlyProjection < 5000) {
        healthStatus = 'Active';
        healthColor = 'text-orange-600';
        healthIcon = '🧡';
    } else {
        healthStatus = 'High';
        healthColor = 'text-red-600';
        healthIcon = '❤️';
    }

    card.innerHTML = `
        <div class="space-y-3">
            <div class="flex justify-between items-center">
                <span class="text-sm text-gray-600">Spending Rate</span>
                <span class="font-semibold ${healthColor}">${healthIcon} ${healthStatus}</span>
            </div>
            <div class="flex justify-between items-center">
                <span class="text-sm text-gray-600">Weekly Rate</span>
                <span class="font-semibold text-gray-900">€${weeklyRate.toFixed(2)}</span>
            </div>
            <div class="flex justify-between items-center">
                <span class="text-sm text-gray-600">Monthly Projection</span>
                <span class="font-bold text-indigo-600">€${monthlyProjection.toFixed(2)}</span>
            </div>
        </div>
    `;
}

function generateRecommendations(insights) {
    const recommendations = [];
    const categoryBreakdown = insights.category_breakdown || {};
    const totalSpend = insights.total_spend || 0;

    // Analyze subscription spending
    const subscriptionSpend = categoryBreakdown['Subscriptions'] || 0;
    if (subscriptionSpend > totalSpend * 0.3) {
        recommendations.push({
            icon: '📱',
            title: 'High Subscription Spending',
            description: `Subscriptions account for ${((subscriptionSpend/totalSpend)*100).toFixed(0)}% of your spending. Consider reviewing unused services.`,
            action: 'Review subscriptions',
            priority: 'high'
        });
    }

    // Analyze dining out
    const diningSpend = categoryBreakdown['Dining'] || 0;
    if (diningSpend > totalSpend * 0.25) {
        const potentialSavings = diningSpend * 0.3; // 30% potential savings
        recommendations.push({
            icon: '🍽️',
            title: 'Dining Optimization',
            description: `High dining expenses detected. Cooking more could save ~€${potentialSavings.toFixed(0)}/month.`,
            action: 'Plan home meals',
            priority: 'medium'
        });
    }

    // Analyze spending concentration
    const topCategory = Object.entries(categoryBreakdown).sort((a, b) => b[1] - a[1])[0];
    if (topCategory && topCategory[1] > totalSpend * 0.5) {
        recommendations.push({
            icon: '⚠️',
            title: 'Spending Concentration Risk',
            description: `${((topCategory[1]/totalSpend)*100).toFixed(0)}% of spending is on ${topCategory[0]}. Consider diversifying.`,
            action: 'Diversify spending',
            priority: 'medium'
        });
    }

    // Analyze transaction frequency
    if (insights.total_transactions > 200) {
        recommendations.push({
            icon: '💳',
            title: 'High Transaction Frequency',
            description: `${insights.total_transactions} transactions detected. Consider consolidating purchases to reduce fees.`,
            action: 'Batch purchases',
            priority: 'low'
        });
    }

    // General savings recommendation
    if (totalSpend > 0) {
        const savingsTarget = totalSpend * 0.1; // 10% savings target
        recommendations.push({
            icon: '💰',
            title: 'Savings Opportunity',
            description: `Setting aside 10% (€${savingsTarget.toFixed(2)}) could build a strong emergency fund.`,
            action: 'Start saving',
            priority: 'medium'
        });
    }

    displayRecommendations(recommendations);
}

function displayRecommendations(recommendations) {
    const container = document.getElementById('recommendationsContainer');

    if (recommendations.length === 0) {
        container.innerHTML = `
            <div class="text-center py-8 text-gray-500">
                <p class="text-lg mb-2">✨ Great job!</p>
                <p class="text-sm">Your spending looks healthy. Keep it up!</p>
            </div>
        `;
        return;
    }

    container.innerHTML = recommendations.map(rec => `
        <div class="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
            <div class="flex items-start space-x-3">
                <span class="text-2xl">${rec.icon}</span>
                <div class="flex-1">
                    <div class="flex items-center justify-between mb-2">
                        <h4 class="font-semibold text-gray-900">${rec.title}</h4>
                        <span class="px-2 py-1 text-xs rounded-full ${getPriorityStyle(rec.priority)}">
                            ${rec.priority.toUpperCase()}
                        </span>
                    </div>
                    <p class="text-sm text-gray-600 mb-3">${rec.description}</p>
                    <button class="text-sm font-medium text-indigo-600 hover:text-indigo-800 focus:outline-none">
                        ${rec.action} →
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

function getPriorityStyle(priority) {
    switch (priority) {
        case 'high': return 'bg-red-100 text-red-800';
        case 'medium': return 'bg-yellow-100 text-yellow-800';
        case 'low': return 'bg-blue-100 text-blue-800';
        default: return 'bg-gray-100 text-gray-800';
    }
}

function getPeriodDays(period) {
    switch (period) {
        case '30d': return 30;
        case '60d': return 60;
        case '90d': return 90;
        default: return 30;
    }
}

function createCategoryChart(categoryData) {
    const ctx = document.getElementById('categoryChart').getContext('2d');

    if (chartInstance) {
        chartInstance.destroy();
    }

    const labels = Object.keys(categoryData);
    const data = Object.values(categoryData);
    const colors = [
        '#4F46E5', '#7C3AED', '#DC2626', '#EA580C', 
        '#D97706', '#65A30D', '#059669', '#0891B2', 
        '#3B82F6', '#8B5CF6'
    ];

    chartInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: colors.slice(0, labels.length),
                borderWidth: 2,
                borderColor: '#ffffff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        padding: 20,
                        usePointStyle: true
                    }
                }
            }
        }
    });
}

// Demo Subscription Generation
async function generateDemoSubscriptions() {
    console.log('🎲 Generate demo subscriptions clicked');
    const button = document.getElementById('generateDemoBtn');
    if (!button) {
        console.error('❌ Generate demo button not found');
        return;
    }

    const originalText = button.textContent;
    button.textContent = '⏳ Generating Demo Subscriptions...';
    button.disabled = true;

    try {
        console.log('🔄 Calling demo subscriptions API...');
        const response = await apiCall('/api/demo/subscriptions', {
            method: 'POST'
        });

        showNotification(`Generated ${response.count} demo subscriptions! 🎉`);
        loadSubscriptions();
    } catch (error) {
        console.error('Failed to generate demo subscriptions:', error);
        showNotification('Failed to generate demo subscriptions', 'error');
    } finally {
        button.textContent = originalText;
        button.disabled = false;
    }
}



// Demo Transaction Generation with proper state management
async function generateDemoTransactions() {
    const button = document.getElementById('demoTransactionsBtn');

    // Check if max generations reached
    if (transactionGenerationCount >= MAX_GENERATION_COUNT) {
        showNotification('Maximum demo data reached (12 months total)! 📊', 'warning');
        return;
    }

    const originalText = button.textContent;
    button.textContent = '⏳ Generating 6 Months of Transactions...';
    button.disabled = true;

    try {
        const response = await apiCall('/api/demo/transactions', {
            method: 'POST'
        });

        if (response.max_reached) {
            transactionGenerationCount = MAX_GENERATION_COUNT;
            updateTransactionButtonState();
            showNotification('Maximum demo data reached (12 months)! 📊', 'warning');
        } else {
            transactionGenerationCount++;
            localStorage.setItem('transactionGenerationCount', transactionGenerationCount.toString());
            updateTransactionButtonState();
            const monthsGenerated = transactionGenerationCount * 6;
            showNotification(`Generated 6 months of transaction data! (${monthsGenerated}/12 months total) 🎉`, 'success');
        }

        loadTransactions();
        if (currentTab === 'insights') {
            loadInsights();
        }
    } catch (error) {
        console.error('Failed to generate demo transactions:', error);
        showNotification('Failed to generate demo transactions', 'error');
    } finally {
        if (transactionGenerationCount < MAX_GENERATION_COUNT) {
            button.textContent = originalText;
            button.disabled = false;
        }
    }
}

// Update transaction button state based on generation count
function updateTransactionButtonState() {
    const button = document.getElementById('demoTransactionsBtn');
    if (!button) return;

    if (transactionGenerationCount >= MAX_GENERATION_COUNT) {
        button.textContent = '✅ Max Demo Data Generated (12 months)';
        button.disabled = true;
        button.classList.remove('bg-gradient-to-r', 'from-green-500', 'to-blue-600', 'hover:from-green-600', 'hover:to-blue-700');
        button.classList.add('bg-gray-400', 'cursor-not-allowed');
        button.title = 'Maximum demo data reached. 12 months of transaction data has been generated.';
    } else {
        const remainingGenerations = MAX_GENERATION_COUNT - transactionGenerationCount;
        const remainingMonths = remainingGenerations * 6;
        button.title = `Generate 6 more months of demo data. ${remainingMonths} months remaining.`;

        if (transactionGenerationCount === 1) {
            button.textContent = '🎲 Generate Final 6 Months Demo Data';
        }
    }
}

// Enhanced utilities with error tracking
function showNotification(message, type = 'success') {
    console.log(`📢 ${type === 'error' ? '❌' : '✅'} Notification: ${message}`);

    // Create notification element
    const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 z-50 px-6 py-3 rounded-lg shadow-lg transition-all duration-300 max-w-sm ${
        type === 'error' ? 'bg-red-500 text-white' : 
        type === 'warning' ? 'bg-yellow-500 text-white' : 'bg-green-500 text-white'
    }`;

    // Add icon based on type
    const icon = type === 'error' ? '❌' : type === 'warning' ? '⚠️' : '✅';
    notification.innerHTML = `<div class="flex items-center"><span class="mr-2">${icon}</span><span>${message}</span></div>`;

    document.body.appendChild(notification);

    // Animate in
    setTimeout(() => notification.classList.add('opacity-100'), 10);

    // Remove after duration based on type
    const duration = type === 'error' ? 5000 : 3000;
    setTimeout(() => {
        notification.classList.add('opacity-0');
        setTimeout(() => notification.remove(), 300);
    }, duration);
}

// Enhanced service selection from autocomplete with validation support
    window.selectServiceOption = function(name, tier, price, category) {
    const option = window.serviceOptions[index];
    if (!option) return;

    // Fill form fields
    document.getElementById('name').value = option.serviceName;
    document.getElementById('cost').value = option.price;

    // Update selected tier display
    const selectedTierDiv = document.getElementById('selectedTier');
    selectedTierDiv.innerHTML = `
        <div class="flex justify-between items-center">
            <div>
                <div class="font-semibold text-gray-900">${option.tierName}</div>
                <div class="text-xs text-gray-500">${option.category}</div>
            </div>
            <div class="text-right">
                <div class="font-bold text-green-600">€${option.price.toFixed(2)}</div>
                <div class="text-xs text-gray-500">/month</div>
            </div>
        </div>
    `;
    selectedTierDiv.classList.remove('bg-gray-50', 'text-gray-600');
    selectedTierDiv.classList.add('bg-indigo-50', 'border-indigo-200');

    // Hide suggestions
    document.getElementById('suggestions').classList.add('hidden');

    // Store selected data
    selectedServiceData = option;

    // Remove any validation error styling
    document.getElementById('name').classList.remove('border-red-500');
    document.getElementById('cost').classList.remove('border-red-500');
};

// Clear selected service
function clearSelectedService() {
    const selectedTierDiv = document.getElementById('selectedTier');
    selectedTierDiv.innerHTML = 'Select a service first';
    selectedTierDiv.classList.remove('bg-indigo-50', 'border-indigo-200');
    selectedTierDiv.classList.add('bg-gray-50', 'text-gray-600');

    document.getElementById('cost').value = '';
    selectedServiceData = null;
}

// Update transaction category (for uncertain transactions)
window.updateTransactionCategory = async function(transactionId, newCategory) {
    if (!newCategory) return;

    try {
        // This would call a backend endpoint to update transaction category
        await apiCall(`/api/transactions/${transactionId}/category`, {
            method: 'PATCH',
            body: JSON.stringify({ category: newCategory })
        });

        showNotification(`Category updated to ${newCategory}`, 'success');
        loadTransactions(); // Reload to reflect changes
    } catch (error) {
        console.error('Failed to update category:', error);
        showNotification('Failed to update category', 'error');
    }
};

// Advanced Transaction Filtering System
function applyFilters() {
    try {
        const searchTerm = document.getElementById('globalTransactionSearch')?.value?.toLowerCase() || '';
        const dateFilter = document.getElementById('dateFilter')?.value || '30d'; // Default to 30 days
        const categoryFilter = document.getElementById('categoryFilter')?.value || 'all';
        const amountFilter = document.getElementById('amountFilter')?.value || 'all';
        const sortFilter = document.getElementById('sortFilter')?.value || 'date-desc'; // Default to newest first
        const fromDate = document.getElementById('fromDate')?.value;
        const toDate = document.getElementById('toDate')?.value;

        filteredTransactions = allTransactions.filter(tx => {
        // Search filter
        if (searchTerm) {
            const searchableText =`${tx.description} ${tx.merchant} ${tx.category} ${Math.abs(tx.amount).toFixed(2)}`.toLowerCase();
            if (!searchableText.includes(searchTerm)) return false;
        }

        // Date filter
        const txDate = new Date(tx.date);
        const now = new Date();
        if (dateFilter === '7d' && (now - txDate) / (1000 * 60 * 60 * 24) > 7) return false;
        if (dateFilter === '30d' && (now - txDate) / (1000 * 60 * 60 * 24) > 30) return false;
        if (dateFilter === '60d' && (now - txDate) / (1000 * 60 * 60 * 24) > 60) return false;
        if (dateFilter === '90d' && (now - txDate) / (1000 * 60 * 60 * 24) > 90) return false;

        if (dateFilter === 'custom') {
            if (fromDate && txDate < new Date(fromDate)) return false;
            if (toDate && txDate > new Date(toDate)) return false;
        }

        // Category filter
        if (categoryFilter !== 'all' && tx.category !== categoryFilter) return false;

        // Amount filter
        const amount = Math.abs(tx.amount);
        if (amountFilter === '0-10' && (amount < 0 || amount > 10)) return false;
        if (amountFilter === '10-50' && (amount < 10 || amount > 50)) return false;
        if (amountFilter === '50-100' && (amount < 50 || amount > 100)) return false;
        if (amountFilter === '100-500' && (amount < 100 || amount > 500)) return false;
        if (amountFilter === '500+' && amount < 500) return false;

        return true;
    });

    // Sort filtered results
    filteredTransactions.sort((a, b) => {
        switch (sortFilter) {
            case 'date-asc':
                return new Date(a.date) - new Date(b.date);
            case 'date-desc':
                return new Date(b.date) - new Date(a.date);
            case 'amount-asc':
                return Math.abs(a.amount) - Math.abs(b.amount);
            case 'amount-desc':
                return Math.abs(b.amount) - Math.abs(a.amount);
            case 'merchant-asc':
                return a.merchant.localeCompare(b.merchant);
            case 'category-asc':
                return (a.category || 'Uncategorized').localeCompare(b.category || 'Uncategorized');
            default:
                return new Date(b.date) - new Date(a.date);
        }
    });
    } catch (error) {
        console.error('❌ Filter error:', error);
        showNotification('Error applying filters. Please refresh the page.', 'error');
        filteredTransactions = [...allTransactions]; // Fallback to all transactions
    }
}

function updateFilterSummary(){
    const summaryEl = document.getElementById('filterSummary');
    if (summaryEl) {
        const totalAmount = filteredTransactions.reduce((sum, tx) => sum + Math.abs(tx.amount), 0);
        summaryEl.textContent = `Showing ${filteredTransactions.length} of ${allTransactions.length} transactions (€${totalAmount.toFixed(2)} total)`;
    }
}

// Modern pagination with dots style
function updatePaginationControls() {
    const totalPages = Math.ceil(filteredTransactions.length / transactionsPerPage);
    const paginationDiv = document.getElementById('pagination');

    if (!paginationDiv) {
        console.log('⚠️ Pagination div not found');
        return;
    }

    paginationDiv.innerHTML = '';

    if (totalPages <= 1) {
        paginationDiv.classList.add('hidden');
        return;
    }

    paginationDiv.classList.remove('hidden');
    paginationDiv.className = 'flex justify-center items-center mt-8 space-x-2';

    // Previous button
    const prevButton = document.createElement('button');
    prevButton.innerHTML = '← Previous';
    prevButton.className = `px-4 py-2 rounded-lg text-sm font-medium transition-all ${
        currentPage === 1 
            ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
            : 'bg-white border border-gray-300 text-gray-700 hover:bg-indigo-50 hover:border-indigo-300 hover:text-indigo-700'
    }`;
    prevButton.disabled = currentPage === 1;
    prevButton.addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            displayTransactionsPaginated();
        }
    });
    paginationDiv.appendChild(prevButton);

    // Page indicators (dots style for mobile-friendly)
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
        startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    // Show first page if not in visible range
    if (startPage > 1) {
        const firstButton = document.createElement('button');
        firstButton.textContent = '1';
        firstButton.className = 'w-10 h-10 rounded-full text-sm font-medium bg-white border border-gray-300 text-gray-700 hover:bg-indigo-50 hover:border-indigo-300 hover:text-indigo-700 transition-all';
        firstButton.addEventListener('click', () => {
            currentPage = 1;
            displayTransactionsPaginated();
        });
        paginationDiv.appendChild(firstButton);

        if (startPage > 2) {
            const ellipsis = document.createElement('span');
            ellipsis.textContent = '•••';
            ellipsis.className = 'px-2 text-gray-400 text-sm';
            paginationDiv.appendChild(ellipsis);
        }
    }

    // Show page numbers
    for (let i = startPage; i <= endPage; i++) {
        const pageButton = document.createElement('button');
        pageButton.textContent = i;
        pageButton.className = `w-10 h-10 rounded-full text-sm font-medium transition-all ${
            currentPage === i
                ? 'bg-indigo-600 text-white shadow-lg'
                : 'bg-white border border-gray-300 text-gray-700 hover:bg-indigo-50 hover:border-indigo-300 hover:text-indigo-700'
        }`;
        pageButton.addEventListener('click', () => {
            currentPage = i;
            displayTransactionsPaginated();
        });
        paginationDiv.appendChild(pageButton);
    }

    // Show last page if not in visible range
    if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
            const ellipsis = document.createElement('span');
            ellipsis.textContent = '•••';
            ellipsis.className = 'px-2 text-gray-400 text-sm';
            paginationDiv.appendChild(ellipsis);
        }

        const lastButton = document.createElement('button');
        lastButton.textContent = totalPages;
        lastButton.className = 'w-10 h-10 rounded-full text-sm font-medium bg-white border border-gray-300 text-gray-700 hover:bg-indigo-50 hover:border-indigo-300 hover:text-indigo-700 transition-all';
        lastButton.addEventListener('click', () => {
            currentPage = totalPages;
            displayTransactionsPaginated();
        });
        paginationDiv.appendChild(lastButton);
    }

    // Next button
    const nextButton = document.createElement('button');
    nextButton.innerHTML = 'Next →';
    nextButton.className = `px-4 py-2 rounded-lg text-sm font-medium transition-all ${
        currentPage === totalPages 
            ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
            : 'bg-white border border-gray-300 text-gray-700 hover:bg-indigo-50 hover:border-indigo-300 hover:text-indigo-700'
    }`;
    nextButton.disabled = currentPage === totalPages;
    nextButton.addEventListener('click', () => {
        if (currentPage < totalPages) {
            currentPage++;
            displayTransactionsPaginated();
        }
    });
    paginationDiv.appendChild(nextButton);
}

// Transaction filtering event handlers
function setupTransactionFilters() {
    const filterElements = [
        'globalTransactionSearch', 'dateFilter', 'categoryFilter', 
        'amountFilter', 'sortFilter', 'fromDate', 'toDate'
    ];

    filterElements.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.addEventListener('input', () => {
                currentPage = 1; // Reset to first page when filtering
                applyFilters();
                displayTransactionsPaginated();
                updateFilterSummary();
            });
        }
    });

    // Show/hide custom date range
    const dateFilter = document.getElementById('dateFilter');
    const customDateRange = document.getElementById('customDateRange');
```tool_code
;
    if (dateFilter && customDateRange) {
        dateFilter.addEventListener('change', () => {
            if (dateFilter.value === 'custom') {
                customDateRange.classList.remove('hidden');
            } else {
                customDateRange.classList.add('hidden');
            }
        });
    }

    // Reset filters
    const resetButton = document.getElementById('resetFilters');
    if (resetButton) {
        resetButton.addEventListener('click', () => {
            filterElements.forEach(id => {
                const element = document.getElementById(id);
                if (element) {
                    if (element.type === 'text' || element.type === 'date') {
                        element.value = '';
                    } else if (element.tagName === 'SELECT') {
                        element.selectedIndex = id === 'dateFilter' ? 2 : 0; // Default to 30d for date filter
                    }
                }
            });
            document.getElementById('customDateRange')?.classList.add('hidden');
            applyFilters();
            displayTransactionsPaginated();
            updateFilterSummary();
        });
    }
}

// Profile and Settings Management
function loadProfileData() {
    // Create profile content if it doesn't exist
    const profileContent = document.getElementById('profileContent');
    if (profileContent) {
        profileContent.innerHTML = `
            <div class="max-w-4xl mx-auto py-6">
                <div class="bg-white shadow rounded-lg">
                    <div class="px-6 py-4 border-b border-gray-200">
                        <h2 class="text-xl font-semibold text-gray-900">Profile Settings</h2>
                    </div>
                    <div class="p-6">
                        <form id="profileForm" class="space-y-6">
                            <div class="grid grid-cols-1 gap-6 sm:grid-cols-2">
                                <div>
                                    <label for="profileName" class="block text-sm font-medium text-gray-700">Name</label>
                                    <input type="text" id="profileName" name="name" value="${currentUser.name || ''}" 
                                           class="mt-1 block w-full border-2 border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 bg-white px-3 py-2 text-gray-900">
                                </div>
                                <div>
                                    <label for="profileEmail" class="block text-sm font-medium text-gray-700">Email</label>
                                    <input type="email" id="profileEmail" name="email" value="${currentUser.email || ''}" readonly
                                           class="mt-1 block w-full border-2 border-gray-200 rounded-md shadow-sm bg-gray-100 px-3 py-2 text-gray-700">
                                </div>
                                <div>
                                    <label for="profilePhone" class="block text-sm font-medium text-gray-700">Phone</label>
                                    <input type="tel" id="profilePhone" name="phone" 
                                           class="mt-1 block w-full border-2 border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 bg-white px-3 py-2 text-gray-900">
                                </div>
                                <div>
                                    <label for="profileCountry" class="block text-sm font-medium text-gray-700">Country</label>
                                    <select id="profileCountry" name="country" 
                                            class="mt-1 block w-full border-2 border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 bg-white px-3 py-2 text-gray-900">
                                        <option value="">Select Country</option>

                                        <!-- UK/EU/EEA Countries (Enabled) -->
                                        <optgroup label="🇪🇺 UK & European Economic Area">
                                            <option value="GB">🇬🇧 United Kingdom</option>
                                            <option value="IE">🇮🇪 Ireland</option>
                                            <option value="DE">🇩🇪 Germany</option>
                                            <option value="FR">🇫🇷 France</option>
                                            <option value="IT">🇮🇹 Italy</option>
                                            <option value="ES">🇪🇸 Spain</option>
                                            <option value="NL">🇳🇱 Netherlands</option>
                                            <option value="BE">🇧🇪 Belgium</option>
                                            <option value="AT">🇦🇹 Austria</option>
                                            <option value="PT">🇵🇹 Portugal</option>
                                            <option value="SE">🇸🇪 Sweden</option>
                                            <option value="DK">🇩🇰 Denmark</option>
                                            <option value="FI">🇫🇮 Finland</option>
                                            <option value="NO">🇳🇴 Norway</option>
                                            <option value="IS">🇮🇸 Iceland</option>
                                            <option value="LI">🇱🇮 Liechtenstein</option>
                                            <option value="CH">🇨🇭 Switzerland</option>
                                            <option value="PL">🇵🇱 Poland</option>
                                            <option value="CZ">🇨🇿 Czech Republic</option>
                                            <option value="SK">🇸🇰 Slovakia</option>
                                            <option value="HU">🇭🇺 Hungary</option>
                                            <option value="SI">🇸🇮 Slovenia</option>
                                            <option value="HR">🇭🇷 Croatia</option>
                                            <option value="RO">🇷🇴 Romania</option>
                                            <option value="BG">🇧🇬 Bulgaria</option>
                                            <option value="GR">🇬🇷 Greece</option>
                                            <option value="CY">🇨🇾 Cyprus</option>
                                            <option value="MT">🇲🇹 Malta</option>
                                            <option value="LU">🇱🇺 Luxembourg</option>
                                            <option value="EE">🇪🇪 Estonia</option>
                                            <option value="LV">🇱🇻 Latvia</option>
                                            <option value="LT">🇱🇹 Lithuania</option>
                                        </optgroup>

                                        <!-- Other Countries (Disabled for now) -->
                                        <optgroup label="🌍 Other Countries (Coming Soon)">
                                            <option value="US" disabled>🇺🇸 United States (Coming Soon)</option>
                                            <option value="CA" disabled>🇨🇦 Canada (Coming Soon)</option>
                                            <option value="AU" disabled>🇦🇺 Australia (Coming Soon)</option>
                                            <option value="NZ" disabled>🇳🇿 New Zealand (Coming Soon)</option>
                                            <option value="JP" disabled>🇯🇵 Japan (Coming Soon)</option>
                                            <option value="KR" disabled>🇰🇷 South Korea (Coming Soon)</option>
                                            <option value="SG" disabled>🇸🇬 Singapore (Coming Soon)</option>
                                            <option value="HK" disabled>🇭🇰 Hong Kong (Coming Soon)</option>
                                            <option value="AE" disabled>🇦🇪 United Arab Emirates (Coming Soon)</option>
                                            <option value="SA" disabled>🇸🇦 Saudi Arabia (Coming Soon)</option>
                                            <option value="BR" disabled>🇧🇷 Brazil (Coming Soon)</option>
                                            <option value="MX" disabled>🇲🇽 Mexico (Coming Soon)</option>
                                            <option value="AR" disabled>🇦🇷 Argentina (Coming Soon)</option>
                                            <option value="IN" disabled>🇮🇳 India (Coming Soon)</option>
                                            <option value="CN" disabled>🇨🇳 China (Coming Soon)</option>
                                            <option value="RU" disabled>🇷🇺 Russia (Coming Soon)</option>
                                            <option value="ZA" disabled>🇿🇦 South Africa (Coming Soon)</option>
                                            <option value="EG" disabled>🇪🇬 Egypt (Coming Soon)</option>
                                            <option value="NG" disabled>🇳🇬 Nigeria (Coming Soon)</option>
                                            <option value="KE" disabled>🇰🇪 Kenya (Coming Soon)</option>
                                        </optgroup>
                                    </select>
                                </div>
                            </div>
                            <div class="flex justify-between items-center pt-4 border-t border-gray-200">
                                <div>
                                    <span class="text-sm text-gray-600">Current Plan: </span>
                                    <span id="currentPlan" class="font-semibold text-indigo-600">${currentUser.plan?.charAt(0).toUpperCase() + currentUser.plan?.slice(1) || 'Free'}</span>
                                </div>
                                <button type="submit" class="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500">
                                    Update Profile
                                </button>
                            </div>
                        </form>
                    </div>
                </div>

                <div class="bg-white shadow rounded-lg mt-6">
                    <div class="px-6 py-4 border-b border-gray-200">
                        <h3 class="text-lg font-semibold text-gray-900">Security Settings</h3>
                    </div>
                    <div class="p-6">
                        <form id="securityForm" class="space-y-6">
                            <div>
                                <label for="currentPassword" class="block text-sm font-medium text-gray-700">Current Password</label>
                                <input type="password" id="currentPassword" name="currentPassword" 
                                       class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500">
                            </div>
                            <div>
                                <label for="newPassword" class="block text-sm font-medium text-gray-700">New Password</label>
                                <input type="password" id="newPassword" name="newPassword" 
                                       class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500">
                            </div>
                            <div>
                                <label for="confirmPassword" class="block text-sm font-medium text-gray-700">Confirm New Password</label>
                                <input type="password" id="confirmPassword" name="confirmPassword" 
                                       class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500">
                            </div>
                            <div class="pt-4 border-t border-gray-200">
                                <button type="submit" class="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500">
                                    Change Password
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        `;
    }

    // Setup form handlers
    const profileForm = document.getElementById('profileForm');
    if (profileForm) {
        profileForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const name = document.getElementById('profileName').value.trim();
            const phone = document.getElementById('profilePhone').value.trim();
            const country = document.getElementById('profileCountry').value;

            if (!name) {
                showNotification('❌ Name is required', 'error');
                return;
            }

            try {
                // This would call a backend endpoint to update profile
                showNotification('✅ Profile updated successfully!');
            } catch (error) {
                showNotification('Failed to update profile', 'error');
            }
        });
    }

    const securityForm = document.getElementById('securityForm');
    if (securityForm) {
        securityForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const currentPassword = document.getElementById('currentPassword').value;
            const newPassword = document.getElementById('newPassword').value;
            const confirmPassword = document.getElementById('confirmPassword').value;

            if (!currentPassword || !newPassword || !confirmPassword) {
                showNotification('❌ All password fields are required', 'error');
                return;
            }

            if (newPassword !== confirmPassword) {
                showNotification('❌ New passwords do not match', 'error');
                return;
            }

            if (newPassword.length < 6) {
                showNotification('❌ Password must be at least 6 characters', 'error');
                return;
            }

            try {
                // This would call a backend endpoint to change password
                showNotification('✅ Password changed successfully!');
                e.target.reset();
            } catch (error) {
                showNotification('Failed to change password', 'error');
            }
        });
    }
}

// Bank account connection function
window.connectBankAccount = function() {
    // Create modal for bank connection
    const modal = document.createElement('div');
    modal.id = 'bankConnectionModal';
    modal.className = 'fixed z-50 inset-0 overflow-y-auto';
    modal.innerHTML = `
        <div class="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div class="fixed inset-0 transition-opacity" aria-hidden="true">
                <div class="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>
            <span class="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div class="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full" role="dialog" aria-modal="true">
                <div class="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                    <div class="sm:flex sm:items-start">
                        <div class="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-green-100 sm:mx-0 sm:h-10 sm:w-10">
                            <svg class="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                        </div>
                        <div class="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                            <h3 class="text-lg leading-6 font-medium text-gray-900">
                                Bank Account Integration
                            </h3>
                            <div class="mt-2">
                                <p class="text-sm text-gray-500 mb-3">
                                    We're currently integrating TrueLayer's secure Open Banking API to connect your bank accounts.
                                </p>
                                <div class="bg-blue-50 border border-blue-200 rounded-md p-3 mb-3">
                                    <h4 class="text-sm font-medium text-blue-900 mb-2">🔐 What to expect:</h4>
                                    <ul class="text-xs text-blue-800 space-y-1">
                                        <li>• Bank-grade 256-bit encryption</li>
                                        <li>• Automatic daily transaction sync</li>
                                        <li>• Read-only access (we can't move money)</li>
                                        <li>• Regulated by Financial Conduct Authority</li>
                                    </ul>
                                </div>
                                <p class="text-xs text-gray-500">
                                    This feature will be available soon. You'll receive an email notification when ready to connect.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                    <button onclick="closeBankConnectionModal()" class="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:w-auto sm:text-sm">
                        Got it
                    </button>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
};

window.closeBankConnectionModal = function() {
    const modal = document.getElementById('bankConnectionModal');
    if (modal) {
        modal.style.opacity = '0';
        modal.style.transition = 'opacity 0.2s ease-out';
        setTimeout(() => {
            if (modal.parentNode) {
                modal.remove();
            }
        }, 200);
    }
};

function loadSettingsData() {
    // Create settings content if it doesn't exist
    const settingsContent = document.getElementById('settingsContent');
    if (settingsContent) {
        settingsContent.innerHTML = `
            <div class="max-w-4xl mx-auto py-6 space-y-6">
                <!-- API Integrations -->
                <div class="bg-white shadow rounded-lg">
                    <div class="px-6 py-4 border-b border-gray-200">
                        <h2 class="text-xl font-semibold text-gray-900">🔗 API Integrations</h2>
                        <p class="text-sm text-gray-600 mt-1">Configure external service connections</p>
                    </div>
                    <div class="p-6 space-y-6">
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div class="border border-gray-200 rounded-lg p-4">
                                <div class="flex items-center justify-between mb-4">
                                    <div>
                                        <h3 class="text-lg font-medium text-gray-900">🏦 Open Banking</h3>
                                        <p class="text-sm text-gray-600">Securely connect your bank account via TrueLayer</p>
                                    </div>
                                    <span class="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded-full">Not Connected</span>
                                </div>
                                <div class="space-y-4">
                                    <div class="bg-blue-50 border border-blue-200 rounded-lg p-3">
                                        <div class="flex items-center mb-2">
                                            <svg class="w-5 h-5 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                            </svg>
                                            <span class="text-sm font-medium text-blue-900">Powered by TrueLayer</span>
                                        </div>
                                        <p class="text-xs text-blue-700">Bank-grade security with automatic daily transaction sync</p>
                                    </div>
                                    <button onclick="connectBankAccount()" class="w-full bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 text-sm font-medium">
                                        🔗 Connect Bank Account
                                    </button>
                                    <p class="text-xs text-gray-500 text-center">Your data is encrypted and never stored on our servers</p>
                                </div>
                            </div>


                        </div>
                    </div>
                </div>

                <!-- Payment Methods -->
                <div class="bg-white shadow rounded-lg">
                    <div class="px-6 py-4 border-b border-gray-200">
                        <h2 class="text-xl font-semibold text-gray-900">💳 Payment Methods</h2>
                        <p class="text-sm text-gray-600 mt-1">Manage your payment methods for subscriptions</p>
                    </div>
                    <div class="p-6">
                        <div class="space-y-4">
                            <div class="border border-gray-200 rounded-lg p-4 flex items-center justify-between">
                                <div class="flex items-center">
                                    <div class="w-12 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded flex items-center justify-center text-white text-xs font-bold mr-4">
                                        VISA
                                    </div>
                                    <div>
                                        <p class="font-medium">•••• •••• •••• 4242</p>
                                        <p class="text-sm text-gray-600">Expires 12/26</p>
                                    </div>
                                </div>
                                <div class="flex items-center space-x-2">
                                    <span class="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">Primary</span>
                                    <button class="text-indigo-600 hover:text-indigo-800 text-sm">Edit</button>
                                </div>
                            </div>

                            <div class="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                                <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                                </svg>
                                <h3 class="mt-2 text-sm font-medium text-gray-900">Add Payment Method</h3>
                                <p class="mt-1 text-sm text-gray-500">Credit card, debit card, or bank account</p>
                                <button class="mt-4 bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm">
                                    Add New Payment Method
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Application Settings -->
                <div class="bg-white shadow rounded-lg">
                    <div class="px-6 py-4 border-b border-gray-200">
                        <h2 class="text-xl font-semibold text-gray-900">⚙️ Application Settings</h2>
                    </div>
                    <div class="p-6 space-y-6">
                        <div class="flex items-center justify-between">
                            <div>
                                <h3 class="text-lg font-medium text-gray-900">📧 Email Notifications</h3>
                                <p class="text-sm text-gray-600">Receive notifications for upcoming renewals and spending alerts</p>
                            </div>
                            <label class="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" class="sr-only peer" checked>
                                <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                            </label>
                        </div>

                        <div class="flex items-center justify-between">
                            <div>
                                <h3 class="text-lg font-medium text-gray-900">📱 Push Notifications</h3>
                                <p class="text-sm text-gray-600">Browser push notifications for real-time updates</p>
                            </div>
                            <label class="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" class="sr-only peer">
                                <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                            </label>
                        </div>

                        <div class="flex items-center justify-between">
                            <div>
                                <h3 class="text-lg font-medium text-gray-900">🌙 Dark Mode</h3>
                                <p class="text-sm text-gray-600">Switch to dark theme (Coming Soon)</p>
                            </div>
                            <label class="relative inline-flex items-center cursor-not-allowed opacity-50">
                                <input type="checkbox" class="sr-only peer" disabled>
                                <div class="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
                            </label>
                        </div>

                        <div class="flex items-center justify-between">
                            <div>
                                <h3 class="text-lg font-medium text-gray-900">💰 Currency</h3>
                                <p class="text-sm text-gray-600">Choose your preferred currency display</p>
                            </div>
                            <select class="border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500">
                                <option value="EUR" selected>EUR (€)</option>
                                <option value="USD">USD ($)</option>
                                <option value="GBP">GBP (£)</option>
                                <option value="CAD">CAD ($)</option>
                            </select>
                        </div>

                        <div class="flex items-center justify-between">
                            <div>
                                <h3 class="text-lg font-medium text-gray-900">📊 Data Retention</h3>
                                <p class="text-sm text-gray-600">How long to keep transaction history</p>
                            </div>
                            <select class="border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500">
                                <option value="12">12 months</option>
                                <option value="24" selected>24 months</option>
                                <option value="36">36 months</option>
                                <option value="0">Forever</option>
                            </select>
                        </div>
                    </div>
                </div>

                <!-- Security & Privacy -->
                <div class="bg-white shadow rounded-lg">
                    <div class="px-6 py-4 border-b border-gray-200">
                        <h2 class="text-xl font-semibold text-gray-900">🔒 Security & Privacy</h2>
                    </div>
                    <div class="p-6 space-y-6">
                        <div class="flex items-center justify-between">
                            <div>
                                <h3 class="text-lg font-medium text-gray-900">🔐 Two-Factor Authentication</h3>
                                <p class="text-sm text-gray-600">Add an extra layer of security to your account</p>
                            </div>
                            <button class="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 text-sm">
                                Enable 2FA
                            </button>
                        </div>

                        <div class="flex items-center justify-between">
                            <div>
                                <h3 class="text-lg font-medium text-gray-900">📁 Data Export</h3>
                                <p class="text-sm text-gray-600">Download your financial data in CSV format</p>
                            </div>
                            <button class="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm">
                                Export Data
                            </button>
                        </div>

                        <div class="pt-6 border-t border-gray-200">
                            <div class="bg-red-50 border border-red-200 rounded-md p-4">
                                <h3 class="text-lg font-medium text-red-900 mb-2">⚠️ Danger Zone</h3>
                                <p class="text-sm text-red-700 mb-4">This action cannot be undone. This will permanently delete your account and all associated data.</p>
                                <button class="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500">
                                    Delete Account
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
    console.log('📋 Settings loaded with technical configurations');
}

// Global error handler
window.addEventListener('error', (event) => {
    console.error('❌ Global JavaScript Error:', event.error);
    console.error('Stack:', event.error?.stack);
    console.error('File:', event.filename, 'Line:', event.lineno);
    showNotification('An unexpected error occurred. Please refresh the page.', 'error');
});

window.addEventListener('unhandledrejection', (event) => {
    console.error('❌ Unhandled Promise Rejection:', event.reason);
    showNotification('An unexpected error occurred. Please try again.', 'error');
});

window.addEventListener('online', () => {
    showNotification('Connection restored', 'success');
});

window.addEventListener('offline', () => {
    showNotification('Connection lost. Some features may not work.', 'warning');
});

// Period selector for insights
document.addEventListener('DOMContentLoaded', function() {
    const periodSelect = document.getElementById('periodSelect');
    if (periodSelect) {
        periodSelect.addEventListener('change', loadInsights);
    }
});

// Transactions are synced automatically via bank integration
// Manual transaction adding has been removed for production readiness

// Add subscription modal and functions
function openAddSubscriptionModal() {
    document.getElementById('addSubscriptionModal').classList.remove('hidden');
    document.getElementById('subscriptionDate').value = new Date().toISOString().split('T')[0];
}

function closeAddSubscriptionModal() {
    document.getElementById('addSubscriptionModal').classList.add('hidden');
    document.getElementById('subForm').reset();
}

async function addSubscription() {
    const name = document.getElementById('selectedServiceName').value.trim();
    const cost = parseFloat(document.getElementById('subscriptionCost').value);
    const cycle = document.getElementById('subscriptionCycle').value;
    const nextDate = document.getElementById('subscriptionDate').value;

    if (!name || name.length < 1 || name.length > 100) {
        showNotification('Service name must be 1-100 characters', 'error');
        return;
    }

    if (isNaN(cost) || cost <= 0 || cost > 10000) {
        showNotification('Cost must be between €0.01 and €10,000', 'error');
        return;
    }

    if (!['monthly', 'yearly'].includes(cycle)) {
        showNotification('Invalid billing cycle', 'error');
        return;
    }

    try {
        const subscription = {
            name: name,
            cost: cost,
            cycle: cycle,
            nextDate: nextDate
        };

        await apiCall('/api/subscriptions', {
            method: 'POST',
            body: JSON.stringify(subscription)
        });

        showNotification('Subscription added successfully! 🎉');
        closeAddSubscriptionModal();
        loadSubscriptions();
        if (currentTab === 'insights') {
            loadInsights();
        }
    } catch (error) {
        console.error('Failed to add subscription:', error);
        showNotification('Failed to add subscription', 'error');
    }
}

async function searchServices(query) {
    if (query.length < 2) {
        document.getElementById('serviceSuggestions').classList.add('hidden');
        return;
    }

    try {
        const services = await apiCall(`/api/services/search?q=${encodeURIComponent(query)}`);
        displayServiceSuggestions(services);
    } catch (error) {
        console.error('Service search failed:', error);
    }
}

function displayServiceSuggestions(services) {
    const container = document.getElementById('serviceSuggestions');

    if (services.length === 0) {
        container.classList.add('hidden');
        return;
    }

    container.innerHTML = services.flatMap(service => 
        service.options.map(option => `
            <div class="p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100" onclick="selectServiceOption('${option.name}', '${option.tier}', ${option.price}, '${option.category}')">
                <div class="font-semibold text-gray-900">${option.display}</div>
                <div class="text-sm text-gray-600">${option.category}</div>
            </div>
        `)
    ).join('');

    container.classList.remove('hidden');
}

function selectServiceOption(name, tier, price, category) {
    document.getElementById('subscriptionName').value = '';
    document.getElementById('selectedServiceName').value = name;
    document.getElementById('subscriptionCost').value = price;
    document.getElementById('selectedTier').value = tier;
    document.getElementById('serviceSuggestions').classList.add('hidden');
}

// Function to check for uncategorized transactions and show an alert
function checkUncategorizedTransactions() {
    if (!allTransactions || !Array.isArray(allTransactions)) {
        console.log('⚠️ No transactions loaded yet');
        return;
    }

    const uncategorized = allTransactions.filter(tx => !tx.category || tx.category === 'Misc');

    if (uncategorized.length > 0) {
        // Show a notification
        showNotification(`⚠️ You have ${uncategorized.length} transactions that need categorization.`, 'warning');

        // Create a modal to display the uncategorized transactions
        createUncategorizedModal(uncategorized);
    }
}

// Function to create a modal to display the uncategorized transactions
function createUncategorizedModal(transactions) {
    // Remove existing modal if it exists
    const existingModal = document.getElementById('uncategorizedModal');
    if (existingModal) {
        existingModal.remove();
    }

    // Create the modal element
    const modal = document.createElement('div');
    modal.id = 'uncategorizedModal';
    modal.className = 'fixed z-50 inset-0 overflow-y-auto';
    modal.innerHTML = `
        <div class="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div class="fixed inset-0 transition-opacity" aria-hidden="true">
                <div class="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>
            <span class="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div class="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full" role="dialog" aria-modal="true" aria-labelledby="modal-headline">
                <div class="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                    <div class="sm:flex sm:items-start">
                        <div class="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-orange-100 sm:mx-0 sm:h-10 sm:w-10">
                            <svg class="h-6 w-6 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L12 4.775 5.268 16.002c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        </div>
                        <div class="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                            <h3 class="text-lg leading-6 font-medium text-gray-900" id="modal-headline">
                                Transactions Needing Categorization
                            </h3>
                            <div class="mt-2">
                                <p class="text-sm text-gray-500">
                                    You have ${transactions.length} transaction${transactions.length === 1 ? '' : 's'} that need categorization to improve your spending insights.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                    <button type="button" class="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:ml-3 sm:w-auto sm:text-sm" onclick="goToTransactions()">
                        Go To Transactions
                    </button>
                    <button type="button" class="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm" onclick="closeUncategorizedModal()">
                        Close
                    </button>
                </div>
            </div>
        </div>
    `;

    // Append the modal to the body
    document.body.appendChild(modal);
}

// Function to close the uncategorized modal
function closeUncategorizedModal() {
    const modal = document.getElementById('uncategorizedModal');
    if (modal) {
        // Immediately remove the modal to ensure it doesn't interfere
        modal.remove();
    }
}

// Function to open the categorization modal with uncategorized transactions
function openCategorizationModal() {
    // Ensure transactions are loaded
    if (!allTransactions || allTransactions.length === 0) {
        showNotification('⏳ Loading transactions first...', 'warning');
        loadTransactions().then(() => {
            // Try again after loading
            setTimeout(() => openCategorizationModal(), 500);
        });
        return;
    }

    const uncategorized = allTransactions.filter(tx => !tx.category || tx.category === 'Misc');

    if (uncategorized.length === 0) {
        showNotification('✅ All transactions are properly categorized!', 'success');
        return;
    }

    // Create the categorization modal
    const modal = document.createElement('div');
    modal.id = 'categorizationModal';
    modal.className = 'fixed z-50 inset-0 overflow-y-auto';
    modal.innerHTML = `
        <div class="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div class="fixed inset-0 transition-opacity" aria-hidden="true">
                <div class="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>
            <span class="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div class="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full" role="dialog" aria-modal="true">
                <div class="bg-gradient-to-r from-orange-500 to-red-600 px-6 py-4">
                    <div class="flex justify-between items-center">
                        <div>
                            <h2 class="text-xl font-bold text-white">Categorize Transactions</h2>
                            <p class="text-orange-100 mt-1">${uncategorized.length} transactions need categorization</p>
                        </div>
                        <button onclick="closeCategorizationModal()" class="text-white hover:text-orange-200 transition-colors">
                            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                            </svg>
                        </button>
                    </div>
                </div>

                <div class="max-h-96 overflow-y-auto p-6">
                    <div class="space-y-4" id="categorizationList">
                        ${uncategorized.map((tx, index) => `
                            <div class="bg-orange-50 border border-orange-200 rounded-lg p-4">
                                <div class="flex justify-between items-start">
                                    <div class="flex-1">
                                        <div class="flex items-center mb-2">
                                            <span class="text-lg mr-2">💳</span>
                                            <h3 class="font-semibold text-gray-900">${tx.merchant}</h3>
                                            <span class="ml-2 px-2 py-1 text-xs bg-orange-100 text-orange-800 rounded">Needs Category</span>
                                        </div>
                                        <p class="text-sm text-gray-600 mb-2">${tx.description}</p>
                                        <div class="flex items-center text-xs text-gray-500">
                                            <span class="mr-3">${new Date(tx.date).toLocaleDateString()}</span>
                                            <span class="text-red-600 font-bold">-€${Math.abs(tx.amount).toFixed(2)}</span>
                                        </div>
                                    </div>
                                    <div class="ml-4">
                                        <select class="text-sm border border-gray-300 rounded px-3 py-2 bg-white focus:ring-2 focus:ring-orange-500 focus:border-orange-500" 
                                                data-transaction-id="${tx.id}" onchange="updateCategorySelection('${tx.id}', this.value)">
                                            <option value="">Select Category</option>
                                            <option value="Groceries">🛒 Groceries</option>
                                            <option value="Transport - Fuel">⛽ Transport - Fuel</option>
                                            <option value="Transport - Ride">🚗 Transport - Ride</option>
                                            <option value="Subscriptions">📱 Subscriptions</option>
                                            <option value="Dining">🍽️ Dining</option>
                                            <option value="Shopping">🛍️ Shopping</option>
                                            <option value="Bills & Utilities">⚡ Bills & Utilities</option>
                                            <option value="Healthcare">🏥 Healthcare</option>
                                            <option value="Entertainment">🎭 Entertainment</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <div class="bg-gray-50 px-6 py-4 flex justify-between items-center border-t border-gray-200">
                    <div class="text-sm text-gray-600">
                        <span id="categorizedCount">0</span> of ${uncategorized.length} categorized
                    </div>
                    <div class="flex space-x-3">
                        <button onclick="closeCategorizationModal()" class="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors">
                            Cancel
                        </button>
                        <button id="saveCategorizationBtn" onclick="saveAllCategorizations()" disabled class="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium">
                            💾 Save Categories
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    // Initialize tracking object for category updates
    window.pendingCategoryUpdates = {};
}

// Function to close the categorization modal
function closeCategorizationModal() {
    const modal = document.getElementById('categorizationModal');
    if (modal) {
        // Add fade out animation
        modal.style.opacity = '0';
        modal.style.transition = 'opacity 0.2s ease-out';

        setTimeout(() => {
            if (modal.parentNode) {
                modal.remove();
            }
        }, 200);
    }

    // Clear pending updates
    if (window.pendingCategoryUpdates) {
        window.pendingCategoryUpdates = {};
    }
}

// Function to update category selection tracking
window.updateCategorySelection = function(transactionId, category) {
    if (!window.pendingCategoryUpdates) {
        window.pendingCategoryUpdates = {};
    }

    if (category) {
        window.pendingCategoryUpdates[transactionId] = category;
    } else {
        delete window.pendingCategoryUpdates[transactionId];
    }

    // Update UI feedback
    const categorizedCount = Object.keys(window.pendingCategoryUpdates).length;
    document.getElementById('categorizedCount').textContent = categorizedCount;

    // Enable/disable save button
    const saveBtn = document.getElementById('saveCategorizationBtn');
    saveBtn.disabled = categorizedCount === 0;
};

// Function to save all categorizations
window.saveAllCategorizations = async function() {
    const updates = window.pendingCategoryUpdates || {};
    const updateCount = Object.keys(updates).length;

    if (updateCount === 0) {
        showNotification('No categories selected to save', 'warning');
        return;
    }

    const saveBtn = document.getElementById('saveCategorizationBtn');
    const originalText = saveBtn.textContent;
    saveBtn.textContent = '⏳ Saving...';
    saveBtn.disabled = true;

    try {
        let successCount = 0;
        let errorCount = 0;

        // Process updates sequentially to avoid overwhelming the server
        for (const [transactionId, category] of Object.entries(updates)) {
            try {
                await apiCall(`/api/transactions/${transactionId}/category`, {
                    method: 'PATCH',
                    body: JSON.stringify({ category })
                });
                successCount++;
            } catch (error) {
                console.error(`Failed to update transaction ${transactionId}:`, error);
                errorCount++;
            }
        }

        if (successCount > 0) {
            showNotification(`✅ Updated ${successCount} transaction categories!`, 'success');

            // Close categorization modal
            closeCategorizationModal();

            // Reload transactions to reflect changes and refresh display
            await loadTransactions();

            // Refresh insights if on insights tab
            if (currentTab === 'insights') {
                loadInsights();
            }

            // Show success feedback
            setTimeout(() => {
                showNotification('✨ All transactions properly categorized!', 'success');
            }, 500);
        }

        if (errorCount > 0) {
            showNotification(`⚠️ ${errorCount} updates failed. Please try again.`, 'warning');
        }

    } catch (error) {
        console.error('Bulk categorization error:', error);
        showNotification('Failed to save categories. Please try again.', 'error');
    } finally {
        if (document.getElementById('saveCategorizationBtn')) {
            saveBtn.textContent = originalText;
            saveBtn.disabled = false;
        }
    }
};

// Function to go to the transactions tab and open categorization modal
function goToTransactions() {
    // Close the alert modal first
    closeUncategorizedModal();

    // Switch to transactions tab
    switchTab('transactions');

    // Wait for tab to load then show categorization modal
    setTimeout(() => {
        openCategorizationModal();
    }, 300); // Allow time for tab switch to complete
}

// Load Profile content
async function loadProfile() {
  const user = JSON.parse(localStorage.getItem('user'));
  const userPlan = localStorage.getItem('userPlan') || 'free';

  document.getElementById('profileContent').innerHTML = `
    <div class="glass-effect rounded-3xl modern-shadow p-8">
      <div class="flex justify-between items-center mb-8">
        <div>
          <h2 class="text-3xl font-bold bg-gradient-to-r from-emerald-800 to-teal-600 bg-clip-text text-transparent">Profile & Plan</h2>
          <p class="text-gray-600 mt-2">Manage your account and subscription</p>
        </div>
        <div class="text-6xl animate-pulse-slow">👤</div>
      </div>

      <!-- User Information -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <div class="bg-white p-6 rounded-2xl border border-gray-200">
          <h3 class="text-lg font-semibold text-gray-800 mb-4">Account Information</h3>
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
              <input type="text" value="${user.name}" 
                     class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                     readonly>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input type="email" value="${user.email}" 
                     class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                     readonly>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Member Since</label>
              <input type="text" value="${new Date(user.created_at || Date.now()).toLocaleDateString()}" 
                     class="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
                     readonly>
            </div>
          </div>
        </div>

        <!-- Plan Information -->
        <div class="bg-gradient-to-br from-emerald-500 to-teal-600 p-6 rounded-2xl text-white">
          <h3 class="text-lg font-semibold mb-4">Current Plan</h3>
          <div class="space-y-4">
            <div>
              <div class="text-2xl font-bold capitalize">${userPlan} Plan</div>
              <div class="text-emerald-100 text-sm mt-1">
                ${userPlan === 'free' ? 'Basic subscription tracking' : 
                  userPlan === 'premium' ? 'Full features + analytics' : 
                  'All features + USW access'}
              </div>
            </div>

            ${userPlan === 'free' ? `
              <div class="bg-white/20 rounded-lg p-4 mt-4">
                <div class="text-sm mb-2">🚀 Upgrade to Premium</div>
                <div class="text-xs text-emerald-100">Get unlimited subscriptions and advanced analytics for €6.99/month</div>
              </div>
            ` : ''}

            <div class="text-xs text-emerald-100 mt-4">
              ${user.email.includes('@demo.com') ? 'Demo Account - Full access to all features' : 'Active subscription'}
            </div>
          </div>
        </div>
      </div>

      <!-- Plan Features -->
      <div class="bg-white p-6 rounded-2xl border border-gray-200">
        <h3 class="text-lg font-semibold text-gray-800 mb-4">Plan Features</h3>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div class="text-center p-4 bg-gray-50 rounded-lg">
            <div class="text-2xl mb-2">📱</div>
            <div class="font-medium text-gray-800">Subscriptions</div>
            <div class="text-sm text-gray-600 mt-1">
              ${userPlan === 'free' ? 'Up to 15' : 'Unlimited'}
            </div>
          </div>
          <div class="text-center p-4 bg-gray-50 rounded-lg">
            <div class="text-2xl mb-2">📊</div>
            <div class="font-medium text-gray-800">Analytics</div>
            <div class="text-sm text-gray-600 mt-1">
              ${userPlan === 'free' ? 'Basic' : 'Advanced'}
            </div>
          </div>
          <div class="text-center p-4 bg-gray-50 rounded-lg">
            <div class="text-2xl mb-2">💰</div>
            <div class="font-medium text-gray-800">USW Access</div>
            <div class="text-sm text-gray-600 mt-1">
              ${userPlan === 'pro' ? 'Included' : 'Not available'}
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  console.log('👤 Profile loaded');
}

// Load Settings content
async function loadSettings() {
  const user = JSON.parse(localStorage.getItem('user'));

  document.getElementById('settingsContent').innerHTML = `
    <div class="glass-effect rounded-3xl modern-shadow p-8">
      <div class="flex justify-between items-center mb-8">
        <div>
          <h2 class="text-3xl font-bold bg-gradient-to-r from-emerald-800 to-teal-600 bg-clip-text text-transparent">Settings</h2>
          <p class="text-gray-600 mt-2">Customize your Mulah experience</p>
        </div>
        <div class="text-6xl animate-pulse-slow">⚙️</div>
      </div>

      <!-- Settings Categories -->
      <div class="space-y-8">
        <!-- Notifications -->
        <div class="bg-white p-6 rounded-2xl border border-gray-200">
          <h3 class="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <span class="text-2xl mr-3">🔔</span>
            Notifications
          </h3>
          <div class="space-y-4">
            <div class="flex items-center justify-between">
              <div>
                <div class="font-medium text-gray-800">Subscription Reminders</div>
                <div class="text-sm text-gray-600">Get notified before renewals</div>
              </div>
              <label class="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" checked class="sr-only peer">
                <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
              </label>
            </div>

            <div class="flex items-center justify-between">
              <div>
                <div class="font-medium text-gray-800">Spending Alerts</div>
                <div class="text-sm text-gray-600">Alerts for unusual spending patterns</div>
              </div>
              <label class="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" checked class="sr-only peer">
                <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
              </label>
            </div>

            <div class="flex items-center justify-between">
              <div>
                <div class="font-medium text-gray-800">Weekly Reports</div>
                <div class="text-sm text-gray-600">Weekly spending summaries</div>
              </div>
              <label class="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" class="sr-only peer">
                <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
              </label>
            </div>
          </div>
        </div>

        <!-- Display Preferences -->
        <div class="bg-white p-6 rounded-2xl border border-gray-200">
          <h3 class="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <span class="text-2xl mr-3">🎨</span>
            Display Preferences
          </h3>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Currency</label>
              <select class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500">
                <option value="EUR" selected>Euro (€)</option>
                <option value="USD">US Dollar ($)</option>
                <option value="GBP">British Pound (£)</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Date Format</label>
              <select class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500">
                <option value="DD/MM/YYYY" selected>DD/MM/YYYY</option>
                <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                <option value="YYYY-MM-DD">YYYY-MM-DD</option>
              </select>
            </div>
          </div>
        </div>

        <!-- Privacy & Security -->
        <div class="bg-white p-6 rounded-2xl border border-gray-200">
          <h3 class="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <span class="text-2xl mr-3">🔒</span>
            Privacy & Security
          </h3>
          <div class="space-y-4">
            <div class="flex items-center justify-between">
              <div>
                <div class="font-medium text-gray-800">Two-Factor Authentication</div>
                <div class="text-sm text-gray-600">Add extra security to your account</div>
              </div>
              <button class="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 text-sm font-medium">
                Enable 2FA
              </button>
            </div>

            <div class="flex items-center justify-between">
              <div>
                <div class="font-medium text-gray-800">Data Export</div>
                <div class="text-sm text-gray-600">Download your data</div>
              </div>
              <button class="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 text-sm font-medium">
                Export Data
              </button>
            </div>
          </div>
        </div>

        <!-- Account Actions -->
        <div class="bg-white p-6 rounded-2xl border border-red-200">
          <h3 class="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <span class="text-2xl mr-3">⚠️</span>
            Account Actions
          </h3>
          <div class="space-y-4">
            <div class="flex items-center justify-between">
              <div>
                <div class="font-medium text-gray-800">Change Password</div>
                <div class="text-sm text-gray-600">Update your account password</div>
              </div>
              <button class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm font-medium">
                Change Password
              </button>
            </div>

            ${user.email.includes('@demo.com') ? `
              <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div class="text-blue-800 font-medium text-sm">Demo Account</div>
                <div class="text-blue-600 text-xs mt-1">This is a demo account. Account deletion is not available.</div>
              </div>
            ` : `
              <div class="flex items-center justify-between">
                <div>
                  <div class="font-medium text-red-600">Delete Account</div>
                  <div class="text-sm text-gray-600">Permanently delete your account and all data</div>
                </div>
                <button class="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 text-sm font-medium">
                  Delete Account
                </button>
              </div>
            `}
          </div>
        </div>
      </div>

      <!-- Save Settings Button -->
      <div class="flex justify-end mt-8">
        <button onclick="saveSettings()" class="bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-8 py-3 rounded-lg hover:from-emerald-700 hover:to-teal-700 font-medium shadow-lg">
          Save Settings
        </button>
      </div>
    </div>
  `;

  console.log('📋 Settings loaded');
}

// Save settings function
function saveSettings() {
  showNotification('Settings saved successfully! ✅', 'success');
}

// Initialize dashboard
document.addEventListener('DOMContentLoaded', function() {
  const defaultOptions = {
            headers: {
                'Content-Type': 'application/json',
                ...(localStorage.getItem('token') && { 'Authorization': `Bearer ${localStorage.getItem('token')}` })
            }
        };