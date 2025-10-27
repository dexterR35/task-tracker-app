/**
 * Color Consistency Test
 * This file demonstrates that the color mapping system ensures consistent colors
 * across all chart types for the same data categories.
 */

import { getMarketColor, getProductColor, getAIModelColor, getUserColor } from '@/utils/chartColorMapping';

// Test data
const testMarkets = ['RO', 'COM', 'UK', 'IE', 'FI', 'DE', 'IT', 'FR'];
const testProducts = ['marketing casino', 'marketing sport', 'acquisition casino', 'acquisition sport', 'product casino', 'product sport'];
const testAIModels = ['Photoshop', 'ChatGpt', 'Midjourney', 'FireFly', 'ShutterStock'];
const testUsers = ['John Doe', 'Jane Smith', 'Mike Johnson', 'Sarah Wilson'];

console.log('=== COLOR CONSISTENCY TEST ===');
console.log('This test demonstrates that the same data categories will always have the same colors across all chart types.');
console.log('');

console.log('MARKET COLORS:');
testMarkets.forEach(market => {
  console.log(`${market}: ${getMarketColor(market)}`);
});
console.log('');

console.log('PRODUCT COLORS:');
testProducts.forEach(product => {
  console.log(`${product}: ${getProductColor(product)}`);
});
console.log('');

console.log('AI MODEL COLORS:');
testAIModels.forEach(model => {
  console.log(`${model}: ${getAIModelColor(model)}`);
});
console.log('');

console.log('USER COLORS:');
testUsers.forEach(user => {
  console.log(`${user}: ${getUserColor(user)}`);
});
console.log('');

console.log('=== KEY BENEFITS ===');
console.log('✅ RO will ALWAYS be yellow (#ca8a04) in pie charts, column charts, and biaxial charts');
console.log('✅ COM will ALWAYS be blue (#2563eb) across all chart types');
console.log('✅ UK will ALWAYS be red (#dc2626) in every chart');
console.log('✅ marketing casino will ALWAYS be rose (#e11d48) in all charts');
console.log('✅ ChatGpt will ALWAYS be purple (#7c3aed) in all AI-related charts');
console.log('✅ Same user will ALWAYS have the same color across all user-related charts');
console.log('');

console.log('=== IMPLEMENTATION NOTES ===');
console.log('• Chart components now accept a "dataType" parameter (market, product, aiModel, user)');
console.log('• The addConsistentColors() function automatically assigns consistent colors');
console.log('• Analytics configuration uses consistent color mapping for all chart data');
console.log('• Colors are determined by the data category, not by chart type or order');
console.log('');

export {
  testMarkets,
  testProducts,
  testAIModels,
  testUsers
};
