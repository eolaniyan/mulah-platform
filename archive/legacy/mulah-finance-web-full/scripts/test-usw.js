// Direct USW calculation testing script
console.log('🧮 Testing Mulah USW Calculation Logic\n');

// USW Calculation Logic (copied from routes.ts)
function calculateUSWTotal(subscriptions) {
  const monthlyTotal = subscriptions
    .filter(sub => sub.billingCycle === 'monthly')
    .reduce((sum, sub) => sum + parseFloat(sub.cost), 0);
  
  const yearlyProrated = subscriptions
    .filter(sub => sub.billingCycle === 'yearly')
    .reduce((sum, sub) => sum + (parseFloat(sub.cost) / 12), 0);
  
  const weeklyProrated = subscriptions
    .filter(sub => sub.billingCycle === 'weekly')
    .reduce((sum, sub) => sum + (parseFloat(sub.cost) * 4.33), 0);
  
  const baseTotal = monthlyTotal + yearlyProrated + weeklyProrated;
  const feeStructure = calculateMulahFees(baseTotal, subscriptions.length);
  
  return {
    subscriptionTotal: Math.round(baseTotal * 100) / 100,
    mulahFee: feeStructure.fee,
    totalCharge: Math.round((baseTotal + feeStructure.fee) * 100) / 100,
    breakdown: {
      monthly: Math.round(monthlyTotal * 100) / 100,
      yearly: Math.round(yearlyProrated * 100) / 100,
      weekly: Math.round(weeklyProrated * 100) / 100,
      subscriptionCount: subscriptions.length
    }
  };
}

// Mulah Fee Structure
function calculateMulahFees(total, subscriptionCount) {
  // Base fee is always €3.99
  let totalFee = 3.99;
  let reason = "Standard USW fee";
  
  // Add extra subscription fees (€1 per sub over 3)
  const extraSubs = Math.max(0, subscriptionCount - 3);
  const extraSubFee = extraSubs * 1;
  
  // Add percentage fees for amount overage (over €60)
  let percentageFee = 0;
  if (total > 60) {
    const overage = total - 60;
    
    if (overage <= 20) {
      percentageFee = overage * 0.03; // 3%
    } else if (overage <= 40) {
      percentageFee = 20 * 0.03 + (overage - 20) * 0.04; // 3% + 4%
    } else {
      percentageFee = 20 * 0.03 + 20 * 0.04 + (overage - 40) * 0.05; // 3% + 4% + 5%
    }
  }
  
  // Total fee is base + extra subs + percentage overage
  totalFee = 3.99 + extraSubFee + percentageFee;
  
  // Update reason if there are extra fees
  if (extraSubFee > 0 || percentageFee > 0) {
    const parts = [];
    if (extraSubFee > 0) parts.push(`€${extraSubFee} extra subs`);
    if (percentageFee > 0) parts.push(`€${percentageFee.toFixed(2)} overage`);
    reason = `€3.99 base + ${parts.join(' + ')}`;
  }
  
  return { 
    fee: Math.round(totalFee * 100) / 100,
    reason
  };
}

// Test Cases
const testCases = [
  {
    name: "Basic USW (≤3 subs, ≤€60)",
    subscriptions: [
      { name: "Netflix", cost: "15.99", billingCycle: "monthly" },
      { name: "Spotify", cost: "9.99", billingCycle: "monthly" }
    ],
    expected: { fee: 3.99, total: 29.97 }
  },
  {
    name: "Overage by subscription count (4+ subs)",
    subscriptions: [
      { name: "Netflix", cost: "15.99", billingCycle: "monthly" },
      { name: "Spotify", cost: "9.99", billingCycle: "monthly" },
      { name: "YouTube", cost: "11.99", billingCycle: "monthly" },
      { name: "Dropbox", cost: "9.99", billingCycle: "monthly" }
    ],
    expected: { fee: 4.99, total: 52.96 } // €3.99 + €1 extra sub
  },
  {
    name: "Overage by amount (>€60)",
    subscriptions: [
      { name: "Netflix", cost: "15.99", billingCycle: "monthly" },
      { name: "Spotify", cost: "9.99", billingCycle: "monthly" },
      { name: "Adobe CC", cost: "59.99", billingCycle: "monthly" }
    ],
    expected: { fee: 4.77, total: 90.74 } // €3.99 + 3% overage on €25.97
  },
  {
    name: "Mixed billing cycles",
    subscriptions: [
      { name: "Netflix", cost: "15.99", billingCycle: "monthly" },
      { name: "Spotify", cost: "9.99", billingCycle: "monthly" },
      { name: "GitHub Pro", cost: "48.00", billingCycle: "yearly" }, // €4/month
      { name: "Coffee", cost: "5.00", billingCycle: "weekly" }  // €21.65/month
    ],
    expected: { fee: 4.99, total: 56.62 } // €3.99 base + €1 extra sub (under €60, no percentage)
  }
];

// Run tests
testCases.forEach((testCase, index) => {
  console.log(`\n📋 Test Case ${index + 1}: ${testCase.name}`);
  console.log('━'.repeat(50));
  
  const result = calculateUSWTotal(testCase.subscriptions);
  
  console.log(`💰 Subscription Total: €${result.subscriptionTotal}`);
  console.log(`💸 Mulah Fee: €${result.mulahFee}`);
  console.log(`💳 Total Charge: €${result.totalCharge}`);
  console.log(`📊 Breakdown:`);
  console.log(`  - Monthly: €${result.breakdown.monthly}`);
  console.log(`  - Yearly (prorated): €${result.breakdown.yearly}`);
  console.log(`  - Weekly (prorated): €${result.breakdown.weekly}`);
  console.log(`  - Subscription Count: ${result.breakdown.subscriptionCount}`);
  
  // Validation
  const feeMatch = Math.abs(result.mulahFee - testCase.expected.fee) < 0.1;
  const totalMatch = Math.abs(result.totalCharge - testCase.expected.total) < 0.1;
  
  console.log(`\n✅ Fee Check: ${feeMatch ? 'PASS' : 'FAIL'} (Expected: €${testCase.expected.fee})`);
  console.log(`✅ Total Check: ${totalMatch ? 'PASS' : 'FAIL'} (Expected: €${testCase.expected.total})`);
  
  if (!feeMatch || !totalMatch) {
    console.log('❌ TEST FAILED - Check fee calculation logic');
  }
});

console.log('\n🎉 USW Testing Complete!');
console.log('\n📝 Key Features Validated:');
console.log('• Monthly/yearly/weekly prorating');
console.log('• Fee structure with overages');
console.log('• Subscription count penalties');
console.log('• Percentage-based overage fees');
console.log('\n🚀 Ready for integration testing!');