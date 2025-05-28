module.exports = app => {
  const commands = require("../controllers/commandController.js");
  const router = require("express").Router();

  // إنشاء أمر جديد
  router.post("/", commands.create);

  // استرجاع الأوامر المعلقة لجهاز معين
  router.get("/device/:device_id", commands.findPendingByDevice);

  // تحديث حالة الأمر
  router.post("/result", commands.updateStatus);

  app.use('/api/command', router);
};