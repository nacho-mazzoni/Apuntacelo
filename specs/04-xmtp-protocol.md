# XMTP Protocol

## Formato de Mensajes

### Envío de Clave de Encriptación (Seller → Requester)

```
OFFER_KEY:{bountyId}:{aesKeyBase64}:{fileName}:{mimeType}
```

**Campos:**
| Componente | Descripción | Encoding |
|------------|-------------|----------|
| `OFFER_KEY` | Prefijo para identificar tipo de mensaje | ASCII |
| `bountyId` | ID numérico del bounty | Decimal string |
| `aesKeyBase64` | Clave AES-GCM de 256 bits | Base64 URL-safe |
| `fileName` | Nombre original del archivo | URL-encoded (encodeURIComponent) |
| `mimeType` | Tipo MIME del archivo | URL-encoded (encodeURIComponent) |

**Ejemplo:**
```
OFFER_KEY:42:aBcDeFgHiJkLmNoPqRsTuVwXyZ0123456789==:Apuntes%20Matem%C3%A1ticas.pdf:application%2Fpdf
```

### Reglas de parseo

1. Split por `:` → 5 partes esperadas
2. `OFFER_KEY` en parte 0 (case-sensitive)
3. `bountyId` en parte 1 → parsear a `bigint`
4. `aesKeyBase64` en parte 2 → decodificar a `Uint8Array`
5. `fileName` en parte 3 → `decodeURIComponent`
6. `mimeType` en parte 4 → `decodeURIComponent`

### Consideraciones

- Cada seller envía EXACTAMENTE UN mensaje por oferta
- El mensaje se envía al topic o conversación directa con el requester
- No hay confirmación de lectura — el mensaje persiste en la red XMTP
- El requester debe filtrar mensajes por prefijo para encontrar las keys
- No se usan topics XMTP — se usa conversación directa 1:1
