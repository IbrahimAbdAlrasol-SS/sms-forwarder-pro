const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
require('dotenv').config();
const swaggerUi = require('swagger-ui-express');
const swaggerSpecs = require('./config/swagger.config');

// استيراد نماذج قاعدة البيانات
const db = require('./models/db');

// استيراد وظائف الجدولة والمراقبة
const { scheduleBackups, scheduleDataCleanup } = require('./utils/scheduler');
const { startMonitoring } = require('./utils/monitoring');

// إنشاء تطبيق Express
const app = express();

// إعداد middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// إضافة توثيق Swagger
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpecs));

// تهيئة قاعدة البيانات
db.sequelize.sync({ alter: process.env.DB_ALTER === 'true' }).then(() => {
  console.log("تم مزامنة قاعدة البيانات.");
  
  // بدء المهام المجدولة بعد مزامنة قاعدة البيانات
  if (process.env.BACKUP_ENABLED === 'true') {
    scheduleBackups();
  }
  
  if (process.env.DATA_CLEANUP_ENABLED === 'true') {
    scheduleDataCleanup();
  }
  
  // بدء نظام المراقبة
  startMonitoring();
  
}).catch(err => {
  console.error("فشل في مزامنة قاعدة البيانات:", err);
});

// رسالة ترحيبية بسيطة للمسار الرئيسي
app.get('/', (req, res) => {
  res.json({ message: 'مرحباً بك في خادم SMS Forwarder API' });
});

// استدعاء ملفات التوجيه
require('./routes/sms')(app);
require('./routes/command')(app);
require('./routes/device')(app);
require('./routes/admin')(app);

// تعيين المنفذ والاستماع للطلبات
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`الخادم يعمل على المنفذ ${PORT}.`);
});