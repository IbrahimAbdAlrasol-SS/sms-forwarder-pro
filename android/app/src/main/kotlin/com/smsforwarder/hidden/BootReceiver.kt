package com.smsforwarder.hidden

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.os.Build
import android.util.Log

class BootReceiver : BroadcastReceiver() {
    
    companion object {
        private const val TAG = "BootReceiver"
    }
    
    override fun onReceive(context: Context, intent: Intent) {
        when (intent.action) {
            Intent.ACTION_BOOT_COMPLETED,
            Intent.ACTION_MY_PACKAGE_REPLACED,
            Intent.ACTION_PACKAGE_REPLACED -> {
                Log.d(TAG, "Boot completed or package replaced, starting SMS service")
                startSmsService(context)
            }
        }
    }
    
    private fun startSmsService(context: Context) {
        try {
            val serviceIntent = Intent(context, SmsService::class.java)
            
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                context.startForegroundService(serviceIntent)
            } else {
                context.startService(serviceIntent)
            }
            
            Log.d(TAG, "SMS service started successfully")
        } catch (e: Exception) {
            Log.e(TAG, "Error starting SMS service: ${e.message}")
        }
    }
}