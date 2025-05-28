#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
API Client - خدمة الاتصال بالخادم

هذا الملف يحتوي على دوال للاتصال بخادم API المركزي.
"""

import requests
import json
import logging
from utils.config import API_BASE_URL, API_TOKEN

logger = logging.getLogger(__name__)


def get_sms_data(device_id=None):
    """الحصول على رسائل SMS من الخادم
    
    Args:
        device_id: معرف الجهاز (اختياري)
        
    Returns:
        قائمة برسائل SMS
    """
    endpoint = f"{API_BASE_URL}/api/sms"
    
    # إضافة معرف الجهاز إذا تم تحديده
    if device_id:
        endpoint += f"/{device_id}"
    else:
        endpoint += "/all"
    
    headers = {
        "Authorization": f"Bearer {API_TOKEN}",
        "Content-Type": "application/json"
    }
    
    try:
        response = requests.get(endpoint, headers=headers)
        response.raise_for_status()  # رفع استثناء في حالة الخطأ
        
        return response.json()
    
    except requests.exceptions.RequestException as e:
        logger.error(f"خطأ في الاتصال بالخادم: {str(e)}")
        raise Exception(f"فشل الاتصال بالخادم: {str(e)}")


def send_command(device_id, command):
    """إرسال أمر إلى جهاز
    
    Args:
        device_id: معرف الجهاز
        command: الأمر المراد إرساله
        
    Returns:
        نتيجة تنفيذ الأمر
    """
    endpoint = f"{API_BASE_URL}/api/command"
    
    headers = {
        "Authorization": f"Bearer {API_TOKEN}",
        "Content-Type": "application/json"
    }
    
    payload = {
        "device_id": device_id,
        "command": command
    }
    
    try:
        response = requests.post(
            endpoint,
            headers=headers,
            data=json.dumps(payload)
        )
        response.raise_for_status()  # رفع استثناء في حالة الخطأ
        
        return response.json()
    
    except requests.exceptions.RequestException as e:
        logger.error(f"خطأ في إرسال الأمر: {str(e)}")
        raise Exception(f"فشل إرسال الأمر: {str(e)}")


def check_bot_auth(token):
    """التحقق من صلاحية توكن البوت
    
    Args:
        token: توكن البوت
        
    Returns:
        True إذا كان التوكن صالحًا، False خلاف ذلك
    """
    endpoint = f"{API_BASE_URL}/api/auth/check"
    
    headers = {
        "Authorization": f"Bearer {API_TOKEN}",
        "Content-Type": "application/json"
    }
    
    payload = {
        "token": token
    }
    
    try:
        response = requests.post(
            endpoint,
            headers=headers,
            data=json.dumps(payload)
        )
        
        if response.status_code == 200:
            return True
        else:
            return False
    
    except requests.exceptions.RequestException:
        return False