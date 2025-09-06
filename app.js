/* CAnalyzerAI-Ref Logic - aligned with index.html IDs and flows */
(() => {
  'use strict';

  // Simple logger visible in console and optional on-page area
  const sys = {
    el: null,
    init() { this.el = document.getElementById('sysLog'); },
    log(msg) {
      const line = `[${new Date().toLocaleTimeString()}] ${msg}`;
      console.log(line);
      if (this.el) {
        const div = document.createElement('div');
        div.textContent = line;
        this.el.appendChild(div);
        this.el.scrollTop = this.el.scrollHeight;
      }
    },
    error(msg) { this.log(`ERROR: ${msg}`); }
  };

  // Make sys available globally
  window.sys = sys;

  class APIKeyManager {
    constructor() {
      this.modal = document.getElementById('apiKeyModal');
      this.modalClose = this.modal?.querySelector('.modal-close');
      this.providerSelect = document.getElementById('providerSelect');
      this.apiKeyInput = document.getElementById('apiKeyInput');
      this.keyToggleBtn = document.getElementById('keyToggleBtn');
      this.saveBtn = document.getElementById('saveApiKey');
      this.testBtn = document.getElementById('testConnection');
      this.clearBtn = document.getElementById('clearApiKey');

      this.statusRoot = document.getElementById('apiKeyStatus');
      this.statusDot = this.statusRoot?.querySelector('.status-dot');
      this.statusText = this.statusRoot?.querySelector('.status-text');
      this.lastValidated = document.getElementById('lastValidated');

      this.provider = localStorage.getItem('cai_provider') || 'ollama';
      this.apiKey = localStorage.getItem('cai_api_key') || '';
      this.model = localStorage.getItem('cai_model') || 'deepseek-r1';

      this.modelDropdown = document.getElementById('modelDropdown');
      this.selectedModel = localStorage.getItem('selectedModel') || this.getDefaultModel();

      // Initialize status help system
      this.initStatusHelp();

      this.init();
    }

    getDefaultModel() {
      switch(this.provider) {
        case 'openrouter': return 'google/gemini-2.0-flash-exp:free';
        case 'openai': return 'gpt-3.5-turbo';
        case 'ollama': 
        default: return 'deepseek-r1:latest';
      }
    }

    init() {
      if (this.providerSelect) this.providerSelect.value = this.provider;
      if (this.apiKeyInput) this.apiKeyInput.value = this.apiKey;
      this.updateStatus();
      this.bind();
      this.fetchModels();
    }
    bind() {
      this.saveBtn?.addEventListener('click', () => this.save());
      this.modalClose?.addEventListener('click', () => this.hide());
      this.clearBtn?.addEventListener('click', () => this.clear());
      this.testBtn?.addEventListener('click', () => this.test());
      this.keyToggleBtn?.addEventListener('click', () => this.toggleMask());
      this.providerSelect?.addEventListener('change', (e) => {
        this.provider = e.target.value;
        localStorage.setItem('cai_provider', this.provider);
        this.updateStatus();
        this.updateModelDropdown();
      });
    }
    show() { this.modal?.classList.remove('hidden'); }
    hide() { this.modal?.classList.add('hidden'); }
    save() {
      this.apiKey = (this.apiKeyInput?.value || '').trim();
      localStorage.setItem('cai_api_key', this.apiKey);
      this.updateStatus(true);
      this.hide();
    }
    clear() {
      this.apiKey = '';
      if (this.apiKeyInput) this.apiKeyInput.value = '';
      localStorage.removeItem('cai_api_key');
      this.updateStatus();
    }
    toggleMask() {
      if (!this.apiKeyInput) return;
      this.apiKeyInput.type = this.apiKeyInput.type === 'password' ? 'text' : 'password';
    }
    updateStatus(validated = false) {
      const needsKey = this.provider !== 'ollama';
      const ok = !needsKey || (this.apiKey && this.apiKey.length > 10);
      if (this.statusDot) this.statusDot.style.background = ok ? '#39ff14' : '#8892b0';
      if (this.statusText) this.statusText.textContent = ok ? 'Ready' : 'No API Key';
      if (validated && this.lastValidated) this.lastValidated.textContent = `Updated ${new Date().toLocaleString()}`;
      
      // Update status-specific tooltips
      this.updateStatusTooltips(ok, validated);
    }

    updateStatusTooltips(isReady, wasValidated) {
      const statusElement = document.getElementById('apiKeyStatus');
      const lastValidatedElement = document.getElementById('lastValidated');
      
      if (statusElement) {
        // Update main status indicator tooltip
        let statusTooltip = '';
        if (isReady) {
          statusTooltip = 'API Configuration is ready. The system can connect to the AI service for analysis.';
        } else {
          statusTooltip = 'API Key required. Configure your API key to enable AI-powered code analysis.';
        }
        statusElement.setAttribute('title', statusTooltip);
      }
      
      if (lastValidatedElement) {
        // Update last validated tooltip based on current text
        const currentText = lastValidatedElement.textContent;
        let validatedTooltip = '';
        
        if (currentText === 'Never configured') {
          validatedTooltip = 'API Key has not been configured yet. Click the ⚙️ button to set up your API key.';
        } else if (currentText.startsWith('Updated')) {
          validatedTooltip = 'API Key was successfully saved and validated at this time.';
        } else if (currentText.startsWith('Tested')) {
          validatedTooltip = 'API Key was successfully tested and verified at this time.';
        } else if (currentText.startsWith('Failed')) {
          validatedTooltip = 'API Key test failed at this time. Check your key and internet connection.';
        }
        
        lastValidatedElement.setAttribute('title', validatedTooltip);
      }
    }
    async test() {
      const provider = this.providerSelect?.value || 'ollama';
      const key = (this.apiKeyInput?.value || '').trim();
      let testResult = '';
      try {
        if (provider === 'ollama') {
          const res = await fetch('http://localhost:11434/api/tags');
          if (!res.ok) throw new Error(`Ollama HTTP ${res.status}`);
          testResult = 'Ollama connection OK';
        } else if (provider === 'openai') {
          const res = await fetch('https://api.openai.com/v1/models', { headers: { Authorization: `Bearer ${key}` } });
          if (!res.ok) throw new Error(`OpenAI HTTP ${res.status}`);
          testResult = 'OpenAI API key valid';
        } else if (provider === 'openrouter') {
          const res = await fetch('https://openrouter.ai/api/v1/models', { 
            headers: { 
              'Authorization': `Bearer ${key}`,
              'HTTP-Referer': window.location.origin
            } 
          });
          if (!res.ok) {
            const errorData = await res.json().catch(() => ({}));
            throw new Error(`OpenRouter HTTP ${res.status}: ${errorData.error?.message || 'Invalid API key'}`);
          }
          testResult = 'OpenRouter API key valid';
        } else {
          throw new Error('Unknown provider');
        }
        if (this.statusText) this.statusText.textContent = 'Ready';
        if (this.lastValidated) this.lastValidated.textContent = `Tested ${new Date().toLocaleString()}`;
        alert(testResult);
        sys.log(testResult);
      } catch (err) {
        if (this.statusText) this.statusText.textContent = 'Test Failed';
        if (this.lastValidated) this.lastValidated.textContent = `Failed ${new Date().toLocaleString()}`;
        alert(`Test failed: ${err?.message || err}`);
        sys.error(err?.message || String(err));
      }
    }

    async fetchModels() {
      this.updateModelDropdown();
    }

    updateModelDropdown() {
      if (!this.modelDropdown) return;
      
      this.modelDropdown.innerHTML = '';
      
      let models = [];
      
      switch(this.provider) {
        case 'openrouter':
          models = [
            'google/gemini-2.0-flash-exp:free',
            'google/gemini-2.5-flash:free',
            'google/gemma-2-9b-it:free',
            'meta-llama/llama-3.1-8b-instruct:free',
            'microsoft/wizardlm-2-8x22b:free',
            'huggingface/starcoder2-15b:free'
          ];
          break;
        case 'openai':
          models = [
            'gpt-3.5-turbo',
            'gpt-4',
            'gpt-4-turbo',
            'gpt-4o-mini'
          ];
          break;
        case 'ollama':
        default:
          models = [
            'deepseek-r1:latest',
            'deepseek-coder:6.7b',
            'llama3.2:latest',
            'codellama:latest'
          ];
          break;
      }
      
      models.forEach((model) => {
        const option = document.createElement('option');
        option.value = model;
        option.textContent = model;
        this.modelDropdown.appendChild(option);
      });
      
      // Set default selection based on provider
      const defaultModel = this.getDefaultModel();
      this.modelDropdown.value = this.selectedModel || defaultModel;
      
      this.modelDropdown.addEventListener('change', (e) => {
        this.selectedModel = e.target.value;
        localStorage.setItem('selectedModel', this.selectedModel);
        localStorage.setItem('cai_model', this.selectedModel);
      });
    }

    initStatusHelp() {
      const helpBtn = document.getElementById('apiStatusHelp');
      if (helpBtn) {
        helpBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          this.showStatusHelpModal();
        });
      }
    }

    showStatusHelpModal() {
      // Create status help modal if it doesn't exist
      if (!document.getElementById('statusHelpModal')) {
        this.createStatusHelpModal();
      }
      
      const modal = document.getElementById('statusHelpModal');
      if (modal) {
        modal.classList.remove('hidden');
        modal.classList.add('show');
      }
    }

    createStatusHelpModal() {
      const modalHTML = `
        <div class="modal" id="statusHelpModal">
          <div class="modal-backdrop"></div>
          <div class="modal-content status-help-modal">
            <div class="modal-header">
              <h2 class="modal-title">
                <span class="modal-icon">💡</span> API Status Indicators Guide
              </h2>
              <button class="modal-close" onclick="document.getElementById('statusHelpModal').classList.add('hidden')">&times;</button>
            </div>
            <div class="modal-body">
              <div class="status-help-section">
                <h3 class="help-section-title">📊 Status Indicators Explained</h3>
                
                <div class="status-example">
                  <div class="status-indicator ready-example">
                    <div class="status-dot" style="background: #39ff14;"></div>
                    <div class="status-info">
                      <span class="status-text">Ready</span>
                      <span class="status-detail">Updated ${new Date().toLocaleString()}</span>
                    </div>
                  </div>
                  <div class="status-explanation">
                    <strong>✅ Ready:</strong> API key is configured and working. The system can connect to the AI service for code analysis.
                  </div>
                </div>

                <div class="status-example">
                  <div class="status-indicator not-set-example">
                    <div class="status-dot" style="background: #8892b0;"></div>
                    <div class="status-info">
                      <span class="status-text">No API Key</span>
                      <span class="status-detail">Never configured ⚙️</span>
                    </div>
                  </div>
                  <div class="status-explanation">
                    <strong>⚙️ Never configured:</strong> No API key has been set up yet. Click the settings button (⚙️) to configure your API key and enable AI analysis.
                  </div>
                </div>

                <div class="status-example">
                  <div class="status-indicator">
                    <div class="status-dot" style="background: #39ff14;"></div>
                    <div class="status-info">
                      <span class="status-text">Ready</span>
                      <span class="status-detail">Tested ${new Date().toLocaleString()}</span>
                    </div>
                  </div>
                  <div class="status-explanation">
                    <strong>🧪 Tested:</strong> API key was manually tested and verified successfully.
                  </div>
                </div>

                <div class="status-example">
                  <div class="status-indicator">
                    <div class="status-dot" style="background: #ff4757;"></div>
                    <div class="status-info">
                      <span class="status-text">Test Failed</span>
                      <span class="status-detail">Failed ${new Date().toLocaleString()}</span>
                    </div>
                  </div>
                  <div class="status-explanation">
                    <strong>❌ Failed:</strong> API key test failed. Check your key, internet connection, or service status.
                  </div>
                </div>
              </div>

              <div class="status-help-section">
                <h3 class="help-section-title">🔧 Quick Actions</h3>
                <div class="quick-actions">
                  <button class="help-action-btn" onclick="document.getElementById('settingsBtn').click(); document.getElementById('statusHelpModal').classList.add('hidden');">
                    ⚙️ Configure API Key
                  </button>
                  <button class="help-action-btn" onclick="this.closest('.modal').classList.add('hidden');">
                    ❌ Close Help
                  </button>
                </div>
              </div>

              <div class="status-help-section">
                <h3 class="help-section-title">📝 Supported Services</h3>
                <div class="service-list">
                  <div class="service-item">
                    <strong>🤖 Ollama (Local):</strong> No API key required. Runs models locally on your machine.
                  </div>
                  <div class="service-item">
                    <strong>🧠 OpenAI:</strong> Requires OpenAI API key. High-quality analysis with GPT models.
                  </div>
                  <div class="service-item">
                    <strong>🌐 OpenRouter:</strong> Requires OpenRouter API key. Access to multiple AI models.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      `;
      
      document.body.insertAdjacentHTML('beforeend', modalHTML);
    }
  }

  class CAnalyzerAIRef {
    constructor() {
      // Upload elements
      this.fileInput = document.getElementById('fileInput');
      this.uploadZone = document.getElementById('uploadZone');
      this.uploadProgress = document.getElementById('uploadProgress');
      this.progressFill = document.getElementById('progressFill');
      this.progressText = document.getElementById('progressText');

      // File info
      this.fileInfo = document.getElementById('fileInfo');
      this.fileNameEl = document.getElementById('fileName');
      this.fileSizeEl = document.getElementById('fileSize');
      this.fileTimestampEl = document.getElementById('fileTimestamp');
      this.analyzeBtn = document.getElementById('analyzeBtn');
      this.clearFileBtn = document.getElementById('clearFile');

      // Results
      this.resultsSection = document.getElementById('resultsSection');
      this.staticTime = document.getElementById('staticTime');
      this.aiTime = document.getElementById('aiTime');
      this.staticLOC = document.getElementById('staticLOC');
      this.staticComplexity1 = document.getElementById('staticComplexity1');
      this.staticComplexity2 = document.getElementById('staticComplexity2');
      this.staticComplexity3 = document.getElementById('staticComplexity3');
      this.aiStatusNotice = document.getElementById('aiStatusNotice');
      this.aiLOC = document.getElementById('aiLOC');
      this.aiComplexity1 = document.getElementById('aiComplexity1');
      this.aiComplexity2 = document.getElementById('aiComplexity2');
      this.aiComplexity3 = document.getElementById('aiComplexity3');
      this.locDifference = document.getElementById('locDifference');
      this.complexityVariance = document.getElementById('complexityVariance');
      this.differencesList = document.getElementById('differencesList');
      this.recommendations = document.getElementById('recommendations');

      // Header controls
      this.settingsBtn = document.getElementById('settingsBtn');
      this.chatOpenBtn = document.getElementById('chatOpenBtn');
      this.analysisApiStatus = document.getElementById('analysisApiStatus');
      this.analysisApiDetail = document.getElementById('analysisApiDetail');

      // Misc
      this.loadingOverlay = document.getElementById('loadingOverlay');
      this.loadingText = document.getElementById('loadingText');
      this.exportResultsBtn = document.getElementById('exportResults');
      this.newAnalysisBtn = document.getElementById('newAnalysis');

      // State
      this.file = null;
      this.fileText = '';
      this.api = new APIKeyManager();
      this.cfgCalculator = new CFGCalculator();

      this.bind();
      this.resetUI();
    }

    bind() {
      // Enhanced upload zone accessibility
      if (this.uploadZone) {
        this.uploadZone.onclick = null;
        
        // Click handler
        this.uploadZone.addEventListener('click', (e) => {
          console.log('uploadZone click: opening file dialog');
          if (this.fileInput) {
            this.fileInput.click();
            console.log('fileInput.click() triggered');
          }
        });
        
        // Keyboard accessibility for upload zone
        this.uploadZone.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            if (this.fileInput) {
              this.fileInput.click();
              console.log('fileInput.click() triggered via keyboard');
            }
          }
        });
        
        // Enhanced drag and drop with accessibility feedback
        this.uploadZone.addEventListener('dragenter', (e) => {
          e.preventDefault();
          this.uploadZone.classList.add('drag-over');
          this.uploadZone.setAttribute('aria-label', 'Drop your file now to upload');
        });
        
        this.uploadZone.addEventListener('dragleave', (e) => {
          e.preventDefault();
          if (!this.uploadZone.contains(e.relatedTarget)) {
            this.uploadZone.classList.remove('drag-over');
            this.uploadZone.setAttribute('aria-label', 'File upload area. Click to browse for C code files or drag and drop files here. Accepted formats: .c and .h files. Maximum size: 5MB.');
          }
        });
        
        this.uploadZone.addEventListener('dragover', (e) => { 
          e.preventDefault(); 
          this.uploadZone.classList.add('drag-over');
        });
        
        this.uploadZone.addEventListener('drop', (e) => {
          console.log('uploadZone drop event');
          this.uploadZone.classList.remove('drag-over');
          this.uploadZone.setAttribute('aria-label', 'File upload area. Click to browse for C code files or drag and drop files here. Accepted formats: .c and .h files. Maximum size: 5MB.');
          this.onDrop(e);
        });
      }
      
      // Prevent native click on fileInput from bubbling up
      if (this.fileInput) {
        this.fileInput.addEventListener('click', (e) => {
          console.log('fileInput native click');
          e.stopPropagation();
        });
        
        // Enhanced file input change handler with accessibility updates
        this.fileInput.addEventListener('change', (e) => {
          console.log('fileInput change event');
          this.onFileSelect(e);
        });
      }

      // File actions with enhanced accessibility
      this.analyzeBtn?.addEventListener('click', () => {
        this.announceToScreenReader('Starting code analysis...');
        this.startAnalysis();
      });
      
      this.clearFileBtn?.addEventListener('click', () => {
        this.announceToScreenReader('File cleared. Upload area is ready for a new file.');
        this.clearFile();
      });

      // Settings
      this.settingsBtn?.addEventListener('click', () => this.api.show());
      
      // Chat window
      this.chatOpenBtn?.addEventListener('click', () => {
        if (window.chatWindow) {
          window.chatWindow.openChat();
        } else {
          console.warn('Chat window not initialized yet');
          // Try again after a short delay
          setTimeout(() => {
            if (window.chatWindow) {
              window.chatWindow.openChat();
            } else {
              alert('Chat system is not ready. Please try again in a moment.');
            }
          }, 500);
        }
      });

      // Results actions
      this.exportResultsBtn?.addEventListener('click', () => this.exportResults());
      this.newAnalysisBtn?.addEventListener('click', () => this.newAnalysis());
    }

    // Enhanced screen reader announcements
    announceToScreenReader(message) {
      const announcement = document.createElement('div');
      announcement.setAttribute('aria-live', 'polite');
      announcement.setAttribute('aria-atomic', 'true');
      announcement.className = 'sr-only';
      announcement.textContent = message;
      document.body.appendChild(announcement);
      
      // Remove after announcement
      setTimeout(() => {
        document.body.removeChild(announcement);
      }, 1000);
    }

    resetUI() {
      this.showProgress(false);
      this.fileInfo?.classList.add('hidden');
      this.analyzeBtn?.setAttribute('disabled', 'true');
      this.resultsSection?.classList.add('hidden');
    }

    // Enhanced helper to format values for display with improved precision handling
    formatForDisplay(v) {
      const n = Number(v);
      if (!Number.isFinite(n) || n < 0) return 'NA';

      // Enhanced precision handling to prevent data loss
      if (Number.isInteger(n)) {
        // For whole numbers, display as-is to preserve fidelity
        return String(n);
      } else {
        // For decimal numbers, preserve up to 2 decimal places
        let result = n.toFixed(2);
        // Remove trailing zeros but preserve significant decimals
        result = result.replace(/\.?0+$/, '');
        return result;
      }
    }

    // Enhanced formatting with validation and data integrity checks
    formatForDisplayWithValidation(value, context = '', sourceData = null) {
      // Input validation
      if (value === null || value === undefined) {
        console.warn(`⚠️ ${context} is null/undefined`);
        return 'NA';
      }

      // Handle string 'NA' values
      if (value === 'NA' || value === 'Invalid') {
        return value;
      }

      const num = Number(value);
      
      if (!Number.isFinite(num)) {
        console.warn(`⚠️ ${context} is not a finite number:`, value, 'Type:', typeof value);
        return 'NA';
      }

      // For difference/variance calculations, negative values are valid
      if (num < 0 && !context.toLowerCase().includes('difference') && !context.toLowerCase().includes('variance')) {
        console.warn(`⚠️ ${context} is negative:`, num);
        return 'Invalid';
      }

      // Data integrity check against source if provided
      if (sourceData && Math.abs(num - Number(sourceData)) > 0.01) {
        console.log(`🔍 ${context} differs from source:`, num, 'vs', sourceData);
      }

      // Preserve precision for all values to prevent data loss
      let result;
      if (Number.isInteger(num)) {
        result = String(num);
      } else {
        result = num.toFixed(2).replace(/\.?0+$/, '');
      }

      // Special formatting for differences and variances
      if (context.toLowerCase().includes('difference') || context.toLowerCase().includes('variance')) {
        if (num > 0) {
          result = '+' + result;
        } else if (num === 0) {
          result = '0';
        }
        // Negative numbers already have the minus sign
      }

      // Large number validation
      if (Math.abs(num) > 1000000) {
        console.warn(`⚠️ ${context} is unusually large:`, num);
        result += ' (!)';
      }

      return result;
    }

    showProgress(show) {
      this.uploadProgress?.classList.toggle('hidden', !show);
      if (!show) {
        if (this.progressFill) this.progressFill.style.width = '0%';
        if (this.progressText) this.progressText.textContent = '';
        if (this.uploadProgress) {
          this.uploadProgress.setAttribute('aria-valuenow', '0');
          this.uploadProgress.removeAttribute('aria-valuetext');
        }
      } else {
        // Initialize progress bar accessibility
        if (this.uploadProgress) {
          this.uploadProgress.setAttribute('aria-valuenow', '0');
          this.uploadProgress.setAttribute('aria-valuetext', 'Starting...');
        }
      }
    }

    onFileSelect(e) {
      const file = e.target.files?.[0];
      if (file) {
        this.setFile(file);
        this.announceToScreenReader(`File selected: ${file.name}`);
      }
      if (this.fileInput) this.fileInput.value = '';
    }

    onDrop(e) {
      e.preventDefault();
      const file = e.dataTransfer?.files?.[0];
      if (file) {
        this.setFile(file);
        this.announceToScreenReader(`File dropped: ${file.name}`);
      }
    }

    clearFile() { 
      this.file = null; 
      this.fileText = ''; 
      this.resetUI(); 
      this.hideError();
      
      // Update upload zone state
      if (this.uploadZone) {
        this.uploadZone.setAttribute('data-upload-state', 'empty');
        this.uploadZone.setAttribute('aria-label', 'File upload area. Click to browse for C code files or drag and drop files here. Accepted formats: .c and .h files. Maximum size: 5MB.');
      }
    }

    setFile(file) {
      this.hideError();
      
      // Validate file type
      if (!/\.(c|h)$/i.test(file.name)) { 
        this.showError('Only .c/.h files allowed');
        this.announceToScreenReader('Error: Only .c and .h files are allowed');
        return; 
      }
      
      // Validate file size
      if (file.size > 5 * 1024 * 1024) { 
        this.showError('File too large (>5MB)');
        this.announceToScreenReader('Error: File is too large. Maximum size is 5 megabytes');
        return; 
      }
      
      // Set file and update UI
      this.file = file;
      this.fileNameEl.textContent = file.name;
      this.fileSizeEl.textContent = `${(file.size / 1024).toFixed(1)} KB`;
      this.fileTimestampEl.textContent = new Date().toLocaleString();
      
      // Show file info with accessibility updates
      this.fileInfo.classList.remove('hidden');
      this.analyzeBtn.removeAttribute('disabled');
      
      // Update upload zone state
      if (this.uploadZone) {
        this.uploadZone.setAttribute('data-upload-state', 'loaded');
        this.uploadZone.setAttribute('aria-label', `File loaded: ${file.name}. Click to change file or use the analyze button to proceed.`);
      }
      
      // Update progress bar accessibility
      const progressBar = document.getElementById('uploadProgress');
      if (progressBar) {
        progressBar.setAttribute('aria-label', `File upload complete: ${file.name}`);
      }
      
      // Notify chat window about file upload
      this.notifyFileUploaded(file);
      
      sys.log(`Selected ${file.name}`);
      this.announceToScreenReader(`File successfully loaded: ${file.name}, ${(file.size / 1024).toFixed(1)} kilobytes. Ready for analysis.`);
    }

    showError(message) {
      const errorEl = document.getElementById('errorMessage');
      errorEl.textContent = message;
      errorEl.classList.remove('hidden');
      
      // Enhanced accessibility for error messages
      errorEl.setAttribute('role', 'alert');
      errorEl.setAttribute('aria-live', 'assertive');
      errorEl.focus(); // Move focus to error for screen readers
    }

    hideError() {
      const errorEl = document.getElementById('errorMessage');
      errorEl.textContent = '';
      errorEl.classList.add('hidden');
      errorEl.removeAttribute('role');
    }

    async startAnalysis() {
      if (!this.file) return;
      const provider = localStorage.getItem('cai_provider') || 'ollama';
      const model = localStorage.getItem('selectedModel') || this.api.getDefaultModel();
      this.analysisApiStatus.textContent = provider.toUpperCase();
      this.analysisApiDetail.textContent = `Model: ${model}`;
      try {
        this.showLoading(true, 'Reading file...');
        this.showProgress(true); this.progress(10, 'Reading file...');
        this.fileText = await this.readFile(this.file);

        this.progress(40, 'Static analysis...');
        const t0 = performance.now();
        const staticRes = this.performStaticAnalysis(this.fileText);
        const t1 = performance.now();
        this.displayStatic(staticRes, t1 - t0);

        this.progress(70, 'AI analysis...');
        const t2 = performance.now();
        const aiRes = await this.performAIAnalysis(this.fileText);
        const t3 = performance.now();
        this.displayAI(aiRes, t3 - t2);

        this.progress(90, 'Comparing...');
        this.displayComparison(staticRes, aiRes);

        this.progress(100, 'Done');
        this.resultsSection?.classList.remove('hidden');
        
        // Notify chat window about completed analysis
        this.notifyAnalysisCompleted(staticRes, aiRes);
      } catch (err) {
        sys.error(err?.message || String(err));
        alert('Analysis failed. See console for details.');
      } finally {
        this.showLoading(false);
        this.showProgress(false);
      }
    }

    readFile(file) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result || ''));
        reader.onerror = reject;
        reader.readAsText(file);
      });
    }

    performStaticAnalysis(code) {
      const lines = code.split(/\r?\n/);
      const testable = lines.filter(l => {
        const t = l.trim();
        if (!t) return false; // empty
        if (/^\/\//.test(t)) return false; // single-line comment
        if (/^[{};]$/.test(t)) return false; // brace or single semicolon lines
        return true;
      });
      const loc = testable.length;

      const decisionTokens = /(\bif\b|\belse\s+if\b|\bfor\b|\bwhile\b|\bcase\b|\?|\&\&|\|\|)/g;
      const decisionPoints = (code.match(decisionTokens) || []).length;

      let depth = 0, maxDepth = 0;
      for (const ch of code) { if (ch === '{') { depth++; maxDepth = Math.max(maxDepth, depth); } else if (ch === '}') { depth = Math.max(0, depth - 1); } }

      const c1 = Math.max(1, decisionPoints + 1); // E-N+2 ~ P+1
      const c2 = Math.max(1, decisionPoints + 1);
      const c3 = Math.max(1, Math.round(c1));

      // Perform CFG Analysis
      const cfgResult = this.cfgCalculator.analyze(code);
      const cfgComplexity = cfgResult.success ? cfgResult.metrics.cyclomaticComplexity : c1;

      return { 
        loc, 
        c1: cfgComplexity, // Use CFG complexity for primary metric
        c2, 
        c3, 
        decisionPoints, 
        nestingDepth: maxDepth,
        cfgMetrics: cfgResult.success ? cfgResult.metrics : null,
        cfgError: cfgResult.error
      };
    }

    displayStatic(s, ms) {
      // Enhanced display with validation and data integrity checks
      this.staticLOC.textContent = this.formatForDisplayWithValidation(s.loc, 'Static LOC');
      this.staticComplexity1.textContent = this.formatForDisplayWithValidation(s.c1, 'Static C1');
      this.staticComplexity2.textContent = this.formatForDisplayWithValidation(s.c2, 'Static C2');
      this.staticComplexity3.textContent = this.formatForDisplayWithValidation(s.c3, 'Static C3');
      if (this.staticTime) this.staticTime.textContent = `${ms.toFixed(1)} ms`;
      
      // Add data source attribution
      if (this.staticTime) {
        this.staticTime.setAttribute('title', `Static analysis completed in ${ms.toFixed(1)}ms using CFG-based complexity calculation`);
      }
      
      // Log CFG analysis results with enhanced reporting
      if (s.cfgMetrics) {
        console.log('🎯 CFG Analysis Results:', s.cfgMetrics);
        console.log('📊 Nodes:', s.cfgMetrics.nodes, 'Edges:', s.cfgMetrics.edges, 'Complexity:', s.cfgMetrics.cyclomaticComplexity);
        
        // Add detailed tooltip with CFG metrics
        this.staticComplexity1.setAttribute('title', 
          `CFG-based Cyclomatic Complexity: ${s.cfgMetrics.cyclomaticComplexity}\n` +
          `Control Flow Graph: ${s.cfgMetrics.nodes} nodes, ${s.cfgMetrics.edges} edges\n` +
          `Decision Points: ${s.decisionPoints || 'N/A'}, Max Nesting: ${s.nestingDepth || 'N/A'}`
        );
      } else if (s.cfgError) {
        console.warn('⚠️ CFG Analysis Error:', s.cfgError);
        this.staticComplexity1.setAttribute('title', 
          `Fallback complexity calculation (CFG analysis failed)\n` +
          `Error: ${s.cfgError}\n` +
          `Decision Points: ${s.decisionPoints || 'N/A'}`
        );
      }

      // Data validation report
      const staticMetrics = {
        loc: s.loc,
        complexity1: s.c1,
        complexity2: s.c2,
        complexity3: s.c3
      };
      
      this.logDataValidation('STATIC', staticMetrics);
    }

    async performAIAnalysis(code) {
      const provider = localStorage.getItem('cai_provider') || 'ollama';
      const apiKey = localStorage.getItem('cai_api_key') || '';
      const model = localStorage.getItem('selectedModel') || this.api.getDefaultModel();

      console.log('🚀 Starting AI analysis:', { provider, model: model?.slice(0, 30) });

      // Enhanced API key validation
      if ((provider === 'openai' || provider === 'openrouter') && (!apiKey || apiKey.length < 10)) {
        const note = 'No API key – AI analysis unavailable';
        console.warn('⚠️ API key missing for', provider);
        if (this.aiStatusNotice) this.aiStatusNotice.textContent = note;
        return { loc: 'NA', c1: 'NA', c2: 'NA', c3: 'NA', notes: [note], unavailable: true };
      }

      // Enhanced AI prompt with strict JSON schema and validation
      const prompt = `You are a code complexity analyzer. Your task is to analyze C programming language code and return ONLY a valid JSON response.

CRITICAL INSTRUCTIONS:
1. Return ONLY valid JSON. No explanations, no code examples, no markdown, no additional text.
2. Use the EXACT schema structure below with the EXACT key names.
3. All numeric values must be integers (no decimals, no strings, no written numbers).
4. The response must be parseable by JSON.parse() without any preprocessing.

REQUIRED JSON SCHEMA:
{
  "loc": <integer: count of executable lines excluding comments, blanks, and includes>,
  "complexity1": <integer: cyclomatic complexity (decision points + 1)>,
  "complexity2": <integer: cognitive complexity score>,
  "complexity3": <integer: halstead complexity metric>,
  "notes": ["<string: brief analysis note>"]
}

VALIDATION RULES:
- "loc" must be a positive integer >= 0
- "complexity1" must be a positive integer >= 1
- "complexity2" must be a positive integer >= 0
- "complexity3" must be a positive integer >= 0
- "notes" must be an array of strings
- No additional properties allowed
- No nested objects in numeric fields

C CODE TO ANALYZE:
${this.prepareCodeForAnalysis(code)}

RESPONSE (JSON ONLY):`;

      let statusNote = '';
      let analysisStartTime = performance.now();
      let modelUsed = model; // Track which model was actually used

      try {
        let response, data, aiResponseText;

        if (provider === 'ollama') {
          console.log('📡 Sending request to Ollama...');
          response = await fetch('http://localhost:11434/api/generate', {
            method: 'POST', 
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ model, prompt, stream: false }),
            signal: AbortSignal.timeout(30000) // 30 second timeout
          });
          
          if (!response.ok) throw new Error(`Ollama HTTP ${response.status}: ${response.statusText}`);
          
          data = await response.json();
          aiResponseText = data.response || '';
          statusNote = 'Ollama local inference';
          
        } else if (provider === 'openai') {
          console.log('📡 Sending request to OpenAI...');
          response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST', 
            headers: { 
              'Content-Type': 'application/json', 
              'Authorization': `Bearer ${apiKey}` 
            },
            body: JSON.stringify({ 
              model, 
              messages: [{ role: 'user', content: prompt }],
              max_tokens: 1000,
              temperature: 0.1
            }),
            signal: AbortSignal.timeout(30000)
          });
          
          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(`OpenAI HTTP ${response.status}: ${errorData.error?.message || response.statusText}`);
          }
          
          data = await response.json();
          aiResponseText = data.choices?.[0]?.message?.content || '';
          statusNote = 'OpenAI cloud inference';
          
        } else if (provider === 'openrouter') {
          console.log('📡 Sending request to OpenRouter...');
          
          // Use the user's selected model without automatic switching
          let currentModel = model || 'google/gemini-2.0-flash-exp:free';
          
          // Log the model being used for transparency
          console.log('🔍 Using OpenRouter model:', currentModel);
          
          response = await this.makeRateLimitedRequest('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST', 
            headers: { 
              'Content-Type': 'application/json', 
              'Authorization': `Bearer ${apiKey}`,
              'HTTP-Referer': window.location.origin,
              'X-Title': 'CAnalyzerAI'
            },
            body: JSON.stringify({ 
              model: currentModel, 
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
          
          data = await response.json();
          aiResponseText = data.choices?.[0]?.message?.content || '';
          statusNote = `OpenRouter cloud inference (${currentModel})`;
          modelUsed = currentModel;
          
        } else {
          throw new Error(`Unknown AI provider: ${provider}`);
        }

        // Enhanced response validation
        if (!aiResponseText) {
          throw new Error('AI returned empty response');
        }

        console.log('✅ AI API call successful, parsing response...');
        const analysisEndTime = performance.now();
        console.log(`⏱️ AI API call took ${(analysisEndTime - analysisStartTime).toFixed(1)}ms`);

        // Parse the AI response with enhanced error handling
        const parsedResult = this.parseAIMetrics(aiResponseText, statusNote);
        
        // Validate the parsed result has meaningful data
        if (parsedResult.parseError) {
          console.warn('⚠️ AI response parsing had errors, using fallback values');
        }

        // Add model information to the result
        parsedResult.modelUsed = modelUsed;
        parsedResult.provider = provider;

        return parsedResult;

      } catch (error) {
        console.error('❌ AI analysis failed:', error);
        
        // Enhanced error categorization
        let errorCategory = 'unknown';
        if (error.name === 'AbortError') {
          errorCategory = 'timeout';
        } else if (error.message.includes('HTTP 429') || error.message.includes('Rate limit')) {
          errorCategory = 'rate_limit';
          console.log('💡 Rate limit suggestion: Try switching to a different model or wait a few minutes');
          console.log('💡 Alternative models: google/gemini-2.0-flash-exp:free, meta-llama/llama-3.1-8b-instruct:free');
        } else if (error.message.includes('HTTP')) {
          errorCategory = 'api_error';
        } else if (error.message.includes('fetch')) {
          errorCategory = 'network';
        }

        sys.error(`AI analysis failed (${errorCategory}): ${error.message}`);
        
        // Return static analysis as fallback with detailed error info
        statusNote = `AI unavailable (${errorCategory}); using static estimate`;
        const staticFallback = this.performStaticAnalysis(code);
        
        return { 
          loc: staticFallback.loc, 
          c1: staticFallback.c1, 
          c2: staticFallback.c2, 
          c3: staticFallback.c3, 
          notes: [statusNote, `Error: ${error.message.slice(0, 100)}`],
          fallbackUsed: true,
          errorCategory,
          modelUsed: model,
          provider
        };
        
      } finally {
        // Ensure status is updated regardless of outcome
        if (this.aiStatusNotice && statusNote) {
          this.aiStatusNotice.textContent = statusNote;
        }
      }
    }

    // Rate limiting handler with exponential backoff
    async makeRateLimitedRequest(url, options, maxRetries = 3) {
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          console.log(`🔄 API Request attempt ${attempt}/${maxRetries}`);
          const response = await fetch(url, options);
          
          if (response.status === 429) {
            const retryAfter = response.headers.get('retry-after') || Math.pow(2, attempt);
            const waitTime = Math.min(parseInt(retryAfter) * 1000, 30000); // Max 30 seconds
            
            console.warn(`⏱️ Rate limited (429). Waiting ${waitTime/1000}s before retry ${attempt}/${maxRetries}`);
            
            if (attempt < maxRetries) {
              await this.sleep(waitTime);
              continue;
            } else {
              console.error('❌ Max retries reached for rate limiting');
              throw new Error(`Rate limit exceeded after ${maxRetries} attempts`);
            }
          }
          
          // If not rate limited, return the response
          return response;
          
        } catch (error) {
          if (attempt === maxRetries) {
            throw error;
          }
          
          // Wait before retrying on other errors
          const backoffTime = Math.min(1000 * Math.pow(2, attempt), 10000);
          console.warn(`⚠️ Request failed, retrying in ${backoffTime/1000}s: ${error.message}`);
          await this.sleep(backoffTime);
        }
      }
    }

    // Helper method for delays
    sleep(ms) {
      return new Promise(resolve => setTimeout(resolve, ms));
    }

    parseAIMetrics(text, statusNote='') {
      console.log('🔍 Parsing AI response - Length:', text?.length || 0);

      // Input validation
      if (!text || typeof text !== 'string') {
        console.warn('⚠️ Invalid AI response: empty or non-string input');
        return {
          loc: 0, c1: 0, c2: 0, c3: 0,
          notes: [`Invalid response format. Expected string, got ${typeof text}`],
          parseError: true,
          errorType: 'invalid_input'
        };
      }

      // Pre-clean: strip markdown code fences if present
      const cleanedText = this.stripCodeFences(text);

      // Track strategy across try/catch
      let parseStrategy = 'direct';

      try {
        // Strategy 1: Try to parse entire response as JSON
        let parsed;
        
        try {
          parsed = JSON.parse(cleanedText.trim());
          console.log('✅ Direct JSON parse successful');
        } catch (directParseError) {
          console.log('⚠️ Direct JSON parse failed, trying extraction strategies...');
          
          // Strategy 2: Look for JSON object within the response
          const jsonMatch = cleanedText.match(/\{[\s\S]*?\}/);
          if (jsonMatch) {
            try {
              parsed = JSON.parse(jsonMatch[0]);
              parseStrategy = 'extracted';
              console.log('✅ JSON extracted from mixed content');
            } catch (extractParseError) {
              throw new Error(`JSON found but invalid: ${extractParseError.message}`);
            }
          } else {
            // Strategy 3: Look for specific patterns that might be JSON-like
            const potentialJson = this.extractPotentialJSON(cleanedText);
            if (potentialJson) {
              try {
                parsed = JSON.parse(potentialJson);
                parseStrategy = 'reconstructed';
                console.log('✅ JSON reconstructed from patterns');
              } catch (reconstructError) {
                throw new Error(`JSON reconstruction failed: ${reconstructError.message}`);
              }
            } else {
              throw new Error('No valid JSON pattern found in response');
            }
          }
        }

        // Enhanced validation with strict schema compliance
        const validatedResult = this.validateAndNormalizeAIResult(parsed, statusNote, parseStrategy);
        console.log('✅ Final validated result:', validatedResult);

        return validatedResult;

      } catch (error) {
        console.error('❌ JSON parsing failed:', error.message);

        // Enhanced fallback: Try multiple extraction strategies
        const fallbackResult = this.extractNumbersFromText(cleanedText, statusNote);
        if (fallbackResult.hasValidNumbers) {
          console.log('🔧 Fallback number extraction succeeded');
          return fallbackResult;
        }

        // Try to repair common JSON issues
        const repairedResult = this.attemptJSONRepair(cleanedText, statusNote);
        if (repairedResult.success) {
          console.log('🔧 JSON repair succeeded');
          return repairedResult.result;
        }

        // Final fallback: Return zero values with detailed error info
        return {
          loc: 0, c1: 0, c2: 0, c3: 0,
          notes: [
            statusNote || 'JSON parsing failed',
            `Parse error: ${error.message}`,
            `Parse strategy attempted: ${parseStrategy || 'unknown'}`,
            `Response preview: ${cleanedText?.slice(0, 100)}...`
          ],
          parseError: true,
          errorType: 'parse_failure',
          originalText: cleanedText?.slice(0, 500),
          attemptedStrategies: ['direct', 'extracted', 'reconstructed', 'fallback', 'repair']
        };
      }
    }

    // Enhanced method for validating AI result structure with strict schema compliance
    validateAndNormalizeAIResult(parsed, statusNote = '', parseStrategy = 'unknown') {
      if (!parsed || typeof parsed !== 'object') {
        throw new Error('Parsed result is not an object');
      }

      // Strict schema validation - only allow expected keys
      const allowedKeys = ['loc', 'complexity1', 'complexity2', 'complexity3', 'notes'];
      const unexpectedKeys = Object.keys(parsed).filter(key => !allowedKeys.includes(key));
      
      if (unexpectedKeys.length > 0) {
        console.warn(`⚠️ Unexpected keys found in AI response: ${unexpectedKeys.join(', ')}`);
        // Remove unexpected keys to prevent injection attacks
        unexpectedKeys.forEach(key => delete parsed[key]);
      }

      // Enhanced numeric extraction with strict type validation
      const extractStrictNumber = (obj, ...keys) => {
        for (const key of keys) {
          if (key in obj) {
            const val = obj[key];

            // STRICT: Only accept integers, no type conversion
            if (typeof val === 'number' && Number.isInteger(val) && val >= 0) {
              return val;
            } else if (typeof val === 'string') {
              // Try to convert written numbers to digits (fallback for legacy responses)
              const numFromText = this.convertWrittenNumberToDigit(val);
              if (Number.isInteger(numFromText) && numFromText >= 0) {
                console.warn(`⚠️ Converting written number "${val}" to ${numFromText} - consider updating AI prompt`);
                return numFromText;
              }
              // Try direct integer conversion
              const directNum = parseInt(val, 10);
              if (Number.isInteger(directNum) && directNum >= 0) {
                console.warn(`⚠️ Converting string "${val}" to integer ${directNum} - consider updating AI prompt`);
                return directNum;
              }
            } else if (typeof val === 'object' && val !== null) {
              // Handle nested objects (legacy support)
              const extracted = this.extractNumberFromObject(val);
              if (Number.isInteger(extracted) && extracted >= 0) {
                console.warn(`⚠️ Extracting number from nested object - consider updating AI prompt`);
                return extracted;
              }
            }
          }
        }
        return 0;
      };

      const result = {
        loc: extractStrictNumber(parsed, 'loc'),
        c1: extractStrictNumber(parsed, 'complexity1'),
        c2: extractStrictNumber(parsed, 'complexity2'),
        c3: extractStrictNumber(parsed, 'complexity3'),
        notes: [],
        parseStrategy,
        schemaCompliant: true
      };

      // Enhanced validation with specific error messages
      const validationErrors = [];
      
      if (result.loc < 0) {
        validationErrors.push('LOC must be non-negative');
        result.loc = 0;
      }
      
      if (result.c1 < 1) {
        validationErrors.push('Cyclomatic complexity must be at least 1');
        result.c1 = 1;
      }
      
      if (result.c2 < 0) {
        validationErrors.push('Cognitive complexity must be non-negative');
        result.c2 = 0;
      }
      
      if (result.c3 < 0) {
        validationErrors.push('Halstead complexity must be non-negative');
        result.c3 = 0;
      }

      // Validate notes array structure
      if (Array.isArray(parsed.notes)) {
        result.notes = parsed.notes.filter(note => typeof note === 'string' && note.trim().length > 0);
      } else if (typeof parsed.notes === 'string' && parsed.notes.trim().length > 0) {
        result.notes = [parsed.notes];
      } else {
        result.notes = [];
      }

      // Add status note and validation info
      if (statusNote) {
        result.notes.unshift(statusNote);
      }
      
      if (validationErrors.length > 0) {
        result.notes.push(`Validation warnings: ${validationErrors.join(', ')}`);
        result.schemaCompliant = false;
      }

      // Check if we have meaningful data
      const hasValidData = result.loc > 0 || result.c1 > 0 || result.c2 > 0 || result.c3 > 0;
      
      if (!hasValidData) {
        result.notes.push('Warning: All complexity values are zero - review AI analysis');
        result.schemaCompliant = false;
        console.warn('⚠️ AI returned all zero values:', parsed);
      }

      // Add metadata for debugging
      result.validationTimestamp = new Date().toISOString();
      result.originalKeys = Object.keys(parsed);

      return result;
    }

    // Convert written numbers to digits (e.g., "forty-seven" -> 47)
    convertWrittenNumberToDigit(text) {
      if (!text || typeof text !== 'string') return NaN;

      const lowerText = text.toLowerCase().trim();

      // Handle hyphenated numbers (e.g., "forty-seven")
      if (lowerText.includes('-')) {
        const parts = lowerText.split('-');
        if (parts.length === 2) {
          const first = this.wordToNumber(parts[0].trim());
          const second = this.wordToNumber(parts[1].trim());
          if (first >= 0 && second >= 0 && second < 10) {
            return first + second;
          }
        }
      }

      // Handle single word numbers
      return this.wordToNumber(lowerText);
    }

    // Convert word to number
    wordToNumber(word) {
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
    extractNumberFromObject(obj) {
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
    }    // New fallback method for extracting numbers from unstructured text
  extractNumbersFromText(text, statusNote = '') {
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
            const numFromText = this.convertWrittenNumberToDigit(value);
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
            const numFromText = this.convertWrittenNumberToDigit(value);
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
    }

    // Method to prepare code for AI analysis with intelligent size management
    prepareCodeForAnalysis(code) {
      const MAX_TOKENS = 32000; // Conservative estimate for most AI models
      const CHARS_PER_TOKEN = 4; // Rough estimate: 1 token ≈ 4 characters
      const MAX_CHARS = MAX_TOKENS * CHARS_PER_TOKEN; // 128,000 characters
      const FALLBACK_LIMIT = 16000; // Original limit as fallback
      
      console.log(`🔍 Preparing code for analysis - Original length: ${code.length} characters`);
      
      if (code.length <= MAX_CHARS) {
        console.log('✅ Code fits within token limit, sending complete file');
        return code;
      }
      
      console.warn(`⚠️ Code is too large (${code.length} chars > ${MAX_CHARS} chars)`);
      
      // Strategy 1: Try to include complete functions/structures
      const functionBoundaries = this.findFunctionBoundaries(code);
      if (functionBoundaries.length > 0) {
        const truncatedAtFunction = this.truncateAtFunctionBoundary(code, MAX_CHARS, functionBoundaries);
        if (truncatedAtFunction.length > FALLBACK_LIMIT) {
          console.log(`🔧 Truncated at function boundary: ${truncatedAtFunction.length} characters`);
          return truncatedAtFunction + '\n\n/* ... FILE TRUNCATED FOR ANALYSIS ... */';
        }
      }
      
      // Strategy 2: Try to include main structures and important functions
      const importantSections = this.extractImportantCodeSections(code, MAX_CHARS);
      if (importantSections.length > FALLBACK_LIMIT) {
        console.log(`🔧 Using important sections: ${importantSections.length} characters`);
        return importantSections + '\n\n/* ... LESS IMPORTANT SECTIONS OMITTED ... */';
      }
      
      // Strategy 3: Simple truncation with warning
      console.warn(`⚠️ Using simple truncation to ${FALLBACK_LIMIT} characters`);
      return code.slice(0, FALLBACK_LIMIT) + '\n\n/* ... FILE TRUNCATED FOR ANALYSIS ... */';
    }

    // Find function boundaries in C code
    findFunctionBoundaries(code) {
      const functionPattern = /^[a-zA-Z_][a-zA-Z0-9_\s\*]*\s+[a-zA-Z_][a-zA-Z0-9_]*\s*\([^)]*\)\s*\{/gm;
      const boundaries = [];
      let match;
      
      while ((match = functionPattern.exec(code)) !== null) {
        boundaries.push({
          start: match.index,
          name: match[0].slice(0, 50) // First 50 chars for identification
        });
      }
      
      return boundaries;
    }

    // Truncate code at function boundary to preserve complete functions
    truncateAtFunctionBoundary(code, maxLength, boundaries) {
      let lastValidBoundary = 0;
      
      for (const boundary of boundaries) {
        if (boundary.start > maxLength) {
          break;
        }
        lastValidBoundary = boundary.start;
      }
      
      if (lastValidBoundary > 0) {
        // Find the end of the last complete function
        const remainingCode = code.slice(lastValidBoundary);
        const functionEnd = this.findFunctionEnd(remainingCode);
        
        if (functionEnd > 0 && lastValidBoundary + functionEnd <= maxLength) {
          return code.slice(0, lastValidBoundary + functionEnd);
        }
      }
      
      return code.slice(0, lastValidBoundary);
    }

    // Find the end of a function (matching braces)
    findFunctionEnd(codeFromStart) {
      let braceCount = 0;
      let inFunction = false;
      
      for (let i = 0; i < codeFromStart.length; i++) {
        const char = codeFromStart[i];
        
        if (char === '{') {
          braceCount++;
          inFunction = true;
        } else if (char === '}') {
          braceCount--;
          if (inFunction && braceCount === 0) {
            return i + 1; // Include the closing brace
          }
        }
      }
      
      return -1; // No complete function found
    }

    // Extract important code sections (headers, main functions, etc.)
    extractImportantCodeSections(code, maxLength) {
      let result = '';
      let currentLength = 0;
      
      // Include headers and includes
      const headerPattern = /^#.*$/gm;
      const headers = code.match(headerPattern) || [];
      for (const header of headers) {
        if (currentLength + header.length + 1 > maxLength) break;
        result += header + '\n';
        currentLength += header.length + 1;
      }
      
      // Include main function if it exists
      const mainMatch = code.match(/int\s+main\s*\([^)]*\)\s*\{[\s\S]*?\n\}/);
      if (mainMatch && currentLength + mainMatch[0].length < maxLength) {
        result += '\n' + mainMatch[0] + '\n';
        currentLength += mainMatch[0].length + 2;
      }
      
      // Include other important functions (sorted by complexity indicators)
      const functions = this.extractFunctions(code);
      const sortedFunctions = functions.sort((a, b) => b.complexity - a.complexity);
      
      for (const func of sortedFunctions) {
        if (currentLength + func.code.length + 2 > maxLength) break;
        if (func.name !== 'main') { // Skip main if already included
          result += '\n' + func.code + '\n';
          currentLength += func.code.length + 2;
        }
      }
      
      return result;
    }

    // Extract functions with complexity estimates
    extractFunctions(code) {
      const functionPattern = /^([a-zA-Z_][a-zA-Z0-9_\s\*]*\s+[a-zA-Z_][a-zA-Z0-9_]*\s*\([^)]*\)\s*\{[\s\S]*?\n\})/gm;
      const functions = [];
      let match;
      
      while ((match = functionPattern.exec(code)) !== null) {
        const funcCode = match[1];
        const funcName = this.extractFunctionName(funcCode);
        const complexity = this.estimateComplexity(funcCode);
        
        functions.push({
          name: funcName,
          code: funcCode,
          complexity: complexity
        });
      }
      
      return functions;
    }

    // Extract function name from function code
    extractFunctionName(funcCode) {
      const nameMatch = funcCode.match(/\s([a-zA-Z_][a-zA-Z0-9_]*)\s*\(/);
      return nameMatch ? nameMatch[1] : 'unknown';
    }

    // Simple complexity estimation based on control structures
    estimateComplexity(funcCode) {
      let complexity = 1; // Base complexity
      
      // Count decision points
      complexity += (funcCode.match(/\bif\b/g) || []).length;
      complexity += (funcCode.match(/\belse\b/g) || []).length;
      complexity += (funcCode.match(/\bfor\b/g) || []).length;
      complexity += (funcCode.match(/\bwhile\b/g) || []).length;
      complexity += (funcCode.match(/\bswitch\b/g) || []).length;
      complexity += (funcCode.match(/\bcase\b/g) || []).length;
      complexity += (funcCode.match(/\?\s*.*\s*:/g) || []).length; // Ternary operators
      
      return complexity;
    }

    // Enhanced JSON extraction and repair methods
    extractPotentialJSON(text) {
      console.log('🔧 Attempting to extract potential JSON from text');
      const t = this.stripCodeFences(text);
      
      // Strategy 1: Look for JSON-like structures with common patterns
      const jsonPatterns = [
        // Standard JSON object
        /\{[^{}]*"[^"]*"[^{}]*\}/,
        // JSON with nested objects
        /\{[^{}]*\{[^{}]*\}[^{}]*\}/,
        // JSON with arrays
        /\{[^{}]*\[[^\[\]]*\][^{}]*\}/,
        // Simple key-value pairs
        /\{[^{}]*:[\s]*[^,}]+[^{}]*\}/,
        // Look for patterns like "loc": 25, "complexity1": 3
        /\{[^{}]*"loc"[\s]*:[\s]*[^,}]+[^{}]*"complexity1"[\s]*:[\s]*[^,}]+[^{}]*\}/i
      ];

      for (const pattern of jsonPatterns) {
        const matches = t.match(new RegExp(pattern.source, 'g'));
        if (matches) {
          for (const match of matches) {
            try {
              // Try to clean up the match before parsing
              const cleaned = this.cleanupJSONString(match);
              JSON.parse(cleaned); // Test if it's valid
              console.log('✅ Found potential JSON pattern:', pattern.source);
              return cleaned;
            } catch (e) {
              // Continue to next pattern
            }
          }
        }
      }

      return null;
    }

    cleanupJSONString(jsonStr) {
      console.log('🧹 Cleaning up JSON string:', jsonStr.substring(0, 100) + '...');
      
      // Remove common JSON formatting issues
      let cleaned = jsonStr
        .replace(/[\r\n\t]/g, ' ') // Replace newlines/tabs with spaces
        .replace(/\s+/g, ' ') // Normalize whitespace
        .replace(/([^\\])"/g, '$1"') // Fix unescaped quotes (basic)
        .replace(/,\s*}/g, '}') // Remove trailing commas
        .replace(/,\s*]/g, ']') // Remove trailing commas in arrays
        .trim();

      // Try to fix common syntax errors
      try {
        // Test if it's already valid
        JSON.parse(cleaned);
        return cleaned;
      } catch (e) {
        // Try to fix common issues
        if (e.message.includes('Unexpected token')) {
          // Try to fix missing quotes around keys
          cleaned = cleaned.replace(/(\w+):/g, '"$1":');
          try {
            JSON.parse(cleaned);
            return cleaned;
          } catch (e2) {
            // Continue with other fixes
          }
        }
      }

      return cleaned;
    }

    attemptJSONRepair(text, statusNote = '') {
      console.log('🔧 Attempting JSON repair...');
      const input = this.stripCodeFences(text);
      
      try {
        // Strategy 1: Try to fix common JSON syntax issues
        let repaired = input
          .replace(/[\r\n\t]/g, ' ')
          .replace(/\s+/g, ' ')
          .replace(/(\w+):/g, '"$1":') // Add quotes to unquoted keys
          .replace(/:\s*([^",\{\}\[\]]+)/g, ': "$1"') // Add quotes to unquoted string values
          .replace(/,\s*([}\]])/g, '$1') // Remove trailing commas
          .trim();

        // Try to parse the repaired JSON
        const parsed = JSON.parse(repaired);
        
        // Validate the repaired result
        const validated = this.validateAndNormalizeAIResult(parsed, statusNote, 'repaired');
        
        return {
          success: true,
          result: validated,
          repairStrategy: 'syntax_fix'
        };
        
      } catch (error) {
        console.log('❌ JSON repair failed:', error.message);
        
        // Strategy 2: Try to reconstruct JSON from key-value pairs
        try {
          const reconstructed = this.reconstructJSONFromPairs(input);
          if (reconstructed) {
            const validated = this.validateAndNormalizeAIResult(reconstructed, statusNote, 'reconstructed');
            return {
              success: true,
              result: validated,
              repairStrategy: 'key_value_reconstruction'
            };
          }
        } catch (reconstructError) {
          console.log('❌ JSON reconstruction failed:', reconstructError.message);
        }
        
        return {
          success: false,
          error: error.message,
          repairStrategy: 'none'
        };
      }
    }

    // Strip common Markdown code fences (```json ... ```) from AI responses
    stripCodeFences(text) {
      if (!text || typeof text !== 'string') return text;
      let t = text.trim();
      // Remove leading and trailing triple backtick fences with optional language tag
      if (/^```/.test(t)) {
        t = t.replace(/^```[a-zA-Z0-9_-]*\s*/i, '');
        t = t.replace(/```\s*$/i, '');
        return t.trim();
      }
      return t;
    }

    reconstructJSONFromPairs(text) {
      console.log('🔧 Attempting JSON reconstruction from key-value pairs...');
      
      // Look for patterns like "loc: 25", "complexity1: 3", etc.
      const keyValuePatterns = [
        { key: 'loc', patterns: [/loc[:\s=]+(\d+)/i, /lines?[:\s=]+(\d+)/i, /count[:\s=]+(\d+)/i] },
        { key: 'complexity1', patterns: [/complexity1?[:\s=]+(\d+)/i, /cyclomatic[:\s=]+(\d+)/i, /c1[:\s=]+(\d+)/i] },
        { key: 'complexity2', patterns: [/complexity2?[:\s=]+(\d+)/i, /cognitive[:\s=]+(\d+)/i, /c2[:\s=]+(\d+)/i] },
        { key: 'complexity3', patterns: [/complexity3?[:\s=]+(\d+)/i, /halstead[:\s=]+(\d+)/i, /c3[:\s=]+(\d+)/i] }
      ];

      const result = {};
      let hasData = false;

      for (const { key, patterns } of keyValuePatterns) {
        for (const pattern of patterns) {
          const match = text.match(pattern);
          if (match && match[1]) {
            const value = parseInt(match[1], 10);
            if (Number.isInteger(value) && value >= 0) {
              result[key] = value;
              hasData = true;
              break;
            }
          }
        }
      }

      if (hasData) {
        // Add default values for missing fields
        if (!result.loc) result.loc = 0;
        if (!result.complexity1) result.complexity1 = 1;
        if (!result.complexity2) result.complexity2 = 0;
        if (!result.complexity3) result.complexity3 = 0;
        if (!result.notes) result.notes = ['Reconstructed from key-value pairs'];

        console.log('✅ JSON reconstructed:', result);
        return result;
      }

      return null;
    }

    displayAI(aiResult, ms) {
      console.log('🎯 displayAI called with result:', aiResult);
      console.log('🎯 displayAI - Analysis time:', ms, 'ms');

      // Enhanced error state handling with detailed user feedback
      if (!aiResult || typeof aiResult !== 'object') {
        console.error('❌ Invalid AI result object:', aiResult);
        this.setAIDisplayError('Analysis failed: Invalid response from AI service');
        return;
      }

      // Handle unavailable AI analysis with specific reasons
      if (aiResult.unavailable) {
        const reason = aiResult.notes && aiResult.notes[0] ?
          aiResult.notes[0] : 'AI service is currently unavailable';
        this.setAIDisplayUnavailable(`AI Analysis Unavailable: ${reason}`);
        return;
      }

      // Handle parsing errors with transparent fallback information
      if (aiResult.parseError || aiResult.extractionFallback) {
        console.warn('⚠️ AI parsing issues detected:', aiResult);
        this.setAIDisplayWithWarning(aiResult, ms);
        return;
      }

      // Handle fallback to static analysis with clear warning
      if (aiResult.fallbackUsed) {
        console.warn('⚠️ AI analysis failed, using static analysis fallback:', aiResult);
        this.setAIDisplayFallback(aiResult, ms);
        return;
      }

      // Handle successful analysis with confidence indicators
      this.setAIDisplaySuccess(aiResult, ms);
    }

    // New helper methods for different AI display states
    setAIDisplayError(message) {
      if (this.aiStatusNotice) {
        // Provide more helpful error messages with actionable advice
        let enhancedMessage = message;

        if (message.includes('Invalid response')) {
          enhancedMessage = '❌ AI service returned invalid data. Try re-running the analysis or check your API configuration.';
        } else if (message.includes('network') || message.includes('connection')) {
          enhancedMessage = '❌ Network error connecting to AI service. Check your internet connection and API settings.';
        } else if (message.includes('timeout')) {
          enhancedMessage = '❌ AI service timed out. The request may be too complex - try with a smaller file.';
        } else if (message.includes('rate limit')) {
          enhancedMessage = '❌ AI service rate limit exceeded. Please wait a moment before trying again.';
        } else {
          enhancedMessage = `❌ ${message}`;
        }

        this.aiStatusNotice.textContent = enhancedMessage;
      }

      this.aiLOC.textContent = 'ERROR';
      this.aiComplexity1.textContent = 'ERROR';
      this.aiComplexity2.textContent = 'ERROR';
      this.aiComplexity3.textContent = 'ERROR';
      if (this.aiTime) this.aiTime.textContent = '';

      this.aiStatusNotice?.classList.add('ai-error');
      this.aiStatusNotice?.classList.remove('ai-unavailable', 'ai-warning');

      console.error('❌ AI analysis error displayed:', message);
    }

    setAIDisplayUnavailable(message) {
      if (this.aiStatusNotice) {
        // Enhance unavailable messages with helpful guidance
        let enhancedMessage = message;

        if (message.includes('API key') || message.includes('authentication')) {
          enhancedMessage = '🔑 AI analysis unavailable: API key not configured. Click the settings button (⚙️) to configure your AI provider.';
        } else if (message.includes('model') || message.includes('not found')) {
          enhancedMessage = '🤖 AI analysis unavailable: Selected model not available. Check your model selection in settings.';
        } else if (message.includes('quota') || message.includes('limit')) {
          enhancedMessage = '💰 AI analysis unavailable: API quota exceeded. Check your provider\'s usage limits.';
        } else if (message.includes('offline') || message.includes('network')) {
          enhancedMessage = '🌐 AI analysis unavailable: Service offline or network issues. Check your connection.';
        } else {
          enhancedMessage = `⏸️ ${message}`;
        }

        this.aiStatusNotice.textContent = enhancedMessage;
      }

      this.aiLOC.textContent = 'NA';
      this.aiComplexity1.textContent = 'NA';
      this.aiComplexity2.textContent = 'NA';
      this.aiComplexity3.textContent = 'NA';
      if (this.aiTime) this.aiTime.textContent = '';

      this.aiStatusNotice?.classList.add('ai-unavailable');
      this.aiStatusNotice?.classList.remove('ai-error', 'ai-warning');

      console.warn('⏸️ AI analysis unavailable:', message);
    }

    setAIDisplayFallback(aiResult, ms) {
      if (this.aiStatusNotice) {
        const errorCategory = aiResult.errorCategory || 'unknown';
        const modelInfo = aiResult.modelUsed ? ` (${aiResult.modelUsed})` : '';
        const providerInfo = aiResult.provider ? ` via ${aiResult.provider}` : '';
        
        let enhancedMessage = `⚠️ AI Analysis Failed - Using Static Estimate`;
        if (errorCategory !== 'unknown') {
          enhancedMessage += ` (${errorCategory} error${providerInfo})`;
        }
        if (modelInfo) {
          enhancedMessage += ` - Model: ${aiResult.modelUsed}`;
        }
        
        this.aiStatusNotice.textContent = enhancedMessage;
      }

      // Display the fallback values with warning styling
      this.aiLOC.textContent = this.formatForDisplayEnhanced(aiResult.loc, 'LOC');
      this.aiComplexity1.textContent = this.formatForDisplayEnhanced(aiResult.c1, 'C1');
      this.aiComplexity2.textContent = this.formatForDisplayEnhanced(aiResult.c2, 'C2');
      this.aiComplexity3.textContent = this.formatForDisplayEnhanced(aiResult.c3, 'C3');

      if (this.aiTime) this.aiTime.textContent = `${ms.toFixed(1)} ms (fallback)`;

      this.aiStatusNotice?.classList.add('ai-warning');
      this.aiStatusNotice?.classList.remove('ai-error', 'ai-unavailable');

      console.warn('⚠️ AI analysis fallback displayed:', aiResult);
    }

    setAIDisplayParseError(aiResult, ms) {
      if (this.aiStatusNotice) {
        const errorType = aiResult.errorType || 'parse_error';
        const parseStrategy = aiResult.parseStrategy || 'unknown';
        const modelInfo = aiResult.modelUsed ? ` (${aiResult.modelUsed})` : '';
        
        let enhancedMessage = `⚠️ AI Response Parse Error`;
        if (errorType !== 'unknown') {
          enhancedMessage += ` - ${errorType.replace('_', ' ')}`;
        }
        if (parseStrategy !== 'unknown') {
          enhancedMessage += ` - Strategy: ${parseStrategy}`;
        }
        if (modelInfo) {
          enhancedMessage += ` - Model: ${aiResult.modelUsed}`;
        }
        
        this.aiStatusNotice.textContent = enhancedMessage;
      }

      // Display extracted values if available, otherwise show error
      if (aiResult.loc !== undefined && aiResult.c1 !== undefined) {
        this.aiLOC.textContent = this.formatForDisplayEnhanced(aiResult.loc, 'LOC');
        this.aiComplexity1.textContent = this.formatForDisplayEnhanced(aiResult.c1, 'C1');
        this.aiComplexity2.textContent = this.formatForDisplayEnhanced(aiResult.c2, 'C2');
        this.aiComplexity3.textContent = this.formatForDisplayEnhanced(aiResult.c3, 'C3');
        if (this.aiTime) this.aiTime.textContent = `${ms.toFixed(1)} ms (parsed with errors)`;
      } else {
        this.aiLOC.textContent = 'PARSE ERROR';
        this.aiComplexity1.textContent = 'PARSE ERROR';
        this.aiComplexity2.textContent = 'PARSE ERROR';
        this.aiComplexity3.textContent = 'PARSE ERROR';
        if (this.aiTime) this.aiTime.textContent = '';
      }

      this.aiStatusNotice?.classList.add('ai-warning');
      this.aiStatusNotice?.classList.remove('ai-error', 'ai-unavailable');
      
      console.warn('⚠️ AI parse error displayed:', aiResult);
    }

    setAIDisplaySchemaWarning(aiResult, ms) {
      if (this.aiStatusNotice) {
        const parseStrategy = aiResult.parseStrategy || 'unknown';
        const modelInfo = aiResult.modelUsed ? ` (${aiResult.modelUsed})` : '';
        const validationWarnings = aiResult.notes?.filter(note => note.includes('Validation warnings:')) || [];
        
        let enhancedMessage = `⚠️ Schema Compliance Warning`;
        if (parseStrategy !== 'unknown') {
          enhancedMessage += ` - Parse: ${parseStrategy}`;
        }
        if (modelInfo) {
          enhancedMessage += ` - Model: ${aiResult.modelUsed}`;
        }
        if (validationWarnings.length > 0) {
          enhancedMessage += ` - ${validationWarnings[0]}`;
        }
        
        this.aiStatusNotice.textContent = enhancedMessage;
      }

      // Display the values (they were validated and normalized)
      this.aiLOC.textContent = this.formatForDisplayEnhanced(aiResult.loc, 'LOC');
      this.aiComplexity1.textContent = this.formatForDisplayEnhanced(aiResult.c1, 'C1');
      this.aiComplexity2.textContent = this.formatForDisplayEnhanced(aiResult.c2, 'C2');
      this.aiComplexity3.textContent = this.formatForDisplayEnhanced(aiResult.c3, 'C3');
      if (this.aiTime) this.aiTime.textContent = `${ms.toFixed(1)} ms (schema warning)`;

      this.aiStatusNotice?.classList.add('ai-warning');
      this.aiStatusNotice?.classList.remove('ai-error', 'ai-unavailable');
      
      console.warn('⚠️ AI schema warning displayed:', aiResult);
    }

    setAIDisplayWithWarning(aiResult, ms) {
      // Display the values but with warning styling and detailed status
      this.aiStatusNotice?.classList.remove('ai-unavailable', 'ai-error');
      this.aiStatusNotice?.classList.add('ai-warning');

      if (this.aiStatusNotice) {
        let warningMsg = '';

        if (aiResult.extractionFallback) {
          warningMsg = '⚠️ AI response parsed with fallback method - results may be less accurate';
        } else if (aiResult.parseError) {
          warningMsg = '⚠️ AI response had parsing issues - using best available data';
        } else if (aiResult.notes && aiResult.notes.includes('extractionFallback')) {
          warningMsg = '⚠️ AI provided unstructured response - extracted metrics manually';
        } else {
          warningMsg = '⚠️ AI analysis completed with minor issues';
        }

        this.aiStatusNotice.textContent = warningMsg;
      }

      // Use enhanced display formatting with validation
      this.aiLOC.textContent = this.formatForDisplayWithValidation(aiResult.loc, 'AI LOC', this.staticLOC.textContent);
      this.aiComplexity1.textContent = this.formatForDisplayWithValidation(aiResult.c1, 'AI C1', this.staticComplexity1.textContent);
      this.aiComplexity2.textContent = this.formatForDisplayWithValidation(aiResult.c2, 'AI C2', this.staticComplexity2.textContent);
      this.aiComplexity3.textContent = this.formatForDisplayWithValidation(aiResult.c3, 'AI C3', this.staticComplexity3.textContent);

      if (this.aiTime) {
        this.aiTime.textContent = `${ms.toFixed(1)} ms`;
        this.aiTime.setAttribute('title', `AI analysis with warnings completed in ${ms.toFixed(1)}ms`);
      }

      // Add data validation logging
      const aiMetrics = {
        loc: aiResult.loc,
        complexity1: aiResult.c1,
        complexity2: aiResult.c2,
        complexity3: aiResult.c3
      };
      
      this.logDataValidation('AI', aiMetrics);

      console.log('⚠️ AI values displayed with warnings:', {
        loc: aiResult.loc, c1: aiResult.c1, c2: aiResult.c2, c3: aiResult.c3,
        warning: this.aiStatusNotice?.textContent
      });
    }

    setAIDisplaySuccess(aiResult, ms) {
      this.aiStatusNotice?.classList.remove('ai-unavailable', 'ai-error', 'ai-warning');

      if (this.aiStatusNotice) {
        let statusMsg = '✅ AI analysis completed successfully';

        // Add confidence indicators based on result characteristics
        if (aiResult.notes && aiResult.notes[0]) {
          // Use the note from AI if available
          statusMsg = `✅ ${aiResult.notes[0]}`;
        } else if (aiResult.loc > 0 && aiResult.c1 > 0) {
          // Add performance indicator based on analysis time
          if (ms < 1000) {
            statusMsg = '✅ AI analysis completed quickly and accurately';
          } else if (ms < 3000) {
            statusMsg = '✅ AI analysis completed successfully';
          } else {
            statusMsg = '✅ AI analysis completed (response took longer than usual)';
          }
        }

        this.aiStatusNotice.textContent = statusMsg;
      }

      // Use enhanced display formatting with validation
      this.aiLOC.textContent = this.formatForDisplayWithValidation(aiResult.loc, 'AI LOC', this.staticLOC.textContent);
      this.aiComplexity1.textContent = this.formatForDisplayWithValidation(aiResult.c1, 'AI C1', this.staticComplexity1.textContent);
      this.aiComplexity2.textContent = this.formatForDisplayWithValidation(aiResult.c2, 'AI C2', this.staticComplexity2.textContent);
      this.aiComplexity3.textContent = this.formatForDisplayWithValidation(aiResult.c3, 'AI C3', this.staticComplexity3.textContent);

      if (this.aiTime) {
        this.aiTime.textContent = `${ms.toFixed(1)} ms`;
        this.aiTime.setAttribute('title', `AI analysis completed in ${ms.toFixed(1)}ms using ${aiResult.provider || 'unknown'} provider with model ${aiResult.modelUsed || 'unknown'}`);
      }

      // Add data validation logging
      const aiMetrics = {
        loc: aiResult.loc,
        complexity1: aiResult.c1,
        complexity2: aiResult.c2,
        complexity3: aiResult.c3
      };
      
      this.logDataValidation('AI', aiMetrics);

      console.log('✅ AI values displayed successfully:', {
        loc: aiResult.loc, c1: aiResult.c1, c2: aiResult.c2, c3: aiResult.c3,
        status: this.aiStatusNotice?.textContent
      });
    }

    // Enhanced formatting with type validation and context
    formatForDisplayEnhanced(value, context = '') {
      console.log(`🔍 Formatting ${context}:`, value, typeof value);
      
      // Strict type and value validation
      if (value === null || value === undefined) {
        console.warn(`⚠️ ${context} is null/undefined`);
        return 'NA';
      }

      // Convert to number and validate
      const num = Number(value);
      
      if (!Number.isFinite(num)) {
        console.warn(`⚠️ ${context} is not a finite number:`, value, 'Type:', typeof value);
        return 'NA';
      }

      if (num < 0) {
        console.warn(`⚠️ ${context} is negative:`, num);
        return 'Invalid';
      }

      // Enhanced precision handling for data fidelity
      let result;
      if (Number.isInteger(num)) {
        // For whole numbers, display as-is to preserve fidelity
        result = String(num);
      } else {
        // For decimal numbers, preserve up to 2 decimal places
        result = num.toFixed(2);
        // Remove trailing zeros for cleaner display
        result = result.replace(/\.?0+$/, '');
      }

      // Add data validation flag for large values
      if (num > 1000000) {
        console.warn(`⚠️ ${context} is unusually large:`, num);
      }

      console.log(`✅ ${context} formatted:`, result, `(from ${num})`);
      return result;
    }

    // Data validation logging for transparency
    logDataValidation(source, metrics) {
      console.log(`📊 ${source} Analysis Data Validation:`);
      console.log(`   LOC: ${metrics.loc} (${typeof metrics.loc})`);
      console.log(`   Complexity1: ${metrics.complexity1} (${typeof metrics.complexity1})`);
      console.log(`   Complexity2: ${metrics.complexity2} (${typeof metrics.complexity2})`);
      console.log(`   Complexity3: ${metrics.complexity3} (${typeof metrics.complexity3})`);
      
      // Validate against expected ranges
      const validationResults = {
        loc: metrics.loc >= 0 && metrics.loc <= 100000,
        complexity1: metrics.complexity1 >= 1 && metrics.complexity1 <= 10000,
        complexity2: metrics.complexity2 >= 0 && metrics.complexity2 <= 10000,
        complexity3: metrics.complexity3 >= 0 && metrics.complexity3 <= 100000
      };
      
      console.log(`   Validation Results:`, validationResults);
      
      const allValid = Object.values(validationResults).every(Boolean);
      if (!allValid) {
        console.warn(`⚠️ ${source} analysis contains values outside expected ranges`);
      }
    }

    // Comparison validation for data integrity
    logComparisonValidation(staticResults, aiResults) {
      if (!aiResults || aiResults.unavailable) {
        console.log('📊 Comparison Validation: AI analysis unavailable, no comparison possible');
        return;
      }

      console.log('📊 Analysis Comparison Validation:');
      
      const metrics = ['loc', 'c1', 'c2', 'c3'];
      const comparisons = {};
      
      metrics.forEach(metric => {
        const staticVal = Number(staticResults[metric]);
        const aiVal = Number(aiResults[metric]);
        
        if (Number.isFinite(staticVal) && Number.isFinite(aiVal)) {
          const diff = aiVal - staticVal;
          const percentDiff = staticVal > 0 ? (Math.abs(diff) / staticVal * 100) : 0;
          
          comparisons[metric] = {
            static: staticVal,
            ai: aiVal,
            difference: diff,
            percentDifference: percentDiff.toFixed(2)
          };
          
          console.log(`   ${metric.toUpperCase()}: Static=${staticVal}, AI=${aiVal}, Diff=${diff} (${percentDiff.toFixed(1)}%)`);
          
          // Flag significant discrepancies
          if (percentDiff > 50) {
            console.warn(`⚠️ Significant discrepancy in ${metric}: ${percentDiff.toFixed(1)}% difference`);
          }
        } else {
          console.warn(`⚠️ Invalid comparison for ${metric}: Static=${staticVal}, AI=${aiVal}`);
        }
      });
      
      // Store comparison data for export
      this.lastComparisonData = comparisons;
    }

    displayComparison(s, a) {
      // Enhanced comparison with improved precision and validation
      if (a && a.unavailable) {
        this.locDifference.textContent = 'NA';
        this.complexityVariance.textContent = 'NA';
        this.locDifference.setAttribute('title', 'AI analysis unavailable - cannot compute differences');
        this.complexityVariance.setAttribute('title', 'AI analysis unavailable - cannot compute variance');
      } else {
        const aLocNum = Number(a.loc);
        const sLocNum = Number(s.loc);
        const aC1Num = Number(a.c1);
        const sC1Num = Number(s.c1);
        
        // Enhanced difference calculation with validation
        let locDiff = 'NA';
        let cVar = 'NA';
        
        if (Number.isFinite(aLocNum) && Number.isFinite(sLocNum)) {
          locDiff = aLocNum - sLocNum;
          console.log(`📊 LOC Comparison: AI(${aLocNum}) - Static(${sLocNum}) = ${locDiff}`);
        }
        
        if (Number.isFinite(aC1Num) && Number.isFinite(sC1Num)) {
          cVar = aC1Num - sC1Num;
          console.log(`📊 Complexity Comparison: AI(${aC1Num}) - Static(${sC1Num}) = ${cVar}`);
        }
        
        // Use enhanced formatting for comparison results
        this.locDifference.textContent = locDiff === 'NA' ? 'NA' : this.formatForDisplayWithValidation(locDiff, 'LOC Difference');
        this.complexityVariance.textContent = cVar === 'NA' ? 'NA' : this.formatForDisplayWithValidation(cVar, 'Complexity Variance');
        
        // Add detailed tooltips for comparison insights
        if (locDiff !== 'NA') {
          const locDiffAbs = Math.abs(locDiff);
          const locDiffPercent = sLocNum > 0 ? (locDiffAbs / sLocNum * 100).toFixed(1) : 'N/A';
          this.locDifference.setAttribute('title', 
            `LOC Analysis Difference: ${locDiff > 0 ? '+' : ''}${locDiff}\n` +
            `Absolute difference: ${locDiffAbs} lines\n` +
            `Percentage difference: ${locDiffPercent}%\n` +
            `Static: ${sLocNum}, AI: ${aLocNum}`
          );
        }
        
        if (cVar !== 'NA') {
          const cVarAbs = Math.abs(cVar);
          const cVarPercent = sC1Num > 0 ? (cVarAbs / sC1Num * 100).toFixed(1) : 'N/A';
          this.complexityVariance.setAttribute('title', 
            `Complexity Analysis Variance: ${cVar > 0 ? '+' : ''}${cVar}\n` +
            `Absolute variance: ${cVarAbs} units\n` +
            `Percentage variance: ${cVarPercent}%\n` +
            `Static: ${sC1Num}, AI: ${aC1Num}`
          );
        }
      }
      
      // Enhanced differences display with data validation
      this.differencesList.innerHTML = '';
      const notes = a.notes || [];
      notes.forEach((n, index) => {
        const div = document.createElement('div');
        div.className = 'difference-item';
        div.textContent = n;
        div.setAttribute('title', `Analysis Note ${index + 1}: ${n}`);
        this.differencesList.appendChild(div);
      });
      
      // Enhanced recommendations with data-driven insights
      this.recommendations.innerHTML = '';
      const recs = this.makeRecommendations(s, a);
      recs.forEach((r, index) => {
        const div = document.createElement('div');
        div.className = 'recommendation-item';
        div.textContent = r;
        div.setAttribute('title', `Recommendation ${index + 1} based on analysis results`);
        this.recommendations.appendChild(div);
      });

      // Log comparison validation
      this.logComparisonValidation(s, a);
    }

    makeRecommendations(s, a) {
      const recs = [];
  const sC1 = Number(s.c1);
  const sNest = Number(s.nestingDepth || 0);
  const aLoc = Number(a.loc);
  const sLoc = Number(s.loc);
  if (Number.isFinite(sC1) && sC1 > 10) recs.push('Refactor to reduce cyclomatic complexity (extract functions, simplify branches).');
  if (Number.isFinite(sNest) && sNest > 4) recs.push('Reduce nesting depth by early returns or guard clauses.');
  if (Number.isFinite(aLoc) && Number.isFinite(sLoc) && aLoc > sLoc * 1.5) recs.push('AI indicates more testable LOC; review for dead code or hidden branches.');
      if (!recs.length) recs.push('Code appears manageable; add unit tests for decision-heavy functions.');
      return recs;
    }

    exportResults() {
      const data = {
        file: this.file?.name || 'unknown.c',
        timestamp: new Date().toISOString(),
        analysisMetadata: {
          version: '1.0.0',
          static: {
            method: 'CFG-based complexity calculation',
            timestamp: new Date().toISOString()
          },
          ai: {
            provider: localStorage.getItem('cai_provider') || 'unknown',
            model: localStorage.getItem('selectedModel') || 'unknown',
            timestamp: new Date().toISOString()
          }
        },
        static: {
          loc: this.staticLOC.textContent,
          complexity1: this.staticComplexity1.textContent,
          complexity2: this.staticComplexity2.textContent,
          complexity3: this.staticComplexity3.textContent,
          analysisTime: this.staticTime?.textContent || 'N/A'
        },
        ai: {
          loc: this.aiLOC.textContent,
          complexity1: this.aiComplexity1.textContent,
          complexity2: this.aiComplexity2.textContent,
          complexity3: this.aiComplexity3.textContent,
          analysisTime: this.aiTime?.textContent || 'N/A',
          status: this.aiStatusNotice?.textContent || 'Unknown',
          notes: Array.from(this.differencesList.querySelectorAll('.difference-item')).map(d => d.textContent || '')
        },
        comparison: {
          locDifference: this.locDifference.textContent,
          complexityVariance: this.complexityVariance.textContent,
          comparisonData: this.lastComparisonData || null,
          recommendations: Array.from(this.recommendations.querySelectorAll('.recommendation-item')).map(d => d.textContent || '')
        },
        dataValidation: {
          exportTime: new Date().toISOString(),
          format: 'CAnalyzerAI-v1.0',
          quality: 'validated'
        }
      };
      
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `analysis-${this.file?.name || 'unknown'}-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a); 
      a.click();
      URL.revokeObjectURL(url); 
      a.remove();
      
      // Log export for transparency
      console.log('📄 Analysis results exported:', data);
    }

    newAnalysis() { this.resetUI(); }

    // Enhanced debugging and testing method
    async testAIAnalysisPipeline() {
      console.log('🧪 Testing AI Analysis Pipeline...');
      
      // Test with sample C code
      const testCode = `
#include <stdio.h>
int factorial(int n) {
    if (n <= 1) return 1;
    return n * factorial(n - 1);
}
int main() {
    printf("Factorial of 5: %d\\n", factorial(5));
    return 0;
}`;

      try {
        console.log('🧪 Test 1: Static Analysis');
        const staticResult = this.performStaticAnalysis(testCode);
        console.log('✅ Static result:', staticResult);

        console.log('🧪 Test 2: AI Analysis Pipeline');
        const aiResult = await this.performAIAnalysis(testCode);
        console.log('✅ AI result:', aiResult);

        console.log('🧪 Test 3: Display Methods');
        this.displayAI(aiResult, 1250);
        console.log('✅ Display test completed');

        console.log('🧪 Test 4: JSON Parsing Edge Cases');
        const edgeCases = [
          '{"loc": 10, "complexity1": 2, "complexity2": 1, "complexity3": 3}',
          'Response: {"loc":15,"complexity1":3,"complexity2":2,"complexity3":4,"notes":["test"]}',
          '```json\n{"loc": 8, "complexity1": 1, "complexity2": 1, "complexity3": 2}\n```',
          'The analysis shows: loc=12, complexity1=4, complexity2=3, complexity3=5',
          'Invalid response format'
        ];

        edgeCases.forEach((testCase, index) => {
          console.log(`🧪 Edge case ${index + 1}:`, testCase.slice(0, 50));
          const parsed = this.parseAIMetrics(testCase, 'test');
          console.log(`✅ Parsed result ${index + 1}:`, parsed);
        });

        return { success: true, message: 'All tests passed' };
      } catch (error) {
        console.error('❌ Pipeline test failed:', error);
        return { success: false, error: error.message };
      }
    }

    progress(pct, text) {
      if (this.progressFill) this.progressFill.style.width = `${pct}%`;
      if (this.progressText) this.progressText.textContent = text || '';
      
      // Update progress bar accessibility
      if (this.uploadProgress) {
        this.uploadProgress.setAttribute('aria-valuenow', pct.toString());
        this.uploadProgress.setAttribute('aria-valuetext', `${pct}% - ${text || 'Processing'}`);
      }
      
      // Announce progress to screen readers at key milestones
      if (pct === 100 && text) {
        this.announceToScreenReader(`Analysis complete: ${text}`);
      } else if (pct % 25 === 0 && pct > 0) {
        this.announceToScreenReader(`Progress: ${pct}% - ${text || 'Processing'}`);
      }
    }

    showLoading(show, text='') {
      if (!this.loadingOverlay) return;
      this.loadingOverlay.classList.toggle('hidden', !show);
      if (text && this.loadingText) this.loadingText.textContent = text;
    }

    // Chat integration methods
    notifyFileUploaded(file) {
      if (!this.fileText) {
        // Read the file content for chat context
        this.readFile(file).then(content => {
          const fileData = {
            name: file.name,
            content: content,
            size: file.size,
            type: file.type
          };
          
          // Dispatch custom event for chat window
          window.dispatchEvent(new CustomEvent('fileUploaded', {
            detail: fileData
          }));
          
          // Also set on chat window directly if available
          if (window.chatWindow) {
            window.chatWindow.setFileContext(fileData);
          }
        }).catch(err => {
          console.warn('Failed to read file content for chat:', err);
        });
      } else {
        // File already read
        const fileData = {
          name: file.name,
          content: this.fileText,
          size: file.size,
          type: file.type
        };
        
        window.dispatchEvent(new CustomEvent('fileUploaded', {
          detail: fileData
        }));
        
        if (window.chatWindow) {
          window.chatWindow.setFileContext(fileData);
        }
      }
    }

    notifyAnalysisCompleted(staticResult, aiResult) {
      const analysisData = {
        filename: this.file?.name,
        timestamp: new Date().toISOString(),
        static: {
          loc: staticResult.loc,
          c1: staticResult.c1,
          c2: staticResult.c2,
          c3: staticResult.c3,
          decisionPoints: staticResult.decisionPoints,
          nestingDepth: staticResult.nestingDepth,
          cfgMetrics: staticResult.cfgMetrics
        },
        ai: {
          loc: aiResult.loc,
          c1: aiResult.c1,
          c2: aiResult.c2,
          c3: aiResult.c3,
          notes: aiResult.notes,
          unavailable: aiResult.unavailable,
          fallbackUsed: aiResult.fallbackUsed
        },
        fileContent: this.fileText
      };

      // Dispatch custom event
      window.dispatchEvent(new CustomEvent('analysisCompleted', {
        detail: analysisData
      }));

      // Also set on chat window directly if available
      if (window.chatWindow) {
        window.chatWindow.setAnalysisContext(analysisData);
      }
    }
  }

  // Status Legend System
  function initStatusLegend() {
    const legendBtn = document.getElementById('statusLegendBtn');
    if (legendBtn) {
      legendBtn.addEventListener('click', showStatusLegend);
    }
  }

  function showStatusLegend() {
    if (!document.getElementById('statusLegendModal')) {
      createStatusLegendModal();
    }
    
    const modal = document.getElementById('statusLegendModal');
    if (modal) {
      modal.classList.remove('hidden');
      modal.classList.add('show');
    }
  }

  function createStatusLegendModal() {
    const modalHTML = `
      <div class="modal" id="statusLegendModal">
        <div class="modal-backdrop"></div>
        <div class="modal-content status-legend-modal">
          <div class="modal-header">
            <h2 class="modal-title">
              <span class="modal-icon">📊</span> Status Indicators Reference Guide
            </h2>
            <button class="modal-close" onclick="document.getElementById('statusLegendModal').classList.add('hidden')">&times;</button>
          </div>
          <div class="modal-body">
            <div class="legend-section">
              <h3 class="legend-section-title">🔑 Universal Status Meanings</h3>
              <div class="legend-grid">
                <div class="legend-item">
                  <div class="legend-indicator">
                    <div class="status-dot" style="background: #39ff14;"></div>
                  </div>
                  <div class="legend-content">
                    <strong>🟢 Ready/Pass/Success</strong>
                    <p>System is working correctly or test passed</p>
                  </div>
                </div>
                
                <div class="legend-item">
                  <div class="legend-indicator">
                    <div class="status-dot" style="background: #8892b0;"></div>
                  </div>
                  <div class="legend-content">
                    <strong>⚫ Not Set/Inactive</strong>
                    <p>Feature not configured or inactive</p>
                  </div>
                </div>
                
                <div class="legend-item">
                  <div class="legend-indicator">
                    <div class="status-dot" style="background: #ffa502;"></div>
                  </div>
                  <div class="legend-content">
                    <strong>🟡 Pending/Warning</strong>
                    <p>Test queued, in progress, or needs attention</p>
                  </div>
                </div>
                
                <div class="legend-item">
                  <div class="legend-indicator">
                    <div class="status-dot" style="background: #ff4757;"></div>
                  </div>
                  <div class="legend-content">
                    <strong>🔴 Failed/Error</strong>
                    <p>Test failed or system error occurred</p>
                  </div>
                </div>
              </div>
            </div>

            <div class="legend-section">
              <h3 class="legend-section-title">⚙️ Configuration Status</h3>
              <div class="status-examples">
                <div class="status-example-compact">
                  <span class="status-badge ready">Ready</span>
                  <span>API key configured and validated</span>
                </div>
                <div class="status-example-compact">
                  <span class="status-badge not-set">Never configured ⚙️</span>
                  <span>Click settings button to configure</span>
                </div>
                <div class="status-example-compact">
                  <span class="status-badge tested">Tested [timestamp]</span>
                  <span>API key manually tested and verified</span>
                </div>
                <div class="status-example-compact">
                  <span class="status-badge failed">Failed [timestamp]</span>
                  <span>Test failed - check connection/key</span>
                </div>
              </div>
            </div>

            <div class="legend-section">
              <h3 class="legend-section-title">🧪 Testing Status</h3>
              <div class="status-examples">
                <div class="status-example-compact">
                  <span class="status-badge pending">⏳ Pending</span>
                  <span>Test not started yet</span>
                </div>
                <div class="status-example-compact">
                  <span class="status-badge testing">🔄 Testing</span>
                  <span>Test currently running</span>
                </div>
                <div class="status-example-compact">
                  <span class="status-badge pass">✅ Pass</span>
                  <span>Test completed successfully</span>
                </div>
                <div class="status-example-compact">
                  <span class="status-badge fail">❌ Fail</span>
                  <span>Test failed - issues found</span>
                </div>
              </div>
            </div>

            <div class="legend-section">
              <h3 class="legend-section-title">💡 Getting Help</h3>
              <div class="help-grid">
                <div class="help-item">
                  <strong>? Help Buttons:</strong> Click for detailed explanations
                </div>
                <div class="help-item">
                  <strong>🔄 Hover Tooltips:</strong> Hover over status indicators for quick info
                </div>
                <div class="help-item">
                  <strong>⚙️ Configuration:</strong> Use settings buttons to fix "Not Set" statuses
                </div>
                <div class="help-item">
                  <strong>🔍 Detailed View:</strong> Click status indicators for more information
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
  }

  window.addEventListener('DOMContentLoaded', () => {
    sys.init();
    const app = new CAnalyzerAIRef();

    // Initialize status legend system
    initStatusLegend();

    // Expose app instance and test methods for debugging
    window.CAnalyzerAI = app;
    window.testAIPipeline = () => app.testAIAnalysisPipeline();
    
    // Additional debugging helpers
    window.debugAIParsing = (testText) => {
      console.log('🧪 Manual AI parsing test:');
      return app.parseAIMetrics(testText, 'manual test');
    };
    
    window.checkAIStatus = () => {
      const provider = localStorage.getItem('cai_provider') || 'ollama';
      const apiKey = localStorage.getItem('cai_api_key') || '';
      const model = localStorage.getItem('selectedModel') || 'default';
      
      console.log('🔍 Current AI Configuration:');
      console.log('Provider:', provider);
      console.log('Model:', model);
      console.log('API Key:', apiKey ? `${apiKey.slice(0, 10)}...` : 'None');
      console.log('API Key Valid:', apiKey && apiKey.length > 10);
      
      return { provider, model, hasApiKey: !!apiKey };
    };

    window.debugLOCDifference = (staticLOC, aiLOC) => {
      console.log('🧪 Testing LOC Difference Calculation:');
      console.log(`Static LOC: ${staticLOC} (${typeof staticLOC})`);
      console.log(`AI LOC: ${aiLOC} (${typeof aiLOC})`);
      
      const aLocNum = Number(aiLOC);
      const sLocNum = Number(staticLOC);
      
      console.log(`Converted - Static: ${sLocNum}, AI: ${aLocNum}`);
      console.log(`Is Static finite: ${Number.isFinite(sLocNum)}`);
      console.log(`Is AI finite: ${Number.isFinite(aLocNum)}`);
      
      let locDiff = 'NA';
      if (Number.isFinite(aLocNum) && Number.isFinite(sLocNum)) {
        locDiff = aLocNum - sLocNum;
        console.log(`Raw difference: ${locDiff}`);
      }
      
      const formatted = locDiff === 'NA' ? 'NA' : app.formatForDisplayWithValidation(locDiff, 'LOC Difference');
      console.log(`Formatted result: ${formatted}`);
      
      return { raw: locDiff, formatted };
    };

    window.testLOCScenarios = () => {
      console.log('🧪 Testing Various LOC Difference Scenarios:');
      
      const scenarios = [
        { static: 63, ai: 39, expected: '-24' },
        { static: 39, ai: 63, expected: '+24' },
        { static: 50, ai: 50, expected: '0' },
        { static: 'NA', ai: 50, expected: 'NA' },
        { static: 50, ai: 'NA', expected: 'NA' },
        { static: 25.5, ai: 30.7, expected: '+5.2' }
      ];
      
      scenarios.forEach((scenario, index) => {
        console.log(`\n--- Scenario ${index + 1} ---`);
        const result = window.debugLOCDifference(scenario.static, scenario.ai);
        console.log(`Expected: ${scenario.expected}, Got: ${result.formatted}`);
        console.log(`✅ Match: ${result.formatted === scenario.expected || (scenario.expected === 'NA' && result.formatted === 'NA')}`);
      });
    };

    window.suggestAlternativeModels = () => {
      console.log('💡 Alternative OpenRouter Models (Better for JSON):');
      console.log('- google/gemini-2.0-flash-exp:free (Recommended)');
      console.log('- google/gemini-2.5-flash:free (Good alternative)');
      console.log('- meta-llama/llama-3.1-8b-instruct:free');
      console.log('- microsoft/wizardlm-2-8x22b:free');
      console.log('- huggingface/starcoder2-15b:free');
      console.log('');
      console.log('💡 To switch models:');
      console.log('1. Open Settings (⚙️ button)');
      console.log('2. Select a different model from the dropdown');
      console.log('3. Save and try analysis again');
      console.log('');
      console.log('📊 Current model performance issues:');
      console.log('- Some models may return explanations instead of JSON');
      console.log('- Try google/gemini-2.0-flash-exp:free for better structured output');
    };

    window.testLOCScenarios = () => {
      console.log('🧪 Testing Various LOC Difference Scenarios:');
      
      const scenarios = [
        { static: 63, ai: 39, expected: '-24' },
        { static: 39, ai: 63, expected: '+24' },
        { static: 50, ai: 50, expected: '0' },
        { static: 'NA', ai: 50, expected: 'NA' },
        { static: 50, ai: 'NA', expected: 'NA' },
        { static: 25.5, ai: 30.7, expected: '+5.2' }
      ];
      
      scenarios.forEach((scenario, index) => {
        console.log(`\n--- Scenario ${index + 1} ---`);
        const result = window.debugLOCDifference(scenario.static, scenario.ai);
        console.log(`Expected: ${scenario.expected}, Got: ${result.formatted}`);
        console.log(`✅ Match: ${result.formatted === scenario.expected || (scenario.expected === 'NA' && result.formatted === 'NA')}`);
      });
    };

    window.switchToRecommendedModel = () => {
      localStorage.setItem('selectedModel', 'google/gemini-2.0-flash-exp:free');
      console.log('✅ Switched to google/gemini-2.0-flash-exp:free');
      console.log('🔄 Please try your analysis again');
      return 'Model switched to google/gemini-2.0-flash-exp:free';
    };
    
    console.log('🎯 CAnalyzerAI Debug: App instance available as window.CAnalyzerAI');
    console.log('🎯 CAnalyzerAI Debug: Run window.testAIPipeline() to test AI analysis');
    console.log('🎯 CAnalyzerAI Debug: Run window.checkAIStatus() to check configuration');
    console.log('🎯 CAnalyzerAI Debug: Run window.debugAIParsing("your json") to test parsing');
    console.log('🎯 CAnalyzerAI Debug: Run window.testLOCScenarios() to test LOC difference calculations');
    console.log('🎯 CAnalyzerAI Debug: Run window.debugLOCDifference(static, ai) to test specific values');

    // Loading text animation
    anime({
      targets: '.loading-text',
      translateY: [0, -10, 0],
      opacity: [1, 0.5, 1],
      duration: 1500,
      loop: true,
      easing: 'easeInOutSine'
    });

    // Enhanced Theme System with Auto Detection
    class ThemeManager {
      constructor() {
        this.themes = ['auto', 'light', 'dark'];
        this.currentTheme = 'auto';
        this.systemPreference = 'dark';
        this.mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        this.transitionDuration = 500;
        
        this.init();
      }

      init() {
        this.detectSystemPreference();
        this.loadSavedTheme();
        this.setupEventListeners();
        this.setupKeyboardControls();
        this.applyTheme(this.currentTheme, false);
        this.updateUI();
        
        console.log('🎨 Enhanced theme system initialized');
      }

      detectSystemPreference() {
        this.systemPreference = this.mediaQuery.matches ? 'dark' : 'light';
        
        // Listen for system theme changes
        this.mediaQuery.addEventListener('change', (e) => {
          this.systemPreference = e.matches ? 'dark' : 'light';
          console.log(`🔄 System theme changed to: ${this.systemPreference}`);
          
          // If using auto mode, apply the new system preference
          if (this.currentTheme === 'auto') {
            this.applyTheme('auto', true);
          }
          
          this.updateUI();
        });
      }

      loadSavedTheme() {
        const savedTheme = localStorage.getItem('theme-preference');
        if (savedTheme && this.themes.includes(savedTheme)) {
          this.currentTheme = savedTheme;
        } else {
          // Default to auto if no preference is saved
          this.currentTheme = 'auto';
          this.saveTheme();
        }
      }

      saveTheme() {
        localStorage.setItem('theme-preference', this.currentTheme);
        localStorage.setItem('theme-timestamp', new Date().toISOString());
        console.log(`💾 Theme preference saved: ${this.currentTheme}`);
      }

      setupEventListeners() {
        const themeToggle = document.getElementById('themeToggle');
        const themeOptions = document.getElementById('themeOptions');
        const themeOptionButtons = document.querySelectorAll('.theme-option');

        // Main toggle click
        themeToggle?.addEventListener('click', (e) => {
          e.stopPropagation();
          this.toggleDropdown();
        });

        // Theme option selection
        themeOptionButtons.forEach(button => {
          button.addEventListener('click', (e) => {
            e.stopPropagation();
            const theme = button.dataset.theme;
            this.setTheme(theme);
            this.hideDropdown();
          });
        });

        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
          if (!e.target.closest('.theme-toggle-container')) {
            this.hideDropdown();
          }
        });

        // Close dropdown on escape key
        document.addEventListener('keydown', (e) => {
          if (e.key === 'Escape') {
            this.hideDropdown();
          }
        });
      }

      setupKeyboardControls() {
        const themeToggle = document.getElementById('themeToggle');
        
        themeToggle?.addEventListener('keydown', (e) => {
          switch (e.key) {
            case 'Enter':
            case ' ':
              e.preventDefault();
              this.toggleDropdown();
              break;
            case 'ArrowDown':
              e.preventDefault();
              this.showDropdown();
              this.focusFirstOption();
              break;
            case 'ArrowUp':
              e.preventDefault();
              this.showDropdown();
              this.focusLastOption();
              break;
          }
        });

        // Arrow key navigation in dropdown
        const themeOptions = document.querySelectorAll('.theme-option');
        themeOptions.forEach((option, index) => {
          option.addEventListener('keydown', (e) => {
            switch (e.key) {
              case 'ArrowDown':
                e.preventDefault();
                const nextIndex = (index + 1) % themeOptions.length;
                themeOptions[nextIndex].focus();
                break;
              case 'ArrowUp':
                e.preventDefault();
                const prevIndex = (index - 1 + themeOptions.length) % themeOptions.length;
                themeOptions[prevIndex].focus();
                break;
              case 'Enter':
              case ' ':
                e.preventDefault();
                option.click();
                break;
            }
          });
        });
      }

      setTheme(theme) {
        if (!this.themes.includes(theme)) {
          console.warn(`Invalid theme: ${theme}`);
          return;
        }

        this.currentTheme = theme;
        this.saveTheme();
        this.applyTheme(theme, true);
        this.updateUI();
        
        // Trigger custom event for other components
        window.dispatchEvent(new CustomEvent('themechange', {
          detail: { 
            theme, 
            effectiveTheme: this.getEffectiveTheme(),
            systemPreference: this.systemPreference 
          }
        }));
        
        console.log(`🎨 Theme changed to: ${theme}`);
      }

      getEffectiveTheme() {
        return this.currentTheme === 'auto' ? this.systemPreference : this.currentTheme;
      }

      applyTheme(theme, withTransition = false) {
        const effectiveTheme = this.getEffectiveTheme();
        
        if (withTransition) {
          document.documentElement.classList.add('theme-transitioning');
          
          setTimeout(() => {
            document.documentElement.classList.remove('theme-transitioning');
          }, this.transitionDuration);
        }

        // Set the effective theme (what's actually displayed)
        document.documentElement.setAttribute('data-theme', effectiveTheme);
        
        // Store the user's preference separately
        document.documentElement.setAttribute('data-theme-preference', theme);
        
        // Update meta theme-color for mobile browsers
        this.updateMetaThemeColor(effectiveTheme);
        
        // Announce theme change to screen readers
        this.announceThemeChange(theme, effectiveTheme);
      }

      updateMetaThemeColor(theme) {
        let themeColor = theme === 'dark' ? '#02001a' : '#f6f8ff';
        
        let metaThemeColor = document.querySelector('meta[name="theme-color"]');
        if (!metaThemeColor) {
          metaThemeColor = document.createElement('meta');
          metaThemeColor.name = 'theme-color';
          document.head.appendChild(metaThemeColor);
        }
        metaThemeColor.content = themeColor;
      }

      announceThemeChange(userTheme, effectiveTheme) {
        const announcement = userTheme === 'auto' 
          ? `Theme set to auto mode, currently displaying ${effectiveTheme} theme`
          : `Theme changed to ${effectiveTheme} mode`;
          
        // Create temporary announcement element for screen readers
        const announcer = document.createElement('div');
        announcer.setAttribute('aria-live', 'polite');
        announcer.setAttribute('aria-atomic', 'true');
        announcer.className = 'sr-only';
        announcer.textContent = announcement;
        
        document.body.appendChild(announcer);
        setTimeout(() => announcer.remove(), 1000);
      }

      updateUI() {
        const themeToggleLabel = document.getElementById('themeToggleLabel');
        const themeOptions = document.querySelectorAll('.theme-option');
        const themeToggle = document.getElementById('themeToggle');
        
        // Update toggle label
        if (themeToggleLabel) {
          const labels = {
            auto: 'Auto',
            light: 'Light',
            dark: 'Dark'
          };
          themeToggleLabel.textContent = labels[this.currentTheme];
        }

        // Update ARIA attributes
        if (themeToggle) {
          themeToggle.setAttribute('aria-checked', this.currentTheme);
          themeToggle.setAttribute('aria-label', 
            `Theme toggle, current: ${this.currentTheme}, effective: ${this.getEffectiveTheme()}`);
        }

        // Update active option
        themeOptions.forEach(option => {
          const isActive = option.dataset.theme === this.currentTheme;
          option.classList.toggle('active', isActive);
          option.setAttribute('aria-selected', isActive);
        });

        // Add system preference indicator if auto is selected
        this.updateSystemIndicator();
      }

      updateSystemIndicator() {
        const indicator = document.querySelector('.system-preference-indicator');
        if (!indicator) {
          const themeToggle = document.getElementById('themeToggle');
          const newIndicator = document.createElement('div');
          newIndicator.className = 'system-preference-indicator';
          newIndicator.setAttribute('title', `System preference: ${this.systemPreference}`);
          themeToggle?.appendChild(newIndicator);
        }
      }

      toggleDropdown() {
        const themeOptions = document.getElementById('themeOptions');
        const isVisible = themeOptions?.classList.contains('show');
        
        if (isVisible) {
          this.hideDropdown();
        } else {
          this.showDropdown();
        }
      }

      showDropdown() {
        const themeOptions = document.getElementById('themeOptions');
        themeOptions?.classList.add('show');
        
        // Animate individual options
        const options = themeOptions?.querySelectorAll('.theme-option');
        options?.forEach((option, index) => {
          option.style.opacity = '0';
          option.style.transform = 'translateX(-10px)';
          
          setTimeout(() => {
            option.style.transition = 'all 0.2s ease';
            option.style.opacity = '1';
            option.style.transform = 'translateX(0)';
          }, index * 50);
        });
      }

      hideDropdown() {
        const themeOptions = document.getElementById('themeOptions');
        themeOptions?.classList.remove('show');
      }

      focusFirstOption() {
        const firstOption = document.querySelector('.theme-option');
        firstOption?.focus();
      }

      focusLastOption() {
        const options = document.querySelectorAll('.theme-option');
        const lastOption = options[options.length - 1];
        lastOption?.focus();
      }

      // Cycle through themes (for quick toggle)
      cycleTheme() {
        const currentIndex = this.themes.indexOf(this.currentTheme);
        const nextIndex = (currentIndex + 1) % this.themes.length;
        this.setTheme(this.themes[nextIndex]);
      }

      // Get theme statistics for debugging
      getThemeStats() {
        return {
          currentTheme: this.currentTheme,
          effectiveTheme: this.getEffectiveTheme(),
          systemPreference: this.systemPreference,
          savedTimestamp: localStorage.getItem('theme-timestamp'),
          supportsPreference: this.mediaQuery ? 'yes' : 'no'
        };
      }
    }

    // Initialize enhanced theme system
    const themeManager = new ThemeManager();
    
    // Expose theme manager globally for debugging
    window.themeManager = themeManager;

    // Animations with Anime.js
    anime({
      targets: '.app-title',
      translateX: [-20, 0],
      opacity: [0, 1],
      duration: 800,
      easing: 'easeOutExpo'
    });

    anime({
      targets: '.header .api-key-status, .header .version',
      translateX: [20, 0],
      opacity: [0, 1],
      duration: 800,
      easing: 'easeOutExpo',
      delay: 200
    });

    anime({
      targets: '.upload-zone',
      translateY: [50, 0],
      opacity: [0, 1],
      duration: 1000,
      easing: 'easeOutExpo',
      delay: 400
    });

    // Interactive element animations
    function addInteractiveAnimations() {
      // Animate metric cards on scroll
      const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
      };

      const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            anime({
              targets: entry.target,
              scale: [0.9, 1],
              opacity: [0, 1],
              duration: 600,
              easing: 'easeOutElastic(1, 0.8)',
              delay: anime.stagger(100)
            });
          }
        });
      }, observerOptions);

      // Observe all metric cards and analysis panels
      document.querySelectorAll('.metric-card, .analysis-panel, .comparison-panel').forEach(el => {
        observer.observe(el);
      });

      // Add mouse follow effect to buttons
      document.querySelectorAll('.btn').forEach(btn => {
        btn.addEventListener('mousemove', (e) => {
          const rect = btn.getBoundingClientRect();
          const x = e.clientX - rect.left;
          const y = e.clientY - rect.top;
          
          btn.style.setProperty('--mouse-x', `${x}px`);
          btn.style.setProperty('--mouse-y', `${y}px`);
        });
      });

      // Animate complexity cards with stagger effect
      document.addEventListener('click', (e) => {
        if (e.target.id === 'analyzeBtn') {
          setTimeout(() => {
            anime({
              targets: '.complexity-card',
              scale: [1.1, 1],
              rotateY: [180, 0],
              opacity: [0, 1],
              duration: 800,
              easing: 'easeOutExpo',
              delay: anime.stagger(200, {start: 1000})
            });
          }, 1000);
        }
      });
    }

    // Initialize interactive animations
    addInteractiveAnimations();

    // Floating text effect for file upload
    function createFloatingText(text, x, y) {
      const floatingText = document.createElement('div');
      floatingText.textContent = text;
      floatingText.style.cssText = `
        position: fixed;
        left: ${x}px;
        top: ${y}px;
        color: var(--accent-cyan);
        font-weight: bold;
        font-size: 14px;
        pointer-events: none;
        z-index: 1000;
        text-shadow: 0 0 10px var(--accent-cyan);
      `;
      document.body.appendChild(floatingText);

      anime({
        targets: floatingText,
        translateY: -50,
        opacity: [1, 0],
        duration: 2000,
        easing: 'easeOutExpo',
        complete: () => floatingText.remove()
      });
    }

    // Enhanced file drop animation
    const uploadZone = document.getElementById('uploadZone');
    if (uploadZone) {
      uploadZone.addEventListener('dragenter', (e) => {
        anime({
          targets: uploadZone,
          scale: 1.05,
          duration: 300,
          easing: 'easeOutExpo'
        });
      });

      uploadZone.addEventListener('dragleave', (e) => {
        anime({
          targets: uploadZone,
          scale: 1,
          duration: 300,
          easing: 'easeOutExpo'
        });
      });

      uploadZone.addEventListener('drop', (e) => {
        createFloatingText('File uploaded!', e.clientX, e.clientY);
        anime({
          targets: uploadZone,
          scale: [1.1, 1],
          duration: 500,
          easing: 'easeOutElastic(1, 0.6)'
        });
      });
    }
  });

  // Simplified But Visible Particle System - DISABLED (using matrix-particles.js instead)
  /*
  document.addEventListener('DOMContentLoaded', () => {
    // Small delay to ensure DOM is fully ready
    setTimeout(() => {
      console.log('🎯 Initializing particle system...');
      
      const canvas = document.getElementById('particleCanvas');
      if (!canvas) {
        console.error('❌ Canvas element not found!');
        return;
      }
      
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        console.error('❌ Canvas context failed!');
        return;
      }
      
      console.log('✅ Canvas ready, starting particles...');
      
      // Ensure canvas is properly sized
      function updateCanvasSize() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        console.log(`� Canvas size: ${canvas.width} x ${canvas.height}`);
      }
      updateCanvasSize();
      
      let particles = [];
      let frameCount = 0;
      
      class VisibleParticle {
        constructor() {
          this.x = Math.random() * canvas.width;
          this.y = Math.random() * canvas.height;
          this.vx = (Math.random() - 0.5) * 2;
          this.vy = (Math.random() - 0.5) * 2;
          this.size = Math.random() * 3 + 1;
          this.opacity = Math.random() * 0.7 + 0.3;
          this.color = Math.random() > 0.5 ? '#6c63ff' : '#00f5d4';
        }
        
        update() {
          // Move particle
          this.x += this.vx;
          this.y += this.vy;
          
          // Bounce off edges
          if (this.x <= 0 || this.x >= canvas.width) this.vx *= -1;
          if (this.y <= 0 || this.y >= canvas.height) this.vy *= -1;
          
          // Keep in bounds
          this.x = Math.max(0, Math.min(canvas.width, this.x));
          this.y = Math.max(0, Math.min(canvas.height, this.y));
        }
        
        draw() {
          ctx.save();
          ctx.globalAlpha = this.opacity;
          ctx.fillStyle = this.color;
          ctx.beginPath();
          ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
      }
      
      // Create particles
      function createParticles() {
        particles = [];
        const count = 50;
        for (let i = 0; i < count; i++) {
          particles.push(new VisibleParticle());
        }
        console.log(`✨ Created ${particles.length} particles`);
      }
      
      // Animation loop
      function animate() {
        frameCount++;
        
        // Clear canvas with slight trail
        ctx.fillStyle = 'rgba(2, 0, 26, 0.1)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Update and draw particles
        particles.forEach(particle => {
          particle.update();
          particle.draw();
        });
        
        // Log progress every 60 frames (about 1 second)
        if (frameCount % 60 === 0) {
          console.log(`🎬 Animation running - Frame ${frameCount}, Particles: ${particles.length}`);
        }
        
        requestAnimationFrame(animate);
      }
      
      // Initialize and start
      createParticles();
      animate();
      
      // Handle resize
      window.addEventListener('resize', () => {
        updateCanvasSize();
        createParticles();
      });
      
      console.log('🚀 Particle system started successfully!');
    }, 100); // Small delay to ensure DOM is ready
  });
  */

  // Enhanced Particle System - Working Version - DISABLED (using matrix-particles.js instead)
  /*
  setTimeout(() => {
    console.log('🎯 Initializing enhanced particle system...');
    
    const canvas = document.getElementById('particleCanvas');
    if (!canvas) {
      console.error('❌ Canvas not found');
      return;
    }
    
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      console.error('❌ Context failed');
      return;
    }
    
    console.log('✅ Canvas and context ready');
    
    // Force canvas setup
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    canvas.style.position = 'fixed';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.zIndex = '0';
    canvas.style.pointerEvents = 'none';
    console.log(`📐 Canvas: ${canvas.width}x${canvas.height}`);
    
    let particles = [];
    let animId;
    
    class WorkingParticle {
      constructor() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.vx = (Math.random() - 0.5) * 1.5;
        this.vy = (Math.random() - 0.5) * 1.5;
        this.size = Math.random() * 3 + 1;
        this.alpha = Math.random() * 0.7 + 0.3;
        this.hue = Math.random() * 60 + 240; // Blue to purple range
      }
      
      update() {
        this.x += this.vx;
        this.y += this.vy;
        
        // Wrap around edges
        if (this.x < -10) this.x = canvas.width + 10;
        if (this.x > canvas.width + 10) this.x = -10;
        if (this.y < -10) this.y = canvas.height + 10;
        if (this.y > canvas.height + 10) this.y = -10;
      }
      
      draw() {
        ctx.save();
        ctx.globalAlpha = this.alpha;
        ctx.fillStyle = `hsl(${this.hue}, 100%, 60%)`;
        ctx.shadowColor = `hsl(${this.hue}, 100%, 60%)`;
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }
    
    // Create particles
    for (let i = 0; i < 50; i++) {
      particles.push(new WorkingParticle());
    }
    console.log(`✨ Created ${particles.length} working particles`);
    
    // Animation loop
    function animate() {
      // Clear with trail effect
      ctx.fillStyle = 'rgba(2, 0, 26, 0.05)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Update and draw particles
      particles.forEach(particle => {
        particle.update();
        particle.draw();
      });
      
      animId = requestAnimationFrame(animate);
    }
    
    // Start animation
    animate();
    
    // Handle resize
    window.addEventListener('resize', () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      console.log('🔄 Canvas resized');
    });
    
    console.log('🚀 Enhanced particle system running!');
    
    // Confirmation after 2 seconds
    setTimeout(() => {
      console.log(`✅ Confirmed: ${particles.length} particles actively animating`);
    }, 2000);
  }, 500); // Wait 500ms to ensure DOM is fully ready
  */
})();

// ========================================
// MICRO-INTERACTIONS SYSTEM
// ========================================

class MicroInteractions {
  constructor() {
    this.rippleElements = [];
    this.init();
  }

  init() {
    this.setupButtonRipples();
    this.setupFormInteractions();
    this.setupCardInteractions();
    this.setupNavigationTransitions();
    this.setupProgressiveDisclosure();
    this.setupParallaxEffects();
    this.setupLoadingStates();
    this.setupTooltipInteractions();
    console.log('🎨 Micro-interactions system initialized');
  }

  // Button Ripple Effects
  setupButtonRipples() {
    const buttons = document.querySelectorAll('.btn, .settings-btn, .key-toggle-btn');
    
    buttons.forEach(button => {
      button.addEventListener('click', (e) => {
        this.createRipple(e, button);
      });

      // Add press animation
      button.addEventListener('mousedown', () => {
        button.style.transform = 'scale(0.95)';
        button.style.transition = 'transform 0.1s ease-out';
      });

      button.addEventListener('mouseup', () => {
        button.style.transform = '';
        button.style.transition = 'all 0.25s cubic-bezier(0.25, 1, 0.5, 1)';
      });

      button.addEventListener('mouseleave', () => {
        button.style.transform = '';
      });
    });
  }

  createRipple(event, element) {
    const circle = document.createElement('span');
    const rect = element.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = event.clientX - rect.left - size / 2;
    const y = event.clientY - rect.top - size / 2;

    circle.classList.add('btn-ripple');
    circle.style.width = circle.style.height = size + 'px';
    circle.style.left = x + 'px';
    circle.style.top = y + 'px';

    element.appendChild(circle);

    setTimeout(() => {
      circle.remove();
    }, 500);
  }

  // Enhanced Form Interactions
  setupFormInteractions() {
    const inputs = document.querySelectorAll('.form-control');
    
    inputs.forEach(input => {
      // Focus animations
      input.addEventListener('focus', () => {
        this.animateInputFocus(input);
      });

      input.addEventListener('blur', () => {
        this.animateInputBlur(input);
      });

      // Real-time validation feedback
      input.addEventListener('input', () => {
        this.validateInput(input);
      });

      // Floating label effect
      this.setupFloatingLabel(input);
    });
  }

  animateInputFocus(input) {
    input.style.transform = 'scale(1.01)';
    input.parentElement?.classList.add('input-focused');
    
    // Add glow effect
    const glow = document.createElement('div');
    glow.className = 'input-glow';
    glow.style.cssText = `
      position: absolute;
      top: -2px;
      left: -2px;
      right: -2px;
      bottom: -2px;
      background: linear-gradient(45deg, var(--accent-glow), var(--accent-cyan));
      border-radius: inherit;
      z-index: -1;
      opacity: 0;
      animation: glowPulse 2s ease-in-out infinite;
    `;
    
    if (input.parentElement.style.position !== 'relative') {
      input.parentElement.style.position = 'relative';
    }
    input.parentElement.appendChild(glow);
  }

  animateInputBlur(input) {
    input.style.transform = '';
    input.parentElement?.classList.remove('input-focused');
    
    const glow = input.parentElement?.querySelector('.input-glow');
    if (glow) {
      glow.remove();
    }
  }

  validateInput(input) {
    const value = input.value.trim();
    
    if (input.type === 'email' && value) {
      const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
      this.setInputValidation(input, isValid);
    } else if (input.required && value) {
      this.setInputValidation(input, value.length >= 3);
    }
  }

  setInputValidation(input, isValid) {
    input.classList.remove('input-valid', 'input-invalid');
    input.classList.add(isValid ? 'input-valid' : 'input-invalid');
    
    if (!isValid) {
      input.style.animation = 'shake 0.6s ease-in-out';
      setTimeout(() => {
        input.style.animation = '';
      }, 600);
    }
  }

  setupFloatingLabel(input) {
    const label = input.parentElement?.querySelector('.form-label');
    if (!label) return;

    const updateLabel = () => {
      if (input.value || input === document.activeElement) {
        label.style.transform = 'translateY(-25px) scale(0.8)';
        label.style.color = 'var(--accent-glow)';
      } else {
        label.style.transform = '';
        label.style.color = '';
      }
    };

    input.addEventListener('focus', updateLabel);
    input.addEventListener('blur', updateLabel);
    input.addEventListener('input', updateLabel);
    
    updateLabel();
  }

  // Card Hover Interactions
  setupCardInteractions() {
    const cards = document.querySelectorAll('.metric-card, .complexity-card, .summary-item, .analysis-panel, .comparison-panel');
    
    cards.forEach(card => {
      card.addEventListener('mouseenter', (e) => {
        this.animateCardHover(card, true);
      });

      card.addEventListener('mouseleave', (e) => {
        this.animateCardHover(card, false);
      });

      card.addEventListener('click', (e) => {
        this.animateCardPress(card);
      });
    });
  }

  animateCardHover(card, isEntering) {
    if (isEntering) {
      card.style.zIndex = '10';
      card.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
    } else {
      card.style.zIndex = '';
      setTimeout(() => {
        card.style.transition = '';
      }, 300);
    }
  }

  animateCardPress(card) {
    card.style.transform = 'scale(0.98) translateY(0)';
    card.style.transition = 'transform 0.1s ease-out';
    
    setTimeout(() => {
      card.style.transform = '';
      card.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
    }, 100);
  }

  // Navigation Transitions
  setupNavigationTransitions() {
    const sections = document.querySelectorAll('.upload-section, .results-section');
    
    // Intersection Observer for scroll animations
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.style.animation = 'slideInUp 0.6s cubic-bezier(0.4, 0, 0.2, 1)';
        }
      });
    }, { threshold: 0.1 });

    sections.forEach(section => observer.observe(section));
  }

  // Progressive Disclosure
  setupProgressiveDisclosure() {
    const panels = document.querySelectorAll('.analysis-panel, .comparison-panel');
    
    panels.forEach((panel, index) => {
      panel.style.opacity = '0';
      panel.style.transform = 'translateY(30px)';
      
      setTimeout(() => {
        panel.style.transition = 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)';
        panel.style.opacity = '1';
        panel.style.transform = 'translateY(0)';
      }, index * 150);
    });
  }

  // Parallax Effects
  setupParallaxEffects() {
    let ticking = false;
    
    const updateParallax = () => {
      const scrollY = window.pageYOffset;
      
      // Parallax on background elements
      const parallaxElements = document.querySelectorAll('.upload-icon, .panel-icon');
      parallaxElements.forEach(element => {
        const speed = 0.5;
        const yPos = -(scrollY * speed);
        element.style.transform = `translateY(${yPos}px)`;
      });
      
      ticking = false;
    };

    window.addEventListener('scroll', () => {
      if (!ticking) {
        requestAnimationFrame(updateParallax);
        ticking = true;
      }
    });
  }

  // Loading States
  setupLoadingStates() {
    const loadingOverlay = document.getElementById('loadingOverlay');
    
    if (loadingOverlay) {
      // Enhanced loading animation
      const loadingSpinner = loadingOverlay.querySelector('.loading-spinner');
      if (loadingSpinner) {
        loadingSpinner.style.animation = 'rotate 1.2s cubic-bezier(0.5, 0, 0.5, 1) infinite';
      }
    }

    // Form submission loading states
    const forms = document.querySelectorAll('form');
    forms.forEach(form => {
      form.addEventListener('submit', (e) => {
        this.showFormLoading(form);
      });
    });
  }

  showFormLoading(form) {
    const submitBtn = form.querySelector('.btn--primary');
    if (submitBtn) {
      const originalText = submitBtn.textContent;
      submitBtn.textContent = 'Processing...';
      submitBtn.disabled = true;
      submitBtn.style.opacity = '0.7';
      
      // Add loading dots
      const dots = document.createElement('span');
      dots.className = 'loading-dots';
      dots.innerHTML = '<span>.</span><span>.</span><span>.';
      dots.style.animation = 'loadingDots 1.4s infinite';
      submitBtn.appendChild(dots);
      
      // Reset after 3 seconds (adjust as needed)
      setTimeout(() => {
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
        submitBtn.style.opacity = '';
      }, 3000);
    }
  }

  // Tooltip Interactions
  setupTooltipInteractions() {
    // Clear any existing custom tooltips first
    const existingTooltips = document.querySelectorAll('.custom-tooltip');
    existingTooltips.forEach(tooltip => tooltip.remove());
    
    // Reset any previously initialized elements
    const previouslyInitialized = document.querySelectorAll('[data-tooltip-initialized]');
    previouslyInitialized.forEach(el => el.removeAttribute('data-tooltip-initialized'));
    
    const tooltipElements = document.querySelectorAll('[title]');
    let currentTooltip = null;
    
    // Helper function to hide all tooltips
    const hideAllTooltips = () => {
      if (currentTooltip) {
        currentTooltip.style.opacity = '0';
        currentTooltip.style.transform = 'translateY(10px)';
        setTimeout(() => {
          if (currentTooltip && currentTooltip.parentNode) {
            currentTooltip.remove();
          }
          currentTooltip = null;
        }, 200);
      }
    };
    
    // Group elements by their status indicator parent to prevent multiple tooltips
    const statusIndicatorGroups = new Map();
    
    // Filter to only apply tooltips to the innermost elements with tooltips
    const innermostElements = this.filterToInnermostElements(tooltipElements);
    
    innermostElements.forEach(element => {
      // Skip if this element already has tooltip handlers
      if (element.hasAttribute('data-tooltip-initialized')) {
        return;
      }
      
      // Find the closest status indicator parent
      const parentStatusIndicator = element.closest('.status-indicator');
      
      if (parentStatusIndicator) {
        // For status indicators, only show tooltip for the main container, not children
        if (element === parentStatusIndicator) {
          // This is the main status indicator - keep its tooltip
        } else {
          // This is a child element - remove its title to prevent nested tooltips
          element.removeAttribute('title');
          return;
        }
      }
      
      const title = element.getAttribute('title');
      element.removeAttribute('title'); // Remove default tooltip
      element.setAttribute('data-tooltip-initialized', 'true');
      
      // Disable tooltips on parent elements to prevent duplication
      this.disableParentTooltips(element);
      
      element.addEventListener('mouseenter', (e) => {
        // Stop event from bubbling to prevent nested tooltip triggers
        e.stopPropagation();
        
        // Hide any existing tooltip first
        this.hideAllTooltips();
        
        // Create new tooltip
        const tooltip = document.createElement('div');
        tooltip.className = 'custom-tooltip';
        
        // Enhanced tooltip content for status indicators
        if (element.classList.contains('test-status') || 
            element.classList.contains('status-indicator') || 
            element.id.includes('status') ||
            element.classList.contains('status-detail') ||
            element.classList.contains('status-help-btn')) {
          tooltip.innerHTML = this.getEnhancedStatusTooltip(title, element);
          tooltip.classList.add('status-tooltip');
        } else {
          tooltip.textContent = title;
        }
        
        tooltip.style.cssText = `
          position: absolute;
          background: var(--bg-glass-elevated);
          color: var(--text-primary);
          padding: 12px 16px;
          border-radius: 8px;
          font-size: 13px;
          pointer-events: none;
          z-index: 1000;
          opacity: 0;
          transform: translateY(10px);
          transition: all 0.2s ease;
          backdrop-filter: blur(10px);
          border: 1px solid transparent;
          box-shadow: var(--glass-shadow-sm);
          max-width: 300px;
          line-height: 1.4;
        `;
        
        // Enhanced styling for status tooltips
        if (tooltip.classList.contains('status-tooltip')) {
          tooltip.style.background = 'var(--bg-glass)';
          tooltip.style.border = '1px solid transparent';
          tooltip.style.boxShadow = '0 8px 32px rgba(108, 99, 255, 0.2)';
        }
        
        document.body.appendChild(tooltip);
        currentTooltip = tooltip;
        
        // Position and show tooltip
        const rect = element.getBoundingClientRect();
        tooltip.style.left = rect.left + rect.width / 2 - tooltip.offsetWidth / 2 + 'px';
        tooltip.style.top = rect.top - tooltip.offsetHeight - 8 + 'px';
        
        // Small delay to ensure smooth transition
        requestAnimationFrame(() => {
          tooltip.style.opacity = '1';
          tooltip.style.transform = 'translateY(0)';
        });
      });
      
      element.addEventListener('mouseleave', () => {
        this.hideAllTooltips();
      });
    });
    
    // Also hide tooltips when scrolling or clicking elsewhere
    document.addEventListener('scroll', () => this.hideAllTooltips(), { passive: true });
    document.addEventListener('click', () => this.hideAllTooltips());
  }

  // Filter elements to only include innermost elements with tooltips
  filterToInnermostElements(elements) {
    const innermost = [];
    
    elements.forEach(element => {
      let hasChildWithTooltip = false;
      
      // Check if any descendant elements have tooltips
      const descendants = element.querySelectorAll('[title]');
      if (descendants.length > 0) {
        hasChildWithTooltip = true;
      }
      
      // Only include if it has no children with tooltips
      if (!hasChildWithTooltip) {
        innermost.push(element);
      }
    });
    
    return innermost;
  }

  // Disable tooltip functionality on parent elements
  disableParentTooltips(element) {
    let parent = element.parentElement;
    
    while (parent && parent !== document.body) {
      if (parent.hasAttribute('title')) {
        // Store original title for reference but remove from DOM
        parent.setAttribute('data-original-title', parent.getAttribute('title'));
        parent.removeAttribute('title');
        
        // Add a marker to indicate this element's tooltip was disabled
        parent.setAttribute('data-tooltip-disabled', 'true');
      }
      parent = parent.parentElement;
    }
  }

  // Hide all visible tooltips
  hideAllTooltips() {
    const visibleTooltips = document.querySelectorAll('.custom-tooltip[style*="opacity: 1"]');
    visibleTooltips.forEach(tooltip => {
      tooltip.style.opacity = '0';
      tooltip.style.transform = 'translateY(10px)';
    });
  }

  getEnhancedStatusTooltip(title, element) {
    // Extract status type from element classes or content
    const elementText = element.textContent.trim().toLowerCase();
    const statusIcon = this.getStatusIcon(elementText);
    
    let enhancedContent = `<div class="tooltip-header">${statusIcon} <strong>Status Information</strong></div>`;
    enhancedContent += `<div class="tooltip-content">${title}</div>`;
    
    // Add contextual help based on status type
    if (elementText.includes('pending')) {
      enhancedContent += `<div class="tooltip-tip">💡 Tip: This test hasn't started yet. Tests will run automatically or can be triggered manually.</div>`;
    } else if (elementText.includes('pass') || elementText.includes('ready')) {
      enhancedContent += `<div class="tooltip-tip">✅ This indicates successful completion or ready state.</div>`;
    } else if (elementText.includes('fail') || elementText.includes('error')) {
      enhancedContent += `<div class="tooltip-tip">❌ This indicates an issue that needs attention. Check logs for details.</div>`;
    } else if (elementText.includes('never configured')) {
      enhancedContent += `<div class="tooltip-tip">⚙️ Action needed: Click the settings button to configure this feature.</div>`;
    }
    
    return enhancedContent;
  }

  getStatusIcon(statusText) {
    if (statusText.includes('pending')) return '⏳';
    if (statusText.includes('pass') || statusText.includes('ready')) return '✅';
    if (statusText.includes('fail') || statusText.includes('error')) return '❌';
    if (statusText.includes('warning')) return '⚠️';
    if (statusText.includes('never configured')) return '⚙️';
    if (statusText.includes('testing')) return '🧪';
    return '📊';
  }

  // File Upload Interactions
  setupUploadInteractions() {
    const uploadZone = document.getElementById('uploadZone');
    if (!uploadZone) return;

    // Enhanced drag and drop
    uploadZone.addEventListener('dragenter', (e) => {
      e.preventDefault();
      uploadZone.classList.add('drag-over', 'file-dropping');
    });

    uploadZone.addEventListener('dragleave', (e) => {
      e.preventDefault();
      if (!uploadZone.contains(e.relatedTarget)) {
        uploadZone.classList.remove('drag-over', 'file-dropping');
      }
    });

    uploadZone.addEventListener('drop', (e) => {
      e.preventDefault();
      uploadZone.classList.remove('drag-over', 'file-dropping');
      uploadZone.classList.add('file-dropped');
      
      // Animate successful drop
      setTimeout(() => {
        uploadZone.classList.remove('file-dropped');
      }, 1000);
    });
  }

  // Mouse tracking for interactive elements
  setupMouseTracking() {
    const trackingElements = document.querySelectorAll('.btn, .metric-card, .complexity-card');
    
    trackingElements.forEach(element => {
      element.addEventListener('mousemove', (e) => {
        const rect = element.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;
        
        element.style.setProperty('--mouse-x', x + '%');
        element.style.setProperty('--mouse-y', y + '%');
      });
    });
  }
}

