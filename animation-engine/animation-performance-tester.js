/**
 * Animation Performance Testing Suite
 * Tests and monitors animation performance across different devices and resolutions
 */

class AnimationPerformanceTester {
    constructor() {
        this.testResults = new Map();
        this.currentTest = null;
        this.performanceMetrics = {
            frameRate: [],
            renderTime: [],
            memoryUsage: [],
            cpuUsage: [],
            particleCount: [],
            animationCount: []
        };
        
        this.deviceInfo = this.getDeviceInfo();
        this.testConfigurations = this.getTestConfigurations();
        this.isRunning = false;
        this.monitoringInterval = null;
        
        // Performance thresholds
        this.thresholds = {
            minFrameRate: 30,
            maxFrameTime: 33.33, // milliseconds (1000/30fps)
            maxMemoryIncrease: 50, // MB
            warningFrameRate: 45,
            optimalFrameRate: 60
        };
    }

    getDeviceInfo() {
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        
        return {
            userAgent: navigator.userAgent,
            platform: navigator.platform,
            screenWidth: screen.width,
            screenHeight: screen.height,
            windowWidth: window.innerWidth,
            windowHeight: window.innerHeight,
            pixelRatio: window.devicePixelRatio || 1,
            hardwareConcurrency: navigator.hardwareConcurrency || 1,
            memory: navigator.deviceMemory || 'unknown',
            gpu: gl ? gl.getParameter(gl.RENDERER) : 'unknown',
            webglVersion: gl ? gl.getParameter(gl.VERSION) : 'unknown',
            maxTextureSize: gl ? gl.getParameter(gl.MAX_TEXTURE_SIZE) : 'unknown',
            timestamp: Date.now()
        };
    }

    getTestConfigurations() {
        return [
            {
                name: 'Basic UI Animations',
                description: 'Simple button hovers and transitions',
                config: {
                    particleCount: 50,
                    animationCount: 5,
                    complexity: 'low',
                    duration: 10000 // 10 seconds
                }
            },
            {
                name: 'Moderate Particle Effects',
                description: 'Theme transitions with particle effects',
                config: {
                    particleCount: 200,
                    animationCount: 10,
                    complexity: 'medium',
                    duration: 15000 // 15 seconds
                }
            },
            {
                name: 'Heavy Animation Load',
                description: 'Multiple complex animations and particle systems',
                config: {
                    particleCount: 500,
                    animationCount: 20,
                    complexity: 'high',
                    duration: 20000 // 20 seconds
                }
            },
            {
                name: 'Stress Test',
                description: 'Maximum load test for performance limits',
                config: {
                    particleCount: 1000,
                    animationCount: 50,
                    complexity: 'extreme',
                    duration: 30000 // 30 seconds
                }
            },
            {
                name: 'Memory Leak Test',
                description: 'Long-running test to detect memory leaks',
                config: {
                    particleCount: 300,
                    animationCount: 15,
                    complexity: 'medium',
                    duration: 120000 // 2 minutes
                }
            }
        ];
    }

    async runAllTests(animationEngine) {
        if (this.isRunning) {
            console.warn('Performance tests already running');
            return;
        }

        this.isRunning = true;
        const testResults = [];

        console.log('Starting Animation Performance Tests...');
        console.log('Device Info:', this.deviceInfo);

        try {
            for (const testConfig of this.testConfigurations) {
                console.log(`Running test: ${testConfig.name}`);
                const result = await this.runSingleTest(testConfig, animationEngine);
                testResults.push(result);
                
                // Small break between tests
                await this.wait(2000);
            }

            // Generate comprehensive report
            const report = this.generateReport(testResults);
            this.displayReport(report);
            
            return report;
        } catch (error) {
            console.error('Performance testing failed:', error);
            throw error;
        } finally {
            this.isRunning = false;
        }
    }

    async runSingleTest(testConfig, animationEngine) {
        return new Promise((resolve) => {
            const testResult = {
                config: testConfig,
                deviceInfo: this.deviceInfo,
                metrics: {
                    frameRate: [],
                    renderTime: [],
                    memoryUsage: [],
                    particleCount: [],
                    animationCount: [],
                    gpuMemory: []
                },
                summary: {},
                startTime: performance.now(),
                endTime: null
            };

            // Clear previous metrics
            this.resetMetrics();

            // Setup test scenario
            this.setupTestScenario(testConfig, animationEngine);

            // Start monitoring
            this.startMonitoring(testResult);

            // End test after duration
            setTimeout(() => {
                this.stopMonitoring();
                this.cleanupTestScenario(animationEngine);
                
                testResult.endTime = performance.now();
                testResult.summary = this.calculateSummary(testResult.metrics);
                
                resolve(testResult);
            }, testConfig.config.duration);
        });
    }

