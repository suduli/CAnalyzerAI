// Browser Test Script for AI Analysis
// Run this in the browser console at http://localhost:8000

console.log('🧪 CAnalyzerAI Browser Test Suite');
console.log('================================');

// Test 1: Check if app is loaded
console.log('Test 1: App Initialization');
if (typeof window.CAnalyzerAI === 'object') {
    console.log('✅ App instance found:', window.CAnalyzerAI);
} else {
    console.log('❌ App instance not found');
}

// Test 2: Set up OpenRouter configuration
console.log('\nTest 2: OpenRouter Configuration');
const apiKey = '';
const provider = 'openrouter';
const model = 'google/gemma-2-9b-it:free';

// Set localStorage values
localStorage.setItem('cai_provider', provider);
localStorage.setItem('cai_api_key', apiKey);
localStorage.setItem('selectedModel', model);

console.log('✅ Provider set to:', localStorage.getItem('cai_provider'));
console.log('✅ API Key set (length):', localStorage.getItem('cai_api_key').length);
console.log('✅ Model set to:', localStorage.getItem('selectedModel'));

// Test 3: Check API status
console.log('\nTest 3: API Status Check');
if (window.checkAIStatus) {
    const status = window.checkAIStatus();
    console.log('🔍 Current AI Configuration:');
    console.log('   Provider:', status.provider);
    console.log('   Model:', status.model);
    console.log('   Has API Key:', status.hasApiKey);
} else {
    console.log('❌ checkAIStatus function not available');
}

// Test 4: Test AI analysis pipeline
console.log('\nTest 4: AI Analysis Pipeline Test');
if (window.testAIPipeline) {
    console.log('🚀 Running AI pipeline test...');
    window.testAIPipeline().then(result => {
        console.log('📊 Pipeline test result:', result);
        if (result.success) {
            console.log('✅ AI pipeline test passed');
        } else {
            console.log('❌ AI pipeline test failed:', result.error);
        }
    }).catch(error => {
        console.log('❌ AI pipeline test error:', error);
    });
} else {
    console.log('❌ testAIPipeline function not available');
}

// Test 5: Manual AI analysis test
console.log('\nTest 5: Manual AI Analysis Test');
const testCode = `
#include <stdio.h>
int factorial(int n) {
    if (n <= 1) return 1;
    return n * factorial(n - 1);
}
int main() {
    printf("Factorial of 5: %d\\n", factorial(5));
    return 0;
}`;

if (window.CAnalyzerAI && window.CAnalyzerAI.performAIAnalysis) {
    console.log('📡 Testing AI analysis with sample code...');
    window.CAnalyzerAI.performAIAnalysis(testCode).then(result => {
        console.log('🎯 AI Analysis Result:');
        console.log('   LOC:', result.loc);
        console.log('   C1:', result.c1);
        console.log('   C2:', result.c2);
        console.log('   C3:', result.c3);
        console.log('   Notes:', result.notes);
        console.log('   Parse Error:', result.parseError || false);
        console.log('   Unavailable:', result.unavailable || false);

        if (!result.unavailable && !result.parseError) {
            console.log('✅ AI analysis successful!');
        } else {
            console.log('⚠️ AI analysis had issues');
        }
    }).catch(error => {
        console.log('❌ AI analysis failed:', error);
    });
} else {
    console.log('❌ performAIAnalysis method not available');
}

// Test 6: UI Elements Check
console.log('\nTest 6: UI Elements Check');
const uiElements = [
    'aiStatusNotice',
    'aiLOC',
    'aiComplexity1',
    'aiComplexity2',
    'aiComplexity3',
    'aiTime'
];

uiElements.forEach(id => {
    const element = document.getElementById(id);
    if (element) {
        console.log(`✅ ${id}: Found (${element.tagName})`);
    } else {
        console.log(`❌ ${id}: Not found`);
    }
});

console.log('\n🎯 Test Instructions:');
console.log('1. Upload c-example.c file using the file input');
console.log('2. Click "Analyze Code" button');
console.log('3. Wait for analysis to complete');
console.log('4. Check the "AI Analysis" section for results');
console.log('5. Verify that complexity metrics are displayed');
console.log('6. Check the comparison section for differences');

console.log('\n🔧 Debug Commands:');
console.log('- window.checkAIStatus() - Check current configuration');
console.log('- window.testAIPipeline() - Run full pipeline test');
console.log('- window.debugAIParsing("json_string") - Test JSON parsing');
console.log('- window.CAnalyzerAI - Access app instance');

console.log('\n🚀 Ready for testing!');
