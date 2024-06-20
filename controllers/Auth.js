var jwt = require("jsonwebtoken");
var bcrypt = require("bcrypt");
const express = require("express");
const app = express();

// Middleware untuk membaca data dari body request dalam format JSON
app.use(express.json());

const { User } = require("../models");

const Login = async (req, res) => {
  try {
    console.log("Request Body:", req.body);
    const user = await User.findOne({
      where: {
        email: req.body.email,
      },
    });

    const match = await bcrypt.compare(req.body.password, user.password);
    if (!match) {
      return res.status(400).json({
        status: "fail",
        message: "Password salah",
      });
    }

    const userId = user.id;
    const nama = user.nama;
    const email = user.email;
    const accessToken = jwt.sign(
      { userId, nama, email },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: "20s" }
    );
    const refreshToken = jwt.sign(
      { userId, nama, email },
      process.env.REFRESH_TOKEN_SECRET,
      { expiresIn: "1d" }
    );

    await User.update(
      { refresh_token: refreshToken },
      {
        where: {
          id: userId,
        },
      }
    );

    res.cookie("refreshToken", refreshToken, {
      httpOnly: false,
      maxAge: 24 * 60 * 60 * 1000,
      // , secure: true
    });

    // res.json({ accessToken });
    res.json({
      error: false,
      message: "Sukses",
      loginResult: {
        userId: userId,
        name: nama,
        token: accessToken,
      },
    });
  } catch (error) {
    res.status(404).json({
      status: "fail",
      message: "email tidak ditemukan",
    });
  }
};

const Logout = async (req, res) => {
  const refreshToken = req.cookies.refreshToken;
  if (!refreshToken) return res.sendStatus(401);

  const user = await User.findOne({
    where: {
      refresh_token: refreshToken,
    },
  });

  if (!user) return res.sendStatus(204);

  const userId = user.id;
  await User.update(
    { refresh_token: null },
    {
      where: {
        id: userId,
      },
    }
  );

  res.clearCookie("refreshToken");
  return res.sendStatus(200);
};

const refreshToken = async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) return res.sendStatus(401);

    const user = await User.findOne({
      where: {
        refresh_token: refreshToken,
      },
    });

    if (!user) return res.sendStatus(403);

    jwt.verify(
      refreshToken,
      process.env.REFRESH_TOKEN_SECRET,
      (err, decoded) => {
        if (err) return res.sendStatus(403);
        const userId = user.id;
        const nama = user.nama;
        const email = user.email;
        const accessToken = jwt.sign(
          { userId, nama, email },
          process.env.ACCESS_TOKEN_SECRET,
          {
            expiresIn: "15s",
          }
        );
        res.json({ accessToken });
      }
    );
  } catch (error) {
    console.log(error);
  }
};

const register = async (req, res) => {
  try {
    console.log("Request Body:", req.body);
    const { nama, email, password } = req.body;

    // Check if the request body contains the necessary fields
    if (!nama || !email || !password) {
      return res.status(400).json({
        status: "fail",
        message: "Mohon lengkapi semua field",
      });
    }

    // Check if the email already exists
    const existingUser = await User.findOne({
      where: {
        email: email,
      },
    });

    if (existingUser) {
      return res.status(400).json({
        status: "fail",
        message: "email sudah digunakan",
      });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create a new user
    const newUser = await User.create({
      nama: nama,
      email: email,
      password: hashedPassword,
    });

    // Create a token for the new user
    const userId = newUser.id;
    const uniqueTokenData = `${userId}-${Date.now()}`;
    const accessToken = jwt.sign(
      { userId, nama, email },
      process.env.ACCESS_TOKEN_SECRET,
      {
        expiresIn: "20s",
      }
    );

    // Save the unique token to the user record (or wherever appropriate in your app)
    await User.update(
      { refresh_token: uniqueTokenData },
      {
        where: {
          id: userId,
        },
      }
    );

    // Respond with success message and token
    res.status(201).json({
      error: false,
      message: "User Created",
    });
  } catch (error) {
    console.error("Error during registration:", error);
    res.status(500).json({
      status: "error",
      message: "Register Failed",
    });
  }
};

module.exports = {
  Login,
  Logout,
  refreshToken,
  register,
};
