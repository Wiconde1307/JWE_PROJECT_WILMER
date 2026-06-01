import { handler } from '../src/handler.js';

describe('jose-encryptor', () => {

  test('debe generar un JWE válido', async () => {

    const response = await handler({
      payload: {
        nombre: 'Wilmer'
      }
    });

    expect(response.statusCode).toBe(200);

    const body = JSON.parse(response.body);

    expect(body.token).toBeDefined();
    expect(typeof body.token).toBe('string');

  });

  test('debe rechazar payload inválido', async () => {

    const response = await handler({
      payload: null
    });

    expect(response.statusCode).toBe(400);

  });

});