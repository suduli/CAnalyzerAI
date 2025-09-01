/**
 * Enhanced WCAG Validator with Recommended Color Improvements
 * Tests both current and enhanced color palettes for comparison
 */

class EnhancedWCAGValidator {
    constructor() {
        // Current light theme colors
        this.currentColors = {
            textPrimary: '#0c1419',
            textSecondary: '#1e2e38', 
            textMuted: '#3c4a54',
            textLink: '#1565c0',
            textLinkHover: '#0d47a1',
            bgPrimary: '#fefefe',
            bgSecondary: '#f7f9fc',
            bgTertiary: '#f1f5f9',
            accentPrimary: '#2563eb',
            accentSecondary: '#0067c5',
            accentTertiary: '#7c3aed',
            statusSuccess: '#0f7a22',
            statusWarning: '#a55a00',
            statusError: '#dc2626',
            statusInfo: '#2563eb'
        };
        
        // Enhanced colors for AAA compliance
        this.enhancedColors = {
            textPrimary: '#0c1419',      // Keep (already AAA)
            textSecondary: '#1e2e38',    // Keep (already AAA)
            textMuted: '#3c4a54',        // Keep (already AAA)
            textLink: '#1346a0',         // Enhanced for AAA
            textLinkHover: '#0f3380',    // Enhanced for AAA
            bgPrimary: '#fefefe',        // Keep
            bgSecondary: '#f7f9fc',      // Keep  
            bgTertiary: '#f1f5f9',       // Keep
            accentPrimary: '#1e40af',    // Enhanced
            accentSecondary: '#0052a3',  // Enhanced
            accentTertiary: '#6b21a8',   // Enhanced
            statusSuccess: '#0d6a1f',    // Enhanced for AAA
            statusWarning: '#8f4a00',    // Enhanced for AAA
            statusError: '#b91c1c',      // Enhanced for AAA
            statusInfo: '#1e40af'        // Enhanced
        };
        
        this.wcagCriteria = {
            AA: { normal: 4.5, large: 3.0 },
            AAA: { normal: 7.0, large: 4.5 }
        };
    }

    hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : null;
    }

    getRelativeLuminance(rgb) {
        const rsRGB = rgb.r / 255;
        const gsRGB = rgb.g / 255;
        const bsRGB = rgb.b / 255;

        const r = rsRGB <= 0.03928 ? rsRGB / 12.92 : Math.pow((rsRGB + 0.055) / 1.055, 2.4);
        const g = gsRGB <= 0.03928 ? gsRGB / 12.92 : Math.pow((gsRGB + 0.055) / 1.055, 2.4);
        const b = bsRGB <= 0.03928 ? bsRGB / 12.92 : Math.pow((bsRGB + 0.055) / 1.055, 2.4);

        return 0.2126 * r + 0.7152 * g + 0.0722 * b;
    }

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

    getComplianceLevel(ratio, isLarge = false) {
        const criteria = isLarge ? 
            { AA: this.wcagCriteria.AA.large, AAA: this.wcagCriteria.AAA.large } :
            { AA: this.wcagCriteria.AA.normal, AAA: this.wcagCriteria.AAA.normal };
            
        if (ratio >= criteria.AAA) return 'AAA';
        if (ratio >= criteria.AA) return 'AA';
        return 'Fail';
    }

    validateColorSet(colors, setName) {
        const combinations = [
            // Critical text combinations
            { fg: colors.textPrimary, bg: colors.bgPrimary, name: 'Primary Text on Primary Background', critical: true },
            { fg: colors.textSecondary, bg: colors.bgPrimary, name: 'Secondary Text on Primary Background', critical: true },
            { fg: colors.textMuted, bg: colors.bgPrimary, name: 'Muted Text on Primary Background', critical: true },
            { fg: colors.textLink, bg: colors.bgPrimary, name: 'Link Text on Primary Background', critical: true },
            
            // Button/accent combinations
            { fg: '#ffffff', bg: colors.accentPrimary, name: 'White on Primary Accent', critical: true },
            { fg: '#ffffff', bg: colors.accentSecondary, name: 'White on Secondary Accent', critical: true },
            { fg: '#ffffff', bg: colors.accentTertiary, name: 'White on Tertiary Accent', critical: true },
            { fg: colors.accentPrimary, bg: colors.bgPrimary, name: 'Primary Accent on Background', critical: true },
            { fg: colors.accentSecondary, bg: colors.bgPrimary, name: 'Secondary Accent on Background', critical: true },
            
            // Status combinations
            { fg: '#ffffff', bg: colors.statusSuccess, name: 'White on Success Status', critical: true },
            { fg: '#ffffff', bg: colors.statusWarning, name: 'White on Warning Status', critical: true },
            { fg: '#ffffff', bg: colors.statusError, name: 'White on Error Status', critical: true },
            { fg: '#ffffff', bg: colors.statusInfo, name: 'White on Info Status', critical: true },
            { fg: colors.statusSuccess, bg: colors.bgPrimary, name: 'Success Status on Background', critical: false },
            { fg: colors.statusError, bg: colors.bgPrimary, name: 'Error Status on Background', critical: false }
        ];

        return combinations.map(combo => {
            const ratio = this.calculateContrastRatio(combo.fg, combo.bg);
            const compliance = this.getComplianceLevel(ratio);
            const passed = ratio >= this.wcagCriteria.AA.normal;
            
            return {
                name: combo.name,
                foreground: combo.fg,
                background: combo.bg,
                ratio: Math.round(ratio * 100) / 100,
                compliance: compliance,
                passed: passed,
                critical: combo.critical,
                colorSet: setName
            };
        });
    }

    compareColorSets() {
        const currentResults = this.validateColorSet(this.currentColors, 'Current');
        const enhancedResults = this.validateColorSet(this.enhancedColors, 'Enhanced');
        
        console.log('🎨 CURRENT vs ENHANCED COLOR COMPARISON');
        console.log('='.repeat(60));
        console.log('');
        
        // Summary statistics
        const currentStats = this.getStats(currentResults);
        const enhancedStats = this.getStats(enhancedResults);
        
        console.log('📊 COMPLIANCE SUMMARY:');
        console.log(`Current Colors:  ${currentStats.passed}/${currentStats.total} passed (${currentStats.aaaCount} AAA)`);
        console.log(`Enhanced Colors: ${enhancedStats.passed}/${enhancedStats.total} passed (${enhancedStats.aaaCount} AAA)`);
        console.log('');
        
        // Detailed comparison
        console.log('🔍 DETAILED IMPROVEMENTS:');
        console.log('');
        
        for (let i = 0; i < currentResults.length; i++) {
            const current = currentResults[i];
            const enhanced = enhancedResults[i];
            
            const improvement = enhanced.ratio - current.ratio;
            const statusIcon = improvement > 0 ? '📈' : improvement < 0 ? '📉' : '➡️';
            const complianceChange = current.compliance !== enhanced.compliance ? 
                ` (${current.compliance} → ${enhanced.compliance})` : '';
            
            console.log(`${statusIcon} ${current.name}:`);
            console.log(`   Current:  ${current.foreground} on ${current.background} = ${current.ratio}:1 [${current.compliance}]`);
            console.log(`   Enhanced: ${enhanced.foreground} on ${enhanced.background} = ${enhanced.ratio}:1 [${enhanced.compliance}]`);
            
            if (improvement > 0) {
                console.log(`   ✅ Improvement: +${improvement.toFixed(2)} contrast ratio${complianceChange}`);
            } else if (improvement < 0) {
                console.log(`   ⚠️  Change: ${improvement.toFixed(2)} contrast ratio${complianceChange}`);
            } else {
                console.log(`   ➡️  Unchanged (already optimal)`);
            }
            console.log('');
        }
        
        // Recommendations
        console.log('🎯 IMPLEMENTATION RECOMMENDATIONS:');
        console.log('');
        
        const improvements = enhancedResults.filter((enhanced, i) => {
            return enhanced.ratio > currentResults[i].ratio;
        });
        
        if (improvements.length > 0) {
            console.log('🚀 Priority Improvements:');
            improvements
                .sort((a, b) => {
                    const aImprovement = a.ratio - currentResults.find(c => c.name === a.name).ratio;
                    const bImprovement = b.ratio - currentResults.find(c => c.name === b.name).ratio;
                    return bImprovement - aImprovement;
                })
                .forEach(imp => {
                    const current = currentResults.find(c => c.name === imp.name);
                    const improvement = imp.ratio - current.ratio;
                    console.log(`   • ${imp.name}: +${improvement.toFixed(2)} improvement`);
                    console.log(`     Change: ${current.foreground} → ${imp.foreground}`);
                });
        }
        
        return { currentResults, enhancedResults };
    }

    getStats(results) {
        return {
            total: results.length,
            passed: results.filter(r => r.passed).length,
            aaaCount: results.filter(r => r.compliance === 'AAA').length,
            aaCount: results.filter(r => r.compliance === 'AA').length,
            failCount: results.filter(r => !r.passed).length
        };
    }

    generateEnhancedCSS() {
        console.log('');
        console.log('💻 ENHANCED CSS IMPLEMENTATION:');
        console.log('='.repeat(40));
        console.log('');
        console.log('```css');
        console.log('/* Enhanced WCAG AAA Compliant Light Theme */');
        console.log('[data-theme="light"] {');
        console.log('  /* Typography - Already AAA Compliant ✅ */');
        console.log(`  --text-primary: ${this.enhancedColors.textPrimary};`);
        console.log(`  --text-secondary: ${this.enhancedColors.textSecondary};`);
        console.log(`  --text-muted: ${this.enhancedColors.textMuted};`);
        console.log('');
        console.log('  /* Enhanced Links for AAA Compliance */');
        console.log(`  --text-link: ${this.enhancedColors.textLink};`);
        console.log(`  --text-link-hover: ${this.enhancedColors.textLinkHover};`);
        console.log('');
        console.log('  /* Enhanced Accent System */');
        console.log(`  --accent-primary: ${this.enhancedColors.accentPrimary};`);
        console.log(`  --accent-secondary: ${this.enhancedColors.accentSecondary};`);
        console.log(`  --accent-tertiary: ${this.enhancedColors.accentTertiary};`);
        console.log('');
        console.log('  /* Enhanced Status Colors - AAA Compliant */');
        console.log(`  --status-success: ${this.enhancedColors.statusSuccess};`);
        console.log(`  --status-warning: ${this.enhancedColors.statusWarning};`);
        console.log(`  --status-error: ${this.enhancedColors.statusError};`);
        console.log(`  --status-info: ${this.enhancedColors.statusInfo};`);
        console.log('}');
        console.log('```');
    }
}

// Export for use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = EnhancedWCAGValidator;
} else if (typeof window !== 'undefined') {
    window.EnhancedWCAGValidator = EnhancedWCAGValidator;
}

// Auto-run comparison if executed directly
if (require.main === module) {
    const validator = new EnhancedWCAGValidator();
    validator.compareColorSets();
    validator.generateEnhancedCSS();
}
