// Demo data seeder for Mulah testing
const { db } = require('../server/db');
const { subscriptions, users } = require('../shared/schema');

async function seedTestData() {
  console.log('🌱 Seeding Mulah test data...');
  
  try {
    // Create test user (this would normally be handled by auth)
    const testUserId = "test-user-123";
    
    // Demo subscriptions for testing USW functionality
    const demoSubscriptions = [
      {
        userId: testUserId,
        name: "Netflix",
        cost: "15.99",
        currency: "EUR",
        billingCycle: "monthly",
        nextBillingDate: new Date(2025, 0, 15), // Jan 15
        category: "Entertainment",
        description: "Premium streaming plan",
        iconColor: "#E50914",
        iconName: "fas fa-play",
        isActive: true
      },
      {
        userId: testUserId,
        name: "Spotify Premium",
        cost: "9.99",
        currency: "EUR", 
        billingCycle: "monthly",
        nextBillingDate: new Date(2025, 0, 20), // Jan 20
        category: "Music",
        description: "Music streaming",
        iconColor: "#1DB954",
        iconName: "fas fa-music",
        isActive: true
      },
      {
        userId: testUserId,
        name: "Adobe Creative Cloud",
        cost: "59.99",
        currency: "EUR",
        billingCycle: "monthly", 
        nextBillingDate: new Date(2025, 0, 25), // Jan 25
        category: "Design",
        description: "Creative suite",
        iconColor: "#FF0000",
        iconName: "fas fa-palette",
        isActive: true
      },
      {
        userId: testUserId,
        name: "GitHub Pro",
        cost: "48.00",
        currency: "EUR",
        billingCycle: "yearly",
        nextBillingDate: new Date(2025, 11, 15), // Dec 15
        category: "Productivity",
        description: "Development platform",
        iconColor: "#24292e",
        iconName: "fas fa-code",
        isActive: true
      },
      {
        userId: testUserId,
        name: "Dropbox Plus",
        cost: "9.99",
        currency: "EUR",
        billingCycle: "monthly",
        nextBillingDate: new Date(2025, 0, 10), // Jan 10
        category: "Storage",
        description: "Cloud storage",
        iconColor: "#0061FF",
        iconName: "fas fa-cloud",
        isActive: true
      }
    ];

    // Insert demo subscriptions
    for (const sub of demoSubscriptions) {
      await db.insert(subscriptions).values(sub);
    }

    console.log('✅ Demo data seeded successfully!');
    console.log(`📊 Added ${demoSubscriptions.length} test subscriptions`);
    console.log('🧮 USW Total: €111.96/month (€85.97 subs + €4.00 yearly prorated)');
    console.log('💰 Expected Mulah fee: €4.60 (€1 extra sub + 3% overage)');
    
  } catch (error) {
    console.error('❌ Error seeding data:', error);
  }
}

// Run if called directly
if (require.main === module) {
  seedTestData().then(() => process.exit(0));
}

module.exports = { seedTestData };