#!/usr/bin/env node

/**
 * Quick OpenRouter API Test Script
 * Run this to test your API key and model access
 */

const testOpenRouterAPI = async () => {
    console.log('🔍 OpenRouter API Quick Test\n');
    
    // Check if API key is provided
    const apiKey = process.env.OPENROUTER_API_KEY || prompt('Enter your OpenRouter API key: ');
    
    if (!apiKey) {
        console.error('❌ No API key provided');
        return;
    }

    const models = [
        'google/gemini-2.0-flash-exp:free',
        'google/gemini-2.5-flash:free',
        'meta-llama/llama-3.1-8b-instruct:free'
    ];

    for (const model of models) {
        console.log(`\n🧪 Testing model: ${model}`);
        
        try {
            const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json',
                    'HTTP-Referer': 'https://localhost:3000',
                    'X-Title': 'API Test Script'
                },
                body: JSON.stringify({
                    model: model,
                    messages: [
                        {
                            role: 'user',
                            content: 'Hello! Please respond with "API test successful"'
                        }
                    ],
                    temperature: 0.1,
                    max_tokens: 100
                })
            });

            if (response.ok) {
                const data = await response.json();
                const content = data.choices[0]?.message?.content || 'No content';
                console.log(`✅ Success: ${content}`);
            } else {
                const errorData = await response.json();
                console.log(`❌ Failed (${response.status}): ${errorData.error?.message || 'Unknown error'}`);
            }
        } catch (error) {
            console.log(`❌ Network error: ${error.message}`);
        }
    }
    
    console.log('\n✨ Test completed!');
};

// Run the test
if (typeof window === 'undefined') {
    // Node.js environment
    const fetch = require('node-fetch');
    const readline = require('readline');
    
    const prompt = (question) => {
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
        
        return new Promise((resolve) => {
            rl.question(question, (answer) => {
                rl.close();
                resolve(answer);
            });
        });
    };
    
    testOpenRouterAPI();
} else {
    // Browser environment
    window.testOpenRouterAPI = testOpenRouterAPI;
}
