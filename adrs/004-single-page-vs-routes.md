# ADR 004: Single-page app (sin rutas múltiples)

**Fecha:** 2024
**Estado:** Aprobado

## Contexto
La aplicación tiene una funcionalidad acotada: ver muro, crear pedido, ofrecer apuntes, ver ofertas, aceptar. No hay perfil de usuario, historial, ni dashboard.

## Decisión
Implementar como Single-Page Application en la ruta `/` usando modales y sheets para las acciones secundarias.

## Consecuencias
- Navegación más rápida (sin recarga de página)
- Menos complejidad de routing
- Estados compartidos más simples (todo en un componente)
- Escala mal si se agregan muchas vistas (pero no es necesario hoy)

## Alternativas consideradas
- **Rutas separadas** (`/muro`, `/crear`, `/ofertas`): Mejor para SEO y escalabilidad, pero más boilerplate y navegación más lenta. Recomendado si el app crece.
- **Tabs**: Similar a SPA pero con pestañas visibles. No agrega valor sobre modales.
