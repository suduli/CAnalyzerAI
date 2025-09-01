/**
 * Supporting Classes for Enhanced Animation Engine
 * Sprite Sheet, Animation, Timeline, and Particle System Classes
 */

class SpriteSheet {
    constructor(id, image, frameData) {
        this.id = id;
        this.image = image;
        this.frames = [];
        this.animations = new Map();
        this.metadata = frameData.metadata || {};
        
        this.parseFrameData(frameData);
    }

    parseFrameData(frameData) {
        if (frameData.frames) {
            // Handle TexturePacker format
            if (Array.isArray(frameData.frames)) {
                frameData.frames.forEach((frame, index) => {
                    this.frames.push({
                        id: frame.filename || `frame_${index}`,
                        x: frame.frame?.x || frame.x || 0,
                        y: frame.frame?.y || frame.y || 0,
                        width: frame.frame?.w || frame.width || 32,
                        height: frame.frame?.h || frame.height || 32,
                        trimmed: frame.trimmed || false,
                        sourceSize: frame.sourceSize || { w: frame.width, h: frame.height },
                        spriteSourceSize: frame.spriteSourceSize || { x: 0, y: 0, w: frame.width, h: frame.height }
                    });
                });
            } else {
                // Handle object format
                Object.entries(frameData.frames).forEach(([key, frame]) => {
                    this.frames.push({
                        id: key,
                        x: frame.frame?.x || frame.x || 0,
                        y: frame.frame?.y || frame.y || 0,
                        width: frame.frame?.w || frame.width || 32,
                        height: frame.frame?.h || frame.height || 32,
                        trimmed: frame.trimmed || false,
                        sourceSize: frame.sourceSize || { w: frame.width, h: frame.height },
                        spriteSourceSize: frame.spriteSourceSize || { x: 0, y: 0, w: frame.width, h: frame.height }
                    });
                });
            }
        } else {
            // Handle grid-based sprite sheet
            const { frameWidth, frameHeight, columns, rows, count } = frameData;
            const totalFrames = count || (columns * rows);
            
            for (let i = 0; i < totalFrames; i++) {
                const col = i % columns;
                const row = Math.floor(i / columns);
                
                this.frames.push({
                    id: `frame_${i}`,
                    x: col * frameWidth,
                    y: row * frameHeight,
                    width: frameWidth,
                    height: frameHeight,
                    trimmed: false,
                    sourceSize: { w: frameWidth, h: frameHeight },
                    spriteSourceSize: { x: 0, y: 0, w: frameWidth, h: frameHeight }
                });
            }
        }

        // Parse animation sequences if provided
        if (frameData.animations) {
            Object.entries(frameData.animations).forEach(([name, sequence]) => {
                this.animations.set(name, {
                    name,
                    frames: sequence.frames || sequence,
                    frameRate: sequence.frameRate || 12,
                    loop: sequence.loop !== false
                });
            });
        }
    }

    getFrame(index) {
        return this.frames[index] || null;
    }

    getFrameByName(name) {
        return this.frames.find(frame => frame.id === name) || null;
    }

    getAnimation(name) {
        return this.animations.get(name) || null;
    }

    getTotalFrames() {
        return this.frames.length;
    }
}

class Animation {
    constructor(id, config, engine) {
        this.id = id;
        this.engine = engine;
        
        // Basic properties
        this.spriteId = config.spriteId;
        this.animationName = config.animationName || null;
        this.currentFrame = config.startFrame || 0;
        this.frameRate = config.frameRate || 12;
        this.loop = config.loop !== false;
        
        // Transform properties
        this.x = config.x || 0;
        this.y = config.y || 0;
        this.scaleX = config.scaleX || 1;
        this.scaleY = config.scaleY || 1;
        this.rotation = config.rotation || 0;
        this.opacity = config.opacity !== undefined ? config.opacity : 1;
        this.anchorX = config.anchorX || 0.5;
        this.anchorY = config.anchorY || 0.5;
        
        // Visual properties
        this.tint = config.tint || '#ffffff';
        this.blendMode = config.blendMode || 'normal';
        this.zIndex = config.zIndex || 0;
        
        // Animation state
        this.isActive = config.autoStart !== false;
        this.isVisible = config.visible !== false;
        this.isPaused = false;
        this.isComplete = false;
        this.currentTime = 0;
        this.duration = 0;
        
        // Frame sequence
        this.frameSequence = config.frames || null;
        this.totalFrames = 0;
        
        // Property animations
        this.propertyAnimations = new Map();
        
        // Events
        this.onComplete = config.onComplete || null;
        this.onLoop = config.onLoop || null;
        this.onFrameChange = config.onFrameChange || null;
        
        this.initialize();
    }

