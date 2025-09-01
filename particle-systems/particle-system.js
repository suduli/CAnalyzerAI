/**
 * Enhanced Particle System for Animation Engine
 * Supports complex particle effects, emitters, and force fields
 */

class ParticleSystem {
    constructor(id, config, engine) {
        this.id = id;
        this.engine = engine;
        this.particles = [];
        this.emitters = [];
        this.forceFields = [];
        
        // System properties
        this.isActive = config.active !== false;
        this.isVisible = config.visible !== false;
        this.zIndex = config.zIndex || 0;
        this.maxParticles = config.maxParticles || 1000;
        this.blendMode = config.blendMode || 'normal';
        
        // Performance settings
        this.useObjectPooling = config.useObjectPooling !== false;
        this.poolSize = config.poolSize || 100;
        this.particlePool = [];
        
        // Rendering optimization
        this.cullingEnabled = config.cullingEnabled !== false;
        this.cullingMargin = config.cullingMargin || 50;
        
        this.initializePool();
    }

    initializePool() {
        if (this.useObjectPooling) {
            for (let i = 0; i < this.poolSize; i++) {
                this.particlePool.push(new Particle());
            }
        }
    }

    createEmitter(config) {
        const emitter = new ParticleEmitter(config, this);
        this.emitters.push(emitter);
        return emitter;
    }

    createForceField(config) {
        const forceField = new ForceField(config);
        this.forceFields.push(forceField);
        return forceField;
    }

    getParticle() {
        if (this.useObjectPooling && this.particlePool.length > 0) {
            return this.particlePool.pop();
        }
        return new Particle();
    }

    releaseParticle(particle) {
        if (this.useObjectPooling && this.particlePool.length < this.poolSize) {
            particle.reset();
            this.particlePool.push(particle);
        }
    }

    update(deltaTime) {
        if (!this.isActive) return;

        // Update emitters
        this.emitters.forEach(emitter => {
            if (emitter.isActive) {
                emitter.update(deltaTime, this);
            }
        });

        // Update particles
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const particle = this.particles[i];
            
            // Apply force fields
            this.forceFields.forEach(field => {
                if (field.isActive) {
                    field.applyForce(particle);
                }
            });
            
            // Update particle
            particle.update(deltaTime);
            
            // Remove dead particles
            if (!particle.isAlive) {
                this.releaseParticle(particle);
                this.particles.splice(i, 1);
            }
        }

        // Limit particle count
        while (this.particles.length > this.maxParticles) {
            const particle = this.particles.shift();
            this.releaseParticle(particle);
        }
    }

    render(context) {
        if (!this.isVisible || this.particles.length === 0) return;

        context.save();
        
        if (this.blendMode !== 'normal') {
            context.globalCompositeOperation = this.blendMode;
        }

        // Get viewport bounds for culling
        const viewBounds = this.cullingEnabled ? this.getViewportBounds(context) : null;

        // Render particles
        this.particles.forEach(particle => {
            if (this.cullingEnabled && !this.isParticleVisible(particle, viewBounds)) {
                return;
            }
            
            particle.render(context);
        });

        context.restore();
    }

    getViewportBounds(context) {
        const transform = context.getTransform();
        return {
            left: -this.cullingMargin,
            top: -this.cullingMargin,
            right: this.engine.canvas.width + this.cullingMargin,
            bottom: this.engine.canvas.height + this.cullingMargin
        };
    }

    isParticleVisible(particle, bounds) {
        return particle.x >= bounds.left && 
               particle.x <= bounds.right && 
               particle.y >= bounds.top && 
               particle.y <= bounds.bottom;
    }

    addParticle(particle) {
        if (this.particles.length < this.maxParticles) {
            this.particles.push(particle);
        }
    }

    clear() {
        this.particles.forEach(particle => this.releaseParticle(particle));
        this.particles.length = 0;
    }

    getParticleCount() {
        return this.particles.length;
    }

    setMaxParticles(max) {
        this.maxParticles = max;
        while (this.particles.length > this.maxParticles) {
            const particle = this.particles.shift();
            this.releaseParticle(particle);
        }
    }
}

