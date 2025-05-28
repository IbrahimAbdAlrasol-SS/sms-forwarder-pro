const db = require("../models/db.js");
const Sms = db.sms;
const Device = db.device;

// إنشاء وحفظ رسالة جديدة
exports.create = async (req, res) => {
  try {
    // التحقق من صحة الطلب
    if (!req.body.device_id || !req.body.sender || !req.body.message_body || !req.body.timestamp) {
      return res.status(400).send({
        message: "لا يمكن أن تكون المحتويات فارغة!"
      });
    }

    const deviceId = req.body.device_id;

    // التحقق من وجود الجهاز أو إنشاء جهاز جديد
    await Device.findOrCreate({
      where: { device_id: deviceId },
      defaults: {
        device_info: {},
        last_seen: new Date()
      }
    });

    // تحديث آخر ظهور للجهاز
    await Device.update(
      { last_seen: new Date() },
      { where: { device_id: deviceId } }
    );

    // إنشاء رسالة
    const sms = {
      device_id: deviceId,
      sender: req.body.sender,
      message_body: req.body.message_body,
      timestamp: req.body.timestamp,
      received_at: new Date()
    };

    // حفظ الرسالة في قاعدة البيانات
    const data = await Sms.create(sms);
    res.send(data);
  } catch (err) {
    res.status(500).send({
      message: err.message || "حدث خطأ أثناء إنشاء الرسالة."
    });
  }
};

// استرجاع جميع الرسائل من قاعدة البيانات
exports.findAll = async (req, res) => {
  try {
    const device_id = req.query.device_id;
    let condition = device_id ? { device_id: device_id } : null;

    const data = await Sms.findAll({ where: condition });
    res.send(data);
  } catch (err) {
    res.status(500).send({
      message: err.message || "حدث خطأ أثناء استرجاع الرسائل."
    });
  }
};

// استرجاع رسالة واحدة بواسطة المعرف
exports.findOne = async (req, res) => {
  try {
    const id = req.params.id;
    const data = await Sms.findByPk(id);
    
    if (!data) {
      return res.status(404).send({
        message: `لا يمكن العثور على رسالة بالمعرف=${id}.`
      });
    }
    
    res.send(data);
  } catch (err) {
    res.status(500).send({
      message: "خطأ في استرجاع الرسالة بالمعرف=" + id
    });
  }
};