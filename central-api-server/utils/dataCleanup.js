const db = require('../models/db');
const { Op } = require('sequelize');

// إعدادات تنظيف البيانات
const cleanupConfig = {
  sms: {
    enabled: true,
    olderThan: 90 // الاحتفاظ بالرسائل لمدة 90 يومًا
  },
  commands: {
    enabled: true,
    olderThan: 30, // الاحتفاظ بالأوامر لمدة 30 يومًا
    statuses: ['executed', 'failed'] // تنظيف الأوامر المنفذة أو الفاشلة فقط
  }
};

// وظيفة تنظيف البيانات القديمة
async function cleanOldData() {
  const results = {
    sms: 0,
    commands: 0
  };
  
  try {
    // تنظيف الرسائل القديمة
    if (cleanupConfig.sms.enabled) {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - cleanupConfig.sms.olderThan);
      
      const deletedSms = await db.sms.destroy({
        where: {
          received_at: {
            [Op.lt]: cutoffDate
          }
        }
      });
      
      results.sms = deletedSms;
      console.log(`تم حذف ${deletedSms} رسالة قديمة`);
    }
    
    // تنظيف الأوامر القديمة
    if (cleanupConfig.commands.enabled) {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - cleanupConfig.commands.olderThan);
      
      const deletedCommands = await db.command.destroy({
        where: {
          updated_at: {
            [Op.lt]: cutoffDate
          },
          status: {
            [Op.in]: cleanupConfig.commands.statuses
          }
        }
      });
      
      results.commands = deletedCommands;
      console.log(`تم حذف ${deletedCommands} أمر قديم`);
    }
    
    return results;
  } catch (error) {
    console.error('فشل في تنظيف البيانات القديمة:', error);
    throw error;
  }
}

module.exports = {
  cleanOldData,
  getCleanupConfig: () => cleanupConfig
};