class Particle {
    constructor() {
        this.reset();
    }

    reset() {
        // Position and movement
        this.x = 0;
        this.y = 0;
        this.velX = 0;
        this.velY = 0;
        this.accX = 0;
        this.accY = 0;
        
        // Visual properties
        this.size = 1;
        this.scale = 1;
        this.rotation = 0;
        this.angularVelocity = 0;
        this.color = '#ffffff';
        this.opacity = 1;
        
        // Lifecycle
        this.age = 0;
        this.life = 1;
        this.isAlive = true;
        
        // Physics
        this.mass = 1;
        this.friction = 0;
        this.bounce = 0;
        this.gravity = 0;
        
        // Animation
        this.sprite = null;
        this.frame = 0;
        this.animationSpeed = 0;
        
        // Custom data
        this.data = {};
    }

    update(deltaTime) {
        if (!this.isAlive) return;

        // Update age
        this.age += deltaTime;
        if (this.age >= this.life) {
            this.isAlive = false;
            return;
        }

        // Apply gravity
        if (this.gravity !== 0) {
            this.accY += this.gravity;
        }

        // Apply friction
        if (this.friction > 0) {
            this.velX *= (1 - this.friction * deltaTime);
            this.velY *= (1 - this.friction * deltaTime);
        }

        // Update velocity
        this.velX += this.accX * deltaTime;
        this.velY += this.accY * deltaTime;

        // Update position
        this.x += this.velX * deltaTime;
        this.y += this.velY * deltaTime;

        // Update rotation
        this.rotation += this.angularVelocity * deltaTime;

        // Update animation
        if (this.sprite && this.animationSpeed > 0) {
            this.frame += this.animationSpeed * deltaTime;
        }

        // Reset acceleration
        this.accX = 0;
        this.accY = 0;
    }

    render(context) {
        if (!this.isAlive || this.opacity <= 0) return;

        context.save();
        
        // Apply transformations
        context.translate(this.x, this.y);
        
        if (this.rotation !== 0) {
            context.rotate(this.rotation);
        }
        
        if (this.scale !== 1) {
            context.scale(this.scale, this.scale);
        }
        
        context.globalAlpha = this.opacity;

        if (this.sprite) {
            // Render sprite
            const frameIndex = Math.floor(this.frame) % this.sprite.getTotalFrames();
            const frame = this.sprite.getFrame(frameIndex);
            
            if (frame) {
                context.drawImage(
                    this.sprite.image,
                    frame.x, frame.y, frame.width, frame.height,
                    -frame.width * 0.5, -frame.height * 0.5,
                    frame.width, frame.height
                );
            }
        } else {
            // Render as simple shape
            context.fillStyle = this.color;
            context.beginPath();
            context.arc(0, 0, this.size, 0, Math.PI * 2);
            context.fill();
        }

        context.restore();
    }

    applyForce(forceX, forceY) {
        this.accX += forceX / this.mass;
        this.accY += forceY / this.mass;
    }

    getProgress() {
        return this.life > 0 ? this.age / this.life : 1;
    }

    setColor(color) {
        this.color = color;
    }

    setPosition(x, y) {
        this.x = x;
        this.y = y;
    }

    setVelocity(velX, velY) {
        this.velX = velX;
        this.velY = velY;
    }
}

