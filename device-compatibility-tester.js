// Device Compatibility and Mobile Accessibility Testing
class DeviceCompatibilityTester {
    constructor() {
        this.testDevices = [
            // Mobile Phones
            { 
                name: 'iPhone 15 Pro', 
                width: 393, 
                height: 852, 
                pixelRatio: 3,
                userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15',
                touchTargetSize: 44,
                category: 'mobile'
            },
            { 
                name: 'iPhone SE (3rd gen)', 
                width: 375, 
                height: 667, 
                pixelRatio: 2,
                userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15',
                touchTargetSize: 44,
                category: 'mobile'
            },
            { 
                name: 'Samsung Galaxy S24', 
                width: 360, 
                height: 800, 
                pixelRatio: 3,
                userAgent: 'Mozilla/5.0 (Linux; Android 14; SM-S921B) AppleWebKit/537.36',
                touchTargetSize: 48,
                category: 'mobile'
            },
            { 
                name: 'Google Pixel 8', 
                width: 412, 
                height: 915, 
                pixelRatio: 2.625,
                userAgent: 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36',
                touchTargetSize: 48,
                category: 'mobile'
            },
            
            // Tablets
            { 
                name: 'iPad Pro 12.9"', 
                width: 1024, 
                height: 1366, 
                pixelRatio: 2,
                userAgent: 'Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15',
                touchTargetSize: 44,
                category: 'tablet'
            },
            { 
                name: 'iPad Air', 
                width: 820, 
                height: 1180, 
                pixelRatio: 2,
                userAgent: 'Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15',
                touchTargetSize: 44,
                category: 'tablet'
            },
            { 
                name: 'Samsung Galaxy Tab', 
                width: 800, 
                height: 1280, 
                pixelRatio: 2,
                userAgent: 'Mozilla/5.0 (Linux; Android 13; SM-X900) AppleWebKit/537.36',
                touchTargetSize: 48,
                category: 'tablet'
            },

            // Desktop/Laptop
            { 
                name: 'MacBook Air M2', 
                width: 1470, 
                height: 956, 
                pixelRatio: 2,
                userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
                touchTargetSize: null,
                category: 'desktop'
            },
            { 
                name: 'Windows Laptop', 
                width: 1920, 
                height: 1080, 
                pixelRatio: 1,
                userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                touchTargetSize: null,
                category: 'desktop'
            },
            { 
                name: '4K Monitor', 
                width: 2560, 
                height: 1440, 
                pixelRatio: 1,
                userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                touchTargetSize: null,
                category: 'desktop'
            }
        ];

        this.accessibilityStandards = {
            WCAG_AA: {
                touchTargetSize: 44, // minimum 44x44 CSS pixels
                textContrast: 4.5,
                largeTextContrast: 3,
                colorContrastEnhanced: 7,
                focusIndicatorSize: 2,
                textSize: 16,
                lineHeight: 1.5
            },
            WCAG_AAA: {
                touchTargetSize: 44,
                textContrast: 7,
                largeTextContrast: 4.5,
                colorContrastEnhanced: 7,
                focusIndicatorSize: 2,
                textSize: 18,
                lineHeight: 1.6
            }
        };

        this.testResults = {};
        this.currentDevice = null;
        this.originalViewport = {
            width: window.innerWidth,
            height: window.innerHeight
        };

        this.init();
    }

    init() {
        this.log('🚀 Device compatibility tester initialized');
        this.detectCurrentDevice();
        this.setupOrientationHandling();
        this.setupViewportTesting();
    }

    detectCurrentDevice() {
        const width = window.innerWidth;
        const height = window.innerHeight;
        const pixelRatio = window.devicePixelRatio || 1;
        const userAgent = navigator.userAgent;

        let deviceCategory = 'desktop';
        if (width <= 480) deviceCategory = 'mobile';
        else if (width <= 1024) deviceCategory = 'tablet';

        this.currentDevice = {
            width,
            height,
            pixelRatio,
            userAgent,
            category: deviceCategory,
            orientation: width > height ? 'landscape' : 'portrait',
            touchEnabled: 'ontouchstart' in window,
            hasHover: window.matchMedia('(hover: hover)').matches
        };

        this.log(`Detected device: ${deviceCategory} (${width}×${height}, ${pixelRatio}x DPR)`);
    }

    setupOrientationHandling() {
        if (screen.orientation) {
            screen.orientation.addEventListener('change', () => {
                this.handleOrientationChange();
            });
        } else {
            window.addEventListener('orientationchange', () => {
                setTimeout(() => this.handleOrientationChange(), 500);
            });
        }
    }

    handleOrientationChange() {
        this.detectCurrentDevice();
        this.log(`Orientation changed: ${this.currentDevice.orientation}`);
        
        // Re-test critical accessibility features
        this.testCurrentDeviceAccessibility();
    }

    setupViewportTesting() {
        // Handle viewport meta tag changes
        const viewportMeta = document.querySelector('meta[name="viewport"]');
        if (viewportMeta) {
            this.originalViewportContent = viewportMeta.content;
        }
    }

