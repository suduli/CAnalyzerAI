/**
 * immediate-style-fix.js
 * Runs before any other script to ensure status indicator styling
 */

// This script runs immediately - not waiting for DOMContentLoaded
(function() {
  // Create and insert a style element with highest priority
  function insertEmergencyStyles() {
    const styleEl = document.createElement('style');
    styleEl.id = 'immediate-status-override';
    styleEl.innerHTML = `
      /* Most specific selectors possible */
      #apiKeyStatus,
      #apiKeyStatus.status-indicator,
      div#apiKeyStatus.status-indicator,
      .header-right .api-key-status #apiKeyStatus.status-indicator,
      html body .header-right .api-key-status #apiKeyStatus.status-indicator {
        background: transparent !important;
        background-color: transparent !important;
        border: 1px solid transparent !important;
        border-radius: 8px !important;
        display: flex !important;
        align-items: center !important;
        gap: 8px !important;
        box-shadow: none !important;
      }
      
      /* Status dot within the specific element */
      #apiKeyStatus .status-dot,
      #apiKeyStatus.status-indicator .status-dot,
      div#apiKeyStatus.status-indicator .status-dot {
        width: 12px !important;
        height: 12px !important;
        border-radius: 50% !important;
        box-shadow: 0 0 8px currentColor !important;
      }
    `;
    
    // Insert at the beginning of head for earliest processing
    document.head.insertBefore(styleEl, document.head.firstChild);
    
    // Also add it to the end to make sure it overrides any later styles
    const styleEl2 = styleEl.cloneNode(true);
    styleEl2.id = 'immediate-status-override-end';
    document.head.appendChild(styleEl2);
  }
  
  // Run immediately
  insertEmergencyStyles();
  
  // Also run when DOM is ready to be sure
  document.addEventListener('DOMContentLoaded', function() {
    // Direct element targeting
    const directFix = function() {
      const apiKeyStatus = document.getElementById('apiKeyStatus');
      if (apiKeyStatus) {
        console.log("Applying direct style fix to apiKeyStatus");
        
        // Force inline styles
        apiKeyStatus.setAttribute('style', `
          background: transparent !important;
          background-color: transparent !important; 
          border: 1px solid transparent !important;
          border-radius: 8px !important;
          display: flex !important;
          align-items: center !important;
          gap: 8px !important;
          box-shadow: none !important;
        `);
        
        // Find and fix the status dot
        const statusDot = apiKeyStatus.querySelector('.status-dot');
        if (statusDot) {
          statusDot.setAttribute('style', `
            width: 12px !important;
            height: 12px !important;
            border-radius: 50% !important;
            box-shadow: 0 0 8px currentColor !important;
          `);
        }
      }
    };
    
    // Run immediately and after short delays
    directFix();
    setTimeout(directFix, 100);
    setTimeout(directFix, 500);
    setTimeout(directFix, 1000);
  });
  
  // Try to run early even if the browser parses this later
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', insertEmergencyStyles);
  } else {
    insertEmergencyStyles();
  }
})();
