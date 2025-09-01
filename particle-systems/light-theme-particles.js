/* Light theme particles initializer
	 - Loads particlesjs-config.json and initializes particles.js only when the effective theme is light.
	 - Listens to theme changes via the ThemeManager custom event 'themechange' and document attribute `data-theme`.
	 - Preserves existing dark theme behavior by not touching particles when theme is dark.
*/

(function() {
	'use strict';

	// Try multiple locations for the particles config; last resort uses an embedded default
	const CONFIG_CANDIDATES = [
		'tests/data/particlesjs-config.json',      // tests data (relative to page root)
		'/tests/data/particlesjs-config.json',     // tests data (absolute)
		'particlesjs-config.json',                 // alongside the HTML file
		'/particlesjs-config.json'                 // site root
	];
	const CONTAINER_ID = 'light-particles-js';
	let config = null;
	let isInitialized = false;

	async function fetchConfig() {
		// Attempt each candidate path until one succeeds
		for (const url of CONFIG_CANDIDATES) {
			try {
				const res = await fetch(url, { cache: 'no-cache' });
				if (!res.ok) throw new Error(`HTTP ${res.status}`);
				const json = await res.json();
				console.log(`Light particles: loaded config from ${url}`);
				return json;
			} catch (e) {
				console.debug(`Light particles: config not found at ${url}`);
			}
		}

		// Embedded default (safe, light-friendly config)
		console.warn('Light particles: falling back to embedded default config');
		return {
			particles: {
				number: { value: 60, density: { enable: true, value_area: 900 } },
				color: { value: '#1e3eaa' },
				shape: { type: 'circle', stroke: { width: 0, color: '#000000' }, polygon: { nb_sides: 5 } },
				opacity: { value: 0.6, random: true, anim: { enable: false, speed: 1, opacity_min: 0.1, sync: false } },
				size: { value: 3, random: true, anim: { enable: false, speed: 40, size_min: 0.1, sync: false } },
				line_linked: { enable: true, distance: 180, color: '#1e3eaa', opacity: 0.3, width: 1 },
				move: { enable: true, speed: 2.2, direction: 'none', random: true, straight: false, out_mode: 'out', bounce: false,
					attract: { enable: false, rotateX: 600, rotateY: 1200 } }
			},
			interactivity: {
				detect_on: 'canvas',
				events: { onhover: { enable: true, mode: 'repulse' }, onclick: { enable: true, mode: 'push' }, resize: true },
				modes: {
					grab: { distance: 400, line_linked: { opacity: 1 } },
					bubble: { distance: 300, size: 4, duration: 2, opacity: 0.8, speed: 3 },
					repulse: { distance: 140, duration: 0.4 },
					push: { particles_nb: 4 },
					remove: { particles_nb: 2 }
				}
			},
			retina_detect: true
		};
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

