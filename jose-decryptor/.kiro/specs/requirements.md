# Requirements — jose-decryptor

## Descripción General

Lambda function responsable de recibir un token JWE y retornar el payload JSON original desencriptado, utilizando la llave privada RSA correspondiente a la llave pública usada durante la encriptación.

---

## Requerimientos Funcionales

### RF-01 — Recepción del Token JWE
- **Como** consumidor de la API,
- **Quiero** enviar un token JWE al endpoint de desencriptación,
- **Para** obtener el payload original en texto claro.

**Criterios de aceptación:**
- El evento de entrada debe contener una propiedad `token` de tipo `string`.
- El token debe seguir el formato JWE Compact Serialization.
- El handler debe aceptar cualquier token JWE generado por `jose-encryptor`.

---

### RF-02 — Desencriptación JWE
- **Como** sistema que necesita procesar datos protegidos,
- **Quiero** desencriptar el token JWE con la llave privada RSA,
- **Para** acceder al payload original de forma segura.

**Criterios de aceptación:**
- El algoritmo de desencriptación de llave debe ser `RSA-OAEP-256`.
- La llave privada se carga desde el archivo `keys/private.pem`.
- El plaintext resultante se decodifica como JSON.
- Solo tokens generados con la llave pública correspondiente deben desencriptarse exitosamente.

---

### RF-03 — Respuesta Exitosa
- **Como** consumidor,
- **Quiero** recibir el payload desencriptado como objeto JSON,
- **Para** procesarlo directamente sin transformaciones adicionales.

**Criterios de aceptación:**
- En caso de éxito, retornar `statusCode: 200`.
- El body debe contener directamente el objeto JSON desencriptado.
- La estructura del payload debe ser idéntica a la enviada originalmente al encryptor.

---

### RF-04 — Manejo de Errores

#### RF-04.1 — Token ausente o nulo
- Si `event.token` es `null`, `undefined` o falsy, retornar `statusCode: 400` con `{ "error": "Token JWE requerido" }`.

#### RF-04.2 — Token malformado o llave incorrecta
- Si el token no puede desencriptarse (malformado, firmado con otra llave), retornar `statusCode: 500` con `{ "error": "<mensaje>" }`.

---

## Requerimientos No Funcionales

| ID     | Requerimiento                                                                  |
|--------|--------------------------------------------------------------------------------|
| RNF-01 | La función debe ejecutarse en el runtime Node.js 20.x de AWS Lambda.          |
| RNF-02 | El tiempo de respuesta esperado es menor a 500ms para tokens típicos.         |
| RNF-03 | La llave privada nunca debe exponerse en la respuesta ni en los logs.         |
| RNF-04 | El código debe usar ES Modules (`"type": "module"` en package.json).          |
| RNF-05 | Las dependencias deben limitarse a `jose` para desencriptación.               |

---

## Dependencias

| Paquete | Versión  | Uso                                       |
|---------|----------|-------------------------------------------|
| `jose`  | ^6.2.3   | Importar llave privada y desencriptar JWE |

---

## Restricciones

- La llave pública **no es necesaria** en esta lambda.
- El archivo `keys/private.pem` debe estar incluido en el deployment package de esta lambda únicamente.
- `private.pem` **nunca debe subirse** a un repositorio público.
- No se requiere autenticación propia; se asume que el API Gateway gestiona el acceso.

---

## Relación con jose-encryptor

Esta lambda es el complemento directo de `jose-encryptor`:

```
jose-encryptor          jose-decryptor
─────────────           ──────────────
payload (JSON)  ──────► JWE token ──────► payload (JSON)
usa public.pem           usa private.pem
```

Ambas lambdas comparten el mismo par de llaves RSA generado una sola vez.