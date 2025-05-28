const os = require('os'); 
const db = require('../models/db'); 
const { Op } = require('sequelize'); 
const axios = require('axios'); 
const moment = require('moment'); 
 
// إعدادات المراقبة 
const monitoringConfig = { 
  systemChecks: { 
    interval: 5 * 60 * 1000, // كل 5 دقائق 
    cpuThreshold: 80, // إنذار عند تجاوز استخدام المعالج 80% 
    memoryThreshold: 80, // إنذار عند تجاوز استخدام الذاكرة 80% 
    diskThreshold: 90 // إنذار عند تجاوز استخدام القرص 90% 
  }, 
  databaseChecks: { 
    interval: 15 * 60 * 1000, // كل 15 دقيقة 
    inactiveDeviceThreshold: 24 // إنذار للأجهزة غير النشطة لأكثر من 24 ساعة 
  }, 
  alertEndpoint: process.env.ALERT_ENDPOINT || 'http://localhost:3001/api/alerts', 
  adminBotEndpoint: process.env.ADMIN_BOT_ENDPOINT || 'http://localhost:5000/api/alerts' 
}; 
 
// وظيفة جمع معلومات النظام 
async function collectSystemInfo() { 
  try { 
    // معلومات المعالج 
    const cpuUsage = await getCpuUsage(); 
    
    // معلومات الذاكرة 
    const totalMemory = os.totalmem(); 
    const freeMemory = os.freemem(); 
    const memoryUsage = ((totalMemory - freeMemory) / totalMemory) * 100; 
    
    // معلومات القرص (تحتاج إلى مكتبة إضافية للحصول على معلومات دقيقة) 
    const diskUsage = 0; // يجب استبدالها بقيمة حقيقية 
    
    // معلومات النظام 
    const systemInfo = { 
      timestamp: new Date(), 
      hostname: os.hostname(), 
      platform: os.platform(), 
      uptime: os.uptime(), 
      cpuUsage: cpuUsage, 
      memoryUsage: memoryUsage, 
      totalMemory: totalMemory, 
      freeMemory: freeMemory, 
      diskUsage: diskUsage 
    }; 
    
    // التحقق من تجاوز العتبات 
    const alerts = []; 
    
    if (cpuUsage > monitoringConfig.systemChecks.cpuThreshold) { 
      alerts.push({ 
        type: 'cpu', 
        message: `استخدام المعالج مرتفع: ${cpuUsage.toFixed(2)}%`, 
        value: cpuUsage 
      }); 
    } 
    
    if (memoryUsage > monitoringConfig.systemChecks.memoryThreshold) { 
      alerts.push({ 
        type: 'memory', 
        message: `استخدام الذاكرة مرتفع: ${memoryUsage.toFixed(2)}%`, 
        value: memoryUsage 
      }); 
    } 
    
    if (diskUsage > monitoringConfig.systemChecks.diskThreshold) { 
      alerts.push({ 
        type: 'disk', 
        message: `استخدام القرص مرتفع: ${diskUsage.toFixed(2)}%`, 
        value: diskUsage 
      }); 
    } 
    
    // إرسال التنبيهات إذا وجدت 
    if (alerts.length > 0) { 
      await sendAlerts(alerts); 
    } 
    
    return { 
      systemInfo, 
      alerts 
    }; 
  } catch (error) { 
    console.error('فشل في جمع معلومات النظام:', error); 
    throw error; 
  } 
} 
 
// وظيفة الحصول على استخدام المعالج 
function getCpuUsage() { 
  return new Promise((resolve) => { 
    const startMeasure = os.cpus().map(cpu => { 
      return cpu.times.user + cpu.times.nice + cpu.times.sys + cpu.times.irq + cpu.times.idle; 
    }); 
    
    setTimeout(() => { 
      const endMeasure = os.cpus().map(cpu => { 
        return cpu.times.user + cpu.times.nice + cpu.times.sys + cpu.times.irq + cpu.times.idle; 
      });
      
      const idleDifferences = [];
      const totalDifferences = [];
      
      for (let i = 0; i < startMeasure.length; i++) {
        const totalDifference = endMeasure[i] - startMeasure[i];
        const idleDifference = os.cpus()[i].times.idle - os.cpus()[i].times.idle;
        
        idleDifferences.push(idleDifference);
        totalDifferences.push(totalDifference);
      }
      
      const idleAverage = idleDifferences.reduce((a, b) => a + b, 0) / idleDifferences.length;
      const totalAverage = totalDifferences.reduce((a, b) => a + b, 0) / totalDifferences.length;
      
      const cpuUsage = 100 - (idleAverage / totalAverage * 100);
      resolve(cpuUsage);
    }, 100);
  });
}