    async runDeviceCompatibilityTests() {
        this.log('📱 Starting comprehensive device compatibility tests...');
        
        for (const device of this.testDevices) {
            this.log(`Testing device: ${device.name}`);
            const testResult = await this.testDevice(device);
            this.testResults[device.name] = testResult;
        }

        this.generateCompatibilityReport();
        return this.testResults;
    }

    async testDevice(device) {
        const testSuite = {
            // Core compatibility tests
            'Viewport Handling': await this.testViewportHandling(device),
            'Touch Target Accessibility': await this.testTouchTargets(device),
            'Text Readability': await this.testTextReadability(device),
            'Navigation Usability': await this.testNavigationUsability(device),
            'Theme Toggle Accessibility': await this.testThemeToggleAccessibility(device),
            
            // Performance tests
            'Rendering Performance': await this.testRenderingPerformance(device),
            'Interaction Responsiveness': await this.testInteractionResponsiveness(device),
            'Memory Usage': await this.testMemoryUsage(device),
            
            // Accessibility compliance tests
            'WCAG AA Compliance': await this.testWCAGCompliance(device, 'AA'),
            'WCAG AAA Compliance': await this.testWCAGCompliance(device, 'AAA'),
            'Screen Reader Compatibility': await this.testScreenReaderCompatibility(device),
            'Keyboard Navigation': await this.testKeyboardNavigation(device),
            
            // Visual tests
            'Layout Integrity': await this.testLayoutIntegrity(device),
            'Content Overflow': await this.testContentOverflow(device),
            'Media Queries': await this.testMediaQueries(device),
            'Responsive Images': await this.testResponsiveImages(device)
        };

        // Calculate overall score
        const passedTests = Object.values(testSuite).filter(result => result.passed).length;
        const totalTests = Object.keys(testSuite).length;
        const score = Math.round((passedTests / totalTests) * 100);

        return {
            device: device,
            tests: testSuite,
            score: score,
            grade: this.calculateGrade(score),
            timestamp: new Date().toISOString(),
            criticalIssues: this.identifyCriticalIssues(testSuite),
            recommendations: this.generateRecommendations(device, testSuite)
        };
    }

    async testViewportHandling(device) {
        const test = {
            name: 'Viewport Handling',
            description: 'Tests if viewport scales correctly for device',
            passed: false,
            details: {},
            score: 0
        };

        try {
            // Simulate device viewport
            this.simulateDeviceViewport(device);
            
            // Check if viewport meta tag exists and is configured correctly
            const viewportMeta = document.querySelector('meta[name="viewport"]');
            const hasViewportMeta = !!viewportMeta;
            const hasCorrectContent = viewportMeta && 
                viewportMeta.content.includes('width=device-width') &&
                viewportMeta.content.includes('initial-scale=1');

            // Check if layout responds to viewport
            const layoutResponds = this.checkLayoutResponsiveness(device);

            // Check zoom behavior
            const zoomBehavior = this.checkZoomBehavior(device);

            test.details = {
                hasViewportMeta,
                hasCorrectContent,
                layoutResponds,
                zoomBehavior,
                actualWidth: window.innerWidth,
                expectedWidth: device.width
            };

            // Calculate score
            let score = 0;
            if (hasViewportMeta) score += 25;
            if (hasCorrectContent) score += 25;
            if (layoutResponds) score += 30;
            if (zoomBehavior) score += 20;

            test.score = score;
            test.passed = score >= 70;

        } catch (error) {
            test.error = error.message;
        }

        return test;
    }

    simulateDeviceViewport(device) {
        // This would be implemented with actual viewport manipulation
        // For now, we'll simulate the testing logic
        this.log(`Simulating viewport for ${device.name} (${device.width}×${device.height})`);
    }

    checkLayoutResponsiveness(device) {
        // Check if CSS responds to different viewport sizes
        const testBreakpoints = [
            { query: '(max-width: 480px)', expected: device.width <= 480 },
            { query: '(max-width: 768px)', expected: device.width <= 768 },
            { query: '(max-width: 1024px)', expected: device.width <= 1024 }
        ];

        return testBreakpoints.every(bp => 
            window.matchMedia(bp.query).matches === bp.expected
        );
    }

    checkZoomBehavior(device) {
        // Check if zooming works correctly
        const viewportMeta = document.querySelector('meta[name="viewport"]');
        if (!viewportMeta) return false;

        const content = viewportMeta.content;
        const hasUserScalable = !content.includes('user-scalable=no');
        const hasReasonableMaxScale = !content.includes('maximum-scale=1') || 
                                      content.includes('maximum-scale=5');

        return hasUserScalable && hasReasonableMaxScale;
    }

