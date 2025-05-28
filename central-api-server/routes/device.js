module.exports = app => {
  const devices = require("../controllers/deviceController.js");
  const router = require("express").Router();

  // إنشاء أو تحديث جهاز
  router.post("/", devices.createOrUpdate);

  // الحصول على جميع الأجهزة
  router.get("/", devices.findAll);

  // الحصول على جهاز واحد بواسطة المعرف
  router.get("/:device_id", devices.findOne);

  // حذف جهاز
  router.delete("/:device_id", devices.delete);

  app.use('/api/devices', router);
};