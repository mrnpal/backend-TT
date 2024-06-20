const axios = require("axios");
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

const { Food } = require("../models");

const predictMain = async (req, res) => {
  // const getRandom = await axios.post('http://34.101.145.236:8080/predict/random');
  // const randomSatwa = getRandom.data;

  // if (randomSatwa.status) {
  //   return res
  //     .status(400)
  //     .json({
  //       status: 'fail',
  //       message: 'Tidak terdeteksi'
  //     });
  // }

  // const findSatwa = await Satwa.findOne({
  //   where: {
  //     nama: randomSatwa.nama
  //   }
  // });

  if (req.file) {
    const ext = path.extname(req.file.originalname).toLowerCase();

    if (
      ext !== ".png" &&
      ext !== ".jpg" &&
      ext !== ".jpeg" &&
      ext !== ".webp"
    ) {
      return res.status(404).json({
        status: "fail",
        message:
          "Hanya dapat menggunakan file gambar (.png, .jpg, .jpeg atau .webp)",
      });
    }

    const newFilename = `${uuidv1()}-${req.file.originalname}`;
    const blob = bucket.file(`predict_uploads/${newFilename}`);
    const blobStream = blob.createWriteStream();

    blobStream.on("error", (error) => {
      return res.status(400).json({
        status: "fail",
        message: error,
      });
    });

    blobStream.on("finish", async () => {
      const filename = blob.name.replaceAll("predict_uploads/", "");

      try {
        const getPrediction = await axios.post(process.env.API_PREDICT_HOST, {
          filename: filename,
        });
        const predictedFood = getPrediction.data;

        const findFood = await Food.findOne({
          where: {
            nama: predictedFood.nama,
          },
        });

        if (!findFood) {
          const Food = await Food.create(predictedFood);
          return res.json(food);
        }

        res.json(findFood);
      } catch (error) {
        console.log(error);
        return res.status(400).json({
          status: "fail",
          message: "Tidak terdeteksi",
        });
      }
    });

    blobStream.end(req.file.buffer);
  } else {
    return res.status(400).json({
      status: "fail",
      message: "Mohon mengisi semua kolom yang diperlukan",
    });
  }
};

const predictRandom = async (req, res) => {
  const random_food = [
    {
      nama: "Babi Guling",

      lokasi: "",
      deskripsi: "",
    },
    {
      nama: "Es Pisang Ijo",

      lokasi: "",
      deskripsi: "",
    },
    {
      nama: "Kerak Telur",

      lokasi: "",
      deskripsi: "",
    },
    {
      nama: "Rendang",

      lokasi: "",
      deskripsi: "",
    },
    {
      nama: "Sate Ulat Sagu",

      lokasi: "",
      deskripsi: "",
    },
    {
      nama: "Soto Banjar",

      lokasi: "",
      deskripsi: "",
    },
    {
      status: "fail",
    },
  ];

  const response = random_food[Math.floor(Math.random() * random_food.length)];

  res.json(response);
};

module.exports = {
  predictMain,
  predictRandom,
};
