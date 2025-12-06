/**
 * localStorage Wrapper - يحول عمليات localStorage إلى syncManager
 * يسمح للكود الموجود بالعمل مع Supabase بدون تعديلات كبيرة
 */

class LocalStorageWrapper {
    constructor() {
        this.cache = {}; // cache محلي للبيانات
        this.pendingSync = new Map(); // تتبع العمليات المعلقة
        this.initialized = false;
    }

    /**
     * تهيئة الـ cache من Supabase
     */
    async initialize() {
        if (this.initialized) return;
        
        console.log('🔄 تهيئة localStorage wrapper...');
        
        try {
            // تحميل البيانات من Supabase
            const allData = await syncManager.loadAllData();
            
            // دمج البيانات مع localStorage المحلي
            const localData = {};
            for (let i = 0; i < window.localStorage.length; i++) {
                const key = window.localStorage.key(i);
                localData[key] = window.localStorage.getItem(key);
            }
            
            // دمج: Supabase أولاً (أحدث)، ثم localStorage المحلي
            this.cache = { ...localData, ...allData };
            
            this.initialized = true;
            console.log('✅ تم تهيئة cache بـ', Object.keys(this.cache).length, 'مفتاح');
        } catch (error) {
            console.error('❌ خطأ في تهيئة cache:', error);
            this.initialized = true; // لا نحاول مرة أخرى
        }
    }

    /**
     * حفظ البيانات في Supabase و cache
     */
    setItem(key, value) {
        try {
            // حفظ في cache محلي فوراً
            this.cache[key] = value;
            
            // حفظ في localStorage كـ fallback
            try {
                window.localStorage.setItem(key, value);
            } catch (e) {
                console.warn('⚠️ localStorage full');
            }
            
            // حفظ في Supabase بشكل غير متزامن
            if (!this.pendingSync.has(key)) {
                this.pendingSync.set(key, true);
                
                // محاولة تحليل JSON
                let parsedValue = value;
                try {
                    parsedValue = JSON.parse(value);
                } catch (e) {
                    // إذا لم يكن JSON، استخدم القيمة كما هي
                }
                
                syncManager.saveData(key, parsedValue)
                    .then(() => {
                        this.pendingSync.delete(key);
                        console.log(`✅ Synced: ${key}`);
                    })
                    .catch(error => {
                        this.pendingSync.delete(key);
                        console.error(`❌ Sync failed: ${key}`, error);
                    });
            }
        } catch (error) {
            console.error('❌ Error in setItem:', error);
        }
    }

    /**
     * تحميل البيانات من cache (سريع)
     */
    getItem(key) {
        try {
            // البحث في cache أولاً
            if (key in this.cache) {
                return this.cache[key];
            }
            
            // محاولة من localStorage كـ fallback
            const localValue = window.localStorage.getItem(key);
            if (localValue !== null) {
                this.cache[key] = localValue;
            }
            
            return localValue;
        } catch (error) {
            console.error('❌ Error in getItem:', error);
            return null;
        }
    }

    /**
     * حذف البيانات
     */
    removeItem(key) {
        try {
            // حذف من cache
            delete this.cache[key];
            
            // حذف من localStorage
            try {
                window.localStorage.removeItem(key);
            } catch (e) {
                console.warn('⚠️ Error removing from localStorage');
            }
            
            // حذف من Supabase
            syncManager.deleteData(key)
                .catch(error => {
                    console.error(`❌ Error deleting: ${key}`, error);
                });
        } catch (error) {
            console.error('❌ Error in removeItem:', error);
        }
    }

    /**
     * مسح جميع البيانات
     */
    clear() {
        try {
            this.cache = {};
            window.localStorage.clear();
            console.log('✅ تم مسح جميع البيانات');
        } catch (error) {
            console.error('❌ Error in clear:', error);
        }
    }

    /**
     * الحصول على عدد العناصر
     */
    get length() {
        return Object.keys(this.cache).length;
    }

    /**
     * الحصول على مفتاح بواسطة الفهرس
     */
    key(index) {
        const keys = Object.keys(this.cache);
        return keys[index] || null;
    }

    /**
     * تحديث cache من Supabase (مزامنة يدوية)
     */
    async syncFromSupabase() {
        try {
            console.log('🔄 جاري المزامنة من Supabase...');
            const allData = await syncManager.loadAllData();
            
            // دمج البيانات الجديدة
            this.cache = { ...this.cache, ...allData };
            
            console.log('✅ تم المزامنة من Supabase');
            return true;
        } catch (error) {
            console.error('❌ خطأ في المزامنة:', error);
            return false;
        }
    }
}

// إنشاء wrapper واحد
const storageWrapper = new LocalStorageWrapper();

// تهيئة الـ wrapper عند تحميل الصفحة
window.addEventListener('load', async () => {
    if (typeof syncManager !== 'undefined') {
        await storageWrapper.initialize();
    }
});

// إضافة دالة للمزامنة اليدوية
window.syncStorageFromSupabase = async () => {
    return await storageWrapper.syncFromSupabase();
};

console.log('✅ localStorage wrapper loaded');
