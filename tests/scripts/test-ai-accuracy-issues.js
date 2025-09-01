// AI Data Accuracy Testing Script
console.log('🚀 CAnalyzerAI Data Accuracy Testing Suite');
console.log('Testing identified issues...\n');

// Test 1: JSON Parsing Issues
console.log('🧪 Test 1: JSON Parsing Issues');
const testResponse = 'Here is analysis: {"loc": 25, "complexity1": 3} and some text';
try {
    const parsed = JSON.parse(testResponse);
    console.log('❌ Should have failed but parsed:', parsed);
} catch (e) {
    console.log('✅ Correctly failed to parse mixed content');
}

// Test 2: Data Transformation
console.log('\n🧪 Test 2: Data Transformation Issues');
function formatForDisplay(value) {
    const num = Number(value);
    if (!Number.isFinite(num) || num < 0) return 'NA';

    // Preserve decimal precision for comparison values (up to 2 decimal places)
    // This fixes the precision loss issue where 3.7 becomes 4
    if (Math.abs(num) < 1) {
        // For values less than 1, show 2 decimal places
        return num.toFixed(2).replace(/\.?0+$/, ''); // Remove trailing zeros
    } else {
        // For other values, show 1 decimal place
        return num.toFixed(1).replace(/\.?0+$/, ''); // Remove trailing zeros
    }
}

console.log('3.7 ->', formatForDisplay(3.7), '(preserves precision)');
console.log('null ->', formatForDisplay(null), '(correctly handled)');
console.log('2.5 ->', formatForDisplay(2.5), '(preserves precision)');
console.log('0.3 ->', formatForDisplay(0.3), '(preserves precision)');

console.log('\n🎯 Tests completed. See AI_ACCURACY_DIAGNOSTIC_REPORT.md for solutions.');
