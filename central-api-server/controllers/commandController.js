const db = require("../models/db.js");
const Command = db.command;
const Device = db.device;

// إنشاء وحفظ أمر جديد
exports.create = async (req, res) => {
  try {
    // التحقق من صحة الطلب
    if (!req.body.device_id || !req.body.command_type) {
      return res.status(400).send({
        message: "يجب توفير معرف الجهاز ونوع الأمر!"
      });
    }

    const deviceId = req.body.device_id;

    // التحقق من وجود الجهاز
    const device = await Device.findOne({ where: { device_id: deviceId } });
    if (!device) {
      return res.status(404).send({
        message: `الجهاز بالمعرف=${deviceId} غير موجود.`
      });
    }

    // إنشاء أمر
    const command = {
      device_id: deviceId,
      command_type: req.body.command_type,
      parameters: req.body.parameters || {},
      status: 'pending',
      created_at: new Date(),
      updated_at: new Date()
    };

    // حفظ الأمر في قاعدة البيانات
    const data = await Command.create(command);
    res.send(data);
  } catch (err) {
    res.status(500).send({
      message: err.message || "حدث خطأ أثناء إنشاء الأمر."
    });
  }
};

// استرجاع جميع الأوامر المعلقة لجهاز معين
exports.findPendingByDevice = async (req, res) => {
  try {
    const deviceId = req.params.device_id;

    // التحقق من وجود الجهاز وتحديث آخر ظهور
    const device = await Device.findOne({ where: { device_id: deviceId } });
    if (device) {
      await device.update({ last_seen: new Date() });
    }

    const data = await Command.findAll({
      where: {
        device_id: deviceId,
        status: 'pending'
      }
    });

    // تحديث حالة الأوامر إلى 'sent'
    const commandIds = data.map(command => command.id);
    if (commandIds.length > 0) {
      await Command.update(
        { status: 'sent', updated_at: new Date() },
        { where: { id: commandIds } }
      );
    }

    res.send(data);
  } catch (err) {
    res.status(500).send({
      message: err.message || "حدث خطأ أثناء استرجاع الأوامر."
    });
  }
};

// تحديث حالة الأمر
exports.updateStatus = async (req, res) => {
  try {
    // التحقق من صحة الطلب
    if (!req.body.command_id || !req.body.status) {
      return res.status(400).send({
        message: "يجب توفير معرف الأمر والحالة!"
      });
    }

    const commandId = req.body.command_id;
    const status = req.body.status;
    const result = req.body.result || null;

    // تحديث الأمر
    const updateData = {
      status: status,
      result: result,
      updated_at: new Date()
    };

    // إذا كانت الحالة 'executed' أو 'failed'، قم بتعيين executed_at
    if (status === 'executed' || status === 'failed') {
      updateData.executed_at = new Date();
    }

    const [num] = await Command.update(
      updateData,
      { where: { id: commandId } }
    );

    if (num === 1) {
      res.send({
        message: "تم تحديث حالة الأمر بنجاح."
      });
    } else {
      res.send({
        message: `لا يمكن تحديث الأمر بالمعرف=${commandId}. ربما لم يتم العثور على الأمر أو أن الجسم فارغ!`
      });
    }
  } catch (err) {
    res.status(500).send({
      message: "خطأ في تحديث الأمر بالمعرف=" + req.body.command_id
    });
  }
};