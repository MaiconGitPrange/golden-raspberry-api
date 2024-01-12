const assert = require('assert');
const request = require('supertest');
const fs = require('fs');
const { app } = require('../app');

describe('Testes da Rota /producers/intervals', () => {
    let originalData;

    before((done) => {
        // Realizar a leitura do arquivo original antes de iniciar os testes
        originalData = [];
        fs.createReadStream('./movielist.csv', { encoding: 'latin1' })
            .pipe(require('csv-parser')({ separator: ';' }))
            .on('data', (row) => {
                originalData.push(row);
            })
            .on('end', () => {
                done();
            });
    });

    it('Deve retornar os produtores com maior e menor intervalo entre dois prêmios consecutivos', async() => {
        // Realizar a requisição à rota /producers/intervals
        const res = await request(app)
            .get('/producers/intervals')
            .expect('Content-Type', /json/)
            .expect(200);

        // Comparar os resultados obtidos com os resultados esperados do arquivo original
        assert.deepStrictEqual(res.body.min, expectedResultMin(originalData));
        assert.deepStrictEqual(res.body.max, expectedResultMax(originalData));
    });
});

// Função auxiliar para calcular o resultado esperado para o intervalo mínimo
const expectedResultMin = (data) => {
    const producersMap = new Map();

    data.forEach((row) => {
        if (row.winner === 'yes') {
            const producer = row.producers.trim();
            const year = parseInt(row.year, 10);

            if (producersMap.has(producer)) {
                const existingData = producersMap.get(producer);
                existingData.followingWin = year;
                existingData.interval = year - existingData.previousWin;
            } else {
                producersMap.set(producer, {
                    producer,
                    previousWin: year,
                    followingWin: year,
                    interval: 0,
                });
            }
        }
    });

    const sortedResults = [...producersMap.values()].sort((a, b) => a.interval - b.interval);

    return sortedResults.slice(0, 1); // Retorna o produtor com o menor intervalo
};

// Função auxiliar para calcular o resultado esperado para o intervalo máximo
const expectedResultMax = (data) => {
    const producersMap = new Map();

    data.forEach((row) => {
        if (row.winner === 'yes') {
            const producer = row.producers.trim();
            const year = parseInt(row.year, 10);

            if (producersMap.has(producer)) {
                const existingData = producersMap.get(producer);
                existingData.followingWin = year;
                existingData.interval = year - existingData.previousWin;
            } else {
                producersMap.set(producer, {
                    producer,
                    previousWin: year,
                    followingWin: year,
                    interval: 0,
                });
            }
        }
    });

    const sortedResults = [...producersMap.values()].sort((a, b) => b.interval - a.interval);

    return sortedResults.slice(0, 1); // Retorna o produtor com o maior intervalo
};