# Mulah v1.0 MVP Testing Checklist

## Core Features Testing

### ✅ Authentication & User Management
- [x] User login with Replit Auth
- [x] User data persistence
- [x] Session management
- [ ] Premium status management

### ✅ Subscription Management
- [x] Add new subscription (manual entry)
- [x] Edit existing subscription 
- [x] Delete subscription
- [x] View subscription list
- [x] Category and billing cycle support
- [x] Cost and currency handling

### ✅ USW (Unified Subscription Wallet)
- [x] USW calculation logic
- [x] Fee structure implementation (€3.99 base + overages)
- [x] Premium user handling (free USW)
- [x] Monthly/yearly/weekly prorating
- [x] Interactive USW interface
- [ ] Actual payment processing

### 🔄 Analytics & Insights
- [x] Monthly total calculations
- [x] Annual total calculations
- [x] Category breakdowns
- [x] Upcoming renewals
- [ ] AI-powered insights (mock implemented)

### 🔄 UI/UX Testing
- [x] Mobile-responsive design
- [x] Glass morphism animations
- [x] Bottom navigation
- [x] Loading states
- [x] Error handling
- [ ] Progressive Web App features

## USW Testing Scenarios

### Test Case 1: Basic USW (Under €60, ≤3 subs)
**Setup:**
- 2 monthly subscriptions: Netflix (€15.99) + Spotify (€9.99)
- Total: €25.98
- Expected fee: €3.99 (standard)

### Test Case 2: Overage Fees (>€60 or >3 subs)
**Setup:**
- 5 subscriptions totaling €90/month
- Expected fee: €3.99 + €2 (extra subs) + 3% overage
- Should trigger percentage fee calculation

### Test Case 3: Premium User
**Setup:**
- Premium user flag enabled
- Any number of subscriptions
- Expected fee: €0.00 (included in Premium)

### Test Case 4: Mixed Billing Cycles
**Setup:**
- Monthly: €30
- Yearly: €120 (€10/month prorated)
- Weekly: €5 (€21.65/month prorated)
- Total: €61.65/month

## Manual Testing Steps

1. **Login Flow:**
   - Visit `/api/login`
   - Complete OAuth flow
   - Verify user data persistence

2. **Add Demo Subscriptions:**
   - Netflix (€15.99/month)
   - Spotify (€9.99/month) 
   - Adobe CC (€59.99/month)
   - GitHub (€48/year)
   - Dropbox (€9.99/month)

3. **Test USW Calculation:**
   - Navigate to `/usw`
   - Verify total calculation
   - Check fee structure
   - Test run confirmation modal

4. **Test Analytics:**
   - Check dashboard totals
   - Verify category breakdowns
   - Test upcoming renewals

## Production Readiness Checklist

### Backend
- [x] Error handling and validation
- [x] Database schema and migrations
- [x] API endpoints with proper responses
- [ ] Rate limiting
- [ ] Logging and monitoring
- [ ] Environment variable management

### Frontend
- [x] Responsive design
- [x] Loading and error states
- [x] Form validation
- [x] Navigation and routing
- [ ] Offline support (PWA)
- [ ] Performance optimization

### Security
- [x] Authentication and authorization
- [x] Input validation and sanitization
- [x] Secure session management
- [ ] HTTPS in production
- [ ] CORS configuration

### Deployment
- [ ] Production build process
- [ ] Environment configuration
- [ ] Database setup and migrations
- [ ] Monitoring and health checks
- [ ] Error tracking

## Known Issues & Next Steps

### Immediate Fixes Needed:
1. Fix API request format in USW component
2. Add Premium user flag to database and UI
3. Implement email notifications for renewals
4. Add subscription trial tracking

### v1.1 Features:
- Stripe payment integration
- PDF/CSV export functionality
- Enhanced insights with OpenAI
- Trial expiration tracking

### Testing Notes:
- All calculations should use proper number parsing for string costs
- Fee structure should match architecture spec exactly
- Premium users should see "FREE" instead of fees
- USW should handle edge cases (empty subscriptions, invalid data)