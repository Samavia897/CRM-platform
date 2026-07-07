'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Funds', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      name: { type: Sequelize.STRING, allowNull: false },
      type: { type: Sequelize.STRING },
      location: { type: Sequelize.STRING },
      website: { type: Sequelize.STRING },
      geographics: { type: Sequelize.ARRAY(Sequelize.STRING) },
      industry: { type: Sequelize.ARRAY(Sequelize.STRING) },
      stage: { type: Sequelize.ARRAY(Sequelize.STRING) },
      companyId: {
        type: Sequelize.UUID,
        references: { model: 'Companies', key: 'id' },
        onDelete: 'CASCADE'
      },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false }
    });
  },
  async down(queryInterface) { await queryInterface.dropTable('Funds'); }
};