// sync-manager.js - إدارة المزامنة مع Supabase

const syncManager = {
    supabaseUrl: 'https://yytxgzksiheseorqhdqm.supabase.co',
    supabaseKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl5dHhnemtzaWhlc2VvcnFoZHFtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU3ODc4MDgsImV4cCI6MjA4MTM2MzgwOH0.aReF32tD8LbY39nEMBqBUmU06V7o2nf-M_zmLJmVlyc',
    client: null,

    // تهيئة عميل Supabase
    initialize() {
        try {
            if (typeof window.supabase !== 'undefined') {
                this.client = window.supabase.createClient(this.supabaseUrl, this.supabaseKey);
                console.log('✅ تم تهيئة Supabase Client في sync-manager');
                return true;
            } else {
                console.warn('⚠️ مكتبة Supabase غير متاحة');
                return false;
            }
        } catch (error) {
            console.error('❌ خطأ في تهيئة Supabase:', error);
            return false;
        }
    },

    // تحميل جميع البيانات من Supabase
    async loadAllData() {
        // استخدام localStorageWrapper إذا كان موجوداً
        const storage = (typeof window !== 'undefined' && window.localStorageWrapper) ? window.localStorageWrapper : {
            set: (key, value) => localStorage.setItem(key, JSON.stringify(value)),
            get: (key, defaultValue) => {
                const val = localStorage.getItem(key);
                return val ? JSON.parse(val) : defaultValue;
            }
        };
        try {
            console.log('🔄 جاري تحميل جميع البيانات من Supabase...');
            
            if (!this.client) {
                this.initialize();
            }

            const result = {
                emergencyCenters: [],
                customFacilities: [],
                servicePurchaseData: null,
                emergencyDashboardData: null,
                referralsData: null,
                mobileTeams: []
            };

            // تحميل المراكز الإسعافية
            try {
                const { data: centers, error: centersError } = await this.client
                    .from('emergency_centers')
                    .select('*');
                
                if (centersError) {
                    console.warn('⚠️ خطأ في تحميل المراكز:', centersError);
                    // استخدام البيانات المحفوظة محلياً
                    result.emergencyCenters = storage.get('emergencyCenters', []);
                } else {
                    result.emergencyCenters = centers || [];
                    console.log('✅ تم تحميل المراكز:', result.emergencyCenters.length);
                    // حفظ محلياً
                    storage.set('emergencyCenters', result.emergencyCenters);
                }
            } catch (error) {
                console.error('❌ خطأ في تحميل المراكز:', error);
                result.emergencyCenters = storage.get('emergencyCenters', []);
            }

            // تحميل المنشآت المخصصة
            try {
                const { data: facilities, error: facilitiesError } = await this.client
                    .from('custom_facilities')
                    .select('*');
                
                if (facilitiesError) {
                    console.warn('⚠️ خطأ في تحميل المنشآت:', facilitiesError);
                    result.customFacilities = storage.get('customFacilities', []);
                } else {
                    result.customFacilities = facilities || [];
                    console.log('✅ تم تحميل المنشآت:', result.customFacilities.length);
                    storage.set('customFacilities', result.customFacilities);
                }
            } catch (error) {
                console.error('❌ خطأ في تحميل المنشآت:', error);
                result.customFacilities = storage.get('customFacilities', []);
            }

            // تحميل بيانات شراء الخدمة
            try {
                const { data: servicePurchase, error: serviceError } = await this.client
                    .from('service_purchase')
                    .select('*')
                    .single();
                
                if (!serviceError) {
                    result.servicePurchaseData = servicePurchase;
                    storage.set('servicePurchaseData', servicePurchase);
                } else {
                    result.servicePurchaseData = storage.get('servicePurchaseData', null);
                }
            } catch (error) {
                console.error('❌ خطأ في تحميل بيانات الخدمة:', error);
                result.servicePurchaseData = storage.get('servicePurchaseData', null);
            }

            // تحميل بيانات الإحالات
            try {
                const { data: referrals, error: referralsError } = await this.client
                    .from('referrals')
                    .select('*');
                
                if (!referralsError) {
                    result.referralsData = referrals;
                    storage.set('referralsData', referrals);
                } else {
                    result.referralsData = storage.get('referralsData', null);
                }
            } catch (error) {
                console.error('❌ خطأ في تحميل الإحالات:', error);
                result.referralsData = storage.get('referralsData', null);
            }

            // تحميل فرق الطب المتنقل
            try {
                const { data: mobileTeams, error: teamsError } = await this.client
                    .from('mobile_teams')
                    .select('*');
                
                if (!teamsError) {
                    result.mobileTeams = mobileTeams || [];
                    storage.set('mobileTeams', result.mobileTeams);
                } else {
                    result.mobileTeams = storage.get('mobileTeams', []);
                }
            } catch (error) {
                console.error('❌ خطأ في تحميل الفرق:', error);
                result.mobileTeams = storage.get('mobileTeams', []);
            }

            console.log('✅ تم تحميل جميع البيانات بنجاح');
            return result;
        } catch (error) {
            console.error('❌ خطأ في loadAllData:', error);
            throw error;
        }
    },

    // تحميل بيانات محددة
    async loadData(table) {
        try {
            if (!this.client) {
                this.initialize();
            }

            const { data, error } = await this.client
                .from(table)
                .select('*');
            
            if (error) {
                console.warn(`⚠️ خطأ في تحميل ${table}:`, error);
                return storage.get(table, null);
            }

            // حفظ محلياً
            storage.set(table, data);
            return data;
        } catch (error) {
            console.error(`❌ خطأ في loadData(${table}):`, error);
            return storage.get(table, null);
        }
    },

    // حفظ البيانات
    async saveData(table, data) {
        try {
            console.log(`💾 جاري حفظ البيانات في ${table}...`);
            
            if (!this.client) {
                this.initialize();
            }

            // حفظ محلياً أولاً
            storage.set(table, data);

            // محاولة الحفظ في Supabase
            if (table === 'emergencyCenters') {
                // حذف البيانات القديمة وإدراج الجديدة
                const { error: deleteError } = await this.client
                    .from(table)
                    .delete()
                    .neq('id', null);
                
                if (!deleteError) {
                    const { error: insertError } = await this.client
                        .from(table)
                        .insert(data);
                    
                    if (insertError) {
                        console.warn(`⚠️ خطأ في إدراج ${table}:`, insertError);
                    } else {
                        console.log(`✅ تم حفظ ${table} في Supabase`);
                    }
                }
            } else if (table === 'customFacilities') {
                const { error: deleteError } = await this.client
                    .from(table)
                    .delete()
                    .neq('id', null);
                
                if (!deleteError) {
                    const { error: insertError } = await this.client
                        .from(table)
                        .insert(data);
                    
                    if (insertError) {
                        console.warn(`⚠️ خطأ في إدراج ${table}:`, insertError);
                    } else {
                        console.log(`✅ تم حفظ ${table} في Supabase`);
                    }
                }
            } else {
                // للجداول الأخرى، حاول التحديث أو الإدراج
                const { error } = await this.client
                    .from(table)
                    .upsert(data, { onConflict: 'id' });
                
                if (error) {
                    console.warn(`⚠️ خطأ في حفظ ${table}:`, error);
                } else {
                    console.log(`✅ تم حفظ ${table} في Supabase`);
                }
            }

            return true;
        } catch (error) {
            console.error(`❌ خطأ في saveData(${table}):`, error);
            // البيانات محفوظة محلياً على الأقل
            return false;
        }
    },

    // حفظ مركز واحد
    async saveCenter(center) {
        try {
            if (!this.client) {
                this.initialize();
            }

            const { error } = await this.client
                .from('emergency_centers')
                .upsert(center, { onConflict: 'id' });
            
            if (error) {
                console.warn('⚠️ خطأ في حفظ المركز:', error);
                return false;
            }

            console.log('✅ تم حفظ المركز في Supabase');
            return true;
        } catch (error) {
            console.error('❌ خطأ في saveCenter:', error);
            return false;
        }
    },

    // حذف مركز
    async deleteCenter(centerId) {
        try {
            if (!this.client) {
                this.initialize();
            }

            const { error } = await this.client
                .from('emergency_centers')
                .delete()
                .eq('id', centerId);
            
            if (error) {
                console.warn('⚠️ خطأ في حذف المركز:', error);
                return false;
            }

            console.log('✅ تم حذف المركز من Supabase');
            return true;
        } catch (error) {
            console.error('❌ خطأ في deleteCenter:', error);
            return false;
        }
    }
};

