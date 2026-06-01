import { handler as encryptHandler } from '../../jose-encryptor/src/handler.js';
import { handler as decryptHandler } from './handler.js';

// Generar JWE
const encrypted = await encryptHandler({
  payload: {
    nombre: 'Wilmer',
    curso: 'AWS Lambda'
  }
});

const token = JSON.parse(encrypted.body).token;

console.log('TOKEN GENERADO:');
console.log(token);

// Desencriptar JWE
const decrypted = await decryptHandler({
  token
});

console.log('\nPAYLOAD RECUPERADO:');
console.log(decrypted);