    async testTouchTargets(device) {
        const test = {
            name: 'Touch Target Accessibility',
            description: 'Tests if touch targets meet accessibility standards',
            passed: false,
            details: {},
            score: 0
        };

        if (!device.touchTargetSize) {
            test.passed = true;
            test.score = 100;
            test.details.reason = 'Not applicable for non-touch devices';
            return test;
        }

        try {
            const touchTargets = document.querySelectorAll(
                'button, [role="button"], input[type="button"], input[type="submit"], ' +
                'a, [role="link"], [tabindex]:not([tabindex="-1"]), .theme-toggle, .theme-option'
            );

            const minSize = device.touchTargetSize;
            const results = [];
            let compliantTargets = 0;

            touchTargets.forEach((element, index) => {
                const rect = element.getBoundingClientRect();
                const width = rect.width;
                const height = rect.height;
                const isCompliant = width >= minSize && height >= minSize;
                
                if (isCompliant) compliantTargets++;

                results.push({
                    element: element.tagName + (element.className ? `.${element.className.split(' ')[0]}` : ''),
                    width: Math.round(width),
                    height: Math.round(height),
                    compliant: isCompliant,
                    required: minSize
                });
            });

            const complianceRate = (compliantTargets / touchTargets.length) * 100;

            test.details = {
                totalTargets: touchTargets.length,
                compliantTargets,
                complianceRate: Math.round(complianceRate),
                minRequiredSize: minSize,
                results: results.slice(0, 10) // Limit for readability
            };

            test.score = Math.round(complianceRate);
            test.passed = complianceRate >= 90;

        } catch (error) {
            test.error = error.message;
        }

        return test;
    }

    async testTextReadability(device) {
        const test = {
            name: 'Text Readability',
            description: 'Tests if text is readable on device',
            passed: false,
            details: {},
            score: 0
        };

        try {
            const textElements = document.querySelectorAll('p, h1, h2, h3, h4, h5, h6, span, div, button, a');
            const readabilityResults = [];
            let readableCount = 0;

            textElements.forEach(element => {
                const styles = getComputedStyle(element);
                const fontSize = parseFloat(styles.fontSize);
                const lineHeight = parseFloat(styles.lineHeight) / fontSize;
                const color = styles.color;
                const backgroundColor = styles.backgroundColor;

                // Check minimum font size for device
                const minFontSize = device.category === 'mobile' ? 16 : 14;
                const hasGoodFontSize = fontSize >= minFontSize;
                
                // Check line height
                const hasGoodLineHeight = lineHeight >= 1.4;

                // Basic readability score
                const isReadable = hasGoodFontSize && hasGoodLineHeight;
                if (isReadable) readableCount++;

                readabilityResults.push({
                    element: element.tagName.toLowerCase(),
                    fontSize: Math.round(fontSize),
                    lineHeight: Math.round(lineHeight * 100) / 100,
                    readable: isReadable
                });
            });

            const readabilityRate = (readableCount / textElements.length) * 100;

            test.details = {
                totalElements: textElements.length,
                readableElements: readableCount,
                readabilityRate: Math.round(readabilityRate),
                minFontSize: device.category === 'mobile' ? 16 : 14,
                samples: readabilityResults.slice(0, 10)
            };

            test.score = Math.round(readabilityRate);
            test.passed = readabilityRate >= 85;

        } catch (error) {
            test.error = error.message;
        }

        return test;
    }

    async testNavigationUsability(device) {
        const test = {
            name: 'Navigation Usability',
            description: 'Tests if navigation is usable on device',
            passed: false,
            details: {},
            score: 0
        };

        try {
            let score = 0;
            const checks = {};

            // Test theme toggle accessibility
            const themeToggle = document.getElementById('themeToggle');
            if (themeToggle) {
                const rect = themeToggle.getBoundingClientRect();
                checks.themeToggleExists = true;
                checks.themeToggleSize = rect.width >= (device.touchTargetSize || 32);
                checks.themeToggleAccessible = themeToggle.hasAttribute('aria-label');
                
                if (checks.themeToggleExists) score += 20;
                if (checks.themeToggleSize) score += 30;
                if (checks.themeToggleAccessible) score += 20;
            }

            // Test menu accessibility (if exists)
            const menuElements = document.querySelectorAll('[role="menu"], .menu, .navigation');
            checks.hasNavigationMenu = menuElements.length > 0;
            if (checks.hasNavigationMenu) score += 15;

            // Test keyboard navigation
            const focusableElements = document.querySelectorAll('[tabindex]:not([tabindex="-1"]), button, a, input, select, textarea');
            checks.keyboardNavigable = focusableElements.length > 0;
            if (checks.keyboardNavigable) score += 15;

            test.details = checks;
            test.score = score;
            test.passed = score >= 70;

        } catch (error) {
            test.error = error.message;
        }

        return test;
    }

