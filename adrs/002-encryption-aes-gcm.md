# ADR 002: AES-GCM 256 para encriptación de archivos

**Fecha:** 2024
**Estado:** Aprobado

## Contexto
Necesitamos encriptar los archivos de apuntes antes de subirlos a IPFS, de forma que solo el requester (que aceptó la oferta) pueda desencriptarlos.

## Decisión
Usar AES-GCM con clave de 256 bits, implementado via Web Crypto API del browser.

## Consecuencias
- Sin dependencias externas de crypto (nativo del browser)
- Nonce (IV) de 12 bytes incluido al inicio del blob cifrado
- La clave viaja por XMTP, no por IPFS
- Autenticación integrada (GCM detecta manipulación)
- No requiere backend ni servidor de keys

## Alternativas consideradas
- **Lit Protocol**: Sobredimensionado para este caso de uso, introduce latencia
- **NuCypher / TACo**: Requieren red de nodes, demasiado complejo
- **AES-CBC**: No tiene autenticación integrada, requiere HMAC aparte
- **Libsodium (via nacl)**: Dependencia externa, misma seguridad que Web Crypto
