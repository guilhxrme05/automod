
/*const { Pool } = require('pg');
require('dotenv').config({ path: __dirname + '/../../.env' });


const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
});

module.exports = {
  query: (text, params) => pool.query(text, params),
};*/

const { Pool } = require('pg');

// Esta linha vai ler a variável de ambiente correta
const connectionString = process.env.DATABASE_URL;

let sslConfig = undefined;

// O Render define NODE_ENV=production automaticamente
if (process.env.NODE_ENV === 'production') {
  console.log("A executar em modo de produção (Render), a ativar SSL.");
  sslConfig = {
    ssl: {
      rejectUnauthorized: false
    }
  };
}

const pool = new Pool({
  connectionString: connectionString,
  ...sslConfig // Adiciona o SSL se estiver em produção
});

module.exports = {
  query: (text, params) => pool.query(text, params),
};
