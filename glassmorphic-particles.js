/**
 * Glassmorphic Particle System
 * Creates a dynamic, visually stunning particle background with color-shifting effects
 * Integrates seamlessly with glassmorphic UI elements
 */

class GlassmorphicParticleSystem {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.particles = [];
        this.mouse = { x: 0, y: 0 };
        this.animationId = null;
        this.isRunning = false;
        
        // Configuration
        this.config = {
            particleCount: 60,
            particleSize: { min: 2, max: 6 },
            speed: { min: 0.2, max: 1.5 },
            colors: [
                'rgba(124, 115, 255, 0.6)',  // Primary purple
                'rgba(31, 245, 212, 0.5)',   // Cyan
                'rgba(255, 26, 255, 0.4)',   // Magenta
                'rgba(30, 64, 175, 0.5)',    // Blue
                'rgba(147, 51, 234, 0.4)',   // Purple
                'rgba(59, 130, 246, 0.5)'    // Light blue
            ],
            colorShift: {
                enabled: true,
                speed: 0.01,
                intensity: 0.3
            },
            connections: {
                enabled: true,
                maxDistance: 150,
                opacity: 0.15
            },
            mouse: {
                attraction: true,
                repulsion: false,
                radius: 100,
                strength: 0.5
            },
            glow: {
                enabled: true,
                intensity: 15,
                blur: 20
            }
        };
        
