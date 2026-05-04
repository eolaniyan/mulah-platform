# Mulah: Complete Product Specification

## Overview

Mulah is a next-generation personal finance and subscription management platform that revolutionizes how users handle recurring payments through our Unified Subscription Wallet (USW) and advanced financial intelligence.

## Core Features

### 1. Subscription Management
- Add, edit, delete subscriptions with comprehensive tracking
- Smart categorization with AI-powered insights
- Real-time analytics and spending breakdowns
- Trial tracking with automated alerts

### 2. Unified Subscription Wallet (USW)
- **Revolutionary Payment Consolidation**: Pay all subscriptions with one monthly charge
- **Virtual Card Technology**: Generate unique virtual cards for each subscription
- **Smart Scheduling**: Intelligent payment timing aligned with user preferences
- **Fee Structure**: 
  - Premium subscribers: Included in €6.99/month
  - Pay-per-use: €3.99 per USW run
  - Volume discounts for high-spend users

### 3. Mulah Mesh (Advanced Feature)
- **Merchant Partnership Program**: Direct API integrations for billing date changes
- **Automatic Date Synchronization**: Align all subscription renewals to payday
- **Stripe-Powered Services**: Immediate billing cycle modifications
- **Universal Coverage**: Virtual card system for non-integrated merchants

### 4. AI-Powered Intelligence
- **GPT-Embedded Insights**: Personalized spending analysis
- **Smart Recommendations**: Subscription optimization suggestions
- **Trend Analysis**: Monthly and annual spending patterns
- **Predictive Alerts**: Upcoming renewals and budget warnings

## Technical Architecture

### Backend Services
- **Language**: Node.js with TypeScript
- **Framework**: Express.js with modern ES modules
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Replit Auth (OpenID Connect)
- **Payments**: Stripe (including Stripe Issuing for virtual cards)

### Frontend Technology
- **Framework**: React 18 with TypeScript
- **Styling**: Tailwind CSS with shadcn/ui components
- **State Management**: TanStack Query for server state
- **Design**: Mobile-first PWA with glass morphism effects

### External Integrations
- **Banking**: TrueLayer API for transaction analysis
- **AI**: OpenAI GPT for insights generation
- **Email**: Mailgun/SendGrid for notifications
- **Merchant APIs**: Direct subscription management where available

## Revenue Model

### Pricing Tiers
- **Free**: Basic subscription tracking (limited features)
- **Premium**: €6.99/month - USW included, unlimited insights, advanced features
- **Pay-per-use**: €3.99 per USW run for non-subscribers

### Additional Revenue Streams
- **Merchant Partnerships**: Revenue sharing with integrated services
- **API Licensing**: White-label USW technology to financial institutions
- **Affiliate Programs**: Subscription service recommendations

## USW Implementation Strategy

### Phase 1: Virtual Card System
- Stripe Issuing integration for virtual card generation
- Payment scheduling and merchant disbursement logic
- User dashboard for USW management

### Phase 2: Merchant Integrations
- Direct API partnerships with major subscription services
- Automated billing date modifications
- Real-time subscription status synchronization

### Phase 3: Financial Infrastructure
- Banking partnerships for built-in USW functionality
- Credit card company integrations
- B2B licensing of core technology

## Competitive Advantages

1. **True Innovation**: USW technology creates genuine barriers to entry
2. **Technical Sophistication**: Virtual card orchestration is complex to replicate
3. **Merchant Relationships**: First-mover advantage in partnership ecosystem
4. **Network Effects**: More merchants increase customer value exponentially

## Success Metrics

### Customer Acquisition
- Month 1: 100 signups, 10 paying customers
- Month 6: 2,000 signups, 200 paying customers
- Year 1: 10,000 signups, 1,000 paying customers

### Revenue Targets
- Break-even: 36 paying customers (€250 monthly costs)
- Year 1 Goal: €84,000 annual revenue (1,000 premium subscribers)
- Year 3 Goal: €4.2M annual revenue (50,000 users)

### Market Position
- Target displaced Mint users (13M available market)
- Position as premium alternative to basic tracking apps
- Build toward acquisition by major fintech player

## Slogan
"Simplify your spending. Amplify your peace. 🕊️"