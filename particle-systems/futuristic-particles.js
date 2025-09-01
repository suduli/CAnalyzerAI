/**
 * Futuristic Particle System Implementation
 * Advanced particle system with real-time controls, performance optimization,
 * and responsive design for modern web applications.
 */

class FuturisticParticleSystem {
    constructor() {
        this.isInitialized = false;
        this.currentTheme = 'cyber';
        this.isLightMode = false;
        this.useCustomColors = false;
        this.customColors = {
            particles: ['#00f5d4', '#6c63ff', '#ff006e'],
            connections: '#00f5d4'
        };
        this.particleConfig = this.getDefaultConfig();
        this.performanceMonitor = new PerformanceMonitor();
        this.touchHandler = new TouchHandler();
        this.presets = this.getPresetConfigurations();
        
        // Responsive settings
        this.isMobile = window.innerWidth <= 768;
        this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        
        this.init();
    }

    async init() {
        try {
            // Load saved preferences
            this.loadSavedSettings();
            
            this.showLoadingScreen();
            await this.loadParticles();
            
            // Apply theme after particles are loaded
            this.applyColorTheme(this.currentTheme);
            
            this.setupControls();
            this.setupEventListeners();
            this.applyResponsiveSettings();
            this.startPerformanceMonitoring();
            this.hideLoadingScreen();
            this.isInitialized = true;
            
            console.log('🚀 Futuristic Particle System initialized successfully');
        } catch (error) {
            console.error('❌ Failed to initialize particle system:', error);
            this.handleInitializationError(error);
        }
    }

    getDefaultConfig() {
        const themeColors = this.getThemeColors(this.currentTheme);
        
        return {
            particles: {
                number: {
                    value: this.isMobile ? 80 : 150,
                    density: {
                        enable: true,
                        value_area: 800
                    }
                },
                color: {
                    value: [themeColors.primary, themeColors.secondary, themeColors.accent]
                },
                shape: {
                    type: "circle",
                    stroke: {
                        width: 0,
                        color: "#000000"
                    }
                },
                opacity: {
                    value: 0.5,
                    random: true,
                    anim: {
                        enable: true,
                        speed: 1,
                        opacity_min: 0.1,
                        sync: false
                    }
                },
                size: {
                    value: 3,
                    random: true,
                    anim: {
                        enable: true,
                        speed: 2,
                        size_min: 0.5,
                        sync: false
                    }
                },
                line_linked: {
                    enable: true,
                    distance: 150,
                    color: themeColors.primary,
                    opacity: 0.3,
                    width: 1
                },
                move: {
                    enable: true,
                    speed: 2,
                    direction: "none",
                    random: true,
                    straight: false,
                    out_mode: "bounce",
                    bounce: false,
                    attract: {
                        enable: true,
                        rotateX: 600,
                        rotateY: 1200
                    }
                }
            },
            interactivity: {
                detect_on: "canvas",
                events: {
                    onhover: {
                        enable: true,
                        mode: "attract"
                    },
                    onclick: {
                        enable: true,
                        mode: "repulse"
                    },
                    ontouchmove: {
                        enable: true,
                        mode: "attract"
                    },
                    resize: true
                },
                modes: {
                    attract: {
                        distance: this.isMobile ? 100 : 200,
                        duration: 0.4,
                        factor: this.isMobile ? 3 : 5
                    },
                    repulse: {
                        distance: this.isMobile ? 50 : 100,
                        duration: 0.4
                    }
                }
            },
            retina_detect: true
        };
    }

    async loadParticles() {
        return new Promise((resolve, reject) => {
            try {
                if (typeof particlesJS === 'undefined') {
                    throw new Error('particles.js library not loaded');
                }

                particlesJS('particles-js', this.particleConfig, () => {
                    console.log('✅ Particles.js loaded successfully');
                    resolve();
                });

                // Fallback timeout
                setTimeout(() => {
                    if (window.pJSDom && window.pJSDom.length > 0) {
                        resolve();
                    } else {
                        reject(new Error('Particles.js failed to initialize within timeout'));
                    }
                }, 5000);
            } catch (error) {
                reject(error);
            }
        });
    }

    setupControls() {
        // Density control
        const densitySlider = document.getElementById('densitySlider');
        const densityValue = document.getElementById('densityValue');
        densitySlider?.addEventListener('input', (e) => {
            const value = parseInt(e.target.value);
            densityValue.textContent = value;
            this.updateParticleCount(value);
            this.updateStats();
        });

        // Speed control
        const speedSlider = document.getElementById('speedSlider');
        const speedValue = document.getElementById('speedValue');
        speedSlider?.addEventListener('input', (e) => {
            const value = parseFloat(e.target.value);
            speedValue.textContent = value;
            this.updateParticleSpeed(value);
        });

        // Direction control
        const directionSlider = document.getElementById('directionSlider');
        const directionValue = document.getElementById('directionValue');
        directionSlider?.addEventListener('input', (e) => {
            const value = parseInt(e.target.value);
            directionValue.textContent = `${value}°`;
            this.updateParticleDirection(value);
        });

        // Size controls
        const sizeSlider = document.getElementById('sizeSlider');
        const sizeValue = document.getElementById('sizeValue');
        sizeSlider?.addEventListener('input', (e) => {
            const value = parseFloat(e.target.value);
            sizeValue.textContent = value;
            this.updateParticleSize(value);
        });

        const sizeVariationSlider = document.getElementById('sizeVariationSlider');
        const sizeVariationValue = document.getElementById('sizeVariationValue');
        sizeVariationSlider?.addEventListener('input', (e) => {
            const value = parseInt(e.target.value);
            sizeVariationValue.textContent = value;
            this.updateSizeVariation(value);
        });

        // Opacity control
        const opacitySlider = document.getElementById('opacitySlider');
        const opacityValue = document.getElementById('opacityValue');
        opacitySlider?.addEventListener('input', (e) => {
            const value = parseInt(e.target.value);
            opacityValue.textContent = value;
            this.updateParticleOpacity(value / 100);
        });

        // Glow intensity
        const glowSlider = document.getElementById('glowIntensitySlider');
        const glowValue = document.getElementById('glowIntensityValue');
        glowSlider?.addEventListener('input', (e) => {
            const value = parseInt(e.target.value);
            glowValue.textContent = value;
            this.updateGlowIntensity(value);
        });

        // Toggle controls
        this.setupToggleControls();
        
        // Color presets
        this.setupColorPresets();
        
        // Theme toggle
        this.setupThemeToggle();
        
        // Custom color controls
        this.setupCustomColorControls();
        
        // Quick presets
        this.setupQuickPresets();
        
        // Action buttons
        this.setupActionButtons();
    }

