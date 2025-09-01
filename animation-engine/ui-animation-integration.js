/**
 * Animation Integration Examples
 * Demonstrates how to integrate the animation system with existing UI
 */

class UIAnimationIntegrator {
    constructor() {
        this.animationEngine = null;
        this.particleSystem = null;
        this.isInitialized = false;
        this.activeAnimations = new Map();
        this.uiElements = new Map();
        this.backgroundEffects = [];
        
        // Animation presets
        this.presets = {
            themeTransition: {
                duration: 800,
                easing: 'easeOutCubic'
            },
            buttonHover: {
                duration: 200,
                easing: 'easeOutQuad'
            },
            pageLoad: {
                duration: 1200,
                easing: 'easeOutExpo'
            },
            notification: {
                duration: 300,
                easing: 'easeOutBack'
            }
        };
    }

    async initialize(canvasId = 'animation-canvas') {
        try {
            // Create canvas if it doesn't exist
            let canvas = document.getElementById(canvasId);
            if (!canvas) {
                canvas = this.createAnimationCanvas(canvasId);
            }

            // Initialize animation engine
            this.animationEngine = new AnimationEngine(canvas, {
                pixelRatio: window.devicePixelRatio || 1,
                antialias: true,
                alpha: true,
                premultipliedAlpha: false
            });

            // Initialize particle system
            this.particleSystem = this.animationEngine.createParticleSystem('ui-particles', {
                maxParticles: 500,
                useObjectPooling: true,
                cullingEnabled: true
            });

            // Setup event listeners
            this.setupEventListeners();
            
            // Start the animation loop
            this.animationEngine.start();

            this.isInitialized = true;
            console.log('UI Animation System initialized successfully');
            
            return true;
        } catch (error) {
            console.error('Failed to initialize UI Animation System:', error);
            return false;
        }
    }

    createAnimationCanvas(id) {
        const canvas = document.createElement('canvas');
        canvas.id = id;
        canvas.style.position = 'fixed';
        canvas.style.top = '0';
        canvas.style.left = '0';
        canvas.style.width = '100%';
        canvas.style.height = '100%';
        canvas.style.pointerEvents = 'none';
        canvas.style.zIndex = '1000';
        canvas.style.opacity = '0.9';
        
        document.body.appendChild(canvas);
        return canvas;
    }

