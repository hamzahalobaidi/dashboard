/**
 * Sync Manager - يدير مزامنة البيانات بين الداشبورد وقاعدة البيانات
 * يحل محل localStorage بـ API calls
 */

class SyncManager {
    constructor(apiUrl = '/api/dashboard') {
        this.apiUrl = apiUrl;
        this.deviceId = this.getOrCreateDeviceId();
        this.syncInterval = 30000; // 30 seconds
        this.isSyncing = false;
        this.pendingChanges = new Map();
        
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
     * Save data to database
     */
    async saveData(key, value) {
        try {
            const response = await fetch(`${this.apiUrl}/data`, {
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
            const response = await fetch(`${this.apiUrl}/data/batch`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    items,
                    deviceId: this.deviceId
                })
            });

            if (!response.ok) {
                throw new Error(`Failed to save batch: ${response.statusText}`);
            }

            const result = await response.json();
            console.log(`✅ Batch saved: ${items.length} items`);
            return result;
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
     * Load data from database
     */
    async loadData(key) {
        try {
            const response = await fetch(`${this.apiUrl}/data/${key}`);

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
     * Load all data from database
     */
    async loadAllData() {
        try {
            const response = await fetch(`${this.apiUrl}/data`);

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
     * Delete data from database
     */
    async deleteData(key) {
        try {
            const response = await fetch(`${this.apiUrl}/data/${key}`, {
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
     * Sync pending changes to database
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
            const response = await fetch(`${this.apiUrl.replace('/data', '')}/health`);
            return response.ok;
        } catch (error) {
            console.error('❌ API health check failed:', error);
            return false;
        }
    }
}

// Create global instance
const syncManager = new SyncManager(
    window.location.hostname === 'localhost' 
        ? 'http://localhost:3001/api/dashboard'
        : '/api/dashboard'
);

// Export for use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SyncManager;
}
