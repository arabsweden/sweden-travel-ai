# Sweden Travel AI

مشروع من **RAED SHIHAB — رائد شهاب**.

Your intelligent travel assistant for discovering Sweden, planning trips, finding attractions, hotels, and restaurants.

## الروابط


- [الكود وإعدادات هذا المشروع](https://github.com/arabsweden/sweden-travel-ai)
- [مشاريع رائد وروابط التواصل](https://linktr.ee/raedshihab)

روابط التشغيل الخارجية والكود في هذا المستودع قد تتحدث بصورة مستقلة؛ تعديل أحدهما لا يعني مزامنة الآخر.

## التشغيل المحلي

```bash
npm install
npm run dev
```

انسخ `.env.example` إلى `.env.local` واضبط القيم المطلوبة على جهازك. لا ترفع ملفات البيئة أو مفاتيح API إلى المستودع.

## البناء والتحقق

```bash
npm run lint
npm run build
```

يوجد أمر `npm start` لتشغيل الخادم؛ راجع أمر البناء في `package.json` لمعرفة الملفات المطلوبة أولًا.

## حالة النشر والحدود

يحتوي المشروع على `server.ts`. استضافة GitHub Pages تنشر واجهة ثابتة ولا تشغّل هذا الخادم. لتشغيل ميزات الخادم يجب استخدام استضافة تدعم Node.js وضبط إعدادات البيئة هناك؛ وجود صفحة منشورة لا يثبت أن وظائف الذكاء الاصطناعي تعمل.

حالة المراجعة بتاريخ 23 نوفمبر 2026: جرى توثيق هيكل المشروع وأوامره. لم يُجرَ في هذه المراجعة اختبار شامل لكل وظيفة أو رابط خارجي. المعلومات القانونية والخدمية، إن وجدت، إرشادية وتحتاج مراجعة مصادرها الرسمية وتاريخ تحديثها.

**RAED SHIHAB** · Stockholm, Sweden · [عرب السويد على YouTube](https://www.youtube.com/@Arabsweden)
