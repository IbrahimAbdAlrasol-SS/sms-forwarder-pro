module.exports = app => {
  const admin = require("../controllers/adminController.js");
  const router = require("express").Router();

  // مسارات عامة (بدون توثيق)
  router.post("/login", admin.login);

  // مسارات محمية (تتطلب توثيق)
  router.use(admin.verifyToken);

  // مسارات للمدراء العاديين والرئيسيين
  router.get("/profile", (req, res) => {
    res.status(200).send(req.adminData);
  });

  // مسارات للمدير الرئيسي فقط
  router.use(admin.isOwner);
  
  router.post("/", admin.create);
  router.get("/all", admin.findAll);
  router.get("/:id", admin.findOne);
  router.put("/:id", admin.update);
  router.delete("/:id", admin.delete);

  app.use('/api/admin', router);
};