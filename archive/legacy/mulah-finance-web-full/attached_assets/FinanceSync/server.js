const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs');
const { exec } = require('child_process');

const app = express();
const PORT = process.env.PORT || 5000;

// Enhanced logging middleware
app.use((req, res, next) => {
  const logEntry = `${new Date().toISOString()} - ${req.method} ${req.url}`;
  console.log(logEntry);
  
  // Log suspicious requests for debugging
  if (req.url.includes('@') || req.url.includes(' ') || req.url.startsWith('/r ')) {
    console.log(`🚨 Suspicious request detected:`);
    console.log(`   URL: ${req.url}`);
    console.log(`   Headers: ${JSON.stringify(req.headers, null, 2)}`);
    console.log(`   User-Agent: ${req.headers['user-agent']}`);
  }
  
  next();
});

// Error logging middleware
app.use((err, req, res, next) => {
  console.error(`❌ Error on ${req.method} ${req.url}:`, err.message);
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error', details: err.message });
});

app.use(express.json({ limit: '10mb' }));
app.use(express.static('public'));

// Initialize SQLite database
const dbPath = path.join(__dirname, 'mulah.db');
const db = new sqlite3.Database(dbPath);

// Create tables and initialize data
db.serialize(() => {
  console.log('🗄️  Initializing Mulah database...');

  // Users table
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    plan TEXT DEFAULT 'free',
    token TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Subscriptions table (from SubSync)
  db.run(`CREATE TABLE IF NOT EXISTS subscriptions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    name TEXT NOT NULL,
    cost REAL NOT NULL,
    cycle TEXT NOT NULL,
    next_date TEXT NOT NULL,
    tier TEXT,
    category TEXT,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id)
  )`);

  // Add missing columns if they don't exist
  db.run(`ALTER TABLE subscriptions ADD COLUMN tier TEXT`, (err) => {
    if (err && !err.message.includes('duplicate column name')) {
      console.log('Tier column already exists or other error:', err.message);
    }
  });

  db.run(`ALTER TABLE subscriptions ADD COLUMN category TEXT`, (err) => {
    if (err && !err.message.includes('duplicate column name')) {
      console.log('Category column already exists or other error:', err.message);
    }
  });

  db.run(`ALTER TABLE subscriptions ADD COLUMN description TEXT`, (err) => {
    if (err && !err.message.includes('duplicate column name')) {
      console.log('Description column already exists or other error:', err.message);
    }
  });

  // Transactions table (from My-Finance)
  db.run(`CREATE TABLE IF NOT EXISTS transactions (
    id TEXT PRIMARY KEY,
    user_id INTEGER,
    date DATETIME NOT NULL,
    amount REAL NOT NULL,
    description TEXT NOT NULL,
    merchant TEXT NOT NULL,
    category TEXT,
    is_recurring BOOLEAN DEFAULT 0,
    iso_week INTEGER,
    month TEXT,
    enriched BOOLEAN DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id)
  )`);

  // Budgets table
  db.run(`CREATE TABLE IF NOT EXISTS budgets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    category TEXT NOT NULL,
    monthly_limit REAL NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id)
  )`);

  // Goals table
  db.run(`CREATE TABLE IF NOT EXISTS goals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    title TEXT NOT NULL,
    target_amount REAL NOT NULL,
    current_amount REAL DEFAULT 0,
    target_date DATETIME NOT NULL,
    goal_type TEXT NOT NULL,
    category TEXT,
    achieved BOOLEAN DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id)
  )`);

  // Service Catalog table
  db.run(`CREATE TABLE IF NOT EXISTS service_catalog (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    tiers TEXT,
    website TEXT,
    description TEXT
  )`);

  // Insert demo users with Mulah plan structure
  const demoUsers = [
    { name: 'Mulah Free Demo', email: 'free@demo.com', password: 'demo123', plan: 'free' },
    { name: 'Mulah Premium Demo', email: 'premium@demo.com', password: 'demo123', plan: 'premium' },
    { name: 'Mulah Pro Demo', email: 'pro@demo.com', password: 'demo123', plan: 'pro' }
  ];

  demoUsers.forEach(user => {
    db.run(
      `INSERT OR IGNORE INTO users (name, email, password, plan) VALUES (?, ?, ?, ?)`,
      [user.name, user.email, user.password, user.plan]
    );
  });

  // Insert realistic demo subscriptions with tiers
    const demoSubs = [
      // Free user subscriptions (basic tiers)
      { 
        email: 'free@demo.com', 
        name: 'Netflix', 
        cost: 8.99, 
        cycle: 'monthly', 
        next_date: '2025-02-05',
        tier: 'Basic',
        category: 'Entertainment',
        description: 'Standard streaming plan'
      },
      { 
        email: 'free@demo.com', 
        name: 'Spotify', 
        cost: 9.99, 
        cycle: 'monthly', 
        next_date: '2025-02-08',
        tier: 'Premium',
        category: 'Entertainment',
        description: 'Ad-free music streaming'
      },
      { 
        email: 'free@demo.com', 
        name: 'Amazon Prime', 
        cost: 8.99, 
        cycle: 'monthly', 
        next_date: '2025-02-12',
        tier: 'Standard',
        category: 'Shopping',
        description: 'Fast shipping & Prime Video'
      },
      { 
        email: 'free@demo.com', 
        name: 'iCloud Storage', 
        cost: 2.99, 
        cycle: 'monthly', 
        next_date: '2025-02-18',
        tier: '200GB',
        category: 'Cloud Storage',
        description: 'Apple cloud storage'
      },

      // Premium user subscriptions (higher tiers)
      { 
        email: 'premium@demo.com', 
        name: 'Netflix', 
        cost: 15.49, 
        cycle: 'monthly', 
        next_date: '2025-02-03',
        tier: 'Premium',
        category: 'Entertainment',
        description: '4K streaming on 4 screens'
      },

      // Pro user subscriptions (full feature access)
      { 
        email: 'pro@demo.com', 
        name: 'Netflix', 
        cost: 15.49, 
        cycle: 'monthly', 
        next_date: '2025-02-02',
        tier: 'Premium',
        category: 'Entertainment',
        description: '4K streaming via Mulah USW'
      },
      { 
        email: 'pro@demo.com', 
        name: 'Adobe Creative Cloud', 
        cost: 52.99, 
        cycle: 'monthly', 
        next_date: '2025-02-14',
        tier: 'All Apps',
        category: 'Software',
        description: 'Complete suite via USW'
      },
      { 
        email: 'pro@demo.com', 
        name: 'Spotify', 
        cost: 15.99, 
        cycle: 'monthly', 
        next_date: '2025-02-07',
        tier: 'Family',
        category: 'Entertainment',
        description: 'Music via Mulah Mesh'
      },
      { 
        email: 'pro@demo.com', 
        name: 'Microsoft 365', 
        cost: 12.99, 
        cycle: 'monthly', 
        next_date: '2025-02-19',
        tier: 'Business',
        category: 'Software',
        description: 'Pro tools with Mulah Flex'
      },
      { 
        email: 'premium@demo.com', 
        name: 'Adobe Creative Cloud', 
        cost: 52.99, 
        cycle: 'monthly', 
        next_date: '2025-02-15',
        tier: 'All Apps',
        category: 'Software',
        description: 'Complete creative suite'
      },
      { 
        email: 'premium@demo.com', 
        name: 'Spotify', 
        cost: 15.99, 
        cycle: 'monthly', 
        next_date: '2025-02-08',
        tier: 'Family',
        category: 'Entertainment',
        description: 'Premium for up to 6 accounts'
      },
      { 
        email: 'premium@demo.com', 
        name: 'GitHub', 
        cost: 4.00, 
        cycle: 'monthly', 
        next_date: '2025-02-10',
        tier: 'Pro',
        category: 'Software',
        description: 'Advanced collaboration tools'
      },
      { 
        email: 'premium@demo.com', 
        name: 'Microsoft 365', 
        cost: 12.99, 
        cycle: 'monthly', 
        next_date: '2025-02-20',
        tier: 'Family',
        category: 'Software',
        description: 'Office apps for up to 6 users'
      },
      { 
        email: 'premium@demo.com', 
        name: 'Disney+', 
        cost: 10.99, 
        cycle: 'monthly', 
        next_date: '2025-02-25',
        tier: 'Premium',
        category: 'Entertainment',
        description: 'Disney+ with no ads'
      },
      { 
        email: 'premium@demo.com', 
        name: 'FitLife Gym', 
        cost: 39.99, 
        cycle: 'monthly', 
        next_date: '2025-02-01',
        tier: 'Premium',
        category: 'Health & Fitness',
        description: 'Full access membership'
      },
      { 
        email: 'premium@demo.com', 
        name: 'Dropbox', 
        cost: 11.99, 
        cycle: 'monthly', 
        next_date: '2025-02-14',
        tier: 'Plus',
        category: 'Cloud Storage',
        description: '2TB cloud storage'
      }
    ];

    // Insert comprehensive service catalog for suggestions
    const serviceCatalog = [
      {
        name: 'Netflix',
        category: 'Entertainment',
        tiers: JSON.stringify([
          { name: 'Basic', price: 8.99, description: 'HD streaming on 1 screen' },
          { name: 'Standard', price: 12.99, description: 'HD streaming on 2 screens' },
          { name: 'Premium', price: 15.49, description: '4K streaming on 4 screens' }
        ]),
        website: 'netflix.com',
        description: 'Streaming service for TV shows and movies'
      },
      {
        name: 'Spotify',
        category: 'Entertainment', 
        tiers: JSON.stringify([
          { name: 'Premium', price: 9.99, description: 'Ad-free music streaming' },
          { name: 'Duo', price: 12.99, description: 'Premium for 2 accounts' },
          { name: 'Family', price: 15.99, description: 'Premium for up to 6 accounts' }
        ]),
        website: 'spotify.com',
        description: 'Music streaming platform'
      },
      {
        name: 'Adobe Creative Cloud',
        category: 'Software',
        tiers: JSON.stringify([
          { name: 'Photography', price: 20.99, description: 'Photoshop & Lightroom' },
          { name: 'Single App', price: 22.99, description: 'Choose one app' },
          { name: 'All Apps', price: 52.99, description: 'Complete creative suite' }
        ]),
        website: 'adobe.com',
        description: 'Creative software suite'
      },
      {
        name: 'Amazon Prime',
        category: 'Shopping',
        tiers: JSON.stringify([
          { name: 'Monthly', price: 8.99, description: 'Prime benefits monthly' },
          { name: 'Annual', price: 99.00, description: 'Prime benefits yearly (save money)' }
        ]),
        website: 'amazon.com',
        description: 'Fast shipping and streaming'
      },
      {
        name: 'GitHub',
        category: 'Software',
        tiers: JSON.stringify([
          { name: 'Pro', price: 4.00, description: 'Advanced collaboration tools' },
          { name: 'Team', price: 4.00, description: 'Per user team plan' }
        ]),
        website: 'github.com',
        description: 'Code repository and collaboration'
      },
      {
        name: 'Microsoft 365',
        category: 'Software',
        tiers: JSON.stringify([
          { name: 'Personal', price: 6.99, description: 'Office apps for 1 user' },
          { name: 'Family', price: 12.99, description: 'Office apps for up to 6 users' }
        ]),
        website: 'microsoft.com',
        description: 'Office productivity suite'
      },
      {
        name: 'Disney+',
        category: 'Entertainment',
        tiers: JSON.stringify([
          { name: 'Standard', price: 7.99, description: 'Disney+ with ads' },
          { name: 'Premium', price: 10.99, description: 'Disney+ without ads' }
        ]),
        website: 'disneyplus.com',
        description: 'Disney streaming service'
      },
      {
        name: 'Dropbox',
        category: 'Cloud Storage',
        tiers: JSON.stringify([
          { name: 'Plus', price: 9.99, description: '2TB cloud storage' },
          { name: 'Family', price: 16.99, description: '2TB + family sharing' },
          { name: 'Professional', price: 19.99, description: '3TB + advanced features' }
        ]),
        website: 'dropbox.com',
        description: 'Cloud file storage and sync'
      }
    ];

    serviceCatalog.forEach(service => {
      db.run(
        `INSERT OR IGNORE INTO service_catalog (name, category, tiers, website, description) VALUES (?, ?, ?, ?, ?)`,
        [service.name, service.category, service.tiers, service.website, service.description]
      );
    });

  setTimeout(() => {
    // Clean up duplicate subscriptions while preserving unique demo data
    console.log('🧹 Cleaning up duplicate subscriptions...');

    // Remove duplicates but keep one of each unique subscription
    db.run(`DELETE FROM subscriptions WHERE id NOT IN (
      SELECT MIN(id) FROM subscriptions 
      GROUP BY user_id, name, cost, cycle, next_date
    )`, (err) => {
      if (err) {
        console.error('Error cleaning duplicates:', err);
      } else {
        console.log('✅ Duplicate subscriptions cleaned');

        // Check if we need to add missing demo subscriptions
        // Clear all existing subscriptions to start fresh
        db.run(`DELETE FROM subscriptions`, (clearErr) => {
          if (!clearErr) {
            console.log('🔄 Adding fresh demo subscriptions...');

            // Add clean demo subscriptions
            demoSubs.forEach(sub => {
              db.get(`SELECT id FROM users WHERE email = ?`, [sub.email], (err, user) => {
                if (user) {
                  db.run(
                    `INSERT INTO subscriptions (user_id, name, cost, cycle, next_date, tier, category, description) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                    [user.id, sub.name, sub.cost, sub.cycle, sub.next_date, sub.tier, sub.category, sub.description],
                    function(insertErr) {
                      if (!insertErr) {
                        console.log(`✅ Added subscription: ${sub.name} for ${sub.email}`);
                      }
                    }
                  );
                }
              });
            });
          }
        });
      }
    });

    // Generate 6 months of realistic transactions
    const generateRealisticTransactions = (email, isPremuim = false) => {
      const transactions = [];
      const startDate = new Date('2024-08-01');
      const endDate = new Date('2025-01-31');

      // Subscription transactions (monthly recurring)
      const subscriptions = isPremuim ? [
        { name: 'Netflix Premium', amount: 15.49, day: 3 },
        { name: 'Adobe Creative Cloud', amount: 52.99, day: 15 },
        { name: 'Spotify Family', amount: 14.99, day: 8 },
        { name: 'GitHub Pro', amount: 4.00, day: 10 },
        { name: 'Microsoft 365', amount: 6.99, day: 20 },
        { name: 'Disney+', amount: 7.99, day: 25 },
        { name: 'Gym Membership', amount: 29.99, day: 1 },
        { name: 'Cloud Storage Pro', amount: 9.99, day: 14 }
      ] : [
        { name: 'Netflix', amount: 12.99, day: 5 },
        { name: 'Spotify Premium', amount: 9.99, day: 8 },
        { name: 'Amazon Prime', amount: 8.99, day: 12 },
        { name: 'iCloud Storage', amount: 2.99, day: 18 }
      ];

      // Generate monthly subscription payments
      for (let month = 8; month <= 12; month++) {
        subscriptions.forEach(sub => {
          const date = new Date(2024, month - 1, sub.day);
          if (date <= endDate) {
            transactions.push({
              id: `sub_${email}_${month}_${sub.name.replace(/\s+/g, '_')}`,
              date: date.toISOString().split('T')[0],
              amount: -sub.amount,
              description: `${sub.name} Subscription`,
              merchant: sub.name.split(' ')[0],
              is_recurring: true
            });
          }
        });
      }

      // Continue for January 2025
      subscriptions.forEach(sub => {
        const date = new Date(2025, 0, sub.day);
        transactions.push({
          id: `sub_${email}_2025_01_${sub.name.replace(/\s+/g, '_')}`,
          date: date.toISOString().split('T')[0],
          amount: -sub.amount,
          description: `${sub.name} Subscription`,
          merchant: sub.name.split(' ')[0],
          is_recurring: true
        });
      });

      // Generate regular transactions
      const merchants = isPremuim ? [
        { name: 'Whole Foods', category: 'Groceries', amounts: [85, 120, 95, 110], frequency: 0.8 },
        { name: 'Starbucks', category: 'Dining', amounts: [4.50, 6.20, 8.90], frequency: 0.6 },
        { name: 'Shell', category: 'Transport - Fuel', amounts: [45, 55, 65], frequency: 0.4 },
        { name: 'Uber', category: 'Transport - Ride', amounts: [12, 18, 25, 35], frequency: 0.3 },
        { name: 'Amazon', category: 'Shopping', amounts: [25, 45, 80, 120], frequency: 0.5 },
        { name: 'Target', category: 'Shopping', amounts: [35, 65, 90], frequency: 0.3 },
        { name: 'Zara', category: 'Shopping', amounts: [60, 120, 180], frequency: 0.2 },
        { name: 'CVS Pharmacy', category: 'Healthcare', amounts: [15, 25, 45], frequency: 0.2 },
        { name: 'Cinema', category: 'Entertainment', amounts: [12, 16, 20], frequency: 0.2 }
      ] : [
        { name: 'Tesco', category: 'Groceries', amounts: [45, 65, 80], frequency: 0.7 },
        { name: 'Costa Coffee', category: 'Dining', amounts: [3.50, 5.20], frequency: 0.4 },
        { name: 'BP', category: 'Transport - Fuel', amounts: [40, 50], frequency: 0.3 },
        { name: 'Bus Pass', category: 'Transport - Ride', amounts: [25, 30], frequency: 0.3 },
        { name: 'Amazon', category: 'Shopping', amounts: [20, 35, 60], frequency: 0.4 },
        { name: 'Boots', category: 'Healthcare', amounts: [12, 20], frequency: 0.2 },
        { name: 'Sainsburys', category: 'Groceries', amounts: [35, 55], frequency: 0.3 }
      ];

      // Generate realistic spending patterns
      for (let date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + 1)) {
        merchants.forEach(merchant => {
          if (Math.random() < merchant.frequency / 30) { // Adjust frequency for daily probability
            const amount = merchant.amounts[Math.floor(Math.random() * merchant.amounts.length)];
            const variation = 0.9 + (Math.random() * 0.2); // ±10% variation
            const finalAmount = Math.round(amount * variation * 100) / 100;

            transactions.push({
              id: `tx_${email}_${date.getTime()}_${Math.random().toString(36).substr(2, 5)}`,
              date: date.toISOString().split('T')[0],
              amount: -finalAmount,
              description: Math.random() > 0.5 ? `Purchase at ${merchant.name}` : `${merchant.name} Payment`,
              merchant: merchant.name,
              is_recurring: false
            });
          }
        });
      }

      return transactions.sort((a, b) => new Date(b.date) - new Date(a.date));
    };

    // Generate transactions for both demo users
    const freeUserTransactions = generateRealisticTransactions('free@demo.com', false);
    const premiumUserTransactions = generateRealisticTransactions('premium@demo.com', true);

    [
      { email: 'free@demo.com', transactions: freeUserTransactions },
      { email: 'premium@demo.com', transactions: premiumUserTransactions }
    ].forEach(userTx => {
      db.get(`SELECT id FROM users WHERE email = ?`, [userTx.email], (err, user) => {
        if (user) {
          userTx.transactions.forEach(tx => {
            const category = categorizeTransaction(tx.description, tx.merchant);
            const txDate = new Date(tx.date);
            const month = txDate.toISOString().slice(0, 7);
            const isoWeek = getISOWeek(txDate);

            db.run(
              `INSERT OR IGNORE INTO transactions (id, user_id, date, amount, description, merchant, category, month, iso_week, is_recurring, enriched) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
              [tx.id, user.id, tx.date, tx.amount, tx.description, tx.merchant, category, month, isoWeek, tx.is_recurring ? 1 : 0, 1]
            );
          });
        }
      });
    });
  }, 200);

  console.log('✅ Mulah database initialized successfully!');
});

// Authentication helpers
function generateToken() {
  return Math.random().toString(36).substr(2) + Date.now().toString(36);
}

function getUserFromToken(token, callback) {
  db.get(`SELECT * FROM users WHERE token = ?`, [token], callback);
}

// Category classification
const CATEGORY_KEYWORDS = {
  "Transport - Fuel": ["fuel", "diesel", "gas", "unleaded", "petrol", "bp", "shell", "texaco", "esso"],
  "Groceries": ["aldi", "tesco", "lidl", "spar", "grocery", "supermarket", "supervalu", "whole foods"],
  "Transport - Ride": ["uber", "bolt", "taxi", "lyft", "transport", "bus", "train"],
  "Subscriptions": ["netflix", "spotify", "prime", "apple music", "youtube premium", "disney+", "subscription", "adobe"],
  "Dining": ["restaurant", "cafe", "food", "burger", "kfc", "mcdonalds", "starbucks", "pizza", "takeaway"],
  "Shopping": ["amazon", "store", "shop", "mall", "ebay", "clothing", "electronics", "zara"],
  "Bills & Utilities": ["electric", "gas bill", "water", "internet", "phone", "utility", "broadband"],
  "Entertainment": ["cinema", "movie", "theatre", "concert", "game", "steam", "gym", "netflix"],
  "Healthcare": ["pharmacy", "doctor", "hospital", "dental", "medical", "health"]
};

function categorizeTransaction(description, merchant) {
  const text = `${description} ${merchant}`.toLowerCase();

  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    for (const keyword of keywords) {
      if (text.includes(keyword)) {
        return category;
      }
    }
  }
  return "Misc";
}

function getISOWeek(date) {
  const target = new Date(date.valueOf());
  const dayNr = (date.getDay() + 6) % 7;
  target.setDate(target.getDate() - dayNr + 3);
  const jan4 = new Date(target.getFullYear(), 0, 4);
  const dayDiff = (target - jan4) / 86400000;
  return 1 + Math.ceil(dayDiff / 7);
}

// Auth routes
app.post('/api/auth/register', (req, res) => {
  try {
    const { name, email, password, plan = 'free' } = req.body;

    if (!name || !email || !password) {
      console.log('❌ Registration failed: Missing required fields');
      return res.status(400).json({ error: 'All fields are required' });
    }

    db.get(`SELECT id FROM users WHERE email = ?`, [email], (err, user) => {
      if (err) {
        console.error('❌ Database error during user lookup:', err);
        return res.status(500).json({ error: 'Database error' });
      }

      if (user) {
        console.log('❌ Registration failed: User already exists -', email);
        return res.status(400).json({ error: 'User already exists' });
      }

      const token = generateToken();
      const userPlan = ['free', 'basic', 'pro'].includes(plan) ? plan : 'free';
      db.run(
        `INSERT INTO users (name, email, password, token, plan) VALUES (?, ?, ?, ?, ?)`,
        [name, email, password, token, userPlan],
        function(err) {
          if (err) {
            console.error('❌ Registration failed:', err);
            return res.status(500).json({ error: 'Registration failed' });
          }

          console.log('✅ User registered successfully:', email, 'with plan:', userPlan);
          res.status(201).json({
            token,
            user: { id: this.lastID, name, email, plan: userPlan }
          });
        }
      );
    });
  } catch (error) {
    console.error('❌ Registration error:', error);
    res.status(500).json({ error: 'Server error during registration' });
  }
});

app.post('/api/auth/login', (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      console.log('❌ Login failed: Missing credentials');
      return res.status(400).json({ error: 'Email and password are required' });
    }

    db.get(`SELECT * FROM users WHERE email = ? AND password = ?`, [email, password], (err, user) => {
      if (err) {
        console.error('❌ Database error during login:', err);
        return res.status(500).json({ error: 'Database error' });
      }

      if (!user) {
        console.log('❌ Login failed: Invalid credentials for', email);
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const token = generateToken();
      db.run(`UPDATE users SET token = ? WHERE id = ?`, [token, user.id], (err) => {
        if (err) {
          console.error('❌ Login token update failed:', err);
          return res.status(500).json({ error: 'Login failed' });
        }

        console.log('✅ User logged in successfully:', email);
        res.json({
          token,
          user: { id: user.id, name: user.name, email: user.email, plan: user.plan || 'free' }
        });
      });
    });
  } catch (error) {
    console.error('❌ Login error:', error);
    res.status(500).json({ error: 'Server error during login' });
  }
});

// Subscription routes
app.get('/api/subscriptions', (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      console.log('❌ Subscriptions request: No token provided');
      return res.json([]);
    }

    getUserFromToken(token, (err, user) => {
      if (err) {
        console.error('❌ Token validation error:', err);
        return res.status(401).json({ error: 'Invalid token' });
      }

      if (!user) {
        console.log('❌ Subscriptions request: Invalid token');
        return res.json([]);
      }

      db.all(`SELECT * FROM subscriptions WHERE user_id = ? ORDER BY next_date`, [user.id], (err, rows) => {
        if (err) {
          console.error('❌ Error fetching subscriptions:', err);
          return res.status(500).json({ error: 'Failed to fetch subscriptions' });
        }

        console.log(`✅ Subscriptions fetched for user ${user.email}: ${rows?.length || 0} items`);
        res.json(rows || []);
      });
    });
  } catch (error) {
    console.error('❌ Subscriptions fetch error:', error);
    res.status(500).json({ error: 'Server error fetching subscriptions' });
  }
});

