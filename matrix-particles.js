/**
 * Cyber Theme Particle System for CAnalyzerAI
 * Using advanced cyber particle configuration
 */

// Cyber theme configuration based on provided JSON
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
                width: 0,
                color: "#000000"
            }
        },
        opacity: {
            value: 0.5,
            random: true,
            anim: {
                enable: true,
                speed: 1,
                opacity_min: 0.1,
                sync: false
            }
        },
        size: {
            value: 3,
            random: true,
            anim: {
                enable: true,
                speed: 2,
                size_min: 0.5,
                sync: false
            }
        },
        line_linked: {
            enable: true,
            distance: 150,
            color: "#00f5d4",
            opacity: 0.3,
            width: 1
        },
        move: {
            enable: true,
            speed: 2,
            direction: "none",
            random: true,
            straight: false,
            out_mode: "bounce",
            bounce: false,
            attract: {
                enable: true,
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
                mode: "attract"
            },
            onclick: {
                enable: true,
                mode: "repulse"
            },
            ontouchmove: {
                enable: true,
                mode: "attract"
            },
            resize: true
        },
        modes: {
            attract: {
                distance: 200,
                duration: 0.4,
                factor: 5
            },
            repulse: {
                distance: 100,
                duration: 0.4
            }
        }
    },
    retina_detect: true
};

// Theme-specific variations
const darkCyberConfig = {
    ...cyberConfig,
    particles: {
        ...cyberConfig.particles,
        opacity: {
            ...cyberConfig.particles.opacity,
            value: 0.6
        },
        line_linked: {
            ...cyberConfig.particles.line_linked,
            opacity: 0.4
        }
    }
};

const lightCyberConfig = {
    ...cyberConfig,
    particles: {
        ...cyberConfig.particles,
        color: {
            value: ["#00b3a6", "#5a54d9", "#cc0055"]
        },
        opacity: {
            ...cyberConfig.particles.opacity,
            value: 0.3
        },
        line_linked: {
            ...cyberConfig.particles.line_linked,
            color: "#00b3a6",
            opacity: 0.2
        }
    }
};

// Initialize particles
function initCyberParticles() {
    console.log('🚀 Initializing Cyber Theme particles...');
    
    if (typeof particlesJS === 'undefined') {
        console.error('❌ particles.js library not found!');
        return false;
    }
    
    // Check for container
    const container = document.getElementById('particles-js');
    if (!container) {
        console.error('❌ particles-js container not found!');
        return false;
    }
    
    console.log('✅ Container found, detecting theme...');
    
    // Detect theme
    const isDark = document.body.classList.contains('dark-theme') || 
                   (!document.body.classList.contains('light-theme') && 
                    window.matchMedia('(prefers-color-scheme: dark)').matches);
    
    const config = isDark ? darkCyberConfig : lightCyberConfig;
    console.log('🎨 Using theme:', isDark ? 'dark cyber' : 'light cyber');
    console.log('🔧 Particle count:', config.particles.number.value);
    console.log('🎯 Colors:', config.particles.color.value);
    
    try {
        particlesJS('particles-js', config);
        console.log('✨ Cyber particles initialized successfully!');
        console.log('🔗 Features: Multi-color, attraction effects, touch interaction');
        
        // Verify canvas creation with enhanced info
        setTimeout(() => {
            const canvas = document.querySelector('#particles-js canvas');
            if (canvas) {
                console.log('🎯 Canvas created:', canvas.width + 'x' + canvas.height);
                console.log('💫 Interaction modes: hover=attract, click=repulse, touch=attract');
                
                // Add temporary cyan border for cyber theme
                canvas.style.border = '2px solid #00f5d4';
                canvas.style.boxShadow = '0 0 20px rgba(0, 245, 212, 0.5)';
                setTimeout(() => {
                    canvas.style.border = 'none';
                    canvas.style.boxShadow = 'none';
                }, 3000);
            } else {
                console.error('❌ Canvas not found after initialization');
            }
        }, 500);
        
        return true;
    } catch (error) {
        console.error('❌ Error initializing cyber particles:', error);
        return false;
    }
}

// Theme change handler
function updateCyberTheme() {
    console.log('🎨 Theme changed, updating cyber particles...');
    
    // Destroy existing particles
    if (window.pJSDom && window.pJSDom.length > 0) {
        try {
            window.pJSDom[0].pJS.fn.vendors.destroypJS();
            window.pJSDom = [];
            console.log('🗑️ Previous particles destroyed');
        } catch (e) {
            console.warn('⚠️ Error destroying particles:', e);
        }
    }
    
    // Reinitialize with new theme
    setTimeout(() => {
        initCyberParticles();
    }, 100);
}

// Auto-initialize when ready
document.addEventListener('DOMContentLoaded', () => {
    console.log('🌟 DOM loaded, checking for particles.js...');
    
    const checkAndInit = () => {
        if (typeof particlesJS !== 'undefined') {
            setTimeout(initCyberParticles, 100);
        } else {
            console.log('⏳ particles.js not ready, retrying...');
            setTimeout(checkAndInit, 100);
        }
    };
    
    checkAndInit();
    
    // Listen for theme changes
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                updateCyberTheme();
            }
        });
    });
    
    observer.observe(document.body, {
        attributes: true,
        attributeFilter: ['class']
    });
});

// Global functions for external control
window.cyberParticles = {
    init: initCyberParticles,
    updateTheme: updateCyberTheme,
    destroy: () => {
        if (window.pJSDom && window.pJSDom.length > 0) {
            window.pJSDom[0].pJS.fn.vendors.destroypJS();
            window.pJSDom = [];
            console.log('💥 Cyber particles destroyed');
        }
    },
    // Advanced controls based on JSON settings
    adjustDensity: (density) => {
        if (window.pJSDom && window.pJSDom.length > 0) {
            const newCount = Math.floor((density / 100) * 200); // Scale 0-100 to 0-200 particles
            console.log('🔧 Adjusting particle density to:', newCount);
            // Note: Would need particles.js API extension for real-time updates
        }
    },
    toggleAttraction: () => {
        console.log('🧲 Toggle attraction mode (implementation needed)');
    },
    setColors: (colorArray) => {
        console.log('🎨 Setting custom colors:', colorArray);
        // Implementation would require reinitialization with new config
    }
};

// Export for external use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MatrixParticleSystem;
}
