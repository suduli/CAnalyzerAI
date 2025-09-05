# Copilot Coding Agent Instructions for CAnalyzerAI

## Project Overview
CAnalyzerAI is a web-based tool for analyzing C code complexity, featuring advanced particle systems, animation engines, accessibility (WCAG) compliance, and AI-powered chat/code analysis. The codebase is organized for clarity and maintainability, with logical separation of major components.

## Architecture & Key Components
- **Core Application**: Main logic in `app.js`, UI in `index.html`, styles in `style.css`. Entry point is `index.html`.
- **Particle Systems**: Located in `/particle-systems/`, e.g., `futuristic-particles.js`, `matrix-particles.js`. Each system has its own HTML demo and CSS.
- **Animation Engine**: `/animation-engine/` contains reusable animation logic and performance tools.
- **C Code Analysis**: `c-complexity-analyzer.html` and related JS handle file upload, AI prompt construction, and result display. Uses OpenRouter's Gemini 2.5 Flash model for analysis.
- **Chat Window**: `chat-window.js` implements an AI-powered chat, supporting OpenAI, OpenRouter, and local Ollama. Integrates with file upload and analysis context.
- **Accessibility**: `/wcag-accessibility/` and related CSS/HTML ensure WCAG 2.1 AA/AAA compliance, especially for upload and interactive sections.
- **Data Analysis**: `/data-analysis/` scripts for data discrepancy and display analysis.
- **Utilities**: Helper scripts in `/utilities/` (e.g., `cfg-calculator.js`, `organize_files.py`).
- **Documentation**: `/docs/guides/` for implementation details, `/docs/reports/README.md` for project structure.

## Developer Workflows
- **Run Application**: Open `index.html` in a browser (no build step required).
- **Analyze C Code**: Use `c-complexity-analyzer.html`, enter OpenRouter API key, upload `.c` file, click "Analyze".
- **Chat/AI**: Use chat window in-app; configure provider/API key via settings modal.
- **Test Particle/Animation Features**: Open corresponding HTML demo files in `/particle-systems/` or `/animation-engine/`.
- **Accessibility Validation**: Use `/wcag-accessibility/wcag-color-contrast-analyzer.html` and review ARIA/semantic patterns in upload sections.

## Project-Specific Patterns & Conventions
- **Strict JSON Output**: AI prompts require exact JSON format for metrics (see guides for prompt structure).
- **Contextual AI**: Chat and analysis integrate file content and metrics automatically.
- **Glassmorphic/Modern UI**: Consistent use of glassmorphic and particle effects; see `style.css` and related theme files.
- **Accessibility**: Semantic HTML, ARIA attributes, keyboard navigation, high-contrast/focus indicators, and screen reader support are mandatory for new UI features.
- **Error Handling**: All user-facing errors are announced via ARIA live regions and visible alerts.
- **No Build Tools**: Pure HTML/CSS/JS; no npm, bundlers, or transpilers.
- **API Keys**: Stored only in memory, never persisted.

## Integration Points
- **OpenRouter API**: Used for code complexity analysis and chat; see guides for endpoint/model details.
- **AI Providers**: Chat supports OpenAI, OpenRouter, and Ollama (local); switchable via settings.
- **Accessibility Testing**: Use axe-core, WAVE, Lighthouse, and manual screen reader checks.

## Examples
- **Add a new particle system**: Place JS/CSS/HTML in `/particle-systems/`, update demo HTML.
- **Extend chat shortcuts**: Modify shortcuts object in `chat-window.js`.
- **Implement new accessibility feature**: Follow ARIA/semantic patterns in upload section and WCAG guides.

## References
- See `/docs/guides/` for implementation details and prompt structures.
- `/docs/reports/README.md` for project structure and organization rationale.
- `/docs/guides/C_COMPLEXITY_ANALYZER_README.md` for analysis workflow and AI prompt format.
- `/docs/guides/CHAT_WINDOW_README.md` for chat integration and context handling.
- `/docs/guides/WCAG_UPLOAD_SECTION_IMPLEMENTATION.md` for accessibility patterns.

---

**If any section is unclear or missing, please provide feedback for further refinement.**
