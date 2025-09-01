/**
 * WCAG Contrast Ratio Calculator and Validator
 * Validates the enhanced light theme color combinations
 */

class WCAGValidator {
    constructor() {
        this.lightThemeColors = {
            // Text colors
            textPrimary: '#0c1419',
            textSecondary: '#1e2e38', 
            textMuted: '#3c4a54',
            textLink: '#1565c0',
            textLinkHover: '#0d47a1',
            
            // Background colors
            bgPrimary: '#fefefe',
            bgSecondary: '#f7f9fc',
            bgTertiary: '#f1f5f9',
            
            // Accent colors
            accentPrimary: '#2563eb',
            accentSecondary: '#0067c5',
            accentTertiary: '#7c3aed',
            
            // Status colors
            statusSuccess: '#0f7a22',
            statusWarning: '#a55a00',
            statusError: '#dc2626',
            statusInfo: '#2563eb'
        };
        
        this.wcagCriteria = {
            AA: {
                normal: 4.5,
                large: 3.0
            },
            AAA: {
                normal: 7.0,
                large: 4.5
            }
        };
    }

    /**
     * Convert hex color to RGB
     */
    hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : null;
    }

    /**
     * Calculate relative luminance
     */
    getRelativeLuminance(rgb) {
        const rsRGB = rgb.r / 255;
        const gsRGB = rgb.g / 255;
        const bsRGB = rgb.b / 255;

        const r = rsRGB <= 0.03928 ? rsRGB / 12.92 : Math.pow((rsRGB + 0.055) / 1.055, 2.4);
        const g = gsRGB <= 0.03928 ? gsRGB / 12.92 : Math.pow((gsRGB + 0.055) / 1.055, 2.4);
        const b = bsRGB <= 0.03928 ? bsRGB / 12.92 : Math.pow((bsRGB + 0.055) / 1.055, 2.4);

        return 0.2126 * r + 0.7152 * g + 0.0722 * b;
    }

    /**
     * Calculate contrast ratio between two colors
     */
    calculateContrastRatio(color1, color2) {
        const rgb1 = this.hexToRgb(color1);
        const rgb2 = this.hexToRgb(color2);
        
        if (!rgb1 || !rgb2) return 0;
        
        const lum1 = this.getRelativeLuminance(rgb1);
        const lum2 = this.getRelativeLuminance(rgb2);
        
        const lighter = Math.max(lum1, lum2);
        const darker = Math.min(lum1, lum2);
        
        return (lighter + 0.05) / (darker + 0.05);
    }

    /**
     * Get WCAG compliance level
     */
    getComplianceLevel(ratio, isLarge = false) {
        const criteria = isLarge ? 
            { AA: this.wcagCriteria.AA.large, AAA: this.wcagCriteria.AAA.large } :
            { AA: this.wcagCriteria.AA.normal, AAA: this.wcagCriteria.AAA.normal };
            
        if (ratio >= criteria.AAA) return 'AAA';
        if (ratio >= criteria.AA) return 'AA';
        return 'Fail';
    }

    /**
     * Validate all color combinations
     */
    validateLightTheme() {
        const results = [];
        const colors = this.lightThemeColors;
        
        // Critical text combinations
        const textCombinations = [
            { fg: colors.textPrimary, bg: colors.bgPrimary, name: 'Primary Text on Primary Background', critical: true },
            { fg: colors.textSecondary, bg: colors.bgPrimary, name: 'Secondary Text on Primary Background', critical: true },
            { fg: colors.textMuted, bg: colors.bgPrimary, name: 'Muted Text on Primary Background', critical: true },
            { fg: colors.textLink, bg: colors.bgPrimary, name: 'Link Text on Primary Background', critical: true },
            { fg: colors.textPrimary, bg: colors.bgSecondary, name: 'Primary Text on Secondary Background', critical: true },
            { fg: colors.textSecondary, bg: colors.bgTertiary, name: 'Secondary Text on Tertiary Background', critical: true }
        ];
        
        // Button/accent combinations
        const accentCombinations = [
            { fg: '#ffffff', bg: colors.accentPrimary, name: 'White on Primary Accent', critical: true },
            { fg: '#ffffff', bg: colors.accentSecondary, name: 'White on Secondary Accent', critical: true },
            { fg: '#ffffff', bg: colors.accentTertiary, name: 'White on Tertiary Accent', critical: true },
            { fg: colors.accentPrimary, bg: colors.bgPrimary, name: 'Primary Accent on Background', critical: true },
            { fg: colors.accentSecondary, bg: colors.bgPrimary, name: 'Secondary Accent on Background', critical: true }
        ];
        
        // Status combinations
        const statusCombinations = [
            { fg: '#ffffff', bg: colors.statusSuccess, name: 'White on Success Status', critical: true },
            { fg: '#ffffff', bg: colors.statusWarning, name: 'White on Warning Status', critical: true },
            { fg: '#ffffff', bg: colors.statusError, name: 'White on Error Status', critical: true },
            { fg: '#ffffff', bg: colors.statusInfo, name: 'White on Info Status', critical: true },
            { fg: colors.statusSuccess, bg: colors.bgPrimary, name: 'Success Status on Background', critical: false },
            { fg: colors.statusError, bg: colors.bgPrimary, name: 'Error Status on Background', critical: false }
        ];
        
        const allCombinations = [...textCombinations, ...accentCombinations, ...statusCombinations];
        
        allCombinations.forEach(combo => {
            const ratio = this.calculateContrastRatio(combo.fg, combo.bg);
            const compliance = this.getComplianceLevel(ratio);
            const passed = ratio >= this.wcagCriteria.AA.normal;
            
            results.push({
                name: combo.name,
                foreground: combo.fg,
                background: combo.bg,
                ratio: Math.round(ratio * 100) / 100,
                compliance: compliance,
                passed: passed,
                critical: combo.critical
            });
        });
        
        return results;
    }

    /**
     * Generate validation report
     */
    generateReport() {
        const results = this.validateLightTheme();
        const passed = results.filter(r => r.passed).length;
        const total = results.length;
        const critical = results.filter(r => r.critical);
        const criticalPassed = critical.filter(r => r.passed).length;
        
        console.log('🎨 Enhanced Light Theme - WCAG Validation Report');
        console.log('='.repeat(50));
        console.log(`📊 Overall Score: ${passed}/${total} (${Math.round(passed/total*100)}%)`);
        console.log(`🔥 Critical Elements: ${criticalPassed}/${critical.length} (${Math.round(criticalPassed/critical.length*100)}%)`);
        console.log('');
        
        // Group by compliance level
        const byCompliance = results.reduce((acc, result) => {
            acc[result.compliance] = acc[result.compliance] || [];
            acc[result.compliance].push(result);
            return acc;
        }, {});
        
        ['AAA', 'AA', 'Fail'].forEach(level => {
            if (byCompliance[level]) {
                console.log(`${level === 'AAA' ? '🏆' : level === 'AA' ? '✅' : '❌'} ${level} Compliance (${byCompliance[level].length} items):`);
                byCompliance[level].forEach(result => {
                    const icon = result.critical ? '🔥' : '📋';
                    console.log(`  ${icon} ${result.name}: ${result.ratio}:1 (${result.foreground} on ${result.background})`);
                });
                console.log('');
            }
        });
        
        // Summary
        const aaaCount = (byCompliance.AAA || []).length;
        const aaCount = (byCompliance.AA || []).length;
        const failCount = (byCompliance.Fail || []).length;
        
        console.log('📈 Summary:');
        console.log(`  🏆 AAA Level: ${aaaCount} combinations`);
        console.log(`  ✅ AA Level: ${aaCount} combinations`);
        console.log(`  ❌ Failed: ${failCount} combinations`);
        console.log('');
        
        if (failCount === 0) {
            console.log('🎉 Congratulations! All color combinations meet WCAG AA standards.');
        } else {
            console.log('⚠️  Some combinations need improvement for full compliance.');
        }
        
        return results;
    }
}

