# GAPS & Roadmap

Este documento detalla las funcionalidades faltantes, áreas de mejora y el roadmap a futuro para **Apuntacelo**. 

## Alta Prioridad (Previo a lanzamiento masivo)

- [ ] **Despliegue en Celo Mainnet:** Actualizar los contratos y la configuración del frontend para apuntar a la red principal.
- [ ] **Soporte Multi-entorno:** Configurar la red (`chainId`) de manera dinámica mediante variables de entorno para facilitar el paso entre Sepolia y Mainnet sin modificar código.
- [ ] **Gestión de variables de entorno seguras:** Asegurar que las variables de Supabase, Pinata y WalletConnect estén correctamente aisladas para producción.

## Media Prioridad (Próximas features)

- [ ] **Sistema de Resolución de Disputas:** Actualmente, si un vendedor entrega un archivo que no corresponde con lo pedido, el comprador no puede recuperar sus fondos fácilmente tras aceptarlo. Es necesario implementar un mecanismo de arbitraje o reporte.
- [ ] **Integración con MiniPay de Celo:** Optimizar la DApp para que pueda ser utilizada directamente desde MiniPay (Opera), aprovechando el ecosistema mobile de Celo.
- [ ] **Paginación y Filtrado de Bounties:** A medida que crezca la cantidad de pedidos en el muro, será vital agregar filtros (por materia, por universidad, por token) y paginación para no saturar el cliente y los endpoints RPC.
- [ ] **Notificaciones Push o Emails:** Notificar a los usuarios cuando reciben una nueva oferta o cuando su oferta fue aceptada, ya que actualmente dependen de revisar la plataforma activamente (a pesar de tener XMTP).

## Baja Prioridad / Ideas Futuras

- [ ] **Soporte para múltiples archivos:** Permitir subir y vender un paquete completo de apuntes (varios PDFs/archivos).
- [ ] **Sistema de Reputación Avanzado:** Mostrar estadísticas más detalladas sobre los vendedores (tiempo promedio de respuesta, calidad del apunte, comentarios/reviews).
- [ ] **Traducción / Multi-idioma (i18n):** Preparar la plataforma para ser utilizada por estudiantes de otros países y en otros idiomas.