    setupToggleControls() {
        const mouseInteraction = document.getElementById('mouseInteraction');
        mouseInteraction?.addEventListener('change', (e) => {
            this.toggleMouseInteraction(e.target.checked);
        });

        const connectLines = document.getElementById('connectLines');
        connectLines?.addEventListener('change', (e) => {
            this.toggleConnectionLines(e.target.checked);
        });

        const responsiveMode = document.getElementById('responsiveMode');
        responsiveMode?.addEventListener('change', (e) => {
            this.toggleResponsiveMode(e.target.checked);
        });
    }

    setupColorPresets() {
        const presets = document.querySelectorAll('.color-preset');
        presets.forEach(preset => {
            preset.addEventListener('click', () => {
                presets.forEach(p => p.classList.remove('active'));
                preset.classList.add('active');
                const theme = preset.dataset.theme;
                this.applyColorTheme(theme);
            });
        });
    }

    setupThemeToggle() {
        const themeToggle = document.getElementById('themeToggle');
        if (themeToggle) {
            themeToggle.addEventListener('change', (e) => {
                this.toggleLightMode(e.target.checked);
            });
        }
    }

    async getLightModeConfig() {
        try {
            const response = await fetch('particlesjs-config.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const config = await response.json();
            console.log('✅ Light mode particle config loaded successfully');
            return config;
        } catch (error) {
            console.error('❌ Failed to load light mode particle config:', error);
            // Fallback to default config if loading fails
            return this.getDefaultConfig();
        }
    }

    async toggleLightMode(enabled) {
        this.isLightMode = enabled;

        if (enabled) {
            this.particleConfig = await this.getLightModeConfig();
        } else {
            this.particleConfig = this.getDefaultConfig();
        }

        // Destroy existing particle instance
        if (window.pJSDom && window.pJSDom[0] && window.pJSDom[0].pJS) {
            window.pJSDom[0].pJS.fn.vendors.destroypJS();
            // Ensure the pJSDom array is cleared
            window.pJSDom = [];
        }
        
        // Re-initialize particles with the new config
        await this.loadParticles();

        if (enabled) {
            // Switch to light mode
            document.documentElement.classList.add('light-mode');
            document.body.classList.add('light-mode');
            
            // Update CSS variables for light mode
            document.documentElement.style.setProperty('--glass-bg', 'var(--glass-bg-light)');
            document.documentElement.style.setProperty('--glass-border', 'var(--glass-border-light)');
            document.documentElement.style.setProperty('--cyber-bg', 'var(--cyber-bg-light)');
            document.documentElement.style.setProperty('--cyber-surface', 'var(--cyber-surface-light)');
        } else {
            // Switch to dark mode
            document.documentElement.classList.remove('light-mode');
            document.body.classList.remove('light-mode');
            
            // Update CSS variables for dark mode
            document.documentElement.style.setProperty('--glass-bg', 'rgba(255, 255, 255, 0.05)');
            document.documentElement.style.setProperty('--glass-border', 'rgba(255, 255, 255, 0.1)');
            document.documentElement.style.setProperty('--cyber-bg', '#02001a');
            document.documentElement.style.setProperty('--cyber-surface', 'rgba(12, 10, 48, 0.8)');
        }
        
        // Re-apply current theme to update colors for the new mode
        this.applyColorTheme(this.currentTheme);
        
        // Update gradient overlay
        const themeColors = this.getThemeColors(this.currentTheme);
        this.updateGradientOverlay(themeColors);
        
        // Save preference
        localStorage.setItem('futuristicParticlesLightMode', enabled.toString());
        
        console.log(`🌙 Switched to ${enabled ? 'light' : 'dark'} mode`);
    }

    setupCustomColorControls() {
        // Particle color inputs
        for (let i = 1; i <= 3; i++) {
            const colorInput = document.getElementById(`particleColor${i}`);
            const hexInput = document.getElementById(`particleColor${i}Hex`);
            const valueDisplay = document.getElementById(`particleColor${i}Value`);
            
            if (colorInput && hexInput && valueDisplay) {
                // Initialize values
                colorInput.value = this.customColors.particles[i-1];
                hexInput.value = this.customColors.particles[i-1];
                valueDisplay.textContent = this.customColors.particles[i-1];
                
                // Color picker event
                colorInput.addEventListener('input', (e) => {
                    const color = e.target.value;
                    hexInput.value = color;
                    valueDisplay.textContent = color;
                    this.updateParticleColor(i-1, color);
                });
                
                // Hex input event
                hexInput.addEventListener('input', (e) => {
                    const color = e.target.value;
                    if (this.isValidHex(color)) {
                        colorInput.value = color;
                        valueDisplay.textContent = color;
                        this.updateParticleColor(i-1, color);
                    }
                });
                
                hexInput.addEventListener('blur', (e) => {
                    const color = e.target.value;
                    if (!this.isValidHex(color)) {
                        // Reset to current color if invalid
                        const currentColor = this.customColors.particles[i-1];
                        e.target.value = currentColor;
                        colorInput.value = currentColor;
                        valueDisplay.textContent = currentColor;
                    }
                });
            }
        }
        
        // Connection color inputs
        const connectionColorInput = document.getElementById('connectionColor');
        const connectionHexInput = document.getElementById('connectionColorHex');
        const connectionValueDisplay = document.getElementById('connectionColorValue');
        
        if (connectionColorInput && connectionHexInput && connectionValueDisplay) {
            // Initialize values
            connectionColorInput.value = this.customColors.connections;
            connectionHexInput.value = this.customColors.connections;
            connectionValueDisplay.textContent = this.customColors.connections;
            
            // Color picker event
            connectionColorInput.addEventListener('input', (e) => {
                const color = e.target.value;
                connectionHexInput.value = color;
                connectionValueDisplay.textContent = color;
                this.updateConnectionColor(color);
            });
            
            // Hex input event
            connectionHexInput.addEventListener('input', (e) => {
                const color = e.target.value;
                if (this.isValidHex(color)) {
                    connectionColorInput.value = color;
                    connectionValueDisplay.textContent = color;
                    this.updateConnectionColor(color);
                }
            });
            
            connectionHexInput.addEventListener('blur', (e) => {
                const color = e.target.value;
                if (!this.isValidHex(color)) {
                    // Reset to current color if invalid
                    const currentColor = this.customColors.connections;
                    e.target.value = currentColor;
                    connectionColorInput.value = currentColor;
                    connectionValueDisplay.textContent = currentColor;
                }
            });
        }
        
        // Color action buttons
        const randomizeBtn = document.getElementById('randomizeColors');
        const resetBtn = document.getElementById('resetColors');
        
        if (randomizeBtn) {
            randomizeBtn.addEventListener('click', () => this.randomizeColors());
        }
        
        if (resetBtn) {
            resetBtn.addEventListener('click', () => this.resetToThemeColors());
        }
    }

    setupQuickPresets() {
        const presetButtons = document.querySelectorAll('.preset-btn');
        presetButtons.forEach(button => {
            button.addEventListener('click', () => {
                const preset = button.dataset.preset;
                this.applyQuickPreset(preset);
            });
        });
    }

    setupActionButtons() {
        const resetBtn = document.getElementById('resetBtn');
        resetBtn?.addEventListener('click', () => this.resetToDefaults());

        const exportBtn = document.getElementById('exportBtn');
        exportBtn?.addEventListener('click', () => this.exportConfiguration());

        const fullscreenBtn = document.getElementById('fullscreenBtn');
        fullscreenBtn?.addEventListener('click', () => this.toggleFullscreen());

        // Custom colors toggle button
        const toggleCustomColorsBtn = document.getElementById('toggleCustomColors');
        toggleCustomColorsBtn?.addEventListener('click', () => this.toggleCustomColors());

        // Panel toggle
        const panelToggle = document.getElementById('panelToggle');
        const controlPanel = document.getElementById('controlPanel');
        panelToggle?.addEventListener('click', () => {
            controlPanel.classList.toggle('collapsed');
        });

        // Performance monitor toggle
        const monitorToggle = document.getElementById('monitorToggle');
        const performanceMonitor = document.getElementById('performanceMonitor');
        monitorToggle?.addEventListener('click', () => {
            performanceMonitor.style.display = 'none';
        });
    }

    setupEventListeners() {
        // Window resize
        window.addEventListener('resize', () => {
            this.handleResize();
        });

        // Visibility change (performance optimization)
        document.addEventListener('visibilitychange', () => {
            this.handleVisibilityChange();
        });

        // Reduced motion preference
        const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
        reducedMotionQuery.addEventListener('change', (e) => {
            this.reducedMotion = e.matches;
            this.applyAccessibilitySettings();
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            this.handleKeyboardShortcuts(e);
        });

        // Touch events for mobile
        this.touchHandler.setupTouchEvents();
    }

    // Particle System Update Methods
    updateParticleCount(count) {
        if (window.pJSDom?.[0]?.pJS) {
            const pJS = window.pJSDom[0].pJS;
            pJS.particles.number.value = count;
            pJS.fn.particlesRefresh();
        }
    }

    updateParticleSpeed(speed) {
        if (window.pJSDom?.[0]?.pJS) {
            const pJS = window.pJSDom[0].pJS;
            pJS.particles.move.speed = speed;
            pJS.particles.array.forEach(particle => {
                particle.vs = speed;
            });
        }
    }

    updateParticleDirection(degrees) {
        if (window.pJSDom?.[0]?.pJS) {
            const pJS = window.pJSDom[0].pJS;
            const radians = degrees * (Math.PI / 180);
            pJS.particles.move.direction = degrees === 0 ? "none" : degrees;
            
            pJS.particles.array.forEach(particle => {
                if (degrees !== 0) {
                    particle.vx = Math.cos(radians) * particle.vs;
                    particle.vy = Math.sin(radians) * particle.vs;
                } else {
                    particle.vx = (Math.random() - 0.5) * particle.vs;
                    particle.vy = (Math.random() - 0.5) * particle.vs;
                }
            });
        }
    }

    updateParticleSize(size) {
        if (window.pJSDom?.[0]?.pJS) {
            const pJS = window.pJSDom[0].pJS;
            pJS.particles.size.value = size;
            pJS.particles.array.forEach(particle => {
                particle.radius = size;
            });
        }
    }

    updateSizeVariation(variation) {
        if (window.pJSDom?.[0]?.pJS) {
            const pJS = window.pJSDom[0].pJS;
            pJS.particles.size.random = variation > 0;
            pJS.particles.array.forEach(particle => {
                const variationFactor = 1 + (variation / 100) * (Math.random() - 0.5) * 2;
                particle.radius = pJS.particles.size.value * variationFactor;
            });
        }
    }

    updateParticleOpacity(opacity) {
        if (window.pJSDom?.[0]?.pJS) {
            const pJS = window.pJSDom[0].pJS;
            pJS.particles.opacity.value = opacity;
            pJS.particles.array.forEach(particle => {
                particle.opacity.value = opacity;
            });
        }
    }

    updateGlowIntensity(intensity) {
        const canvas = document.querySelector('#particles-js canvas');
        if (canvas) {
            canvas.style.filter = `drop-shadow(0 0 ${intensity}px var(--cyber-primary))`;
        }
    }

    toggleMouseInteraction(enabled) {
        if (window.pJSDom?.[0]?.pJS) {
            const pJS = window.pJSDom[0].pJS;
            pJS.interactivity.events.onhover.enable = enabled;
            pJS.interactivity.events.onclick.enable = enabled;
        }
    }

    toggleConnectionLines(enabled) {
        if (window.pJSDom?.[0]?.pJS) {
            const pJS = window.pJSDom[0].pJS;
            pJS.particles.line_linked.enable = enabled;
        }
    }

    toggleResponsiveMode(enabled) {
        this.responsiveMode = enabled;
        if (enabled) {
            this.applyResponsiveSettings();
        }
    }

    // Theme and Color Management
    applyColorTheme(theme) {
        this.currentTheme = theme;
        const themeColors = this.getThemeColors(theme);
        
        // Update CSS variables
        document.documentElement.style.setProperty('--cyber-primary', themeColors.primary);
        document.documentElement.style.setProperty('--cyber-secondary', themeColors.secondary);
        document.documentElement.style.setProperty('--cyber-accent', themeColors.accent);
        
        // Update particles - use custom colors if enabled, otherwise use theme colors
        if (window.pJSDom?.[0]?.pJS) {
            const pJS = window.pJSDom[0].pJS;
            
            if (this.useCustomColors) {
                pJS.particles.color.value = this.customColors.particles;
                pJS.particles.line_linked.color = this.customColors.connections;
            } else {
                pJS.particles.color.value = [themeColors.primary, themeColors.secondary, themeColors.accent];
                pJS.particles.line_linked.color = themeColors.primary;
            }
            
            pJS.particles.array.forEach(particle => {
                const colors = this.useCustomColors ? this.customColors.particles : [themeColors.primary, themeColors.secondary, themeColors.accent];
                particle.color.value = colors[Math.floor(Math.random() * colors.length)];
            });
        }
        
        // Update gradient overlay
        this.updateGradientOverlay(themeColors);
        
        // Update theme class for light mode
        if (this.isLightMode) {
            document.documentElement.classList.remove('theme-cyber', 'theme-neon', 'theme-ocean', 'theme-fire');
            document.documentElement.classList.add(`theme-${theme}`);
        }
        
        // Save theme preference
        localStorage.setItem('futuristicParticlesTheme', theme);
        
        // Update UI to reflect theme colors if not using custom colors
        if (!this.useCustomColors) {
            this.updateColorUIFromTheme(themeColors);
        }
    }

    getThemeColors(theme) {
        const themes = {
            cyber: {
                dark: {
                    primary: '#00f5d4',
                    secondary: '#6c63ff',
                    accent: '#ff006e'
                },
                light: {
                    primary: '#00a8a0',
                    secondary: '#4a4aff',
                    accent: '#cc0044'
                }
            },
            neon: {
                dark: {
                    primary: '#ff0080',
                    secondary: '#00ff80',
                    accent: '#8000ff'
                },
                light: {
                    primary: '#cc0066',
                    secondary: '#00cc66',
                    accent: '#6600cc'
                }
            },
            ocean: {
                dark: {
                    primary: '#0066ff',
                    secondary: '#00ccff',
                    accent: '#0099cc'
                },
                light: {
                    primary: '#0044cc',
                    secondary: '#0099cc',
                    accent: '#006699'
                }
            },
            fire: {
                dark: {
                    primary: '#ff4500',
                    secondary: '#ff6600',
                    accent: '#ffaa00'
                },
                light: {
                    primary: '#cc3300',
                    secondary: '#cc5500',
                    accent: '#cc8800'
                }
            }
        };
        
        const themeData = themes[theme] || themes.cyber;
        return this.isLightMode ? themeData.light : themeData.dark;
    }

    updateGradientOverlay(colors) {
        const overlay = document.getElementById('gradientOverlay');
        if (overlay) {
            const alpha = this.isLightMode ? 0.06 : 0.1;
            const gradient = `linear-gradient(135deg, 
                ${colors.primary}${Math.round(alpha * 255).toString(16).padStart(2, '0')} 0%, 
                transparent 25%, 
                transparent 75%, 
                ${colors.secondary}${Math.round(alpha * 255).toString(16).padStart(2, '0')} 100%)`;
            overlay.style.background = gradient;
        }
    }

    updateConnectionColor(color) {
        this.customColors.connections = color;
        this.useCustomColors = true;
        
        if (window.pJSDom?.[0]?.pJS) {
            const pJS = window.pJSDom[0].pJS;
            pJS.particles.line_linked.color = color;
            
            // Update existing particles
            pJS.particles.array.forEach(particle => {
                if (particle.line_linked) {
                    particle.line_linked.color = color;
                }
            });
        }
        
        // Update CSS variable for glow effects
        document.documentElement.style.setProperty('--connection-color', color);
        
        // Save to localStorage
        localStorage.setItem('futuristicParticlesCustomColors', JSON.stringify(this.customColors));
        localStorage.setItem('futuristicParticlesUseCustomColors', 'true');
    }

    updateParticleColor(index, color) {
        this.customColors.particles[index] = color;
        this.useCustomColors = true;
        
        if (window.pJSDom?.[0]?.pJS) {
            const pJS = window.pJSDom[0].pJS;
            
            // Update particle colors array
            pJS.particles.color.value = this.customColors.particles;
            
            // Update existing particles
            pJS.particles.array.forEach(particle => {
                const colors = this.customColors.particles;
                particle.color.value = colors[Math.floor(Math.random() * colors.length)];
                particle.color.rgb = this.hexToRgb(particle.color.value);
            });
        }
        
        // Save to localStorage
        localStorage.setItem('futuristicParticlesCustomColors', JSON.stringify(this.customColors));
        localStorage.setItem('futuristicParticlesUseCustomColors', 'true');
    }

    isValidHex(color) {
        return /^#[0-9A-F]{6}$/i.test(color);
    }

    hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : null;
    }

