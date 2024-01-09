const assert = require('assert');
const request = require('supertest');
const { app, dbPromise } = require('../app');

// Função auxiliar para verificar a estrutura esperada
const verifyStructure = (data) => {
    assert.strictEqual(data.length, 1);
    const item = data[0];

    assert.strictEqual(typeof item.producer, 'string');
    assert.strictEqual(typeof item.interval, 'number');
    assert.strictEqual(typeof item.previousWin, 'number');
    assert.strictEqual(typeof item.followingWin, 'number');
};

before(async() => {
    try {
        // Inicializa o banco de dados antes de iniciar os testes
        await dbPromise;
        console.log('Banco de dados inicializado.');
    } catch (err) {
        console.error('Erro ao inicializar o banco de dados:', err);
        throw err;
    }
});

describe('Testes da API', () => {
    it('Deve retornar o produtor com maior intervalo entre dois prêmios consecutivos', async() => {
        const res = await request(app)
            .get('/producers/max-interval')
            .expect('Content-Type', /json/)
            .expect(200);

        verifyStructure(res.body.max);
    });

    it('Deve retornar o produtor que obteve dois prêmios mais rápido', async() => {
        const res = await request(app)
            .get('/producers/min-interval')
            .expect('Content-Type', /json/)
            .expect(200);

        if (res.body.min && res.body.min.length > 0) {
            verifyStructure(res.body.min);
        } else {
            throw new Error('O retorno não possui a estrutura esperada.');
        }
    });
});