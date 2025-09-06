// CAnalyzerAI — MISRA C:2012 subset analysis integrated into Index.html
// - Heuristic, client-side checks for quick feedback (educational/demo).
// - Hooks into existing upload and Analyze flows.
// - No network use unless "Explain Findings" is clicked with an OpenRouter API key.

(function () {
  const SEL = {
    resultsSection: '#resultsSection',
    uploadZone: '#uploadZone',
    analyzeBtn: '#analyzeBtn',
    fileInput: '#fileInput',
  };

  const state = {
    file: null,
    code: '',
    findings: [],
  };

  const RULES = [
    {
      id: 'MISRA-C-2012-Rule-14.4',
      title: 'The goto statement shall not be used',
      severity: 'required',
      check: (code) => findRegexOnLines(code, /\bgoto\s+[A-Za-z_]\w*\s*;/g)
        .map(x => ({ line: x.line, message: 'goto used', evidence: x.text.trim() }))
    },
    {
      id: 'MISRA-C-2012-Rule-17.2',
      title: 'Recursion shall not be used',
      severity: 'required',
      check: (code) => {
        const fns = parseFunctions(code);
        const out = [];
        for (const fn of fns) {
          const callRe = new RegExp(`\\b${escapeRegex(fn.name)}\\s*\\(`);
          if (callRe.test(fn.body)) {
            out.push({
              line: fn.startLine,
              message: `Function "${fn.name}" appears to call itself (recursion)`,
              evidence: firstMatchLine(fn.body, callRe)
            });
          }
        }
        return out;
      }
    },
    {
      id: 'MISRA-C-2012-Rule-15.3',
      title: 'All switch statements shall be complete (include a default)',
      severity: 'required',
      check: (code) => {
        const switches = parseSwitches(code);
        return switches.filter(sw => !sw.hasDefault).map(sw => ({
          line: sw.startLine,
          message: 'switch statement has no default clause',
          evidence: 'Missing "default:"'
        }));
      }
    },
    {
      id: 'MISRA-C-2012-Rule-15.4',
      title: 'The default clause should be the last clause in a switch statement',
      severity: 'advisory',
      check: (code) => {
        const switches = parseSwitches(code);
        const out = [];
        for (const sw of switches) {
          if (!sw.hasDefault) continue;
          const lastLabel = sw.labels[sw.labels.length - 1];
          if (lastLabel && lastLabel.type !== 'default') {
            out.push({
              line: sw.startLine,
              message: 'default clause does not appear last in switch',
              evidence: 'default is followed by other case labels'
            });
          }
        }
        return out;
      }
    },
    {
      id: 'MISRA-C-2012-Rule-15.5',
      title: 'A function should have a single point of exit',
      severity: 'advisory',
      check: (code) => {
        const fns = parseFunctions(code);
        const out = [];
        for (const fn of fns) {
          const returns = (fn.body.match(/\breturn\b/g) || []).length;
          if (returns > 1) {
            out.push({
              line: fn.startLine,
              message: `Function "${fn.name}" has ${returns} return statements`,
              evidence: 'Multiple returns'
            });
          }
        }
        return out;
      }
    },
    {
      id: 'MISRA-C-2012-Rule-21.3',
      title: 'The memory allocation and deallocation functions of <stdlib.h> shall not be used',
      severity: 'required',
      check: (code) => findRegexOnLines(code, /\b(malloc|calloc|realloc|free)\s*\(/g, (m) => m[1])
        .map(x => ({ line: x.line, message: `Dynamic memory function "${x.matchVal}" used`, evidence: x.text.trim() }))
    },
    {
      id: 'MISRA-C-2012-Rule-21.4',
      title: 'The macro/typedef identifiers setjmp and longjmp shall not be used',
      severity: 'required',
      check: (code) => findRegexOnLines(code, /\b(setjmp|longjmp)\s*\(/g, (m) => m[1])
        .map(x => ({ line: x.line, message: `"${x.matchVal}" used`, evidence: x.text.trim() }))
    }
  ];

  function init() {
    document.addEventListener('DOMContentLoaded', () => {
      ensureUI();
      hookUploadMirroring();
      hookAnalyze();
      hookExplain();
    });
    if (document.readyState === 'interactive' || document.readyState === 'complete') {
      ensureUI();
      hookUploadMirroring();
      hookAnalyze();
      hookExplain();
    }
  }

  // Inject MISRA panel inside existing Results section
  function ensureUI() {
    if (document.getElementById('misraIndexContainer')) return;

    const host = document.querySelector(SEL.resultsSection) || document.body;
    const container = document.createElement('div');
    container.id = 'misraIndexContainer';
    container.style.marginTop = '16px';
    container.innerHTML = `
      <div class="panel" style="border:1px solid var(--muted-border, #27305a); border-radius:12px; padding:16px; background:rgba(14,18,42,0.5);">
        <div class="panel-header" style="display:flex; justify-content:space-between; align-items:baseline; flex-wrap:wrap; gap:8px;">
          <h3 class="panel-title"><span class="panel-icon">🛡️</span> MISRA C:2012 Analysis (subset)</h3>
          <div style="display:flex; gap:8px; align-items:center;">
            <input id="misraApiKey" type="password" placeholder="OpenRouter API key (optional)" style="max-width:260px; padding:6px 10px; border-radius:8px; border:1px solid #3a4477; background:#0e1430; color:#e7ecff;" />
            <button id="misraExplainBtn" class="btn btn--outline btn--sm" title="Explain findings with AI" disabled><span class="btn-icon">✨</span>Explain Findings</button>
          </div>
        </div>
        <div id="misraStatus" class="ai-status-notice" style="margin-top:8px;"></div>
        <div id="misraViolations" style="display:grid; gap:8px; margin-top:12px;"></div>

        <div style="display:flex; gap:8px; margin-top:12px; flex-wrap:wrap;">
          <button id="misraExportBtn" class="btn btn--outline btn--sm" title="Download MISRA results as JSON"><span class="btn-icon">💾</span>Export MISRA JSON</button>
          <span class="muted" style="font-size:12px; color:#a8b0d8;">Heuristic client-side checks. For audit-grade MISRA Compliance:2016, back this UI with a Clang-based service.</span>
        </div>

        <h4 style="margin:16px 0 8px 0;">Coverage Matrix (demo subset)</h4>
        <table style="width:100%; border-collapse:collapse; font-size:14px;">
          <thead>
            <tr><th style="text-align:left; padding:6px; border-bottom:1px solid #27305a;">Rule</th>
                <th style="text-align:left; padding:6px; border-bottom:1px solid #27305a;">Title</th>
                <th style="text-align:left; padding:6px; border-bottom:1px solid #27305a;">Severity</th>
                <th style="text-align:left; padding:6px; border-bottom:1px solid #27305a;">Checked</th>
                <th style="text-align:left; padding:6px; border-bottom:1px solid #27305a;">Notes</th></tr>
          </thead>
          <tbody id="misraCoverage"></tbody>
        </table>
      </div>
    `;

    host.appendChild(container);

    // Render coverage matrix
    const tbody = container.querySelector('#misraCoverage');
    for (const r of RULES) {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td style="padding:6px; border-bottom:1px solid #27305a;"><code>${r.id}</code></td>
        <td style="padding:6px; border-bottom:1px solid #27305a;">${escapeHTML(r.title)}</td>
        <td style="padding:6px; border-bottom:1px solid #27305a;">${r.severity}</td>
        <td style="padding:6px; border-bottom:1px solid #27305a;">✅</td>
        <td style="padding:6px; border-bottom:1px solid #27305a;">Heuristic</td>
      `;
      tbody.appendChild(tr);
    }

    // Export JSON
    container.querySelector('#misraExportBtn').addEventListener('click', () => {
      const blob = new Blob([JSON.stringify(state.findings || [], null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'misra-results.json';
      a.click();
      URL.revokeObjectURL(url);
    });
  }

  // Mirror file selection to read code locally
  function hookUploadMirroring() {
    const input = document.querySelector(SEL.fileInput);
    if (input && !input.dataset.misraHooked) {
      input.dataset.misraHooked = '1';
      input.addEventListener('change', (e) => {
        const file = e.target.files && e.target.files[0];
        if (file) readFile(file);
      });
    }
    const zone = document.querySelector(SEL.uploadZone);
    if (zone && !zone.dataset.misraDropHooked) {
      zone.dataset.misraDropHooked = '1';
      zone.addEventListener('drop', (e) => {
        const file = e.dataTransfer?.files?.[0];
        if (file) readFile(file);
      });
    }
  }

  // Run MISRA checks when Analyze is clicked (alongside existing logic)
  function hookAnalyze() {
    const btn = document.querySelector(SEL.analyzeBtn);
    if (!btn || btn.dataset.misraHooked === '1') return;
    btn.dataset.misraHooked = '1';

    btn.addEventListener('click', () => {
      if (!state.code) {
        setStatus('Please upload a .c file before analyzing.');
        return;
      }
      setStatus('Running MISRA checks…');
      try {
        const findings = runChecks(state.code);
        state.findings = findings;
        renderFindings(findings, state.code);
        setStatus(`MISRA findings: ${findings.length}`);
        const exp = document.getElementById('misraExplainBtn');
        if (exp) exp.disabled = findings.length === 0;
      } catch (e) {
        console.error(e);
        setStatus(`Error: ${e.message}`);
      }
    });
  }

  // Optional AI explanations via OpenRouter
  function hookExplain() {
    const btn = document.getElementById('misraExplainBtn');
    if (!btn || btn.dataset.misraExplainHooked === '1') return;
    btn.dataset.misraExplainHooked = '1';
    btn.addEventListener('click', async () => {
      const key = document.getElementById('misraApiKey')?.value?.trim();
      if (!key) {
        alert('Enter your OpenRouter API key to request AI explanations.');
        return;
      }
      if (!state.findings?.length) {
        alert('No findings to explain.');
        return;
      }
      setStatus('Requesting AI explanations…');
      try {
        const ai = await aiExplain(key, state.code, state.findings);
        renderAI(ai);
        setStatus('AI explanations added');
      } catch (e) {
        console.error(e);
        setStatus(`AI error: ${e.message}`);
        alert(`AI explanation failed: ${e.message}`);
      }
    });
  }

  // File reading
  function readFile(file) {
    state.file = file;
    if (!/\.c$/i.test(file.name)) {
      setStatus('Please select a .c file');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setStatus('File too large (max 5 MB)');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      state.code = e.target?.result || '';
      setStatus(`Loaded ${file.name} (${bytes(file.size)})`);
    };
    reader.readAsText(file);
  }

  // Render findings inline
  function renderFindings(violations, code) {
    const container = document.getElementById('misraViolations');
    if (!container) return;
    container.innerHTML = '';

    if (!violations.length) {
      container.innerHTML = `<div class="notice" style="color:#51d48a;">No issues detected by subset checks.</div>`;
      return;
    }

    // Group by rule
    const byRule = {};
    for (const v of violations) {
      (byRule[v.rule_id] ||= { meta: v.meta, items: [] }).items.push(v);
    }

    for (const [rule, group] of Object.entries(byRule)) {
      const card = document.createElement('div');
      card.className = 'result-card';
      card.style.border = '1px solid #27305a';
      card.style.borderRadius = '10px';
      card.style.padding = '10px';
      card.innerHTML = `
        <div style="display:flex; gap:8px; align-items:center; flex-wrap:wrap;">
          <span style="background:#1a2142; border:1px solid #27305a; padding:4px 8px; border-radius:999px; color:#a8b0d8; font-size:12px;"><code>${rule}</code></span>
          <strong>${escapeHTML(group.meta.title)}</strong>
          <span style="padding:2px 8px; border-radius:6px; border:1px solid #27305a; font-size:12px; color:${group.meta.severity==='required' ? '#fbd674' : '#7ce3af'};">${group.meta.severity}</span>
        </div>
        <div class="list" style="margin-top:6px;"></div>
        <div class="ai" style="display:none; background:#0b1d1c; border:1px solid #1f3f3d; color:#9cf0d8; border-radius:8px; padding:8px; margin-top:8px;"></div>
      `;
      const list = card.querySelector('.list');
      for (const it of group.items.sort((a,b)=>(a.line||0)-(b.line||0))) {
        const row = document.createElement('div');
        row.style.padding = '6px 8px';
        row.style.border = '1px dashed #27305a';
        row.style.borderRadius = '8px';
        row.style.marginTop = '6px';
        row.innerHTML = `
          <div><span style="color:#a8b0d8; font-size:12px;">Line ${it.line ?? 'n/a'}</span> — ${escapeHTML(it.message)}</div>
          <pre style="margin:6px 0 0 0; background:#0c1429; color:#dbe4ff; padding:8px; border-radius:8px; overflow:auto; max-height:140px;">${escapeHTML(snippetAt(code, it.line))}</pre>
        `;
        list.appendChild(row);
      }
      container.appendChild(card);
    }
  }

  function renderAI(ai) {
    const container = document.getElementById('misraViolations');
    if (!container) return;
    const status = document.getElementById('misraStatus');
    if (ai.summary && status) {
      status.innerHTML = `<div style="color:#7cf3d8">${escapeHTML(ai.summary)}</div>`;
    }
    for (const card of container.querySelectorAll('.result-card')) {
      const rule = card.querySelector('code')?.textContent;
      const match = (ai.per_rule || []).find(x => x.rule_id === rule);
      if (!match) continue;
      const aiBox = card.querySelector('.ai');
      const why = (match.why || []).map(b => `<li>${escapeHTML(b)}</li>`).join('');
      const how = (match.how || []).map(b => `<li>${escapeHTML(b)}</li>`).join('');
      aiBox.style.display = 'block';
      aiBox.innerHTML = `
        <div style="font-weight:600; margin-bottom:4px;">AI insight</div>
        ${why ? `<div style="color:#a8b0d8">Why it matters:</div><ul>${why}</ul>` : ''}
        ${how ? `<div style="color:#a8b0d8">How to fix:</div><ul>${how}</ul>` : ''}
      `;
    }
  }

  // Checking engine
  function runChecks(code) {
    const out = [];
    for (const r of RULES) {
      const items = safe(() => r.check(code), []);
      for (const it of items) {
        out.push({
          rule_id: r.id,
          meta: { title: r.title, severity: r.severity },
          line: it.line ?? null,
          message: it.message || r.title,
          evidence: it.evidence || ''
        });
      }
    }
    return out.sort((a,b)=>(a.line||0)-(b.line||0));
  }

  // AI via OpenRouter (optional)
  async function aiExplain(apiKey, code, violations) {
    const grouped = groupBy(violations, v => v.rule_id);
    const brief = Object.entries(grouped).map(([rule, items]) => ({
      rule, count: items.length, examples: items.slice(0, 3)
    }));

    const sys = 'You are an expert MISRA C reviewer. Provide concise, actionable explanations and fixes. Keep responses short.';
    const user = [
      'Analyze the following MISRA findings from a C file and provide:',
      '- A brief global summary (2-3 lines).',
      '- For each rule: why it matters and how to fix, in 2-4 bullet points.',
      'Return JSON with keys: summary (string), per_rule (array of {rule_id, why, how}).',
      '',
      'Findings:',
      JSON.stringify(brief, null, 2),
      '',
      'Code (trimmed to first 400 lines):',
      code.split(/\r?\n/).slice(0, 400).join('\n')
    ].join('\n');

    const resp = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        response_format: { type: 'json_object' },
        messages: [{ role: 'system', content: sys }, { role: 'user', content: user }]
      })
    });
    if (!resp.ok) {
      const text = await resp.text().catch(()=>'');
      throw new Error(`OpenRouter request failed (${resp.status}): ${text.slice(0, 200)}`);
    }
    const data = await resp.json();
    const content = data?.choices?.[0]?.message?.content || '{}';
    try { return JSON.parse(content); } catch { return { summary: content, per_rule: [] }; }
  }

  // Utilities
  function bytes(n){ if(n<1024)return`${n} B`; if(n<1048576)return`${(n/1024).toFixed(1)} KB`; return`${(n/1048576).toFixed(2)} MB`; }
  function setStatus(msg){ const el=document.getElementById('misraStatus'); if(el) el.textContent=msg; }
  function safe(fn,fb){ try{return fn()}catch{return fb} }
  function escapeHTML(s){ return (s||'').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c])) }
  function escapeRegex(s){ return s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&') }
  function groupBy(arr,k){ const m={}; for(const it of arr){ (m[k(it)] ||= []).push(it); } return m; }

  function findRegexOnLines(code, regex, pick) {
    const out = []; const lines = code.split(/\r?\n/);
    for (let i=0;i<lines.length;i++){ regex.lastIndex=0; let m; while((m=regex.exec(lines[i]))){ out.push({line:i+1,text:lines[i],matchVal:pick?pick(m):(m[0]||'')}); } }
    return out;
  }

  function parseFunctions(code) {
    const out = [];
    const re = /(^|\n)\s*(?:[A-Za-z_][\w\s\*\(\)]*?\s+)?([A-Za-z_]\w*)\s*\(([^;{}()]|\([^)]*\))*\)\s*\{/g;
    let m;
    while ((m = re.exec(code)) !== null) {
      const startIdx = m.index + (m[1] ? m[1].length : 0);
      const startLine = 1 + code.slice(0, startIdx).split(/\r?\n/).length - 1;
      const name = m[2];
      const bodyInfo = extractBalanced(code, re.lastIndex - 1);
      if (!bodyInfo) continue;
      const body = code.slice(re.lastIndex, bodyInfo.endIdx - 1);
      out.push({ name, startLine, body });
    }
    return out;
  }

  function parseSwitches(code) {
    const out = [];
    const swRe = /(^|\n)\s*switch\s*\([^)]*\)\s*\{/g;
    let m;
    while ((m = swRe.exec(code)) !== null) {
      const startIdx = m.index + (m[1] ? m[1].length : 0);
      const startLine = 1 + code.slice(0, startIdx).split(/\r?\n/).length - 1;
      const block = extractBalanced(code, swRe.lastIndex - 1);
      if (!block) continue;
      const body = code.slice(swRe.lastIndex, block.endIdx - 1);
      const labels = [];
      const lblRe = /^\s*(case\b[^:]*|default)\s*:/gm;
      let lm; let hasDefault = false;
      while ((lm = lblRe.exec(body)) !== null) {
        const labelText = lm[1];
        const isDefault = /^default\b/.test(labelText);
        labels.push({ type: isDefault ? 'default' : 'case' });
        if (isDefault) hasDefault = true;
      }
      out.push({ startLine, hasDefault, labels });
    }
    return out;
  }

  function extractBalanced(text, openBraceIdx) {
    if (text[openBraceIdx] !== '{') return null;
    let depth = 0;
    for (let i = openBraceIdx; i < text.length; i++) {
      const ch = text[i];
      if (ch === '{') depth++;
      else if (ch === '}') { depth--; if (depth === 0) return { endIdx: i + 1 }; }
    }
    return null;
  }

  function firstMatchLine(text, re) {
    re.lastIndex = 0;
    const lines = text.split(/\r?\n/);
    for (let i=0;i<lines.length;i++){ if (re.test(lines[i])) return i+1; }
    return null;
  }

  function snippetAt(code, line, context=2) {
    if (!line) return '';
    const lines = code.split(/\r?\n/);
    const start = Math.max(0, line - 1 - context);
    const end = Math.min(lines.length, line - 1 + context + 1);
    return lines.slice(start, end).map((l, idx) => {
      const ln = start + idx + 1; const marker = ln === line ? '>' : ' ';
      return `${marker} ${String(ln).padStart(4, ' ')} | ${l}`;
    }).join('\n');
  }

  // Kick off
  init();
})();