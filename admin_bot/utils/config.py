#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
Config - ملف الإعدادات

هذا الملف يحتوي على متغيرات الإعدادات المستخدمة في النظام.
"""

# إعدادات البوت
BOT_TOKEN = "YOUR_TELEGRAM_BOT_TOKEN"  # مو  هنا
LOG_LEVEL = "INFO"  # مستوى التسجيل (DEBUG, INFO, WARNING, ERROR, CRITICAL)

# إعدادات المستخدمين
OWNER_ID = 123456789  # معرف مالك البوت في تيليجرام
ADMIN_IDS = [987654321, 123123123]  # قائمة بمعرفات المشرفين

# إعدادات API
API_BASE_URL = "https://api.example.com"  # عنوان خادم API المركزي
API_TOKEN = "YOUR_API_TOKEN"  # توكن الوصول إلى API

# إعدادات توليد APK
APK_TEMPLATE_PATH = "templates/android_app_template"  # مسار قالب تطبيق Android
APK_OUTPUT_PATH = "output/apk"  # مسار حفظ ملفات APK المولدة
KEYSTORE_PATH = "config/keystore.jks"  # مسار ملف المفتاح لتوقيع التطبيق
KEYSTORE_ALIAS = "sms_forwarder"  # اسم المفتاح
KEYSTORE_PASSWORD = "YOUR_KEYSTORE_PASSWORD"  # كلمة مرور المفتاح