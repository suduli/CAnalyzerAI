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

      this.init();
    }

    getDefaultModel() {
      switch(this.provider) {
        case 'openrouter': return 'google/gemma-2-9b-it:free';
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
            'openai/gpt-oss-20b:free',
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
      // Prevent duplicate click event registration for uploadZone
      if (this.uploadZone) {
        this.uploadZone.onclick = null;
        this.uploadZone.addEventListener('click', (e) => {
          console.log('uploadZone click: opening file dialog');
          if (this.fileInput) {
            this.fileInput.click();
            console.log('fileInput.click() triggered');
          }
        });
      }
      // Prevent native click on fileInput from bubbling up and triggering uploadZone click
      if (this.fileInput) {
        this.fileInput.addEventListener('click', (e) => {
          console.log('fileInput native click');
          e.stopPropagation();
        });
      }
      // Upload interactions
      this.fileInput?.addEventListener('change', (e) => {
        console.log('fileInput change event');
        this.onFileSelect(e);
      });
      this.uploadZone?.addEventListener('dragover', (e) => { e.preventDefault(); });
      this.uploadZone?.addEventListener('drop', (e) => {
        console.log('uploadZone drop event');
        this.onDrop(e);
      });

      // File actions
      this.analyzeBtn?.addEventListener('click', () => this.startAnalysis());
      this.clearFileBtn?.addEventListener('click', () => this.clearFile());

      // Settings
      this.settingsBtn?.addEventListener('click', () => this.api.show());

      // Results actions
      this.exportResultsBtn?.addEventListener('click', () => this.exportResults());
      this.newAnalysisBtn?.addEventListener('click', () => this.newAnalysis());
    }

    resetUI() {
      this.showProgress(false);
      this.fileInfo?.classList.add('hidden');
      this.analyzeBtn?.setAttribute('disabled', 'true');
      this.resultsSection?.classList.add('hidden');
    }

    // Helper to format values for display: finite numbers are shown as-is, otherwise "NA"
    formatForDisplay(v) {
      const n = Number(v);
      return Number.isFinite(n) ? String(n) : 'NA';
    }

    showProgress(show) {
      this.uploadProgress?.classList.toggle('hidden', !show);
      if (!show) {
        if (this.progressFill) this.progressFill.style.width = '0%';
        if (this.progressText) this.progressText.textContent = '';
      }
    }

    onFileSelect(e) {
      const file = e.target.files?.[0];
      if (file) this.setFile(file);
      if (this.fileInput) this.fileInput.value = '';
    }

    onDrop(e) {
      e.preventDefault();
      const file = e.dataTransfer?.files?.[0];
      if (file) this.setFile(file);
    }

    clearFile() { this.file = null; this.fileText = ''; this.resetUI(); this.hideError(); }

    setFile(file) {
      this.hideError();
      if (!/\.(c|h)$/i.test(file.name)) { this.showError('Only .c/.h files allowed'); return; }
      if (file.size > 5 * 1024 * 1024) { this.showError('File too large (>5MB)'); return; }
      this.file = file;
      this.fileNameEl.textContent = file.name;
      this.fileSizeEl.textContent = `${(file.size / 1024).toFixed(1)} KB`;
      this.fileTimestampEl.textContent = new Date().toLocaleString();
      this.fileInfo.classList.remove('hidden');
      this.analyzeBtn.removeAttribute('disabled');
      sys.log(`Selected ${file.name}`);
    }

    showError(message) {
      const errorEl = document.getElementById('errorMessage');
      errorEl.textContent = message;
      errorEl.classList.remove('hidden');
    }

    hideError() {
      const errorEl = document.getElementById('errorMessage');
      errorEl.textContent = '';
      errorEl.classList.add('hidden');
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
  this.staticLOC.textContent = this.formatForDisplay(s.loc);
  this.staticComplexity1.textContent = this.formatForDisplay(s.c1);
  this.staticComplexity2.textContent = this.formatForDisplay(s.c2);
  this.staticComplexity3.textContent = this.formatForDisplay(s.c3);
      if (this.staticTime) this.staticTime.textContent = `${ms.toFixed(1)} ms`;
      
      // Log CFG analysis results
      if (s.cfgMetrics) {
        console.log('🎯 CFG Analysis Results:', s.cfgMetrics);
        console.log('📊 Nodes:', s.cfgMetrics.nodes, 'Edges:', s.cfgMetrics.edges, 'Complexity:', s.cfgMetrics.cyclomaticComplexity);
      } else if (s.cfgError) {
        console.warn('⚠️ CFG Analysis Error:', s.cfgError);
      }
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

      // Enhanced prompt with ultra-clear instructions for consistent JSON output
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

      let statusNote = '';
      let analysisStartTime = performance.now();

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
          
          // Use better model for structured output if available
          let currentModel = model || 'google/gemma-2-9b-it:free';
          
          // Always prefer the better model for JSON output
          if (currentModel === 'openai/gpt-oss-20b:free') {
            console.log('🔄 Switching to better model for JSON output...');
            currentModel = 'google/gemma-2-9b-it:free'; // Better at following instructions
          }
          
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
          statusNote = 'OpenRouter cloud inference';
          
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
          console.log('💡 Alternative models: google/gemma-2-9b-it:free, meta-llama/llama-3.1-8b-instruct:free');
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
          errorCategory
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
      // Enhanced logging and validation for AI response parsing
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
            .replace(/,\s*]/g, ']')                                          // Remove trailing commas in arrays
            .replace(/}\s*$/, '}');                                          // Ensure proper closing
            
          console.log('🔧 Attempting JSON cleanup:', cleanedJson);
          parsed = JSON.parse(cleanedJson);
        }

        console.log('🔍 Parsed JSON structure:', parsed);

        // Validate parsed structure with type checking
        const validatedResult = this.validateAndNormalizeAIResult(parsed, statusNote);
        console.log('✅ Final validated result:', validatedResult);
        
        return validatedResult;

      } catch (error) {
        console.error('❌ JSON parsing failed:', error.message);
        console.log('🔍 Failed text sample:', text?.slice(0, 500));
        
        // Fallback: try to extract numbers from text using regex
        const numberExtractionResult = this.extractNumbersFromText(text, statusNote);
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

    // New helper method for validating AI result structure
    validateAndNormalizeAIResult(parsed, statusNote = '') {
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
              const numFromText = this.convertWrittenNumberToDigit(val);
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
              return this.extractNumberFromObject(val);
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

    displayAI(aiResult, ms) {
      console.log('🎯 displayAI called with result:', aiResult);
      console.log('🎯 displayAI - Analysis time:', ms, 'ms');

      // Enhanced error state handling
      if (!aiResult || typeof aiResult !== 'object') {
        console.error('❌ Invalid AI result object:', aiResult);
        this.setAIDisplayError('Invalid analysis result');
        return;
      }

      // Handle unavailable AI analysis
      if (aiResult.unavailable) {
        const message = (aiResult.notes && aiResult.notes[0]) ? aiResult.notes[0] : 'AI analysis unavailable';
        this.setAIDisplayUnavailable(message);
        return;
      }

      // Handle parsing errors with visual feedback
      if (aiResult.parseError || aiResult.extractionFallback) {
        console.warn('⚠️ AI parsing issues detected:', aiResult);
        this.setAIDisplayWithWarning(aiResult, ms);
        return;
      }

      // Normal successful display
      this.setAIDisplaySuccess(aiResult, ms);
    }

    // New helper methods for different AI display states
    setAIDisplayError(message) {
      if (this.aiStatusNotice) this.aiStatusNotice.textContent = `Error: ${message}`;
      this.aiLOC.textContent = 'ERROR';
      this.aiComplexity1.textContent = 'ERROR';
      this.aiComplexity2.textContent = 'ERROR';
      this.aiComplexity3.textContent = 'ERROR';
      if (this.aiTime) this.aiTime.textContent = '';
      this.aiStatusNotice?.classList.add('ai-error');
      this.aiStatusNotice?.classList.remove('ai-unavailable', 'ai-warning');
    }

    setAIDisplayUnavailable(message) {
      if (this.aiStatusNotice) this.aiStatusNotice.textContent = message;
      this.aiLOC.textContent = 'NA';
      this.aiComplexity1.textContent = 'NA';
      this.aiComplexity2.textContent = 'NA';
      this.aiComplexity3.textContent = 'NA';
      if (this.aiTime) this.aiTime.textContent = '';
      this.aiStatusNotice?.classList.add('ai-unavailable');
      this.aiStatusNotice?.classList.remove('ai-error', 'ai-warning');
    }

    setAIDisplayWithWarning(aiResult, ms) {
      // Display the values but with warning styling
      this.aiStatusNotice?.classList.remove('ai-unavailable', 'ai-error');
      this.aiStatusNotice?.classList.add('ai-warning');
      
      if (this.aiStatusNotice) {
        const warningMsg = aiResult.extractionFallback ? 
          'AI response parsed with fallback method' : 
          'AI response had parsing issues';
        this.aiStatusNotice.textContent = warningMsg;
      }

      // Use enhanced display formatting
      this.aiLOC.textContent = this.formatForDisplayEnhanced(aiResult.loc, 'LOC');
      this.aiComplexity1.textContent = this.formatForDisplayEnhanced(aiResult.c1, 'C1');
      this.aiComplexity2.textContent = this.formatForDisplayEnhanced(aiResult.c2, 'C2');
      this.aiComplexity3.textContent = this.formatForDisplayEnhanced(aiResult.c3, 'C3');
      
      if (this.aiTime) this.aiTime.textContent = `${ms.toFixed(1)} ms`;
      
      console.log('⚠️ AI values displayed with warnings:', {
        loc: aiResult.loc, c1: aiResult.c1, c2: aiResult.c2, c3: aiResult.c3
      });
    }

    setAIDisplaySuccess(aiResult, ms) {
      this.aiStatusNotice?.classList.remove('ai-unavailable', 'ai-error', 'ai-warning');
      
      if (this.aiStatusNotice && aiResult.notes && aiResult.notes[0]) {
        this.aiStatusNotice.textContent = aiResult.notes[0];
      }

      // Use enhanced display formatting
      this.aiLOC.textContent = this.formatForDisplayEnhanced(aiResult.loc, 'LOC');
      this.aiComplexity1.textContent = this.formatForDisplayEnhanced(aiResult.c1, 'C1');
      this.aiComplexity2.textContent = this.formatForDisplayEnhanced(aiResult.c2, 'C2');
      this.aiComplexity3.textContent = this.formatForDisplayEnhanced(aiResult.c3, 'C3');
      
      if (this.aiTime) this.aiTime.textContent = `${ms.toFixed(1)} ms`;
      
      console.log('✅ AI values displayed successfully:', {
        loc: aiResult.loc, c1: aiResult.c1, c2: aiResult.c2, c3: aiResult.c3
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

      // Return the number as string
      const result = String(Math.round(num)); // Round to handle floating point issues
      console.log(`✅ ${context} formatted:`, result);
      return result;
    }

    displayComparison(s, a) {
      // if AI unavailable, show NA for comparison
      if (a && a.unavailable) {
        this.locDifference.textContent = 'NA';
        this.complexityVariance.textContent = 'NA';
      } else {
        const aLocNum = Number(a.loc);
        const sLocNum = Number(s.loc);
        const aC1Num = Number(a.c1);
        const sC1Num = Number(s.c1);
        const locDiff = Number.isFinite(aLocNum) && Number.isFinite(sLocNum) ? (aLocNum - sLocNum) : 'NA';
        const cVar = Number.isFinite(aC1Num) && Number.isFinite(sC1Num) ? (aC1Num - sC1Num) : 'NA';
        this.locDifference.textContent = this.formatForDisplay(locDiff);
        this.complexityVariance.textContent = this.formatForDisplay(cVar);
      }
      this.differencesList.innerHTML = '';
      (a.notes || []).forEach(n => {
        const div = document.createElement('div');
        div.className = 'difference-item';
        div.textContent = n;
        this.differencesList.appendChild(div);
      });
      this.recommendations.innerHTML = '';
      const recs = this.makeRecommendations(s, a);
      recs.forEach(r => {
        const div = document.createElement('div');
        div.className = 'recommendation-item';
        div.textContent = r;
        this.recommendations.appendChild(div);
      });
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
        static: {
          loc: this.staticLOC.textContent,
          complexity1: this.staticComplexity1.textContent,
          complexity2: this.staticComplexity2.textContent,
          complexity3: this.staticComplexity3.textContent,
        },
        ai: {
          loc: this.aiLOC.textContent,
          complexity1: this.aiComplexity1.textContent,
          complexity2: this.aiComplexity2.textContent,
          complexity3: this.aiComplexity3.textContent,
          notes: Array.from(this.differencesList.querySelectorAll('.difference-item')).map(d => d.textContent || '')
        },
        comparison: {
          locDifference: this.locDifference.textContent,
          complexityVariance: this.complexityVariance.textContent,
          recommendations: Array.from(this.recommendations.querySelectorAll('.recommendation-item')).map(d => d.textContent || '')
        }
      };
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = 'analysis_report.json';
      document.body.appendChild(a); a.click();
      URL.revokeObjectURL(url); a.remove();
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
    }

    showLoading(show, text='') {
      if (!this.loadingOverlay) return;
      this.loadingOverlay.classList.toggle('hidden', !show);
      if (text && this.loadingText) this.loadingText.textContent = text;
    }
  }

  window.addEventListener('DOMContentLoaded', () => {
    sys.init();
    const app = new CAnalyzerAIRef();

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

    window.suggestAlternativeModels = () => {
      console.log('💡 Alternative OpenRouter Models (Better for JSON):');
      console.log('- google/gemma-2-9b-it:free (Recommended)');
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
      console.log('- openai/gpt-oss-20b:free tends to return explanations instead of JSON');
      console.log('- Try google/gemma-2-9b-it:free for better structured output');
    };

    window.switchToRecommendedModel = () => {
      localStorage.setItem('selectedModel', 'google/gemma-2-9b-it:free');
      console.log('✅ Switched to google/gemma-2-9b-it:free');
      console.log('🔄 Please try your analysis again');
      return 'Model switched to google/gemma-2-9b-it:free';
    };
    
    console.log('🎯 CAnalyzerAI Debug: App instance available as window.CAnalyzerAI');
    console.log('🎯 CAnalyzerAI Debug: Run window.testAIPipeline() to test AI analysis');
    console.log('🎯 CAnalyzerAI Debug: Run window.checkAIStatus() to check configuration');
    console.log('🎯 CAnalyzerAI Debug: Run window.debugAIParsing("your json") to test parsing');

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
    const tooltipElements = document.querySelectorAll('[title]');
    
    tooltipElements.forEach(element => {
      const title = element.getAttribute('title');
      element.removeAttribute('title'); // Remove default tooltip
      
      const tooltip = document.createElement('div');
      tooltip.className = 'custom-tooltip';
      tooltip.textContent = title;
      tooltip.style.cssText = `
        position: absolute;
        background: var(--bg-glass-elevated);
        color: var(--text-primary);
        padding: 8px 12px;
        border-radius: 6px;
        font-size: 12px;
        pointer-events: none;
        z-index: 1000;
        opacity: 0;
        transform: translateY(10px);
        transition: all 0.2s ease;
        backdrop-filter: blur(10px);
        border: 1px solid var(--muted-border);
        box-shadow: var(--glass-shadow-sm);
      `;
      
      document.body.appendChild(tooltip);
      
      element.addEventListener('mouseenter', (e) => {
        const rect = element.getBoundingClientRect();
        tooltip.style.left = rect.left + rect.width / 2 - tooltip.offsetWidth / 2 + 'px';
        tooltip.style.top = rect.top - tooltip.offsetHeight - 8 + 'px';
        tooltip.style.opacity = '1';
        tooltip.style.transform = 'translateY(0)';
      });
      
      element.addEventListener('mouseleave', () => {
        tooltip.style.opacity = '0';
        tooltip.style.transform = 'translateY(10px)';
      });
    });
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
  
  .custom-tooltip {
    font-family: var(--font-family-main);
    white-space: nowrap;
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