    setupTestScenario(testConfig, animationEngine) {
        const { particleCount, animationCount, complexity } = testConfig.config;

        // Create particle systems based on complexity
        switch (complexity) {
            case 'low':
                this.setupBasicAnimations(animationEngine, particleCount, animationCount);
                break;
            case 'medium':
                this.setupModerateAnimations(animationEngine, particleCount, animationCount);
                break;
            case 'high':
                this.setupHeavyAnimations(animationEngine, particleCount, animationCount);
                break;
            case 'extreme':
                this.setupStressTestAnimations(animationEngine, particleCount, animationCount);
                break;
        }
    }

    setupBasicAnimations(engine, particleCount, animationCount) {
        // Simple property animations
        for (let i = 0; i < animationCount; i++) {
            const animation = engine.createPropertyAnimation(`test-anim-${i}`, {
                target: { x: 0, y: 0, scale: 1 },
                properties: {
                    x: { to: 100, easing: 'easeInOutSine' },
                    y: { to: 50, easing: 'easeInOutSine' },
                    scale: { to: 1.5, easing: 'easeInOutSine' }
                },
                duration: 2000,
                loop: true,
                yoyo: true
            });
            animation.start();
        }

        // Simple particle system
        if (particleCount > 0) {
            const particleSystem = engine.createParticleSystem('test-particles', {
                maxParticles: particleCount
            });
            
            const emitter = particleSystem.createEmitter({
                x: engine.canvas.width / 2,
                y: engine.canvas.height / 2,
                emissionRate: particleCount / 10,
                particleLife: { min: 2, max: 4 },
                particleSize: { min: 2, max: 4 },
                velocity: {
                    x: { min: -50, max: 50 },
                    y: { min: -50, max: 50 }
                }
            });
        }
    }

    setupModerateAnimations(engine, particleCount, animationCount) {
        // More complex animations with easing
        for (let i = 0; i < animationCount; i++) {
            const timeline = engine.createTimeline(`test-timeline-${i}`);
            
            timeline.add(engine.createPropertyAnimation(`test-anim-${i}-1`, {
                target: { x: 0, rotation: 0, opacity: 1 },
                properties: {
                    x: { to: 200, easing: 'easeOutBounce' },
                    rotation: { to: Math.PI * 2, easing: 'linear' },
                    opacity: { to: 0.5, easing: 'easeInOutQuad' }
                },
                duration: 1500
            }));
            
            timeline.add(engine.createPropertyAnimation(`test-anim-${i}-2`, {
                target: { x: 200, y: 0, scale: 1 },
                properties: {
                    x: { to: 0, easing: 'easeInOutElastic' },
                    y: { to: 100, easing: 'easeOutBounce' },
                    scale: { to: 2, easing: 'easeInOutBack' }
                },
                duration: 2000
            }), 500); // 500ms delay
            
            timeline.loop = true;
            timeline.start();
        }

        // Multiple particle systems
        if (particleCount > 0) {
            const particleSystem = engine.createParticleSystem('test-particles-moderate', {
                maxParticles: particleCount
            });
            
            // Fire effect
            const fireEmitter = particleSystem.createEmitter({
                x: engine.canvas.width * 0.25,
                y: engine.canvas.height * 0.75,
                emissionRate: particleCount / 20,
                particleLife: { min: 1, max: 3 },
                particleColor: '#ff4500',
                velocity: { x: { min: -20, max: 20 }, y: { min: -80, max: -40 } },
                gravity: -30,
                opacityOverTime: { end: 0 }
            });
            
            // Snow effect
            const snowEmitter = particleSystem.createEmitter({
                x: engine.canvas.width * 0.75,
                y: 0,
                emissionRate: particleCount / 30,
                particleLife: { min: 3, max: 6 },
                particleColor: '#ffffff',
                velocity: { x: { min: -10, max: 10 }, y: { min: 20, max: 60 } },
                gravity: 20
            });
        }
    }

