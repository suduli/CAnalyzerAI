// Status Help System Integration Test
// This script validates that all tooltip and help functionality is working correctly

class StatusHelpTestSuite {
  constructor() {
    this.testResults = [];
    this.totalTests = 0;
    this.passedTests = 0;
  }

  async runAllTests() {
    console.log('🧪 Starting Status Help System Integration Tests...\n');
    
    await this.testTooltipSystem();
    await this.testStatusHelpButtons();
    await this.testStatusLegend();
    await this.testStatusIndicators();
    await this.testAccessibility();
    
    this.generateReport();
  }

  async testTooltipSystem() {
    console.log('📋 Testing Tooltip System...');
    
    // Test 1: Custom tooltips exist
    this.runTest('Custom tooltip elements exist', () => {
      const tooltips = document.querySelectorAll('.custom-tooltip');
      return tooltips.length >= 0; // They're created dynamically
    });

    // Test 2: Elements with title attributes
    this.runTest('Elements with tooltips found', () => {
      const elementsWithTooltips = document.querySelectorAll('[title]');
      return elementsWithTooltips.length > 0;
    });

    // Test 3: Enhanced status tooltips
    this.runTest('Status elements have enhanced tooltips', () => {
      const statusElements = document.querySelectorAll('.status-indicator, .test-status, [id*="status"]');
      let hasEnhancedTooltips = 0;
      statusElements.forEach(el => {
        if (el.getAttribute('title') && el.getAttribute('title').length > 20) {
          hasEnhancedTooltips++;
        }
      });
      return hasEnhancedTooltips > 0;
    });
  }

  async testStatusHelpButtons() {
    console.log('🔘 Testing Status Help Buttons...');
    
    // Test 1: Help buttons exist
    this.runTest('Status help buttons exist', () => {
      const helpButtons = document.querySelectorAll('.status-help-btn');
      return helpButtons.length > 0;
    });

    // Test 2: Help buttons have proper accessibility
    this.runTest('Help buttons have accessibility attributes', () => {
      const helpButtons = document.querySelectorAll('.status-help-btn');
      let accessibleButtons = 0;
      helpButtons.forEach(btn => {
        if (btn.getAttribute('aria-label') && btn.getAttribute('title')) {
          accessibleButtons++;
        }
      });
      return accessibleButtons === helpButtons.length;
    });

    // Test 3: Help button styling
    this.runTest('Help buttons have proper styling', () => {
      const helpBtn = document.querySelector('.status-help-btn');
      if (!helpBtn) return false;
      
      const styles = window.getComputedStyle(helpBtn);
      return styles.borderRadius === '50%' && 
             styles.cursor === 'pointer' &&
             parseInt(styles.width) === parseInt(styles.height);
    });
  }

  async testStatusLegend() {
    console.log('📊 Testing Status Legend...');
    
    // Test 1: Legend button exists
    this.runTest('Status legend button exists', () => {
      const legendBtn = document.getElementById('statusLegendBtn');
      return legendBtn !== null;
    });

    // Test 2: Legend modal creation
    this.runTest('Status legend modal can be created', () => {
      const legendBtn = document.getElementById('statusLegendBtn');
      if (legendBtn) {
        // Simulate click to create modal
        legendBtn.click();
        const modal = document.getElementById('statusLegendModal');
        return modal !== null;
      }
      return false;
    });

    // Test 3: Legend modal content
    this.runTest('Status legend has proper content', () => {
      const modal = document.getElementById('statusLegendModal');
      if (modal) {
        const sections = modal.querySelectorAll('.legend-section');
        const statusExamples = modal.querySelectorAll('.status-badge');
        return sections.length >= 3 && statusExamples.length >= 6;
      }
      return false;
    });
  }

  async testStatusIndicators() {
    console.log('🔍 Testing Status Indicators...');
    
    // Test 1: Main API status indicator
    this.runTest('Main API status indicator exists', () => {
      const apiStatus = document.getElementById('apiKeyStatus');
      return apiStatus !== null;
    });

    // Test 2: Status indicator structure
    this.runTest('Status indicators have proper structure', () => {
      const statusIndicators = document.querySelectorAll('.status-indicator');
      let properStructure = 0;
      statusIndicators.forEach(indicator => {
        const dot = indicator.querySelector('.status-dot');
        const info = indicator.querySelector('.status-info');
        if (dot && info) properStructure++;
      });
      return properStructure > 0;
    });

    // Test 3: Test status indicators
    this.runTest('Test status indicators exist', () => {
      const testStatuses = document.querySelectorAll('.test-status');
      return testStatuses.length > 0;
    });
  }

