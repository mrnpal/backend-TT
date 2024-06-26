const { User } = require('../models');

const getUsers = async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: ['id', 'nama', 'email']
    });
    res.json(users);
  } catch (error) {
    console.log(error);
  }
}

module.exports = {
  getUsers
};