    setupEventListeners() {
        // Theme toggle animation
        const themeToggle = document.querySelector('.theme-toggle, #theme-toggle, .theme-switch');
        if (themeToggle) {
            themeToggle.addEventListener('click', (e) => {
                this.animateThemeTransition(e.target);
            });
        }

        // Button hover effects
        document.querySelectorAll('button, .btn, .button').forEach(button => {
            button.addEventListener('mouseenter', (e) => {
                this.animateButtonHover(e.target, true);
            });
            
            button.addEventListener('mouseleave', (e) => {
                this.animateButtonHover(e.target, false);
            });
            
            button.addEventListener('click', (e) => {
                this.animateButtonClick(e.target, e);
            });
        });

        // Form input focus effects
        document.querySelectorAll('input, textarea, select').forEach(input => {
            input.addEventListener('focus', (e) => {
                this.animateInputFocus(e.target, true);
            });
            
            input.addEventListener('blur', (e) => {
                this.animateInputFocus(e.target, false);
            });
        });

        // Scroll effects
        window.addEventListener('scroll', () => {
            this.updateScrollEffects();
        });

        // Resize handler
        window.addEventListener('resize', () => {
            this.handleResize();
        });

        // Page load animation
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                this.animatePageLoad();
            });
        } else {
            setTimeout(() => this.animatePageLoad(), 100);
        }
    }

    animateThemeTransition(toggleElement) {
        if (!this.isInitialized) return;

        // Get current theme
        const isDark = document.body.classList.contains('dark-theme') || 
                      document.documentElement.getAttribute('data-theme') === 'dark';

        // Create ripple effect from toggle button
        const rect = toggleElement.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        this.createRippleEffect(centerX, centerY, isDark);

        // Animate background color transition
        this.animateBackgroundTransition(isDark);

        // Create particle burst effect
        this.createThemeParticles(centerX, centerY, isDark);

        // Animate UI elements
        this.animateUIElements(isDark);
    }

    createRippleEffect(x, y, isDark) {
        const maxRadius = Math.max(window.innerWidth, window.innerHeight) * 1.5;
        const color = isDark ? 'rgba(45, 45, 45, 0.8)' : 'rgba(255, 255, 255, 0.8)';

        // Create expanding circle animation
        const ripple = this.animationEngine.createPropertyAnimation('theme-ripple', {
            target: { radius: 0, opacity: 0.8 },
            properties: {
                radius: { to: maxRadius, easing: 'easeOutCubic' },
                opacity: { to: 0, easing: 'easeOutQuad', delay: 400 }
            },
            duration: 800,
            onUpdate: (values) => {
                this.animationEngine.context.save();
                this.animationEngine.context.globalAlpha = values.opacity;
                this.animationEngine.context.fillStyle = color;
                this.animationEngine.context.beginPath();
                this.animationEngine.context.arc(x, y, values.radius, 0, Math.PI * 2);
                this.animationEngine.context.fill();
                this.animationEngine.context.restore();
            },
            onComplete: () => {
                this.animationEngine.removePropertyAnimation('theme-ripple');
            }
        });

        ripple.start();
    }

    createThemeParticles(x, y, isDark) {
        // Create particle emitter at toggle position
        const emitter = this.particleSystem.createEmitter({
            x, y,
            shape: 'circle',
            width: 30,
            burstCount: 20,
            particleLife: { min: 1, max: 2 },
            particleSize: { min: 2, max: 6 },
            particleColor: isDark ? '#4a9eff' : '#ffd700',
            particleOpacity: { min: 0.6, max: 1 },
            velocity: {
                x: { min: -100, max: 100 },
                y: { min: -100, max: 100 }
            },
            friction: 0.05,
            gravity: 50,
            opacityOverTime: { end: 0 },
            scaleOverTime: { end: 0.2 }
        });

        emitter.burst(this.particleSystem);

        // Remove emitter after burst
        setTimeout(() => {
            const index = this.particleSystem.emitters.indexOf(emitter);
            if (index > -1) {
                this.particleSystem.emitters.splice(index, 1);
            }
        }, 3000);
    }

    animateBackgroundTransition(isDark) {
        // Animate body background with smooth transition
        const fromColor = isDark ? '#ffffff' : '#1a1a1a';
        const toColor = isDark ? '#1a1a1a' : '#ffffff';

        this.animationEngine.createPropertyAnimation('bg-transition', {
            target: { progress: 0 },
            properties: {
                progress: { to: 1, easing: 'easeOutCubic' }
            },
            duration: 600,
            onUpdate: (values) => {
                const color = this.interpolateColor(fromColor, toColor, values.progress);
                document.body.style.backgroundColor = color;
            },
            onComplete: () => {
                this.animationEngine.removePropertyAnimation('bg-transition');
            }
        }).start();
    }

    animateUIElements(isDark) {
        // Animate all UI elements with staggered timing
        const elements = document.querySelectorAll('.card, .section, .header, .footer, .sidebar');
        
        elements.forEach((element, index) => {
            const delay = index * 50; // Stagger animation
            
            setTimeout(() => {
                element.style.transition = 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)';
                element.style.transform = 'translateY(-2px)';
                
                setTimeout(() => {
                    element.style.transform = 'translateY(0)';
                    setTimeout(() => {
                        element.style.transition = '';
                    }, 400);
                }, 100);
            }, delay);
        });
    }

    animateButtonHover(button, isEntering) {
        const animationId = `button-hover-${button.dataset.animId || Date.now()}`;
        
        if (!button.dataset.animId) {
            button.dataset.animId = Date.now().toString();
        }

        // Cancel previous animation
        if (this.activeAnimations.has(animationId)) {
            this.animationEngine.removePropertyAnimation(animationId);
        }

        const rect = button.getBoundingClientRect();
        const scale = isEntering ? 1.05 : 1;
        const brightness = isEntering ? 1.1 : 1;

        const animation = this.animationEngine.createPropertyAnimation(animationId, {
            target: { 
                scale: isEntering ? 1 : 1.05,
                brightness: isEntering ? 1 : 1.1
            },
            properties: {
                scale: { to: scale, easing: 'easeOutQuad' },
                brightness: { to: brightness, easing: 'easeOutQuad' }
            },
            duration: this.presets.buttonHover.duration,
            onUpdate: (values) => {
                button.style.transform = `scale(${values.scale})`;
                button.style.filter = `brightness(${values.brightness})`;
            },
            onComplete: () => {
                this.activeAnimations.delete(animationId);
            }
        });

        this.activeAnimations.set(animationId, animation);
        animation.start();
    }

    animateButtonClick(button, event) {
        const rect = button.getBoundingClientRect();
        const x = event.clientX;
        const y = event.clientY;

        // Create click ripple effect
        this.createClickRipple(x, y, button);

        // Create sparkle particles
        const emitter = this.particleSystem.createEmitter({
            x, y,
            shape: 'point',
            burstCount: 8,
            particleLife: { min: 0.3, max: 0.8 },
            particleSize: { min: 1, max: 3 },
            particleColor: '#4a9eff',
            particleOpacity: { min: 0.7, max: 1 },
            velocity: {
                x: { min: -40, max: 40 },
                y: { min: -40, max: 40 }
            },
            friction: 0.1,
            opacityOverTime: { end: 0 }
        });

        emitter.burst(this.particleSystem);

        // Remove emitter after effect
        setTimeout(() => {
            const index = this.particleSystem.emitters.indexOf(emitter);
            if (index > -1) {
                this.particleSystem.emitters.splice(index, 1);
            }
        }, 1000);
    }

    createClickRipple(x, y, element) {
        const rippleId = `click-ripple-${Date.now()}`;
        
        const animation = this.animationEngine.createPropertyAnimation(rippleId, {
            target: { radius: 0, opacity: 0.3 },
            properties: {
                radius: { to: 50, easing: 'easeOutQuad' },
                opacity: { to: 0, easing: 'easeOutQuad' }
            },
            duration: 400,
            onUpdate: (values) => {
                this.animationEngine.context.save();
                this.animationEngine.context.globalAlpha = values.opacity;
                this.animationEngine.context.fillStyle = '#4a9eff';
                this.animationEngine.context.beginPath();
                this.animationEngine.context.arc(x, y, values.radius, 0, Math.PI * 2);
                this.animationEngine.context.fill();
                this.animationEngine.context.restore();
            },
            onComplete: () => {
                this.animationEngine.removePropertyAnimation(rippleId);
            }
        });

        animation.start();
    }

    animateInputFocus(input, isFocusing) {
        const animationId = `input-focus-${input.dataset.animId || Date.now()}`;
        
        if (!input.dataset.animId) {
            input.dataset.animId = Date.now().toString();
        }

        const borderColor = isFocusing ? '#4a9eff' : '#ccc';
        const glowIntensity = isFocusing ? 1 : 0;

        const animation = this.animationEngine.createPropertyAnimation(animationId, {
            target: { 
                glow: isFocusing ? 0 : 1
            },
            properties: {
                glow: { to: glowIntensity, easing: 'easeOutQuad' }
            },
            duration: 200,
            onUpdate: (values) => {
                input.style.borderColor = borderColor;
                input.style.boxShadow = `0 0 ${values.glow * 8}px rgba(74, 158, 255, ${values.glow * 0.3})`;
            },
            onComplete: () => {
                this.animationEngine.removePropertyAnimation(animationId);
            }
        });

        animation.start();
    }

    animatePageLoad() {
        // Create welcome particle effect
        this.createWelcomeEffect();

        // Animate elements appearing
        const elements = document.querySelectorAll('header, main, .card, .section');
        elements.forEach((element, index) => {
            const delay = index * 100;
            
            element.style.opacity = '0';
            element.style.transform = 'translateY(20px)';
            
            setTimeout(() => {
                element.style.transition = 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)';
                element.style.opacity = '1';
                element.style.transform = 'translateY(0)';
                
                setTimeout(() => {
                    element.style.transition = '';
                }, 600);
            }, delay);
        });
    }

    createWelcomeEffect() {
        const centerX = window.innerWidth / 2;
        const centerY = window.innerHeight / 2;

        // Create burst of welcome particles
        const emitter = this.particleSystem.createEmitter({
            x: centerX,
            y: centerY,
            shape: 'circle',
            width: 100,
            burstCount: 30,
            particleLife: { min: 2, max: 4 },
            particleSize: { min: 2, max: 8 },
            particleColor: '#4a9eff',
            particleOpacity: { min: 0.4, max: 0.8 },
            velocity: {
                x: { min: -150, max: 150 },
                y: { min: -150, max: 150 }
            },
            friction: 0.02,
            gravity: 30,
            opacityOverTime: { end: 0 },
            scaleOverTime: { end: 0.3 }
        });

        emitter.burst(this.particleSystem);

        // Remove emitter after effect
        setTimeout(() => {
            const index = this.particleSystem.emitters.indexOf(emitter);
            if (index > -1) {
                this.particleSystem.emitters.splice(index, 1);
            }
        }, 5000);
    }

    updateScrollEffects() {
        const scrollY = window.scrollY;
        const maxScroll = document.body.scrollHeight - window.innerHeight;
        const scrollProgress = Math.min(scrollY / maxScroll, 1);

        // Update parallax effects or scroll-based animations here
        this.updateBackgroundEffects(scrollProgress);
    }

    updateBackgroundEffects(scrollProgress) {
        // Add subtle background particle effects based on scroll
        if (this.backgroundEffects.length === 0 && scrollProgress > 0.1) {
            this.createBackgroundParticles();
        }
    }

    createBackgroundParticles() {
        // Create subtle ambient particles
        const emitter = this.particleSystem.createEmitter({
            x: Math.random() * window.innerWidth,
            y: -10,
            shape: 'line',
            width: window.innerWidth,
            emissionRate: 2,
            maxParticles: 20,
            particleLife: { min: 8, max: 15 },
            particleSize: { min: 1, max: 2 },
            particleColor: '#4a9eff',
            particleOpacity: { min: 0.1, max: 0.3 },
            velocity: {
                x: { min: -5, max: 5 },
                y: { min: 10, max: 30 }
            },
            friction: 0.001
        });

        this.backgroundEffects.push(emitter);
    }

    handleResize() {
        if (this.animationEngine) {
            this.animationEngine.resize();
        }
    }

    // Utility methods
    interpolateColor(color1, color2, t) {
        const c1 = this.hexToRgb(color1);
        const c2 = this.hexToRgb(color2);
        
        const r = Math.round(c1.r + (c2.r - c1.r) * t);
        const g = Math.round(c1.g + (c2.g - c1.g) * t);
        const b = Math.round(c1.b + (c2.b - c1.b) * t);
        
        return `rgb(${r}, ${g}, ${b})`;
    }

    hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : { r: 0, g: 0, b: 0 };
    }

    // Public API methods
    createCustomEffect(effectConfig) {
        return this.particleSystem.createEmitter(effectConfig);
    }

    addNotificationEffect(element, type = 'success') {
        const rect = element.getBoundingClientRect();
        const colors = {
            success: '#22c55e',
            error: '#ef4444',
            warning: '#f59e0b',
            info: '#3b82f6'
        };

        const emitter = this.particleSystem.createEmitter({
            x: rect.left + rect.width / 2,
            y: rect.top + rect.height / 2,
            shape: 'circle',
            width: 20,
            burstCount: 15,
            particleLife: { min: 0.8, max: 1.5 },
            particleSize: { min: 2, max: 5 },
            particleColor: colors[type] || colors.info,
            particleOpacity: { min: 0.7, max: 1 },
            velocity: {
                x: { min: -60, max: 60 },
                y: { min: -60, max: 60 }
            },
            friction: 0.08,
            opacityOverTime: { end: 0 }
        });

        emitter.burst(this.particleSystem);

        setTimeout(() => {
            const index = this.particleSystem.emitters.indexOf(emitter);
            if (index > -1) {
                this.particleSystem.emitters.splice(index, 1);
            }
        }, 2000);
    }

    destroy() {
        if (this.animationEngine) {
            this.animationEngine.stop();
            this.animationEngine.destroy();
        }
        
        const canvas = document.getElementById('animation-canvas');
        if (canvas) {
            canvas.remove();
        }
        
        this.isInitialized = false;
    }
}

// Auto-initialize when DOM is ready
let uiAnimationIntegrator = null;

function initializeUIAnimations() {
    if (!uiAnimationIntegrator) {
        uiAnimationIntegrator = new UIAnimationIntegrator();
        uiAnimationIntegrator.initialize().then(success => {
            if (success) {
                console.log('UI animations ready!');
                
                // Add global reference for easy access
                window.UIAnimations = uiAnimationIntegrator;
            }
        });
    }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeUIAnimations);
} else {
    initializeUIAnimations();
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { UIAnimationIntegrator };
} else if (typeof window !== 'undefined') {
    window.UIAnimationIntegrator = UIAnimationIntegrator;
}
