# IPFS Storage

## Estructura de Almacenamiento

### Archivo Cifrado

El archivo se almacena como un blob binario cifrado con AES-GCM.

```
IPFS CID (contenido: blob cifrado en AES-GCM)
```

**No hay metadata wrapper** — el CID apunta directamente al contenido cifrado. La metadata (fileName, mimeType, aesKey) viaja por XMTP, no por IPFS.

### Flujo de Subida

```
1. AES-GCM.encrypt(file) → { ciphertext, iv }
2. Blob = iv (12 bytes) + ciphertext
3. pinata.upload(blob) → ipfsCID
4. Store: ipfsCID en contrato (on-chain)
5. Send: { aesKey, fileName, mimeType } via XMTP (off-chain)
```

### Flujo de Descarga

```
1. Leer ipfsCID del contrato (on-chain)
2. Descargar blob de IPFS: pinata.gateway(ipfsCID) → blob
3. Extraer iv (primeros 12 bytes) y ciphertext (resto)
4. Obtener aesKey desde XMTP (off-chain)
5. AES-GCM.decrypt(ciphertext, iv, aesKey) → file
```

### Pinata Config

| Config | Valor |
|--------|-------|
| Pin Gateway | `gateway.pinata.cloud` |
| API | `api.pinata.cloud` |
| Pin Policy | público (cualquiera puede descargar con el CID) |
| Max File Size | 50 MB |

## Notas

- No se almacenan archivos sin cifrar en IPFS
- No se almacenan claves en IPFS (solo en XMTP)
- Si IPFS está caído, el archivo no está disponible temporalmente
- No hay respaldo — si el archivo se pierde de IPFS, se pierde permanentemente

## Proveedores alternativos

| Proveedor | Gateway | Notas |
|-----------|---------|-------|
| Pinata | `gateway.pinata.cloud` | Default, usado en producción |
| CF-IPFS | `cloudflare-ipfs.com` | Fallback para descarga |
| dweb.link | `dweb.link` | Fallback alternativo |
