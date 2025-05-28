const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
require('dotenv').config();

// استيراد نماذج قاعدة البيانات
const db = require('./models/db');

// إنشاء تطبيق Express
const app = express();

// إعداد middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// تهيئة قاعدة البيانات
db.sequelize.sync({ alter: process.env.DB_ALTER === 'true' }).then(() => {
  console.log("تم مزامنة قاعدة البيانات.");
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

// تعيين المنفذ والاستماع للطلبات
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`الخادم يعمل على المنفذ ${PORT}.`);
});