const cron = require('node-cron');
const { createBackup } = require('./backup');
const { cleanOldData } = require('./dataCleanup');

// جدولة النسخ الاحتياطي اليومي (الساعة 3 صباحًا)
const scheduleBackups = () => {
  cron.schedule('0 3 * * *', async () => {
    console.log('بدء النسخ الاحتياطي المجدول...');
    try {
      await createBackup();
      console.log('تم الانتهاء من النسخ الاحتياطي المجدول بنجاح');
    } catch (error) {
      console.error('فشل النسخ الاحتياطي المجدول:', error);
    }
  });
  console.log('تم جدولة النسخ الاحتياطي اليومي');
};

// جدولة تنظيف البيانات القديمة (الساعة 4 صباحًا)
const scheduleDataCleanup = () => {
  cron.schedule('0 4 * * *', async () => {
    console.log('بدء تنظيف البيانات القديمة المجدول...');
    try {
      await cleanOldData();
      console.log('تم الانتهاء من تنظيف البيانات القديمة بنجاح');
    } catch (error) {
      console.error('فشل تنظيف البيانات القديمة:', error);
    }
  });
  console.log('تم جدولة تنظيف البيانات القديمة');
};

module.exports = {
  scheduleBackups,
  scheduleDataCleanup
};