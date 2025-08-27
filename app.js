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
      this.model = localStorage.getItem('cai_model') || 'deepseek-r1 ';

      this.modelDropdown = document.getElementById('modelDropdown');
      this.selectedModel = localStorage.getItem('selectedModel') || 'deepseek-coder:gpu-ultra';

      this.init();
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
          const res = await fetch('https://openrouter.ai/api/v1/models', { headers: { Authorization: `Bearer ${key}` } });
          if (!res.ok) throw new Error(`OpenRouter HTTP ${res.status}`);
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
      try {
        const res = await fetch('http://localhost:11434/api/models');
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const models = await res.json();
        this.populateModelDropdown(models);
      } catch (err) {
        sys.error(`Failed to fetch models: ${err.message}`);
      }
    }

    populateModelDropdown(models) {
      if (!this.modelDropdown) return;
      this.modelDropdown.innerHTML = '';
      models.forEach((model) => {
        const option = document.createElement('option');
        option.value = model;
        option.textContent = model;
        this.modelDropdown.appendChild(option);
      });
      this.modelDropdown.value = this.selectedModel;
      this.modelDropdown.addEventListener('change', (e) => {
        this.selectedModel = e.target.value;
        localStorage.setItem('selectedModel', this.selectedModel);
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

    clearFile() { this.file = null; this.fileText = ''; this.resetUI(); }

    setFile(file) {
      if (!/\.(c|h)$/i.test(file.name)) { sys.error('Only .c/.h allowed'); return; }
      if (file.size > 5 * 1024 * 1024) { sys.error('File too large (>5MB)'); return; }
      this.file = file;
      this.fileNameEl.textContent = file.name;
      this.fileSizeEl.textContent = `${(file.size / 1024).toFixed(1)} KB`;
      this.fileTimestampEl.textContent = new Date().toLocaleString();
      this.fileInfo.classList.remove('hidden');
      this.analyzeBtn.removeAttribute('disabled');
      sys.log(`Selected ${file.name}`);
    }

    async startAnalysis() {
      if (!this.file) return;
      const provider = localStorage.getItem('cai_provider') || 'ollama';
      const model = localStorage.getItem('cai_model') || (provider==='ollama' ? 'deepseek-r1' : 'gpt-4o-mini');
      this.analysisApiStatus.textContent = provider.toUpperCase();
      this.analysisApiDetail.textContent = provider==='ollama' ? `Local model: ${model}` : `Model: ${model}`;
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

      return { loc, c1, c2, c3, decisionPoints, nestingDepth: maxDepth };
    }

    displayStatic(s, ms) {
  this.staticLOC.textContent = this.formatForDisplay(s.loc);
  this.staticComplexity1.textContent = this.formatForDisplay(s.c1);
  this.staticComplexity2.textContent = this.formatForDisplay(s.c2);
  this.staticComplexity3.textContent = this.formatForDisplay(s.c3);
      if (this.staticTime) this.staticTime.textContent = `${ms.toFixed(1)} ms`;
    }

    async performAIAnalysis(code) {
      const provider = localStorage.getItem('cai_provider') || 'ollama';
      const apiKey = localStorage.getItem('cai_api_key') || '';
      const model = localStorage.getItem('selectedModel') || 'deepseek-coder:gpu-ultra';

      // If provider requires an API key (OpenAI/OpenRouter) and it's missing/too short,
      // announce and return NA object to skip AI analysis (per user instruction).
      if ((provider === 'openai' || provider === 'openrouter') && (!apiKey || apiKey.length < 10)) {
        const note = 'No API key – AI analysis unavailable';
        if (this.aiStatusNotice) this.aiStatusNotice.textContent = note;
        return { loc: 'NA', c1: 'NA', c2: 'NA', c3: 'NA', notes: [note], unavailable: true };
      }

      const prompt = `Analyze this C code and return ONLY a compact JSON object with keys: loc (number), complexity1 (number), complexity2 (number), complexity3 (number), notes (string[]). Code:\n\n${code.slice(0, 16000)}`;
      let statusNote = '';
      try {
        if (provider === 'ollama') {
          const res = await fetch('http://localhost:11434/api/generate', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ model, prompt, stream: false })
          });
          if (!res.ok) throw new Error(`Ollama HTTP ${res.status}`);
          const data = await res.json();
          const txt = data.response || '';
          statusNote = 'Ollama local inference';
          return this.parseAIMetrics(txt, statusNote);
        }
        if (provider === 'openai') {
          const res = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
            body: JSON.stringify({ model, messages: [{ role: 'user', content: prompt }] })
          });
          if (!res.ok) throw new Error(`OpenAI HTTP ${res.status}`);
          const data = await res.json();
          const txt = data.choices?.[0]?.message?.content || '';
          statusNote = 'OpenAI cloud inference';
          return this.parseAIMetrics(txt, statusNote);
        }
        if (provider === 'openrouter') {
          const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
            body: JSON.stringify({ model: model || 'openrouter/auto', messages: [{ role: 'user', content: prompt }] })
          });
          if (!res.ok) throw new Error(`OpenRouter HTTP ${res.status}`);
          const data = await res.json();
          const txt = data.choices?.[0]?.message?.content || '';
          statusNote = 'OpenRouter cloud inference';
          return this.parseAIMetrics(txt, statusNote);
        }
        throw new Error('Unknown provider');
      } catch (err) {
        sys.error(err?.message || String(err));
        statusNote = 'AI unavailable; using static estimate';
        const s = this.performStaticAnalysis(code);
        return { loc: s.loc, c1: s.c1, c2: s.c2, c3: s.c3, notes: [statusNote] };
      } finally {
        if (this.aiStatusNotice) this.aiStatusNotice.textContent = statusNote;
      }
    }

    parseAIMetrics(text, statusNote='') {
      try {
        const match = text.match(/\{[\s\S]*\}/);
        const jsonStr = match ? match[0] : text;
        const parsed = JSON.parse(jsonStr);
        return {
          loc: Number(parsed.loc ?? 0),
          c1: Number(parsed.complexity1 ?? parsed.c1 ?? 0),
          c2: Number(parsed.complexity2 ?? parsed.c2 ?? 0),
          c3: Number(parsed.complexity3 ?? parsed.c3 ?? 0),
          notes: Array.isArray(parsed.notes) ? parsed.notes : (statusNote ? [statusNote] : [])
        };
      } catch (_e) {
        // If parsing fails, fallback to carrying the raw text as a note
        return { loc: 0, c1: 0, c2: 0, c3: 0, notes: text ? [text.slice(0, 200)] : (statusNote ? [statusNote] : []) };
      }
    }

    displayAI(a, ms) {
      // If AI marked unavailable, show a clear notice and set metrics to NA
      if (a && a.unavailable) {
        if (this.aiStatusNotice) this.aiStatusNotice.textContent = (a.notes && a.notes[0]) ? a.notes[0] : 'AI unavailable';
        this.aiLOC.textContent = 'NA';
        this.aiComplexity1.textContent = 'NA';
        this.aiComplexity2.textContent = 'NA';
        this.aiComplexity3.textContent = 'NA';
        if (this.aiTime) this.aiTime.textContent = '';
        // add an explicit visual flag
        this.aiStatusNotice?.classList.add('ai-unavailable');
        return;
      }

      this.aiStatusNotice?.classList.remove('ai-unavailable');
      this.aiLOC.textContent = this.formatForDisplay(a.loc);
      this.aiComplexity1.textContent = this.formatForDisplay(a.c1);
      this.aiComplexity2.textContent = this.formatForDisplay(a.c2);
      this.aiComplexity3.textContent = this.formatForDisplay(a.c3);
      if (this.aiTime) this.aiTime.textContent = `${ms.toFixed(1)} ms`;
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

    // Theme manager: align with reference implementation
    class ThemeManager {
      constructor() {
        // support both button ids (existing markup or reference)
        this.btn = document.getElementById('themeBtn') || document.getElementById('themeToggleBtn');
        this.menu = document.getElementById('themeMenu');
        this.options = Array.from(document.querySelectorAll('.theme-option'));
        // prefer the common key used by the reference repo, but fall back to previous key
        this.storageKey = 'color-scheme'; // values: 'dark' | 'light' | 'auto'
        this.legacyKey = 'cai_theme';
        this.current = localStorage.getItem(this.storageKey) || localStorage.getItem(this.legacyKey) || 'auto';
        this.mql = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)');
        this.init();
      }
      init() {
    this.apply(this.current, false);
    console.debug('[ThemeManager] init', { storageKey: this.storageKey, legacyKey: this.legacyKey, current: this.current });
        this.bind();
      }
      bind() {
        // Toggle menu when a menu button is present
        // Click: quick toggle dark/light. Shift+Click opens the full menu when present.
        this.btn?.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          const current = document.documentElement.getAttribute('data-color-scheme') || 'light';
          const next = current === 'dark' ? 'light' : 'dark';
          if (e.shiftKey && this.menu) {
            // open the menu instead of quick toggle
            const willHide = !this.menu.classList.contains('hidden');
            this.menu.classList.toggle('hidden');
            this.menu.setAttribute('aria-hidden', String(this.menu.classList.contains('hidden')));
            this.btn.setAttribute('aria-expanded', String(!this.menu.classList.contains('hidden')));
            if (!willHide) {
              const first = this.menu.querySelector('.theme-option');
              if (first) first.focus();
            }
            return;
          }
          // Quick toggle dark/light
          this.set(next);
        });

        // keyboard support for the button (Enter / Space)
        this.btn?.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            this.btn.click();
          }
        });

        // close menu on outside click (ignore clicks on the button/menu)
        document.addEventListener('click', (ev) => {
          if (!this.menu) return;
          const target = ev.target;
          if (this.menu.classList.contains('hidden')) return;
          if (target === this.btn || this.btn?.contains(target) || this.menu.contains(target)) return;
          this.menu.classList.add('hidden');
          this.menu.setAttribute('aria-hidden', 'true');
          this.btn?.setAttribute('aria-expanded', 'false');
        });

        // menu options: add click + keyboard support and ARIA roles
        this.options.forEach(opt => {
          opt.setAttribute('role', 'menuitem');
          opt.setAttribute('tabindex', '0');
          opt.addEventListener('click', (e) => {
            const t = opt.getAttribute('data-theme');
            this.set(t);
            if (this.menu) { this.menu.classList.add('hidden'); this.menu.setAttribute('aria-hidden', 'true'); }
            this.btn?.focus();
            this.btn?.setAttribute('aria-expanded', 'false');
          });
          opt.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              opt.click();
            }
          });
        });

        // Listen for system theme changes and update only when user preference is 'auto' or unset
        if (this.mql && typeof this.mql.addEventListener === 'function') {
          this.mql.addEventListener('change', (e) => { if (!localStorage.getItem(this.storageKey) || localStorage.getItem(this.storageKey) === 'auto') this.apply('auto'); });
        } else if (this.mql && typeof this.mql.addListener === 'function') {
          this.mql.addListener((e) => { if (!localStorage.getItem(this.storageKey) || localStorage.getItem(this.storageKey) === 'auto') this.apply('auto'); });
        }
      }
      set(theme) {
        // normalize
        const normalized = theme || 'auto';
        this.current = normalized;
        localStorage.setItem(this.storageKey, this.current);
        // keep legacy key in sync for older installs
        localStorage.setItem(this.legacyKey, this.current);
        this.apply(this.current);
        // announce to screen readers
        const announcer = document.createElement('div');
        announcer.setAttribute('aria-live', 'polite');
        announcer.className = 'sr-only';
        announcer.textContent = `Theme changed to ${this.current} mode`;
        document.body.appendChild(announcer);
        setTimeout(() => { document.body.removeChild(announcer); }, 2500);
      }
      apply(theme, persist = true) {
        let resolved = theme;
        let source = 'explicit';
        if (theme === 'auto') {
          source = 'system';
          const prefersDark = this.mql ? this.mql.matches : window.matchMedia('(prefers-color-scheme: dark)').matches;
          resolved = prefersDark ? 'dark' : 'light';
        }
        // set both attributes so either CSS strategy works
        document.documentElement.setAttribute('data-color-scheme', resolved);
        document.documentElement.setAttribute('data-theme', resolved);
        console.debug('[ThemeManager] apply', { requested: theme, resolved, source, storageValue: localStorage.getItem(this.storageKey), legacyValue: localStorage.getItem(this.legacyKey) });
        // update button icon if present (show opposite semantics like reference)
        if (this.btn) {
          const iconEl = this.btn.querySelector('.theme-toggle-icon');
          if (iconEl) {
            iconEl.innerHTML = resolved === 'dark' ? '☀️' : '🌙';
          } else {
            // fallback: set textContent
            this.btn.textContent = resolved === 'dark' ? '☀️' : '🌙';
          }
        }
        // highlight selection in menu based on the stored choice (dark/light/auto)
        this.options.forEach(o => o.classList.toggle('active', o.getAttribute('data-theme') === this.current));
        if (persist) localStorage.setItem(this.storageKey, this.current);
      }
      // helper to print diagnostic info
      debugNow() {
        console.info('[ThemeManager] debug', {
          storageKey: this.storageKey,
          stored: localStorage.getItem(this.storageKey),
          legacy: localStorage.getItem(this.legacyKey),
          htmlAttr_color: document.documentElement.getAttribute('data-color-scheme'),
          htmlAttr_theme: document.documentElement.getAttribute('data-theme'),
          prefersDark: this.mql ? this.mql.matches : window.matchMedia('(prefers-color-scheme: dark)').matches
        });
      }
    }

    window.themeManager = new ThemeManager();

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
  });
})();
