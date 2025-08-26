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
      this.staticLOC.textContent = String(s.loc);
      this.staticComplexity1.textContent = String(s.c1);
      this.staticComplexity2.textContent = String(s.c2);
      this.staticComplexity3.textContent = String(s.c3);
      if (this.staticTime) this.staticTime.textContent = `${ms.toFixed(1)} ms`;
    }

    async performAIAnalysis(code) {
      const provider = localStorage.getItem('cai_provider') || 'ollama';
      const apiKey = localStorage.getItem('cai_api_key') || '';
      const model = localStorage.getItem('selectedModel') || 'deepseek-coder:gpu-ultra';
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
      this.aiLOC.textContent = String(a.loc);
      this.aiComplexity1.textContent = String(a.c1);
      this.aiComplexity2.textContent = String(a.c2);
      this.aiComplexity3.textContent = String(a.c3);
      if (this.aiTime) this.aiTime.textContent = `${ms.toFixed(1)} ms`;
    }

    displayComparison(s, a) {
      const locDiff = (a.loc || 0) - (s.loc || 0);
      const cVar = (a.c1 || 0) - (s.c1 || 0);
      this.locDifference.textContent = String(locDiff);
      this.complexityVariance.textContent = String(cVar);
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
      if (s.c1 > 10) recs.push('Refactor to reduce cyclomatic complexity (extract functions, simplify branches).');
      if (s.nestingDepth > 4) recs.push('Reduce nesting depth by early returns or guard clauses.');
      if ((a.loc || 0) > (s.loc || 0) * 1.5) recs.push('AI indicates more testable LOC; review for dead code or hidden branches.');
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
    new CAnalyzerAIRef();
  });
})();