    initialize() {
        const sprite = this.engine.sprites.get(this.spriteId);
        if (!sprite) {
            this.engine.error(`Sprite not found: ${this.spriteId}`);
            return;
        }

        // Setup frame sequence
        if (this.animationName) {
            const animData = sprite.getAnimation(this.animationName);
            if (animData) {
                this.frameSequence = animData.frames;
                this.frameRate = animData.frameRate;
                this.loop = animData.loop;
            }
        }

        if (!this.frameSequence) {
            this.frameSequence = Array.from({ length: sprite.getTotalFrames() }, (_, i) => i);
        }

        this.totalFrames = this.frameSequence.length;
        this.duration = this.totalFrames / this.frameRate;
    }

    // Property Animation Methods
    animateTo(properties, duration, easing = 'linear', onComplete = null) {
        const propertyAnim = new PropertyAnimation(this, properties, duration, easing, onComplete);
        const animId = `prop_${Date.now()}_${Math.random()}`;
        this.propertyAnimations.set(animId, propertyAnim);
        return propertyAnim;
    }

    fadeIn(duration = 1, easing = 'easeOutQuad', onComplete = null) {
        this.opacity = 0;
        this.isVisible = true;
        return this.animateTo({ opacity: 1 }, duration, easing, onComplete);
    }

    fadeOut(duration = 1, easing = 'easeInQuad', onComplete = null) {
        return this.animateTo({ opacity: 0 }, duration, easing, (anim) => {
            this.isVisible = false;
            if (onComplete) onComplete(anim);
        });
    }

    moveTo(x, y, duration = 1, easing = 'easeInOutQuad', onComplete = null) {
        return this.animateTo({ x, y }, duration, easing, onComplete);
    }

    scaleTo(scale, duration = 1, easing = 'easeOutBack', onComplete = null) {
        return this.animateTo({ scaleX: scale, scaleY: scale }, duration, easing, onComplete);
    }

    rotateTo(rotation, duration = 1, easing = 'linear', onComplete = null) {
        return this.animateTo({ rotation }, duration, easing, onComplete);
    }

    // Playback Control
    play() {
        this.isActive = true;
        this.isPaused = false;
        this.isComplete = false;
    }

    pause() {
        this.isPaused = true;
    }

    stop() {
        this.isPaused = false;
        this.isActive = false;
        this.currentTime = 0;
        this.currentFrame = 0;
        this.isComplete = false;
    }

    reset() {
        this.currentTime = 0;
        this.currentFrame = 0;
        this.isComplete = false;
    }

    gotoAndPlay(frame) {
        this.currentFrame = frame;
        this.currentTime = (frame / this.frameRate);
        this.play();
    }

    gotoAndStop(frame) {
        this.currentFrame = frame;
        this.currentTime = (frame / this.frameRate);
        this.stop();
    }

    // Update method called by engine
    update(deltaTime) {
        if (!this.isActive || this.isPaused) return;

        // Update frame animation
        this.currentTime += deltaTime;
        
        const expectedFrame = Math.floor(this.currentTime * this.frameRate);
        
        if (expectedFrame !== this.currentFrame) {
            const oldFrame = this.currentFrame;
            this.currentFrame = expectedFrame;
            
            if (this.onFrameChange) {
                this.onFrameChange(this.currentFrame, oldFrame);
            }
        }

        // Handle looping and completion
        if (this.currentFrame >= this.totalFrames) {
            if (this.loop) {
                this.currentFrame = 0;
                this.currentTime = 0;
                if (this.onLoop) this.onLoop();
            } else {
                this.currentFrame = this.totalFrames - 1;
                this.isComplete = true;
                this.isActive = false;
                if (this.onComplete) this.onComplete();
            }
        }

        // Update property animations
        this.updatePropertyAnimations(deltaTime);
    }

    updatePropertyAnimations(deltaTime) {
        const completedAnimations = [];
        
        for (const [id, propAnim] of this.propertyAnimations) {
            propAnim.update(deltaTime);
            
            if (propAnim.isComplete) {
                completedAnimations.push(id);
            }
        }
        
        // Remove completed animations
        completedAnimations.forEach(id => {
            this.propertyAnimations.delete(id);
        });
    }