    setupHeavyAnimations(engine, particleCount, animationCount) {
        // Complex nested animations
        for (let i = 0; i < animationCount; i++) {
            const group = engine.createAnimationGroup(`test-group-${i}`);
            
            // Create multiple simultaneous animations
            for (let j = 0; j < 3; j++) {
                const animation = engine.createPropertyAnimation(`test-heavy-${i}-${j}`, {
                    target: { 
                        x: Math.random() * engine.canvas.width,
                        y: Math.random() * engine.canvas.height,
                        rotation: 0,
                        scale: 1,
                        opacity: 1
                    },
                    properties: {
                        x: { to: Math.random() * engine.canvas.width, easing: 'easeInOutCubic' },
                        y: { to: Math.random() * engine.canvas.height, easing: 'easeInOutCubic' },
                        rotation: { to: Math.PI * 4, easing: 'linear' },
                        scale: { to: 0.5 + Math.random(), easing: 'easeInOutElastic' },
                        opacity: { to: 0.3 + Math.random() * 0.7, easing: 'easeInOutSine' }
                    },
                    duration: 3000 + Math.random() * 2000,
                    loop: true,
                    yoyo: true
                });
                
                group.add(animation);
            }
            
            group.start();
        }

        // Complex particle systems with force fields
        if (particleCount > 0) {
            const particleSystem = engine.createParticleSystem('test-particles-heavy', {
                maxParticles: particleCount,
                blendMode: 'screen'
            });
            
            // Multiple emitters
            for (let i = 0; i < 5; i++) {
                const emitter = particleSystem.createEmitter({
                    x: (engine.canvas.width / 5) * i,
                    y: engine.canvas.height / 2,
                    emissionRate: particleCount / 50,
                    particleLife: { min: 2, max: 5 },
                    particleSize: { min: 1, max: 6 },
                    particleColor: `hsl(${i * 60}, 70%, 60%)`,
                    velocity: {
                        x: { min: -100, max: 100 },
                        y: { min: -100, max: 100 }
                    },
                    gravity: 20,
                    friction: 0.01,
                    opacityOverTime: { end: 0 },
                    scaleOverTime: { end: 0.2 }
                });
            }
            
            // Add force fields
            particleSystem.createForceField({
                x: engine.canvas.width / 2,
                y: engine.canvas.height / 2,
                radius: 200,
                strength: 50,
                type: 'vortex'
            });
        }
    }

    setupStressTestAnimations(engine, particleCount, animationCount) {
        // Maximum complexity animations
        this.setupHeavyAnimations(engine, particleCount, animationCount);
        
        // Additional stress elements
        for (let i = 0; i < 10; i++) {
            const stressAnimation = engine.createPropertyAnimation(`stress-${i}`, {
                target: new Array(20).fill(0).map(() => Math.random()),
                properties: new Array(20).fill(0).reduce((props, _, index) => {
                    props[index] = { 
                        to: Math.random(),
                        easing: ['linear', 'easeInOutSine', 'easeOutBounce'][Math.floor(Math.random() * 3)]
                    };
                    return props;
                }, {}),
                duration: 1000 + Math.random() * 3000,
                loop: true,
                yoyo: true
            });
            
            stressAnimation.start();
        }
    }

    startMonitoring(testResult) {
        let lastTime = performance.now();
        let frameCount = 0;
        
        const monitor = () => {
            const currentTime = performance.now();
            const deltaTime = currentTime - lastTime;
            
            frameCount++;
            
            // Calculate frame rate every second
            if (deltaTime >= 1000) {
                const fps = Math.round((frameCount * 1000) / deltaTime);
                testResult.metrics.frameRate.push(fps);
                
                frameCount = 0;
                lastTime = currentTime;
            }
            
            // Collect other metrics
            testResult.metrics.renderTime.push(deltaTime);
            
            // Memory usage (if available)
            if (performance.memory) {
                testResult.metrics.memoryUsage.push({
                    used: performance.memory.usedJSHeapSize / 1024 / 1024, // MB
                    allocated: performance.memory.totalJSHeapSize / 1024 / 1024, // MB
                    limit: performance.memory.jsHeapSizeLimit / 1024 / 1024 // MB
                });
            }
            
            if (this.isRunning) {
                requestAnimationFrame(monitor);
            }
        };
        
        requestAnimationFrame(monitor);
    }

    stopMonitoring() {
        // Monitoring stops when isRunning becomes false
    }

