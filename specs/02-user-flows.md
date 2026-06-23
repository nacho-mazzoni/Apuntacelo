# User Flows

## Actor: Estudiante (Requester)

### Flow: Crear Bounty

```
1. Conecta wallet (MiniPay auto-connect o RainbowKit)
2. Ve el Muro de Pedidos (vacío o con pedidos existentes)
3. Click "Crear Pedido"
4. Completa formulario:
   - Título (obligatorio, ≤ 100 chars)
   - Descripción (obligatorio, ≤ 500 chars)
   - Token (cUSD / USDC / USDT)
   - Monto (en decimals human-readable)
5. Si allowance < monto → firma approve(token, amount)
6. Firma createRequest(title, description, token, amount)
7. Transacción confirmada → request visible en Muro
```

**Edge cases:**
- CELO balance = 0 → warning antes de abrir el form
- Token no soportado → dropdown solo muestra cUSD/USDC/USDT
- Transacción falla → mensaje de error, no se agrega al muro

### Flow: Ver Ofertas

```
1. En Muro, identifica sus propios requests (badge "Tuyo")
2. Click "Ver ofertas" en su request
3. Modal muestra lista de ofertas con:
   - Dirección del seller (abreviada)
   - Nombre del archivo (si ya se obtuvieron keys XMTP)
   - Estado (Pending/Accepted)
4. Click "Vista previa" → OfferPreview con watermark
5. Click "Aceptar" → selector de rating (1-5 estrellas)
6. Firma acceptOffer(requestId, offerIndex, rating)
7. Transacción confirmada → botón "Descargar" disponible
```

### Flow: Descargar Apunte

```
1. Después de aceptar oferta, click "Descargar"
2. Sistema descarga blob cifrado de IPFS (ipfsCID)
3. Sistema desencripta con aesKey (obtenida de XMTP)
4. Archivo descargado en el browser con fileName original
```

**Edge cases:**
- XMTP no iniciado → init automático al abrir "Ver ofertas"
- Key no encontrada en XMTP → mensaje "Clave no disponible"
- Archivo IPFS caído → mensaje "Archivo no disponible temporalmente"

---

## Actor: Estudiante (Seller)

### Flow: Ofrecer Apuntes

```
1. Ve request en Muro
2. Click "Ofrecer mis Apuntes"
3. Sheet/Dialog (responsive):
   a. Selector de archivo (PDF/DOC/DOCX, ≤ 50MB)
   b. Acepta términos legales (checkbox)
4. Click "Subir y Ofrecer"
5. Sistema:
   a. Genera clave AES-GCM de 256 bits
   b. Cifra el archivo (AES-GCM)
   c. Sube blob cifrado a IPFS via Pinata → obtiene CID
   d. Envía OFFER_KEY:{bountyId}:{aesKey}:{fileName}:{mimeType} via XMTP
   e. Firma offerNote(requestId, ipfsCID) en el contrato
6. Oferta visible para el requester
```

**Edge cases:**
- Archivo > 50MB → error antes de subir
- Tipo de archivo no soportado → error en selector
- XMTP no iniciado → init automático
- IPFS falla → error, no se crea la oferta
- Transacción falla → oferta no registrada

---

## Actor: Sistema

### Flow: Sincronización de Keys XMTP

```
1. Requester abre "Ver ofertas" por primera vez
2. Sistema itera conversaciones XMTP del requester
3. Filtra mensajes con prefijo "OFFER_KEY:{bountyId}:"
4. Parsea: key, fileName, mimeType de cada mensaje
5. Almacena en estado local (encryptionKeys[bountyId][offerIndex])
6. Pasa keys al componente OfferPreview para decrypt
```
