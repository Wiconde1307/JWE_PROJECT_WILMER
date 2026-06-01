🔓 🔐 JOSE DECRYPTOR

🚀 Lambda function que recibe un token JWE (JSON Web Encryption) y retorna el payload JSON desencriptado, usando criptografía asimétrica RSA.

🧭 🏗️ ARQUITECTURA DEL SISTEMA
┌──────────────────────────────────────────────────────────┐
│                     🔐 jwe-project                      │
│                                                          │
│   ┌─────────────────┐         ┌──────────────────────┐  │
│   │ 🔐 encryptor    │         │ 🔓 decryptor         │  │
│   │                 │         │                      │  │
│   │ payload JSON    │──JWE──► │ payload JSON        │  │
│   │ + public.pem    │         │ + private.pem       │  │
│   └─────────────────┘         └──────────────────────┘  │
│                                                          │
│   keys/public.pem  ◄── RSA PAIR ──► keys/private.pem   │
└──────────────────────────────────────────────────────────┘
🔬 ⚙️ ALGORITMOS CRIPTOGRÁFICOS
🔑 Parámetro	⚙️ Valor	📌 Descripción
alg	RSA-OAEP-256	Descifra clave de encriptación
enc	A256GCM	Descifra contenido del token
📁 📦 ESTRUCTURA DEL PROYECTO
jose-decryptor/
├── 📁 .kiro/
│   └── 📁 specs/
│       ├── 📄 requirements.md
│       ├── 📄 design.md
│       └── 📄 tasks.md
│
├── 📁 src/
│   ├── 📄 handler.js
│   └── 📄 decryptor.js
│
├── 📁 tests/
│   └── 📄 decryptor.test.js
│
├── ⚙️ jest.config.js
└── 📦 package.json
📚 📌 DEPENDENCIAS
📦 Paquete	🔢 Versión	🎯 Uso
jose	^6.2.3	Desencriptación JWE
jest	^30.4.2	Pruebas unitarias
⚡ 🚀 INSTALACIÓN
cd jose-decryptor
npm install
▶️ 🔓 USO LOCAL

📥 Entrada esperada:

{
  "token": "eyJhbGciOiJSU0EtT0FFUC0yNTYiLCJlbmMiOiJBMjU2R0NNIn0..."
}
✅ 📤 RESPUESTA EXITOSA (200)
{
  "statusCode": 200,
  "body": "{\"payload\":{\"userId\":\"123\",\"role\":\"admin\"}}"
}
❌ ⚠️ ERRORES DEL SISTEMA
🚫 Payload inválido (400)
{
  "statusCode": 400,
  "body": "{\"error\":\"Token inválido\"}"
}
💥 Error interno (500)
{
  "statusCode": 500,
  "body": "{\"error\":\"Error al desencriptar el token\"}"
}
🧪 🧾 PRUEBAS UNITARIAS
▶️ Ejecutar tests
npm test
📊 Casos de prueba
🧪 Test	🎯 Escenario	✅ Resultado esperado
✔ Happy path	Token válido	statusCode: 200
❌ Error input	Token null	statusCode: 400
💥 Crypto fail	Token corrupto	statusCode: 500
🧾 Código de pruebas
import { handler } from '../src/handler.js';

describe('🔓 jose-decryptor', () => {

  test('✔ debe desencriptar token válido', async () => {
    const response = await handler({
      token: 'mock-valid-jwe'
    });

    expect(response.statusCode).toBe(200);

    const body = JSON.parse(response.body);
    expect(body.payload).toBeDefined();
  });

  test('❌ debe rechazar token inválido', async () => {
    const response = await handler({ token: null });
    expect(response.statusCode).toBe(400);
  });

});
📥 📤 EVIDENCIA DE FUNCIONAMIENTO
📥 Input
{
  "token": "eyJhbGciOi..."
}
📤 Output
{
  "payload": {
    "nombre": "Wilmer",
    "rol": "admin"
  }
}

# Capturas de test e integracion

![Tests](docs/images/npm-test-decryptor.png)
![integracion](docs/images/test-de-integracion.png)
