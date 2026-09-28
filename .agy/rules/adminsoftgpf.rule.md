---
name: "Reglas Maestras AdminSoftGPF"
description: "Obliga a la IA a respetar la arquitectura Hexagonal, ADO.NET, Multi-tenancy y diseño UI."
---
# REGLAS ESTRICTAS PARA EL AGENTE DE IA

Al trabajar en este proyecto, DEBES seguir estas reglas inquebrantables:

1. **Arquitectura Backend:** Lee SIEMPRE `docs/Arquitectura_PortaForza.md`.
   - PROHIBIDO sugerir o usar Entity Framework Core (EF Core).
   - Usa EXCLUSIVAMENTE `Microsoft.Data.SqlClient` (ADO.NET) y Stored Procedures.
   - Todo el código de negocio va en `Application` o `Domain`. Nunca en la `API`.

2. **Base de Datos:** Lee SIEMPRE `docs/Esquema_BaseDatos_PortaForza.md`.
   - TODA consulta SQL o inserción debe estar filtrada por `TenantId`.
   - PROHIBIDO usar `DELETE` para personas o facturas (Aplicar Soft-Anonymization).

3. **Frontend (UI/UX):** Lee SIEMPRE `docs/Frontend_Design_System.md`.
   - Estilo: Premium Minimalist. No inventar paletas de colores nuevas.
   - Usa Blanco, Negro y Grises para la estructura. Usa los colores del logo (Azul, Verde, Naranja) solo para botones principales y estados.
