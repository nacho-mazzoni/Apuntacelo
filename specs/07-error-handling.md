# Error Handling

## Matriz de errores por capa

### Smart Contract

| Condición | Código | Mensaje | Acción UX |
|-----------|--------|---------|-----------|
| Token no soportado | `ERR_TOKEN_NOT_SUPPORTED` | Token no soportado. Usá cUSD, USDC o USDT | Deshabilitar tokens en dropdown |
| Amount > balance | `ERR_INSUFFICIENT_BALANCE` | Saldo insuficiente del token | Mostrar balance actual, bloquear submit |
| Request no existe | `ERR_REQUEST_NOT_FOUND` | El pedido no existe | Recargar muro |
| Request no abierto | `ERR_REQUEST_CLOSED` | Este pedido ya fue cerrado | Ocultar botón de ofertar |
| Solo el requester | `ERR_NOT_REQUESTER` | Solo el creador del pedido puede aceptar | Ocultar botón "Aceptar" |
| Rating inválido | `ERR_INVALID_RATING` | El rating debe ser entre 1 y 5 | Validar en UI antes de enviar |
| Reentrancy | `ERR_REENTRANCY` | Operación en curso, intentá de nuevo | Bloquear UI, reintentar |

### XMTP

| Condición | Mensaje | Acción UX |
|-----------|---------|-----------|
| No iniciado | XMTP no está conectado | Botón "Iniciar XMTP", init automático |
| Key no encontrada | Clave de encriptación no disponible | OfferPreview muestra "Clave no disponible" |
| Red no soportada | XMTP no soporta esta red | Mensaje informativo |

### IPFS (Pinata)

| Condición | Mensaje | Acción UX |
|-----------|---------|-----------|
| Upload falló | Error al subir el archivo a IPFS. Intentá de nuevo | Retry button |
| Download falló | Error al descargar el archivo. Temporal | Retry button, mensaje "Disponible más tarde" |
| Archivo > 50MB | El archivo excede el límite de 50MB | Validar antes de upload |
| Tipo no soportado | Solo se aceptan PDF, DOC y DOCX | Restringir en input accept |

### Encryption (Web Crypto)

| Condición | Mensaje | Acción UX |
|-----------|---------|-----------|
| Encrypt falló | Error al cifrar el archivo | Retry, si persiste recargar |
| Decrypt falló | Error al descifrar el archivo. La clave podría ser incorrecta | Mostrar error, no ofrecer descarga |
| Key inválida | La clave de encriptación no es válida | No mostrar preview |
| Browser no soporta | Tu navegador no soporta Web Crypto API | Mostrar mensaje de browser no soportado |

### UI / General

| Condición | Mensaje | Acción UX |
|-----------|---------|-----------|
| Wallet no conectada | Conectá tu wallet para continuar | ConnectGate |
| Red incorrecta | Conectate a Celo (Mainnet o Sepolia) | Switch network prompt |
| Transacción pendiente | Esperando confirmación... | Loading spinner en botón |
| Gas insuficiente | Necesitás CELO para pagar el gas | Warning antes de abrir form |
| Error desconocido | Algo salió mal. Intentá de nuevo | Toast/alert genérico, log a console |
