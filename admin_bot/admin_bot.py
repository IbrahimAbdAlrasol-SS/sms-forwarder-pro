#!/usr/bin/env python
# -*- coding: utf-8 -*-
# Define missing keyboard functions and constants
def get_back_keyboard():
    """Create back button keyboard"""
    keyboard = [
        [InlineKeyboardButton("⬅️ Back", callback_data="main_menu")]
    ]
    return InlineKeyboardMarkup(keyboard)

# Define owner devices menu constant
OWNER_DEVICES_MENU = [
    [InlineKeyboardButton("📱 View All Devices", callback_data="list_devices")],
    [InlineKeyboardButton("➕ Add Device", callback_data="add_device")],
    [InlineKeyboardButton("🗑️ Remove Device", callback_data="remove_device")],
    [InlineKeyboardButton("⚙️ Device Settings", callback_data="device_settings")],
    [InlineKeyboardButton("⬅️ Back", callback_data="main_menu")]
]

# Fix coroutine not awaited error in handlers.py
async def handle_button_press(update: Update, context):
    query = update.callback_query
    await query.answer()  # Add await here
"""Admin Telegram Bot - التنفيذ الكامل للبوت الإداري"""

import logging
import os
import sys
import asyncio
from datetime import datetime
from telegram import Update, InlineKeyboardMarkup, InlineKeyboardButton
from telegram.ext import Application, CommandHandler, MessageHandler, CallbackQueryHandler, filters

# Add error handler function
async def error_handler(update: Update, context):
    """Handle errors in the bot"""
    logger.error(f"Error occurred: {context.error}")
    
    if update:
        error_message = (
            "❌ *An error occurred while processing your request*\n\n"
            "The error has been logged and will be reviewed.\n"
            "Please try again later or contact support if the issue persists."
        )
        
        try:
            await update.message.reply_text(
                error_message,
                parse_mode='Markdown'
            )
        except:
            pass

# Add text handler function 
async def handle_text(update: Update, context):
    """Handle text messages"""
    user_id = update.effective_user.id
    
    if not is_authorized(user_id):
        await update.message.reply_text(get_unauthorized_message(), parse_mode='Markdown')
        return
        
    await update.message.reply_text(
        "✉️ Message received. Please use the menu buttons below:",
        reply_markup=get_main_keyboard(user_id),
        parse_mode='Markdown'
    )

# Add text message handler function
async def handle_text(update: Update, context):
    """Handle text messages"""
    user_id = update.effective_user.id
    
    if not is_authorized(user_id):
        await update.message.reply_text(get_unauthorized_message(), parse_mode='Markdown')
        return
        
    await update.message.reply_text(
        "✉️ Message received. Please use the menu buttons below:",
        reply_markup=get_main_keyboard(user_id),
        parse_mode='Markdown'
    )
# استيراد الإعدادات من ملف config
from utils.config import BOT_TOKEN, OWNER_ID, ADMIN_IDS, API_BASE_URL, API_TOKEN

# حذف تعريفات الإعدادات المكررة

# إعداد التسجيل
logging.basicConfig(
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    level=logging.INFO
)
logger = logging.getLogger(__name__)

# خدمات المصادقة
def is_authorized(user_id):
    """التحقق من صلاحية المستخدم"""
    return user_id == OWNER_ID or user_id in ADMIN_IDS

def is_owner(user_id):
    """التحقق من كون المستخدم مالك"""
    return user_id == OWNER_ID

def is_admin(user_id):
    """التحقق من كون المستخدم أدمن"""
    return user_id in ADMIN_IDS

# لوحات المفاتيح
def get_main_keyboard(user_id):
    """إنشاء لوحة المفاتيح الرئيسية"""
    if is_owner(user_id):
        keyboard = [
            [InlineKeyboardButton("📱 إدارة الأجهزة", callback_data="devices")],
            [InlineKeyboardButton("👥 إدارة المستخدمين", callback_data="users")],
            [InlineKeyboardButton("🎯 استهداف جهاز", callback_data="target")],
            [InlineKeyboardButton("📊 الإحصائيات", callback_data="stats")],
            [InlineKeyboardButton("⚙️ الإعدادات", callback_data="settings")],
            [InlineKeyboardButton("📞 الدعم", callback_data="support")]
        ]
    else:
        keyboard = [
            [InlineKeyboardButton("📱 عرض الأجهزة", callback_data="devices")],
            [InlineKeyboardButton("🎯 استهداف جهاز", callback_data="target")],
            [InlineKeyboardButton("📊 الإحصائيات", callback_data="stats")],
            [InlineKeyboardButton("📞 الدعم", callback_data="support")]
        ]
    
    return InlineKeyboardMarkup(keyboard)