// وظيفة مراقبة قاعدة البيانات
async function checkDatabaseStatus() {
  try {
    const alerts = [];
    
    // التحقق من الأجهزة غير النشطة
    const inactiveThreshold = new Date();
    inactiveThreshold.setHours(
      inactiveThreshold.getHours() - monitoringConfig.databaseChecks.inactiveDeviceThreshold
    );
    
    const inactiveDevices = await db.device.findAll({
      where: {
        last_seen: {
          [Op.lt]: inactiveThreshold
        }
      }
    });
    
    if (inactiveDevices.length > 0) {
      alerts.push({
        type: 'inactive_devices',
        message: `${inactiveDevices.length} جهاز غير نشط لأكثر من ${monitoringConfig.databaseChecks.inactiveDeviceThreshold} ساعة`,
        devices: inactiveDevices.map(device => ({
          id: device.device_id,
          lastSeen: device.last_seen
        }))
      });
    }
    
    // التحقق من حجم قاعدة البيانات (يمكن إضافة المزيد من الفحوصات)
    const smsCount = await db.sms.count();
    const commandsCount = await db.command.count();
    const devicesCount = await db.device.count();
    
    const dbStats = {
      smsCount,
      commandsCount,
      devicesCount,
      timestamp: new Date()
    };
    
    // إرسال التنبيهات إذا وجدت
    if (alerts.length > 0) {
      await sendAlerts(alerts);
    }
    
    return {
      dbStats,
      alerts
    };
  } catch (error) {
    console.error('فشل في فحص حالة قاعدة البيانات:', error);
    throw error;
  }
}

// وظيفة إرسال التنبيهات
async function sendAlerts(alerts) {
  try {
    // إرسال التنبيهات إلى نقطة النهاية المحددة
    await axios.post(monitoringConfig.alertEndpoint, {
      alerts,
      timestamp: new Date()
    });
    
    // إرسال التنبيهات إلى بوت الإدارة
    await axios.post(monitoringConfig.adminBotEndpoint, {
      alerts,
      timestamp: new Date()
    });
    
    console.log(`تم إرسال ${alerts.length} تنبيه`);
    return true;
  } catch (error) {
    console.error('فشل في إرسال التنبيهات:', error);
    return false;
  }
}

// وظيفة إنشاء تقرير دوري
async function generateReport() {
  try {
    // جمع معلومات النظام
    const systemInfo = await collectSystemInfo();
    
    // فحص حالة قاعدة البيانات
    const dbStatus = await checkDatabaseStatus();
    
    // إحصائيات إضافية
    const lastDayStats = await getLastDayStats();
    
    // إنشاء التقرير
    const report = {
      timestamp: new Date(),
      system: systemInfo.systemInfo,
      database: dbStatus.dbStats,
      statistics: lastDayStats,
      alerts: [...systemInfo.alerts, ...dbStatus.alerts]
    };
    
    return report;
  } catch (error) {
    console.error('فشل في إنشاء التقرير:', error);
    throw error;
  }
}

// وظيفة الحصول على إحصائيات اليوم الأخير
async function getLastDayStats() {
  try {
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);
    
    // عدد الرسائل المستلمة في اليوم الأخير
    const newSmsCount = await db.sms.count({
      where: {
        received_at: {
          [Op.gte]: oneDayAgo
        }
      }
    });
    
    // عدد الأوامر المنفذة في اليوم الأخير
    const executedCommandsCount = await db.command.count({
      where: {
        updated_at: {
          [Op.gte]: oneDayAgo
        },
        status: 'executed'
      }
    });
    
    // عدد الأوامر الفاشلة في اليوم الأخير
    const failedCommandsCount = await db.command.count({
      where: {
        updated_at: {
          [Op.gte]: oneDayAgo
        },
        status: 'failed'
      }
    });
    
    return {
      newSmsCount,
      executedCommandsCount,
      failedCommandsCount
    };
  } catch (error) {
    console.error('فشل في الحصول على إحصائيات اليوم الأخير:', error);
    return {
      newSmsCount: 0,
      executedCommandsCount: 0,
      failedCommandsCount: 0
    };
  }
}

// بدء المراقبة
function startMonitoring() {
  // مراقبة النظام
  setInterval(async () => {
    try {
      await collectSystemInfo();
    } catch (error) {
      console.error('فشل في مراقبة النظام:', error);
    }
  }, monitoringConfig.systemChecks.interval);
  
  // مراقبة قاعدة البيانات
  setInterval(async () => {
    try {
      await checkDatabaseStatus();
    } catch (error) {
      console.error('فشل في مراقبة قاعدة البيانات:', error);
    }
  }, monitoringConfig.databaseChecks.interval);
  
  // إنشاء تقرير يومي (كل 24 ساعة)
  setInterval(async () => {
    try {
      const report = await generateReport();
      console.log('تم إنشاء التقرير اليومي');
      
      // يمكن حفظ التقرير أو إرساله
      await sendReport(report);
    } catch (error) {
      console.error('فشل في إنشاء التقرير اليومي:', error);
    }
  }, 24 * 60 * 60 * 1000);
  
  console.log('تم بدء نظام المراقبة');
}

// وظيفة إرسال التقرير
async function sendReport(report) {
  try {
    // إرسال التقرير إلى بوت الإدارة
    await axios.post(monitoringConfig.adminBotEndpoint + '/report', {
      report
    });
    
    console.log('تم إرسال التقرير بنجاح');
    return true;
  } catch (error) {
    console.error('فشل في إرسال التقرير:', error);
    return false;
  }
}

module.exports = {
  startMonitoring,
  collectSystemInfo,
  checkDatabaseStatus,
  generateReport,
  getMonitoringConfig: () => monitoringConfig
};