app.post('/api/subscriptions', (req, res) => {
  try {
    const { name, cost, cycle, nextDate } = req.body;
    const token = req.headers.authorization?.replace('Bearer ', '');

    // Input validation
    if (!name || typeof name !== 'string' || name.trim().length < 1 || name.length > 100) {
      console.log('❌ Invalid subscription name:', name);
      return res.status(400).json({ error: 'Service name must be 1-100 characters' });
    }

    if (typeof cost !== 'number' || cost <= 0 || cost > 10000) {
      console.log('❌ Invalid subscription cost:', cost);
      return res.status(400).json({ error: 'Cost must be between €0.01 and €10,000' });
    }

    if (!['monthly', 'yearly'].includes(cycle)) {
      console.log('❌ Invalid subscription cycle:', cycle);
      return res.status(400).json({ error: 'Cycle must be monthly or yearly' });
    }

    if (!nextDate || !/^\d{4}-\d{2}-\d{2}$/.test(nextDate)) {
      console.log('❌ Invalid next date:', nextDate);
      return res.status(400).json({ error: 'Invalid date format' });
    }

    getUserFromToken(token, (err, user) => {
      if (!user) {
        console.log('❌ Unauthorized subscription creation attempt');
        return res.status(401).json({ error: 'Unauthorized' });
      }

      db.run(
        `INSERT INTO subscriptions (user_id, name, cost, cycle, next_date) VALUES (?, ?, ?, ?, ?)`,
        [user.id, name.trim(), cost, cycle, nextDate],
        function(err) {
          if (err) {
            console.error('❌ Failed to create subscription:', err);
            return res.status(500).json({ error: 'Failed to create subscription' });
          }

          console.log(`✅ Subscription created: ${name} for user ${user.email}`);
          res.status(201).json({ id: this.lastID });
        }
      );
    });
  } catch (error) {
    console.error('❌ Subscription creation error:', error);
    res.status(500).json({ error: 'Server error during subscription creation' });
  }
});