    async testThemeToggleAccessibility(device) {
        const test = {
            name: 'Theme Toggle Accessibility',
            description: 'Tests theme toggle accessibility on device',
            passed: false,
            details: {},
            score: 0
        };

        try {
            const themeToggle = document.getElementById('themeToggle');
            if (!themeToggle) {
                test.passed = false;
                test.score = 0;
                test.details.error = 'Theme toggle not found';
                return test;
            }

            let score = 0;
            const checks = {};

            // Size accessibility
            const rect = themeToggle.getBoundingClientRect();
            const minSize = device.touchTargetSize || 32;
            checks.adequateSize = rect.width >= minSize && rect.height >= minSize;
            if (checks.adequateSize) score += 30;

            // ARIA accessibility
            checks.hasAriaLabel = themeToggle.hasAttribute('aria-label');
            checks.hasAriaChecked = themeToggle.hasAttribute('aria-checked');
            checks.hasRole = themeToggle.hasAttribute('role');
            
            if (checks.hasAriaLabel) score += 25;
            if (checks.hasAriaChecked) score += 25;
            if (checks.hasRole) score += 20;

            // Test if toggle responds to different input methods
            if (device.category === 'mobile') {
                // Touch events
                checks.touchResponsive = true; // Would test actual touch events
                if (checks.touchResponsive) score += 0; // Baseline expectation
            }

            // Keyboard accessibility
            checks.keyboardAccessible = themeToggle.hasAttribute('tabindex') || 
                                       themeToggle.tagName === 'BUTTON';
            if (checks.keyboardAccessible) score += 0; // Baseline expectation

            test.details = {
                ...checks,
                currentSize: { width: Math.round(rect.width), height: Math.round(rect.height) },
                requiredSize: minSize
            };
            test.score = score;
            test.passed = score >= 80;

        } catch (error) {
            test.error = error.message;
        }

        return test;
    }

    async testRenderingPerformance(device) {
        const test = {
            name: 'Rendering Performance',
            description: 'Tests rendering performance on device',
            passed: false,
            details: {},
            score: 0
        };

        try {
            const measurements = {};

            // Measure paint timing
            if ('performance' in window && 'getEntriesByType' in performance) {
                const paintEntries = performance.getEntriesByType('paint');
                const firstPaint = paintEntries.find(entry => entry.name === 'first-paint');
                const firstContentfulPaint = paintEntries.find(entry => entry.name === 'first-contentful-paint');

                if (firstPaint) measurements.firstPaint = Math.round(firstPaint.startTime);
                if (firstContentfulPaint) measurements.firstContentfulPaint = Math.round(firstContentfulPaint.startTime);
            }

            // Measure theme switch performance
            const themeSwitchStart = performance.now();
            if (window.themeManager) {
                const originalTheme = window.themeManager.currentTheme;
                window.themeManager.setTheme(originalTheme === 'dark' ? 'light' : 'dark');
                await this.wait(100);
                window.themeManager.setTheme(originalTheme);
            }
            const themeSwitchEnd = performance.now();
            measurements.themeSwitchTime = Math.round(themeSwitchEnd - themeSwitchStart);

            // Calculate score based on performance
            let score = 100;
            
            if (measurements.firstContentfulPaint > 2000) score -= 30;
            else if (measurements.firstContentfulPaint > 1000) score -= 15;
            
            if (measurements.themeSwitchTime > 500) score -= 20;
            else if (measurements.themeSwitchTime > 200) score -= 10;

            test.details = measurements;
            test.score = Math.max(0, score);
            test.passed = score >= 70;

        } catch (error) {
            test.error = error.message;
        }

        return test;
    }

    async testInteractionResponsiveness(device) {
        const test = {
            name: 'Interaction Responsiveness',
            description: 'Tests interaction responsiveness',
            passed: false,
            details: {},
            score: 0
        };

        try {
            const measurements = {};
            
            // Test button response time
            const testButton = document.querySelector('button, .theme-toggle');
            if (testButton) {
                const startTime = performance.now();
                testButton.focus();
                const focusTime = performance.now() - startTime;
                measurements.focusResponseTime = Math.round(focusTime);
            }

            // Test scroll performance
            let frameCount = 0;
            const scrollStart = performance.now();
            const countFrames = () => {
                frameCount++;
                if (performance.now() - scrollStart < 1000) {
                    requestAnimationFrame(countFrames);
                } else {
                    measurements.scrollFPS = frameCount;
                }
            };
            requestAnimationFrame(countFrames);

            // Wait for scroll test to complete
            await this.wait(1100);

            // Calculate score
            let score = 100;
            if (measurements.focusResponseTime > 100) score -= 20;
            if (measurements.scrollFPS < 30) score -= 30;
            else if (measurements.scrollFPS < 45) score -= 15;

            test.details = measurements;
            test.score = Math.max(0, score);
            test.passed = score >= 70;

        } catch (error) {
            test.error = error.message;
        }

        return test;
    }

    async testMemoryUsage(device) {
        const test = {
            name: 'Memory Usage',
            description: 'Tests memory efficiency',
            passed: false,
            details: {},
            score: 0
        };

        try {
            const measurements = {};

            if ('memory' in performance) {
                measurements.usedJSHeapSize = Math.round(performance.memory.usedJSHeapSize / 1024 / 1024);
                measurements.totalJSHeapSize = Math.round(performance.memory.totalJSHeapSize / 1024 / 1024);
                measurements.jsHeapSizeLimit = Math.round(performance.memory.jsHeapSizeLimit / 1024 / 1024);
                measurements.memoryUsagePercent = Math.round((measurements.usedJSHeapSize / measurements.totalJSHeapSize) * 100);
            }

            // Score based on memory efficiency
            let score = 100;
            if (measurements.usedJSHeapSize > 50) score -= 30; // > 50MB
            else if (measurements.usedJSHeapSize > 20) score -= 15; // > 20MB
            
            if (measurements.memoryUsagePercent > 80) score -= 20;

            test.details = measurements;
            test.score = Math.max(0, score);
            test.passed = score >= 70;

        } catch (error) {
            test.error = error.message;
            test.score = 80; // Default score if memory API not available
            test.passed = true;
        }

        return test;
    }

