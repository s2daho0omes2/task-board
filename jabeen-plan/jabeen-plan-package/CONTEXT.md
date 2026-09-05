# سياق المشروع — خطة مبيعات ينبع 1

## الوصف
صفحة HTML واحدة (index.html) تعرض خطة مبيعات 30 يوم لمشروع ينبع 1 (شركة جبين).
تتضمن: KPI tiles، Gantt chart قابل للتعديل (سحب/تحريك)، مسار عمل (workflow) على مرحلتين، قسم مخاطر.
البيانات تُخزَّن وتُزامَن عبر Google Apps Script + Google Sheet (بدون أي مفتاح Anthropic API).

## الحالة الحالية (منشور ويعمل)
- **الرابط المباشر (Netlify):** https://ornate-gaufre-bb673d.netlify.app (يُفضّل تغيير الاسم ليصير أوضح، وتفعيل "Make public" إن لم يكن مفعّلاً)
- **نسخة احتياطية على GitHub Pages:** https://s2daho0omes2.github.io/yanbu1-plan/ (المستودع: s2daho0omes2/yanbu1-plan)
- **API (Google Apps Script):** https://script.google.com/macros/s/AKfycbyFpT9EN194xXzDZknuz7OQ_n8PgwM-7qkylE2Ux-UIDVWIyby2SKeONj2w24ElGLnNpg/exec
- **Google Sheet ID:** 1cxPqdlQcaM8I1dU6-akNUBUvm9BFLIaswOmxz4eSzVc
- **رمز التعديل (Passcode):** yanbu2026 — العرض مفتوح للجميع، التعديل يحتاج هذا الرمز.

## بنية index.html
- `window.PLAN_API_URL` في أعلى الملف = رابط الـ API أعلاه
- طبقة المزامنة (`window.__PLAN`, `push()`, `poll()`): تسحب كل 15 ثانية، تحفظ مع تأخير debounce 1.2 ثانية
- Gantt: عناصر lanes/tasks قابلة للسحب وتغيير الترتيب وإعادة التحجيم
- بطاقات مسار العمل (workflow) قابلة للتعديل (نص) والإضافة والحذف
- CSS يخفي أدوات التعديل حتى يُفعَّل `.can-edit` على `<body>` (بعد إدخال الرمز الصحيح)

## apps-script/Code.gs
كود Google Apps Script الكامل (doGet/doPost) — يحتاج نشره من داخل Apps Script المرتبط بنفس الـ Google Sheet:
Deploy → Manage deployments → Edit → Version: New version → Deploy
(كل تعديل على Code.gs يحتاج إعادة نشر بهذه الطريقة ليأخذ مفعوله).

## قواعد العمل المنطقية للمشروع (مهم جداً لأي تعديل مستقبلي)
ترتيب الفرز في مسار العمل: **الدفع (رسوم حجز سكني) يجب أن يسبق التحقق من الأهلية مع الهيئة الملكية** — لأن الدفع هو ما يجعل العميل جاداً ويستحق وقت الفريق للتحقق. لا تُقلب هذا الترتيب.

ترتيب أولوية الشركات في المسار: سامرف → مرافق → الفارابي → العبيكان → شركات جديدة → أفراد.
الأرقام الحالية: هدف 183 وحدة خلال 30 يوم، من إجمالي 306 متبقية من أصل 506 وحدة (200 مباعة ومغلقة).

## ملاحظات
- لا يوجد أي مفتاح Anthropic API في هذا المشروع، ولا يُحتاج له.
- عند تعديل index.html: لا تحذف أو تغيّر `window.PLAN_API_URL` إلا إذا تغيّر الـ backend فعلاً.
- الملف يدعم العربية RTL بالكامل (dir="rtl", lang="ar").
