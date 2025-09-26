const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

exports.handler = async (event) => {
  // This function should be protected in a real app to ensure only admins can call it.
  // For now, it's open but this is a critical security consideration.
  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    // Select only the non-sensitive user information
    const { rows } = await pool.query('SELECT uid, role, created_at FROM users ORDER BY created_at DESC');
    
    return {
      statusCode: 200,
      body: JSON.stringify(rows),
    };

  } catch (error) {
    console.error(error);
    return {
      statusCode: 500,
      body: 'An error occurred while fetching users.',
    };
  }
};

