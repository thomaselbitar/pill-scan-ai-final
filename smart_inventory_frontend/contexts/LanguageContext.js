import React, { createContext, useState, useEffect, useContext } from 'react';
import { I18nManager } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const LanguageContext = createContext();

const LANGUAGE_STORAGE_KEY = '@app_language';

// Translation resources
const resources = {
  en: {
    translation: {
      welcomeBack: 'Welcome Back',
      signInToContinue: 'Sign in to continue',
      username: 'Username',
      password: 'Password',
      login: 'Login',
      logout: 'Logout',
      forgotPassword: 'Forgot Password?',
      error: 'Error',
      pleaseFillAllFields: 'Please fill in all fields',
      darkMode: 'Dark Mode',
      lightMode: 'Light Mode',
      language: 'Language',
      english: 'English',
      arabic: 'Arabic',
      settings: 'Settings',
      // Add screen
      add_item: 'Add New Item',
      add_item_hint: 'Upload or capture a pill photo to detect and save.',
      scanning_title: 'Detecting pill',
      scanning_subtitle: 'Hold on while we analyze your photo.',
      scanning_status: 'Detecting your pill...',
      cancel_scan_title: 'Cancel detection?',
      cancel_scan_message: 'Do you want to stop scanning this image?',
      cancel: 'Cancel',
      no: 'No',
      keep_scanning: 'Keep scanning',
      pick_from_gallery: 'Pick From Gallery',
      take_photo: 'Take Photo',
      detect_and_add: 'Detect & Add',
      permission_required: 'Permission required!',
      camera_permission_required: 'Camera permission required!',
      cancel_review_title: 'Cancel?',
      cancel_review_message: 'Do you want to cancel and reset the picked image?',
      yes_cancel: 'Yes, Cancel',
      // Review/Result screen
      review_item: 'Review detected item',
      review_item_hint: 'We detected this information. You can edit it before saving.',
      product_name: 'Product name',
      product_name_placeholder: 'Enter product name',
      product_name_required: 'Product name is required',
      weight_num: 'Weight / strength',
      weight_num_placeholder: 'e.g. 500',
      weight_num_required: 'Weight / strength is required',
      weight_unit: 'Unit',
      weight_unit_required: 'Unit is required',
      form: 'Form',
      form_required: 'Form is required',
      use_type: 'Use type',
      use_type_required: 'Use type is required',
      continue: 'Continue',
      proceed_predict_price: 'Proceed to Predict Price',
      predict_price: 'Predict Price',
      // AI extraction
      try_with_ai: 'Try with AI',
      try_again_with_ai: 'Try Again with AI',
      analyzing_with_ai: 'Analyzing with AI...',
      ai_analysis_failed_kept:
        'AI analysis failed. Your current detected information was kept. Please try again.',
      ai_analysis_success_title: 'AI Analysis Successful',
      ai_analysis_success_message:
        'The product information was successfully updated using AI.',
      // Navigation
      app_title: 'PillScan Ai',
      tab_data: 'Inventory',
      tab_history: 'History',
      // Auth
      logging_in: 'Logging in...',
      invalid_credentials: 'Invalid username or password',
      login_error: 'An error occurred during login',
      // General errors
      generic_error: 'An error occurred',
      network_error_connection:
        'Cannot connect to the server. Make sure the backend is running and accessible.',
      network_error_unreachable:
        'Network error. Cannot reach the server. Check your connection and firewall settings.',
      failed_to_load_products: 'Failed to load products',
      failed_to_load_activity_logs: 'Failed to load activity logs',
      failed_to_classify_image: 'Failed to classify image. Please try again.',
      failed_to_predict_price: 'Failed to predict price. Please try again.',
      failed_to_add_product: 'Failed to add product. Please try again.',
      failed_to_add_quantity: 'Failed to add quantity. Please try again.',
      failed_to_update_product: 'Failed to update product. Please try again.',
      // General success / hints
      price_predicted_hint: 'The price has been successfully predicted',
      product_added: 'Product added successfully',
      product_updated: 'Product updated successfully',
      cancel_message: 'Are you sure you want to cancel?',
      quantity_added_with_count: 'Added {{count}} items to the existing product successfully',
      quantity_removed_with_remaining:
        'Successfully removed {{count}} units. New quantity: {{remaining}}',
      quantity_input_required: 'Please enter a valid quantity',
      login_required_activity_logs: 'Please log in to view activity logs',
      copyright: '© PillScan Ai',
      predicting_price: 'Predicting price...',
      predicting_price_hint: 'Please wait while we analyze the product data',
      checking_product: 'Checking product...',
      checking_market: 'Checking market...',
      comparing_product: 'Comparing product...',
      calculating_price: 'Calculating price...',
      price_prediction: 'Price Prediction',
      price_predicted: 'Price predicted',
      cancel_price_prediction: 'Cancel Price Prediction?',
      cancel_price_prediction_message: 'Are you sure you want to cancel? Your progress will be lost.',
      price: 'Price',
      quantity: 'Quantity',
      add_to_store: 'Add to Store',
      price_required: 'Price is required and must be greater than 0',
      quantity_required: 'Quantity is required and must be greater than 0',
      logout_confirmation: 'Are you sure you want to logout?',
      // Confidence levels
      high_confidence: 'High Confidence',
      medium_confidence: 'Medium Confidence',
      low_confidence: 'Low Confidence',
      // Existing product screen
      product_already_exists: 'Product Already Exists',
      product_already_exists_message: 'This product is already in your inventory. You can add more quantity.',
      weight: 'Weight',
      add_quantity: 'Add Quantity',
      quantity_added_successfully: 'Quantity added successfully',
      adding: 'Adding...',
      success: 'Success',
      login_required: 'Please login to add products',
      checking: 'Checking...',
      ok: 'OK',
      // Product details
      product_details: 'Product Details',
      product_not_found: 'Product not found',
      image_not_available: 'Image not available',
      created_at: 'Created At',
      loading_products: 'Loading products...',
      retry: 'Tap to retry',
      no_products: 'No products yet',
      add_first_product: 'Add your first product to get started',
      sold_out: 'Sold Out',
      // Search
      search_products: 'Search products...',
      no_results: 'No products found',
      try_different_search: 'Try a different search term',
      try_different_filters: 'Try different filters or search terms',
      // Filters
      filter_by_form: 'Filter by Form',
      filter_by_use_type: 'Filter by Use Type',
      clear_filters: 'Clear',
      all: 'All',
      // Edit product
      edit_product: 'Edit Product',
      save_changes: 'Save Changes',
      product_updated_successfully: 'Product updated successfully',
      image_not_editable: 'Image is not editable',
      cancel_edit: 'Cancel Edit?',
      cancel_edit_message: 'Are you sure you want to cancel? Your changes will be lost.',
      // Remove quantity
      remove_quantity: 'Remove Quantity',
      remove_quantity_description: 'Enter the quantity you want to remove from this product.',
      current_quantity: 'Current Quantity',
      quantity_to_remove: 'Quantity to Remove',
      quantity_exceeds_stock: 'Quantity cannot exceed current stock',
      quantity_removed_successfully: 'Quantity removed successfully',
      failed_to_remove_quantity: 'Failed to remove quantity. Please try again.',
      remove: 'Remove',
      // Delete product
      delete_product: 'Delete Product',
      delete_product_confirmation: 'Are you sure you want to delete this product? This action cannot be undone.',
      product_deleted_successfully: 'Product deleted successfully',
      failed_to_delete_product: 'Failed to delete product. Please try again.',
      delete: 'Delete',
      // Activity Logs
      loading_activity_logs: 'Loading activity logs...',
      no_activity_logs: 'No activity logs yet',
      activity_logs_will_appear: 'Activity logs will appear here when you add or remove product quantities',
      remaining: 'Remaining',
      deleted_product: 'Deleted Product',
    },
  },
  ar: {
    translation: {
      welcomeBack: 'مرحباً بعودتك',
      signInToContinue: 'قم بتسجيل الدخول للمتابعة',
      username: 'اسم المستخدم',
      password: 'كلمة المرور',
      login: 'تسجيل الدخول',
      logout: 'تسجيل الخروج',
      forgotPassword: 'نسيت كلمة المرور؟',
      error: 'خطأ',
      pleaseFillAllFields: 'يرجى ملء جميع الحقول',
      darkMode: 'الوضع الداكن',
      lightMode: 'الوضع الفاتح',
      language: 'اللغة',
      english: 'الإنجليزية',
      arabic: 'العربية',
      settings: 'الإعدادات',
      // Add screen
      add_item: 'إضافة دواء جديد',
      add_item_hint: 'قم برفع صورة للدواء أو التقاطها للتعرّف والحفظ.',
      scanning_title: 'جاري التعرّف على الدواء',
      scanning_subtitle: 'انتظر قليلاً حتى ننتهي من تحليل الصورة.',
      scanning_status: 'جاري التعرّف على الدواء...',
      cancel_scan_title: 'إلغاء عملية التعرّف؟',
      cancel_scan_message: 'هل ترغب في إيقاف عملية التعرّف على هذه الصورة؟',
      cancel: 'إلغاء',
      no: 'لا',
      keep_scanning: 'متابعة التعرّف',
      pick_from_gallery: 'اختيار من المعرض',
      take_photo: 'التقاط صورة',
      detect_and_add: 'التعرّف و الإضافة',
      permission_required: 'مطلوب منح الإذن!',
      camera_permission_required: 'مطلوب إذن الكاميرا!',
      cancel_review_title: 'إلغاء؟',
      cancel_review_message: 'هل تريد الإلغاء وإعادة تعيين الصورة المختارة؟',
      yes_cancel: 'نعم، إلغاء',
      // Review/Result screen
      review_item: 'مراجعة الدواء المكتشف',
      review_item_hint: 'لقد اكتشفنا هذه المعلومات. يمكنك تعديلها قبل الحفظ.',
      product_name: 'اسم المنتج',
      product_name_placeholder: 'أدخل اسم المنتج',
      product_name_required: 'اسم المنتج مطلوب',
      weight_num: 'الوزن / القوة',
      weight_num_placeholder: 'مثال: 500',
      weight_num_required: 'الوزن / القوة مطلوب',
      weight_unit: 'الوحدة',
      weight_unit_required: 'الوحدة مطلوبة',
      form: 'الشكل',
      form_required: 'الشكل مطلوب',
      use_type: 'نوع الاستخدام',
      use_type_required: 'نوع الاستخدام مطلوب',
      continue: 'متابعة',
      proceed_predict_price: 'متابعة إلى توقع السعر',
      predict_price: 'توقع السعر',
      // AI extraction
      try_with_ai: 'جرّب بالذكاء الاصطناعي',
      try_again_with_ai: 'أعد المحاولة بالذكاء الاصطناعي',
      analyzing_with_ai: 'جاري التحليل بالذكاء الاصطناعي...',
      ai_analysis_failed_kept:
        'فشل التحليل بالذكاء الاصطناعي. تم الإبقاء على المعلومات الحالية. يُرجى المحاولة مجدداً.',
      ai_analysis_success_title: 'تم تحليل المنتج بنجاح',
      ai_analysis_success_message:
        'تم تحديث معلومات المنتج بنجاح باستخدام الذكاء الاصطناعي.',
      // Navigation
      app_title: 'PillScan Ai',
      tab_data: 'المخزون',
      tab_history: 'السجل',
      // Auth
      logging_in: 'جاري تسجيل الدخول...',
      invalid_credentials: 'اسم المستخدم أو كلمة المرور غير صحيحة',
      login_error: 'حدث خطأ أثناء تسجيل الدخول',
      // General errors
      generic_error: 'حدث خطأ',
      network_error_connection:
        'تعذّر الاتصال بالخادم. تأكّد أن الخادم يعمل ويمكن الوصول إليه.',
      network_error_unreachable:
        'خطأ في الشبكة. تعذّر الوصول إلى الخادم. تحقّق من الاتصال وإعدادات الجدار الناري.',
      failed_to_load_products: 'تعذّر تحميل المنتجات',
      failed_to_load_activity_logs: 'تعذّر تحميل سجل الأنشطة',
      failed_to_classify_image: 'تعذّر التعرّف على الصورة. يُرجى المحاولة مجدداً.',
      failed_to_predict_price: 'تعذّر توقع السعر. يُرجى المحاولة مجدداً.',
      failed_to_add_product: 'تعذّر إضافة المنتج. يُرجى المحاولة مجدداً.',
      failed_to_add_quantity: 'تعذّر إضافة الكمية. يُرجى المحاولة مجدداً.',
      failed_to_update_product: 'تعذّر تحديث المنتج. يُرجى المحاولة مجدداً.',
      // General success / hints
      price_predicted_hint: 'تم توقع السعر بنجاح',
      product_added: 'تمت إضافة المنتج بنجاح',
      product_updated: 'تم تحديث المنتج بنجاح',
      cancel_message: 'هل أنت متأكد أنك تريد الإلغاء؟',
      quantity_added_with_count: 'تمت إضافة {{count}} وحدة إلى المنتج الموجود بنجاح',
      quantity_removed_with_remaining:
        'تمت إزالة {{count}} وحدة بنجاح. الكمية الجديدة: {{remaining}}',
      quantity_input_required: 'الرجاء إدخال كمية صحيحة',
      login_required_activity_logs: 'يُرجى تسجيل الدخول لعرض سجل الأنشطة',
      copyright: '© PillScan Ai',
      predicting_price: 'جاري توقع السعر...',
      predicting_price_hint: 'يرجى الانتظار بينما نقوم بتحليل بيانات المنتج',
      checking_product: 'جاري فحص المنتج...',
      checking_market: 'جاري فحص السوق...',
      comparing_product: 'جاري مقارنة المنتج...',
      calculating_price: 'جاري حساب السعر...',
      price_prediction: 'توقع السعر',
      price_predicted: 'تم توقع السعر',
      cancel_price_prediction: 'إلغاء توقع السعر؟',
      cancel_price_prediction_message: 'هل أنت متأكد أنك تريد الإلغاء؟ سيتم فقدان التقدم المحرز.',
      price: 'السعر',
      quantity: 'الكمية',
      add_to_store: 'إضافة إلى المتجر',
      price_required: 'السعر مطلوب ويجب أن يكون أكبر من 0',
      quantity_required: 'الكمية مطلوبة ويجب أن تكون أكبر من 0',
      logout_confirmation: 'هل أنت متأكد أنك تريد تسجيل الخروج؟',
      // Confidence levels
      high_confidence: 'ثقة عالية',
      medium_confidence: 'ثقة متوسطة',
      low_confidence: 'ثقة منخفضة',
      // Existing product screen
      product_already_exists: 'المنتج موجود بالفعل',
      product_already_exists_message: 'هذا المنتج موجود بالفعل في المخزون الخاص بك. يمكنك إضافة المزيد من الكمية.',
      weight: 'الوزن',
      add_quantity: 'إضافة كمية',
      quantity_added_successfully: 'تم إضافة الكمية بنجاح',
      adding: 'جاري الإضافة...',
      success: 'نجح',
      login_required: 'يرجى تسجيل الدخول لإضافة المنتجات',
      checking: 'جاري الفحص...',
      ok: 'موافق',
      // Product details
      product_details: 'تفاصيل المنتج',
      product_not_found: 'المنتج غير موجود',
      image_not_available: 'الصورة غير متوفرة',
      created_at: 'تاريخ الإنشاء',
      loading_products: 'جاري تحميل المنتجات...',
      retry: 'اضغط للمحاولة مرة أخرى',
      no_products: 'لا توجد منتجات بعد',
      add_first_product: 'أضف منتجك الأول للبدء',
      sold_out: 'نفد المخزون',
      // Search
      search_products: 'البحث عن المنتجات...',
      no_results: 'لم يتم العثور على منتجات',
      try_different_search: 'جرب مصطلح بحث مختلف',
      try_different_filters: 'جرب فلاتر أو مصطلحات بحث مختلفة',
      // Filters
      filter_by_form: 'تصفية حسب الشكل',
      filter_by_use_type: 'تصفية حسب نوع الاستخدام',
      clear_filters: 'مسح',
      all: 'الكل',
      // Edit product
      edit_product: 'تعديل المنتج',
      save_changes: 'حفظ التغييرات',
      product_updated_successfully: 'تم تحديث المنتج بنجاح',
      image_not_editable: 'الصورة غير قابلة للتعديل',
      cancel_edit: 'إلغاء التعديل؟',
      cancel_edit_message: 'هل أنت متأكد أنك تريد الإلغاء؟ سيتم فقدان التغييرات.',
      // Remove quantity
      remove_quantity: 'إزالة الكمية',
      remove_quantity_description: 'أدخل الكمية التي تريد إزالتها من هذا المنتج.',
      current_quantity: 'الكمية الحالية',
      quantity_to_remove: 'الكمية المراد إزالتها',
      quantity_exceeds_stock: 'لا يمكن أن تتجاوز الكمية المخزون الحالي',
      quantity_removed_successfully: 'تم إزالة الكمية بنجاح',
      failed_to_remove_quantity: 'فشل إزالة الكمية. يرجى المحاولة مرة أخرى.',
      remove: 'إزالة',
      // Delete product
      delete_product: 'حذف المنتج',
      delete_product_confirmation: 'هل أنت متأكد أنك تريد حذف هذا المنتج؟ لا يمكن التراجع عن هذا الإجراء.',
      product_deleted_successfully: 'تم حذف المنتج بنجاح',
      failed_to_delete_product: 'فشل حذف المنتج. يرجى المحاولة مرة أخرى.',
      delete: 'حذف',
      // Activity Logs
      loading_activity_logs: 'جاري تحميل سجل الأنشطة...',
      no_activity_logs: 'لا توجد سجلات أنشطة بعد',
      activity_logs_will_appear: 'ستظهر سجلات الأنشطة هنا عند إضافة أو إزالة كميات المنتجات',
      remaining: 'المتبقي',
      deleted_product: 'منتج محذوف',
    },
  },
};