class ParticleEmitter {
    constructor(config, particleSystem) {
        this.particleSystem = particleSystem;
        this.isActive = config.active !== false;
        
        // Position
        this.x = config.x || 0;
        this.y = config.y || 0;
        this.width = config.width || 0;
        this.height = config.height || 0;
        this.shape = config.shape || 'point'; // 'point', 'line', 'rectangle', 'circle'
        
        // Emission properties
        this.emissionRate = config.emissionRate || 10; // particles per second
        this.burstCount = config.burstCount || 0;
        this.maxParticles = config.maxParticles || 100;
        this.emissionTimer = 0;
        
        // Particle properties
        this.particleLife = config.particleLife || { min: 1, max: 3 };
        this.particleSize = config.particleSize || { min: 1, max: 5 };
        this.particleColor = config.particleColor || '#ffffff';
        this.particleOpacity = config.particleOpacity || { min: 0.5, max: 1 };
        this.particleScale = config.particleScale || { min: 1, max: 1 };
        
        // Movement properties
        this.velocity = config.velocity || { x: { min: -50, max: 50 }, y: { min: -50, max: 50 } };
        this.acceleration = config.acceleration || { x: 0, y: 0 };
        this.gravity = config.gravity || 0;
        this.friction = config.friction || 0;
        this.angularVelocity = config.angularVelocity || { min: 0, max: 0 };
        
        // Visual properties
        this.sprite = config.sprite || null;
        this.animationSpeed = config.animationSpeed || 0;
        this.colorOverTime = config.colorOverTime || null;
        this.opacityOverTime = config.opacityOverTime || null;
        this.scaleOverTime = config.scaleOverTime || null;
        
        // Burst settings
        this.burstTimer = 0;
        this.burstInterval = config.burstInterval || 1;
        this.autoBurst = config.autoBurst || false;
    }

    update(deltaTime, particleSystem) {
        if (!this.isActive) return;

        // Handle continuous emission
        if (this.emissionRate > 0) {
            this.emissionTimer += deltaTime;
            const emissionInterval = 1 / this.emissionRate;
            
            while (this.emissionTimer >= emissionInterval) {
                this.emitParticle(particleSystem);
                this.emissionTimer -= emissionInterval;
            }
        }

        // Handle burst emission
        if (this.autoBurst && this.burstCount > 0) {
            this.burstTimer += deltaTime;
            if (this.burstTimer >= this.burstInterval) {
                this.burst(particleSystem);
                this.burstTimer = 0;
            }
        }
    }

    emitParticle(particleSystem) {
        if (particleSystem.getParticleCount() >= this.maxParticles) return;

        const particle = particleSystem.getParticle();
        this.initializeParticle(particle);
        particleSystem.addParticle(particle);
    }

    initializeParticle(particle) {
        // Set position based on emitter shape
        const pos = this.getEmissionPosition();
        particle.setPosition(pos.x, pos.y);
        
        // Set velocity
        const velX = this.randomRange(this.velocity.x.min, this.velocity.x.max);
        const velY = this.randomRange(this.velocity.y.min, this.velocity.y.max);
        particle.setVelocity(velX, velY);
        
        // Set properties
        particle.life = this.randomRange(this.particleLife.min, this.particleLife.max);
        particle.size = this.randomRange(this.particleSize.min, this.particleSize.max);
        particle.scale = this.randomRange(this.particleScale.min, this.particleScale.max);
        particle.opacity = this.randomRange(this.particleOpacity.min, this.particleOpacity.max);
        particle.angularVelocity = this.randomRange(this.angularVelocity.min, this.angularVelocity.max);
        
        // Set physics
        particle.gravity = this.gravity;
        particle.friction = this.friction;
        particle.accX = this.acceleration.x;
        particle.accY = this.acceleration.y;
        
        // Set visual properties
        particle.color = this.particleColor;
        particle.sprite = this.sprite;
        particle.animationSpeed = this.animationSpeed;
        
        // Setup property animations over time
        this.setupParticleAnimations(particle);
    }

