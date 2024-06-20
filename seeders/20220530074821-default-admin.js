"use strict";

var bcrypt = require("bcrypt");

module.exports = {
  async up(queryInterface, Sequelize) {
    const salt = await bcrypt.genSalt();
    const hashPassword = await bcrypt.hash("atmin", salt);

    await queryInterface.bulkInsert("user", [
      {
        nama: "Administrator",
        email: "atmin@gmail.com",
        password: hashPassword,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete("user");
  },
};
