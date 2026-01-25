/**
 * App Global Configuration & Utilities
 * Centralizes logic for the entire portfolio site.
 */

const App = {
    // Check if device is mobile
    isMobile: () => window.innerWidth <= 768,

    // API Configuration
    api: {
        getBaseUrl: () => {
            const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
            // In local dev, we point to the Flask API port (5000)
            // In production, we use the same origin (Nginx proxy handles /api requests)
            return isLocal ? 'http://localhost:5000' : window.location.origin;
        },

        // Endpoints
        endpoints: {
            contact: '/api/contact', // POST
            contacts: '/api/contacts', // GET (Private)
            count: '/api/contacts/count', // GET (badge)
            login: '/api/login', // POST (Auth)
            verify: '/api/verify' // GET (Check Session)
        }
    },

    // Initialization logic
    init: () => {
        console.log('🚀 Carlos Perales Portfolio - App Initialized');
        // Expose global helpers if needed
    }
};

// Initialize on load
document.addEventListener('DOMContentLoaded', App.init);

// Expose to window for other scripts
window.App = App;