    // Utility methods
    getCurrentFrameIndex() {
        return this.frameSequence ? this.frameSequence[this.currentFrame] : this.currentFrame;
    }

    getProgress() {
        return this.totalFrames > 0 ? this.currentFrame / this.totalFrames : 0;
    }

    clone(newId) {
        return new Animation(newId, {
            spriteId: this.spriteId,
            animationName: this.animationName,
            frameRate: this.frameRate,
            loop: this.loop,
            x: this.x,
            y: this.y,
            scaleX: this.scaleX,
            scaleY: this.scaleY,
            rotation: this.rotation,
            opacity: this.opacity,
            anchorX: this.anchorX,
            anchorY: this.anchorY,
            tint: this.tint,
            blendMode: this.blendMode,
            zIndex: this.zIndex
        }, this.engine);
    }
}

class PropertyAnimation {
    constructor(target, properties, duration, easing, onComplete) {
        this.target = target;
        this.properties = properties;
        this.duration = duration;
        this.easing = easing;
        this.onComplete = onComplete;
        
        this.startValues = {};
        this.targetValues = {};
        this.currentTime = 0;
        this.isComplete = false;
        
        this.initialize();
    }

    initialize() {
        // Store initial values
        Object.keys(this.properties).forEach(prop => {
            this.startValues[prop] = this.target[prop];
            this.targetValues[prop] = this.properties[prop];
        });
    }

    update(deltaTime) {
        if (this.isComplete) return;
        
        this.currentTime += deltaTime;
        const progress = Math.min(this.currentTime / this.duration, 1);
        
        // Apply easing
        const easingFunction = this.target.engine.easingFunctions[this.easing] || 
                              this.target.engine.easingFunctions.linear;
        const easedProgress = easingFunction(progress);
        
        // Interpolate properties
        Object.keys(this.properties).forEach(prop => {
            const start = this.startValues[prop];
            const target = this.targetValues[prop];
            this.target[prop] = start + (target - start) * easedProgress;
        });
        
        // Check completion
        if (progress >= 1) {
            this.isComplete = true;
            if (this.onComplete) {
                this.onComplete(this);
            }
        }
    }
}

class Timeline {
    constructor(id, animations, engine) {
        this.id = id;
        this.engine = engine;
        this.animations = animations || [];
        this.currentTime = 0;
        this.duration = 0;
        this.isActive = false;
        this.isPaused = false;
        this.isComplete = false;
        this.loop = false;
        
        this.onComplete = null;
        this.onLoop = null;
        
        this.calculateDuration();
    }

    calculateDuration() {
        this.duration = 0;
        this.animations.forEach(anim => {
            const endTime = anim.startTime + anim.duration;
            if (endTime > this.duration) {
                this.duration = endTime;
            }
        });
    }

    addAnimation(animation, startTime = 0) {
        this.animations.push({
            animation,
            startTime,
            duration: animation.duration || 1,
            hasStarted: false,
            isComplete: false
        });
        this.calculateDuration();
    }

    play() {
        this.isActive = true;
        this.isPaused = false;
        this.isComplete = false;
    }

    pause() {
        this.isPaused = true;
    }

    stop() {
        this.isActive = false;
        this.isPaused = false;
        this.currentTime = 0;
        this.isComplete = false;
        
        // Reset all animations
        this.animations.forEach(anim => {
            anim.hasStarted = false;
            anim.isComplete = false;
            if (anim.animation.reset) {
                anim.animation.reset();
            }
        });
    }

    update(deltaTime) {
        if (!this.isActive || this.isPaused) return;
        
        this.currentTime += deltaTime;
        
        // Update animations based on timeline
        this.animations.forEach(anim => {
            const shouldStart = this.currentTime >= anim.startTime;
            const shouldEnd = this.currentTime >= (anim.startTime + anim.duration);
            
            if (shouldStart && !anim.hasStarted) {
                anim.hasStarted = true;
                if (anim.animation.play) {
                    anim.animation.play();
                }
            }
            
            if (shouldEnd && !anim.isComplete) {
                anim.isComplete = true;
                if (anim.animation.stop) {
                    anim.animation.stop();
                }
            }
        });
        
        // Check timeline completion
        if (this.currentTime >= this.duration) {
            if (this.loop) {
                this.currentTime = 0;
                this.animations.forEach(anim => {
                    anim.hasStarted = false;
                    anim.isComplete = false;
                });
                if (this.onLoop) this.onLoop();
            } else {
                this.isComplete = true;
                this.isActive = false;
                if (this.onComplete) this.onComplete();
            }
        }
    }

