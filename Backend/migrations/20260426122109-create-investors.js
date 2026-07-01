'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Investors', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      firstName: { type: Sequelize.STRING, allowNull: false },
      lastName: { type: Sequelize.STRING },
      email: { type: Sequelize.STRING, unique: true },
      status: { 
        type: Sequelize.ENUM('New', 'Contacted', 'Deck Request', 'Meeting Scheduled', 'Follow-Up'),
        defaultValue: 'New'
      },
      fundId: {
        type: Sequelize.UUID,
        references: { model: 'Funds', key: 'id' },
        onDelete: 'CASCADE'
      },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false }
    });
  },
  async down(queryInterface) { await queryInterface.dropTable('Investors'); }
};