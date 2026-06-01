import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { importPKCS8, compactDecrypt } from 'jose';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const handler = async (event) => {
  try {
    const token = event.token;

    if (!token) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: 'Token JWE requerido'
        })
      };
    }

    const privateKeyPem = fs.readFileSync(
     path.join(process.env.LAMBDA_TASK_ROOT, 'keys/private.pem'),
     'utf8'
    );

    const privateKey = await importPKCS8(
      privateKeyPem,
      'RSA-OAEP-256'
    );

    const { plaintext } = await compactDecrypt(
      token,
      privateKey
    );

    const payload = JSON.parse(
      new TextDecoder().decode(plaintext)
    );

    return {
      statusCode: 200,
      body: JSON.stringify(payload)
    };

  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: error.message
      })
    };
  }
};