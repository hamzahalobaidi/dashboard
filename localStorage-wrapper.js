/**
 * localStorage Wrapper - يحل محل localStorage بـ syncManager
 * يوفر نفس الواجهة لكن يحفظ البيانات في قاعدة البيانات
 */

class LocalStorageWrapper {
    constructor(syncManager) {
        this.syncManager = syncManager;
        this.localCache = new Map(); // Cache محلي للأداء
        this.initialized = false;
    }

    /**
     * Initialize the wrapper by loading all data from server
     */
    async initialize() {
        if (this.initialized) return;

        try {
            console.log('📦 Initializing localStorage wrapper...');
            const allData = await this.syncManager.loadAllData();
            
            // Load all data into local cache
            Object.entries(allData).forEach(([key, value]) => {
                this.localCache.set(key, value);
            });

            this.initialized = true;
            console.log('✅ localStorage wrapper initialized');
            return true;
        } catch (error) {
            console.error('❌ Error initializing localStorage wrapper:', error);
            return false;
        }
    }

    /**
     * Set item (replaces localStorage.setItem)
     */
    async setItem(key, value) {
        // Update local cache immediately for performance
        this.localCache.set(key, value);

        // Save to server asynchronously
        if (this.syncManager) {
            await this.syncManager.saveData(key, value);
        } else {
            // Fallback to real localStorage if syncManager not available
            localStorage.setItem(key, value);
        }
    }

    /**
     * Get item (replaces localStorage.getItem)
     */
    getItem(key) {
        // Check local cache first
        if (this.localCache.has(key)) {
            return this.localCache.get(key);
        }

        // Fallback to real localStorage
        return localStorage.getItem(key);
    }

    /**
     * Remove item (replaces localStorage.removeItem)
     */
    async removeItem(key) {
        // Remove from local cache
        this.localCache.delete(key);

        // Delete from server
        if (this.syncManager) {
            await this.syncManager.deleteData(key);
        } else {
            // Fallback to real localStorage
            localStorage.removeItem(key);
        }
    }

    /**
     * Clear all items
     */
    async clear() {
        this.localCache.clear();
        
        if (this.syncManager) {
            // Clear all items from server
            const allData = await this.syncManager.loadAllData();
            for (const key of Object.keys(allData)) {
                await this.syncManager.deleteData(key);
            }
        } else {
            localStorage.clear();
        }
    }

    /**
     * Get all keys
     */
    keys() {
        return Array.from(this.localCache.keys());
    }

    /**
     * Get item count
     */
    get length() {
        return this.localCache.size;
    }

    /**
     * Sync all pending changes
     */
    async sync() {
        if (this.syncManager) {
            await this.syncManager.forceSync();
        }
    }

    /**
     * Get pending changes count
     */
    getPendingChanges() {
        return this.syncManager ? this.syncManager.getPendingChangesCount() : 0;
    }
}

// Create a proxy to intercept localStorage calls
const createLocalStorageProxy = (wrapper) => {
    return new Proxy(wrapper, {
        get(target, prop) {
            if (typeof target[prop] === 'function') {
                return target[prop].bind(target);
            }
            return target[prop];
        }
    });
};

// Initialize wrapper when page loads
let storageWrapper = null;

async function initializeStorage() {
    if (typeof syncManager !== 'undefined') {
        storageWrapper = new LocalStorageWrapper(syncManager);
        await storageWrapper.initialize();
        
        // Replace global localStorage with wrapper
        window.localStorageWrapper = storageWrapper;
        
        console.log('✅ Storage wrapper ready');
        return true;
    } else {
        console.warn('⚠️ syncManager not available, using fallback localStorage');
        return false;
    }
}

// Export for use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = LocalStorageWrapper;
}