    setupParticleAnimations(particle) {
        // Store original values for interpolation
        particle.data.originalOpacity = particle.opacity;
        particle.data.originalScale = particle.scale;
        particle.data.originalColor = particle.color;
        
        // Set up animation curves
        particle.data.colorOverTime = this.colorOverTime;
        particle.data.opacityOverTime = this.opacityOverTime;
        particle.data.scaleOverTime = this.scaleOverTime;
        
        // Override particle update to handle property animations
        const originalUpdate = particle.update.bind(particle);
        particle.update = (deltaTime) => {
            originalUpdate(deltaTime);
            
            if (!particle.isAlive) return;
            
            const progress = particle.getProgress();
            
            // Animate opacity over time
            if (particle.data.opacityOverTime) {
                particle.opacity = this.interpolateValue(
                    particle.data.originalOpacity,
                    particle.data.opacityOverTime,
                    progress
                );
            }
            
            // Animate scale over time
            if (particle.data.scaleOverTime) {
                particle.scale = this.interpolateValue(
                    particle.data.originalScale,
                    particle.data.scaleOverTime,
                    progress
                );
            }
            
            // Animate color over time
            if (particle.data.colorOverTime) {
                particle.color = this.interpolateColor(
                    particle.data.originalColor,
                    particle.data.colorOverTime,
                    progress
                );
            }
        };
    }

    interpolateValue(startValue, curve, progress) {
        if (Array.isArray(curve)) {
            // Handle keyframe animation
            for (let i = 0; i < curve.length - 1; i++) {
                const current = curve[i];
                const next = curve[i + 1];
                
                if (progress >= current.time && progress <= next.time) {
                    const localProgress = (progress - current.time) / (next.time - current.time);
                    return current.value + (next.value - current.value) * localProgress;
                }
            }
            return curve[curve.length - 1].value;
        } else if (typeof curve === 'object') {
            // Handle simple start/end values
            return startValue + (curve.end - startValue) * progress;
        }
        return startValue;
    }

    interpolateColor(startColor, colorCurve, progress) {
        // Simple color interpolation (would be enhanced for complex color curves)
        if (typeof colorCurve === 'string') {
            return this.lerpColor(startColor, colorCurve, progress);
        }
        return startColor;
    }

    lerpColor(color1, color2, t) {
        // Basic color interpolation
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
        } : { r: 255, g: 255, b: 255 };
    }

    getEmissionPosition() {
        switch (this.shape) {
            case 'line':
                return {
                    x: this.x + Math.random() * this.width,
                    y: this.y
                };
            case 'rectangle':
                return {
                    x: this.x + Math.random() * this.width,
                    y: this.y + Math.random() * this.height
                };
            case 'circle':
                const angle = Math.random() * Math.PI * 2;
                const radius = Math.random() * this.width * 0.5;
                return {
                    x: this.x + Math.cos(angle) * radius,
                    y: this.y + Math.sin(angle) * radius
                };
            default: // point
                return { x: this.x, y: this.y };
        }
    }

    burst(particleSystem) {
        for (let i = 0; i < this.burstCount; i++) {
            this.emitParticle(particleSystem);
        }
    }

    randomRange(min, max) {
        return min + Math.random() * (max - min);
    }

    setPosition(x, y) {
        this.x = x;
        this.y = y;
    }

    start() {
        this.isActive = true;
    }

    stop() {
        this.isActive = false;
    }
}

class ForceField {
    constructor(config) {
        this.x = config.x || 0;
        this.y = config.y || 0;
        this.radius = config.radius || 100;
        this.strength = config.strength || 1;
        this.type = config.type || 'radial'; // 'radial', 'directional', 'vortex'
        this.direction = config.direction || { x: 0, y: -1 };
        this.isActive = config.active !== false;
        this.falloff = config.falloff || 'linear'; // 'none', 'linear', 'quadratic'
    }

    applyForce(particle) {
        if (!this.isActive) return;

        const dx = particle.x - this.x;
        const dy = particle.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance > this.radius) return;

        let forceX = 0;
        let forceY = 0;
        let forceMagnitude = this.strength;

        // Apply falloff
        if (this.falloff === 'linear') {
            forceMagnitude *= (1 - distance / this.radius);
        } else if (this.falloff === 'quadratic') {
            const ratio = distance / this.radius;
            forceMagnitude *= (1 - ratio * ratio);
        }