    randomizeColors() {
        // Generate random vibrant colors
        const randomColor = () => {
            const hue = Math.random() * 360;
            const saturation = 70 + Math.random() * 30; // 70-100%
            const lightness = 50 + Math.random() * 20; // 50-70%
            return this.hslToHex(hue, saturation, lightness);
        };
        
        // Update particle colors
        for (let i = 0; i < 3; i++) {
            const color = randomColor();
            this.updateParticleColor(i, color);
            
            // Update UI
            const colorInput = document.getElementById(`particleColor${i+1}`);
            const hexInput = document.getElementById(`particleColor${i+1}Hex`);
            const valueDisplay = document.getElementById(`particleColor${i+1}Value`);
            
            if (colorInput) colorInput.value = color;
            if (hexInput) hexInput.value = color;
            if (valueDisplay) valueDisplay.textContent = color;
        }
        
        // Update connection color
        const connectionColor = randomColor();
        this.updateConnectionColor(connectionColor);
        
        // Update UI
        const connectionColorInput = document.getElementById('connectionColor');
        const connectionHexInput = document.getElementById('connectionColorHex');
        const connectionValueDisplay = document.getElementById('connectionColorValue');
        
        if (connectionColorInput) connectionColorInput.value = connectionColor;
        if (connectionHexInput) connectionHexInput.value = connectionColor;
        if (connectionValueDisplay) connectionValueDisplay.textContent = connectionColor;
    }

