const db = require("../models/db.js");
const Device = db.device;

// إنشاء أو تحديث جهاز
exports.createOrUpdate = async (req, res) => {
  try {
    // التحقق من صحة الطلب
    if (!req.body.device_id) {
      return res.status(400).send({
        message: "معرف الجهاز مطلوب!"
      });
    }

    const deviceId = req.body.device_id;
    const deviceInfo = req.body.device_info || {};

    // البحث عن الجهاز أو إنشاء جهاز جديد
    const [device, created] = await Device.findOrCreate({
      where: { device_id: deviceId },
      defaults: {
        device_info: deviceInfo,
        last_seen: new Date()
      }
    });

    // إذا كان الجهاز موجودًا بالفعل، قم بتحديثه
    if (!created) {
      await device.update({
        device_info: deviceInfo,
        last_seen: new Date()
      });
    }

    res.send({
      device_id: device.device_id,
      created: created,
      message: created ? "تم إنشاء الجهاز بنجاح" : "تم تحديث الجهاز بنجاح"
    });
  } catch (err) {
    res.status(500).send({
      message: err.message || "حدث خطأ أثناء إنشاء أو تحديث الجهاز."
    });
  }
};

// الحصول على جميع الأجهزة
exports.findAll = async (req, res) => {
  try {
    const devices = await Device.findAll();
    res.send(devices);
  } catch (err) {
    res.status(500).send({
      message: err.message || "حدث خطأ أثناء استرجاع الأجهزة."
    });
  }
};

// الحصول على جهاز واحد بواسطة المعرف
exports.findOne = async (req, res) => {
  try {
    const deviceId = req.params.device_id;
    const device = await Device.findOne({ where: { device_id: deviceId } });
    
    if (!device) {
      return res.status(404).send({
        message: `لم يتم العثور على جهاز بالمعرف=${deviceId}.`
      });
    }
    
    res.send(device);
  } catch (err) {
    res.status(500).send({
      message: "حدث خطأ أثناء استرجاع الجهاز."
    });
  }
};

// حذف جهاز
exports.delete = async (req, res) => {
  try {
    const deviceId = req.params.device_id;
    const deleted = await Device.destroy({ where: { device_id: deviceId } });
    
    if (deleted === 0) {
      return res.status(404).send({
        message: `لم يتم العثور على جهاز بالمعرف=${deviceId}.`
      });
    }
    
    res.send({
      message: "تم حذف الجهاز بنجاح!"
    });
  } catch (err) {
    res.status(500).send({
      message: "حدث خطأ أثناء حذف الجهاز."
    });
  }
};