// Export for use in browser or Node.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = WCAGValidator;
} else if (typeof window !== 'undefined') {
    window.WCAGValidator = WCAGValidator;
}

// Auto-run validation if in browser
if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
        const validator = new WCAGValidator();
        const results = validator.generateReport();
        
        // Create visual report in page if there's a container
        const container = document.getElementById('wcag-report');
        if (container) {
            container.innerHTML = generateHTMLReport(results);
        }
    });
}

/**
 * Generate HTML report for browser display
 */
function generateHTMLReport(results) {
    const passed = results.filter(r => r.passed).length;
    const total = results.length;
    const percentage = Math.round(passed/total*100);
    
    const html = `
        <div class="wcag-report">
            <h2>🎨 WCAG Validation Report</h2>
            <div class="score-summary">
                <div class="score-badge ${percentage === 100 ? 'perfect' : percentage >= 95 ? 'excellent' : percentage >= 85 ? 'good' : 'needs-work'}">
                    ${percentage}%
                </div>
                <div class="score-details">
                    <p><strong>${passed}/${total}</strong> combinations passed</p>
                    <p>WCAG 2.1 AA compliance</p>
                </div>
            </div>
            <div class="results-list">
                ${results.map(result => `
                    <div class="result-item ${result.passed ? 'passed' : 'failed'} ${result.critical ? 'critical' : ''}">
                        <div class="result-header">
                            <span class="result-icon">${result.compliance === 'AAA' ? '🏆' : result.compliance === 'AA' ? '✅' : '❌'}</span>
                            <span class="result-name">${result.name}</span>
                            <span class="result-ratio">${result.ratio}:1</span>
                        </div>
                        <div class="result-colors">
                            <span class="color-sample" style="background: ${result.foreground}; color: ${result.background};">Aa</span>
                            <span class="color-info">${result.foreground} on ${result.background}</span>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
    
    return html;
}
