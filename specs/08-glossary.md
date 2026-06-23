# Glossary / Lenguaje Ubicuo

## Español (idioma principal)

| Término | Definición |
|---------|------------|
| **Apunte** | Material de estudio universitario (PDF, DOC, DOCX) |
| **Request / Pedido / Bounty** | Solicitud de un estudiante pidiendo un apunte específico, con una recompensa en stablecoins |
| **Offer / Oferta** | Respuesta de un vendedor a un bounty, subiendo el apunte cifrado |
| **Requester** | Estudiante que crea el bounty (paga la recompensa) |
| **Seller** | Estudiante que ofrece el apunte (recibe la recompensa) |
| **Muro** | Página principal donde se listan todos los bounties abiertos |
| **Recompensa** | Monto en stablecoins que paga el requester al seller |
| **Aceptar** | Acción del requester de aprobar una oferta, liberando el pago |
| **Previsualizar** | Ver el PDF con watermark antes de aceptar |
| **Descargar** | Obtener el archivo original desencriptado después de aceptar |
| **Rating** | Calificación de 1 a 5 estrellas que el requester asigna al seller |

## Inglés (código)

| Término | Equivalente español |
|---------|---------------------|
| `BountyRequest` | Request / Pedido |
| `Offer` | Oferta |
| `User` | Usuario (implícito, address de wallet) |
| `approve` | Aprobar (ERC-20 allowance) |
| `acceptOffer` | Aceptar oferta |
| `offerNote` | Ofrecer apunte |
| `createRequest` | Crear pedido |
| `ipfsCID` | Identificador del archivo en IPFS |
| `aesKey` | Clave de encriptación AES-GCM |
| `EncryptionKeyPayload` | Mensaje XMTP con la clave |