        switch (this.type) {
            case 'radial':
                // Force towards or away from center
                if (distance > 0) {
                    const normalizedX = dx / distance;
                    const normalizedY = dy / distance;
                    forceX = -normalizedX * forceMagnitude;
                    forceY = -normalizedY * forceMagnitude;
                }
                break;
                
            case 'directional':
                // Force in a specific direction
                forceX = this.direction.x * forceMagnitude;
                forceY = this.direction.y * forceMagnitude;
                break;
                
            case 'vortex':
                // Swirling force around center
                if (distance > 0) {
                    const angle = Math.atan2(dy, dx) + Math.PI / 2;
                    forceX = Math.cos(angle) * forceMagnitude;
                    forceY = Math.sin(angle) * forceMagnitude;
                }
                break;
        }

        particle.applyForce(forceX, forceY);
    }

    setPosition(x, y) {
        this.x = x;
        this.y = y;
    }

    setStrength(strength) {
        this.strength = strength;
    }
}

// Predefined particle effect templates
class ParticleEffects {
    static createFireEffect(x, y, particleSystem) {
        const emitter = particleSystem.createEmitter({
            x, y,
            shape: 'circle',
            width: 20,
            emissionRate: 30,
            maxParticles: 50,
            particleLife: { min: 0.5, max: 1.5 },
            particleSize: { min: 2, max: 8 },
            particleColor: '#ff4500',
            particleOpacity: { min: 0.7, max: 1 },
            velocity: {
                x: { min: -20, max: 20 },
                y: { min: -80, max: -40 }
            },
            gravity: -50,
            friction: 0.1,
            opacityOverTime: { end: 0 },
            scaleOverTime: { end: 0.2 },
            colorOverTime: '#ff0000'
        });
        
        return emitter;
    }

    static createSnowEffect(x, y, width, particleSystem) {
        const emitter = particleSystem.createEmitter({
            x, y,
            shape: 'line',
            width,
            emissionRate: 20,
            maxParticles: 200,
            particleLife: { min: 3, max: 6 },
            particleSize: { min: 1, max: 3 },
            particleColor: '#ffffff',
            particleOpacity: { min: 0.3, max: 0.8 },
            velocity: {
                x: { min: -10, max: 10 },
                y: { min: 20, max: 60 }
            },
            gravity: 20,
            angularVelocity: { min: -1, max: 1 }
        });
        
        return emitter;
    }

    static createSparkleEffect(x, y, particleSystem) {
        const emitter = particleSystem.createEmitter({
            x, y,
            shape: 'point',
            burstCount: 15,
            autoBurst: true,
            burstInterval: 2,
            particleLife: { min: 0.5, max: 1.2 },
            particleSize: { min: 1, max: 4 },
            particleColor: '#ffff00',
            particleOpacity: { min: 0.8, max: 1 },
            velocity: {
                x: { min: -50, max: 50 },
                y: { min: -50, max: 50 }
            },
            friction: 0.05,
            opacityOverTime: { end: 0 },
            scaleOverTime: { end: 0 }
        });
        
        return emitter;
    }

    static createSmokeEffect(x, y, particleSystem) {
        const emitter = particleSystem.createEmitter({
            x, y,
            shape: 'circle',
            width: 10,
            emissionRate: 15,
            maxParticles: 30,
            particleLife: { min: 2, max: 4 },
            particleSize: { min: 5, max: 15 },
            particleColor: '#666666',
            particleOpacity: { min: 0.2, max: 0.6 },
            velocity: {
                x: { min: -15, max: 15 },
                y: { min: -30, max: -10 }
            },
            friction: 0.02,
            opacityOverTime: { end: 0 },
            scaleOverTime: { end: 2 }
        });
        
        return emitter;
    }
}

// Export classes
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        ParticleSystem,
        Particle,
        ParticleEmitter,
        ForceField,
        ParticleEffects
    };
} else if (typeof window !== 'undefined') {
    window.ParticleSystem = ParticleSystem;
    window.Particle = Particle;
    window.ParticleEmitter = ParticleEmitter;
    window.ForceField = ForceField;
    window.ParticleEffects = ParticleEffects;
}
