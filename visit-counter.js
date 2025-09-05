/* Visit Counter Module for CAnalyzerAI */
(() => {
  'use strict';

  class VisitCounter {
    constructor() {
      this.storageKey = 'canalyzer_visit_data';
      this.sessionKey = 'canalyzer_session_id';
      this.init();
    }

    init() {
      this.loadVisitData();
      this.recordVisit();
      this.displayCounter();
      this.setupCounterDisplay();
    }

    loadVisitData() {
      const stored = localStorage.getItem(this.storageKey);
      this.visitData = stored ? JSON.parse(stored) : {
        totalVisits: 0,
        uniqueVisits: 0,
        firstVisit: null,
        lastVisit: null,
        sessions: []
      };
    }

    saveVisitData() {
      localStorage.setItem(this.storageKey, JSON.stringify(this.visitData));
    }

    generateSessionId() {
      return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    isNewSession() {
      const currentSessionId = sessionStorage.getItem(this.sessionKey);
      return !currentSessionId;
    }

    recordVisit() {
      const now = new Date().toISOString();
      const isNewSession = this.isNewSession();

      // Always increment total visits
      this.visitData.totalVisits += 1;

      // Set first visit if this is the very first time
      if (!this.visitData.firstVisit) {
        this.visitData.firstVisit = now;
      }

      // Update last visit
      this.visitData.lastVisit = now;

      // Handle unique visits (new sessions)
      if (isNewSession) {
        this.visitData.uniqueVisits += 1;
        const sessionId = this.generateSessionId();
        sessionStorage.setItem(this.sessionKey, sessionId);
        
        // Keep track of sessions (limit to last 100 for storage efficiency)
        this.visitData.sessions.push({
          id: sessionId,
          timestamp: now,
          userAgent: navigator.userAgent.substring(0, 100) // Truncate for storage
        });

        // Keep only last 100 sessions
        if (this.visitData.sessions.length > 100) {
          this.visitData.sessions = this.visitData.sessions.slice(-100);
        }
      }

      this.saveVisitData();
    }

    formatNumber(num) {
      if (num >= 1000000) {
        return (num / 1000000).toFixed(1) + 'M';
      } else if (num >= 1000) {
        return (num / 1000).toFixed(1) + 'K';
      }
      return num.toString();
    }

    formatDate(dateString) {
      if (!dateString) return 'Never';
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    }

    createCounterElement() {
      const counterContainer = document.createElement('div');
      counterContainer.className = 'visit-counter-container';
      counterContainer.innerHTML = `
        <div class="visit-counter">
          <div class="counter-icon" title="Visit Statistics">📊</div>
          <div class="counter-stats">
            <div class="counter-item">
              <span class="counter-label">Total:</span>
              <span class="counter-value" id="totalVisitsCount">${this.formatNumber(this.visitData.totalVisits)}</span>
            </div>
            <div class="counter-item">
              <span class="counter-label">Unique:</span>
              <span class="counter-value" id="uniqueVisitsCount">${this.formatNumber(this.visitData.uniqueVisits)}</span>
            </div>
          </div>
          <div class="counter-details hidden" id="counterDetails">
            <div class="detail-item">
              <span class="detail-label">First Visit:</span>
              <span class="detail-value">${this.formatDate(this.visitData.firstVisit)}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Last Visit:</span>
              <span class="detail-value">${this.formatDate(this.visitData.lastVisit)}</span>
            </div>
          </div>
        </div>
      `;

      // Add click handler to toggle details
      const counter = counterContainer.querySelector('.visit-counter');
      const details = counterContainer.querySelector('#counterDetails');
      
      counter.addEventListener('click', () => {
        details.classList.toggle('hidden');
        counter.classList.toggle('expanded');
      });

      return counterContainer;
    }

    setupCounterDisplay() {
      // Add CSS styles
      const style = document.createElement('style');
      style.textContent = `
        .visit-counter-container {
          margin-top: 1rem;
          padding-top: 1rem;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
        }

        .visit-counter {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.5rem;
          border-radius: 0.5rem;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          cursor: pointer;
          transition: all 0.3s ease;
          font-size: 0.875rem;
          user-select: none;
        }

        .visit-counter:hover {
          background: rgba(255, 255, 255, 0.08);
          border-color: rgba(255, 255, 255, 0.2);
          transform: translateY(-1px);
        }

        .visit-counter.expanded {
          background: rgba(255, 255, 255, 0.1);
        }

        .counter-icon {
          font-size: 1.2rem;
          opacity: 0.8;
        }

        .counter-stats {
          display: flex;
          gap: 1rem;
          flex: 1;
        }

        .counter-item {
          display: flex;
          align-items: center;
          gap: 0.25rem;
        }

        .counter-label {
          color: rgba(255, 255, 255, 0.7);
          font-size: 0.8rem;
        }

        .counter-value {
          color: #00f5ff;
          font-weight: 600;
          font-family: 'Orbitron', monospace;
        }

        .counter-details {
          margin-top: 0.75rem;
          padding-top: 0.75rem;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .counter-details.hidden {
          display: none;
        }

        .detail-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .detail-label {
          color: rgba(255, 255, 255, 0.6);
          font-size: 0.75rem;
        }

        .detail-value {
          color: rgba(255, 255, 255, 0.9);
          font-size: 0.75rem;
          font-family: 'Rajdhani', sans-serif;
        }

        /* Light theme styles */
        [data-theme="light"] .visit-counter {
          background: rgba(0, 0, 0, 0.05);
          border-color: rgba(0, 0, 0, 0.1);
        }

        [data-theme="light"] .visit-counter:hover {
          background: rgba(0, 0, 0, 0.08);
          border-color: rgba(0, 0, 0, 0.2);
        }

        [data-theme="light"] .visit-counter.expanded {
          background: rgba(0, 0, 0, 0.1);
        }

        [data-theme="light"] .counter-label {
          color: rgba(0, 0, 0, 0.7);
        }

        [data-theme="light"] .counter-value {
          color: #0066cc;
        }

        [data-theme="light"] .counter-details {
          border-top-color: rgba(0, 0, 0, 0.1);
        }

        [data-theme="light"] .detail-label {
          color: rgba(0, 0, 0, 0.6);
        }

        [data-theme="light"] .detail-value {
          color: rgba(0, 0, 0, 0.9);
        }

        [data-theme="light"] .visit-counter-container {
          border-top-color: rgba(0, 0, 0, 0.1);
        }

        /* Responsive design */
        @media (max-width: 768px) {
          .counter-stats {
            flex-direction: column;
            gap: 0.5rem;
          }

          .visit-counter {
            font-size: 0.8rem;
          }

          .detail-item {
            flex-direction: column;
            align-items: flex-start;
            gap: 0.25rem;
          }
        }
      `;
      document.head.appendChild(style);
    }

    displayCounter() {
      // Find the footer brand section to insert the counter
      const footerBrand = document.querySelector('.footer-brand');
      if (footerBrand) {
        const counterElement = this.createCounterElement();
        footerBrand.appendChild(counterElement);
      }
    }

    // Public method to get visit statistics
    getStats() {
      return {
        ...this.visitData,
        currentSession: sessionStorage.getItem(this.sessionKey)
      };
    }

    // Public method to reset counter (for development/testing)
    reset() {
      localStorage.removeItem(this.storageKey);
      sessionStorage.removeItem(this.sessionKey);
      this.loadVisitData();
      location.reload();
    }
  }

  // Initialize the visit counter when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      window.visitCounter = new VisitCounter();
    });
  } else {
    window.visitCounter = new VisitCounter();
  }

  // Make VisitCounter available globally for debugging
  window.VisitCounter = VisitCounter;
})();
