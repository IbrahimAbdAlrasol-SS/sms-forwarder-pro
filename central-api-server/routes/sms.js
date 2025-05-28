module.exports = app => {
  const sms = require("../controllers/smsController.js");
  const router = require("express").Router();

  // إنشاء رسالة جديدة
  router.post("/", sms.create);

  // استرجاع جميع الرسائل
  router.get("/all", sms.findAll);

  // استرجاع رسالة واحدة بواسطة المعرف
  router.get("/:id", sms.findOne);

  app.use('/api/device/sms', router);
};