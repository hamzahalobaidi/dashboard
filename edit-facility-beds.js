// edit-facility-beds.js - إدارة تعديل الأسرة في المنشآت

const facilityBedsManager = {
    currentFacility: null,
    bedsData: {},

    // فتح نافذة تعديل الأسرة
    openEditModal(facilityId) {
        try {
            console.log(`🏥 فتح نافذة تعديل الأسرة للمنشأة: ${facilityId}`);
            
            // البحث عن المنشأة
            if (typeof customFacilities !== 'undefined' && Array.isArray(customFacilities)) {
                this.currentFacility = customFacilities.find(f => f.id === facilityId);
                
                if (this.currentFacility) {
                    this.displayBedsData();
                    return true;
                }
            }
            
            console.warn('⚠️ لم يتم العثور على المنشأة');
            return false;
        } catch (error) {
            console.error('❌ خطأ في فتح نافذة التعديل:', error);
            return false;
        }
    },

    // عرض بيانات الأسرة
    displayBedsData() {
        try {
            if (!this.currentFacility) {
                console.warn('⚠️ لا توجد منشأة محددة');
                return;
            }

            // إعداد البيانات
            this.bedsData = {
                emergency: this.currentFacility.emergency || { occupied: 0, total: 0 },
                icu: this.currentFacility.icu || { occupied: 0, total: 0 },
                ccu: this.currentFacility.ccu || { occupied: 0, total: 0 },
                picu: this.currentFacility.picu || { occupied: 0, total: 0 },
                nicu: this.currentFacility.nicu || { occupied: 0, total: 0 }
            };

            console.log('📊 بيانات الأسرة:', this.bedsData);
            return this.bedsData;
        } catch (error) {
            console.error('❌ خطأ في عرض بيانات الأسرة:', error);
            return null;
        }
    },

    // تحديث بيانات الأسرة
    updateBedsData(bedType, occupied, total) {
        try {
            if (!this.currentFacility) {
                console.warn('⚠️ لا توجد منشأة محددة');
                return false;
            }

            // التحقق من الصحة
            if (occupied > total) {
                console.warn(`⚠️ عدد الأسرة المشغولة (${occupied}) لا يمكن أن يتجاوز الإجمالي (${total})`);
                return false;
            }

            // تحديث البيانات
            if (!this.currentFacility[bedType]) {
                this.currentFacility[bedType] = {};
            }

            this.currentFacility[bedType].occupied = occupied;
            this.currentFacility[bedType].total = total;

            console.log(`✅ تم تحديث ${bedType}: ${occupied}/${total}`);
            return true;
        } catch (error) {
            console.error('❌ خطأ في تحديث بيانات الأسرة:', error);
            return false;
        }
    },

    // حفظ التغييرات
    async saveChanges() {
        try {
            if (!this.currentFacility) {
                console.warn('⚠️ لا توجد منشأة محددة');
                return false;
            }

            console.log('💾 جاري حفظ التغييرات...');

            // تحديث المنشأة في القائمة
            const index = customFacilities.findIndex(f => f.id === this.currentFacility.id);
            if (index !== -1) {
                customFacilities[index] = this.currentFacility;
            }

            // حفظ في localStorage
            if (typeof localStorageWrapper !== 'undefined') {
                localStorageWrapper.setCustomFacilities(customFacilities);
            } else {
                localStorage.setItem('customFacilities', JSON.stringify(customFacilities));
            }

            // حفظ في Supabase
            if (typeof syncManager !== 'undefined' && syncManager.saveData) {
                await syncManager.saveData('customFacilities', customFacilities);
            }

            // بث التحديث للنوافذ الأخرى
            if (typeof BroadcastChannel !== 'undefined') {
                const channel = new BroadcastChannel('emergency_dashboard_updates');
                channel.postMessage({
                    type: 'facility_beds_updated',
                    facilityId: this.currentFacility.id,
                    data: this.currentFacility
                });
                setTimeout(() => channel.close(), 500);
            }

            console.log('✅ تم حفظ التغييرات بنجاح');
            return true;
        } catch (error) {
            console.error('❌ خطأ في حفظ التغييرات:', error);
            return false;
        }
    },

    // إلغاء التعديلات
    cancelChanges() {
        try {
            console.log('❌ تم إلغاء التعديلات');
            this.currentFacility = null;
            this.bedsData = {};
            return true;
        } catch (error) {
            console.error('❌ خطأ في إلغاء التعديلات:', error);
            return false;
        }
    },

    // الحصول على نسبة الاشغال
    getOccupancyPercentage(bedType) {
        try {
            const beds = this.currentFacility[bedType];
            if (!beds || beds.total === 0) {
                return 0;
            }
            return Math.round((beds.occupied / beds.total) * 100);
        } catch (error) {
            console.error('❌ خطأ في حساب نسبة الاشغال:', error);
            return 0;
        }
    },

    // الحصول على لون نسبة الاشغال
    getOccupancyColor(percentage) {
        if (percentage <= 50) return '#22c55e'; // أخضر
        if (percentage <= 75) return '#eab308'; // أصفر
        if (percentage <= 90) return '#f97316'; // برتقالي
        return '#ef4444'; // أحمر
    },

    // التحقق من صحة جميع البيانات
    validateAllBeds() {
        try {
            const bedTypes = ['emergency', 'icu', 'ccu', 'picu', 'nicu'];
            
            for (const bedType of bedTypes) {
                const beds = this.currentFacility[bedType];
                if (beds && beds.occupied > beds.total) {
                    console.warn(`⚠️ خطأ في ${bedType}: المشغول > الإجمالي`);
                    return false;
                }
            }

            console.log('✅ جميع البيانات صحيحة');
            return true;
        } catch (error) {
            console.error('❌ خطأ في التحقق من البيانات:', error);
            return false;
        }
    },

    // الحصول على ملخص الأسرة
    getSummary() {
        try {
            if (!this.currentFacility) {
                return null;
            }

            const summary = {
                facilityName: this.currentFacility.name,
                totalBeds: 0,
                totalOccupied: 0,
                occupancyPercentage: 0,
                bedTypes: {}
            };

            const bedTypes = ['emergency', 'icu', 'ccu', 'picu', 'nicu'];
            
            for (const bedType of bedTypes) {
                const beds = this.currentFacility[bedType];
                if (beds) {
                    summary.totalBeds += beds.total || 0;
                    summary.totalOccupied += beds.occupied || 0;
                    summary.bedTypes[bedType] = {
                        occupied: beds.occupied || 0,
                        total: beds.total || 0,
                        percentage: beds.total > 0 ? Math.round((beds.occupied / beds.total) * 100) : 0
                    };
                }
            }

            if (summary.totalBeds > 0) {
                summary.occupancyPercentage = Math.round((summary.totalOccupied / summary.totalBeds) * 100);
            }

            return summary;
        } catch (error) {
            console.error('❌ خطأ في الحصول على الملخص:', error);
            return null;
        }
    },

    // تحديث اسم المنشأة
    updateFacilityName(newName) {
        try {
            if (!this.currentFacility) {
                console.warn('⚠️ لا توجد منشأة محددة');
                return false;
            }

            this.currentFacility.name = newName;
            console.log(`✅ تم تحديث اسم المنشأة: ${newName}`);
            return true;
        } catch (error) {
            console.error('❌ خطأ في تحديث اسم المنشأة:', error);
            return false;
        }
    },

    // حذف المنشأة
    async deleteFacility() {
        try {
            if (!this.currentFacility) {
                console.warn('⚠️ لا توجد منشأة محددة');
                return false;
            }

            const facilityId = this.currentFacility.id;
            
            // حذف من القائمة
            const index = customFacilities.findIndex(f => f.id === facilityId);
            if (index !== -1) {
                customFacilities.splice(index, 1);
            }

            // حفظ في localStorage
            if (typeof localStorageWrapper !== 'undefined') {
                localStorageWrapper.setCustomFacilities(customFacilities);
            } else {
                localStorage.setItem('customFacilities', JSON.stringify(customFacilities));
            }

            // حفظ في Supabase
            if (typeof syncManager !== 'undefined' && syncManager.saveData) {
                await syncManager.saveData('customFacilities', customFacilities);
            }

            // بث التحديث
            if (typeof BroadcastChannel !== 'undefined') {
                const channel = new BroadcastChannel('emergency_dashboard_updates');
                channel.postMessage({
                    type: 'facility_deleted',
                    facilityId: facilityId
                });
                setTimeout(() => channel.close(), 500);
            }

            console.log(`✅ تم حذف المنشأة: ${facilityId}`);
            this.currentFacility = null;
            return true;
        } catch (error) {
            console.error('❌ خطأ في حذف المنشأة:', error);
            return false;
        }
    }
};

// تصدير للاستخدام العام
if (typeof window !== 'undefined') {
    window.facilityBedsManager = facilityBedsManager;
}