        this.colorPhase = 0;
        this.init();
    }

    init() {
        this.createCanvas();
        this.createParticles();
        this.setupEventListeners();
        this.start();
    }

    createCanvas() {
        // Create or get existing canvas
        this.canvas = document.getElementById('glassmorphic-particles');
        if (!this.canvas) {
            this.canvas = document.createElement('canvas');
            this.canvas.id = 'glassmorphic-particles';
            this.canvas.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                z-index: -1;
                pointer-events: none;
                background: transparent;
            `;
            document.body.insertBefore(this.canvas, document.body.firstChild);
        }
        
        this.ctx = this.canvas.getContext('2d');
        this.resize();
    }

    createParticles() {
        this.particles = [];
        for (let i = 0; i < this.config.particleCount; i++) {
            this.particles.push(new GlassmorphicParticle(this.canvas, this.config));
        }
    }

    setupEventListeners() {
        window.addEventListener('resize', () => this.resize());
        
        if (this.config.mouse.attraction || this.config.mouse.repulsion) {
            document.addEventListener('mousemove', (e) => {
                this.mouse.x = e.clientX;
                this.mouse.y = e.clientY;
            });
        }

        // Theme change listener
        document.addEventListener('themeChanged', (e) => {
            this.adaptToTheme(e.detail.theme);
        });
    }

    resize() {
        const dpr = window.devicePixelRatio || 1;
        this.canvas.width = window.innerWidth * dpr;
        this.canvas.height = window.innerHeight * dpr;
        this.canvas.style.width = window.innerWidth + 'px';
        this.canvas.style.height = window.innerHeight + 'px';
        this.ctx.scale(dpr, dpr);
    }

    start() {
        if (!this.isRunning) {
            this.isRunning = true;
            this.animate();
        }
    }

    stop() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
        this.isRunning = false;
    }

    animate() {
        if (!this.isRunning) return;

        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Update color phase for dynamic color shifting
        this.colorPhase += this.config.colorShift.speed;
        
        // Update and draw particles
        this.particles.forEach(particle => {
            particle.update(this.mouse, this.colorPhase);
            particle.draw(this.ctx);
        });

        // Draw connections between particles
        if (this.config.connections.enabled) {
            this.drawConnections();
        }

        this.animationId = requestAnimationFrame(() => this.animate());
    }

    drawConnections() {
        for (let i = 0; i < this.particles.length; i++) {
            for (let j = i + 1; j < this.particles.length; j++) {
                const dx = this.particles[i].x - this.particles[j].x;
                const dy = this.particles[i].y - this.particles[j].y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < this.config.connections.maxDistance) {
                    const opacity = (1 - distance / this.config.connections.maxDistance) * this.config.connections.opacity;
                    
                    this.ctx.save();
                    this.ctx.strokeStyle = `rgba(124, 115, 255, ${opacity})`;
                    this.ctx.lineWidth = 1;
                    this.ctx.beginPath();
                    this.ctx.moveTo(this.particles[i].x, this.particles[i].y);
                    this.ctx.lineTo(this.particles[j].x, this.particles[j].y);
                    this.ctx.stroke();
                    this.ctx.restore();
                }
            }
        }
    }

    adaptToTheme(theme) {
        if (theme === 'light') {
            this.config.colors = [
                'rgba(30, 64, 175, 0.4)',    // Primary blue
                'rgba(37, 99, 235, 0.3)',    // Blue
                'rgba(59, 130, 246, 0.3)',   // Light blue
                'rgba(107, 33, 168, 0.3)',   // Purple
                'rgba(147, 51, 234, 0.2)',   // Light purple
                'rgba(0, 82, 163, 0.3)'      // Dark blue
            ];
            this.config.connections.opacity = 0.1;
            this.config.glow.intensity = 8;
        } else {
            this.config.colors = [
                'rgba(124, 115, 255, 0.6)',  // Primary purple
                'rgba(31, 245, 212, 0.5)',   // Cyan
                'rgba(255, 26, 255, 0.4)',   // Magenta
                'rgba(30, 64, 175, 0.5)',    // Blue
                'rgba(147, 51, 234, 0.4)',   // Purple
                'rgba(59, 130, 246, 0.5)'    // Light blue
            ];
            this.config.connections.opacity = 0.15;
            this.config.glow.intensity = 15;
        }
        
        // Update existing particles with new colors
        this.particles.forEach(particle => {
            particle.updateTheme(this.config);
        });
    }

    // Public API methods
    setParticleCount(count) {
        this.config.particleCount = Math.max(10, Math.min(200, count));
        this.createParticles();
    }

    setSpeed(speed) {
        this.config.speed.min = speed * 0.2;
        this.config.speed.max = speed * 1.5;
        this.particles.forEach(particle => particle.updateSpeed(this.config.speed));
    }

    toggleConnections(enabled) {
        this.config.connections.enabled = enabled;
    }

    setGlowIntensity(intensity) {
        this.config.glow.intensity = intensity;
    }

    destroy() {
        this.stop();
        if (this.canvas && this.canvas.parentNode) {
            this.canvas.parentNode.removeChild(this.canvas);
        }
    }
}

class GlassmorphicParticle {
    constructor(canvas, config) {
        this.canvas = canvas;
        this.reset(config);
        this.colorIndex = Math.floor(Math.random() * config.colors.length);
        this.colorPhaseOffset = Math.random() * Math.PI * 2;
        this.pulsePeriod = 2 + Math.random() * 3; // 2-5 seconds
        this.pulseOffset = Math.random() * Math.PI * 2;
    }

    reset(config) {
        this.x = Math.random() * this.canvas.width;
        this.y = Math.random() * this.canvas.height;
        this.baseSize = config.particleSize.min + Math.random() * (config.particleSize.max - config.particleSize.min);
        this.size = this.baseSize;
        this.vx = (Math.random() - 0.5) * (config.speed.max - config.speed.min) + config.speed.min;
        this.vy = (Math.random() - 0.5) * (config.speed.max - config.speed.min) + config.speed.min;
        this.opacity = 0.3 + Math.random() * 0.7;
        this.life = Math.random();
        this.maxLife = 0.8 + Math.random() * 0.2;
    }

    update(mouse, colorPhase) {
        // Movement
        this.x += this.vx;
        this.y += this.vy;

        // Wrap around screen edges
        if (this.x < 0) this.x = this.canvas.width;
        if (this.x > this.canvas.width) this.x = 0;
        if (this.y < 0) this.y = this.canvas.height;
        if (this.y > this.canvas.height) this.y = 0;

        // Mouse interaction
        if (mouse.x && mouse.y) {
            const dx = mouse.x - this.x;
            const dy = mouse.y - this.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < 100) {
                const force = (100 - distance) / 100;
                this.vx += (dx / distance) * force * 0.01;
                this.vy += (dy / distance) * force * 0.01;
            }
        }

        // Apply velocity damping
        this.vx *= 0.99;
        this.vy *= 0.99;

        // Pulsing size effect
        this.life += 0.01;
        const pulse = Math.sin(this.life * this.pulsePeriod + this.pulseOffset) * 0.3 + 1;
        this.size = this.baseSize * pulse;

        // Color shifting
        this.currentColorPhase = colorPhase + this.colorPhaseOffset;
    }

    draw(ctx) {
        ctx.save();
        
        // Glow effect
        const gradient = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.size * 3);
        
        // Dynamic color with phase shifting
        const hue = (this.currentColorPhase * 180 / Math.PI + this.colorIndex * 60) % 360;
        const saturation = 70 + Math.sin(this.currentColorPhase) * 20;
        const lightness = 50 + Math.sin(this.currentColorPhase * 1.5) * 15;
        
        gradient.addColorStop(0, `hsla(${hue}, ${saturation}%, ${lightness}%, ${this.opacity})`);
        gradient.addColorStop(0.4, `hsla(${hue}, ${saturation}%, ${lightness}%, ${this.opacity * 0.6})`);
        gradient.addColorStop(1, `hsla(${hue}, ${saturation}%, ${lightness}%, 0)`);
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size * 3, 0, Math.PI * 2);
        ctx.fill();
        
        // Core particle
        ctx.fillStyle = `hsla(${hue}, ${saturation + 10}%, ${lightness + 20}%, ${this.opacity * 1.2})`;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
    }

    updateSpeed(speedConfig) {
        const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
        const angle = Math.atan2(this.vy, this.vx);
        const newSpeed = speedConfig.min + Math.random() * (speedConfig.max - speedConfig.min);
        this.vx = Math.cos(angle) * newSpeed;
        this.vy = Math.sin(angle) * newSpeed;
    }

    updateTheme(config) {
        this.colorIndex = Math.floor(Math.random() * config.colors.length);
    }
}

// Initialize the glassmorphic particle system
let glassmorphicParticles;

document.addEventListener('DOMContentLoaded', () => {
    // Small delay to ensure page is fully loaded
    setTimeout(() => {
        glassmorphicParticles = new GlassmorphicParticleSystem();
        
        // Listen for theme changes
        const themeObserver = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'attributes' && mutation.attributeName === 'data-theme') {
                    const theme = document.documentElement.getAttribute('data-theme') || 'dark';
                    glassmorphicParticles.adaptToTheme(theme);
                }
            });
        });
        
        themeObserver.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ['data-theme']
        });
        
        // Initial theme detection
        const currentTheme = document.documentElement.getAttribute('data-theme') || 
                           (localStorage.getItem('theme') === 'light' ? 'light' : 'dark');
        glassmorphicParticles.adaptToTheme(currentTheme);
        
    }, 100);
});

// Global access
window.glassmorphicParticles = glassmorphicParticles;

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { GlassmorphicParticleSystem, GlassmorphicParticle };
}