    cleanupTestScenario(engine) {
        // Remove all test animations and particle systems
        const animationsToRemove = [];
        const particleSystemsToRemove = [];
        
        for (const [id, animation] of engine.propertyAnimations) {
            if (id.startsWith('test-') || id.startsWith('stress-')) {
                animationsToRemove.push(id);
            }
        }
        
        for (const [id, system] of engine.particleSystems) {
            if (id.startsWith('test-')) {
                particleSystemsToRemove.push(id);
            }
        }
        
        animationsToRemove.forEach(id => {
            engine.removePropertyAnimation(id);
        });
        
        particleSystemsToRemove.forEach(id => {
            engine.removeParticleSystem(id);
        });
        
        // Clear timelines and groups
        engine.timelines.clear();
        engine.animationGroups.clear();
    }

    calculateSummary(metrics) {
        const summary = {};
        
        // Frame rate analysis
        if (metrics.frameRate.length > 0) {
            summary.frameRate = {
                average: this.calculateAverage(metrics.frameRate),
                min: Math.min(...metrics.frameRate),
                max: Math.max(...metrics.frameRate),
                median: this.calculateMedian(metrics.frameRate),
                below30fps: metrics.frameRate.filter(fps => fps < 30).length,
                below45fps: metrics.frameRate.filter(fps => fps < 45).length
            };
        }
        
        // Render time analysis
        if (metrics.renderTime.length > 0) {
            summary.renderTime = {
                average: this.calculateAverage(metrics.renderTime),
                min: Math.min(...metrics.renderTime),
                max: Math.max(...metrics.renderTime),
                median: this.calculateMedian(metrics.renderTime)
            };
        }
        
        // Memory analysis
        if (metrics.memoryUsage.length > 0) {
            const memoryUsed = metrics.memoryUsage.map(m => m.used);
            summary.memory = {
                averageUsed: this.calculateAverage(memoryUsed),
                minUsed: Math.min(...memoryUsed),
                maxUsed: Math.max(...memoryUsed),
                memoryIncrease: Math.max(...memoryUsed) - Math.min(...memoryUsed)
            };
        }
        
        return summary;
    }

    calculateAverage(array) {
        return array.length > 0 ? array.reduce((a, b) => a + b, 0) / array.length : 0;
    }

    calculateMedian(array) {
        const sorted = [...array].sort((a, b) => a - b);
        const mid = Math.floor(sorted.length / 2);
        return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
    }

    generateReport(testResults) {
        const report = {
            deviceInfo: this.deviceInfo,
            testResults,
            overallSummary: {},
            recommendations: [],
            performanceGrade: 'A',
            timestamp: new Date().toISOString()
        };
        
        // Calculate overall performance metrics
        const allFrameRates = testResults.flatMap(result => result.metrics.frameRate);
        const allMemoryUsage = testResults.flatMap(result => 
            result.metrics.memoryUsage.map(m => m.used)
        );
        
        report.overallSummary = {
            averageFrameRate: this.calculateAverage(allFrameRates),
            minFrameRate: Math.min(...allFrameRates),
            worstTest: testResults.find(result => 
                Math.min(...result.metrics.frameRate) === Math.min(...allFrameRates)
            )?.config.name,
            memoryEfficiency: allMemoryUsage.length > 0 ? 
                (Math.max(...allMemoryUsage) - Math.min(...allMemoryUsage)) < 20 : true
        };
        
        // Generate recommendations
        report.recommendations = this.generateRecommendations(report);
        
        // Calculate performance grade
        report.performanceGrade = this.calculatePerformanceGrade(report);
        
        return report;
    }

    generateRecommendations(report) {
        const recommendations = [];
        const { overallSummary } = report;
        
        if (overallSummary.averageFrameRate < this.thresholds.minFrameRate) {
            recommendations.push({
                type: 'critical',
                message: 'Frame rate is below minimum threshold. Consider reducing particle count or animation complexity.',
                priority: 'high'
            });
        } else if (overallSummary.averageFrameRate < this.thresholds.warningFrameRate) {
            recommendations.push({
                type: 'warning',
                message: 'Frame rate is below optimal. Consider optimizing animations for better performance.',
                priority: 'medium'
            });
        }
        
        if (!overallSummary.memoryEfficiency) {
            recommendations.push({
                type: 'warning',
                message: 'High memory usage detected. Check for memory leaks in particle systems.',
                priority: 'medium'
            });
        }
        
        if (this.deviceInfo.pixelRatio > 1) {
            recommendations.push({
                type: 'info',
                message: 'High DPI display detected. Consider adjusting canvas resolution for better performance.',
                priority: 'low'
            });
        }
        
        return recommendations;
    }