app.delete('/api/subscriptions/:id', (req, res) => {
  const { id } = req.params;

  db.run(`DELETE FROM subscriptions WHERE id = ?`, [id], function(err) {
    if (err) {
      return res.status(500).json({ error: 'Failed to delete subscription' });
    }
    res.json({ message: 'Subscription deleted' });
  });
});

// Service search endpoint
app.get('/api/services/search', (req, res) => {
  const { q } = req.query;

  if (!q || q.length < 2) {
    return res.json([]);
  }

  db.all(
    `SELECT DISTINCT name, category, tiers, website, description FROM service_catalog WHERE name LIKE ? OR category LIKE ? LIMIT 8`,
    [`%${q}%`, `%${q}%`],
    (err, rows) => {
      if (err) {
        console.error('Service search error:', err);
        return res.status(500).json({ error: 'Search failed' });
      }

      // Deduplicate by service name and format for frontend
      const uniqueServices = {};
      rows.forEach(row => {
        if (!uniqueServices[row.name]) {
          const tiers = JSON.parse(row.tiers || '[]');
          uniqueServices[row.name] = {
            name: row.name,
            category: row.category,
            tiers: tiers,
            options: tiers.map(tier => ({
              display: `${row.name} ${tier.name} - €${tier.price}/${row.name.includes('Annual') ? 'year' : 'month'}`,
              name: row.name,
              tier: tier.name,
              price: tier.price,
              category: row.category
            })),
            website: row.website,
            description: row.description
          };
        }
      });

      res.json(Object.values(uniqueServices));
    }
  );
});