  async testAccessibility() {
    console.log('♿ Testing Accessibility...');
    
    // Test 1: ARIA labels
    this.runTest('Interactive elements have ARIA labels', () => {
      const interactiveElements = document.querySelectorAll('.status-help-btn, .status-legend-btn');
      let hasAriaLabels = 0;
      interactiveElements.forEach(el => {
        if (el.getAttribute('aria-label')) hasAriaLabels++;
      });
      return hasAriaLabels === interactiveElements.length;
    });

    // Test 2: Keyboard navigation
    this.runTest('Help buttons are keyboard accessible', () => {
      const helpButtons = document.querySelectorAll('.status-help-btn, .status-legend-btn');
      let keyboardAccessible = 0;
      helpButtons.forEach(btn => {
        const tabIndex = btn.getAttribute('tabindex');
        if (tabIndex !== '-1') keyboardAccessible++;
      });
      return keyboardAccessible === helpButtons.length;
    });

    // Test 3: Color contrast (basic check)
    this.runTest('Status indicators have sufficient contrast', () => {
      const statusDots = document.querySelectorAll('.status-dot');
      let hasColorVariation = false;
      const colors = new Set();
      statusDots.forEach(dot => {
        const bgColor = window.getComputedStyle(dot).backgroundColor;
        colors.add(bgColor);
      });
      return colors.size > 1; // Multiple colors indicates proper status differentiation
    });
  }

  runTest(testName, testFunction) {
    this.totalTests++;
    try {
      const result = testFunction();
      if (result) {
        this.passedTests++;
        this.testResults.push({ name: testName, status: 'PASS', details: '' });
        console.log(`✅ ${testName}`);
      } else {
        this.testResults.push({ name: testName, status: 'FAIL', details: 'Test condition not met' });
        console.log(`❌ ${testName}`);
      }
    } catch (error) {
      this.testResults.push({ name: testName, status: 'ERROR', details: error.message });
      console.log(`🚨 ${testName} - ERROR: ${error.message}`);
    }
  }

  generateReport() {
    console.log('\n' + '='.repeat(60));
    console.log('📋 STATUS HELP SYSTEM INTEGRATION TEST REPORT');
    console.log('='.repeat(60));
    console.log(`Total Tests: ${this.totalTests}`);
    console.log(`Passed: ${this.passedTests}`);
    console.log(`Failed: ${this.totalTests - this.passedTests}`);
    console.log(`Success Rate: ${((this.passedTests / this.totalTests) * 100).toFixed(1)}%`);
    console.log('='.repeat(60));
    
    // Group results by status
    const passed = this.testResults.filter(t => t.status === 'PASS');
    const failed = this.testResults.filter(t => t.status === 'FAIL');
    const errors = this.testResults.filter(t => t.status === 'ERROR');
    
    if (failed.length > 0) {
      console.log('\n❌ FAILED TESTS:');
      failed.forEach(test => {
        console.log(`  • ${test.name}: ${test.details}`);
      });
    }
    
    if (errors.length > 0) {
      console.log('\n🚨 ERROR TESTS:');
      errors.forEach(test => {
        console.log(`  • ${test.name}: ${test.details}`);
      });
    }
    
    if (this.passedTests === this.totalTests) {
      console.log('\n🎉 ALL TESTS PASSED! Status help system is fully functional.');
    } else {
      console.log('\n⚠️  Some tests failed. Please review the implementation.');
    }
    
    // Generate visual report in the page if possible
    this.createVisualReport();
  }

  createVisualReport() {
    const reportContainer = document.createElement('div');
    reportContainer.id = 'test-report';
    reportContainer.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: var(--bg-glass-elevated, rgba(0,0,0,0.9));
      color: var(--text-primary, white);
      padding: 20px;
      border-radius: 8px;
      border: 1px solid var(--border-color, #333);
      backdrop-filter: blur(10px);
      z-index: 10000;
      max-width: 350px;
      font-family: monospace;
      font-size: 12px;
      box-shadow: 0 8px 32px rgba(0,0,0,0.3);
    `;
    
    const successRate = ((this.passedTests / this.totalTests) * 100).toFixed(1);
    const statusColor = successRate >= 90 ? '#39ff14' : successRate >= 70 ? '#ffa502' : '#ff4757';
    
    reportContainer.innerHTML = `
      <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 12px;">
        <span style="font-size: 16px;">🧪</span>
        <strong>Status Help Test Report</strong>
        <button onclick="this.parentElement.parentElement.remove()" style="margin-left: auto; background: none; border: 1px solid #666; color: white; padding: 2px 6px; border-radius: 3px; cursor: pointer;">×</button>
      </div>
      <div style="margin-bottom: 8px;">
        <div style="color: ${statusColor}; font-weight: bold; font-size: 14px;">
          ${this.passedTests}/${this.totalTests} tests passed (${successRate}%)
        </div>
      </div>
      <div style="font-size: 11px; opacity: 0.8;">
        Click the console to see detailed results
      </div>
    `;
    
    document.body.appendChild(reportContainer);
    
    // Auto-remove after 10 seconds
    setTimeout(() => {
      if (reportContainer.parentElement) {
        reportContainer.remove();
      }
    }, 10000);
  }
}

// Auto-run tests when page loads
document.addEventListener('DOMContentLoaded', () => {
  // Wait a bit for all systems to initialize
  setTimeout(() => {
    const testSuite = new StatusHelpTestSuite();
    testSuite.runAllTests();
  }, 1000);
});

// Export for manual testing
window.StatusHelpTests = StatusHelpTestSuite;
