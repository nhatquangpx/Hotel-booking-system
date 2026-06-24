const { seedDatabaseFixture } = require("../fixtures/dbSeed");

async function seedTestData() {
  return seedDatabaseFixture();
}

module.exports = { seedTestData };