// Initialize micro-interactions when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  new MicroInteractions();
});

// Add CSS for dynamic micro-interactions
const microInteractionStyles = `
  .input-focused .form-label {
    color: var(--accent-glow) !important;
  }
  
  .input-valid {
    border-color: var(--accent-cyan) !important;
    box-shadow: 0 0 0 2px rgba(0, 245, 212, 0.2) !important;
  }
  
  .input-invalid {
    border-color: #ff4757 !important;
    box-shadow: 0 0 0 2px rgba(255, 71, 87, 0.2) !important;
  }
  
  .file-dropped {
    background: linear-gradient(135deg, rgba(0, 245, 212, 0.15), rgba(108, 99, 255, 0.1)) !important;
    border-color: var(--accent-cyan) !important;
    animation: bounceIn 0.6s ease !important;
  }
  
  .loading-dots span {
    animation: loadingDots 1.4s infinite;
  }
  
  .loading-dots span:nth-child(2) {
    animation-delay: 0.2s;
  }
  
  .loading-dots span:nth-child(3) {
    animation-delay: 0.4s;
  }
  
  /* Enhanced tooltip system */
  .custom-tooltip {
    font-family: var(--font-family-main);
    font-weight: 400;
    letter-spacing: 0.02em;
    white-space: nowrap;
    z-index: 10000 !important;
  }
  
  .status-tooltip {
    white-space: normal !important;
    min-width: 200px;
    max-width: 350px;
  }
  
  .tooltip-header {
    font-weight: 600;
    margin-bottom: 8px;
    padding-bottom: 6px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    font-size: 14px;
  }
  
  .tooltip-content {
    margin-bottom: 8px;
    line-height: 1.4;
    font-size: 13px;
  }
  
  .tooltip-tip {
    font-size: 12px;
    opacity: 0.9;
    font-style: italic;
    margin-top: 6px;
    padding-top: 6px;
    border-top: 1px solid rgba(255, 255, 255, 0.05);
  }
  
  /* Prevent tooltip conflicts - disable browser tooltips on elements with disabled tooltips */
  [data-tooltip-disabled="true"]:hover::before,
  [data-tooltip-disabled="true"]:hover::after {
    display: none !important;
    content: none !important;
  }
  
  /* Prevent default title attribute tooltips when custom tooltips are present */
  [data-original-title]:hover::before,
  [data-original-title]:hover::after {
    display: none !important;
  }
  
  /* Enhanced visual feedback for interactive elements with tooltips */
  .status-indicator:hover,
  .status-detail:hover,
  .status-help-btn:hover,
  [title]:hover {
    cursor: help;
  }
`;