    resetToThemeColors() {
        this.useCustomColors = false;
        
        // Get current theme colors
        const themeColors = this.getThemeColors(this.currentTheme);
        
        // Reset particle colors
        this.customColors.particles = [themeColors.primary, themeColors.secondary, themeColors.accent];
        this.customColors.connections = themeColors.primary;
        
        // Apply theme colors
        this.applyColorTheme(this.currentTheme);
        
        // Update UI
        for (let i = 0; i < 3; i++) {
            const color = this.customColors.particles[i];
            const colorInput = document.getElementById(`particleColor${i+1}`);
            const hexInput = document.getElementById(`particleColor${i+1}Hex`);
            const valueDisplay = document.getElementById(`particleColor${i+1}Value`);
            
            if (colorInput) colorInput.value = color;
            if (hexInput) hexInput.value = color;
            if (valueDisplay) valueDisplay.textContent = color;
        }
        
        // Update connection color UI
        const connectionColorInput = document.getElementById('connectionColor');
        const connectionHexInput = document.getElementById('connectionColorHex');
        const connectionValueDisplay = document.getElementById('connectionColorValue');
        
        if (connectionColorInput) connectionColorInput.value = this.customColors.connections;
        if (connectionHexInput) connectionHexInput.value = this.customColors.connections;
        if (connectionValueDisplay) connectionValueDisplay.textContent = this.customColors.connections;
        
        // Save to localStorage
        localStorage.setItem('futuristicParticlesUseCustomColors', 'false');
    }

