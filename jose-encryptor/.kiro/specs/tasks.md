# Tasks — jose-encryptor

## Metodología: Spec-Driven Development (SDD)

Este archivo documenta las tareas de implementación derivadas de los requerimientos (`requirements.md`) y el diseño (`design.md`). Cada tarea está trazable a uno o más requerimientos funcionales.

---

## Estado General

| Tarea  | Descripción                              | Estado      | RF Relacionado |
|--------|------------------------------------------|-------------|----------------|
| T-01   | Inicializar proyecto Node.js             | ✅ Completado | RNF-04, RNF-05 |
| T-02   | Generar par de llaves RSA                | ✅ Completado | RF-02          |
| T-03   | Implementar validación de payload        | ✅ Completado | RF-04.1        |
| T-04   | Implementar lógica de encriptación JWE   | ✅ Completado | RF-01, RF-02   |
| T-05   | Implementar respuesta estructurada       | ✅ Completado | RF-03          |
| T-06   | Implementar manejo de errores            | ✅ Completado | RF-04.2        |
| T-07   | Escribir pruebas unitarias (happy path)  | ✅ Completado | RF-01, RF-03   |
| T-08   | Escribir pruebas unitarias (error path)  | ✅ Completado | RF-04.1        |
| T-09   | Configurar Jest para ES Modules          | ✅ Completado | RNF-04         |
| T-10   | Documentar README con evidencia          | ✅ Completado | —              |
| T-11   | Desplegar en AWS Lambda                  | ✅ Completado | RNF-01         |

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

### T-02 — Generar par de llaves RSA
**Descripción:** Generar el par de llaves RSA-2048 en formato PEM para usar con el algoritmo RSA-OAEP-256.

**Acciones realizadas:**
```bash
openssl genrsa -out keys/private.pem 2048
openssl rsa -in keys/private.pem -pubout -out keys/public.pem
```

**Consideraciones de seguridad:**
- `private.pem` está en `.gitignore` y nunca se sube al repositorio.
- `public.pem` se incluye en el deployment package del encryptor.

---

### T-03 — Implementar validación de payload
**Descripción:** Verificar que `event.payload` exista y sea un objeto antes de procesar.

**Criterio de completitud:** El handler retorna `statusCode: 400` si el payload es `null` o no es un objeto.

**Código implementado:**
```javascript
if (!payload || typeof payload !== 'object') {
  return { statusCode: 400, body: JSON.stringify({ error: 'Payload inválido' }) };
}
```

---

### T-04 — Implementar lógica de encriptación JWE
**Descripción:** Cargar la llave pública y encriptar el payload usando `CompactEncrypt` de la librería `jose`.

**Criterio de completitud:** El handler genera un token JWE válido con `alg: RSA-OAEP-256` y `enc: A256GCM`.

**Código implementado:**
```javascript
const publicKey = await importSPKI(publicKeyPem, 'RSA-OAEP-256');
const jwe = await new CompactEncrypt(
  new TextEncoder().encode(JSON.stringify(payload))
).setProtectedHeader({ alg: 'RSA-OAEP-256', enc: 'A256GCM' })
 .encrypt(publicKey);
```

---

### T-05 — Implementar respuesta estructurada
**Descripción:** Retornar la respuesta en formato AWS Lambda con `statusCode` y `body`.

**Criterio de completitud:** La respuesta exitosa contiene `{ statusCode: 200, body: '{"token":"..."}' }`.

---

### T-06 — Implementar manejo de errores
**Descripción:** Capturar excepciones con `try/catch` y retornar `statusCode: 500`.

**Criterio de completitud:** Cualquier error inesperado retorna 500 sin exponer stack traces.

---

### T-07 — Prueba unitaria: Happy Path
**Descripción:** Verificar que un payload válido genera un token JWE.

**Test implementado:** `tests/encryptor.test.js`
```javascript
test('debe generar un JWE válido', async () => {
  const response = await handler({ payload: { nombre: 'Wilmer' } });
  expect(response.statusCode).toBe(200);
  expect(JSON.parse(response.body).token).toBeDefined();
});
```

---

### T-08 — Prueba unitaria: Error Path
**Descripción:** Verificar que un payload inválido retorna error 400.

**Test implementado:** `tests/encryptor.test.js`
```javascript
test('debe rechazar payload inválido', async () => {
  const response = await handler({ payload: null });
  expect(response.statusCode).toBe(400);
});
```

---

### T-09 — Configurar Jest para ES Modules
**Descripción:** Configurar `jest.config.js` para que Jest soporte `import/export`.

**Archivo:** `jest.config.js`
```javascript
export default {
  testEnvironment: 'node',
  transform: {}
};
```

**Script en package.json:**
```json
"test": "node --experimental-vm-modules ./node_modules/jest/bin/jest.js"
```

---

### T-10 — Documentar README
**Descripción:** Crear `README.md` con arquitectura, instalación, uso, pruebas y evidencia visual.

**Criterio de completitud:** README incluye capturas de pantalla de tests y del token JWE generado.

---

### T-11 — Desplegar en AWS Lambda
**Descripción:** Empaquetar y desplegar la función en AWS Lambda con Node.js 20.x.

**Acciones:**
1. Crear ZIP con `src/`, `keys/public.pem`, `node_modules/`, `package.json`
2. Crear función Lambda en consola AWS
3. Configurar handler: `src/handler.handler`
4. Verificar con evento de prueba desde la consola