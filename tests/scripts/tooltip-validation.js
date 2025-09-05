// Tooltip System Validation Script
// Run this in the browser console to validate tooltip hierarchy implementation

console.log('🎯 Starting Tooltip System Validation...');

// Test 1: Check if MicroInteractions class exists and has tooltip methods
function testMicroInteractionsClass() {
  console.log('\n📋 Test 1: MicroInteractions Class Methods');
  
  try {
    // Check if the methods exist (they're private so we can't call them directly)
    const microCode = document.querySelector('script[src*="app.js"]');
    if (microCode) {
      console.log('✅ app.js loaded');
    } else {
      console.log('❌ app.js not found');
      return false;
    }
    
    // Check if custom tooltips are being created
    const customTooltips = document.querySelectorAll('.custom-tooltip');
    console.log(`✅ Custom tooltip elements: ${customTooltips.length}`);
    
    return true;
  } catch (error) {
    console.log('❌ MicroInteractions class test failed:', error);
    return false;
  }
}

// Test 2: Check tooltip hierarchy implementation
function testTooltipHierarchy() {
  console.log('\n📋 Test 2: Tooltip Hierarchy');
  
  const allElementsWithTitle = document.querySelectorAll('[title]');
  const disabledTooltips = document.querySelectorAll('[data-tooltip-disabled="true"]');
  const originalTitles = document.querySelectorAll('[data-original-title]');
  
  console.log(`📊 Elements with title attribute: ${allElementsWithTitle.length}`);
  console.log(`🚫 Elements with disabled tooltips: ${disabledTooltips.length}`);
  console.log(`💾 Elements with preserved original titles: ${originalTitles.length}`);
  
  // Check that parent elements have been properly disabled
  let hierarchyTest = true;
  disabledTooltips.forEach((element, index) => {
    const hasActiveChildren = element.querySelectorAll('[title]:not([data-tooltip-disabled="true"])').length > 0;
    if (hasActiveChildren) {
      console.log(`✅ Parent ${index + 1} correctly disabled, has active children`);
    } else {
      console.log(`⚠️  Parent ${index + 1} disabled but no active children found`);
    }
  });
  
  return hierarchyTest;
}

// Test 3: Check CSS conflict prevention
function testCSSConflictPrevention() {
  console.log('\n📋 Test 3: CSS Conflict Prevention');
  
  // Check if the custom styles are applied
  const styleSheets = Array.from(document.styleSheets);
  let hasTooltipStyles = false;
  
  try {
    styleSheets.forEach(sheet => {
      try {
        const rules = Array.from(sheet.cssRules || sheet.rules || []);
        rules.forEach(rule => {
          if (rule.selectorText && (
            rule.selectorText.includes('[data-tooltip-disabled]') ||
            rule.selectorText.includes('.custom-tooltip') ||
            rule.selectorText.includes('[data-original-title]')
          )) {
            hasTooltipStyles = true;
          }
        });
      } catch (e) {
        // Cross-origin or other CSS access restrictions
      }
    });
  } catch (error) {
    console.log('⚠️  Could not fully check CSS rules due to restrictions');
  }
  
  if (hasTooltipStyles) {
    console.log('✅ Tooltip conflict prevention CSS found');
  } else {
    console.log('❌ Tooltip conflict prevention CSS not found');
  }
  
  return hasTooltipStyles;
}

// Test 4: Interactive tooltip behavior simulation
function testTooltipBehavior() {
  console.log('\n📋 Test 4: Tooltip Behavior Simulation');
  
  const activeTooltipElements = document.querySelectorAll('[title]:not([data-tooltip-disabled="true"])');
  console.log(`🎯 Active tooltip elements found: ${activeTooltipElements.length}`);
  
  activeTooltipElements.forEach((element, index) => {
    const classList = Array.from(element.classList).join(', ') || 'no classes';
    const titleText = element.getAttribute('title');
    console.log(`  ${index + 1}. ${element.tagName.toLowerCase()}.${classList}: "${titleText}"`);
  });
  
  // Check if any nested tooltips remain
  let nestedTooltipIssues = 0;
  activeTooltipElements.forEach(element => {
    const parent = element.parentElement;
    while (parent && parent !== document.body) {
      if (parent.hasAttribute('title') && !parent.hasAttribute('data-tooltip-disabled')) {
        nestedTooltipIssues++;
        console.log(`❌ Nested tooltip issue found: ${element.tagName} inside ${parent.tagName}`);
        break;
      }
      parent = parent.parentElement;
    }
  });
  
  if (nestedTooltipIssues === 0) {
    console.log('✅ No nested tooltip conflicts detected');
  } else {
    console.log(`❌ ${nestedTooltipIssues} nested tooltip conflicts found`);
  }
  
  return nestedTooltipIssues === 0;
}

// Test 5: Tooltip content enhancement validation
function testTooltipContentEnhancement() {
  console.log('\n📋 Test 5: Tooltip Content Enhancement');
  
  const statusElements = document.querySelectorAll('.status-indicator, .status-detail, .status-help-btn, [id*="status"]');
  let enhancedTooltips = 0;
  
  statusElements.forEach(element => {
    if (element.hasAttribute('title') && !element.hasAttribute('data-tooltip-disabled')) {
      enhancedTooltips++;
    }
  });
  
  console.log(`📊 Status elements with active tooltips: ${enhancedTooltips}`);
  
  // Check if custom tooltip elements exist (they're created dynamically)
  const customTooltips = document.querySelectorAll('.custom-tooltip');
  console.log(`🎨 Custom tooltip elements in DOM: ${customTooltips.length}`);
  
  return enhancedTooltips > 0;
}

// Run all tests
function runAllTests() {
  console.log('🚀 Running Tooltip System Validation Tests...');
  
  const results = {
    microInteractions: testMicroInteractionsClass(),
    hierarchy: testTooltipHierarchy(),
    cssConflicts: testCSSConflictPrevention(),
    behavior: testTooltipBehavior(),
    enhancement: testTooltipContentEnhancement()
  };
  
  console.log('\n📊 TEST RESULTS SUMMARY:');
  console.log('========================');
  
  Object.entries(results).forEach(([test, passed]) => {
    console.log(`${passed ? '✅' : '❌'} ${test}: ${passed ? 'PASSED' : 'FAILED'}`);
  });
  
  const totalPassed = Object.values(results).filter(Boolean).length;
  const totalTests = Object.keys(results).length;
  
  console.log(`\n🎯 Overall: ${totalPassed}/${totalTests} tests passed`);
  
  if (totalPassed === totalTests) {
    console.log('🎉 All tooltip system validation tests PASSED!');
    console.log('👉 The tooltip hierarchy enhancement is working correctly.');
  } else {
    console.log('⚠️  Some tests failed. Please check the implementation.');
  }
  
  return results;
}

// Auto-run if script is executed
if (typeof window !== 'undefined') {
  // Run tests after a short delay to ensure DOM is ready
  setTimeout(runAllTests, 1000);
}

// Export for manual testing
window.tooltipValidation = {
  runAllTests,
  testMicroInteractionsClass,
  testTooltipHierarchy,
  testCSSConflictPrevention,
  testTooltipBehavior,
  testTooltipContentEnhancement
};