    hslToHex(h, s, l) {
        l /= 100;
        const a = s * Math.min(l, 1 - l) / 100;
        const f = n => {
            const k = (n + h / 30) % 12;
            const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
            return Math.round(255 * color).toString(16).padStart(2, '0');
        };
        return `#${f(0)}${f(8)}${f(4)}`;
    }

    updateColorUIFromTheme(themeColors) {
        // Update particle color UI
        const particleColors = [themeColors.primary, themeColors.secondary, themeColors.accent];
        
        for (let i = 0; i < 3; i++) {
            const color = particleColors[i];
            const colorInput = document.getElementById(`particleColor${i+1}`);
            const hexInput = document.getElementById(`particleColor${i+1}Hex`);
            const valueDisplay = document.getElementById(`particleColor${i+1}Value`);
            
            if (colorInput) colorInput.value = color;
            if (hexInput) hexInput.value = color;
            if (valueDisplay) valueDisplay.textContent = color;
        }
        
        // Update connection color UI
        const connectionColorInput = document.getElementById('connectionColor');
        const connectionHexInput = document.getElementById('connectionColorHex');
        const connectionValueDisplay = document.getElementById('connectionColorValue');
        
        if (connectionColorInput) connectionColorInput.value = themeColors.primary;
        if (connectionHexInput) connectionHexInput.value = themeColors.primary;
        if (connectionValueDisplay) connectionValueDisplay.textContent = themeColors.primary;
        
        // Update custom colors array
        this.customColors.particles = particleColors;
        this.customColors.connections = themeColors.primary;
    }

    updateCustomColorsIndicator() {
        const customColorsSection = document.getElementById('customColorsSection');
        if (customColorsSection) {
            if (this.useCustomColors) {
                customColorsSection.classList.add('custom-colors-active');
            } else {
                customColorsSection.classList.remove('custom-colors-active');
            }
        }
    }

    toggleCustomColors() {
        this.useCustomColors = !this.useCustomColors;
        
        const toggleBtn = document.getElementById('toggleCustomColors');
        const customColorsSection = document.getElementById('customColorsSection');
        
        if (this.useCustomColors) {
            // Enable custom colors
            toggleBtn.textContent = 'Disable Custom Colors';
            toggleBtn.classList.add('active');
            customColorsSection.classList.add('active');
            
            // Apply custom colors to particles
            this.applyCustomColors();
        } else {
            // Disable custom colors and revert to theme
            toggleBtn.textContent = 'Enable Custom Colors';
            toggleBtn.classList.remove('active');
            customColorsSection.classList.remove('active');
            
            // Revert to theme colors
            this.applyThemeColors();
        }
        
        // Update the indicator
        this.updateCustomColorsIndicator();
        
        // Save preference
        this.saveSettings();
    }

    applyCustomColors() {
        if (window.pJSDom?.[0]?.pJS) {
            const pJS = window.pJSDom[0].pJS;
            
            // Apply custom particle colors
            pJS.particles.color.value = this.customColors.particles;
            
            // Apply custom connection color
            pJS.particles.line_linked.color = this.customColors.connections;
            
            // Update existing particles
            pJS.particles.array.forEach(particle => {
                const colors = this.customColors.particles;
                particle.color.value = colors[Math.floor(Math.random() * colors.length)];
                particle.color.rgb = this.hexToRgb(particle.color.value);
                
                if (particle.line_linked) {
                    particle.line_linked.color = this.customColors.connections;
                }
            });
        }
        
        // Update CSS variables for glow effects
        document.documentElement.style.setProperty('--connection-color', this.customColors.connections);
    }