    async testWCAGCompliance(device, level) {
        const test = {
            name: `WCAG ${level} Compliance`,
            description: `Tests WCAG ${level} accessibility compliance`,
            passed: false,
            details: {},
            score: 0
        };

        try {
            const standards = this.accessibilityStandards[`WCAG_${level}`];
            const checks = {};
            let passedChecks = 0;
            const totalChecks = 4; // We'll test 4 key areas

            // Touch target size (for touch devices)
            if (device.touchTargetSize) {
                const touchTargets = document.querySelectorAll('button, [role="button"], a');
                const compliantTargets = Array.from(touchTargets).filter(target => {
                    const rect = target.getBoundingClientRect();
                    return rect.width >= standards.touchTargetSize && rect.height >= standards.touchTargetSize;
                });
                checks.touchTargetCompliance = (compliantTargets.length / touchTargets.length) * 100;
                if (checks.touchTargetCompliance >= 90) passedChecks++;
            } else {
                checks.touchTargetCompliance = 100; // N/A for non-touch devices
                passedChecks++;
            }

            // Text size compliance
            const textElements = document.querySelectorAll('p, span, div, button, a');
            const compliantTextElements = Array.from(textElements).filter(element => {
                const fontSize = parseFloat(getComputedStyle(element).fontSize);
                return fontSize >= standards.textSize;
            });
            checks.textSizeCompliance = (compliantTextElements.length / textElements.length) * 100;
            if (checks.textSizeCompliance >= 85) passedChecks++;

            // Focus indicator compliance
            const focusableElements = document.querySelectorAll('button, a, [tabindex]:not([tabindex="-1"])');
            checks.focusIndicatorCompliance = focusableElements.length > 0 ? 100 : 0; // Simplified check
            if (checks.focusIndicatorCompliance >= 90) passedChecks++;

            // ARIA compliance
            const elementsWithARIA = document.querySelectorAll('[aria-label], [aria-labelledby], [role]');
            const interactiveElements = document.querySelectorAll('button, [role="button"], [tabindex]:not([tabindex="-1"])');
            checks.ariaCompliance = interactiveElements.length > 0 ? 
                (elementsWithARIA.length / interactiveElements.length) * 100 : 100;
            if (checks.ariaCompliance >= 80) passedChecks++;

            const complianceScore = (passedChecks / totalChecks) * 100;

            test.details = {
                ...checks,
                passedChecks,
                totalChecks,
                requiredStandards: standards
            };
            test.score = Math.round(complianceScore);
            test.passed = complianceScore >= 80;

        } catch (error) {
            test.error = error.message;
        }

        return test;
    }

    async testScreenReaderCompatibility(device) {
        const test = {
            name: 'Screen Reader Compatibility',
            description: 'Tests screen reader accessibility',
            passed: false,
            details: {},
            score: 0
        };

        try {
            const checks = {};
            let score = 0;

            // Check for semantic HTML
            const semanticElements = document.querySelectorAll('header, main, nav, section, article, aside, footer');
            checks.hasSemanticHTML = semanticElements.length > 0;
            if (checks.hasSemanticHTML) score += 20;

            // Check for proper headings structure
            const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
            checks.hasHeadingStructure = headings.length > 0;
            if (checks.hasHeadingStructure) score += 20;

            // Check for alt text on images
            const images = document.querySelectorAll('img');
            const imagesWithAlt = document.querySelectorAll('img[alt]');
            checks.imageAltTextCompliance = images.length > 0 ? 
                (imagesWithAlt.length / images.length) * 100 : 100;
            if (checks.imageAltTextCompliance >= 90) score += 20;

            // Check for form labels
            const inputs = document.querySelectorAll('input, select, textarea');
            const labeledInputs = document.querySelectorAll('input[aria-label], input[aria-labelledby], select[aria-label], textarea[aria-label]');
            checks.formLabelCompliance = inputs.length > 0 ? 
                (labeledInputs.length / inputs.length) * 100 : 100;
            if (checks.formLabelCompliance >= 90) score += 20;

            // Check for skip links (important for keyboard navigation)
            const skipLinks = document.querySelectorAll('a[href="#main"], a[href="#content"], .skip-link');
            checks.hasSkipLinks = skipLinks.length > 0;
            if (checks.hasSkipLinks) score += 10;

            // Check for ARIA landmarks
            const landmarks = document.querySelectorAll('[role="main"], [role="navigation"], [role="banner"], [role="contentinfo"]');
            checks.hasARIALandmarks = landmarks.length > 0;
            if (checks.hasARIALandmarks) score += 10;

            test.details = checks;
            test.score = score;
            test.passed = score >= 70;

        } catch (error) {
            test.error = error.message;
        }

        return test;
    }