    calculatePerformanceGrade(report) {
        const { overallSummary } = report;
        let score = 100;
        
        if (overallSummary.averageFrameRate < this.thresholds.minFrameRate) {
            score -= 30;
        } else if (overallSummary.averageFrameRate < this.thresholds.warningFrameRate) {
            score -= 15;
        }
        
        if (!overallSummary.memoryEfficiency) {
            score -= 20;
        }
        
        if (overallSummary.minFrameRate < 20) {
            score -= 25;
        }
        
        if (score >= 90) return 'A+';
        if (score >= 80) return 'A';
        if (score >= 70) return 'B';
        if (score >= 60) return 'C';
        if (score >= 50) return 'D';
        return 'F';
    }

    displayReport(report) {
        console.group('🚀 Animation Performance Test Report');
        console.log('📊 Overall Grade:', report.performanceGrade);
        console.log('📈 Average Frame Rate:', report.overallSummary.averageFrameRate.toFixed(1), 'fps');
        console.log('⚡ Minimum Frame Rate:', report.overallSummary.minFrameRate, 'fps');
        console.log('🔥 Worst Performing Test:', report.overallSummary.worstTest);
        
        if (report.recommendations.length > 0) {
            console.group('💡 Recommendations');
            report.recommendations.forEach(rec => {
                const emoji = rec.type === 'critical' ? '🚨' : rec.type === 'warning' ? '⚠️' : 'ℹ️';
                console.log(`${emoji} ${rec.message}`);
            });
            console.groupEnd();
        }
        
        console.group('📱 Device Information');
        console.log('Screen:', `${this.deviceInfo.screenWidth}×${this.deviceInfo.screenHeight}`);
        console.log('Pixel Ratio:', this.deviceInfo.pixelRatio);
        console.log('CPU Cores:', this.deviceInfo.hardwareConcurrency);
        console.log('Memory:', this.deviceInfo.memory, 'GB');
        console.groupEnd();
        
        console.groupEnd();
        
        // Create visual report
        this.createVisualReport(report);
    }

    createVisualReport(report) {
        // Create a detailed HTML report
        const reportHtml = this.generateReportHTML(report);
        
        // Create and show report window
        const reportWindow = window.open('', 'PerformanceReport', 'width=800,height=600,scrollbars=yes');
        reportWindow.document.write(reportHtml);
        reportWindow.document.close();
    }

