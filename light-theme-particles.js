/* Light theme particles initializer
	 - Loads particlesjs-config.json and initializes particles.js only when the effective theme is light.
	 - Listens to theme changes via the ThemeManager custom event 'themechange' and document attribute `data-theme`.
	 - Preserves existing dark theme behavior by not touching particles when theme is dark.
*/

(function() {
	'use strict';

	const CONFIG_URL = 'particlesjs-config.json';
	const CONTAINER_ID = 'light-particles-js';
	let config = null;
	let isInitialized = false;

	async function fetchConfig() {
		try {
			const res = await fetch(CONFIG_URL, { cache: 'no-cache' });
			if (!res.ok) throw new Error('Failed to load particle config');
			return await res.json();
		} catch (err) {
			console.warn('Light particles: could not load config', err);
			return null;
		}
	}

	function initParticles() {
		if (isInitialized) return;
		if (typeof particlesJS === 'undefined') {
			console.warn('Light particles: particles.js library not available');
			return;
		}

		if (!config) {
			console.warn('Light particles: missing config');
			return;
		}

		try {
			// Ensure container exists
			const container = document.getElementById(CONTAINER_ID);
			if (!container) {
				console.warn('Light particles: container not found:', CONTAINER_ID);
				return;
			}

			// Ensure pJSDom array is properly initialized
			if (!window.pJSDom) {
				window.pJSDom = [];
			}

			// Clear any existing particles in our container
			container.innerHTML = '';
			
			// Initialize particles.js with our config
			particlesJS(CONTAINER_ID, config);
			isInitialized = true;
			console.log('Light particles: initialized');
		} catch (err) {
			console.error('Light particles: initialization error', err);
		}
	}

	function destroyParticles() {
		try {
			// particles.js exposes pJSDom array; find instances attached to our container
			if (window.pJSDom && window.pJSDom.length) {
				for (let i = window.pJSDom.length - 1; i >= 0; i--) {
					const entry = window.pJSDom[i];
					if (entry && entry.pJS && entry.pJS.canvas && entry.pJS.canvas.el && entry.pJS.canvas.el.id === CONTAINER_ID) {
						if (typeof entry.pJS.fn?.particlesRefresh === 'function') {
							entry.pJS.fn.particlesRefresh();
						}
						// Try the recommended destroy pattern
						try { entry.pJS.fn.vendors.destroypJS(); } catch(e) {}
						window.pJSDom.splice(i, 1);
					}
				}
			}

			// Also remove canvas element if present
			const canvas = document.querySelector(`#${CONTAINER_ID} canvas`);
			if (canvas && canvas.parentNode) canvas.parentNode.removeChild(canvas);

			isInitialized = false;
			console.log('Light particles: destroyed');
		} catch (err) {
			console.warn('Light particles: error during destroy', err);
		}
	}

	function getEffectiveTheme() {
		// Document attribute set by ThemeManager: data-theme
		return document.documentElement.getAttribute('data-theme') || 'light';
	}

	function handleThemeChange(detail) {
		const effective = detail?.effectiveTheme || getEffectiveTheme();
		if (effective === 'light') {
			// Ensure config loaded
			if (config) initParticles();
			else fetchConfig().then(c => { config = c; if (config) initParticles(); });
		} else {
			// For dark or other themes, destroy light-theme particles
			destroyParticles();
		}
	}

	// Initialize on DOMContentLoaded
	document.addEventListener('DOMContentLoaded', async () => {
		// Preload config (non-blocking)
		config = await fetchConfig();

		// If themeManager exists, use it; otherwise rely on data-theme attribute
		if (window.themeManager) {
			const effective = window.themeManager.getEffectiveTheme();
			if (effective === 'light') initParticles();

			// Listen for custom themechange events
			window.addEventListener('themechange', (e) => {
				try { handleThemeChange(e.detail); } catch (err) { console.warn(err); }
			});
		} else {
			// No theme manager yet; check document attribute
			const effective = getEffectiveTheme();
			if (effective === 'light') initParticles();

			// Observe changes to data-theme attribute
			const obs = new MutationObserver((mutations) => {
				for (const m of mutations) {
					if (m.attributeName === 'data-theme') {
						// Add small delay to avoid race conditions with matrix particles
						setTimeout(() => {
							const newTheme = getEffectiveTheme();
							if (newTheme === 'light') initParticles(); else destroyParticles();
						}, 50);
					}
				}
			});
			obs.observe(document.documentElement, { attributes: true });
		}
	});

})();

