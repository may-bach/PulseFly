const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

// --- Configuration ---
// The details for your root administrator account.
const ADMIN_USERNAME = 'izumi';
const ADMIN_PASSWORD = 'kagek1'; // Use a strong, unique password in a real application
const ADMIN_ROLE = 'Administrator';
// ---------------------

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

exports.handler = async () => {
  try {
    // Check if the admin user already exists using the 'uid' column
    const { rows } = await pool.query('SELECT uid FROM users WHERE uid = $1', [ADMIN_USERNAME]);

    if (rows.length > 0) {
      return {
        statusCode: 200,
        body: `Admin user '${ADMIN_USERNAME}' already exists. No action taken.`,
      };
    }

    // If the admin does not exist, create it
    const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 10);

    // Insert the new admin user, mapping username to the 'uid' column
    await pool.query(
      'INSERT INTO users (uid, password_hash, role) VALUES ($1, $2, $3)',
      [ADMIN_USERNAME, hashedPassword, ADMIN_ROLE]
    );

    return {
      statusCode: 201,
      body: `Successfully created root admin user '${ADMIN_USERNAME}'. You can now log in. It is recommended to delete this function from your project now.`,
    };

  } catch (error) {
    console.error(error);
    return {
      statusCode: 500,
      body: 'An error occurred while seeding the admin user.',
    };
  }
};

