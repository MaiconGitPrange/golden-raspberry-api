const sqlite3 = require('sqlite3').verbose();

const initDatabase = async() => {
    return new Promise((resolve, reject) => {
        const db = new sqlite3.Database(':memory:', (err) => {
            if (err) {
                reject(err);
            } else {
                // Criação da tabela films
                db.run(`
                    CREATE TABLE IF NOT EXISTS films (
                    year INT,
                    title VARCHAR(255),
                    studios VARCHAR(255),
                    producer_name VARCHAR(255),
                    winner BOOLEAN
                    )
                `);
                resolve(db);
            }
        });
    });
};

module.exports = { initDatabase };