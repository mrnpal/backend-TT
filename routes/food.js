var express = require("express");
const Multer = require("multer");
var router = express.Router();

const {
  getAllFood,
  getFoodById,
  getFoodByIdV2,
  addFood,
  updateFood,
  deleteFood,
} = require("../controllers/Food");

const multer = Multer({
  storage: Multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});

router.get("/", getAllFood);
router.get("/:id", getFoodById);
router.get("/v2/:id", getFoodByIdV2);
router.post("/", multer.single("gambar_lokasi"), addFood);
router.put("/:id", multer.single("gambar_lokasi"), updateFood);
router.delete("/:id", deleteFood);

module.exports = router;
