const crypto = require('crypto');

// الحصول على مفتاح التشفير من المتغيرات البيئية
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'default_encryption_key_change_me';
const IV_LENGTH = 16; // طول متجه التهيئة للتشفير AES

// وظيفة تشفير البيانات
function encryptData(data) {
  if (!data) return null;
  
  try {
    // تحويل البيانات إلى سلسلة نصية إذا لم تكن كذلك
    const text = typeof data === 'object' ? JSON.stringify(data) : String(data);
    
    // إنشاء متجه تهيئة عشوائي
    const iv = crypto.randomBytes(IV_LENGTH);
    
    // إنشاء مشفر
    const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
    
    // تشفير البيانات
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    // إرجاع البيانات المشفرة مع متجه التهيئة
    return iv.toString('hex') + ':' + encrypted;
  } catch (error) {
    console.error('فشل في تشفير البيانات:', error);
    return null;
  }
}

// وظيفة فك تشفير البيانات
function decryptData(encryptedData) {
  if (!encryptedData) return null;
  
  try {
    // فصل متجه التهيئة عن البيانات المشفرة
    const parts = encryptedData.split(':');
    if (parts.length !== 2) return null;
    
    const iv = Buffer.from(parts[0], 'hex');
    const encrypted = parts[1];
    
    // إنشاء مفكك تشفير
    const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
    
    // فك تشفير البيانات
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    // محاولة تحويل البيانات إلى كائن JSON إذا كانت بهذا الشكل
    try {
      return JSON.parse(decrypted);
    } catch {
      return decrypted;
    }
  } catch (error) {
    console.error('فشل في فك تشفير البيانات:', error);
    return null;
  }
}

// وظيفة تجزئة البيانات (للكلمات المرور مثلاً)
function hashData(data) {
  if (!data) return null;
  
  try {
    return crypto.createHash('sha256').update(String(data)).digest('hex');
  } catch (error) {
    console.error('فشل في تجزئة البيانات:', error);
    return null;
  }
}

module.exports = {
  encryptData,
  decryptData,
  hashData
};