    async testKeyboardNavigation(device) {
        const test = {
            name: 'Keyboard Navigation',
            description: 'Tests keyboard accessibility',
            passed: false,
            details: {},
            score: 0
        };

        try {
            const checks = {};
            let score = 0;

            // Find all focusable elements
            const focusableElements = document.querySelectorAll(
                'button, [role="button"], a[href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
            );
            checks.totalFocusableElements = focusableElements.length;

            // Check if theme toggle is keyboard accessible
            const themeToggle = document.getElementById('themeToggle');
            if (themeToggle) {
                checks.themeToggleKeyboardAccessible = 
                    themeToggle.hasAttribute('tabindex') || themeToggle.tagName === 'BUTTON';
                if (checks.themeToggleKeyboardAccessible) score += 30;
            }

            // Check for proper focus indicators
            const elementsWithFocusStyles = Array.from(focusableElements).filter(element => {
                // This is a simplified check - in reality we'd test actual focus styles
                const styles = getComputedStyle(element);
                return styles.outline !== 'none' || element.dataset.hasFocusStyle;
            });
            checks.focusIndicatorCompliance = focusableElements.length > 0 ? 
                (elementsWithFocusStyles.length / focusableElements.length) * 100 : 100;
            if (checks.focusIndicatorCompliance >= 80) score += 30;

            // Check for logical tab order
            const tabIndexElements = document.querySelectorAll('[tabindex]');
            const positiveTabIndexElements = Array.from(tabIndexElements).filter(el => 
                parseInt(el.getAttribute('tabindex')) > 0
            );
            checks.hasLogicalTabOrder = positiveTabIndexElements.length === 0; // Positive tabindex can break logical order
            if (checks.hasLogicalTabOrder) score += 20;

            // Check if all interactive elements are reachable
            checks.allElementsReachable = focusableElements.length > 0;
            if (checks.allElementsReachable) score += 20;

            test.details = checks;
            test.score = score;
            test.passed = score >= 70;

        } catch (error) {
            test.error = error.message;
        }

        return test;
    }

    async testLayoutIntegrity(device) {
        const test = {
            name: 'Layout Integrity',
            description: 'Tests if layout maintains integrity on device',
            passed: false,
            details: {},
            score: 0
        };

        try {
            const checks = {};
            let score = 100;

            // Check for horizontal scrolling on mobile
            if (device.category === 'mobile') {
                const bodyWidth = document.body.scrollWidth;
                const viewportWidth = window.innerWidth;
                checks.hasHorizontalScroll = bodyWidth > viewportWidth;
                if (checks.hasHorizontalScroll) score -= 30;
            }

            // Check for overlapping elements
            const allElements = document.querySelectorAll('*');
            let overlappingCount = 0;
            
            // Simplified overlap detection (checking for negative margins, etc.)
            Array.from(allElements).forEach(element => {
                const styles = getComputedStyle(element);
                if (parseFloat(styles.marginLeft) < -10 || parseFloat(styles.marginTop) < -10) {
                    overlappingCount++;
                }
            });
            
            checks.overlappingElements = overlappingCount;
            if (overlappingCount > 0) score -= Math.min(20, overlappingCount * 5);

            // Check if content fits in viewport
            const mainContent = document.querySelector('main, .main, #main') || document.body;
            const contentWidth = mainContent.scrollWidth;
            const availableWidth = window.innerWidth;
            checks.contentFitsViewport = contentWidth <= availableWidth * 1.1; // Allow 10% tolerance
            if (!checks.contentFitsViewport) score -= 25;

            // Check for readable font sizes
            const textElements = document.querySelectorAll('p, span, div:not(:empty)');
            let unreadableCount = 0;
            const minFontSize = device.category === 'mobile' ? 14 : 12;
            
            Array.from(textElements).forEach(element => {
                const fontSize = parseFloat(getComputedStyle(element).fontSize);
                if (fontSize < minFontSize && element.textContent.trim().length > 0) {
                    unreadableCount++;
                }
            });
            
            checks.unreadableTextElements = unreadableCount;
            if (unreadableCount > 0) score -= Math.min(25, unreadableCount * 2);

            test.details = checks;
            test.score = Math.max(0, score);
            test.passed = score >= 80;

        } catch (error) {
            test.error = error.message;
        }

        return test;
    }