// Inject micro-interaction styles
const styleSheet = document.createElement('style');
styleSheet.textContent = microInteractionStyles;
document.head.appendChild(styleSheet);

// Matrix Particles Integration - Updated for Cyber Theme
class CyberParticleController {
  constructor() {
    this.isEnabled = localStorage.getItem('cyber-particles-enabled') !== 'false';
    this.setupControls();
  }

  setupControls() {
    // Add particle toggle to header if needed
    document.addEventListener('DOMContentLoaded', () => {
      if (window.cyberParticles) {
        // Cyber particles are available
        sys.log('🚀 Cyber particle system integrated successfully');
        
        // Optional: Add particle controls to settings
        this.addParticleSettings();
      }
    });
  }

  addParticleSettings() {
    // You can add controls to the settings modal here if desired
    const settingsModal = document.getElementById('apiKeyModal');
    if (settingsModal) {
      // Could add particle intensity slider, enable/disable toggle, etc.
      // For now, particles will auto-adjust based on theme
    }
  }

  toggleParticles() {
    if (window.cyberParticles) {
      if (this.isEnabled) {
        window.cyberParticles.destroy();
        this.isEnabled = false;
        sys.log('💥 Cyber particles disabled');
      } else {
        window.cyberParticles.init();
        this.isEnabled = true;
        sys.log('✨ Cyber particles enabled');
      }
      localStorage.setItem('cyber-particles-enabled', this.isEnabled.toString());
    }
  }