// Transaction routes
app.post('/api/transactions/sync', (req, res) => {
  const { user_id, transactions } = req.body;

  if (!transactions || !Array.isArray(transactions)) {
    return res.status(400).json({ error: 'Invalid transactions data' });
  }

  db.get(`SELECT id FROM users WHERE email = ?`, [user_id], (err, user) => {
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    let completed = 0;
    const errors = [];

    if (transactions.length === 0) {
      return res.json({ status: 'success', synced_count: 0 });
    }

    transactions.forEach((tx, index) => {
      const { id, date, amount, description, merchant } = tx;

      // Enhanced validation
      if (!id || typeof id !== 'string' || id.length > 50) {
        errors.push(`Transaction ${index}: Invalid ID`);
        completed++;
        if (completed === transactions.length) {
          return res.status(400).json({ status: 'error', errors });
        }
        return;
      }

      if (!description || typeof description !== 'string' || description.length > 200) {
        errors.push(`Transaction ${index}: Description must be 1-200 characters`);
        completed++;
        if (completed === transactions.length) {
          return res.status(400).json({ status: 'error', errors });
        }
        return;
      }

      if (!merchant || typeof merchant !== 'string' || merchant.length > 100) {
        errors.push(`Transaction ${index}: Merchant must be 1-100 characters`);
        completed++;
        if (completed === transactions.length) {
          return res.status(400).json({ status: 'error', errors });
        }
        return;
      }

      if (typeof amount !== 'number' || amount > 100000 || amount < -100000) {
        errors.push(`Transaction ${index}: Invalid amount`);
        completed++;
        if (completed === transactions.length) {
          return res.status(400).json({ status: 'error', errors });
        }
        return;
      }

      if (!date || isNaN(new Date(date).getTime())) {
        errors.push(`Transaction ${index}: Invalid date`);
        completed++;
        if (completed === transactions.length) {
          return res.status(400).json({ status: 'error', errors });
        }
        return;
      }

      const category = categorizeTransaction(description, merchant);
      const txDate = new Date(date);
      const month = txDate.toISOString().slice(0, 7);
      const isoWeek = getISOWeek(txDate);

      db.run(
        `INSERT OR REPLACE INTO transactions 
         (id, user_id, date, amount, description, merchant, category, month, iso_week, enriched) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [id, user.id, date, amount, description, merchant, category, month, isoWeek, 1],
        function(err) {
          completed++;
          if (err) {
            errors.push(`Transaction ${index}: ${err.message}`);
          }

          if (completed === transactions.length) {
            if (errors.length > 0) {
              return res.status(400).json({ status: 'partial_success', errors, synced_count: completed - errors.length });
            }
            res.json({ status: 'success', synced_count: completed });
          }
        }
      );
    });
  });
});

app.get('/api/transactions', (req, res) => {
  const { user_id, limit = 500 } = req.query;

  db.get(`SELECT id FROM users WHERE email = ?`, [user_id], (err, user) => {
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    db.all(
      `SELECT * FROM transactions WHERE user_id = ? ORDER BY date DESC LIMIT ?`,
      [user.id, parseInt(limit)],
      (err, rows) => {
        if (err) {
          return res.status(500).json({ error: 'Failed to fetch transactions' });
        }
        res.json({ transactions: rows || [], count: rows?.length || 0 });
      }
    );
  });
});

app.get('/api/insights', (req, res) => {
  const { user_id, period = '30d' } = req.query;

  const periodDays = {
    '30d': 30, '60d': 60, '90d': 90, '6m': 180, '1y': 365
  };
  const days = periodDays[period] || 30;
  // Use actual current date for insights
  const now = new Date();
  const cutoffDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
  const cutoffDateStr = cutoffDate.toISOString().split('T')[0];

  db.get(`SELECT id FROM users WHERE email = ?`, [user_id], (err, user) => {
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get transactions within the period directly from database
    db.all(
      `SELECT * FROM transactions WHERE user_id = ? AND date >= ? ORDER BY date DESC`,
      [user.id, cutoffDateStr],
      (err, transactions) => {
        if (err) {
          console.error('Insights query error:', err);
          return res.status(500).json({ error: 'Failed to fetch insights' });
        }

        console.log(`🔍 Insights for ${user_id} (${period}): Found ${transactions?.length || 0} transactions since ${cutoffDateStr}`);

        if (transactions.length === 0) {
          return res.json({
            user_id,
            period,
            total_transactions: 0,
            total_spend: 0,
            avg_transaction: 0,
            top_category: 'No data',
            category_breakdown: {}
          });
        }

        const totalSpend = transactions.reduce((sum, tx) => sum + Math.abs(tx.amount), 0);
        const avgTransaction = totalSpend / transactions.length;

        const categoryAmounts = {};
        transactions.forEach(tx => {
          const category = tx.category || 'Uncategorized';
          categoryAmounts[category] = (categoryAmounts[category] || 0) + Math.abs(tx.amount);
        });

        const topCategory = Object.keys(categoryAmounts).length > 0 
          ? Object.keys(categoryAmounts).reduce((a, b) => 
              categoryAmounts[a] > categoryAmounts[b] ? a : b)
          : 'No data';

        console.log(`✅ Insights calculated: ${transactions.length} transactions, €${totalSpend.toFixed(2)} total spend`);

        res.json({
          user_id,
          period,
          total_transactions: transactions.length,
          total_spend: Math.round(totalSpend * 100) / 100,
          avg_transaction: Math.round(avgTransaction * 100) / 100,
          top_category: topCategory,
          category_breakdown: categoryAmounts
        });
      }
    );
  });
});

// Generate demo subscriptions endpoint
app.post('/api/demo/subscriptions', (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    getUserFromToken(token, (err, user) => {
      if (!user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      // Clear existing subscriptions for demo accounts
      if (user.email.includes('@demo.com')) {
        db.run(`DELETE FROM subscriptions WHERE user_id = ?`, [user.id], (err) => {
          if (err) {
            return res.status(500).json({ error: 'Failed to clear subscriptions' });
          }

          // Generate 3-8 random subscriptions
          const minSubs = 3;
          const maxSubs = 8;
          const numSubs = Math.floor(Math.random() * (maxSubs - minSubs + 1)) + minSubs;

          const demoServices = [
            { name: 'Netflix', cost: [8.99, 12.99, 15.49], tier: ['Basic', 'Standard', 'Premium'], category: 'Entertainment' },
            { name: 'Spotify', cost: [9.99, 12.99, 15.99], tier: ['Premium', 'Duo', 'Family'], category: 'Entertainment' },
            { name: 'Adobe Creative Cloud', cost: [20.99, 22.99, 52.99], tier: ['Photography', 'Single App', 'All Apps'], category: 'Software' },
            { name: 'Amazon Prime', cost: [8.99], tier: ['Standard'], category: 'Shopping' },
            { name: 'GitHub', cost: [4.00], tier: ['Pro'], category: 'Software' },
            { name: 'Microsoft 365', cost: [6.99, 12.99], tier: ['Personal', 'Family'], category: 'Software' },
            { name: 'Disney+', cost: [7.99, 10.99], tier: ['Standard', 'Premium'], category: 'Entertainment' },
            { name: 'Dropbox', cost: [9.99, 16.99, 19.99], tier: ['Plus', 'Family', 'Professional'], category: 'Cloud Storage' },
            { name: 'YouTube Premium', cost: [11.99], tier: ['Individual'], category: 'Entertainment' },
            { name: 'Apple iCloud', cost: [2.99, 9.99], tier: ['200GB', '2TB'], category: 'Cloud Storage' }
          ];

          // Shuffle and select random services
          const shuffled = demoServices.sort(() => 0.5 - Math.random());
          const selectedServices = shuffled.slice(0, numSubs);

          let completed = 0;

          selectedServices.forEach((service, index) => {
            const tierIndex = Math.floor(Math.random() * service.tier.length);
            const cost = service.cost[tierIndex];
            const tier = service.tier[tierIndex];
            const cycle = Math.random() > 0.8 ? 'yearly' : 'monthly';
            const nextDay = Math.floor(Math.random() * 28) + 1;
            const nextMonth = Math.floor(Math.random() * 2) + 2; // Feb or Mar
            const nextDate = `2025-${nextMonth.toString().padStart(2, '0')}-${nextDay.toString().padStart(2, '0')}`;

            db.run(
              `INSERT INTO subscriptions (user_id, name, cost, cycle, next_date, tier, category, description) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
              [user.id, service.name, cost, cycle, nextDate, tier, service.category, `Demo ${service.name} subscription`],
              function(err) {
                completed++;
                if (completed === selectedServices.length) {
                  res.json({ message: `Generated ${selectedServices.length} demo subscriptions`, count: selectedServices.length });
                }
              }
            );
          });
        });
      } else {
        res.status(403).json({ error: 'Demo data only available for demo accounts' });
      }
    });
  } catch (error) {
    console.error('Demo subscriptions generation error:', error);
    res.status(500).json({ error: 'Failed to generate demo data' });
  }
});

