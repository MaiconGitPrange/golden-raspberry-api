const express = require('express');
const csv = require('csv-parser');
const fs = require('fs');
const { initDatabase } = require('./database');

const app = express();

const dbPromise = initDatabase();

// Middleware para lidar com erros
const errorHandler = (err, req, res, next) => {
    console.error(err);
    res.status(500).json({ error: 'Internal Server Error' });
};

app.use(errorHandler);

// Inicialização assíncrona do banco de dados
fs.createReadStream('./movielist.csv', { encoding: 'latin1' })
    .pipe(csv({ separator: ';' }))
    .on('data', async(row) => {
        try {
            const db = await dbPromise;

            const result = await new Promise((resolve, reject) => {
                db.run('INSERT INTO films (year, title, studios, producer_name, winner) VALUES (?, ?, ?, ?, ?)', [
                    parseInt(row.year, 10),
                    row.title.trim(),
                    row.studios.trim(),
                    row.producers.trim(),
                    row.winner === 'yes' ? 1 : 0,
                ], function(err) {
                    if (err) {
                        console.error('Erro ao inserir dados:', err);
                        reject(err);
                    } else {
                        resolve({
                            lastID: this.lastID,
                            changes: this.changes,
                        });
                    }
                });
            });

        } catch (err) {
            console.error('Erro ao inserir dados:', err);
        }
    })
    .on('end', () => {
        console.log('CSV file successfully processed and data inserted into the database.');
    });

// Rota para obter o produtor com maior intervalo entre dois prêmios consecutivos
app.get('/producers/intervals', async(req, res, next) => {
    try {
        const db = await dbPromise;

        const minResults = await new Promise((resolve, reject) => {
            db.all(`
          SELECT producer_name AS producer,
                 MIN(year) AS previousWin,
                 MAX(year) AS followingWin,
                 MAX(year) - MIN(year) AS interval
          FROM films
          WHERE winner = 1
          GROUP BY producer_name
          ORDER BY interval ASC
          LIMIT 1
        `, (err, rows) => {
                if (err) {
                    console.error('Erro na consulta min-interval:', err);
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });

        const maxResults = await new Promise((resolve, reject) => {
            db.all(`
          SELECT producer_name AS producer,
                 MIN(year) AS previousWin,
                 MAX(year) AS followingWin,
                 MAX(year) - MIN(year) AS interval
          FROM films
          WHERE winner = 1
          GROUP BY producer_name
          ORDER BY interval DESC
          LIMIT 1
        `, (err, rows) => {
                if (err) {
                    console.error('Erro na consulta max-interval:', err);
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });

        res.json({
            min: minResults,
            max: maxResults,
        });
    } catch (error) {
        next(error);
    }
});

// Exportar 'app' e 'dbPromise'
module.exports = { app, dbPromise };

// Se o script estiver sendo executado diretamente, inicie o servidor
if (require.main === module) {
    const PORT = process.env.PORT || 3000;
    const server = app.listen(PORT, () => {
        console.log(`Servidor iniciado na porta ${PORT}`);
    });

    module.exports = { app, dbPromise, server };
}