'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Purana comment ya boilerplate hata kar ye likhein:
    await queryInterface.addIndex('Users', ['email', 'companyId'], {
      unique: true,
      name: 'unique_email_per_company'
    });
  },

  async down(queryInterface, Sequelize) {
    // Rollback logic: index ko khatam karne ke liye
    await queryInterface.removeIndex('Users', 'unique_email_per_company');
  }
};