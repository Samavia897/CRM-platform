'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addIndex('Users', ['email', 'companyId'], {
      unique: true,
      name: 'unique_email_per_company'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeIndex('Users', 'unique_email_per_company');
  }
};