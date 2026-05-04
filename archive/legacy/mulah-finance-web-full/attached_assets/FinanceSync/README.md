
# Mulah - Unified Subscription & Personal Finance Platform

**Slogan: "Simplify your spending. Amplify your peace."**

Mulah combines subscription tracking and personal finance management into one unified platform with advanced features like Unified Subscription Wallet (USW), Mulah Mesh, and Mulah Flex.

## Features

### 🔐 User Authentication
- Secure user registration and login
- Demo accounts available for testing
- Session management with tokens

### 📱 Subscription Management
- Track all your subscriptions in one place
- Add, edit, and delete subscriptions
- View upcoming renewal dates
- Calculate monthly/yearly costs

### 💰 Transaction Management
- Automatic transaction categorization
- Search and filter transactions
- Monthly transaction views
- Expense analytics and insights

### 📊 Financial Insights
- Spending analysis by category
- Monthly spending trends
- Recurring payment detection
- AI-powered spending insights
- Budget vs actual comparisons

### 🎯 Budgets & Goals
- Set monthly budgets by category
- Track spending against budgets
- Create financial goals
- Monitor progress toward goals

## Technology Stack

- **Backend**: Node.js with Express
- **Database**: SQLite3 
- **Frontend**: HTML, CSS (Tailwind), Vanilla JavaScript
- **Authentication**: Token-based auth
- **Charts**: Chart.js for data visualization

## Quick Start

1. **Installation**
   ```bash
   npm install
   ```

2. **Run the application**
   ```bash
   npm start
   ```

3. **Access the app**
   - Open your browser to `http://localhost:5000`
   - Use demo accounts or register a new account

## Demo Accounts

Try the application with these demo accounts:

- **Mulah Free**: `free@demo.com` / `demo123` (2 runs, then €3.99/run)
- **Mulah Premium**: `premium@demo.com` / `demo123` (€6.99/mo, covers 3 subs or €60 spend)
- **Mulah Pro**: `pro@demo.com` / `demo123` (€60/yr, all features + USW access)

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login

### Subscriptions
- `GET /api/subscriptions` - Get user subscriptions
- `POST /api/subscriptions` - Add new subscription
- `DELETE /api/subscriptions/:id` - Delete subscription

### Transactions
- `POST /api/transactions/sync` - Sync transaction data
- `GET /api/transactions` - Get transactions with pagination
- `GET /api/insights` - Get spending insights

## Database Schema

The application uses SQLite with the following main tables:

- **users** - User accounts and authentication
- **subscriptions** - Subscription tracking data
- **transactions** - Financial transaction records
- **budgets** - User budget settings
- **goals** - Financial goals and progress

## Development

The application automatically:
- Creates database tables on startup
- Seeds demo users and sample data
- Categorizes transactions using keyword matching
- Detects recurring payments
- Calculates spending insights

## Deployment

This application is designed to run on Replit and will automatically:
- Install dependencies
- Create the SQLite database
- Start the server on port 5000
- Serve the frontend files

## File Structure

```
financesync/
├── server.js              # Main Express server
├── package.json           # Dependencies and scripts
├── financesync.db         # SQLite database (auto-created)
├── public/                # Frontend files
│   ├── index.html         # Landing page
│   ├── login.html         # Login/register page
│   └── dashboard.html     # Main application dashboard
└── README.md              # This file
```

## Contributing

FinanceSync is designed to be a comprehensive financial management platform. Feel free to extend functionality by:

- Adding new transaction categories
- Implementing additional chart types
- Creating more detailed budget features
- Adding export capabilities
- Integrating with external financial APIs

## License

MIT License - Feel free to use and modify for your projects.
