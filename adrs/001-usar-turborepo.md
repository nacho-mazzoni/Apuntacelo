# ADR 001: Usar Turborepo + pnpm como monorepo

**Fecha:** 2024
**Estado:** Aprobado

## Contexto
El proyecto tiene dos artefactos principales (frontend y contratos) que comparten configuraciones y tipos. Necesitamos un sistema que permita builds paralelos, caché, y scripts unificados.

## Decisión
Usar Turborepo con pnpm workspaces.

## Consecuencias
- Builds paralelos automáticos
- Caché de builds via turbo.json
- Un solo comando `pnpm dev` para todo
- Los workspaces de pnpm evitan duplicar node_modules

## Alternativas consideradas
- **Nx**: Más pesado, más config
- **Lerna**: Mantenimiento más complejo
- **Monorepo vanilla npm**: Sin caché ni paralelismo
