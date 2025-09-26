const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ message: 'Method Not Allowed' }) };
  }

  const { username, password } = JSON.parse(event.body);

  if (!username || !password) {
    return { statusCode: 400, body: JSON.stringify({ message: 'Username and password are required.' }) };
  }

  try {
    const { rows } = await pool.query('SELECT uid, password_hash, role FROM users WHERE uid = $1', [username]);
    
    if (rows.length === 0) {
      return { statusCode: 401, body: JSON.stringify({ message: 'Invalid credentials.' }) };
    }

    const user = rows[0];
    const passwordMatch = await bcrypt.compare(password, user.password_hash);

    if (!passwordMatch) {
      return { statusCode: 401, body: JSON.stringify({ message: 'Invalid credentials.' }) };
    }
    
    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Login successful!',
        username: user.uid,
        role: user.role,
      }),
    };

  } catch (error) {
    console.error(error);
    return { statusCode: 500, body: JSON.stringify({ message: 'Server error.' }) };
  }
};

