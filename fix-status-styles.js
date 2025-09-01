/**
 * fix-status-styles.js
 * Directly modifies the status indicator styling on load and during runtime
 */
document.addEventListener('DOMContentLoaded', function() {
  // Clear any cached style information and previously set styles
  localStorage.clear();
  
  // Apply the fix immediately
  fixStatusIndicatorStyles();
  
  // And again after a small delay to ensure everything has loaded
  setTimeout(fixStatusIndicatorStyles, 100);
  setTimeout(fixStatusIndicatorStyles, 500);
  setTimeout(fixStatusIndicatorStyles, 1000);
  
  // Watch for any DOM changes that might affect our styling
  const observer = new MutationObserver(function(mutations) {
    fixStatusIndicatorStyles();
  });
  
  observer.observe(document, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['style', 'class']
  });
  
  function fixStatusIndicatorStyles() {
    console.log("Applying status indicator fix...");
    
    // Direct element targeting
    const apiKeyStatus = document.getElementById('apiKeyStatus');
    if (apiKeyStatus) {
      console.log("Found API Key Status element, applying fix");
      
      // Force all style properties we need
      apiKeyStatus.style.cssText = `
        background: transparent !important;
        border: 1px solid transparent !important;
        border-radius: 8px !important;
        display: flex !important;
        align-items: center !important;
        gap: 8px !important;
      `;
      
      // Fix the status dot
      const statusDot = apiKeyStatus.querySelector('.status-dot');
      if (statusDot) {
        statusDot.style.cssText = `
          width: 12px !important;
          height: 12px !important;
          border-radius: 50% !important;
          box-shadow: 0 0 8px currentColor !important;
        `;
      }
    }
    
    // Apply to all other status indicators as well
    const statusIndicators = document.querySelectorAll('.status-indicator');
    statusIndicators.forEach(indicator => {
      indicator.style.cssText = `
        background: transparent !important;
        border: 1px solid transparent !important;
        border-radius: 8px !important;
        display: flex !important;
        align-items: center !important;
        gap: 8px !important;
      `;
      
      const dot = indicator.querySelector('.status-dot');
      if (dot) {
        dot.style.cssText = `
          width: 12px !important;
          height: 12px !important;
          border-radius: 50% !important;
          box-shadow: 0 0 8px currentColor !important;
        `;
      }
    });
  }
  
  // Create a direct style element with highest priority
  const styleElement = document.createElement('style');
  styleElement.id = 'emergency-status-override';
  styleElement.innerHTML = `
    /* Emergency override styles with max specificity */
    #apiKeyStatus,
    #apiKeyStatus.status-indicator,
    .status-indicator#apiKeyStatus,
    div#apiKeyStatus.status-indicator,
    .header-right .api-key-status .status-indicator#apiKeyStatus,
    .status-indicator,
    .api-key-status .status-indicator,
    div.status-indicator {
      background: transparent !important;
      background-color: transparent !important;
      border: 1px solid transparent !important;
      border-radius: 8px !important;
      box-shadow: none !important;
    }
    
    #apiKeyStatus .status-dot,
    .status-indicator .status-dot,
    div.status-indicator .status-dot {
      width: 12px !important;
      height: 12px !important;
      border-radius: 50% !important;
      box-shadow: 0 0 8px currentColor !important;
    }
  `;
  
  // Insert at the end to override everything
  document.head.appendChild(styleElement);
});
