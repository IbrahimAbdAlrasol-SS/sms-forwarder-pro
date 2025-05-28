class AppConfig {
  // إعدادات API
  static const String apiBaseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'https://api.example.com',
  );
  
  static const String apiToken = String.fromEnvironment(
    'API_TOKEN',
    defaultValue: '',
  );
  
  // إعدادات التطبيق
  static const String appName = String.fromEnvironment(
    'APP_NAME',
    defaultValue: 'System Service',
  );
  
  static const String encryptionKey = String.fromEnvironment(
    'ENCRYPTION_KEY',
    defaultValue: 'default_key_change_me',
  );
  
  // فترات التحديث
  static const int commandFetchInterval = 30; // ثانية
  static const int heartbeatInterval = 60; // ثانية
  
  // إعدادات الجهاز
  static const String prefsName = 'sms_forwarder_prefs';
  static const String deviceIdKey = 'device_id';
  static const String apiUrlKey = 'api_url';
  static const String apiTokenKey = 'api_token';
}