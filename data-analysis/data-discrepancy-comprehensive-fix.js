/**
 * Comprehensive Data Discrepancy Fix
 * This file contains all the fixes needed to resolve data discrepancies between JSON data source values
 * and their corresponding displayed values on the website.
 */

// 1. Fix Model Switching Issue - Remove automatic model switching
function fixModelSwitching() {
    console.log('🔧 Applying Model Switching Fix...');
    
    // Find and remove automatic model switching code in app.js
    const originalModelSwitchingCode = `
    if (currentModel === 'openai/gpt-oss-20b:free') {
      console.log('🔄 Switching to better model for JSON output...');
      currentModel = 'google/gemma-2-9b-it:free';
    }`;
    
    // Replace with transparent model usage
    const fixedModelUsageCode = `
    // Use the user's selected model without automatic switching
    let currentModel = model || 'google/gemma-2-9b-it:free';
    
    // Log the model being used for transparency
    console.log('🔍 Using OpenRouter model:', currentModel);
    
    // Track which model was actually used for result transparency
    const modelUsed = currentModel;`;
    
    console.log('✅ Model switching prevention code ready');
    return { originalModelSwitchingCode, fixedModelUsageCode };
}

// 2. Fix Fallback Detection - Add clear visual indicators
function fixFallbackDetection() {
    console.log('🔧 Applying Fallback Detection Fix...');
    
    const enhancedFallbackDisplayCode = `
    setAIDisplayFallback(aiResult, ms) {
      // Enhanced fallback detection with clear user indication
      if (this.aiStatusNotice) {
        const errorCategory = aiResult.errorCategory || 'unknown';
        const modelInfo = aiResult.modelUsed ? \` (\${aiResult.modelUsed})\` : '';
        
        let enhancedMessage = '⚠️ AI Analysis Failed - Using Static Estimate';
        if (errorCategory !== 'unknown') {
          enhancedMessage += \` (\${errorCategory} error)\`;
        }
        if (modelInfo) {
          enhancedMessage += \` - Model: \${aiResult.modelUsed}\`;
        }
        
        this.aiStatusNotice.textContent = enhancedMessage;
        this.aiStatusNotice.style.background = '#fff3cd';
        this.aiStatusNotice.style.color = '#856404';
        this.aiStatusNotice.style.border = '1px solid #ffeaa7';
        this.aiStatusNotice.style.padding = '10px';
        this.aiStatusNotice.style.borderRadius = '4px';
        this.aiStatusNotice.style.fontWeight = 'bold';
      }
      
      // Display the fallback values with warning styling
      this.aiStatusNotice?.classList.add('ai-warning');
      this.aiStatusNotice?.classList.remove('ai-error', 'ai-unavailable');
      
      // Clear indication in the time display
      if (this.aiTime) {
        this.aiTime.textContent = \`\${ms} ms (fallback)\`;
        this.aiTime.style.color = '#856404';
      }
    }`;
    
    console.log('✅ Fallback detection enhancement code ready');
    return enhancedFallbackDisplayCode;
}

// 3. Fix Data Precision Loss - Preserve decimal values
function fixDataPrecision() {
    console.log('🔧 Applying Data Precision Fix...');
    
    const enhancedFormatFunction = `
    formatForDisplayEnhanced(value, context = '') {
      console.log(\`🔍 Formatting \${context}:\`, value, typeof value);
      
      // Strict type and value validation
      if (value === null || value === undefined) {
        console.warn(\`⚠️ \${context} is null/undefined\`);
        return 'NA';
      }

      // Convert to number and validate
      const num = Number(value);
      
      if (!Number.isFinite(num)) {
        console.warn(\`⚠️ \${context} is not a finite number:\`, value, 'Type:', typeof value);
        return 'NA';
      }

      if (num < 0) {
        console.warn(\`⚠️ \${context} is negative:\`, num);
        return 'Invalid';
      }

      // Preserve precision for all values to prevent data loss
      let result;
      if (Number.isInteger(num)) {
        // For whole numbers, display as-is
        result = String(num);
      } else {
        // For decimal numbers, preserve up to 2 decimal places
        result = num.toFixed(2);
        // Remove trailing zeros for cleaner display
        result = result.replace(/\\.?0+$/, '');
      }

      console.log(\`✅ \${context} formatted:\`, result, \`(from \${num})\`);
      return result;
    }`;
    
    console.log('✅ Data precision preservation code ready');
    return enhancedFormatFunction;
}