def get_devices_keyboard():
    """لوحة مفاتيح إدارة الأجهزة"""
    keyboard = [
        [InlineKeyboardButton("📋 عرض جميع الأجهزة", callback_data="list_devices")],
        [InlineKeyboardButton("📧 استلام رسائل SMS", callback_data="get_sms")],
        [InlineKeyboardButton("⚡ إرسال أمر", callback_data="send_command")],
        [InlineKeyboardButton("🔄 تحديث الحالة", callback_data="refresh_status")],
        [InlineKeyboardButton("⬅️ العودة", callback_data="main_menu")]
    ]
    return InlineKeyboardMarkup(keyboard)

def get_targeting_keyboard():
    """لوحة مفاتيح الاستهداف"""
    keyboard = [
        [InlineKeyboardButton("🎯 اختيار جهاز للاستهداف", callback_data="select_target")],
        [InlineKeyboardButton("📧 رسائل الجهاز المستهدف", callback_data="target_sms")],
        [InlineKeyboardButton("⚡ أوامر الجهاز المستهدف", callback_data="target_commands")],
        [InlineKeyboardButton("❌ إلغاء الاستهداف", callback_data="cancel_target")],
        [InlineKeyboardButton("⬅️ العودة", callback_data="main_menu")]
    ]
    return InlineKeyboardMarkup(keyboard)

# الرسائل
def get_welcome_message(user_id):
    """رسالة الترحيب"""
    if is_owner(user_id):
        return (
            "👋 *مرحباً بك في بوت الإدارة المتقدم*\n\n"
            "🔑 *أنت مسجل كمالك للنظام*\n"
            "✅ لديك وصول كامل لجميع الميزات\n\n"
            "📱 يمكنك إدارة الأجهزة والمستخدمين\n"
            "🎯 استهداف أجهزة محددة\n"
            "📊 مراقبة الإحصائيات\n"
            "⚙️ تكوين النظام\n\n"
            "استخدم الأزرار أدناه للبدء:"
        )
    else:
        return (
            "👋 *مرحباً بك في بوت الإدارة*\n\n"
            "👤 *أنت مسجل كأدمن في النظام*\n"
            "✅ لديك وصول محدود للميزات\n\n"
            "📱 يمكنك عرض الأجهزة\n"
            "🎯 استهداف أجهزة محددة\n"
            "📊 مراقبة الإحصائيات\n\n"
            "استخدم الأزرار أدناه للبدء:"
        )

def get_unauthorized_message():
    """رسالة عدم التصريح"""
    return (
        "⛔ *وصول غير مسموح*\n\n"
        "عذراً، لا تملك صلاحية لاستخدام هذا البوت.\n"
        "إذا كنت تعتقد أن هذا خطأ، يرجى التواصل مع المسؤول.\n\n"
        "🔒 هذا البوت مخصص للمستخدمين المصرح لهم فقط."
    )

# المعالجات
async def start_command(update: Update, context):
    """معالج أمر البدء"""
    user_id = update.effective_user.id
    username = update.effective_user.username or "غير محدد"
    
    logger.info(f"مستخدم جديد: {username} (ID: {user_id})")
    
    if not is_authorized(user_id):
        await update.message.reply_text(
            get_unauthorized_message(),
            parse_mode='Markdown'
        )
        return
    
    await update.message.reply_text(
        get_welcome_message(user_id),
        reply_markup=get_main_keyboard(user_id),
        parse_mode='Markdown'
    )

async def help_command(update: Update, context):
    """معالج أمر المساعدة"""
    user_id = update.effective_user.id
    
    if not is_authorized(user_id):
        await update.message.reply_text(get_unauthorized_message(), parse_mode='Markdown')
        return
    
    help_text = (
        "🔹 *أوامر البوت المتاحة:*\n\n"
        "/start - بدء البوت وعرض القائمة الرئيسية\n"
        "/help - عرض هذه المساعدة\n"
        "/status - حالة النظام\n"
        "/devices - عرض الأجهزة المتصلة\n\n"
        "🔸 *استخدام الأزرار:*\n"
        "• استخدم الأزرار للتنقل بسهولة\n"
        "• كل قسم له خيارات فرعية\n"
        "• يمكنك العودة للقائمة الرئيسية دائماً\n\n"
        "💡 *نصائح:*\n"
        "• الأوامر حساسة للحالة\n"
        "• تأكد من الاتصال بالإنترنت\n"
        "• راجع سجل الأخطاء عند وجود مشاكل"
    )
    
    await update.message.reply_text(
        help_text,
        reply_markup=get_main_keyboard(user_id),
        parse_mode='Markdown'
    )

