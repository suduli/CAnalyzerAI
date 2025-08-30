// Test script to verify Decision Points calculation
const fs = require('fs');

// Read the C code file
const code = fs.readFileSync('c-example.c', 'utf8');

console.log('Testing Decision Points calculation...\n');

// Extract decision points using regex (from app.js logic)
function countDecisionPoints(code) {
    // Control flow keywords and operators that create decision points
    const patterns = [
        /\b(if|else if)\b/g,           // if, else if statements
        /\b(for|while|do)\b/g,         // loops
        /\b(case)\b/g,                 // switch cases
        /\b(\?\s*[^:]+:)/g,            // ternary operator
        /\b(&&|\|\|)/g,                // logical AND/OR in expressions
    ];

    let totalDecisionPoints = 0;

    patterns.forEach(pattern => {
        const matches = code.match(pattern);
        if (matches) {
            console.log(`Pattern ${pattern}: ${matches.length} matches`);
            totalDecisionPoints += matches.length;
        }
    });

    return totalDecisionPoints;
}

const decisionPoints = countDecisionPoints(code);
const complexity = decisionPoints + 1; // V(G) = P + 1

console.log(`\nTotal Decision Points: ${decisionPoints}`);
console.log(`Cyclomatic Complexity (V(G) = P + 1): ${complexity}`);

// Also count lines of code
const lines = code.split('\n').filter(line => {
    const trimmed = line.trim();
    return trimmed && !trimmed.startsWith('//') && !trimmed.startsWith('/*') && !trimmed.startsWith('*') && !trimmed.startsWith('#');
});

console.log(`Lines of Code: ${lines.length}`);
