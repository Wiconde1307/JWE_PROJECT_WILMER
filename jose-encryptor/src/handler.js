import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { importSPKI, CompactEncrypt } from 'jose';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const handler = async (event) => {
  try {
    const payload = event.payload;

    if (!payload || typeof payload !== 'object') {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: 'Payload inválido'
        })
      };
    }

    const publicKeyPem = fs.readFileSync(
      path.join(__dirname, '../../keys/public.pem'),
      'utf8'
    );

    const publicKey = await importSPKI(
      publicKeyPem,
      'RSA-OAEP-256'
    );

    const jwe = await new CompactEncrypt(
      new TextEncoder().encode(JSON.stringify(payload))
    )
      .setProtectedHeader({
        alg: 'RSA-OAEP-256',
        enc: 'A256GCM'
      })
      .encrypt(publicKey);

    return {
      statusCode: 200,
      body: JSON.stringify({
        token: jwe
      })
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