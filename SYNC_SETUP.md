# نظام مزامنة البيانات - دليل الإعداد

## نظرة عامة
هذا النظام يوفر مزامنة البيانات بين أجهزة متعددة من خلال حفظ البيانات في قاعدة بيانات SQLite بدلاً من localStorage المحلي.

## المميزات
- ✅ مزامنة فورية للبيانات بين الأجهزة
- ✅ حفظ آمن للبيانات في قاعدة البيانات
- ✅ نفس واجهة localStorage للتوافقية
- ✅ مزامنة دورية تلقائية
- ✅ معالجة الأخطاء والإعادة التلقائية

## المكونات

### 1. API Backend (`api.js`)
- يوفر REST API للتعامل مع البيانات
- يحفظ البيانات في SQLite
- يسجل جميع عمليات المزامنة

**المتطلبات:**
```bash
npm install express cors sqlite3
```

**التشغيل:**
```bash
node api.js
```

### 2. Sync Manager (`sync-manager.js`)
- مكتبة JavaScript للتعامل مع API
- تدير المزامنة الدورية
- تتعامل مع الأخطاء والإعادة

**الاستخدام:**
```javascript
// تم إنشاء instance عام
const syncManager = new SyncManager('/api/dashboard');

// حفظ البيانات
await syncManager.saveData('key', value);

// تحميل البيانات
const data = await syncManager.loadData('key');

// مزامنة فورية
await syncManager.forceSync();
```

### 3. localStorage Wrapper (`localStorage-wrapper.js`)
- يحل محل localStorage بـ syncManager
- نفس الواجهة للتوافقية
- يدعم المزامنة الدورية

**الاستخدام:**
```javascript
// تهيئة الـ wrapper
await initializeStorage();

// استخدام نفس طريقة localStorage
localStorageWrapper.setItem('key', 'value');
const value = localStorageWrapper.getItem('key');
```

## خطوات الإعداد

### 1. تثبيت المتطلبات
```bash
cd dashboard-deploy
npm install
```

### 2. تشغيل API Server
```bash
npm start
# أو للتطوير مع auto-reload
npm run dev
```

### 3. إضافة الملفات إلى HTML
```html
<script src="sync-manager.js"></script>
<script src="localStorage-wrapper.js"></script>
```

### 4. تهيئة Storage عند تحميل الصفحة
```javascript
// في نهاية الملف قبل استخدام localStorage
document.addEventListener('DOMContentLoaded', async () => {
    await initializeStorage();
    // الآن يمكنك استخدام localStorageWrapper
});
```

## API Endpoints

### GET `/api/dashboard/data`
تحميل جميع البيانات

```bash
curl http://localhost:3001/api/dashboard/data
```

### GET `/api/dashboard/data/:key`
تحميل بيانات محددة

```bash
curl http://localhost:3001/api/dashboard/data/customFacilities
```

### POST `/api/dashboard/data`
حفظ بيانات

```bash
curl -X POST http://localhost:3001/api/dashboard/data \
  -H "Content-Type: application/json" \
  -d '{"key":"customFacilities","value":[...],"deviceId":"device_123"}'
```

### POST `/api/dashboard/data/batch`
حفظ عدة بيانات

```bash
curl -X POST http://localhost:3001/api/dashboard/data/batch \
  -H "Content-Type: application/json" \
  -d '{"items":[{"key":"key1","value":"value1"}],"deviceId":"device_123"}'
```

### DELETE `/api/dashboard/data/:key`
حذف بيانات

```bash
curl -X DELETE http://localhost:3001/api/dashboard/data/customFacilities \
  -H "Content-Type: application/json" \
  -d '{"deviceId":"device_123"}'
```

### GET `/api/dashboard/sync-log`
تحميل سجل المزامنة

```bash
curl http://localhost:3001/api/dashboard/sync-log?limit=100
```

### GET `/api/health`
فحص صحة API

```bash
curl http://localhost:3001/api/health
```

## قاعدة البيانات

### جدول `dashboard_data`
| الحقل | النوع | الوصف |
|------|------|--------|
| id | INTEGER | معرف فريد |
| key | TEXT | مفتاح البيانات |
| value | TEXT | قيمة البيانات (JSON) |
| updated_at | TIMESTAMP | وقت التحديث |
| updated_by | TEXT | معرف الجهاز الذي قام بالتحديث |

### جدول `sync_log`
| الحقل | النوع | الوصف |
|------|------|--------|
| id | INTEGER | معرف فريد |
| action | TEXT | نوع العملية (save, delete, batch_save) |
| key | TEXT | مفتاح البيانات |
| timestamp | TIMESTAMP | وقت العملية |
| device_id | TEXT | معرف الجهاز |

## المزامنة الدورية

يتم المزامنة تلقائياً كل 30 ثانية. يمكن تغيير الفترة:

```javascript
syncManager.syncInterval = 60000; // 60 ثانية
```

## معالجة الأخطاء

إذا فشلت المزامنة، يتم حفظ البيانات في `pendingChanges` وإعادة المحاولة تلقائياً.

```javascript
// عدد التغييرات المعلقة
const pending = syncManager.getPendingChangesCount();

// مزامنة فورية
await syncManager.forceSync();
```

## الأمان

- تأكد من تفعيل HTTPS في الإنتاج
- استخدم معرف جهاز فريد لكل جهاز
- احفظ بيانات حساسة بشكل آمن

## استكشاف الأخطاء

### المزامنة لا تعمل
1. تحقق من أن API server يعمل
2. افتح console في المتصفح وابحث عن الأخطاء
3. تحقق من اتصال الشبكة

### البيانات لا تظهر على جهاز آخر
1. تأكد من أن كلا الجهازين يستخدمان نفس API
2. تحقق من سجل المزامنة
3. جرب مزامنة فورية: `await syncManager.forceSync()`

### قاعدة البيانات تالفة
1. احذف ملف `dashboard.db`
2. أعد تشغيل API server
3. ستتم إعادة إنشاء قاعدة البيانات تلقائياً

## الأداء

- Cache محلي للأداء السريعة
- مزامنة دورية لتقليل الحمل
- معالجة batch للعمليات المتعددة

## الدعم

للمزيد من المعلومات، راجع:
- `api.js` - تفاصيل API
- `sync-manager.js` - تفاصيل المزامنة
- `localStorage-wrapper.js` - تفاصيل الـ wrapper
