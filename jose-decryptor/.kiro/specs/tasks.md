# Tasks — jose-decryptor

## Metodología: Spec-Driven Development (SDD)

Este archivo documenta las tareas de implementación derivadas de los requerimientos (`requirements.md`) y el diseño (`design.md`). Cada tarea está trazable a uno o más requerimientos funcionales.

---

## Estado General

| Tarea  | Descripción                               | Estado      | RF Relacionado |
|--------|-------------------------------------------|-------------|----------------|
| T-01   | Inicializar proyecto Node.js              | ✅ Completado | RNF-04, RNF-05 |
| T-02   | Reutilizar par de llaves RSA              | ✅ Completado | RF-02          |
| T-03   | Implementar validación de token           | ✅ Completado | RF-04.1        |
| T-04   | Implementar lógica de desencriptación JWE | ✅ Completado | RF-01, RF-02   |
| T-05   | Implementar decodificación del plaintext  | ✅ Completado | RF-03          |
| T-06   | Implementar respuesta estructurada        | ✅ Completado | RF-03          |
| T-07   | Implementar manejo de errores             | ✅ Completado | RF-04.2        |
| T-08   | Escribir pruebas unitarias (happy path)   | ✅ Completado | RF-01, RF-03   |
| T-09   | Escribir pruebas unitarias (error path)   | ✅ Completado | RF-04.1        |
| T-10   | Escribir test de integración              | ✅ Completado | RF-01, RF-02   |
| T-11   | Configurar Jest para ES Modules           | ✅ Completado | RNF-04         |
| T-12   | Documentar README con evidencia           | ✅ Completado | —              |
| T-13   | Desplegar en AWS Lambda                   | ✅ Completado | RNF-01         |

---

## Detalle de Tareas

### T-01 — Inicializar proyecto Node.js
**Descripción:** Crear el `package.json` con soporte para ES Modules y dependencias necesarias.

**Acciones realizadas:**
- `npm init -y`
- Configurar `"type": "module"` en `package.json`
- Instalar dependencia: `npm install jose`
- Instalar devDependency: `npm install --save-dev jest`

**Archivo resultante:** `package.json`

---

### T-02 — Reutilizar par de llaves RSA
**Descripción:** Utilizar el par de llaves RSA generado para `jose-encryptor`. La llave privada se ubica en `keys/private.pem`.

**Consideraciones:**
- `private.pem` está en `.gitignore`.
- Solo `jose-decryptor` tiene acceso a la llave privada.
- La llave pública no es necesaria en este módulo.

---

### T-03 — Implementar validación de token
**Descripción:** Verificar que `event.token` exista y sea truthy antes de procesar.

**Criterio de completitud:** El handler retorna `statusCode: 400` si el token es `null`, `undefined` o string vacío.

**Código implementado:**
```javascript
if (!token) {
  return { statusCode: 400, body: JSON.stringify({ error: 'Token JWE requerido' }) };
}
```

---

### T-04 — Implementar lógica de desencriptación JWE
**Descripción:** Cargar la llave privada y desencriptar el token usando `compactDecrypt` de la librería `jose`.

**Criterio de completitud:** El handler desencripta correctamente tokens generados por `jose-encryptor`.

**Código implementado:**
```javascript
const privateKey = await importPKCS8(privateKeyPem, 'RSA-OAEP-256');
const { plaintext } = await compactDecrypt(token, privateKey);
```

---

### T-05 — Implementar decodificación del plaintext
**Descripción:** Convertir el buffer `plaintext` a string JSON y parsearlo como objeto.

**Criterio de completitud:** El payload retornado es idéntico al enviado originalmente al encryptor.

**Código implementado:**
```javascript
const payload = JSON.parse(new TextDecoder().decode(plaintext));
```

---

### T-06 — Implementar respuesta estructurada
**Descripción:** Retornar la respuesta en formato AWS Lambda con `statusCode: 200` y el payload en el body.

**Criterio de completitud:** `{ statusCode: 200, body: JSON.stringify(payload) }`.

---

### T-07 — Implementar manejo de errores
**Descripción:** Capturar excepciones con `try/catch` y retornar `statusCode: 500`.

**Criterio de completitud:** Tokens malformados o firmados con llave incorrecta retornan 500.

---

### T-08 — Prueba unitaria: Happy Path
**Descripción:** Verificar el flujo completo encriptar → desencriptar usando ambos handlers.

**Test implementado:** `tests/decryptor.test.js`
```javascript
test('debe desencriptar un JWE válido', async () => {
  const encrypted = await encryptHandler({ payload: { nombre: 'Wilmer' } });
  const token = JSON.parse(encrypted.body).token;
  const response = await decryptHandler({ token });
  expect(response.statusCode).toBe(200);
  expect(JSON.parse(response.body).nombre).toBe('Wilmer');
});
```

---

### T-09 — Prueba unitaria: Error Path
**Descripción:** Verificar que un token nulo retorna error 400.

**Test implementado:** `tests/decryptor.test.js`
```javascript
test('debe rechazar token vacío', async () => {
  const response = await decryptHandler({ token: null });
  expect(response.statusCode).toBe(400);
});
```

---

### T-10 — Test de Integración
**Descripción:** Verificar el flujo completo end-to-end entre `jose-encryptor` y `jose-decryptor`.

**Archivo:** `src/integration-test.js`

**Criterio de completitud:** El payload desencriptado es idéntico al payload original.

---

### T-11 — Configurar Jest para ES Modules
**Descripción:** Configurar `jest.config.js` para que Jest soporte `import/export`.

**Archivo:** `jest.config.js`
```javascript
export default {
  testEnvironment: 'node',
  transform: {}
};
```

---

### T-12 — Documentar README
**Descripción:** Crear `README.md` con arquitectura, instalación, uso, pruebas y evidencia visual.

**Criterio de completitud:** README incluye capturas de pantalla de tests y del payload desencriptado.

---

### T-13 — Desplegar en AWS Lambda
**Descripción:** Empaquetar y desplegar la función en AWS Lambda con Node.js 20.x.

**Acciones:**
1. Crear ZIP con `src/`, `keys/private.pem`, `node_modules/`, `package.json`
2. Crear función Lambda en consola AWS
3. Configurar handler: `src/handler.handler`
4. Verificar con evento de prueba desde la consola

**⚠️ Importante:** En producción, migrar `private.pem` a AWS Secrets Manager.