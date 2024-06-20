module.exports = (sequelize, DataTypes) => {
  const Food_gambar = sequelize.define(
    "Food_gambar",
    {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: DataTypes.INTEGER,
      },
      FoodId: {
        type: DataTypes.INTEGER,
        references: {
          model: "food",
          key: "id",
        },
      },
      gambar: {
        allowNull: false,
        type: DataTypes.STRING,
      },
      createdAt: {
        type: DataTypes.DATE,
      },
      updatedAt: {
        type: DataTypes.DATE,
      },
    },
    {
      tableName: "Food_gambar",
    }
  );

  Food_gambar.associate = (models) => {
    Food_gambar.belongsTo(models.Food, {
      foreignKey: {
        name: "FoodId",
        type: DataTypes.INTEGER,
      },
    });
  };

  return Food_gambar;
};
