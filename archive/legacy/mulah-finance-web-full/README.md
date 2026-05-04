# Mulah - Unified Financial Platform

> A comprehensive financial middleware platform combining subscription tracking, virtual card management, merchant sync capabilities, and BNPL fallback systems.

## 🚀 Overview

Mulah is more than a subscription tracker—it's a complete financial middleware platform that provides:

- **Unified Subscription Wallet (USW)**: Centralized billing orchestration
- **Virtual Card Management**: Stripe Issuing integration for dynamic payment cards  
- **Mulah Mesh**: Merchant sync engine for billing anchor negotiation
- **Smart Buffer**: BNPL fallback layer with Klarna integration
- **AI-powered Insights**: Intelligent transaction classification and financial nudges

## 🏗️ Architecture

### Frontend
- **React 18** with TypeScript
- **Tailwind CSS** with shadcn/ui components
- **TanStack Query** for server state management
- **Wouter** for lightweight routing
- **Progressive Web App** capabilities

### Backend
- **Node.js** with Express.js
- **TypeScript** with ES modules
- **PostgreSQL** with Drizzle ORM
- **Replit Auth** with OpenID Connect
- **Modular Services Architecture**

### Financial Services Integration
- **Stripe Issuing API** - Virtual card creation and management
- **Open Banking API** - Transaction sync and account access
- **Klarna API** - BNPL fallback payment processing
- **Node-cron/Bull** - Retry scheduler and queue management

## 🔧 Environment Setup

### Required Environment Variables

```bash
# Core Infrastructure
DATABASE_URL=postgresql://...
SESSION_SECRET=your_session_secret_here

# Financial Services (Required for Production)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
BANKING_API_KEY=your_banking_api_key
KLARNA_CLIENT_ID=your_klarna_client_id
KLARNA_SECRET=your_klarna_secret
FRONTEND_URL=https://your-domain.replit.app

# Replit Auth (Auto-configured)
REPL_ID=auto
REPLIT_DOMAINS=auto
ISSUER_URL=auto
```

### Local Development

1. **Clone and Install**
   ```bash
   npm install
   ```

2. **Database Setup**
   ```bash
   npm run db:push
   ```

3. **Start Development Server**
   ```bash
   npm run dev
   ```

## 📡 API Endpoints

### Core Subscription Management
- `GET /api/subscriptions` - List user subscriptions
- `POST /api/subscriptions` - Add new subscription
- `PUT /api/subscriptions/:id` - Update subscription
- `DELETE /api/subscriptions/:id` - Delete subscription

### USW (Unified Subscription Wallet)
- `GET /api/usw/calculate` - Calculate USW totals and fees
- `POST /api/usw/collect-funds` - Initiate monthly fund collection
- `POST /api/usw/disburse-funds` - Disburse funds to virtual cards
- `GET /api/usw/transactions` - USW transaction history

### Virtual Card Management
- `POST /api/virtual-cards` - Create virtual card for subscription
- `GET /api/virtual-cards` - List user's virtual cards

### Mulah Mesh (Merchant Sync)
- `POST /api/mesh/negotiate-anchor` - Negotiate billing anchor with merchant
- `GET /api/mesh/supported-merchants` - List supported merchants
- `POST /api/mesh/bulk-reschedule` - Bulk reschedule to optimal anchor

### Smart Buffer (BNPL)
- `POST /api/buffer/initiate-bnpl` - Initiate BNPL payment
- `GET /api/buffer/active-bnpl` - List active BNPL transactions
- `GET /api/buffer/exposure` - Total BNPL exposure

### Payment Scheduler
- `GET /api/payments/upcoming` - Upcoming scheduled payments
- `POST /api/payments/schedule` - Schedule payment for subscription

### Webhooks
- `POST /api/webhooks/stripe` - Stripe webhook endpoint
- `POST /api/webhooks/klarna` - Klarna webhook endpoint
- `GET /api/webhooks/history` - Webhook processing history

## 🔐 Authentication & Security

- **Replit Auth** with OpenID Connect (mandatory)
- **PostgreSQL-backed sessions** for security
- **Webhook signature verification** for external services
- **Input validation** with Zod schemas
- **SQL injection protection** via Drizzle ORM

## 🚦 Development Workflow

### Service Architecture

The platform uses a modular service architecture:

```
server/services/
├── uswService.ts          # USW fund collection & disbursement
├── virtualCardService.ts  # Stripe Issuing integration
├── meshService.ts         # Merchant sync engine
├── bufferService.ts       # BNPL fallback layer
├── paymentSchedulerService.ts # Smart payment timing
└── webhookService.ts      # External webhook processing
```

### Adding New Features

1. **Service Layer**: Implement business logic in appropriate service
2. **API Routes**: Add endpoints in `server/routes.ts`
3. **Frontend**: Create components in `client/src/components`
4. **Types**: Update shared schemas in `shared/schema.ts`

## 📊 Financial Middleware Features

### USW (Unified Subscription Wallet)
- Monthly fund collection from user's bank account
- Automatic disbursement to virtual cards
- Fee calculation with Premium user support
- Transaction history and balance tracking

### Virtual Card Management
- Automatic card creation for each subscription
- Spending limits and merchant restrictions
- Real-time transaction monitoring
- Failed payment retry logic

### Mulah Mesh (Merchant Sync Engine)
- Billing anchor negotiation with supported merchants
- Bulk rescheduling for optimal payment timing
- Merchant API integration where available
- Fallback handling for unsupported merchants

### Smart Buffer (BNPL Fallback)
- Klarna integration for payment failures
- User eligibility checking
- Installment payment management
- Total exposure tracking

## 🎯 Deployment

### Production Requirements

1. **Financial API Keys**: Stripe, Klarna, Open Banking credentials
2. **Webhook Security**: Proper signature verification setup
3. **Database**: Production PostgreSQL instance
4. **SSL/TLS**: HTTPS required for financial operations
5. **Compliance**: PCI DSS considerations for payment processing

### Replit Deployment

The application is designed for seamless Replit deployment:

1. **Environment Variables**: Configure in Replit Secrets
2. **Database**: Use Replit's integrated PostgreSQL
3. **Authentication**: Replit Auth auto-configured
4. **Webhooks**: Use provided domain for webhook URLs

## 🔄 MVP Development Status

### ✅ Phase 0: Core Platform (Complete)
- Subscription tracking with modern UI
- USW calculation and preview
- Database architecture and authentication

### 🔄 Phase 1: Financial Integration (In Progress)
- Virtual Card Management (Stripe Issuing API)
- USW Fund Collection & Disbursement
- Payment Scheduler with Retry Logic
- Webhook Management for Payment Events

### 📋 Phase 2: Advanced Features (Planned)
- Mulah Mesh: Full merchant sync engine
- Smart Buffer: Complete BNPL integration
- Open Banking transaction sync
- AI transaction classifier & insights
- "Cover This?" smart prompts
- Bill calendar & anchor rescheduling

## 🤝 Contributing

This is a production business venture. The architecture supports:

- **Microservices approach** for scalability
- **Financial compliance** considerations
- **Real-time payment processing** capabilities
- **Comprehensive webhook handling**
- **Modular service integration**

## 📄 License

Private business project - All rights reserved.

---

**Note**: This is financial middleware software. Ensure proper security, compliance, and testing before processing real payments.