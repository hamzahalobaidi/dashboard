/**
 * Sync Manager - يدير مزامنة البيانات مع Supabase
 * يحفظ واسترجع البيانات من قاعدة البيانات السحابية
 */

class SyncManager {
    constructor(apiUrl = '/api/sync') {
        this.apiUrl = apiUrl;
        this.deviceId = this.getOrCreateDeviceId();
        this.syncInterval = 30000; // 30 seconds
        this.isSyncing = false;
        this.pendingChanges = new Map();
        
        console.log('🔄 SyncManager initialized with device ID:', this.deviceId);
        
        // Start automatic sync
        this.startAutoSync();
    }

    /**
     * Get or create a unique device ID
     */
    getOrCreateDeviceId() {
        let deviceId = localStorage.getItem('deviceId');
        if (!deviceId) {
            deviceId = 'device_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            localStorage.setItem('deviceId', deviceId);
        }
        return deviceId;
    }

    /**
     * Save data to Supabase
     */
    async saveData(key, value) {
        try {
            const response = await fetch(`${this.apiUrl}?key=${encodeURIComponent(key)}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    key,
                    value,
                    deviceId: this.deviceId
                })
            });

            if (!response.ok) {
                throw new Error(`Failed to save data: ${response.statusText}`);
            }

            const result = await response.json();
            
            // Remove from pending changes if successful
            this.pendingChanges.delete(key);
            
            console.log(`✅ Data saved: ${key}`);
            return result;
        } catch (error) {
            console.error(`❌ Error saving data (${key}):`, error);
            
            // Add to pending changes for retry
            this.pendingChanges.set(key, value);
            
            return null;
        }
    }

    /**
     * Save multiple data items at once
     */
    async saveBatch(items) {
        try {
            // For Vercel, save items individually
            const results = [];
            for (const item of items) {
                const result = await this.saveData(item.key, item.value);
                results.push(result);
            }
            
            console.log(`✅ Batch saved: ${items.length} items`);
            return { success: true, message: `${items.length} items saved successfully` };
        } catch (error) {
            console.error('❌ Error saving batch:', error);
            
            // Add all items to pending changes
            items.forEach(item => {
                this.pendingChanges.set(item.key, item.value);
            });
            
            return null;
        }
    }

    /**
     * Load data from Supabase
     */
    async loadData(key) {
        try {
            const response = await fetch(`${this.apiUrl}?key=${encodeURIComponent(key)}`);

            if (response.status === 404) {
                console.log(`⚠️ Data not found: ${key}`);
                return null;
            }

            if (!response.ok) {
                throw new Error(`Failed to load data: ${response.statusText}`);
            }

            const result = await response.json();
            console.log(`✅ Data loaded: ${key}`);
            return result.value;
        } catch (error) {
            console.error(`❌ Error loading data (${key}):`, error);
            return null;
        }
    }

    /**
     * Load all data from Supabase
     */
    async loadAllData() {
        try {
            const response = await fetch(this.apiUrl);

            if (!response.ok) {
                throw new Error(`Failed to load all data: ${response.statusText}`);
            }

            const result = await response.json();
            console.log(`✅ All data loaded`);
            return result;
        } catch (error) {
            console.error('❌ Error loading all data:', error);
            return {};
        }
    }

    /**
     * Delete data from Supabase
     */
    async deleteData(key) {
        try {
            const response = await fetch(`${this.apiUrl}?key=${encodeURIComponent(key)}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    deviceId: this.deviceId
                })
            });

            if (!response.ok) {
                throw new Error(`Failed to delete data: ${response.statusText}`);
            }

            const result = await response.json();
            console.log(`✅ Data deleted: ${key}`);
            return result;
        } catch (error) {
            console.error(`❌ Error deleting data (${key}):`, error);
            return null;
        }
    }

    /**
     * Start automatic sync every N seconds
     */
    startAutoSync() {
        this.syncTimer = setInterval(() => {
            this.syncPendingChanges();
        }, this.syncInterval);
    }

    /**
     * Stop automatic sync
     */
    stopAutoSync() {
        if (this.syncTimer) {
            clearInterval(this.syncTimer);
        }
    }

    /**
     * Sync pending changes to Supabase
     */
    async syncPendingChanges() {
        if (this.pendingChanges.size === 0 || this.isSyncing) {
            return;
        }

        this.isSyncing = true;
        const items = Array.from(this.pendingChanges.entries()).map(([key, value]) => ({
            key,
            value
        }));

        const result = await this.saveBatch(items);
        
        if (result && result.success) {
            this.pendingChanges.clear();
        }

        this.isSyncing = false;
    }

    /**
     * Get pending changes count
     */
    getPendingChangesCount() {
        return this.pendingChanges.size;
    }

    /**
     * Force sync now
     */
    async forceSync() {
        console.log('🔄 Forcing sync...');
        await this.syncPendingChanges();
    }

    /**
     * Check API health
     */
    async checkHealth() {
        try {
            const response = await fetch('/api/health');
            return response.ok;
        } catch (error) {
            console.error('❌ API health check failed:', error);
            return false;
        }
    }
}

// Create global instance
const syncManager = new SyncManager('/api/sync');

// Check API health on load
window.addEventListener('load', async () => {
    const isHealthy = await syncManager.checkHealth();
    if (isHealthy) {
        console.log('✅ API is healthy and ready');
    } else {
        console.warn('⚠️ API health check failed, using fallback');
    }
});

// Export for use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SyncManager;
}
