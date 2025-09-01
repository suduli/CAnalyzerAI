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
                opacity_min: 0.1,
                sync: false
            }
        },
        size: {
            value: 4,
            random: true,
            anim: {
                enable: true,
                speed: 2,
                size_min: 0.1,
                sync: false
            }
        },
        line_linked: {
            enable: true,
            distance: 150,
            color: "#00f5d4",
            opacity: 0.4,
            width: 1
        },
        move: {
            enable: true,
            speed: 2,
            direction: "none",
            random: false,
            straight: false,
            out_mode: "out",
            bounce: false,
            attract: {
                enable: true,
                rotateX: 600,
                rotateY: 1200
            }
        }
    },
    interactivity: {
        detect_on: "window",
        events: {
            onhover: {
                enable: true,
                mode: "attract"
            },
            onclick: {
                enable: true,
                mode: "repulse"
            },
            resize: true
        },
        modes: {
            attract: {
                distance: 200,
                duration: 0.4
            },
            repulse: {
                distance: 100,
                duration: 0.4
            }
        }
    },
    retina_detect: true
};

// Advanced initialization for cyber theme
function initCyberParticles() {
    console.log('🚀 Initializing Cyber Theme particles...');
    
    if (typeof particlesJS === 'undefined') {
        console.warn('⚠️ particles.js library not available yet');
        return;
    }

    // Clean any existing cyber particles first
    destroyCyberParticles();

    try {
        const container = document.getElementById('particles-js');
        
        if (!container) {
            console.warn('⚠️ Particles container not found');
            return;
        }

        console.log('✅ Container found, using dark cyber theme');
        
        // Use cyber theme by default (dark theme)
        console.log('🎨 Using dark cyber theme');
        console.log('🔧 Particle count:', cyberConfig.particles.number.value);
        console.log('🎯 Colors:', cyberConfig.particles.color.value);
        
        // Initialize with cyber config
        particlesJS('particles-js', cyberConfig);
        
        console.log('✨ Cyber particles initialized successfully!');
        console.log('🔗 Features: Multi-color, attraction effects, touch interaction');
        
        // Add some debug info about the canvas
        setTimeout(() => {
            const canvas = container.querySelector('canvas');
            if (canvas) {
                console.log('🎯 Canvas created:', canvas.width + 'x' + canvas.height);
                console.log('💫 Interaction modes: hover=attract, click=repulse, touch=attract');
            }
        }, 500);
        
    } catch (error) {
        console.error('❌ Error initializing cyber particles:', error);
    }
}

// Safe destruction function
function destroyCyberParticles() {
    if (window.pJSDom && window.pJSDom.length > 0) {
        try {
            // Try safe destruction first
            if (window.pJSDom[0] && window.pJSDom[0].pJS && window.pJSDom[0].pJS.fn) {
                window.pJSDom[0].pJS.fn.vendors.destroypJS();
                window.pJSDom = [];
                console.log('🗑️ Previous particles destroyed');
            } else {
                // Fallback: force clear the array
                window.pJSDom = [];
                console.log('🗑️ Particles array cleared (fallback)');
            }
        } catch (e) {
            console.warn('⚠️ Error destroying particles:', e);
            // Force clear the array on error
            window.pJSDom = [];
        }
    }
}

// Theme change handler
function updateCyberTheme() {
    console.log('🎨 Cyber particles: Theme changed, checking current theme...');
    
    // Get effective theme
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
    console.log('🎯 Current theme detected:', currentTheme);
    
    if (currentTheme === 'dark') {
        console.log('🌙 Dark theme active - initializing cyber particles');
        // Reinitialize particles after a brief delay to ensure cleanup
        setTimeout(() => {
            initCyberParticles();
        }, 100);
    } else {
        console.log('☀️ Light theme active - hiding cyber particles');
        destroyCyberParticles();
        
        // Also clear any leftover canvas content
        const container = document.getElementById('particles-js');
        if (container) {
            container.innerHTML = '';
        }
    }
}

// Auto-initialize when ready
document.addEventListener('DOMContentLoaded', () => {
    console.log('🌟 Cyber particles: DOM loaded, checking for particles.js...');
    
    const checkAndInit = () => {
        if (typeof particlesJS !== 'undefined') {
            setTimeout(initCyberParticles, 100);
        } else {
            console.log('⏳ particles.js not ready, retrying...');
            setTimeout(checkAndInit, 100);
        }
    };
    
    checkAndInit();
    
    // Listen for theme changes via data-theme attribute
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.type === 'attributes' && mutation.attributeName === 'data-theme') {
                console.log('🎨 Cyber particles: data-theme attribute changed');
                updateCyberTheme();
            }
        });
    });

    observer.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ['data-theme']
    });
});

// Global functions for external control
window.cyberParticles = {
    init: initCyberParticles,
    updateTheme: updateCyberTheme,
    destroy: destroyCyberParticles,
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