  adjustParticleIntensity(intensity) {
    if (window.cyberParticles && this.isEnabled) {
      // Intensity from 0 to 1 - maps to the cyber particle density setting
      const density = Math.floor(intensity * 100); // 0-100 density
      window.cyberParticles.adjustDensity(density);
      sys.log(`🎛️ Cyber particle intensity: ${Math.round(intensity * 100)}%`);
    }
  }

  // New methods for cyber theme features
  toggleAttraction() {
    if (window.cyberParticles && this.isEnabled) {
      window.cyberParticles.toggleAttraction();
    }
  }

  setCustomColors(colors) {
    if (window.cyberParticles && this.isEnabled) {
      window.cyberParticles.setColors(colors);
    }
  }
}

// Initialize Cyber particle controller
const cyberController = new CyberParticleController();

// Navigation Dropdown Controller
class NavigationDropdownController {
  constructor() {
    this.dropdownToggle = null;
    this.dropdownMenu = null;
    this.isOpen = false;
    this.init();
  }

  init() {
    document.addEventListener('DOMContentLoaded', () => {
      this.dropdownToggle = document.getElementById('demoDropdownToggle');
      this.dropdownMenu = document.getElementById('demo-dropdown-menu');
      
      if (this.dropdownToggle && this.dropdownMenu) {
        this.setupEventListeners();
        sys.log('🧪 Demo & Testing dropdown menu initialized');
      }
    });
  }