// إضافة Realtime Listeners
syncManager.setupRealtimeListeners = function() {
    try {
        if (!this.client) {
            this.initialize();
        }

        // مستمع للمراكز الإسعافية
        this.client
            .from('emergency_centers')
            .on('*', payload => {
                console.log('📡 تحديث المراكز من Supabase:', payload);
                // بث الرسالة عبر BroadcastChannel
                if (typeof BroadcastChannel !== 'undefined') {
                    const channel = new BroadcastChannel('emergency_dashboard_updates');
                    channel.postMessage({
                        type: 'centers_updated',
                        data: payload
                    });
                    setTimeout(() => channel.close(), 100);
                }
            })
            .subscribe();

        // مستمع للمنشآت المخصصة
        this.client
            .from('custom_facilities')
            .on('*', payload => {
                console.log('📡 تحديث المنشآت من Supabase:', payload);
                if (typeof BroadcastChannel !== 'undefined') {
                    const channel = new BroadcastChannel('emergency_dashboard_updates');
                    channel.postMessage({
                        type: 'facilities_updated',
                        data: payload
                    });
                    setTimeout(() => channel.close(), 100);
                }
            })
            .subscribe();

        console.log('✅ تم تفعيل Realtime Listeners');
    } catch (error) {
        console.error('❌ خطأ في setupRealtimeListeners:', error);
    }
};

// تهيئة تلقائية عند تحميل الملف
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        syncManager.initialize();
        syncManager.setupRealtimeListeners();
    });
} else {
    syncManager.initialize();
    syncManager.setupRealtimeListeners();
}
