const Validator = require("fastest-validator");
const { Storage } = require("@google-cloud/storage");
var path = require("path");
const uuid = require("uuid");

const storage = new Storage({
  projectId: process.env.GCLOUD_PROJECT,
  credentials: {
    client_email: process.env.GCLOUD_CLIENT_EMAIL,
    private_key: process.env.GCLOUD_PRIVATE_KEY,
  },
});

const bucket = storage.bucket(process.env.GCS_BUCKET);

const uuidv1 = uuid.v1;

const { Food, Food_gambar } = require("../models");

const v = new Validator();

const getAllFood = async (req, res) => {
  const food = await Food.findAll({
    include: Food_gambar,
  });
  res.json(food);
};

const getFoodById = async (req, res) => {
  const id = req.params.id;

  const food = await Food.findOne({
    where: {
      id: id,
    },
    include: Food_gambar,
  });

  if (!food) {
    return res.status(404).json({
      status: "fail",
      message: "Data Makanan tidak ditemukan",
    });
  }

  res.json(food);
};

const getFoodByIdV2 = async (req, res) => {
  const id = req.params.id;

  const food = await Food.findByPk(id);

  if (!food) {
    return res.status(404).json({
      status: "fail",
      message: "Data Makanan tidak ditemukan",
    });
  }

  const gambar = await Food_gambar.findOne({
    where: {
      FoodId: id,
    },
  });

  const foodReturn = JSON.parse(JSON.stringify(food));

  if (gambar) {
    foodReturn.gambar = gambar.gambar;
  } else {
    foodReturn.gambar = null;
  }

  res.json(foodReturn);
};

const addFood = async (req, res) => {
  const schema = {
    nama: "string",
    lokasi: "string|optional",
    deskripsi: "",
  };

  const food_detail = JSON.parse(req.body.data);

  const validate = v.validate(food_detail, schema);

  if (validate.length) {
    return res.status(400).json(validate);
  }

  const { nama } = food_detail;

  if (nama === "") {
    return res.status(400).json({
      status: "fail",
      message: "Mohon mengisi semua kolom yang diperlukan",
    });
  }

  if (req.file) {
    const ext_gambar_lokasi = path.extname(req.file.originalname).toLowerCase();

    if (
      ext_gambar_lokasi !== ".png" &&
      ext_gambar_lokasi !== ".jpg" &&
      ext_gambar_lokasi !== ".jpeg"
    ) {
      return res.status(400).json({
        status: "fail",
        message: "Hanya dapat menggunakan file gambar (.png, .jpg atau .jpeg)",
      });
    }

    const newFilename_gambar_lokasi = `${uuidv1()}-${req.file.originalname}`;
    const blob_gambar_lokasi = bucket.file(newFilename_gambar_lokasi);
    const blobStream_gambar_lokasi = blob_gambar_lokasi.createWriteStream();

    blobStream_gambar_lokasi.on("error", (error) => {
      console.log(error);
    });

    blobStream_gambar_lokasi.on("finish", async () => {
      console.log("success");
    });

    blobStream_gambar_lokasi.end(req.file.buffer);

    food_detail.gambar_lokasi = `https://storage.googleapis.com/${process.env.GCS_BUCKET}/${blob_gambar_lokasi.name}`;
  }

  const food = await Food.create(Food_detail);

  res.json(food);
};

const updateFood = async (req, res) => {
  const id = req.params.id;

  let food = await Food.findByPk(id);

  if (!food) {
    return res.status(404).json({
      status: "fail",
      message: "Data Makanan tidak ditemukan",
    });
  }

  const Food_detail = JSON.parse(req.body.data);

  const schema = {
    nama: "string|optional",
    lokasi: "string|optional",
    deskripsi: "string|optional",
  };

  const validate = v.validate(food_detail, schema);

  if (validate.length) {
    return res.status(400).json(validate);
  }

  const { nama } = req.body;

  if (nama === "") {
    return res.status(400).json({
      status: "fail",
      message: "Mohon mengisi semua kolom yang diperlukan",
    });
  }

  if (req.file) {
    const ext_gambar_lokasi = path.extname(req.file.originalname).toLowerCase();

    if (
      ext_gambar_lokasi !== ".png" &&
      ext_gambar_lokasi !== ".jpg" &&
      ext_gambar_lokasi !== ".jpeg"
    ) {
      return res.status(400).json({
        status: "fail",
        message: "Hanya dapat menggunakan file gambar (.png, .jpg atau .jpeg)",
      });
    }

    const newFilename_gambar_lokasi = `${uuidv1()}-${req.file.originalname}`;
    const blob_gambar_lokasi = bucket.file(newFilename_gambar_lokasi);
    const blobStream_gambar_lokasi = blob_gambar_lokasi.createWriteStream();

    blobStream_gambar_lokasi.on("error", (error) => {
      console.log(error);
    });

    blobStream_gambar_lokasi.on("finish", async () => {
      console.log("success");
    });

    blobStream_gambar_lokasi.end(req.file.buffer);

    if (food.gambar_lokasi) {
      const gambar_lokasi_old = food.gambar_lokasi.replaceAll(
        `https://storage.googleapis.com/${process.env.GCS_BUCKET}/`,
        ""
      );

      try {
        await bucket.file(gambar_lokasi_old).delete();
      } catch (error) {
        console.log(error);
      }
    }

    food_detail.gambar_lokasi = `https://storage.googleapis.com/${process.env.GCS_BUCKET}/${blob_gambar_lokasi.name}`;
  } else {
    food_detail.gambar_lokasi = food.gambar_lokasi;
  }

  food = await food.update(food_detail);

  res.json(food);
};

const deleteFood = async (req, res) => {
  const id = req.params.id;

  const food = await Food.findOne({
    where: {
      id: id,
    },
    include: Food_gambar,
  });

  if (!food) {
    return res.status(404).json({
      status: "fail",
      message: "Data makanan tidak ditemukan",
    });
  }

  await Food_donasi.destroy({
    where: {
      FoodId: food.id,
    },
  });

  if (food.gambar_lokasi) {
    const gambar_lokasi_old = food.gambar_lokasi.replaceAll(
      `https://storage.googleapis.com/${process.env.GCS_BUCKET}/`,
      ""
    );

    try {
      await bucket.file(gambar_lokasi_old).delete();
    } catch (error) {
      console.log(error);
    }
  }

  if (food.Food_gambars.length !== 0) {
    const food_gambars = food.Food_gambars;

    for (let food_gambar of food_gambars) {
      const gambar_old = food_gambar.gambar.replaceAll(
        `https://storage.googleapis.com/${process.env.GCS_BUCKET}/`,
        ""
      );

      try {
        await Food_gambar.destroy({
          where: {
            id: food_gambar.id,
          },
        });

        await bucket.file(gambar_old).delete();
      } catch (error) {
        console.log(error);
      }
    }
  }

  await food.destroy();

  res.status(200).json({
    status: "success",
    message: "Data Makanan telah terhapus",
  });
};

module.exports = {
  getAllFood,
  getFoodById,
  getFoodByIdV2,
  addFood,
  updateFood,
  deleteFood,
};