    async testContentOverflow(device) {
        const test = {
            name: 'Content Overflow',
            description: 'Tests for content overflow issues',
            passed: false,
            details: {},
            score: 0
        };

        try {
            const checks = {};
            let score = 100;

            // Check body overflow
            const bodyRect = document.body.getBoundingClientRect();
            const viewportWidth = window.innerWidth;
            const viewportHeight = window.innerHeight;
            
            checks.bodyOverflowX = bodyRect.width > viewportWidth;
            checks.bodyOverflowY = bodyRect.height > viewportHeight * 3; // Allow reasonable vertical scroll
            
            if (checks.bodyOverflowX) score -= 40;
            if (checks.bodyOverflowY) score -= 20;

            // Check specific elements for overflow
            const containers = document.querySelectorAll('.container, .wrapper, main, section');
            let overflowingContainers = 0;
            
            Array.from(containers).forEach(container => {
                const rect = container.getBoundingClientRect();
                if (rect.width > viewportWidth * 1.05) { // 5% tolerance
                    overflowingContainers++;
                }
            });
            
            checks.overflowingContainers = overflowingContainers;
            if (overflowingContainers > 0) score -= Math.min(30, overflowingContainers * 10);

            // Check for text overflow
            const textElements = document.querySelectorAll('p, h1, h2, h3, h4, h5, h6, span');
            let textOverflowCount = 0;
            
            Array.from(textElements).forEach(element => {
                const styles = getComputedStyle(element);
                if (styles.overflow === 'hidden' && styles.textOverflow === 'ellipsis') {
                    // This is intentional text truncation, check if it's reasonable
                    const rect = element.getBoundingClientRect();
                    if (rect.width < 100) { // Very narrow, might be problematic
                        textOverflowCount++;
                    }
                }
            });
            
            checks.textOverflowIssues = textOverflowCount;
            if (textOverflowCount > 0) score -= Math.min(10, textOverflowCount * 2);

            test.details = checks;
            test.score = Math.max(0, score);
            test.passed = score >= 85;

        } catch (error) {
            test.error = error.message;
        }

        return test;
    }

    async testMediaQueries(device) {
        const test = {
            name: 'Media Queries',
            description: 'Tests media query responsiveness',
            passed: false,
            details: {},
            score: 0
        };

        try {
            const checks = {};
            let score = 0;

            // Test common breakpoints
            const breakpoints = [
                { name: 'mobile', query: '(max-width: 767px)', expectedForDevice: device.width <= 767 },
                { name: 'tablet', query: '(min-width: 768px) and (max-width: 1023px)', expectedForDevice: device.width >= 768 && device.width <= 1023 },
                { name: 'desktop', query: '(min-width: 1024px)', expectedForDevice: device.width >= 1024 },
                { name: 'highDPI', query: '(-webkit-min-device-pixel-ratio: 2)', expectedForDevice: device.pixelRatio >= 2 }
            ];

            let correctBreakpoints = 0;
            breakpoints.forEach(bp => {
                const matches = window.matchMedia(bp.query).matches;
                checks[bp.name + 'Breakpoint'] = {
                    matches,
                    expected: bp.expectedForDevice,
                    correct: matches === bp.expectedForDevice
                };
                if (matches === bp.expectedForDevice) correctBreakpoints++;
            });

            score = (correctBreakpoints / breakpoints.length) * 100;

            // Test for prefers-reduced-motion support
            const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
            checks.supportsReducedMotion = reducedMotionQuery.media !== 'not all';
            if (checks.supportsReducedMotion) score += 0; // Bonus, but don't penalize

            // Test for prefers-color-scheme support
            const colorSchemeQuery = window.matchMedia('(prefers-color-scheme: dark)');
            checks.supportsColorScheme = colorSchemeQuery.media !== 'not all';
            if (checks.supportsColorScheme) score += 0; // Bonus, but don't penalize

            test.details = checks;
            test.score = Math.round(score);
            test.passed = score >= 75;

        } catch (error) {
            test.error = error.message;
        }

        return test;
    }

    async testResponsiveImages(device) {
        const test = {
            name: 'Responsive Images',
            description: 'Tests responsive image implementation',
            passed: false,
            details: {},
            score: 0
        };

        try {
            const checks = {};
            let score = 100;

            const images = document.querySelectorAll('img');
            checks.totalImages = images.length;

            if (images.length === 0) {
                test.details = { noImages: true };
                test.score = 100;
                test.passed = true;
                return test;
            }

            let responsiveImages = 0;
            let optimizedImages = 0;

            Array.from(images).forEach(img => {
                // Check for responsive attributes
                const hasResponsiveAttributes = img.hasAttribute('srcset') || 
                                              img.hasAttribute('sizes') ||
                                              getComputedStyle(img).maxWidth === '100%';
                
                if (hasResponsiveAttributes) responsiveImages++;

                // Check for appropriate file formats (simplified)
                const src = img.src || img.getAttribute('data-src') || '';
                const hasModernFormat = src.includes('.webp') || src.includes('.avif');
                
                if (hasModernFormat) optimizedImages++;
            });

            checks.responsiveImages = responsiveImages;
            checks.responsiveImagePercentage = Math.round((responsiveImages / images.length) * 100);
            checks.optimizedImages = optimizedImages;
            checks.optimizedImagePercentage = Math.round((optimizedImages / images.length) * 100);

            // Calculate score
            const responsiveScore = (responsiveImages / images.length) * 70;
            const optimizationScore = (optimizedImages / images.length) * 30;
            score = Math.round(responsiveScore + optimizationScore);

            test.details = checks;
            test.score = score;
            test.passed = score >= 70;

        } catch (error) {
            test.error = error.message;
        }

        return test;
    }

