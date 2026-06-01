import { handler as encryptHandler } from '../../jose-encryptor/src/handler.js';
import { handler as decryptHandler } from '../src/handler.js';

describe('jose-decryptor', () => {

  test('debe desencriptar un JWE válido', async () => {

    const encrypted = await encryptHandler({
      payload: {
        nombre: 'Wilmer'
      }
    });

    const token = JSON.parse(encrypted.body).token;

    const response = await decryptHandler({
      token
    });

    expect(response.statusCode).toBe(200);

    const payload = JSON.parse(response.body);

    expect(payload.nombre).toBe('Wilmer');

  });

  test('debe rechazar token vacío', async () => {

    const response = await decryptHandler({
      token: null
    });

    expect(response.statusCode).toBe(400);

  });

});