// Generate demo transactions endpoint with 6-month incremental logic
app.post('/api/demo/transactions', (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    getUserFromToken(token, (err, user) => {
      if (!user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      if (!user.email.includes('@demo.com')) {
        return res.status(403).json({ error: 'Demo data only available for demo accounts' });
      }

      // Check existing transaction count to determine next 6-month period
      db.get(`SELECT COUNT(*) as count, MIN(date) as earliest, MAX(date) as latest FROM transactions WHERE user_id = ?`, [user.id], (err, result) => {
        if (err) {
          return res.status(500).json({ error: 'Failed to check existing transactions' });
        }

        const existingCount = result.count || 0;
        const today = new Date();
        let startDate, endDate;

        // Determine date range based on existing data
        if (existingCount === 0) {
          // First generation: start 6 months ago from today
          startDate = new Date(today.getFullYear(), today.getMonth() - 6, 1);
          endDate = new Date(today.getFullYear(), today.getMonth(), 0); // Last day of previous month
        } else {
          // Check if we already have 12 months of data
          const earliestDate = new Date(result.earliest);
          const monthsDiff = (today.getFullYear() - earliestDate.getFullYear()) * 12 + (today.getMonth() - earliestDate.getMonth());

          if (monthsDiff >= 12) {
            return res.json({ message: 'Maximum demo data reached (12 months)', max_reached: true });
          }

          // Generate next 6 months starting from latest date
          const latestDate = new Date(result.latest);
          startDate = new Date(latestDate.getFullYear(), latestDate.getMonth() + 1, 1);
          endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 6, 0);

          // Don't go beyond today
          if (endDate > today) {
            endDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
          }
        }

        console.log(`📊 Generating transactions from ${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}`);

        // Generate 6 months of transactions for the determined period
        const generateRealisticTransactions = (email, isPremium = false, start, end) => {
          const transactions = [];

          // Subscription transactions (monthly recurring)
          const subscriptions = isPremium ? [
            { name: 'Netflix Premium', amount: 15.49, day: 3 },
            { name: 'Adobe Creative Cloud', amount: 52.99, day: 15 },
            { name: 'Spotify Family', amount: 14.99, day: 8 },
            { name: 'GitHub Pro', amount: 4.00, day: 10 },
            { name: 'Microsoft 365', amount: 6.99, day: 20 },
            { name: 'Disney+', amount: 7.99, day: 25 },
            { name: 'Gym Membership', amount: 29.99, day: 1 },
            { name: 'Cloud Storage Pro', amount: 9.99, day: 14 }
          ] : [
            { name: 'Netflix', amount: 12.99, day: 5 },
            { name: 'Spotify Premium', amount: 9.99, day: 8 },
            { name: 'Amazon Prime', amount: 8.99, day: 12 },
            { name: 'iCloud Storage', amount: 2.99, day: 18 }
          ];

          // Generate subscription payments for the period
          const currentDate = new Date(start);
          while (currentDate <= end) {
            subscriptions.forEach(sub => {
              const subDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), sub.day);
              if (subDate >= start && subDate <= end) {
                transactions.push({
                  id: `sub_${email}_${subDate.getTime()}_${sub.name.replace(/\s+/g, '_')}`,
                  date: subDate.toISOString().split('T')[0],
                  amount: -sub.amount,
                  description: `${sub.name} Subscription`,
                  merchant: sub.name.split(' ')[0],
                  is_recurring: true
                });
              }
            });
            currentDate.setMonth(currentDate.getMonth() + 1);
          }

          // Generate regular transactions
          const merchants = isPremium ? [
            { name: 'Whole Foods', category: 'Groceries', amounts: [85, 120, 95, 110], frequency: 0.8 },
            { name: 'Starbucks', category: 'Dining', amounts: [4.50, 6.20, 8.90], frequency: 0.6 },
            { name: 'Shell', category: 'Transport - Fuel', amounts: [45, 55, 65], frequency: 0.4 },
            { name: 'Uber', category: 'Transport - Ride', amounts: [12, 18, 25, 35], frequency: 0.3 },
            { name: 'Amazon', category: 'Shopping', amounts: [25, 45, 80, 120], frequency: 0.5 },
            { name: 'Target', category: 'Shopping', amounts: [35, 65, 90], frequency: 0.3 },
            { name: 'Zara', category: 'Shopping', amounts: [60, 120, 180], frequency: 0.2 },
            { name: 'CVS Pharmacy', category: 'Healthcare', amounts: [15, 25, 45], frequency: 0.2 },
            { name: 'Cinema', category: 'Entertainment', amounts: [12, 16, 20], frequency: 0.2 }
          ] : [
            { name: 'Tesco', category: 'Groceries', amounts: [45, 65, 80], frequency: 0.7 },
            { name: 'Costa Coffee', category: 'Dining', amounts: [3.50, 5.20], frequency: 0.4 },
            { name: 'BP', category: 'Transport - Fuel', amounts: [40, 50], frequency: 0.3 },
            { name: 'Bus Pass', category: 'Transport - Ride', amounts: [25, 30], frequency: 0.3 },
            { name: 'Amazon', category: 'Shopping', amounts: [20, 35, 60], frequency: 0.4 },
            { name: 'Boots', category: 'Healthcare', amounts: [12, 20], frequency: 0.2 },
            { name: 'Sainsburys', category: 'Groceries', amounts: [35, 55], frequency: 0.3 }
          ];

          // Generate realistic spending patterns for the period
          for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
            merchants.forEach(merchant => {
              if (Math.random() < merchant.frequency / 30) {
                const amount = merchant.amounts[Math.floor(Math.random() * merchant.amounts.length)];
                const variation = 0.9 + (Math.random() * 0.2);
                const finalAmount = Math.round(amount * variation * 100) / 100;

                transactions.push({
                  id: `tx_${email}_${date.getTime()}_${Math.random().toString(36).substr(2, 5)}`,
                  date: date.toISOString().split('T')[0],
                  amount: -finalAmount,
                  description: Math.random() > 0.5 ? `Purchase at ${merchant.name}` : `${merchant.name} Payment`,
                  merchant: merchant.name,
                  is_recurring: false
                });
              }
            });
          }

          return transactions.sort((a, b) => new Date(b.date) - new Date(a.date));
        };

        const transactions = generateRealisticTransactions(user.email, user.email.includes('premium'), startDate, endDate);

        if (transactions.length === 0) {
          return res.json({ message: 'No new transactions to generate', count: 0 });
        }

        let completed = 0;
        transactions.forEach(tx => {
          const category = categorizeTransaction(tx.description, tx.merchant);
          const txDate = new Date(tx.date);
          const month = txDate.toISOString().slice(0, 7);
          const isoWeek = getISOWeek(txDate);

          db.run(
            `INSERT OR REPLACE INTO transactions (id, user_id, date, amount, description, merchant, category, month, iso_week, is_recurring, enriched) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [tx.id, user.id, tx.date, tx.amount, tx.description, tx.merchant, category, month, isoWeek, tx.is_recurring ? 1 : 0, 1],
            function(insertErr) {
              completed++;
              if (completed === transactions.length) {
                res.json({ message: `Generated 6 months of transactions`, count: transactions.length });
              }
            }
          );
        });
      });
    });
  } catch (error) {
    console.error('Demo transactions generation error:', error);
    res.status(500).json({ error: 'Failed to generate demo data' });
  }
});

// Clear demo data on logout or page close
app.post('/api/auth/logout', (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (token) {
      getUserFromToken(token, (err, user) => {
        if (user && user.email.includes('@demo.com')) {
          console.log(`🧹 Cleaning up demo data for ${user.email}`);

          // Clear all subscriptions
          db.run(`DELETE FROM subscriptions WHERE user_id = ?`, [user.id], (deleteErr) => {
            if (!deleteErr) {
              console.log(`🗑️ Cleared ${user.email} subscriptions`);
            }
          });

          // Clear ALL transactions for demo accounts to start fresh
          db.run(`DELETE FROM transactions WHERE user_id = ?`, [user.id], (deleteErr) => {
            if (!deleteErr) {
              console.log(`🗑️ Cleared ${user.email} generated transactions`);

              // Add back just 2 basic demo transactions - 1 needing categorization max
              const basicTestTransactions = [
                {
                  id: `test_1_${user.id}`,
                  date: '2025-01-29',
                  amount: -25.99,
                  description: 'Monthly payment to unknown service',
                  merchant: 'Unknown Service Co.',
                  category: null // Needs categorization - just 1 transaction
                },
                {
                  id: `test_2_${user.id}`,
                  date: '2025-01-28',
                  amount: -45.67,
                  description: 'Weekly groceries',
                  merchant: 'Tesco',
                  category: 'Groceries' // Already categorized correctly
                }
              ];

              basicTestTransactions.forEach(tx => {
                const txDate = new Date(tx.date);
                const month = txDate.toISOString().slice(0, 7);
                const isoWeek = getISOWeek(txDate);

                db.run(
                  `INSERT OR REPLACE INTO transactions (id, user_id, date, amount, description, merchant, category, month, iso_week, is_recurring, enriched) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                  [tx.id, user.id, tx.date, tx.amount, tx.description, tx.merchant, tx.category, month, isoWeek, 0, 1]
                );
              });
            }
          });
        }

        // Clear token
        db.run(`UPDATE users SET token = NULL WHERE token = ?`, [token]);
      });
    }

    res.json({ message: 'Logged out successfully', cleared: true });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Logout failed' });
  }
});

