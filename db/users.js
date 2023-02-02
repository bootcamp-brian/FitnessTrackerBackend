const client = require("./client");
const bcrypt = require('bcrypt')
const SALT_COUNT = 10;

// database functions

// user functions
async function createUser({ username, password }) {
  const hashedPassword = await bcrypt.hash(password, SALT_COUNT);
  try {
      const { rows: [ user ] } = await client.query(`
      INSERT INTO users(username, password)
      VALUES ($1, $2)
      ON CONFLICT (username) DO NOTHING
      RETURNING *;
      `, [ username, hashedPassword ]);

      delete user.password;

      return user;
  } catch (error) {
      throw error;
  }
}

async function getUser({ username, password }) {
  try {
    const user = await getUserByUsername(username);
    const hashedPassword = user.password;
    
    let passwordsMatch = await bcrypt.compare(password, hashedPassword) 
      if (passwordsMatch) {
        delete user.password;
        return user;
      } else {
        return false;
    }
  } catch (error) {
    throw error;
  }
}

async function getUserById(userId) {
  try {
    const { rows: [ user ] } = await client.query(`
        SELECT * FROM users
        WHERE id='${ userId }';
    `);
    
    delete user.password;

    return user;
  } catch (error) {
    throw error;
  }
}

async function getUserByUsername(username) {
  try {
    const { rows: [ user ] } = await client.query(`
        SELECT * FROM users
        WHERE username='${ username }';
    `);
    
    return user;
  } catch (error) {
    throw error;
  }
}

module.exports = {
  createUser,
  getUser,
  getUserById,
  getUserByUsername,
}
