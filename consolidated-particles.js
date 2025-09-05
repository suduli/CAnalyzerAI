/**
 * Consolidated Particle Systems for CAnalyzerAI
 * Combines glassmorphic-particles.js, matrix-particles.js, and light-theme-particles.js
 * Reduces file count while preserving all functionality
 */

(function() {
    'use strict';

    // === GLASSMORPHIC PARTICLE SYSTEM ===
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
                    speed: 0.002,
                    hueShift: 0.5
                },
                connections: {
                    enabled: true,
                    maxDistance: 120,
                    opacity: 0.3
                },
                mouse: {
                    repelRadius: 100,
                    repelStrength: 0.8
                }
            };
        }

        init() {
            this.canvas = document.getElementById('glassmorphic-particles');
            if (!this.canvas) return false;

            this.ctx = this.canvas.getContext('2d');
            this.resize();
            this.createParticles();
            this.bindEvents();
            this.start();
            return true;
        }

        resize() {
            this.canvas.width = window.innerWidth;
            this.canvas.height = window.innerHeight;
        }

        createParticles() {
            this.particles = [];
            for (let i = 0; i < this.config.particleCount; i++) {
                this.particles.push(this.createParticle());
            }
        }

        createParticle() {
            return {
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                vx: (Math.random() - 0.5) * (this.config.speed.max - this.config.speed.min) + this.config.speed.min,
                vy: (Math.random() - 0.5) * (this.config.speed.max - this.config.speed.min) + this.config.speed.min,
                size: Math.random() * (this.config.particleSize.max - this.config.particleSize.min) + this.config.particleSize.min,
                color: this.config.colors[Math.floor(Math.random() * this.config.colors.length)],
                life: Math.random() * 100,
                hue: Math.random() * 360
            };
        }

        updateParticle(particle) {
            // Movement
            particle.x += particle.vx;
            particle.y += particle.vy;

            // Boundary collision
            if (particle.x < 0 || particle.x > this.canvas.width) particle.vx *= -1;
            if (particle.y < 0 || particle.y > this.canvas.height) particle.vy *= -1;

            // Mouse repulsion
            const dx = this.mouse.x - particle.x;
            const dy = this.mouse.y - particle.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < this.config.mouse.repelRadius) {
                const force = (this.config.mouse.repelRadius - distance) / this.config.mouse.repelRadius;
                particle.vx -= dx * force * this.config.mouse.repelStrength * 0.01;
                particle.vy -= dy * force * this.config.mouse.repelStrength * 0.01;
            }

            // Color shifting
            if (this.config.colorShift.enabled) {
                particle.hue += this.config.colorShift.speed * 360;
                particle.hue %= 360;
            }

            particle.life += 0.5;
        }

        drawParticle(particle) {
            this.ctx.save();
            this.ctx.globalCompositeOperation = 'screen';
            
            // Gradient for glassmorphic effect
            const gradient = this.ctx.createRadialGradient(
                particle.x, particle.y, 0,
                particle.x, particle.y, particle.size * 2
            );
            
            if (this.config.colorShift.enabled) {
                gradient.addColorStop(0, `hsla(${particle.hue}, 70%, 60%, 0.8)`);
                gradient.addColorStop(1, `hsla(${particle.hue}, 70%, 60%, 0)`);
            } else {
                gradient.addColorStop(0, particle.color);
                gradient.addColorStop(1, 'transparent');
            }

            this.ctx.fillStyle = gradient;
            this.ctx.beginPath();
            this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.restore();
        }

        drawConnections() {
            if (!this.config.connections.enabled) return;

            for (let i = 0; i < this.particles.length; i++) {
                for (let j = i + 1; j < this.particles.length; j++) {
                    const dx = this.particles[i].x - this.particles[j].x;
                    const dy = this.particles[i].y - this.particles[j].y;
                    const distance = Math.sqrt(dx * dx + dy * dy);

                    if (distance < this.config.connections.maxDistance) {
                        const opacity = (1 - distance / this.config.connections.maxDistance) * this.config.connections.opacity;
                        this.ctx.strokeStyle = `rgba(124, 115, 255, ${opacity})`;
                        this.ctx.lineWidth = 1;
                        this.ctx.beginPath();
                        this.ctx.moveTo(this.particles[i].x, this.particles[i].y);
                        this.ctx.lineTo(this.particles[j].x, this.particles[j].y);
                        this.ctx.stroke();
                    }
                }
            }
        }

        animate() {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

            for (const particle of this.particles) {
                this.updateParticle(particle);
                this.drawParticle(particle);
            }

            this.drawConnections();

            if (this.isRunning) {
                this.animationId = requestAnimationFrame(() => this.animate());
            }
        }

        bindEvents() {
            window.addEventListener('resize', () => this.resize());
            
            this.canvas.addEventListener('mousemove', (e) => {
                this.mouse.x = e.clientX;
                this.mouse.y = e.clientY;
            });
        }

        start() {
            this.isRunning = true;
            this.animate();
        }

        stop() {
            this.isRunning = false;
            if (this.animationId) {
                cancelAnimationFrame(this.animationId);
            }
        }
    }

    // === MATRIX PARTICLE SYSTEM ===
    const cyberConfig = {
        particles: {
            number: {
                value: 150,
                density: {
                    enable: true,
                    value_area: 800
                }
            },
            color: {
                value: ["#00f5d4", "#6c63ff", "#ff006e"]
            },
            shape: {
                type: "circle",
                stroke: {
                    width: 1,
                    color: "#000000"
                }
            },
            opacity: {
                value: 0.8,
                random: true,
                anim: {
                    enable: true,
                    speed: 1,
                    opacity_min: 0.3,
                    sync: false
                }
            },
            size: {
                value: 4,
                random: true,
                anim: {
                    enable: true,
                    speed: 4,
                    size_min: 1,
                    sync: false
                }
            },
            line_linked: {
                enable: true,
                distance: 150,
                color: "#6c63ff",
                opacity: 0.4,
                width: 1
            },
            move: {
                enable: true,
                speed: 2,
                direction: "none",
                random: true,
                straight: false,
                out_mode: "out",
                bounce: false,
                attract: {
                    enable: false,
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
                    mode: "repulse"
                },
                onclick: {
                    enable: true,
                    mode: "push"
                },
                resize: true
            },
            modes: {
                grab: {
                    distance: 140,
                    line_linked: {
                        opacity: 1
                    }
                },
                bubble: {
                    distance: 400,
                    size: 40,
                    duration: 2,
                    opacity: 8,
                    speed: 3
                },
                repulse: {
                    distance: 200,
                    duration: 0.4
                },
                push: {
                    particles_nb: 4
                },
                remove: {
                    particles_nb: 2
                }
            }
        },
        retina_detect: true
    };

    // === LIGHT THEME PARTICLES ===
    const CONFIG_CANDIDATES = [
        'tests/data/particlesjs-config.json',
        '/tests/data/particlesjs-config.json',
        'particlesjs-config.json',
        '/particlesjs-config.json'
    ];
    const CONTAINER_ID = 'light-particles-js';
    let config = null;
    let isInitialized = false;

    // Helper: dynamically ensure particles.js is loaded
    function ensureParticlesLib(onReady) {
        if (typeof particlesJS !== 'undefined') { onReady && onReady(); return; }

        if (window.__particlesLibLoadingLight) {
            const check = () => {
                if (typeof particlesJS !== 'undefined') onReady && onReady();
                else setTimeout(check, 100);
            };
            check();
            return;
        }

        window.__particlesLibLoadingLight = true;
        const sources = [
            'https://cdnjs.cloudflare.com/ajax/libs/particles.js/2.0.0/particles.min.js',
            'https://unpkg.com/particles.js@2.0.0/particles.min.js'
        ];

        let idx = 0;
        const tryNext = () => {
            if (typeof particlesJS !== 'undefined') { onReady && onReady(); return; }
            if (idx >= sources.length) { console.warn('particles.js could not be loaded from fallback CDNs (light)'); return; }

            const src = sources[idx++];
            const s = document.createElement('script');
            s.src = src;
            s.async = true;
            s.onload = () => { console.log('Loaded particles.js from', src); onReady && onReady(); };
            s.onerror = () => { console.warn('Failed to load', src); tryNext(); };
            document.head.appendChild(s);
        };
        tryNext();
    }

    async function fetchConfig() {
        if (config) return config;

        for (const candidate of CONFIG_CANDIDATES) {
            try {
                const response = await fetch(candidate);
                if (response.ok) {
                    config = await response.json();
                    console.log('Light theme particles config loaded from:', candidate);
                    return config;
                }
            } catch (e) {
                // Silently continue to next candidate
            }
        }

        // Default configuration if no external config is found
        config = {
            particles: {
                number: { value: 80, density: { enable: true, value_area: 800 } },
                color: { value: "#e0e7ff" },
                shape: { type: "circle" },
                opacity: { value: 0.5, random: false },
                size: { value: 3, random: true },
                line_linked: { enable: true, distance: 150, color: "#e0e7ff", opacity: 0.4, width: 1 },
                move: { enable: true, speed: 6, direction: "none", random: false, straight: false, out_mode: "out", bounce: false }
            },
            interactivity: {
                detect_on: "canvas",
                events: { onhover: { enable: true, mode: "repulse" }, onclick: { enable: true, mode: "push" }, resize: true },
                modes: { repulse: { distance: 200, duration: 0.4 }, push: { particles_nb: 4 } }
            },
            retina_detect: true
        };
        console.log('Using default light theme particles config');
        return config;
    }

    function initParticles() {
        if (isInitialized || !document.getElementById(CONTAINER_ID)) return;

        ensureParticlesLib(async () => {
            if (typeof particlesJS === 'undefined') return;

            const cfg = await fetchConfig();
            if (cfg) {
                particlesJS(CONTAINER_ID, cfg);
                isInitialized = true;
                console.log('Light theme particles initialized');
            }
        });
    }

    function checkAndInitialize() {
        const theme = document.documentElement.getAttribute('data-theme') || 'dark';
        const container = document.getElementById(CONTAINER_ID);

        if (theme === 'light' && container) {
            container.style.display = 'block';
            if (!isInitialized) {
                initParticles();
            }
        } else if (container) {
            container.style.display = 'none';
        }
    }

    // === INITIALIZATION ===
    document.addEventListener('DOMContentLoaded', () => {
        // Initialize glassmorphic particles
        const glassmorphicSystem = new GlassmorphicParticleSystem();
        glassmorphicSystem.init();

        // Initialize matrix particles
        if (typeof particlesJS !== 'undefined') {
            particlesJS('particles-js', cyberConfig);
        } else {
            // Wait for particles.js to load
            const checkParticlesJS = setInterval(() => {
                if (typeof particlesJS !== 'undefined') {
                    particlesJS('particles-js', cyberConfig);
                    clearInterval(checkParticlesJS);
                }
            }, 100);
        }

        // Initialize light theme particles
        checkAndInitialize();

        // Listen for theme changes
        document.addEventListener('themechange', checkAndInitialize);
        
        // Monitor data-theme attribute changes
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'attributes' && mutation.attributeName === 'data-theme') {
                    checkAndInitialize();
                }
            });
        });
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    });

    // Global access for compatibility
    window.GlassmorphicParticleSystem = GlassmorphicParticleSystem;
})();