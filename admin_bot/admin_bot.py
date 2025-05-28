#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
Admin Telegram Bot - نقطة الدخول الرئيسية للبوت

هذا الملف هو نقطة البداية لتشغيل بوت تيليجرام الإداري.
يقوم بتهيئة البوت وتسجيل جميع المعالجات وبدء عملية الاستماع للرسائل.
"""

import logging
import os
from telegram.ext import Updater, CommandHandler, MessageHandler, Filters, CallbackQueryHandler

# استيراد المعالجات من ملف handlers.py
from handlers import (
    handle_start, handle_help, handle_get_sms, handle_send_command,
    handle_button_press, handle_unknown_command, handle_text_message
)

# استيراد الإعدادات
from utils.config import BOT_TOKEN, LOG_LEVEL

# إعداد التسجيل
logging.basicConfig(
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    level=getattr(logging, LOG_LEVEL)
)
logger = logging.getLogger(__name__)


def main():
    """تهيئة البوت وبدء التشغيل"""
    # إنشاء كائن المحدث
    updater = Updater(BOT_TOKEN, use_context=True)
    
    # الحصول على مرسل الأوامر
    dp = updater.dispatcher
    
    # تسجيل معالجات الأوامر
    dp.add_handler(CommandHandler("start", handle_start))
    dp.add_handler(CommandHandler("help", handle_help))
    dp.add_handler(CommandHandler("get_sms", handle_get_sms))
    dp.add_handler(CommandHandler("send_command", handle_send_command))
    
    # معالج أزرار الاستجابة
    dp.add_handler(CallbackQueryHandler(handle_button_press))
    
    # معالج الرسائل النصية
    dp.add_handler(MessageHandler(Filters.text, handle_text_message))
    
    # معالج الأوامر غير المعروفة
    dp.add_handler(MessageHandler(Filters.command, handle_unknown_command))
    
    # بدء البوت
    logger.info("تم بدء تشغيل البوت")
    updater.start_polling()
    
    # تشغيل البوت حتى يتم إيقافه يدويًا
    updater.idle()


if __name__ == '__main__':
    main()