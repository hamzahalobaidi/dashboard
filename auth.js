// ===== نظام المصادقة =====

// كلمة المرور الرئيسية
window.MAIN_PASSWORD = 'emergency2024';
window.ADMIN_PASSWORD = 'admin123';
window.isAuthenticated = false;
window.isAdminMode = false;

// دالة التحقق من كلمة المرور الرئيسية
window.checkMainPassword = function() {
    const passwordInput = document.getElementById('mainProtectionPassword');
    const password = passwordInput.value.trim();
    const errorDiv = document.getElementById('mainProtectionError');
    const mainProtectionModal = document.getElementById('mainProtectionModal');
    
    if (password === window.MAIN_PASSWORD) {
        console.log('🔐 تم التحقق من كلمة المرور بنجاح');
        window.isAuthenticated = true;
        
        // إخفاء شاشة الدخول
        if (mainProtectionModal) {
            mainProtectionModal.style.display = 'none';
        }
        
        // إظهار الداشبورد
        const dashboard = document.getElementById('dashboardContent');
        if (dashboard) {
            dashboard.style.display = 'block';
        }
        
        // تحميل البيانات
        if (window.loadAllDataFromSupabase) {
            window.loadAllDataFromSupabase();
        }
        
        // تحميل المنشآت
        if (window.loadCustomFacilitiesFromSupabase) {
            window.loadCustomFacilitiesFromSupabase();
        }
        
        // تهيئة الداشبورد
        if (window.initializeDashboard) {
            window.initializeDashboard();
        }
        
        // إخفاء رسالة الخطأ
        if (errorDiv) {
            errorDiv.classList.add('hidden');
        }
        
        return true;
    } else {
        console.log('❌ كلمة المرور غير صحيحة');
        
        // إظهار رسالة الخطأ
        if (errorDiv) {
            errorDiv.classList.remove('hidden');
        }
        
        // مسح حقل كلمة المرور
        passwordInput.value = '';
        
        return false;
    }
};

// دالة الدخول لوضع الإدارة
window.showAdminMode = function() {
    const password = prompt('أدخل كلمة المرور لوضع الإدارة:');
    
    if (password === window.ADMIN_PASSWORD) {
        console.log('🔐 تم الدخول لوضع الإدارة بنجاح');
        window.isAdminMode = true;
        
        // إظهار أزرار الإدارة
        const adminButtons = document.querySelectorAll('[data-admin="true"]');
        adminButtons.forEach(btn => {
            btn.style.display = 'block';
        });
        
        // إعادة رسم الجدول لإظهار الأزرار
        if (window.displayCenters) {
            window.displayCenters();
        }
        
        if (window.renderCustomFacilities) {
            window.renderCustomFacilities();
        }
        
        alert('تم الدخول لوضع الإدارة بنجاح');
        return true;
    } else if (password !== null) {
        console.log('❌ كلمة المرور غير صحيحة');
        alert('كلمة المرور غير صحيحة');
        return false;
    }
    
    return false;
};

// مستمعات الأحداث
document.addEventListener('DOMContentLoaded', function() {
    console.log('✅ تم تحميل ملف المصادقة');
    
    // البحث عن حقل كلمة المرور وإضافة مستمع الأحداث
    const passwordInput = document.getElementById('mainProtectionPassword');
    if (passwordInput) {
        passwordInput.addEventListener('keypress', function(event) {
            if (event.key === 'Enter') {
                window.checkMainPassword();
            }
        });
    }
    
    // البحث عن زر الدخول وإضافة مستمع الأحداث
    const loginBtn = document.querySelector('button[onclick*="checkMainPassword"]');
    if (loginBtn) {
        loginBtn.addEventListener('click', window.checkMainPassword);
    }
});

console.log('✅ تم تحميل نظام المصادقة');
