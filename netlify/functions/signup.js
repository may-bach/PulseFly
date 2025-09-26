const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const { username, password, role } = JSON.parse(event.body);

  const allowedRoles = ['Authority', 'Drone Operator', 'Data Analyst', 'Field Inspector', 'Administrator'];
  if (!username || !password || !role) {
    return { statusCode: 400, body: 'Username, password, and role are required.' };
  }
  if (!allowedRoles.includes(role)) {
    return { statusCode: 400, body: 'Invalid role specified.' };
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  try {
    // Insert the username provided by the admin into the 'uid' primary key column
    const result = await pool.query(
      'INSERT INTO users (uid, password_hash, role) VALUES ($1, $2, $3) RETURNING uid, role',
      [username, hashedPassword, role]
    );
    return {
      statusCode: 201,
      body: JSON.stringify(result.rows[0]),
    };
  } catch (error) {
    // This error code (23505) fires if the 'uid' (username) already exists
    if (error.code === '23505') {
      return { statusCode: 409, body: 'This username is already in use.' };
    }
    return { statusCode: 500, body: 'Server error.' };
  }
};