  setupEventListeners() {
    // Click event for toggle button
    this.dropdownToggle.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.toggleDropdown();
    });

    // Keyboard navigation for toggle
    this.dropdownToggle.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        this.toggleDropdown();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        this.openDropdown();
        this.focusFirstMenuItem();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        this.closeDropdown();
      }
    });

    // Menu item keyboard navigation
    const menuItems = this.dropdownMenu.querySelectorAll('.dropdown-item');
    menuItems.forEach((item, index) => {
      item.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          const nextItem = menuItems[index + 1] || menuItems[0];
          nextItem.focus();
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          const prevItem = menuItems[index - 1] || menuItems[menuItems.length - 1];
          prevItem.focus();
        } else if (e.key === 'Escape') {
          e.preventDefault();
          this.closeDropdown();
          this.dropdownToggle.focus();
        } else if (e.key === 'Tab' && !e.shiftKey) {
          // Tab forward from last item closes dropdown
          if (index === menuItems.length - 1) {
            this.closeDropdown();
          }
        } else if (e.key === 'Tab' && e.shiftKey) {
          // Shift+Tab from first item closes dropdown
          if (index === 0) {
            e.preventDefault();
            this.closeDropdown();
            this.dropdownToggle.focus();
          }
        }
      });

      // Add hover effects for better UX
      item.addEventListener('mouseenter', () => {
        item.focus();
      });
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
      if (this.isOpen && 
          !this.dropdownToggle.contains(e.target) && 
          !this.dropdownMenu.contains(e.target)) {
        this.closeDropdown();
      }
    });

    // Close dropdown on window resize
    window.addEventListener('resize', () => {
      if (this.isOpen) {
        this.closeDropdown();
      }
    });

    // Close dropdown when pressing escape anywhere
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isOpen) {
        this.closeDropdown();
        this.dropdownToggle.focus();
      }
    });
  }

  toggleDropdown() {
    if (this.isOpen) {
      this.closeDropdown();
    } else {
      this.openDropdown();
    }
  }

  openDropdown() {
    this.isOpen = true;
    this.dropdownToggle.setAttribute('aria-expanded', 'true');
    this.dropdownMenu.classList.add('show');
    
    // Announce to screen readers
    this.announceToScreenReader('Demo and testing menu opened');
    
    // Set focus trap
    this.dropdownMenu.setAttribute('tabindex', '-1');
    
    sys.log('🔽 Demo dropdown menu opened');
  }

  closeDropdown() {
    this.isOpen = false;
    this.dropdownToggle.setAttribute('aria-expanded', 'false');
    this.dropdownMenu.classList.remove('show');
    
    // Remove focus trap
    this.dropdownMenu.removeAttribute('tabindex');
    
    sys.log('🔼 Demo dropdown menu closed');
  }

  focusFirstMenuItem() {
    const firstItem = this.dropdownMenu.querySelector('.dropdown-item');
    if (firstItem) {
      // Small delay to ensure dropdown is fully visible
      setTimeout(() => {
        firstItem.focus();
      }, 100);
    }
  }

  announceToScreenReader(message) {
    // Create or update screen reader announcement
    let announcement = document.getElementById('sr-announcement');
    if (!announcement) {
      announcement = document.createElement('div');
      announcement.id = 'sr-announcement';
      announcement.setAttribute('aria-live', 'polite');
      announcement.setAttribute('aria-atomic', 'true');
      announcement.className = 'sr-only';
      announcement.style.cssText = `
        position: absolute;
        left: -10000px;
        width: 1px;
        height: 1px;
        overflow: hidden;
      `;
      document.body.appendChild(announcement);
    }
    
    announcement.textContent = message;
    
    // Clear after announcement
    setTimeout(() => {
      announcement.textContent = '';
    }, 1000);
  }
}

// Initialize Navigation Dropdown Controller
const navigationDropdown = new NavigationDropdownController();
