// sync-manager.js - إدارة المزامنة مع Supabase

const syncManager = {
    supabaseUrl: 'https://qwgwvpvqvlhqbfbzqhvl.supabase.co',
    supabaseKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF3Z3d2cHZxdmxocWJmYnpxaHZsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzA3MTExMDAsImV4cCI6MjA0NjI4NzEwMH0.Zz0wFXR7P0Ew1dFKvPGnzNQqEPvzNhQyJkKvXZqhFxw',
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
                    const saved = localStorage.getItem('emergencyCenters');
                    result.emergencyCenters = saved ? JSON.parse(saved) : [];
                } else {
                    result.emergencyCenters = centers || [];
                    console.log('✅ تم تحميل المراكز:', result.emergencyCenters.length);
                    // حفظ محلياً
                    localStorage.setItem('emergencyCenters', JSON.stringify(result.emergencyCenters));
                }
            } catch (error) {
                console.error('❌ خطأ في تحميل المراكز:', error);
                const saved = localStorage.getItem('emergencyCenters');
                result.emergencyCenters = saved ? JSON.parse(saved) : [];
            }

            // تحميل المنشآت المخصصة
            try {
                const { data: facilities, error: facilitiesError } = await this.client
                    .from('custom_facilities')
                    .select('*');
                
                if (facilitiesError) {
                    console.warn('⚠️ خطأ في تحميل المنشآت:', facilitiesError);
                    const saved = localStorage.getItem('customFacilities');
                    result.customFacilities = saved ? JSON.parse(saved) : [];
                } else {
                    result.customFacilities = facilities || [];
                    console.log('✅ تم تحميل المنشآت:', result.customFacilities.length);
                    localStorage.setItem('customFacilities', JSON.stringify(result.customFacilities));
                }
            } catch (error) {
                console.error('❌ خطأ في تحميل المنشآت:', error);
                const saved = localStorage.getItem('customFacilities');
                result.customFacilities = saved ? JSON.parse(saved) : [];
            }

            // تحميل بيانات شراء الخدمة
            try {
                const { data: servicePurchase, error: serviceError } = await this.client
                    .from('service_purchase')
                    .select('*')
                    .single();
                
                if (!serviceError) {
                    result.servicePurchaseData = servicePurchase;
                    localStorage.setItem('servicePurchaseData', JSON.stringify(servicePurchase));
                } else {
                    const saved = localStorage.getItem('servicePurchaseData');
                    result.servicePurchaseData = saved ? JSON.parse(saved) : null;
                }
            } catch (error) {
                console.error('❌ خطأ في تحميل بيانات الخدمة:', error);
                const saved = localStorage.getItem('servicePurchaseData');
                result.servicePurchaseData = saved ? JSON.parse(saved) : null;
            }

            // تحميل بيانات الإحالات
            try {
                const { data: referrals, error: referralsError } = await this.client
                    .from('referrals')
                    .select('*');
                
                if (!referralsError) {
                    result.referralsData = referrals;
                    localStorage.setItem('referralsData', JSON.stringify(referrals));
                } else {
                    const saved = localStorage.getItem('referralsData');
                    result.referralsData = saved ? JSON.parse(saved) : null;
                }
            } catch (error) {
                console.error('❌ خطأ في تحميل الإحالات:', error);
                const saved = localStorage.getItem('referralsData');
                result.referralsData = saved ? JSON.parse(saved) : null;
            }

            // تحميل فرق الطب المتنقل
            try {
                const { data: mobileTeams, error: teamsError } = await this.client
                    .from('mobile_teams')
                    .select('*');
                
                if (!teamsError) {
                    result.mobileTeams = mobileTeams || [];
                    localStorage.setItem('mobileTeams', JSON.stringify(result.mobileTeams));
                } else {
                    const saved = localStorage.getItem('mobileTeams');
                    result.mobileTeams = saved ? JSON.parse(saved) : [];
                }
            } catch (error) {
                console.error('❌ خطأ في تحميل الفرق:', error);
                const saved = localStorage.getItem('mobileTeams');
                result.mobileTeams = saved ? JSON.parse(saved) : [];
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
                const saved = localStorage.getItem(table);
                return saved ? JSON.parse(saved) : null;
            }

            // حفظ محلياً
            localStorage.setItem(table, JSON.stringify(data));
            return data;
        } catch (error) {
            console.error(`❌ خطأ في loadData(${table}):`, error);
            const saved = localStorage.getItem(table);
            return saved ? JSON.parse(saved) : null;
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
            localStorage.setItem(table, JSON.stringify(data));

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

// تهيئة تلقائية عند تحميل الملف
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        syncManager.initialize();
    });
} else {
    syncManager.initialize();
}
