const WCAGValidator = require('./wcag-validator.js');
const validator = new WCAGValidator();
const results = validator.validateLightTheme();

console.log('🎨 DETAILED WCAG 2.1 AA COMPLIANCE ANALYSIS');
console.log('='.repeat(55));
console.log('');

const failed = results.filter(r => !r.passed);
const marginal = results.filter(r => r.passed && r.ratio < 7.0);

if (failed.length > 0) {
  console.log('❌ FAILING COMBINATIONS (Need Immediate Fix):');
  failed.forEach(f => {
    console.log(`  • ${f.name}`);
    console.log(`    Current: ${f.foreground} on ${f.background} = ${f.ratio}:1`);
    console.log(`    Status: ${f.compliance} (${f.critical ? 'CRITICAL' : 'Non-critical'})`);
    console.log('');
  });
}

if (marginal.length > 0) {
  console.log('⚠️  MARGINAL COMBINATIONS (AA but not AAA):');
  marginal.forEach(m => {
    console.log(`  • ${m.name}`);
    console.log(`    Current: ${m.foreground} on ${m.background} = ${m.ratio}:1`);
    console.log(`    Status: ${m.compliance} (${m.critical ? 'CRITICAL' : 'Non-critical'})`);
    console.log('');
  });
}

console.log('✅ EXCELLENT COMBINATIONS (AAA Level):');
const excellent = results.filter(r => r.ratio >= 7.0);
excellent.forEach(e => {
  console.log(`  • ${e.name}: ${e.ratio}:1`);
});
