// localStorage-wrapper.js - إدارة التخزين المحلي

const localStorageWrapper = {
    // البادئة لجميع المفاتيح
    prefix: 'emergency_dashboard_',

    // حفظ البيانات
    set(key, value) {
        try {
            const fullKey = this.prefix + key;
            const serialized = JSON.stringify(value);
            localStorage.setItem(fullKey, serialized);
            console.log(`✅ تم حفظ ${key} في localStorage`);
            return true;
        } catch (error) {
            console.error(`❌ خطأ في حفظ ${key}:`, error);
            return false;
        }
    },

    // استرجاع البيانات
    get(key, defaultValue = null) {
        try {
            const fullKey = this.prefix + key;
            const value = localStorage.getItem(fullKey);
            
            if (value === null) {
                return defaultValue;
            }
            
            return JSON.parse(value);
        } catch (error) {
            console.error(`❌ خطأ في استرجاع ${key}:`, error);
            return defaultValue;
        }
    },

    // حذف البيانات
    remove(key) {
        try {
            const fullKey = this.prefix + key;
            localStorage.removeItem(fullKey);
            console.log(`✅ تم حذف ${key} من localStorage`);
            return true;
        } catch (error) {
            console.error(`❌ خطأ في حذف ${key}:`, error);
            return false;
        }
    },

    // حذف جميع البيانات
    clear() {
        try {
            const keys = Object.keys(localStorage);
            keys.forEach(key => {
                if (key.startsWith(this.prefix)) {
                    localStorage.removeItem(key);
                }
            });
            console.log('✅ تم حذف جميع البيانات من localStorage');
            return true;
        } catch (error) {
            console.error('❌ خطأ في حذف البيانات:', error);
            return false;
        }
    },

    // التحقق من وجود مفتاح
    has(key) {
        try {
            const fullKey = this.prefix + key;
            return localStorage.getItem(fullKey) !== null;
        } catch (error) {
            return false;
        }
    },

    // الحصول على جميع البيانات
    getAll() {
        try {
            const result = {};
            const keys = Object.keys(localStorage);
            
            keys.forEach(key => {
                if (key.startsWith(this.prefix)) {
                    const cleanKey = key.replace(this.prefix, '');
                    result[cleanKey] = this.get(cleanKey);
                }
            });
            
            return result;
        } catch (error) {
            console.error('❌ خطأ في الحصول على جميع البيانات:', error);
            return {};
        }
    },

    // حفظ المراكز الإسعافية
    setEmergencyCenters(centers) {
        return this.set('emergencyCenters', centers);
    },

    // استرجاع المراكز الإسعافية
    getEmergencyCenters() {
        return this.get('emergencyCenters', []);
    },

    // حفظ المنشآت المخصصة
    setCustomFacilities(facilities) {
        return this.set('customFacilities', facilities);
    },

    // استرجاع المنشآت المخصصة
    getCustomFacilities() {
        return this.get('customFacilities', []);
    },

    // حفظ بيانات شراء الخدمة
    setServicePurchaseData(data) {
        return this.set('servicePurchaseData', data);
    },

    // استرجاع بيانات شراء الخدمة
    getServicePurchaseData() {
        return this.get('servicePurchaseData', null);
    },

    // حفظ بيانات الإحالات
    setReferralsData(data) {
        return this.set('referralsData', data);
    },

    // استرجاع بيانات الإحالات
    getReferralsData() {
        return this.get('referralsData', null);
    },

    // حفظ فرق الطب المتنقل
    setMobileTeams(teams) {
        return this.set('mobileTeams', teams);
    },

    // استرجاع فرق الطب المتنقل
    getMobileTeams() {
        return this.get('mobileTeams', []);
    },

    // حفظ آخر وقت تحديث
    setLastUpdateTime(time) {
        return this.set('lastUpdateTime', time);
    },

    // استرجاع آخر وقت تحديث
    getLastUpdateTime() {
        return this.get('lastUpdateTime', null);
    },

    // حفظ حالة الإدارة
    setAdminMode(isAdmin) {
        return this.set('adminMode', isAdmin);
    },

    // استرجاع حالة الإدارة
    getAdminMode() {
        return this.get('adminMode', false);
    },

    // حفظ كلمة المرور (مشفرة بسيطة)
    setPassword(password) {
        // تشفير بسيط جداً - في الإنتاج استخدم تشفير حقيقي
        const encoded = btoa(password);
        return this.set('password', encoded);
    },

    // استرجاع كلمة المرور
    getPassword() {
        try {
            const encoded = this.get('password', null);
            if (!encoded) return null;
            return atob(encoded);
        } catch (error) {
            return null;
        }
    },

    // حفظ بيانات الجلسة
    setSessionData(data) {
        return this.set('sessionData', data);
    },

    // استرجاع بيانات الجلسة
    getSessionData() {
        return this.get('sessionData', null);
    },

    // التحقق من صحة البيانات المحفوظة
    validate() {
        try {
            const allData = this.getAll();
            console.log('📊 بيانات localStorage المحفوظة:', allData);
            return true;
        } catch (error) {
            console.error('❌ خطأ في التحقق من البيانات:', error);
            return false;
        }
    },

    // حفظ نقطة تفتيش (backup)
    saveCheckpoint(name) {
        try {
            const checkpoint = {
                timestamp: new Date().toISOString(),
                data: this.getAll()
            };
            this.set(`checkpoint_${name}`, checkpoint);
            console.log(`✅ تم حفظ نقطة تفتيش: ${name}`);
            return true;
        } catch (error) {
            console.error(`❌ خطأ في حفظ نقطة التفتيش:`, error);
            return false;
        }
    },

    // استرجاع نقطة تفتيش
    restoreCheckpoint(name) {
        try {
            const checkpoint = this.get(`checkpoint_${name}`, null);
            if (!checkpoint) {
                console.warn(`⚠️ نقطة التفتيش ${name} غير موجودة`);
                return false;
            }

            // استرجاع جميع البيانات من نقطة التفتيش
            Object.entries(checkpoint.data).forEach(([key, value]) => {
                this.set(key, value);
            });

            console.log(`✅ تم استرجاع نقطة التفتيش: ${name}`);
            return true;
        } catch (error) {
            console.error(`❌ خطأ في استرجاع نقطة التفتيش:`, error);
            return false;
        }
    }
};

// تصدير للاستخدام العام
if (typeof window !== 'undefined') {
    window.localStorageWrapper = localStorageWrapper;
}
