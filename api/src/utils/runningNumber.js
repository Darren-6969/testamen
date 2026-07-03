// src/utils/runningNumber.js
const { getConnection } = require('../db/connectionManager');

const TABLE = 'running_no';

/**
 * Fetch the current number for a given key (e.g. 'invoice'),
 * optionally initializing it if missing.
 */
async function getCurrent(key) {
    const mysqlPool = getConnection('mysql');
    if (!mysqlPool) throw new Error('Mysql not available for running numbers');
    const [rows] = await mysqlPool.query(
        `SELECT prefix,next_no,digit_no FROM ${TABLE} WHERE doc_name = ?`,
        [key]
    );

    if (rows.length) {

        // generate a formal invoice number
        let prefix = rows[0].prefix;
        let next_no = rows[0].next_no;
        let digit_no = rows[0].digit_no;

        let invoice_no = prefix + next_no.toString().padStart(digit_no, '0');
        return invoice_no;
    } else {
        // initialize at 0
        await mysqlPool.query(
            `INSERT INTO ${TABLE}(doc_name, next_no, digit_no) VALUES(?, ?, ?)`,
            [key, 1, 5]
        );
        return 0;
    }
}

/**
 * Atomically increment and return the next running number.
 */
async function getCurrentAndUpdate(key) {
    const mysqlPool = getConnection('mysql');
    if (!mysqlPool) throw new Error('Mysql not available for running numbers');

    const [rows] = await mysqlPool.query(
        `SELECT prefix,next_no,digit_no FROM ${TABLE} WHERE doc_name = ?`,
        [key]
    );

    if (rows.length) {

        // generate a formal invoice number
        let prefix = rows[0].prefix;
        let next_no = rows[0].next_no;
        let digit_no = rows[0].digit_no;

        let invoice_no = prefix + next_no.toString().padStart(digit_no, '0');
         await mysqlPool.query(
            `UPDATE ${TABLE}
        SET next_no = next_no + 1
        WHERE doc_name = ?`,
            [key]
        );
        return invoice_no;
    } else {
        // initialize at 0
        await mysqlPool.query(
            `INSERT INTO ${TABLE}(doc_name, next_no, digit_no) VALUES(?, ?, ?)`,
            [key, 1, 5]
        );
        return 0;
    }



}

module.exports = { getCurrent, getCurrentAndUpdate };
