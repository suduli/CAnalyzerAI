/**
 * Enhanced Animated Sprites/Images Implementation
 * Comprehensive Animation System with Advanced Features
 * Author: CAnalyzerAI Enhanced Animation Engine
 * Version: 2.0.0
 */

class AnimationEngine {
    constructor(options = {}) {
        this.version = '2.0.0';
        this.canvas = null;
        this.context = null;
        this.sprites = new Map();
        this.animations = new Map();
        this.timelines = new Map();
        this.particleSystems = new Map();
        this.textureAtlas = new Map();
        this.animationGroups = new Map();
        
        // Performance optimization settings
        this.settings = {
            maxFPS: options.maxFPS || 60,
            useRequestAnimationFrame: options.useRequestAnimationFrame !== false,
            enableBatching: options.enableBatching !== false,
            enableAtlasing: options.enableAtlasing !== false,
            enableCulling: options.enableCulling !== false,
            cullPadding: options.cullPadding || 50,
            pixelRatio: window.devicePixelRatio || 1,
            antialias: options.antialias !== false,
            preserveDrawingBuffer: options.preserveDrawingBuffer || false,
            powerPreference: options.powerPreference || 'high-performance'
        };

        // Animation state
        this.isRunning = false;
        this.lastTime = 0;
        this.deltaTime = 0;
        this.frameCount = 0;
        this.fps = 0;
        this.fpsCounter = 0;
        this.fpsTime = 0;

        // Render queues for optimization
        this.renderQueue = [];
        this.batchQueue = new Map();
        
        // Event system
        this.eventListeners = new Map();
        
        this.init();
    }

    init() {
        this.log('🎮 Initializing Enhanced Animation Engine v' + this.version);
        this.setupCanvas();
        this.setupEasingFunctions();
        this.setupEventSystem();
        this.preloadCommonAssets();
    }

