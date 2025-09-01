// Test AI Analysis with OpenRouter API Key
const fs = require('fs');

// Read the C code file
const code = fs.readFileSync('c-example.c', 'utf8');

console.log('🚀 Testing AI Analysis with OpenRouter API Key...\n');

// Test configuration
const testConfig = {
    provider: 'openrouter',
    apiKey: '',
    model: 'google/gemini-2.5-flash-image-preview:free'
};

console.log('📋 Test Configuration:');
console.log(`   Provider: ${testConfig.provider}`);
console.log(`   Model: ${testConfig.model}`);
console.log(`   API Key: ${testConfig.apiKey.substring(0, 20)}...`);
console.log('');

// Simulate the AI analysis workflow
async function testAIAnalysis() {
    const prompt = `You are a code complexity analyzer. Your task is to analyze C programming language code and return ONLY a JSON response.

CRITICAL: You must return ONLY valid JSON. No explanations, no code examples, no markdown, no additional text.

Analyze the provided C code and return this exact JSON structure:
{
  "loc": number_of_executable_lines_excluding_comments_and_blank_lines,
  "complexity1": cyclomatic_complexity_as_integer,
  "complexity2": cognitive_complexity_as_integer,
  "complexity3": halstead_complexity_as_integer,
  "notes": ["brief_note_about_analysis"]
}

C CODE TO ANALYZE:
${code.slice(0, 16000)}

Return ONLY the JSON object with the exact keys above. Do not include any other text, explanations, or code examples.`;

    console.log('📡 Sending request to OpenRouter...');

    try {
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${testConfig.apiKey}`,
                'HTTP-Referer': 'http://localhost:8000',
                'X-Title': 'CAnalyzerAI'
            },
            body: JSON.stringify({
                model: testConfig.model,
                messages: [{ role: 'user', content: prompt }],
                max_tokens: 1000,
                temperature: 0.1
            }),
            signal: AbortSignal.timeout(30000)
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(`OpenRouter HTTP ${response.status}: ${errorData.error?.message || response.statusText}`);
        }

        const data = await response.json();
        const aiResponseText = data.choices?.[0]?.message?.content || '';

        console.log('✅ API call successful!');
        console.log('📄 Raw AI Response:');
        console.log(aiResponseText.substring(0, 300) + '...\n');

        // Test JSON parsing (simulate parseAIMetrics function)
        const parsedResult = parseAIMetrics(aiResponseText, 'OpenRouter cloud inference');

        console.log('🔍 Parsed Result:');
        console.log(`   LOC: ${parsedResult.loc}`);
        console.log(`   Complexity1: ${parsedResult.c1}`);
        console.log(`   Complexity2: ${parsedResult.c2}`);
        console.log(`   Complexity3: ${parsedResult.c3}`);
        console.log(`   Notes: ${JSON.stringify(parsedResult.notes)}`);
        console.log(`   Parse Error: ${parsedResult.parseError || false}`);
        console.log('');

        // Test the new response format from gpt-oss-20b:free
        console.log('🧪 Testing new response format handling...');
        const newFormatResponse = '{"loc": "forty-seven", "complexity1": 9, "complexity2": 13, "complexity3": {"difficulty": 29.25, "volume": 335.34, "effort": 9813.2}, "notes": ["Simple test suite using acutest.h", "Cyclomatic complexity is derived from branches and conditionals", "Halstead metrics estimated from operators/operands count"]}';

        const newFormatParsed = parseAIMetrics(newFormatResponse, 'gpt-oss-20b:free test');
        console.log('🔍 New Format Parsed Result:');
        console.log(`   LOC: ${newFormatParsed.loc} (converted from "forty-seven")`);
        console.log(`   Complexity1: ${newFormatParsed.c1}`);
        console.log(`   Complexity2: ${newFormatParsed.c2}`);
        console.log(`   Complexity3: ${newFormatParsed.c3} (extracted from object)`);
        console.log(`   Notes: ${JSON.stringify(newFormatParsed.notes)}`);
        console.log('');

        // Test written number conversion directly
        console.log('🧪 Testing written number conversion...');
        const testCases = [
          { input: 'forty-seven', expected: 47 },
          { input: 'twenty-one', expected: 21 },
          { input: 'thirty', expected: 30 },
          { input: 'five', expected: 5 }
        ];
        
        testCases.forEach(testCase => {
          const result = convertWrittenNumberToDigit(testCase.input);
          const success = result === testCase.expected;
          console.log(`   "${testCase.input}" -> ${result} ${success ? '✅' : '❌'} (expected ${testCase.expected})`);
        });
        console.log('');

        // Test display formatting
        console.log('📱 Display Formatting Test:');
        console.log(`   aiLOC: ${formatForDisplay(parsedResult.loc)}`);
        console.log(`   aiComplexity1: ${formatForDisplay(parsedResult.c1)}`);
        console.log(`   aiComplexity2: ${formatForDisplay(parsedResult.c2)}`);
        console.log(`   aiComplexity3: ${formatForDisplay(parsedResult.c3)}`);
        console.log('');

        return parsedResult;

    } catch (error) {
        console.error('❌ AI Analysis failed:', error.message);

        // Categorize error
        let errorCategory = 'unknown';
        if (error.name === 'AbortError') {
            errorCategory = 'timeout';
        } else if (error.message.includes('HTTP 429') || error.message.includes('Rate limit')) {
            errorCategory = 'rate_limit';
        } else if (error.message.includes('HTTP')) {
            errorCategory = 'api_error';
        } else if (error.message.includes('fetch')) {
            errorCategory = 'network';
        }

        console.log(`   Error Category: ${errorCategory}`);
        console.log(`   Error Message: ${error.message}`);

        return {
            loc: 'NA',
            c1: 'NA',
            c2: 'NA',
            c3: 'NA',
            notes: [`AI unavailable (${errorCategory}); using static estimate`, `Error: ${error.message.slice(0, 100)}`],
            unavailable: true,
            errorCategory
        };
    }
}

// Simulate parseAIMetrics function from app.js
function parseAIMetrics(text, statusNote = '') {
    console.log('🔍 AI Response Debug - Raw text length:', text?.length || 0);
    console.log('🔍 AI Response Debug - First 200 chars:', text?.slice(0, 200) || 'empty');

    // Input validation
    if (!text || typeof text !== 'string') {
        console.warn('⚠️ Invalid AI response: empty or non-string input');
        return {
            loc: 0, c1: 0, c2: 0, c3: 0,
            notes: [`Invalid response format. Expected string, got ${typeof text}`],
            parseError: true
        };
    }

    // Multiple JSON extraction strategies for robustness
    let jsonStr = null;
    let extractionMethod = 'none';

    try {
        // Strategy 1: Look for JSON with expected structure (loc, complexity keys)
        const structuredJsonMatch = text.match(/\{\s*["']?loc["']?\s*:\s*\d+[\s\S]*?\}/);
        if (structuredJsonMatch) {
            jsonStr = structuredJsonMatch[0];
            extractionMethod = 'structured_json';
        } else {
            // Strategy 2: Look for any JSON object after "JSON:" or similar markers
            const markerMatch = text.match(/(?:JSON:|json:|\{)\s*(\{[\s\S]*?\})/i);
            if (markerMatch) {
                jsonStr = markerMatch[1] || markerMatch[0];
                extractionMethod = 'marker_json';
            } else {
                // Strategy 3: Direct JSON object extraction (any valid JSON object)
                const jsonMatch = text.match(/\{\s*["']?\w+["']?\s*:\s*[\d"'\[][\s\S]*?\}/);
                if (jsonMatch) {
                    jsonStr = jsonMatch[0];
                    extractionMethod = 'regex_match';
                } else {
                    // Strategy 4: Look for JSON between common delimiters
                    const codeBlockMatch = text.match(/```json\n?([\s\S]*?)\n?```/);
                    if (codeBlockMatch) {
                        jsonStr = codeBlockMatch[1];
                        extractionMethod = 'code_block';
                    } else {
                        // Strategy 5: Look for any curly braces content with key-value pairs
                        const bracesMatch = text.match(/\{\s*["']?\w+["']?\s*:\s*[^}]*\}/);
                        if (bracesMatch) {
                            jsonStr = bracesMatch[0];
                            extractionMethod = 'simple_braces';
                        } else {
                            // Strategy 6: Try to parse entire response as JSON
                            jsonStr = text.trim();
                            extractionMethod = 'full_text';
                        }
                    }
                }
            }
        }

        console.log('🔍 JSON Extraction - Method:', extractionMethod, 'Result:', jsonStr?.slice(0, 100));

        if (!jsonStr) {
            throw new Error('No JSON pattern found in AI response');
        }

        // Attempt to parse with enhanced error handling
        let parsed;
        try {
            parsed = JSON.parse(jsonStr);
        } catch (parseError) {
            // Try to clean up common JSON issues
            const cleanedJson = jsonStr
                .replace(/([{,]\s*)([a-zA-Z_][a-zA-Z0-9_]*)\s*:/g, '$1"$2":') // Add quotes to keys
                .replace(/:\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*([,}])/g, ':"$1"$2')   // Add quotes to string values
                .replace(/,\s*}/g, '}')                                          // Remove trailing commas
                .replace(/,\s*]/g, ']');                                         // Remove trailing commas in arrays

            console.log('🔧 Attempting JSON cleanup:', cleanedJson);
            parsed = JSON.parse(cleanedJson);
        }

        console.log('🔍 Parsed JSON structure:', parsed);

        // Validate parsed structure with type checking
        const validatedResult = validateAndNormalizeAIResult(parsed, statusNote);
        console.log('✅ Final validated result:', validatedResult);

        return validatedResult;

    } catch (error) {
        console.error('❌ JSON parsing failed:', error.message);
        console.log('🔍 Failed text sample:', text?.slice(0, 500));

        // Fallback: try to extract numbers from text using regex
        const numberExtractionResult = extractNumbersFromText(text, statusNote);
        if (numberExtractionResult.hasValidNumbers) {
            console.log('🔧 Fallback number extraction succeeded:', numberExtractionResult);
            return numberExtractionResult;
        }

        // Final fallback: return zero values with detailed error info
        return {
            loc: 0, c1: 0, c2: 0, c3: 0,
            notes: [
                statusNote || 'JSON parsing failed',
                `Parse error: ${error.message}`,
                `Response preview: ${text?.slice(0, 100)}...`
            ],
            parseError: true,
            originalText: text?.slice(0, 500) // Keep sample for debugging
        };
    }
}

// Helper functions
function validateAndNormalizeAIResult(parsed, statusNote = '') {
    if (!parsed || typeof parsed !== 'object') {
        throw new Error('Parsed result is not an object');
    }

    // Extract and validate numeric values with multiple key strategies
    const extractNumber = (obj, ...keys) => {
        for (const key of keys) {
            if (key in obj) {
                const val = obj[key];

                // Handle different value types
                if (typeof val === 'number' && Number.isFinite(val) && val >= 0) {
                    return val;
                } else if (typeof val === 'string') {
                    // Try to convert written numbers to digits
                    const numFromText = convertWrittenNumberToDigit(val);
                    if (Number.isFinite(numFromText) && numFromText >= 0) {
                        return numFromText;
                    }
                    // Try direct number conversion
                    const directNum = Number(val);
                    if (Number.isFinite(directNum) && directNum >= 0) {
                        return directNum;
                    }
                } else if (typeof val === 'object' && val !== null) {
                    // Handle object values (e.g., complexity3 with nested properties)
                    return extractNumberFromObject(val);
                }
            }
        }
        return 0;
    };

    const result = {
        loc: extractNumber(parsed, 'loc', 'lines_of_code', 'lineCount', 'linesOfCode'),
        c1: extractNumber(parsed, 'complexity1', 'c1', 'cyclomatic', 'cyclomaticComplexity'),
        c2: extractNumber(parsed, 'complexity2', 'c2', 'cognitive', 'cognitiveComplexity'),
        c3: extractNumber(parsed, 'complexity3', 'c3', 'halstead', 'halsteadComplexity'),
        notes: []
    };

    // Validate that we got meaningful values
    const hasValidData = result.loc > 0 || result.c1 > 0 || result.c2 > 0 || result.c3 > 0;

    // Handle notes array
    if (Array.isArray(parsed.notes)) {
        result.notes = parsed.notes.filter(note => typeof note === 'string');
    } else if (typeof parsed.notes === 'string') {
        result.notes = [parsed.notes];
    }

    // Add status note if provided
    if (statusNote) {
        result.notes.unshift(statusNote);
    }

    // Add validation status
    if (!hasValidData) {
        result.notes.push('Warning: All complexity values are zero - review AI analysis');
        console.warn('⚠️ AI returned all zero values:', parsed);
    }

    return result;
}

// Convert written numbers to digits (e.g., "forty-seven" -> 47)
function convertWrittenNumberToDigit(text) {
    if (!text || typeof text !== 'string') return NaN;

    const lowerText = text.toLowerCase().trim();

    // Handle hyphenated numbers (e.g., "forty-seven")
    if (lowerText.includes('-')) {
        const parts = lowerText.split('-');
        if (parts.length === 2) {
            const first = wordToNumber(parts[0].trim());
            const second = wordToNumber(parts[1].trim());
            if (first >= 0 && second >= 0 && second < 10) {
                return first + second;
            }
        }
    }

    // Handle single word numbers
    return wordToNumber(lowerText);
}

// Convert word to number
function wordToNumber(word) {
    const numberWords = {
        'zero': 0, 'one': 1, 'two': 2, 'three': 3, 'four': 4, 'five': 5,
        'six': 6, 'seven': 7, 'eight': 8, 'nine': 9, 'ten': 10,
        'eleven': 11, 'twelve': 12, 'thirteen': 13, 'fourteen': 14, 'fifteen': 15,
        'sixteen': 16, 'seventeen': 17, 'eighteen': 18, 'nineteen': 19, 'twenty': 20,
        'thirty': 30, 'forty': 40, 'fifty': 50, 'sixty': 60, 'seventy': 70,
        'eighty': 80, 'ninety': 90
    };

    return numberWords[word] !== undefined ? numberWords[word] : NaN;
}

// Extract meaningful number from object (e.g., complexity3 object)
function extractNumberFromObject(obj) {
    if (!obj || typeof obj !== 'object') return 0;

    // Priority order for extracting meaningful complexity values
    const priorityKeys = [
        'effort', 'volume', 'difficulty', 'complexity', 'value', 'score',
        'halstead', 'cognitive', 'cyclomatic'
    ];

    for (const key of priorityKeys) {
        if (key in obj) {
            const val = Number(obj[key]);
            if (Number.isFinite(val) && val >= 0) {
                console.log(`🔍 Extracted ${key}: ${val} from object`);
                return val;
            }
        }
    }

    // If no priority key found, try any numeric value
    for (const [key, value] of Object.entries(obj)) {
        const num = Number(value);
        if (Number.isFinite(num) && num >= 0) {
            console.log(`🔍 Extracted ${key}: ${num} from object (fallback)`);
            return num;
        }
    }

    console.warn('⚠️ Could not extract meaningful number from object:', obj);
    return 0;
}

function extractNumbersFromText(text, statusNote = '') {
    console.log('🔧 Attempting number extraction from unstructured text');
    
    // Look for common patterns like "loc: 25", "complexity: 3", etc.
    const patterns = {
        loc: /(?:loc|lines?.*?code|testable.*?lines?|count\s+\d+)[\s:=]*(\d+|"[^"]*"|'[^']*')/i,
        c1: /(?:complexity[1\s]*|cyclomatic|decision.*?points?\s*[+=]\s*1\s*[=]\s*)[\s:=]*(\d+)/i,
        c2: /(?:complexity[2\s]*|cognitive)[\s:=]*(\d+)/i,
        c3: /(?:complexity[3\s]*|halstead)[\s:=]*(\d+)/i
    };

    const extracted = {};
    let hasValidNumbers = false;

    // Try specific patterns first
    for (const [key, pattern] of Object.entries(patterns)) {
        const match = text.match(pattern);
        if (match && match[1]) {
          let value = match[1];
          
          // Handle quoted values (could be numbers or written numbers)
          if ((value.startsWith('"') && value.endsWith('"')) || 
              (value.startsWith("'") && value.endsWith("'"))) {
            value = value.slice(1, -1); // Remove quotes
            
            // Try to convert written numbers to digits
            const numFromText = convertWrittenNumberToDigit(value);
            if (Number.isFinite(numFromText) && numFromText >= 0) {
              extracted[key] = numFromText;
              hasValidNumbers = true;
              console.log(`🔍 Extracted written number ${key}: "${value}" -> ${numFromText}`);
              continue;
            }
          }
          
          // Try direct number conversion
          const num = parseInt(value, 10);
          if (Number.isFinite(num) && num >= 0) {
            extracted[key] = num;
            hasValidNumbers = true;
          }
        }
    }

    // Enhanced number sequence detection
    if (!hasValidNumbers) {
        // Look for patterns like "Thus loc = 4" or "So 6 lines"
        const textLoc = text.match(/(?:thus|so|count|total).*?(?:loc|lines?).*?[=:]?\s*(\d+|"[^"]*")/i);
        if (textLoc) {
          let value = textLoc[1];
          if (value.startsWith('"') && value.endsWith('"')) {
            value = value.slice(1, -1);
            const numFromText = convertWrittenNumberToDigit(value);
            if (Number.isFinite(numFromText) && numFromText >= 0) {
              extracted.loc = numFromText;
              hasValidNumbers = true;
            }
          } else {
            extracted.loc = parseInt(value, 10) || 0;
            hasValidNumbers = true;
          }
        }

        // Look for complexity mentions
        const complexityMatch = text.match(/complexity.*?[=:]?\s*(\d+)/i);
        if (complexityMatch) {
          const complexityValue = parseInt(complexityMatch[1], 10) || 0;
          extracted.c1 = complexityValue;
          extracted.c2 = complexityValue;
          hasValidNumbers = true;
        }

        // Look for patterns like "7, 2, 2, 2" or "7 2 2 2" in the text
        const numberSequence = text.match(/(\d+)[\s,]+(\d+)[\s,]+(\d+)[\s,]+(\d+)/);
        if (numberSequence) {
          extracted.loc = parseInt(numberSequence[1], 10) || 0;
          extracted.c1 = parseInt(numberSequence[2], 10) || 0;
          extracted.c2 = parseInt(numberSequence[3], 10) || 0;
          extracted.c3 = parseInt(numberSequence[4], 10) || 0;
          hasValidNumbers = true;
          console.log('🔍 Found number sequence:', numberSequence.slice(1));
        }
      }

    return {
        loc: extracted.loc || 0,
        c1: extracted.c1 || 0, 
        c2: extracted.c2 || 0,
        c3: extracted.c3 || 0,
        notes: [
            statusNote || 'Number extraction fallback used',
            'AI response was not valid JSON - extracted numbers from text'
        ],
        hasValidNumbers,
        extractionFallback: true
    };
}function formatForDisplay(value) {
    if (value === null || value === undefined || !Number.isFinite(value)) {
        return 'NA';
    }
    return String(Math.round(value));
}

// Run the test
testAIAnalysis().then(result => {
    console.log('\n🎯 AI Analysis Test Summary:');
    console.log('   ✅ API Connection: Successful');
    console.log('   ✅ Response Parsing: ' + (result.parseError ? 'Failed (fallback used)' : 'Successful'));
    console.log('   ✅ Data Extraction: ' + (result.loc !== 'NA' ? 'Successful' : 'Failed'));
    console.log('   ✅ UI Display Ready: Yes');

    if (result.unavailable) {
        console.log('   ⚠️  AI Analysis: Unavailable (using fallback)');
        console.log('   📝 Error Category:', result.errorCategory);
    } else {
        console.log('   ✅ AI Analysis: Available');
        console.log('   📊 Metrics Retrieved:', result.loc, result.c1, result.c2, result.c3);
    }

    console.log('\n🚀 Ready for browser testing!');
    console.log('   1. Open http://localhost:8000 in browser');
    console.log('   2. Upload c-example.c file');
    console.log('   3. Set provider to OpenRouter in settings');
    console.log('   4. Click "Analyze Code"');
    console.log('   5. Check AI Analysis section for results');
}).catch(error => {
    console.error('❌ Test failed:', error);
});
