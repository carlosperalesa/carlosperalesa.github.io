/**
 * Debug utilities para diagnosticar problemas de API
 */

const DEBUG = {
    isLocal: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1',
    API_URL: null,
    ASSETS_BASE: null,

    init() {
        this.API_URL = this.isLocal ? 'http://localhost:3000/api' : '/other/BT/api';
        this.ASSETS_BASE = this.isLocal ? 'http://localhost:3000' : '/other/BT';
        console.log('🔧 DEBUG INITIALIZED', {
            isLocal: this.isLocal,
            API_URL: this.API_URL,
            ASSETS_BASE: this.ASSETS_BASE,
            hostname: window.location.hostname,
            protocol: window.location.protocol,
            port: window.location.port
        });
    },

    async checkHealth() {
        console.log('\n📊 CHECKING HEALTH...\n');
        try {
            const res = await fetch(`${this.API_URL}/health`);
            const data = await res.json();
            console.log('✅ HEALTH CHECK:', data);
            return data;
        } catch (err) {
            console.error('❌ HEALTH CHECK FAILED:', err);
            return null;
        }
    },

    async checkAuth() {
        console.log('\n🔐 CHECKING AUTH...\n');
        const token = localStorage.getItem('token');
        const expiresAt = localStorage.getItem('token_expires_at');
        const user = localStorage.getItem('user');

        console.log('📋 LOCAL STORAGE:', {
            token: token ? token.substring(0, 20) + '...' : 'NULL',
            user,
            expiresAt,
            expiresIn: expiresAt ? Math.round((expiresAt - Date.now() / 1000) / 3600) + ' horas' : 'N/A'
        });

        if (!token) {
            console.warn('⚠️ NO TOKEN FOUND');
            return false;
        }

        // Test auth with a simple endpoint
        try {
            const res = await fetch(`${this.API_URL}/images`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            console.log('✅ AUTH VALID (status: ' + res.status + ')');
            return res.ok;
        } catch (err) {
            console.error('❌ AUTH CHECK FAILED:', err);
            return false;
        }
    },

    async checkUploads() {
        console.log('\n📁 CHECKING UPLOADS...\n');
        const token = localStorage.getItem('token');

        if (!token) {
            console.warn('⚠️ NO TOKEN - CANNOT CHECK UPLOADS');
            return;
        }

        try {
            const res = await fetch(`${this.API_URL}/images`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const images = await res.json();
            console.log('✅ UPLOADS:', {
                count: images.length,
                images: images.slice(0, 5)
            });
        } catch (err) {
            console.error('❌ UPLOADS CHECK FAILED:', err);
        }
    },

    async testUpload(file) {
        console.log('\n📤 TESTING UPLOAD...\n');
        const token = localStorage.getItem('token');

        if (!token) {
            console.error('❌ NO TOKEN');
            return;
        }

        if (!file) {
            console.warn('⚠️ NO FILE PROVIDED');
            return;
        }

        const formData = new FormData();
        formData.append('image', file);

        try {
            console.log('📤 Uploading:', {
                filename: file.name,
                size: file.size,
                type: file.type,
                endpoint: `${this.API_URL}/upload`
            });

            const res = await fetch(`${this.API_URL}/upload`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData
            });

            console.log('📥 Response:', {
                status: res.status,
                statusText: res.statusText,
                ok: res.ok
            });

            if (!res.ok) {
                const errorData = await res.json();
                console.error('❌ UPLOAD FAILED:', errorData);
                return null;
            }

            const data = await res.json();
            console.log('✅ UPLOAD SUCCESS:', data);
            return data;
        } catch (err) {
            console.error('❌ UPLOAD EXCEPTION:', err);
            return null;
        }
    },

    async runFullDiagnostics() {
        console.clear();
        console.log('%c🔧 STARTING FULL DIAGNOSTICS', 'font-size: 16px; color: blue; font-weight: bold;');
        console.log('%c='.repeat(50), 'font-size: 12px;');

        this.init();
        await this.checkHealth();
        await this.checkAuth();
        await this.checkUploads();

        console.log('\n' + '%c='.repeat(50), 'font-size: 12px;');
        console.log('%c✅ DIAGNOSTICS COMPLETE', 'font-size: 14px; color: green; font-weight: bold;');
        console.log('\n💡 TIP: Use DEBUG.testUpload(file) to test upload with a file from your system');
    }
};

// Auto-initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    DEBUG.init();
    console.log('✅ DEBUG module loaded. Use DEBUG.runFullDiagnostics() to check system');
});
