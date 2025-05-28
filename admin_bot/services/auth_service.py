#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
Auth Service - خدمة المصادقة

هذا الملف يحتوي على دوال للتحقق من صلاحيات المستخدمين.
"""

import logging
from utils.config import OWNER_ID, ADMIN_IDS

logger = logging.getLogger(__name__)


def is_authorized(user_id):
    """التحقق مما إذا كان المستخدم مصرح له باستخدام البوت
    
    Args:
        user_id: معرف المستخدم في تيليجرام
        
    Returns:
        True إذا كان المستخدم مصرح له، False خلاف ذلك
    """
    # المستخدم مصرح له إذا كان مالكًا أو أدمن
    return user_id == OWNER_ID or user_id in ADMIN_IDS


def is_owner(user_id):
    """التحقق مما إذا كان المستخدم هو مالك البوت
    
    Args:
        user_id: معرف المستخدم في تيليجرام
        
    Returns:
        True إذا كان المستخدم هو المالك، False خلاف ذلك
    """
    return user_id == OWNER_ID


def is_admin(user_id):
    """التحقق مما إذا كان المستخدم أدمن للبوت
    
    Args:
        user_id: معرف المستخدم في تيليجرام
        
    Returns:
        True إذا كان المستخدم أدمن، False خلاف ذلك
    """
    return user_id in ADMIN_IDS