/**
 * App Global Configuration & Utilities
 * Centralizes logic for the entire portfolio site.
 */

const App = {
    // Check if device is mobile
    isMobile: () => window.innerWidth <= 768,

    // PocketBase Configuration
    pocketbase: {
        getBaseUrl: () => {
            const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
            const localDefault = 'http://127.0.0.1:8090';
            const prodDefault = 'https://carlosperales.dev';
            return window.PB_BASE_URL || (isLocal ? localDefault : prodDefault);
        },
        collections: {
            messages: 'messages'
        }
    },

    automail: {
        getBaseUrl: () => {
            const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
            const localDefault = 'http://127.0.0.1:8092';
            const prodDefault = 'https://carlosperales.dev/automail-api';
            return window.AUTOMAIL_BASE_URL || (isLocal ? localDefault : prodDefault);
        }
    },

    // Initialization logic
    init: () => {
        console.log('🚀 Carlos Perales Portfolio - App Initialized');
        // Expose global helpers if needed
    }
};

function openPocketBaseAdmin() {
    const baseUrl = App.pocketbase.getBaseUrl();
    const adminUrl = `${baseUrl}/_/`;
    window.open(adminUrl, '_blank', 'noopener');
}

// Initialize on load
document.addEventListener('DOMContentLoaded', App.init);

// Expose to window for other scripts
window.App = App;