    getProgress() {
        return this.duration > 0 ? Math.min(this.currentTime / this.duration, 1) : 0;
    }
}

class AnimationGroup {
    constructor(id, animations, engine) {
        this.id = id;
        this.engine = engine;
        this.animations = animations || [];
        this.isActive = false;
        this.mode = 'parallel'; // 'parallel' or 'sequence'
        
        this.onComplete = null;
    }

    addAnimation(animation) {
        this.animations.push(animation);
    }

    play(mode = 'parallel') {
        this.mode = mode;
        this.isActive = true;
        
        if (mode === 'parallel') {
            // Start all animations simultaneously
            this.animations.forEach(anim => {
                if (anim.play) anim.play();
            });
        } else if (mode === 'sequence') {
            // Start animations in sequence
            this.playNextInSequence(0);
        }
    }

    playNextInSequence(index) {
        if (index >= this.animations.length) {
            this.isActive = false;
            if (this.onComplete) this.onComplete();
            return;
        }
        
        const animation = this.animations[index];
        if (animation.play) {
            animation.play();
            
            // Setup completion handler for sequence
            const originalOnComplete = animation.onComplete;
            animation.onComplete = () => {
                if (originalOnComplete) originalOnComplete();
                this.playNextInSequence(index + 1);
            };
        }
    }

    pause() {
        this.animations.forEach(anim => {
            if (anim.pause) anim.pause();
        });
    }

    stop() {
        this.isActive = false;
        this.animations.forEach(anim => {
            if (anim.stop) anim.stop();
        });
    }
}

class TextureAtlas {
    constructor() {
        this.canvas = document.createElement('canvas');
        this.context = this.canvas.getContext('2d');
        this.sprites = new Map();
        this.regions = [];
        this.maxSize = 2048; // Maximum atlas size
        this.padding = 2; // Padding between sprites
        this.needsUpdate = false;
    }

    addSprite(id, spriteSheet) {
        this.sprites.set(id, spriteSheet);
        this.needsUpdate = true;
    }

    build() {
        if (!this.needsUpdate) return;
        
        // Simple bin packing algorithm
        const sprites = Array.from(this.sprites.values());
        let totalArea = 0;
        
        sprites.forEach(sprite => {
            totalArea += sprite.image.width * sprite.image.height;
        });
        
        // Estimate atlas size
        const atlasSize = Math.min(Math.ceil(Math.sqrt(totalArea * 1.2)), this.maxSize);
        this.canvas.width = atlasSize;
        this.canvas.height = atlasSize;
        
        // Pack sprites
        this.packSprites(sprites);
        this.needsUpdate = false;
    }

    packSprites(sprites) {
        // Simple left-to-right, top-to-bottom packing
        let x = 0;
        let y = 0;
        let rowHeight = 0;
        
        sprites.forEach(sprite => {
            if (x + sprite.image.width + this.padding > this.canvas.width) {
                x = 0;
                y += rowHeight + this.padding;
                rowHeight = 0;
            }
            
            if (y + sprite.image.height <= this.canvas.height) {
                this.context.drawImage(sprite.image, x, y);
                
                this.regions.push({
                    id: sprite.id,
                    x, y,
                    width: sprite.image.width,
                    height: sprite.image.height
                });
                
                x += sprite.image.width + this.padding;
                rowHeight = Math.max(rowHeight, sprite.image.height);
            }
        });
    }

    getRegion(id) {
        return this.regions.find(region => region.id === id);
    }

    getTexture() {
        this.build();
        return this.canvas;
    }
}

// Export classes
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        SpriteSheet,
        Animation,
        PropertyAnimation,
        Timeline,
        AnimationGroup,
        TextureAtlas
    };
} else if (typeof window !== 'undefined') {
    window.SpriteSheet = SpriteSheet;
    window.Animation = Animation;
    window.PropertyAnimation = PropertyAnimation;
    window.Timeline = Timeline;
    window.AnimationGroup = AnimationGroup;
    window.TextureAtlas = TextureAtlas;
}
