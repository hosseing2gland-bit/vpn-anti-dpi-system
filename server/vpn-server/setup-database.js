#!/usr/bin/env node
const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.DB_USER || 'vpnuser',
  password: process.env.DB_PASSWORD || 'yourpassword',
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'vpndb'
});

async function setupDatabase() {
  console.log('📦 Setting up database...');

  try {
    // Drop existing tables
    await pool.query('DROP TABLE IF EXISTS sessions CASCADE');
    await pool.query('DROP TABLE IF EXISTS users CASCADE');
    console.log('✅ Dropped existing tables');

    // Create users table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(64) UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        email VARCHAR(255),
        role VARCHAR(32) DEFAULT 'user',
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Created users table');

    // Create sessions table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS sessions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        server_ip VARCHAR(45),
        client_ip VARCHAR(45),
        protocol VARCHAR(32),
        status VARCHAR(32),
        bandwidth_used BIGINT DEFAULT 0,
        connected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        disconnected_at TIMESTAMP
      )
    `);
    console.log('✅ Created sessions table');

    // Insert test user
    await pool.query(`
      INSERT INTO users (username, password_hash, email, role) 
      VALUES ('admin', 'admin123', 'admin@vpn.local', 'admin'),
             ('arash', 'arash', 'arash@vpn.local', 'user')
      ON CONFLICT (username) DO NOTHING
    `);
    console.log('✅ Inserted test users (admin/admin123, arash/arash)');

    // Verify
    const result = await pool.query('SELECT * FROM users');
    console.log(`📈 Total users: ${result.rows.length}`);
    console.log(result.rows);

    console.log('\n✨ Database setup complete!');
  } catch (error) {
    console.error('❌ Database setup error:', error.message);
  } finally {
    await pool.end();
  }
}

setupDatabase();
