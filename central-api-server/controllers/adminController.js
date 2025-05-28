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
  }
};

// تسجيل الدخول للمدير
exports.login = async (req, res) => {
  try {
    // التحقق من صحة الطلب
    if (!req.body.username || !req.body.password) {
      return res.status(400).send({
        message: "يجب توفير اسم المستخدم وكلمة المرور!"
      });
    }

    // البحث عن المدير باسم المستخدم
    const admin = await Admin.findOne({
      where: { username: req.body.username }
    });

    if (!admin) {
      return res.status(404).send({
        message: "اسم المستخدم غير موجود!"
      });
    }

    // التحقق من كلمة المرور
    const validPassword = await bcrypt.compare(req.body.password, admin.password);
    if (!validPassword) {
      return res.status(401).send({
        message: "كلمة المرور غير صحيحة!"
      });
    }

    // إنشاء توكن JWT
    const token = jwt.sign(
      { admin_id: admin.admin_id, username: admin.username, role: admin.role },
      process.env.API_TOKEN,
      { expiresIn: "24h" }
    );

    // تحديث آخر تسجيل دخول
    await Admin.update(
      { last_login: new Date() },
      { where: { admin_id: admin.admin_id } }
    );

    // إرسال الاستجابة مع التوكن
    res.status(200).send({
      admin_id: admin.admin_id,
      username: admin.username,
      role: admin.role,
      token: token
    });
  } catch (err) {
    res.status(500).send({
      message: err.message || "حدث خطأ أثناء تسجيل الدخول."
    });
  }
};

// التحقق من توكن JWT
exports.verifyToken = (req, res, next) => {
  // الحصول على التوكن من رأس الطلب
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(403).send({
      message: "لم يتم توفير توكن الوصول!"
    });
  }

  // التحقق من صحة التوكن
  jwt.verify(token, process.env.API_TOKEN, (err, decoded) => {
    if (err) {
      return res.status(401).send({
        message: "غير مصرح به! التوكن غير صالح أو منتهي الصلاحية."
      });
    }
    req.adminData = decoded;
    next();
  });
};

// التحقق من صلاحيات المدير الرئيسي
exports.isOwner = (req, res, next) => {
  if (req.adminData.role !== 'owner') {
    return res.status(403).send({
      message: "مطلوب صلاحيات المدير الرئيسي!"
    });
  }
  next();
};

// استرجاع جميع المدراء
exports.findAll = async (req, res) => {
  try {
    const admins = await Admin.findAll({
      attributes: { exclude: ['password'] }
    });
    res.send(admins);
  } catch (err) {
    res.status(500).send({
      message: err.message || "حدث خطأ أثناء استرجاع المدراء."
    });
  }
};

// استرجاع مدير واحد بواسطة المعرف
exports.findOne = async (req, res) => {
  const id = req.params.id;

  try {
    const admin = await Admin.findByPk(id, {
      attributes: { exclude: ['password'] }
    });
    
    if (!admin) {
      return res.status(404).send({
        message: `لم يتم العثور على مدير بالمعرف ${id}.`
      });
    }
    
    res.send(admin);
  } catch (err) {
    res.status(500).send({
      message: `حدث خطأ أثناء استرجاع المدير بالمعرف ${id}.`
    });
  }
};

// تحديث مدير بواسطة المعرف
exports.update = async (req, res) => {
  const id = req.params.id;

  try {
    // التحقق من وجود المدير
    const admin = await Admin.findByPk(id);
    if (!admin) {
      return res.status(404).send({
        message: `لم يتم العثور على مدير بالمعرف ${id}.`
      });
    }

    // تحضير بيانات التحديث
    const updateData = {};
    
    if (req.body.username) {
      // التحقق من وجود اسم المستخدم
      const existingAdmin = await Admin.findOne({
        where: { 
          username: req.body.username,
          admin_id: { [db.Sequelize.Op.ne]: id }
        }
      });

      if (existingAdmin) {
        return res.status(400).send({
          message: "اسم المستخدم موجود بالفعل!"
        });
      }
      
      updateData.username = req.body.username;
    }

    if (req.body.password) {
      // تشفير كلمة المرور الجديدة
      const salt = await bcrypt.genSalt(10);
      updateData.password = await bcrypt.hash(req.body.password, salt);
    }

    if (req.body.role) {
      // التحقق من أن المدير لا يقوم بتغيير دوره الخاص
      if (admin.admin_id === req.adminData.admin_id && req.body.role !== 'owner') {
        return res.status(400).send({
          message: "لا يمكنك تغيير دورك من مدير رئيسي!"
        });
      }
      updateData.role = req.body.role;
    }

    // تحديث المدير
    await Admin.update(updateData, {
      where: { admin_id: id }
    });

    res.send({
      message: "تم تحديث المدير بنجاح."
    });
  } catch (err) {
    res.status(500).send({
      message: err.message || `حدث خطأ أثناء تحديث المدير بالمعرف ${id}.`
    });
  }
};

// حذف مدير بواسطة المعرف
exports.delete = async (req, res) => {
  const id = req.params.id;

  try {
    // التحقق من أن المدير لا يحاول حذف نفسه
    if (parseInt(id) === req.adminData.admin_id) {
      return res.status(400).send({
        message: "لا يمكنك حذف حسابك الخاص!"
      });
    }

    // التحقق من وجود المدير
    const admin = await Admin.findByPk(id);
    if (!admin) {
      return res.status(404).send({
        message: `لم يتم العثور على مدير بالمعرف ${id}.`
      });
    }

    // حذف المدير
    await Admin.destroy({
      where: { admin_id: id }
    });

    res.send({
      message: "تم حذف المدير بنجاح."
    });
  } catch (err) {
    res.status(500).send({
      message: err.message || `حدث خطأ أثناء حذف المدير بالمعرف ${id}.`
    });
  }
};