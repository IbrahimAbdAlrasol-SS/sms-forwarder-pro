const db = require("../models/db.js");
const Admin = db.admin;
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// إنشاء وحفظ مدير جديد
exports.create = async (req, res) => {
  // التحقق من صحة الطلب
  if (!req.body.username || !req.body.password) {
    res.status(400).send({
      message: "يجب توفير اسم المستخدم وكلمة المرور!"
    });
    return;
  }

  try {
    // التحقق من وجود المستخدم
    const existingAdmin = await Admin.findOne({
      where: { username: req.body.username }
    });

    if (existingAdmin) {
      return res.status(400).send({
        message: "اسم المستخدم موجود بالفعل!"
      });
    }

    // تشفير كلمة المرور
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(req.body.password, salt);

    // إنشاء مدير
    const admin = {
      username: req.body.username,
      password: hashedPassword,
      role: req.body.role || 'admin',
      created_at: new Date()
    };

    // حفظ المدير في قاعدة البيانات
    const data = await Admin.create(admin);
    
    // إزالة كلمة المرور من الاستجابة
    const { password, ...adminWithoutPassword } = data.toJSON();
    res.send(adminWithoutPassword);
  } catch (err) {
    res.status(500).send({
      message: err.message || "حدث خطأ أثناء إنشاء المدير."
    });
};
};