    generateReportHTML(report) {
        return `
<!DOCTYPE html>
<html>
<head>
    <title>Animation Performance Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
        .report-container { max-width: 1000px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .grade { font-size: 3em; text-align: center; margin: 20px 0; }
        .grade.A, .grade.Aplus { color: #22c55e; }
        .grade.B { color: #3b82f6; }
        .grade.C { color: #f59e0b; }
        .grade.D, .grade.F { color: #ef4444; }
        .metric { background: #f8f9fa; padding: 15px; margin: 10px 0; border-radius: 6px; }
        .recommendation { padding: 10px; margin: 5px 0; border-radius: 4px; }
        .critical { background: #fee2e2; border-left: 4px solid #ef4444; }
        .warning { background: #fef3c7; border-left: 4px solid #f59e0b; }
        .info { background: #dbeafe; border-left: 4px solid #3b82f6; }
        .device-info { background: #f3f4f6; padding: 15px; border-radius: 6px; }
        .test-result { border: 1px solid #e5e7eb; margin: 10px 0; padding: 15px; border-radius: 6px; }
        table { width: 100%; border-collapse: collapse; margin: 10px 0; }
        th, td { text-align: left; padding: 8px; border-bottom: 1px solid #e5e7eb; }
        th { background: #f8f9fa; }
    </style>
</head>
<body>
    <div class="report-container">
        <h1>🚀 Animation Performance Report</h1>
        <div class="grade ${report.performanceGrade.replace('+', 'plus')}">${report.performanceGrade}</div>
        
        <div class="metric">
            <h3>📊 Overall Performance</h3>
            <p><strong>Average Frame Rate:</strong> ${report.overallSummary.averageFrameRate.toFixed(1)} fps</p>
            <p><strong>Minimum Frame Rate:</strong> ${report.overallSummary.minFrameRate} fps</p>
            <p><strong>Worst Test:</strong> ${report.overallSummary.worstTest}</p>
            <p><strong>Memory Efficient:</strong> ${report.overallSummary.memoryEfficiency ? 'Yes' : 'No'}</p>
        </div>
        
        <div class="device-info">
            <h3>📱 Device Information</h3>
            <table>
                <tr><td>Screen Resolution</td><td>${this.deviceInfo.screenWidth} × ${this.deviceInfo.screenHeight}</td></tr>
                <tr><td>Window Size</td><td>${this.deviceInfo.windowWidth} × ${this.deviceInfo.windowHeight}</td></tr>
                <tr><td>Pixel Ratio</td><td>${this.deviceInfo.pixelRatio}</td></tr>
                <tr><td>CPU Cores</td><td>${this.deviceInfo.hardwareConcurrency}</td></tr>
                <tr><td>Memory</td><td>${this.deviceInfo.memory} GB</td></tr>
                <tr><td>GPU</td><td>${this.deviceInfo.gpu}</td></tr>
                <tr><td>Platform</td><td>${this.deviceInfo.platform}</td></tr>
            </table>
        </div>
        
        ${report.recommendations.length > 0 ? `
        <div>
            <h3>💡 Recommendations</h3>
            ${report.recommendations.map(rec => `
                <div class="recommendation ${rec.type}">
                    <strong>${rec.type.toUpperCase()}:</strong> ${rec.message}
                </div>
            `).join('')}
        </div>
        ` : ''}
        
        <div>
            <h3>📈 Test Results</h3>
            ${report.testResults.map(result => `
                <div class="test-result">
                    <h4>${result.config.name}</h4>
                    <p><em>${result.config.description}</em></p>
                    <table>
                        <tr>
                            <th>Metric</th>
                            <th>Average</th>
                            <th>Min</th>
                            <th>Max</th>
                        </tr>
                        <tr>
                            <td>Frame Rate (fps)</td>
                            <td>${result.summary.frameRate?.average?.toFixed(1) || 'N/A'}</td>
                            <td>${result.summary.frameRate?.min || 'N/A'}</td>
                            <td>${result.summary.frameRate?.max || 'N/A'}</td>
                        </tr>
                        <tr>
                            <td>Render Time (ms)</td>
                            <td>${result.summary.renderTime?.average?.toFixed(2) || 'N/A'}</td>
                            <td>${result.summary.renderTime?.min?.toFixed(2) || 'N/A'}</td>
                            <td>${result.summary.renderTime?.max?.toFixed(2) || 'N/A'}</td>
                        </tr>
                        ${result.summary.memory ? `
                        <tr>
                            <td>Memory Usage (MB)</td>
                            <td>${result.summary.memory.averageUsed.toFixed(1)}</td>
                            <td>${result.summary.memory.minUsed.toFixed(1)}</td>
                            <td>${result.summary.memory.maxUsed.toFixed(1)}</td>
                        </tr>
                        ` : ''}
                    </table>
                </div>
            `).join('')}
        </div>
        
        <div style="margin-top: 30px; text-align: center; color: #6b7280;">
            <small>Report generated on ${new Date(report.timestamp).toLocaleString()}</small>
        </div>
    </div>
</body>
</html>
        `;
    }

    resetMetrics() {
        Object.keys(this.performanceMetrics).forEach(key => {
            this.performanceMetrics[key] = [];
        });
    }

    wait(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Public API
    async quickTest(animationEngine, testName = 'Moderate Particle Effects') {
        const testConfig = this.testConfigurations.find(config => config.name === testName);
        if (!testConfig) {
            throw new Error(`Test configuration "${testName}" not found`);
        }
        
        return await this.runSingleTest(testConfig, animationEngine);
    }

    getAvailableTests() {
        return this.testConfigurations.map(config => ({
            name: config.name,
            description: config.description
        }));
    }

    exportResults(report) {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(report, null, 2));
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", `animation-performance-${Date.now()}.json`);
        document.body.appendChild(downloadAnchorNode);
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
    }
}

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { AnimationPerformanceTester };
} else if (typeof window !== 'undefined') {
    window.AnimationPerformanceTester = AnimationPerformanceTester;
}