    applyThemeColors() {
        const themeColors = this.getThemeColors(this.currentTheme);
        
        if (window.pJSDom?.[0]?.pJS) {
            const pJS = window.pJSDom[0].pJS;
            
            // Apply theme particle colors
            pJS.particles.color.value = [themeColors.primary, themeColors.secondary, themeColors.accent];
            
            // Apply theme connection color
            pJS.particles.line_linked.color = themeColors.primary;
            
            // Update existing particles
            pJS.particles.array.forEach(particle => {
                const colors = [themeColors.primary, themeColors.secondary, themeColors.accent];
                particle.color.value = colors[Math.floor(Math.random() * colors.length)];
                particle.color.rgb = this.hexToRgb(particle.color.value);
                
                if (particle.line_linked) {
                    particle.line_linked.color = themeColors.primary;
                }
            });
        }
        
        // Update CSS variables for glow effects
        document.documentElement.style.setProperty('--connection-color', themeColors.primary);
    }

    saveSettings() {
        localStorage.setItem('futuristicParticlesUseCustomColors', this.useCustomColors.toString());
        localStorage.setItem('futuristicParticlesCustomColors', JSON.stringify(this.customColors));
        localStorage.setItem('futuristicParticlesTheme', this.currentTheme);
        localStorage.setItem('futuristicParticlesLightMode', this.isLightMode.toString());
    }

    loadSavedSettings() {
        // Load theme preference
        const savedTheme = localStorage.getItem('futuristicParticlesTheme');
        if (savedTheme) {
            this.currentTheme = savedTheme;
        }
        
        // Load light mode preference
        const savedLightMode = localStorage.getItem('futuristicParticlesLightMode');
        if (savedLightMode === 'true') {
            this.isLightMode = true;
            document.documentElement.classList.add('light-mode');
            document.body.classList.add('light-mode');
            // Checkbox will be set after DOM is ready
            setTimeout(() => {
                const themeToggle = document.getElementById('themeToggle');
                if (themeToggle) themeToggle.checked = true;
            }, 100);
        }
        
        // Load custom colors preference
        const savedUseCustomColors = localStorage.getItem('futuristicParticlesUseCustomColors');
        if (savedUseCustomColors === 'true') {
            this.useCustomColors = true;
            const savedCustomColors = localStorage.getItem('futuristicParticlesCustomColors');
            if (savedCustomColors) {
                this.customColors = JSON.parse(savedCustomColors);
            }
            
            // Update UI to reflect custom colors state (will be done after DOM is ready)
            setTimeout(() => {
                const toggleBtn = document.getElementById('toggleCustomColors');
                const customColorsSection = document.getElementById('customColorsSection');
                
                if (toggleBtn) {
                    toggleBtn.textContent = 'Disable Custom Colors';
                    toggleBtn.classList.add('active');
                }
                
                if (customColorsSection) {
                    customColorsSection.classList.add('active');
                }
                
                // Update the indicator
                this.updateCustomColorsIndicator();
            }, 100);
        }
    }

    // Preset Configurations
    getPresetConfigurations() {
        return {
            minimal: {
                particles: { number: { value: 30 } },
                speed: 0.5,
                size: 2,
                opacity: 0.3,
                connections: false
            },
            intense: {
                particles: { number: { value: 300 } },
                speed: 5,
                size: 4,
                opacity: 0.8,
                connections: true
            },
            matrix: {
                particles: { number: { value: 200 } },
                speed: 1,
                size: 1,
                opacity: 0.6,
                shape: 'edge',
                color: '#00ff00'
            },
            cosmic: {
                particles: { number: { value: 100 } },
                speed: 3,
                size: 5,
                opacity: 0.7,
                glow: 80
            }
        };
    }

    applyQuickPreset(presetName) {
        const preset = this.presets[presetName];
        if (!preset) return;

        // Update sliders
        if (preset.particles?.number?.value) {
            const slider = document.getElementById('densitySlider');
            const value = document.getElementById('densityValue');
            slider.value = preset.particles.number.value;
            value.textContent = preset.particles.number.value;
            this.updateParticleCount(preset.particles.number.value);
        }

        if (preset.speed) {
            const slider = document.getElementById('speedSlider');
            const value = document.getElementById('speedValue');
            slider.value = preset.speed;
            value.textContent = preset.speed;
            this.updateParticleSpeed(preset.speed);
        }

        if (preset.size) {
            const slider = document.getElementById('sizeSlider');
            const value = document.getElementById('sizeValue');
            slider.value = preset.size;
            value.textContent = preset.size;
            this.updateParticleSize(preset.size);
        }

        if (preset.opacity) {
            const slider = document.getElementById('opacitySlider');
            const value = document.getElementById('opacityValue');
            slider.value = preset.opacity * 100;
            value.textContent = preset.opacity * 100;
            this.updateParticleOpacity(preset.opacity);
        }

        if (preset.glow) {
            const slider = document.getElementById('glowIntensitySlider');
            const value = document.getElementById('glowIntensityValue');
            slider.value = preset.glow;
            value.textContent = preset.glow;
            this.updateGlowIntensity(preset.glow);
        }

        if (preset.connections !== undefined) {
            const checkbox = document.getElementById('connectLines');
            checkbox.checked = preset.connections;
            this.toggleConnectionLines(preset.connections);
        }
    }

    // Responsive and Performance
    applyResponsiveSettings() {
        if (!this.responsiveMode) return;

        const width = window.innerWidth;
        let particleCount, interactionDistance;

        if (width <= 480) {
            particleCount = 50;
            interactionDistance = 80;
        } else if (width <= 768) {
            particleCount = 100;
            interactionDistance = 120;
        } else {
            particleCount = 150;
            interactionDistance = 200;
        }

        this.updateParticleCount(particleCount);
        
        if (window.pJSDom?.[0]?.pJS) {
            const pJS = window.pJSDom[0].pJS;
            pJS.interactivity.modes.attract.distance = interactionDistance;
            pJS.interactivity.modes.repulse.distance = interactionDistance / 2;
        }

        // Update UI
        const densitySlider = document.getElementById('densitySlider');
        const densityValue = document.getElementById('densityValue');
        if (densitySlider && densityValue) {
            densitySlider.value = particleCount;
            densityValue.textContent = particleCount;
        }
    }

