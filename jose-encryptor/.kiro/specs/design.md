# Design — jose-encryptor

## Visión General

La función `jose-encryptor` implementa el patrón **Encrypt-Only Lambda**: recibe datos en claro y devuelve un token opaco. Utiliza criptografía asimétrica RSA para garantizar que solo la lambda `jose-decryptor` (con acceso a la llave privada) pueda revertir el proceso.

---

## Arquitectura

```
API Gateway (POST /encrypt)
        │
        ▼
┌─────────────────────────┐
│      jose-encryptor      │
│                         │
│  event.payload (JSON)   │
│         │               │
│  Validación de entrada  │
│         │               │
│  Carga public.pem       │
│         │               │
│  importSPKI()           │
│         │               │
│  CompactEncrypt()       │
│    alg: RSA-OAEP-256    │
│    enc: A256GCM         │
│         │               │
│  JWE Compact Token      │
└─────────────────────────┘
        │
        ▼
  { statusCode: 200, body: { token: "eyJ..." } }
```

---

## Estructura de Archivos

```
jose-encryptor/
├── .kiro/
│   └── specs/
│       ├── requirements.md   ← Requerimientos funcionales y no funcionales
│       ├── design.md         ← Este archivo
│       └── tasks.md          ← Tareas de implementación
├── src/
│   └── handler.js            ← Lógica principal de la Lambda
├── tests/
│   └── encryptor.test.js     ← Pruebas unitarias con Jest
├── jest.config.js            ← Configuración Jest para ES Modules
└── package.json
```

---

## Diseño del Handler

### Firma

```javascript
export const handler = async (event) => { ... }
```

### Flujo de Ejecución

```
1. Extraer event.payload
2. Validar que payload exista y sea objeto → 400 si falla
3. Leer keys/public.pem con fs.readFileSync
4. importSPKI(pem, 'RSA-OAEP-256') → CryptoKey
5. new CompactEncrypt(TextEncoder(JSON.stringify(payload)))
     .setProtectedHeader({ alg: 'RSA-OAEP-256', enc: 'A256GCM' })
     .encrypt(publicKey)
     → jwe string
6. Retornar { statusCode: 200, body: JSON.stringify({ token: jwe }) }
7. catch(error) → { statusCode: 500, body: { error: error.message } }
```

---

## Formato del Token JWE

El token resultante sigue el estándar **JWE Compact Serialization** (RFC 7516):

```
BASE64URL(JWE Protected Header)
  . BASE64URL(JWE Encrypted Key)
  . BASE64URL(JWE Initialization Vector)
  . BASE64URL(JWE Ciphertext)
  . BASE64URL(JWE Authentication Tag)
```

**Header decodificado:**
```json
{
  "alg": "RSA-OAEP-256",
  "enc": "A256GCM"
}
```

---

## Algoritmos Criptográficos

| Parámetro | Valor         | Descripción                                          |
|-----------|---------------|------------------------------------------------------|
| `alg`     | RSA-OAEP-256  | Encriptación de la Content Encryption Key (CEK) con RSA |
| `enc`     | A256GCM       | Encriptación del contenido con AES-256-GCM           |

**¿Por qué RSA-OAEP-256 + A256GCM?**
- RSA-OAEP-256 es el estándar recomendado por NIST para encriptación asimétrica.
- AES-256-GCM provee confidencialidad + autenticación (AEAD) en un solo paso.
- La combinación es compatible con el estándar JOSE (RFC 7518).

---

## Gestión de Llaves

```
jwe-project/
└── keys/
    ├── public.pem   ← Incluida en el deployment package de jose-encryptor
    └── private.pem  ← Solo en jose-decryptor / NO se sube al repositorio
```

La ruta se resuelve dinámicamente usando `__dirname` para compatibilidad con Lambda:
```javascript
path.join(__dirname, '../../keys/public.pem')
```

---

## Contrato de Entrada/Salida

### Input (AWS Lambda Event)
```json
{
  "payload": {
    "userId": "123",
    "role": "admin"
  }
}
```

### Output — Éxito (200)
```json
{
  "statusCode": 200,
  "body": "{\"token\":\"eyJhbGciOiJSU0EtT0FFUC0yNTYiLCJlbmMiOiJBMjU2R0NNIn0...\"}"
}
```

### Output — Error de validación (400)
```json
{
  "statusCode": 400,
  "body": "{\"error\":\"Payload inválido\"}"
}
```

### Output — Error interno (500)
```json
{
  "statusCode": 500,
  "body": "{\"error\":\"<mensaje del error>\"}"
}
```

---

## Decisiones de Diseño

| Decisión | Alternativa considerada | Justificación |
|----------|------------------------|---------------|
| Leer PEM desde archivo | Variables de entorno | Simplifica el deployment local y el testing |
| ES Modules (`import`) | CommonJS (`require`) | Requerido por la librería `jose` v6+ |
| CompactEncrypt | GeneralEncrypt | Compact es más ligero y estándar para APIs REST |
| Validar solo tipo `object` | Validar schema completo | La lambda es agnóstica al contenido del payload |