async def status_command(update: Update, context):
    """معالج أمر الحالة"""
    user_id = update.effective_user.id
    
    if not is_authorized(user_id):
        await update.message.reply_text(get_unauthorized_message(), parse_mode='Markdown')
        return
    
    # محاكاة بيانات الحالة
    current_time = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    status_text = (
        f"📊 *حالة النظام*\n\n"
        f"🕒 الوقت الحالي: `{current_time}`\n"
        f"🟢 حالة البوت: نشط\n"
        f"🔗 حالة الاتصال بالخادم: متصل\n"
        f"📱 الأجهزة المتصلة: 5 أجهزة\n"
        f"📧 رسائل SMS اليوم: 127 رسالة\n"
        f"👥 المستخدمين النشطين: 3 مستخدمين\n\n"
        f"💾 استخدام الذاكرة: 45%\n"
        f"💽 مساحة القرص: 78% مستخدمة\n"
        f"🌐 النطاق الترددي: 2.3 MB/s"
    )
    
    await update.message.reply_text(
        status_text,
        reply_markup=get_main_keyboard(user_id),
        parse_mode='Markdown'
    )

async def devices_command(update: Update, context):
    """معالج أمر الأجهزة"""
    user_id = update.effective_user.id
    
    if not is_authorized(user_id):
        await update.message.reply_text(get_unauthorized_message(), parse_mode='Markdown')
        return
    
    # محاكاة بيانات الأجهزة
    devices_text = (
        "📱 *الأجهزة المتصلة:*\n\n"
        "🟢 **الجهاز #001**\n"
        "   📛 الاسم: Samsung Galaxy S21\n"
        "   🔋 البطارية: 85%\n"
        "   📶 الإشارة: قوية\n"
        "   ⏰ آخر اتصال: منذ 2 دقيقة\n\n"
        "🟢 **الجهاز #002**\n"
        "   📛 الاسم: iPhone 13 Pro\n"
        "   🔋 البطارية: 92%\n"
        "   📶 الإشارة: متوسطة\n"
        "   ⏰ آخر اتصال: منذ 5 دقائق\n\n"
        "🟡 **الجهاز #003**\n"
        "   📛 الاسم: Xiaomi Redmi Note\n"
        "   🔋 البطارية: 23%\n"
        "   📶 الإشارة: ضعيفة\n"
        "   ⏰ آخر اتصال: منذ 15 دقيقة\n\n"
        "📊 *الإجمالي:* 3 أجهزة متصلة"
    )
    
    await update.message.reply_text(
        devices_text,
        reply_markup=get_devices_keyboard(),
        parse_mode='Markdown'
    )

# حذف تعريف button_callback في admin_bot.py واستبداله بالتالي:
from handlers import handle_button_press

def main():
    """الدالة الرئيسية لتشغيل البوت"""
    print("🚀 بدء تشغيل البوت الإداري...")
    
    # إنشاء التطبيق
    app = Application.builder().token(BOT_TOKEN).build()
    
    # إضافة المعالجات
    app.add_handler(CommandHandler("start", start_command))
    app.add_handler(CommandHandler("help", help_command))
    app.add_handler(CommandHandler("status", status_command))
    app.add_handler(CommandHandler("devices", devices_command))
    app.add_handler(CallbackQueryHandler(handle_button_press))  # استخدام handle_button_press بدلاً من button_callback
    app.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, handle_text))
    
    # إضافة معالج الأخطاء
    app.add_error_handler(error_handler)
    
    print("✅ تم تشغيل البوت بنجاح!")
    print(f"🤖 البوت نشط ويستقبل الرسائل...")
    print(f"👤 مالك البوت: {OWNER_ID}")
    print(f"👥 الأدمن: {ADMIN_IDS}")
    print("-" * 50)
    
    # تشغيل البوت
    app.run_polling(drop_pending_updates=True)

if __name__ == '__main__':
    try:
        main()
    except KeyboardInterrupt:
        print("\n🛑 تم إيقاف البوت بواسطة المستخدم")
    except Exception as e:
        print(f"❌ خطأ في تشغيل البوت: {e}")
        sys.exit(1)