    handleResize() {
        if (this.responsiveMode) {
            clearTimeout(this.resizeTimeout);
            this.resizeTimeout = setTimeout(() => {
                this.applyResponsiveSettings();
            }, 300);
        }
    }

    handleVisibilityChange() {
        if (document.hidden) {
            // Pause particles when tab is not visible
            if (window.pJSDom?.[0]?.pJS) {
                window.pJSDom[0].pJS.fn.vendors.destroypJS();
            }
        } else {
            // Resume particles when tab becomes visible
            if (this.isInitialized) {
                this.loadParticles();
            }
        }
    }

    applyAccessibilitySettings() {
        if (this.reducedMotion) {
            this.updateParticleSpeed(0.1);
            const speedSlider = document.getElementById('speedSlider');
            const speedValue = document.getElementById('speedValue');
            if (speedSlider && speedValue) {
                speedSlider.value = 0.1;
                speedValue.textContent = 0.1;
            }
        }
    }

    // Utility Methods
    handleKeyboardShortcuts(e) {
        if (e.ctrlKey || e.metaKey) {
            switch (e.key) {
                case 'r':
                    e.preventDefault();
                    this.resetToDefaults();
                    break;
                case 'f':
                    e.preventDefault();
                    this.toggleFullscreen();
                    break;
                case 'e':
                    e.preventDefault();
                    this.exportConfiguration();
                    break;
            }
        }
    }

    resetToDefaults() {
        this.particleConfig = this.getDefaultConfig();
        this.loadParticles();
        this.resetControlValues();
        this.applyColorTheme('cyber');
        
        // Reset theme toggle
        this.isLightMode = false;
        document.documentElement.classList.remove('light-mode');
        document.body.classList.remove('light-mode');
        document.getElementById('themeToggle').checked = false;
        localStorage.setItem('futuristicParticlesLightMode', false);
        
        // Reset custom colors
        this.useCustomColors = false;
        this.customColors = {
            particles: ['#00f5d4', '#6c63ff', '#ff006e'],
            connections: '#00f5d4'
        };
        
        // Update UI for custom colors
        const toggleBtn = document.getElementById('toggleCustomColors');
        const customColorsSection = document.getElementById('customColorsSection');
        
        if (toggleBtn) {
            toggleBtn.textContent = 'Enable Custom Colors';
            toggleBtn.classList.remove('active');
        }
        
        if (customColorsSection) {
            customColorsSection.classList.remove('active');
        }
        
        this.updateCustomColorsIndicator();
        this.saveSettings();
    }

    resetControlValues() {
        const controls = [
            { id: 'densitySlider', valueId: 'densityValue', value: 150 },
            { id: 'speedSlider', valueId: 'speedValue', value: 2 },
            { id: 'directionSlider', valueId: 'directionValue', value: 0, suffix: '°' },
            { id: 'sizeSlider', valueId: 'sizeValue', value: 3 },
            { id: 'sizeVariationSlider', valueId: 'sizeVariationValue', value: 50, suffix: '%' },
            { id: 'opacitySlider', valueId: 'opacityValue', value: 50, suffix: '%' },
            { id: 'glowIntensitySlider', valueId: 'glowIntensityValue', value: 30, suffix: '%' }
        ];

        controls.forEach(control => {
            const slider = document.getElementById(control.id);
            const valueDisplay = document.getElementById(control.valueId);
            if (slider && valueDisplay) {
                slider.value = control.value;
                valueDisplay.textContent = control.value + (control.suffix || '');
            }
        });

        // Reset checkboxes
        document.getElementById('mouseInteraction').checked = true;
        document.getElementById('connectLines').checked = true;
        document.getElementById('responsiveMode').checked = true;
    }