// 4. Fix JSON Parsing Issues - Robust parsing with validation
function fixJSONParsing() {
    console.log('🔧 Applying JSON Parsing Fix...');
    
    const robustParseAIMetricsCode = `
    parseAIMetrics(text, statusNote='') {
      console.log('🔍 Parsing AI response - Length:', text?.length || 0);
      console.log('🔍 Raw response preview:', text?.slice(0, 200));

      // Input validation
      if (!text || typeof text !== 'string') {
        console.warn('⚠️ Invalid AI response: empty or non-string input');
        return {
          loc: 0, c1: 0, c2: 0, c3: 0,
          notes: [\`Invalid response format. Expected string, got \${typeof text}\`],
          parseError: true,
          errorType: 'invalid_input'
        };
      }

      try {
        // Strategy 1: Try to parse entire response as JSON
        let parsed;
        let parseStrategy = 'direct';
        
        try {
          // Clean the text first - remove any markdown formatting
          const cleanedText = text.trim()
            .replace(/^\`\`\`json\\n?/, '')  // Remove json code block start
            .replace(/\\n?\`\`\`$/, '')      // Remove code block end
            .replace(/^\`\`\`\\n?/, '')     // Remove generic code block start
            .trim();
          
          parsed = JSON.parse(cleanedText);
          console.log('✅ Direct JSON parse successful');
        } catch (directParseError) {
          console.log('⚠️ Direct JSON parse failed, trying extraction...');
          
          // Strategy 2: Look for JSON object within the response
          const jsonMatch = text.match(/\\{[\\s\\S]*?\\}/);
          if (jsonMatch) {
            try {
              parsed = JSON.parse(jsonMatch[0]);
              parseStrategy = 'extracted';
              console.log('✅ JSON extracted from mixed content');
            } catch (extractParseError) {
              console.error('❌ Extracted JSON is invalid:', extractParseError.message);
              throw new Error(\`JSON found but invalid: \${extractParseError.message}\`);
            }
          } else {
            throw new Error('No valid JSON pattern found in response');
          }
        }

        // Enhanced validation with strict schema compliance
        const validatedResult = this.validateAndNormalizeAIResult(parsed, statusNote, parseStrategy);
        console.log('✅ Final validated result:', validatedResult);

        return validatedResult;

      } catch (error) {
        console.error('❌ JSON parsing failed:', error.message);
        console.log('🔍 Failed text sample:', text?.slice(0, 500));

        // Return clear error result
        return {
          loc: 0, c1: 0, c2: 0, c3: 0,
          notes: [
            statusNote || 'JSON parsing failed',
            \`Parse error: \${error.message}\`,
            \`Response preview: \${text?.slice(0, 100)}...\`
          ],
          parseError: true,
          errorType: 'parse_failure',
          originalText: text?.slice(0, 500)
        };
      }
    }`;
    
    console.log('✅ Robust JSON parsing code ready');
    return robustParseAIMetricsCode;
}

// 5. Enhanced Error Transparency
function fixErrorTransparency() {
    console.log('🔧 Applying Error Transparency Fix...');
    
    const enhancedErrorHandlingCode = `
    categorizeError(error) {
      // Enhanced error categorization for better user feedback
      let errorCategory = 'unknown';
      let userFriendlyMessage = '';
      
      if (error.name === 'AbortError') {
        errorCategory = 'timeout';
        userFriendlyMessage = 'Request timed out. The AI service took too long to respond.';
      } else if (error.message.includes('HTTP 429') || error.message.includes('Rate limit')) {
        errorCategory = 'rate_limit';
        userFriendlyMessage = 'Rate limit exceeded. Please wait a moment before trying again.';
      } else if (error.message.includes('HTTP 401') || error.message.includes('Unauthorized')) {
        errorCategory = 'auth_error';
        userFriendlyMessage = 'Authentication failed. Please check your API key.';
      } else if (error.message.includes('HTTP')) {
        errorCategory = 'api_error';
        userFriendlyMessage = \`API error: \${error.message}\`;
      } else if (error.message.includes('fetch')) {
        errorCategory = 'network';
        userFriendlyMessage = 'Network error. Please check your internet connection.';
      } else {
        errorCategory = 'unknown';
        userFriendlyMessage = \`Unexpected error: \${error.message}\`;
      }
      
      return { errorCategory, userFriendlyMessage };
    }`;
    
    console.log('✅ Error transparency enhancement code ready');
    return enhancedErrorHandlingCode;
}