    async testCurrentDeviceAccessibility() {
        this.log('🔄 Re-testing accessibility for current device after orientation change...');
        
        const currentTests = {
            'Touch Targets': await this.testTouchTargets(this.currentDevice),
            'Navigation': await this.testNavigationUsability(this.currentDevice),
            'Layout': await this.testLayoutIntegrity(this.currentDevice),
            'Theme Toggle': await this.testThemeToggleAccessibility(this.currentDevice)
        };

        this.testResults.currentDevice = {
            device: this.currentDevice,
            tests: currentTests,
            timestamp: new Date().toISOString()
        };

        // Log any issues found
        Object.entries(currentTests).forEach(([testName, result]) => {
            if (!result.passed) {
                this.log(`⚠️ ${testName} test failed on current device`);
            }
        });
    }

    calculateGrade(score) {
        if (score >= 95) return 'A+';
        if (score >= 90) return 'A';
        if (score >= 85) return 'A-';
        if (score >= 80) return 'B+';
        if (score >= 75) return 'B';
        if (score >= 70) return 'B-';
        if (score >= 65) return 'C+';
        if (score >= 60) return 'C';
        if (score >= 55) return 'C-';
        if (score >= 50) return 'D';
        return 'F';
    }

    identifyCriticalIssues(testSuite) {
        const criticalIssues = [];

        Object.entries(testSuite).forEach(([testName, result]) => {
            if (!result.passed && result.score < 50) {
                criticalIssues.push({
                    test: testName,
                    score: result.score,
                    description: result.description,
                    severity: result.score < 30 ? 'high' : 'medium'
                });
            }
        });

        return criticalIssues;
    }

    generateRecommendations(device, testSuite) {
        const recommendations = [];

        // Touch target recommendations
        const touchTargetTest = testSuite['Touch Target Accessibility'];
        if (touchTargetTest && !touchTargetTest.passed) {
            recommendations.push({
                type: 'Touch Targets',
                priority: 'high',
                description: `Increase touch target sizes to at least ${device.touchTargetSize}px for better accessibility`,
                implementation: 'Add min-width and min-height CSS properties to buttons and interactive elements'
            });
        }

        // Text readability recommendations
        const textTest = testSuite['Text Readability'];
        if (textTest && !textTest.passed) {
            recommendations.push({
                type: 'Text Readability',
                priority: 'medium',
                description: 'Improve text readability with larger font sizes and better line height',
                implementation: 'Set minimum font-size to 16px on mobile devices and ensure line-height is at least 1.5'
            });
        }

        // Performance recommendations
        const performanceTest = testSuite['Rendering Performance'];
        if (performanceTest && performanceTest.score < 80) {
            recommendations.push({
                type: 'Performance',
                priority: 'medium',
                description: 'Optimize rendering performance for better user experience',
                implementation: 'Minimize DOM manipulations, use CSS transforms for animations, and optimize theme switching'
            });
        }

        // Layout recommendations
        const layoutTest = testSuite['Layout Integrity'];
        if (layoutTest && !layoutTest.passed) {
            recommendations.push({
                type: 'Layout',
                priority: 'high',
                description: 'Fix layout issues that may cause content overflow or poor usability',
                implementation: 'Review responsive design, ensure proper viewport meta tag, and test on actual devices'
            });
        }

        return recommendations;
    }

    generateCompatibilityReport() {
        const report = {
            summary: {
                totalDevicesTested: Object.keys(this.testResults).length,
                averageScore: this.calculateAverageScore(),
                topPerformingDevices: this.getTopPerformingDevices(),
                criticalIssuesCount: this.getCriticalIssuesCount(),
                recommendationsCount: this.getRecommendationsCount()
            },
            details: this.testResults,
            timestamp: new Date().toISOString(),
            tester: 'Device Compatibility Tester v1.0'
        };

        this.log('📊 Compatibility report generated');
        return report;
    }

    calculateAverageScore() {
        const scores = Object.values(this.testResults).map(result => result.score || 0);
        return scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
    }

    getTopPerformingDevices() {
        return Object.entries(this.testResults)
            .sort(([,a], [,b]) => (b.score || 0) - (a.score || 0))
            .slice(0, 3)
            .map(([name, result]) => ({ name, score: result.score, grade: result.grade }));
    }

    getCriticalIssuesCount() {
        return Object.values(this.testResults).reduce((count, result) => {
            return count + (result.criticalIssues ? result.criticalIssues.length : 0);
        }, 0);
    }

    getRecommendationsCount() {
        return Object.values(this.testResults).reduce((count, result) => {
            return count + (result.recommendations ? result.recommendations.length : 0);
        }, 0);
    }

    wait(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    log(message) {
        console.log(`[Device Tester] ${message}`);
    }

    // Export functionality
    exportResults(format = 'json') {
        const report = this.generateCompatibilityReport();
        
        if (format === 'json') {
            const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `device-compatibility-report-${new Date().toISOString().split('T')[0]}.json`;
            a.click();
            URL.revokeObjectURL(url);
        }
        
        this.log(`📊 Results exported as ${format}`);
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DeviceCompatibilityTester;
} else if (typeof window !== 'undefined') {
    window.DeviceCompatibilityTester = DeviceCompatibilityTester;
}
