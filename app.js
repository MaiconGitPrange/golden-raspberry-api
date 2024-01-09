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

// Leitura do arquivo CSV e inserção de dados no banco de dados
// Leitura do arquivo CSV e inserção de dados no banco de dados
fs.createReadStream('./movielist.csv', { encoding: 'latin1' }) // Adicionado encoding
    .pipe(csv({ separator: ';' }))
    .on('data', async(row) => {
        const db = await dbPromise;

        // Converta todos os campos para strings
        const stringifiedRow = Object.fromEntries(
            Object.entries(row).map(([key, value]) => [key, String(value)])
        );

        const result = await new Promise((resolve, reject) => {
            db.run('INSERT INTO films (year, title, studios, producer_name, winner) VALUES (?, ?, ?, ?, ?)', [
                parseInt(stringifiedRow.year, 10), // Converte para número inteiro
                stringifiedRow.title.toString().trim(), // Remove espaços em branco no início e no final
                stringifiedRow.studios.toString().trim(),
                stringifiedRow.producers.toString().trim(),
                stringifiedRow.winner === 'yes' ? 1 : 0, // Converte 'yes' para 1, 'no' para 0
            ], function(err) {
                if (err) {
                    console.error('Erro ao inserir dados:', err);
                    reject(err);
                } else {
                    resolve(this.lastID);
                }
            });
        });
    })
    .on('end', async() => {
        console.log('CSV file successfully processed and data inserted into the database.');

        // Verifique os dados inseridos
        const db = await dbPromise;
        db.all('SELECT * FROM films', (err, rows) => {
            if (err) {
                console.error('Erro ao verificar dados inseridos:', err);
            } else {
                console.log('Dados inseridos!');
            }
        });
    });


// Rota para obter o produtor com maior intervalo entre dois prêmios consecutivos
app.get('/producers/max-interval', async(req, res, next) => {
    try {
        const db = await dbPromise;

        const results = await new Promise((resolve, reject) => {
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

        res.json({ max: results });
    } catch (error) {
        next(error);
    }
});

// Rota para obter o produtor que obteve dois prêmios mais rápido
app.get('/producers/min-interval', async(req, res, next) => {
    try {
        const db = await dbPromise;

        const results = await new Promise((resolve, reject) => {
            db.all(`SELECT producer_name AS producer,
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
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });

        res.json({ min: results });
    } catch (error) {
        next(error);
    }
});

// Se o script estiver sendo executado diretamente, inicie o servidor
if (require.main === module) {
    const PORT = process.env.PORT || 3000;
    const server = app.listen(PORT, () => {
        console.log(`Servidor iniciado na porta ${PORT}`);
    });

    module.exports = { app, dbPromise, server };
} else {
    // Se está sendo importado como módulo (por exemplo, em testes), exporte apenas app e dbPromise
    module.exports = { app, dbPromise };
}