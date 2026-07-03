require('dotenv').config();
const mysql = require('mysql2/promise');
const { Client: PgClient } = require('pg');
const mongoose = require('mongoose');
const Firebird = require('node-firebird');

const connections = {};

/**
 * Initialize only the enabled databases.
 * Call this once at application startup.
 */
async function initConnections() {
    if (process.env.USE_MYSQL === 'true') {
        connections.mysql = await mysql.createPool({
            host: process.env.MYSQL_HOST,
            port: +process.env.MYSQL_PORT,
            user: process.env.MYSQL_USER,
            password: process.env.MYSQL_PASS,
            database: process.env.MYSQL_DB,
            waitForConnections: true,
            connectionLimit: 10,
        });
        console.log('✅ MySQL connected');
    }
    if (process.env.USE_MYSQL2 === 'true') {
        connections.mysql2 = await mysql.createPool({
            host: process.env.MYSQL2_HOST,
            port: +process.env.MYSQL2_PORT,
            user: process.env.MYSQL2_USER,
            password: process.env.MYSQL2_PASS,
            database: process.env.MYSQL2_DB,
            waitForConnections: true,
            connectionLimit: 10,
        });
        console.log('✅ Second MySQL connected');
    }
    if (process.env.USE_POSTGRES === 'true') {
        const pg = new PgClient({
            host: process.env.PG_HOST,
            port: +process.env.PG_PORT,
            user: process.env.PG_USER,
            password: process.env.PG_PASS,
            database: process.env.PG_DB,
        });
        await pg.connect();
        connections.postgres = pg;
        console.log('✅ PostgreSQL connected');
    }
    if (process.env.USE_POSTGRES2 === 'true') {
        const pg = new PgClient({
            host: process.env.PG_HOST2,
            port: +process.env.PG_PORT2,
            user: process.env.PG_USER2,
            password: process.env.PG_PASS2,
            database: process.env.PG_DB2,
        });
        await pg.connect();
        connections.postgres2 = pg;
        console.log('✅ Second PostgreSQL connected');
    }
    if (process.env.USE_MONGO === 'true') {
        connections.mongo = mongoose.createConnection(process.env.MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('✅ MongoDB connected');
    }
    if (process.env.USE_FIREBIRD === 'true') {
        // Firebird connection options
        const options = {
            host: process.env.FB_HOST,
            port: process.env.FB_PORT,
            database: process.env.FB_DB,
            user: process.env.FB_USER,
            password: process.env.FB_PASS,
            lowercase_keys: false,
            role: null,
            pageSize: 4096,
            retryConnectionInterval: 1000,
            blobAsText: false,
            encoding: 'UTF8',
            // wireCrypt: 'Enabled',
        };

        connections.firebird = {
            options,
            async getConnection() {
            return new Promise((resolve, reject) => {
                Firebird.attach(options, (err, db) => {
                if (err) return reject(err);
                resolve(db);
                });
            });
            }
        };

        console.log('✅ Firebird connection configured');
    }
}

/**
 * Retrieve a named connection.
 * Returns `undefined` if that DB was not enabled.
 */
function getConnection(name) {
    return connections[name];
}

function normalizeSqlForMysql(sql, params) {
    // Replace $1, $2... with ?
    let i = 0;
    const mysqlSql = sql.replace(/\$\d+/g, () => {
        i++;
        return '?';
    });
    return [mysqlSql, params];
}

async function runQuery(db, sql, params = []) {
    // MySQL (mysql2 pool/query)
    if (db.query && db.execute) {
        const [mysqlSql, mysqlParams] = normalizeSqlForMysql(sql, params);
        const [rows] = await db.query(mysqlSql, mysqlParams);
        return rows;
    }

    // Postgres (pg client)
    if (db.constructor.name === "Client") {
        const result = await db.query(sql, params);
        return result.rows;
    }

    // Firebird
    if (db.getConnection) {
        const fb = await db.getConnection();
        return new Promise((resolve, reject) => {
            fb.query(sql, params, (err, result) => {
                fb.detach();
                if (err) return reject(err);
                resolve(result);
            });
        });
    }

    throw new Error("Unsupported database type");
}
module.exports = { initConnections, getConnection, runQuery };
