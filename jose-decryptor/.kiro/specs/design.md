# Design — jose-decryptor

## Visión General

La función `jose-decryptor` implementa el patrón **Decrypt-Only Lambda**: recibe un token JWE opaco y devuelve el payload original en claro. Es la contraparte de `jose-encryptor` y tiene acceso exclusivo a la llave privada RSA.

---

## Arquitectura

```
API Gateway (POST /decrypt)
        │
        ▼
┌─────────────────────────┐
│      jose-decryptor      │
│                         │
│  event.token (string)   │
│         │               │
│  Validación de entrada  │
│         │               │
│  Carga private.pem      │
│         │               │
│  importPKCS8()          │
│         │               │
│  compactDecrypt()       │
│    alg: RSA-OAEP-256    │
│         │               │
│  TextDecoder + JSON     │
│         │               │
│  payload (JSON)         │
└─────────────────────────┘
        │
        ▼
  { statusCode: 200, body: { ...payload } }
```

---

## Estructura de Archivos

```
jose-decryptor/
├── .kiro/
│   └── specs/
│       ├── requirements.md    ← Requerimientos funcionales y no funcionales
│       ├── design.md          ← Este archivo
│       └── tasks.md           ← Tareas de implementación
├── src/
│   ├── handler.js             ← Lógica principal de la Lambda
│   └── integration-test.js    ← Test de integración encryptor ↔ decryptor
├── tests/
│   └── decryptor.test.js      ← Pruebas unitarias con Jest
├── jest.config.js             ← Configuración Jest para ES Modules
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
1. Extraer event.token
2. Validar que token exista (truthy) → 400 si falla
3. Leer keys/private.pem con fs.readFileSync
4. importPKCS8(pem, 'RSA-OAEP-256') → CryptoKey
5. compactDecrypt(token, privateKey) → { plaintext }
6. new TextDecoder().decode(plaintext) → string JSON
7. JSON.parse(string) → objeto payload
8. Retornar { statusCode: 200, body: JSON.stringify(payload) }
9. catch(error) → { statusCode: 500, body: { error: error.message } }
```

---

## Test de Integración

El archivo `src/integration-test.js` prueba el flujo completo end-to-end:

```
jose-encryptor.handler({ payload }) 
  → JWE token
  → jose-decryptor.handler({ token })
  → payload original
```

Este test valida que ambas lambdas trabajen correctamente en conjunto con el mismo par de llaves.

---

## Algoritmos Criptográficos

| Parámetro | Valor         | Descripción                                              |
|-----------|---------------|----------------------------------------------------------|
| `alg`     | RSA-OAEP-256  | Desencriptación de la Content Encryption Key (CEK)       |
| `enc`     | A256GCM       | Desencriptación del contenido (inferido del JWE header)  |

El algoritmo `enc` no se especifica explícitamente en la desencriptación: `compactDecrypt` lo lee del header protegido del token JWE automáticamente.

---

## Gestión de Llaves

```
jwe-project/
└── keys/
    ├── public.pem   ← Solo en jose-encryptor
    └── private.pem  ← Solo en jose-decryptor / NO se sube al repositorio
```

La ruta se resuelve dinámicamente:
```javascript
path.join(__dirname, '../../keys/private.pem')
```

**Consideración de seguridad:** En producción, la llave privada debería almacenarse en **AWS Secrets Manager** o **AWS Parameter Store** (SSM) en lugar de un archivo PEM incluido en el ZIP.

---

## Contrato de Entrada/Salida

### Input (AWS Lambda Event)
```json
{
  "token": "eyJhbGciOiJSU0EtT0FFUC0yNTYiLCJlbmMiOiJBMjU2R0NNIn0..."
}
```

### Output — Éxito (200)
```json
{
  "statusCode": 200,
  "body": "{\"userId\":\"123\",\"role\":\"admin\"}"
}
```

### Output — Token ausente (400)
```json
{
  "statusCode": 400,
  "body": "{\"error\":\"Token JWE requerido\"}"
}
```

### Output — Token inválido / llave incorrecta (500)
```json
{
  "statusCode": 500,
  "body": "{\"error\":\"decryption operation failed\"}"
}
```

---

## Decisiones de Diseño

| Decisión | Alternativa considerada | Justificación |
|----------|------------------------|---------------|
| Leer PEM desde archivo | AWS Secrets Manager | Simplifica el desarrollo local y las pruebas unitarias |
| Retornar payload directo en body | Envolver en `{ data: payload }` | Mantiene compatibilidad con el contrato definido |
| Validar solo existencia del token | Validar formato JWE | La librería `jose` maneja la validación de formato internamente |
| ES Modules (`import`) | CommonJS (`require`) | Consistencia con `jose-encryptor` y requerimiento de `jose` v6+ |
| compactDecrypt | generalDecrypt | El encryptor usa Compact Serialization, debe usarse el método correspondiente |

---

## Consideraciones de Seguridad

1. **Llave privada:** No debe incluirse en repositorios públicos. Usar `.gitignore`.
2. **Logs:** El payload desencriptado no debe loguearse en CloudWatch si contiene datos sensibles.
3. **Rotación de llaves:** El par RSA debe rotarse periódicamente en producción.
4. **IAM:** La Lambda debe tener permisos mínimos necesarios (principio de mínimo privilegio).