// Initialize i18n
i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'en', // default language
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
  });

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState('en');
  const [isLoading, setIsLoading] = useState(true);

  // Load language from storage on mount
  useEffect(() => {
    loadLanguage();
  }, []);

  // Update i18n when language changes
  useEffect(() => {
    i18n.changeLanguage(language);
  }, [language]);

  const loadLanguage = async () => {
    try {
      const savedLanguage = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
      if (savedLanguage !== null) {
        setLanguage(savedLanguage);
        i18n.changeLanguage(savedLanguage);
        
        // Handle RTL for Arabic
        const isRTL = savedLanguage === 'ar';
        I18nManager.forceRTL(isRTL);
        I18nManager.allowRTL(isRTL);
      }
    } catch (error) {
      console.error('Error loading language:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const changeLanguage = async (lang) => {
    try {
      setLanguage(lang);
      i18n.changeLanguage(lang);
      
      // Handle RTL for Arabic
      const isRTL = lang === 'ar';
      I18nManager.forceRTL(isRTL);
      I18nManager.allowRTL(isRTL);
      
      // Note: On Android, you may need to restart the app for RTL to take full effect
      // On iOS, it should work immediately
      
      await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
    } catch (error) {
      console.error('Error saving language:', error);
    }
  };

  const toggleLanguage = async () => {
    const newLang = language === 'en' ? 'ar' : 'en';
    await changeLanguage(newLang);
  };

  return (
    <LanguageContext.Provider value={{ language, changeLanguage, toggleLanguage, i18n }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