    setupCanvas() {
        // Create or get existing canvas
        this.canvas = document.getElementById('animation-canvas') || document.createElement('canvas');
        if (!document.getElementById('animation-canvas')) {
            this.canvas.id = 'animation-canvas';
            this.canvas.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                pointer-events: none;
                z-index: 1000;
                background: transparent;
            `;
            document.body.appendChild(this.canvas);
        }

        // Setup context with optimizations
        this.context = this.canvas.getContext('2d', {
            alpha: true,
            antialias: this.settings.antialias,
            preserveDrawingBuffer: this.settings.preserveDrawingBuffer,
            powerPreference: this.settings.powerPreference
        });

        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
    }

    resizeCanvas() {
        const rect = this.canvas.getBoundingClientRect();
        const pixelRatio = this.settings.pixelRatio;
        
        this.canvas.width = rect.width * pixelRatio;
        this.canvas.height = rect.height * pixelRatio;
        this.canvas.style.width = rect.width + 'px';
        this.canvas.style.height = rect.height + 'px';
        
        this.context.scale(pixelRatio, pixelRatio);
        this.context.imageSmoothingEnabled = true;
        this.context.imageSmoothingQuality = 'high';
    }

    setupEasingFunctions() {
        this.easingFunctions = {
            linear: t => t,
            easeInQuad: t => t * t,
            easeOutQuad: t => t * (2 - t),
            easeInOutQuad: t => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
            easeInCubic: t => t * t * t,
            easeOutCubic: t => (--t) * t * t + 1,
            easeInOutCubic: t => t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1,
            easeInQuart: t => t * t * t * t,
            easeOutQuart: t => 1 - (--t) * t * t * t,
            easeInOutQuart: t => t < 0.5 ? 8 * t * t * t * t : 1 - 8 * (--t) * t * t * t,
            easeInSine: t => 1 - Math.cos(t * Math.PI / 2),
            easeOutSine: t => Math.sin(t * Math.PI / 2),
            easeInOutSine: t => -(Math.cos(Math.PI * t) - 1) / 2,
            easeInExpo: t => t === 0 ? 0 : Math.pow(2, 10 * (t - 1)),
            easeOutExpo: t => t === 1 ? 1 : 1 - Math.pow(2, -10 * t),
            easeInOutExpo: t => {
                if (t === 0) return 0;
                if (t === 1) return 1;
                if (t < 0.5) return Math.pow(2, 20 * t - 10) / 2;
                return (2 - Math.pow(2, -20 * t + 10)) / 2;
            },
            easeInBack: t => 2.70158 * t * t * t - 1.70158 * t * t,
            easeOutBack: t => 1 + 2.70158 * Math.pow(t - 1, 3) + 1.70158 * Math.pow(t - 1, 2),
            easeInOutBack: t => {
                const c1 = 1.70158;
                const c2 = c1 * 1.525;
                return t < 0.5
                    ? (Math.pow(2 * t, 2) * ((c2 + 1) * 2 * t - c2)) / 2
                    : (Math.pow(2 * t - 2, 2) * ((c2 + 1) * (t * 2 - 2) + c2) + 2) / 2;
            },
            easeInBounce: t => 1 - this.easingFunctions.easeOutBounce(1 - t),
            easeOutBounce: t => {
                if (t < 1 / 2.75) return 7.5625 * t * t;
                if (t < 2 / 2.75) return 7.5625 * (t -= 1.5 / 2.75) * t + 0.75;
                if (t < 2.5 / 2.75) return 7.5625 * (t -= 2.25 / 2.75) * t + 0.9375;
                return 7.5625 * (t -= 2.625 / 2.75) * t + 0.984375;
            },
            easeInOutBounce: t => t < 0.5 
                ? this.easingFunctions.easeInBounce(t * 2) / 2
                : (this.easingFunctions.easeOutBounce(t * 2 - 1) + 1) / 2,
            elastic: t => {
                if (t === 0 || t === 1) return t;
                return -Math.pow(2, 10 * (t - 1)) * Math.sin((t - 1.1) * 5 * Math.PI);
            },
            spring: t => 1 - Math.cos(t * 4.5 * Math.PI) * Math.exp(-t * 6)
        };
    }

    setupEventSystem() {
        this.eventListeners.set('animationComplete', []);
        this.eventListeners.set('frameUpdate', []);
        this.eventListeners.set('spriteLoaded', []);
        this.eventListeners.set('error', []);
    }

    addEventListener(event, callback) {
        if (!this.eventListeners.has(event)) {
            this.eventListeners.set(event, []);
        }
        this.eventListeners.get(event).push(callback);
    }

    removeEventListener(event, callback) {
        if (this.eventListeners.has(event)) {
            const listeners = this.eventListeners.get(event);
            const index = listeners.indexOf(callback);
            if (index > -1) listeners.splice(index, 1);
        }
    }

    emit(event, data) {
        if (this.eventListeners.has(event)) {
            this.eventListeners.get(event).forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    this.log(`Error in event listener for ${event}:`, error);
                }
            });
        }
    }

    // Sprite Sheet Management
    createSpriteSheet(id, imageUrl, frameData) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            
            img.onload = () => {
                const spriteSheet = new SpriteSheet(id, img, frameData);
                this.sprites.set(id, spriteSheet);
                
                if (this.settings.enableAtlasing) {
                    this.addToTextureAtlas(id, spriteSheet);
                }
                
                this.emit('spriteLoaded', { id, spriteSheet });
                this.log(`✅ Loaded sprite sheet: ${id}`);
                resolve(spriteSheet);
            };
            
            img.onerror = () => {
                const error = `Failed to load sprite sheet: ${id}`;
                this.emit('error', { error, id });
                reject(new Error(error));
            };
            
            img.src = imageUrl;
        });
    }

    addToTextureAtlas(id, spriteSheet) {
        // Advanced texture atlasing for performance
        if (!this.textureAtlas.has('main')) {
            this.textureAtlas.set('main', new TextureAtlas());
        }
        this.textureAtlas.get('main').addSprite(id, spriteSheet);
    }

    // Animation Creation and Management
    createAnimation(id, config) {
        const animation = new Animation(id, config, this);
        this.animations.set(id, animation);
        return animation;
    }

    createTimeline(id, animations) {
        const timeline = new Timeline(id, animations, this);
        this.timelines.set(id, timeline);
        return timeline;
    }

    createAnimationGroup(id, animations) {
        const group = new AnimationGroup(id, animations, this);
        this.animationGroups.set(id, group);
        return group;
    }

    // Particle System Integration
    createParticleSystem(id, config) {
        const particleSystem = new ParticleSystem(id, config, this);
        this.particleSystems.set(id, particleSystem);
        return particleSystem;
    }

    // Main Animation Loop
    start() {
        if (this.isRunning) return;
        this.isRunning = true;
        this.lastTime = performance.now();
        this.log('🚀 Animation engine started');
        this.animate();
    }

    stop() {
        this.isRunning = false;
        this.log('⏹️ Animation engine stopped');
    }

    animate(currentTime = performance.now()) {
        if (!this.isRunning) return;

        // Calculate delta time and FPS
        this.deltaTime = Math.min((currentTime - this.lastTime) / 1000, 1/30); // Cap at 30fps minimum
        this.lastTime = currentTime;
        this.frameCount++;

        // FPS calculation
        this.fpsTime += this.deltaTime;
        this.fpsCounter++;
        if (this.fpsTime >= 1) {
            this.fps = this.fpsCounter / this.fpsTime;
            this.fpsCounter = 0;
            this.fpsTime = 0;
        }

        // Clear canvas
        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Update and render all animations
        this.updateAnimations();
        this.updateParticleSystems();
        this.updateTimelines();
        this.renderFrame();

        // Emit frame update event
        this.emit('frameUpdate', {
            deltaTime: this.deltaTime,
            fps: this.fps,
            frameCount: this.frameCount
        });

        // Continue animation loop
        if (this.settings.useRequestAnimationFrame) {
            requestAnimationFrame((time) => this.animate(time));
        } else {
            setTimeout(() => this.animate(), 1000 / this.settings.maxFPS);
        }
    }

    updateAnimations() {
        for (const [id, animation] of this.animations) {
            if (animation.isActive) {
                animation.update(this.deltaTime);
                
                if (animation.isComplete && !animation.loop) {
                    this.emit('animationComplete', { id, animation });
                }
            }
        }
    }

    updateParticleSystems() {
        for (const [id, particleSystem] of this.particleSystems) {
            if (particleSystem.isActive) {
                particleSystem.update(this.deltaTime);
            }
        }
    }

    updateTimelines() {
        for (const [id, timeline] of this.timelines) {
            if (timeline.isActive) {
                timeline.update(this.deltaTime);
            }
        }
    }

    renderFrame() {
        // Clear render queue
        this.renderQueue.length = 0;
        this.batchQueue.clear();

        // Collect all renderable objects
        this.collectRenderables();

        // Sort by z-index and batch similar objects
        this.sortAndBatch();

        // Render batched objects
        this.renderBatches();
    }

    collectRenderables() {
        // Collect animations
        for (const [id, animation] of this.animations) {
            if (animation.isActive && animation.isVisible) {
                this.renderQueue.push({
                    type: 'animation',
                    object: animation,
                    zIndex: animation.zIndex || 0
                });
            }
        }

        // Collect particle systems
        for (const [id, particleSystem] of this.particleSystems) {
            if (particleSystem.isActive && particleSystem.isVisible) {
                this.renderQueue.push({
                    type: 'particles',
                    object: particleSystem,
                    zIndex: particleSystem.zIndex || 0
                });
            }
        }
    }

    sortAndBatch() {
        // Sort by z-index
        this.renderQueue.sort((a, b) => a.zIndex - b.zIndex);

        // Batch similar objects for optimization
        if (this.settings.enableBatching) {
            for (const renderable of this.renderQueue) {
                const batchKey = this.getBatchKey(renderable);
                if (!this.batchQueue.has(batchKey)) {
                    this.batchQueue.set(batchKey, []);
                }
                this.batchQueue.get(batchKey).push(renderable);
            }
        }
    }

    getBatchKey(renderable) {
        // Create batch key based on object properties
        if (renderable.type === 'animation') {
            const anim = renderable.object;
            return `${renderable.type}_${anim.spriteId}_${anim.blendMode || 'normal'}`;
        }
        return renderable.type;
    }

    renderBatches() {
        if (this.settings.enableBatching && this.batchQueue.size > 0) {
            for (const [batchKey, renderables] of this.batchQueue) {
                this.renderBatch(renderables);
            }
        } else {
            // Fallback: render individually
            for (const renderable of this.renderQueue) {
                this.renderObject(renderable.object);
            }
        }
    }

    renderBatch(renderables) {
        // Optimize rendering for similar objects
        const firstRenderable = renderables[0];
        
        if (firstRenderable.type === 'animation') {
            this.context.save();
            for (const renderable of renderables) {
                this.renderAnimation(renderable.object);
            }
            this.context.restore();
        } else if (firstRenderable.type === 'particles') {
            this.context.save();
            for (const renderable of renderables) {
                this.renderParticleSystem(renderable.object);
            }
            this.context.restore();
        }
    }

    renderObject(object) {
        this.context.save();
        
        if (object instanceof Animation) {
            this.renderAnimation(object);
        } else if (object instanceof ParticleSystem) {
            this.renderParticleSystem(object);
        }
        
        this.context.restore();
    }

    renderAnimation(animation) {
        if (!animation.isVisible || animation.opacity <= 0) return;

        const sprite = this.sprites.get(animation.spriteId);
        if (!sprite) return;

        const frame = sprite.getFrame(animation.currentFrame);
        if (!frame) return;

        // Apply transformations
        this.context.save();
        
        // Global alpha
        this.context.globalAlpha = animation.opacity;
        
        // Blend mode
        if (animation.blendMode) {
            this.context.globalCompositeOperation = animation.blendMode;
        }

        // Position
        this.context.translate(animation.x, animation.y);
        
        // Rotation
        if (animation.rotation !== 0) {
            this.context.rotate(animation.rotation);
        }
        
        // Scale
        if (animation.scaleX !== 1 || animation.scaleY !== 1) {
            this.context.scale(animation.scaleX, animation.scaleY);
        }

        // Color transformation
        if (animation.tint && animation.tint !== '#ffffff') {
            this.applyColorTransformation(animation.tint);
        }

        // Render the frame
        this.context.drawImage(
            sprite.image,
            frame.x, frame.y, frame.width, frame.height,
            -frame.width * animation.anchorX, -frame.height * animation.anchorY,
            frame.width, frame.height
        );

        this.context.restore();
    }

    renderParticleSystem(particleSystem) {
        particleSystem.render(this.context);
    }

    applyColorTransformation(tint) {
        // Apply color tint using canvas composition
        this.context.globalCompositeOperation = 'multiply';
        this.context.fillStyle = tint;
        this.context.fillRect(-10000, -10000, 20000, 20000);
        this.context.globalCompositeOperation = 'destination-atop';
    }

    // Utility Methods
    preloadCommonAssets() {
        // Preload common animation assets
        this.log('📦 Preloading common animation assets...');
    }

    // Performance monitoring
    getPerformanceInfo() {
        return {
            fps: Math.round(this.fps),
            frameCount: this.frameCount,
            activeAnimations: Array.from(this.animations.values()).filter(a => a.isActive).length,
            activeParticleSystems: Array.from(this.particleSystems.values()).filter(p => p.isActive).length,
            memoryUsage: this.getMemoryUsage(),
            renderQueue: this.renderQueue.length
        };
    }

    getMemoryUsage() {
        if (performance.memory) {
            return {
                used: Math.round(performance.memory.usedJSHeapSize / 1024 / 1024),
                total: Math.round(performance.memory.totalJSHeapSize / 1024 / 1024),
                limit: Math.round(performance.memory.jsHeapSizeLimit / 1024 / 1024)
            };
        }
        return null;
    }

    // Debug and logging
    log(...args) {
        console.log('[AnimationEngine]', ...args);
    }

    error(...args) {
        console.error('[AnimationEngine]', ...args);
    }

    // Cleanup
    destroy() {
        this.stop();
        
        // Clear all collections
        this.sprites.clear();
        this.animations.clear();
        this.timelines.clear();
        this.particleSystems.clear();
        this.textureAtlas.clear();
        this.animationGroups.clear();
        this.eventListeners.clear();

        // Remove canvas
        if (this.canvas && this.canvas.parentNode) {
            this.canvas.parentNode.removeChild(this.canvas);
        }

        this.log('🗑️ Animation engine destroyed');
    }
}

// Export for use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AnimationEngine;
} else if (typeof window !== 'undefined') {
    window.AnimationEngine = AnimationEngine;
}
