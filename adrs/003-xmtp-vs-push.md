# ADR 003: XMTP para mensajería off-chain

**Fecha:** 2024
**Estado:** Aprobado

## Contexto
El seller debe enviar la clave de encriptación al requester de forma segura. Necesitamos un canal de comunicación off-chain que sea descentralizado y no requiera infraestructura propia.

## Decisión
Usar XMTP (Extensible Message Transport Protocol) para el envío de claves AES.

## Consecuencias
- Sin servidor propio — la red XMTP maneja el enrutamiento
- E2EE por defecto — solo emisor y receptor leen los mensajes
- Mensajes persistentes — el requester puede leerlos cuando conecta XMTP
- El requester debe filtrar conversaciones para encontrar keys de sus bounties
- Dependencia de la red XMTP (disponibilidad)

## Alternativas consideradas
- **Push notifications**: Requiere servidor propio, no descentralizado
- **WebSockets / SSE**: Requiere backend siempre online
- **Almacenar key en el contrato**: Público (cualquiera vería la key), caro (gas)
- **Email**: Centralizado, no es Web3