    exportConfiguration() {
        const config = {
            theme: this.currentTheme,
            lightMode: this.isLightMode,
            useCustomColors: this.useCustomColors,
            customColors: this.customColors,
            particles: this.particleConfig,
            settings: {
                density: document.getElementById('densitySlider')?.value,
                speed: document.getElementById('speedSlider')?.value,
                direction: document.getElementById('directionSlider')?.value,
                size: document.getElementById('sizeSlider')?.value,
                sizeVariation: document.getElementById('sizeVariationSlider')?.value,
                opacity: document.getElementById('opacitySlider')?.value,
                glowIntensity: document.getElementById('glowIntensitySlider')?.value,
                mouseInteraction: document.getElementById('mouseInteraction')?.checked,
                connectLines: document.getElementById('connectLines')?.checked,
                responsiveMode: document.getElementById('responsiveMode')?.checked
            },
            timestamp: new Date().toISOString()
        };

        const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `particle-config-${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }

    toggleFullscreen() {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(err => {
                console.warn('Fullscreen not supported:', err);
            });
        } else {
            document.exitFullscreen();
        }
    }

    updateStats() {
        const particleCountEl = document.getElementById('particleCount');
        if (particleCountEl && window.pJSDom?.[0]?.pJS) {
            particleCountEl.textContent = window.pJSDom[0].pJS.particles.array.length;
        }
    }

    // Loading and Error Handling
    showLoadingScreen() {
        const loadingScreen = document.getElementById('loadingScreen');
        const progressBar = document.getElementById('progressBar');
        
        if (loadingScreen) {
            loadingScreen.classList.remove('hidden');
        }
        
        // Simulate loading progress
        let progress = 0;
        const progressInterval = setInterval(() => {
            progress += Math.random() * 30;
            if (progress > 100) progress = 100;
            
            if (progressBar) {
                progressBar.style.width = `${progress}%`;
            }
            
            if (progress >= 100) {
                clearInterval(progressInterval);
            }
        }, 200);
    }

    hideLoadingScreen() {
        setTimeout(() => {
            const loadingScreen = document.getElementById('loadingScreen');
            if (loadingScreen) {
                loadingScreen.classList.add('hidden');
            }
        }, 1000);
    }

    handleInitializationError(error) {
        console.error('Initialization error:', error);
        const loadingText = document.querySelector('.loading-text');
        if (loadingText) {
            loadingText.textContent = 'Failed to load particle system';
            loadingText.style.color = '#ff006e';
        }
    }

    startPerformanceMonitoring() {
        this.performanceMonitor.start();
    }
}

// Performance Monitor Class
class PerformanceMonitor {
    constructor() {
        this.frameCount = 0;
        this.lastTime = performance.now();
        this.fps = 60;
        this.renderTime = 16;
        this.memoryUsage = 0;
        this.gpuLoad = 0;
    }

    start() {
        this.monitorLoop();
        this.updatePerformanceDisplay();
    }

    monitorLoop() {
        const currentTime = performance.now();
        this.frameCount++;
        
        if (currentTime - this.lastTime >= 1000) {
            this.fps = Math.round((this.frameCount * 1000) / (currentTime - this.lastTime));
            this.renderTime = Math.round((currentTime - this.lastTime) / this.frameCount);
            this.frameCount = 0;
            this.lastTime = currentTime;
            
            this.updateMemoryUsage();
            this.updateGpuLoad();
            this.updatePerformanceDisplay();
        }
        
        requestAnimationFrame(() => this.monitorLoop());
    }

    updateMemoryUsage() {
        if (performance.memory) {
            this.memoryUsage = Math.round(performance.memory.usedJSHeapSize / 1024 / 1024);
        }
    }

    updateGpuLoad() {
        // Estimate GPU load based on particle count and performance
        if (window.pJSDom?.[0]?.pJS) {
            const particleCount = window.pJSDom[0].pJS.particles.array.length;
            this.gpuLoad = Math.min(100, Math.round((particleCount / 500) * 100 * (60 / this.fps)));
        }
    }

    updatePerformanceDisplay() {
        const fpsCounter = document.getElementById('fpsCounter');
        const renderTime = document.getElementById('renderTime');
        const memoryUsage = document.getElementById('memoryUsage');
        const gpuLoad = document.getElementById('gpuLoad');
        const performanceIndicator = document.getElementById('performanceIndicator');

        if (fpsCounter) fpsCounter.textContent = this.fps;
        if (renderTime) renderTime.textContent = `${this.renderTime}ms`;
        if (memoryUsage) memoryUsage.textContent = `${this.memoryUsage}MB`;
        if (gpuLoad) gpuLoad.textContent = `${this.gpuLoad}%`;

        if (performanceIndicator) {
            if (this.fps >= 55) {
                performanceIndicator.textContent = 'Optimal';
                performanceIndicator.style.color = '#00f5d4';
            } else if (this.fps >= 30) {
                performanceIndicator.textContent = 'Good';
                performanceIndicator.style.color = '#ffaa00';
            } else {
                performanceIndicator.textContent = 'Poor';
                performanceIndicator.style.color = '#ff006e';
            }
        }
    }
}

// Touch Handler Class for Mobile Support
class TouchHandler {
    constructor() {
        this.touchStartTime = 0;
        this.touchStartPos = { x: 0, y: 0 };
        this.isTouch = false;
    }

    setupTouchEvents() {
        const canvas = document.querySelector('#particles-js canvas');
        if (!canvas) return;

        // Touch start
        canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.isTouch = true;
            this.touchStartTime = Date.now();
            const touch = e.touches[0];
            this.touchStartPos = { x: touch.clientX, y: touch.clientY };
            
            this.showTouchEffect(touch.clientX, touch.clientY);
        }, { passive: false });

        // Touch move
        canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            if (!this.isTouch) return;
            
            const touch = e.touches[0];
            this.simulateMouseMove(touch.clientX, touch.clientY);
        }, { passive: false });

        // Touch end
        canvas.addEventListener('touchend', (e) => {
            e.preventDefault();
            const touchDuration = Date.now() - this.touchStartTime;
            
            if (touchDuration < 300) {
                // Quick tap - simulate click
                this.simulateClick(this.touchStartPos.x, this.touchStartPos.y);
            }
            
            this.isTouch = false;
        }, { passive: false });

        // Show touch indicator on mobile
        if (window.innerWidth <= 768) {
            setTimeout(() => {
                this.showTouchIndicator();
            }, 2000);
        }
    }

    simulateMouseMove(x, y) {
        if (window.pJSDom?.[0]?.pJS) {
            const pJS = window.pJSDom[0].pJS;
            pJS.interactivity.mouse.pos_x = x;
            pJS.interactivity.mouse.pos_y = y;
        }
    }

    simulateClick(x, y) {
        if (window.pJSDom?.[0]?.pJS) {
            const pJS = window.pJSDom[0].pJS;
            pJS.interactivity.mouse.click_pos_x = x;
            pJS.interactivity.mouse.click_pos_y = y;
            pJS.fn.modes.repulseParticle(x, y);
        }
    }

    showTouchEffect(x, y) {
        const effect = document.createElement('div');
        effect.style.cssText = `
            position: fixed;
            left: ${x - 15}px;
            top: ${y - 15}px;
            width: 30px;
            height: 30px;
            border: 2px solid var(--cyber-primary);
            border-radius: 50%;
            pointer-events: none;
            z-index: 1000;
            animation: touchRipple 0.6s ease-out forwards;
        `;
        
        document.body.appendChild(effect);
        
        setTimeout(() => {
            document.body.removeChild(effect);
        }, 600);
    }

    showTouchIndicator() {
        const indicator = document.getElementById('touchIndicator');
        if (indicator) {
            indicator.style.display = 'flex';
            setTimeout(() => {
                indicator.style.opacity = '0';
                setTimeout(() => {
                    indicator.style.display = 'none';
                }, 300);
            }, 3000);
        }
    }
}

// Add CSS for touch effects
const touchStyles = document.createElement('style');
touchStyles.textContent = `
    @keyframes touchRipple {
        0% {
            transform: scale(0);
            opacity: 1;
        }
        100% {
            transform: scale(3);
            opacity: 0;
        }
    }
`;
document.head.appendChild(touchStyles);

// Initialize the particle system when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.futuristicParticleSystem = new FuturisticParticleSystem();
});

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = FuturisticParticleSystem;
}
