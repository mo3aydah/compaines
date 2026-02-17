/**
 * Company cards config: image path and display names for landing showcase.
 * Used by index (landing) and card-flow (canvas image, optional overrides).
 */
window.COMPANIES_CONFIG = [
  { id: '6degrees', image: 'assets/images/6d.png',       nameEn: '6 Degrees',   nameAr: '٦ درجات' },
  { id: 'burooj', image: 'assets/images/burooj.png',    nameEn: 'Burooj',      nameAr: 'بروج' },
  { id: 'buroojair', image: 'assets/images/Buroojair.png', nameEn: 'Burooj Air', nameAr: 'بروج إير' },
  { id: 'deets',  image: 'assets/images/deets.png',     nameEn: 'Deets',       nameAr: 'ديتس' },
  { id: 'ec',     image: 'assets/images/ec.png',       nameEn: 'EC',          nameAr: 'EC' },
  { id: 'naqash', image: 'assets/images/naqash.png',   nameEn: 'Naqash',     nameAr: 'نقش' }
];

/**
 * Pre-defined messages per language (2 per language for Step 1).
 */
window.MESSAGES = {
  en: [
    'Wishing you a Ramadan filled with mercy, peace, and blessings.',
    'May your efforts be rewarded, and may your heart find serenity this Ramadan.'
  ],
  ar: [
    'نتمنى لكم شهر رمضان مليئاً بالرحمة والسلام والبركات.',
    'نسأل اللّٰه أن يثيبكم على جهودكم، وأن يرزق قلوبكم الطمأنينة في هذا الشهر الكريم.'
  ]
};

/**
 * UI strings for the 3-step flow (card.html). Keyed by language.
 */
window.UI_STRINGS = {
  en: {
    step1Title: 'Choose your message',
    step2Title: 'Enter your name',
    step3Title: 'Preview & Download',
    step1Tab: 'Message',
    step2Tab: 'Name',
    step3Tab: 'Preview',
    next: 'Next',
    back: 'Back',
    download: 'Download card',
    downloading: 'Downloading…',
    imageError: 'Image could not be loaded.',
    imageErrorAction: 'Back to cards',
    namePlaceholder: 'Enter your name for a personalized card',
    nameReminder: 'Add your name in Step 2 for a personalized card.',
    nameReminderAction: 'Edit name',
    downloadSuccess: 'Download started!',
    step: 'Step'
  },
  ar: {
    step1Title: 'اختر رسالتك',
    step2Title: 'أدخل اسمك',
    step3Title: 'معاينة وتحميل',
    step1Tab: 'الرسالة',
    step2Tab: 'الاسم',
    step3Tab: 'المعاينة',
    next: 'التالي',
    back: 'السابق',
    download: 'تحميل البطاقة',
    downloading: 'جاري التحميل…',
    imageError: 'تعذر تحميل الصورة.',
    imageErrorAction: 'العودة إلى البطاقات',
    namePlaceholder: 'أدخل اسمك لإضافة تهنئة مخصصة',
    nameReminder: 'أضف اسمك في الخطوة 2 لبطاقة مخصصة.',
    nameReminderAction: 'تعديل الاسم',
    downloadSuccess: 'بدأ التحميل!',
    step: 'الخطوة'
  }
};