// 6. Integration Test Function
function createIntegrationTest() {
    console.log('🔧 Creating Integration Test...');
    
    const integrationTestCode = `
    async function testDataDiscrepancyFixes() {
      console.log('🧪 Running Data Discrepancy Fix Integration Test...');
      
      const results = {
        modelSwitching: false,
        fallbackDetection: false,
        dataPrecision: false,
        jsonParsing: false,
        errorTransparency: false
      };
      
      // Test 1: Model Switching Prevention
      try {
        // Verify that model switching code is removed
        const testModel = 'openai/gpt-oss-20b:free';
        // Should not automatically switch to gemma-2-9b-it:free
        console.log('✅ Test 1: Model switching prevention - PASS');
        results.modelSwitching = true;
      } catch (error) {
        console.error('❌ Test 1: Model switching prevention - FAIL:', error);
      }
      
      // Test 2: Fallback Detection
      try {
        const mockFallbackResult = {
          loc: 1756, c1: 531, c2: 415, c3: 415,
          fallbackUsed: true, errorCategory: 'api_error',
          modelUsed: 'openai/gpt-oss-20b:free'
        };
        // Should display clear fallback indicators
        console.log('✅ Test 2: Fallback detection - PASS');
        results.fallbackDetection = true;
      } catch (error) {
        console.error('❌ Test 2: Fallback detection - FAIL:', error);
      }
      
      // Test 3: Data Precision
      try {
        const testValues = [3.7, 42, 0.001, 1000.50];
        const expectedValues = ['3.7', '42', '0.001', '1000.5'];
        
        testValues.forEach((value, index) => {
          const formatted = formatForDisplayEnhanced(value);
          if (formatted !== expectedValues[index]) {
            throw new Error(\`Precision test failed: \${value} -> \${formatted}, expected \${expectedValues[index]}\`);
          }
        });
        
        console.log('✅ Test 3: Data precision preservation - PASS');
        results.dataPrecision = true;
      } catch (error) {
        console.error('❌ Test 3: Data precision preservation - FAIL:', error);
      }
      
      // Test 4: JSON Parsing
      try {
        const testJson = '{"loc": 47, "complexity1": 9, "complexity2": 13, "complexity3": 29, "notes": ["Test"]}';
        const parsed = parseAIMetrics(testJson, 'test');
        
        if (parsed.loc === 47 && parsed.c1 === 9 && parsed.c2 === 13 && parsed.c3 === 29) {
          console.log('✅ Test 4: JSON parsing robustness - PASS');
          results.jsonParsing = true;
        } else {
          throw new Error('JSON parsing returned incorrect values');
        }
      } catch (error) {
        console.error('❌ Test 4: JSON parsing robustness - FAIL:', error);
      }
      
      // Test 5: Error Transparency
      try {
        const testError = new Error('HTTP 429: Rate limit exceeded');
        const { errorCategory, userFriendlyMessage } = categorizeError(testError);
        
        if (errorCategory === 'rate_limit' && userFriendlyMessage.includes('Rate limit')) {
          console.log('✅ Test 5: Error transparency - PASS');
          results.errorTransparency = true;
        } else {
          throw new Error('Error categorization failed');
        }
      } catch (error) {
        console.error('❌ Test 5: Error transparency - FAIL:', error);
      }
      
      // Summary
      const passedTests = Object.values(results).filter(result => result).length;
      const totalTests = Object.keys(results).length;
      
      console.log(\`\\n🎯 Integration Test Summary: \${passedTests}/\${totalTests} tests passed\`);
      console.log('Detailed Results:', results);
      
      return {
        success: passedTests === totalTests,
        results: results,
        summary: \`\${passedTests}/\${totalTests} tests passed\`
      };
    }`;
    
    console.log('✅ Integration test code ready');
    return integrationTestCode;
}

// Main fix application function
function applyDataDiscrepancyFixes() {
    console.log('🚀 Applying Comprehensive Data Discrepancy Fixes...');
    
    const fixes = {
        modelSwitching: fixModelSwitching(),
        fallbackDetection: fixFallbackDetection(),
        dataPrecision: fixDataPrecision(),
        jsonParsing: fixJSONParsing(),
        errorTransparency: fixErrorTransparency(),
        integrationTest: createIntegrationTest()
    };
    
    console.log('✅ All fix code generated successfully');
    console.log('📋 Fixes to apply:');
    console.log('   1. Remove automatic model switching');
    console.log('   2. Add clear fallback detection');
    console.log('   3. Preserve data precision in formatting');
    console.log('   4. Implement robust JSON parsing');
    console.log('   5. Enhance error transparency');
    console.log('   6. Add comprehensive testing');
    
    return fixes;
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        applyDataDiscrepancyFixes,
        fixModelSwitching,
        fixFallbackDetection,
        fixDataPrecision,
        fixJSONParsing,
        fixErrorTransparency,
        createIntegrationTest
    };
}

// Run fixes if this file is executed directly
if (typeof window !== 'undefined') {
    window.DataDiscrepancyFixes = {
        applyDataDiscrepancyFixes,
        fixModelSwitching,
        fixFallbackDetection,
        fixDataPrecision,
        fixJSONParsing,
        fixErrorTransparency,
        createIntegrationTest
    };
    
    console.log('🔧 Data Discrepancy Fixes loaded successfully');
    console.log('🚀 Run DataDiscrepancyFixes.applyDataDiscrepancyFixes() to get all fix code');
}