// Also handle beacon requests from beforeunload
app.post('/api/cleanup', (req, res) => {
  // Same cleanup logic for page close events
  req.headers.authorization = req.headers.authorization || req.body.token;
  app._router.handle(Object.assign(req, { url: '/api/auth/logout', method: 'POST' }), res);
});

// Update transaction category
app.patch('/api/transactions/:id/category', (req, res) => {
  try {
    const { id } = req.params;
    const { category } = req.body;
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!category || typeof category !== 'string') {
      return res.status(400).json({ error: 'Valid category is required' });
    }

    getUserFromToken(token, (err, user) => {
      if (!user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      // Update transaction category only for user's own transactions
      db.run(
        `UPDATE transactions SET category = ? WHERE id = ? AND user_id = ?`,
        [category, id, user.id],
        function(err) {
          if (err) {
            console.error('Failed to update transaction category:', err);
            return res.status(500).json({ error: 'Failed to update category' });
          }

          if (this.changes === 0) {
            return res.status(404).json({ error: 'Transaction not found' });
          }

          console.log(`✅ Updated transaction ${id} category to ${category} for user ${user.email}`);
          res.json({ message: 'Category updated successfully' });
        }
      );
    });
  } catch (error) {
    console.error('Transaction category update error:', error);
    res.status(500).json({ error: 'Server error during category update' });
  }
});

// 404 handler
app.use('*', (req, res) => {
  console.log(`❌ 404 Not Found: ${req.method} ${req.originalUrl}`);
  res.status(404).json({ error: 'Endpoint not found' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('❌ Unhandled server error:', err);
  res.status(500).json({ 
    error: 'Internal server error', 
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});
// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 Received SIGTERM, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🛑 Received SIGINT, shutting down gracefully...');
  process.exit(0);
});

// Simple server startup
console.log('🚀 Starting Mulah server...');
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Mulah server running on port ${PORT}`);
  console.log(`📱 Access your app at: http://0.0.0.0:${PORT}`);
  console.log(`👤 Demo accounts: free@demo.com / premium@demo.com (password: demo123)`);
  console.log(`🔧 Error logging enabled`);
});

server.on('error', (err) => {
  console.error('❌ Server startup error:', err);
  if (err.code === 'EADDRINUSE') {
    console.log(`❌ Port ${PORT} is already in use. Please stop other instances first.`);
  }
  process.exit(1);
});