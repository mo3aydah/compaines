/**
 * Company cards config: image path and display names for landing showcase.
 * Used by index (landing) and card-flow (canvas image, optional overrides).
 */
window.COMPANIES_CONFIG = [
  { id: 'naqash', image: 'assets/images/eid-naqsh.jpeg', nameEn: 'Naqash', nameAr: 'نقش' }
];

/**
 * Pre-defined messages per language (2 per language for Step 1).
 */
window.MESSAGES = {
  en: [
    'Wishing you a joyful Eid. May this blessed occasion bring you good health and happiness.',
    'Wishing you a joyful Eid filled with health and wonderful moments with your loved ones.'
  ],
  ar: [
    'كل عام وأنتم بخير، أعاده الله عليكم باليُمن والبركات',
    'جعله الله عيدًا يحمل لكم السكينة والازدهار'
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
