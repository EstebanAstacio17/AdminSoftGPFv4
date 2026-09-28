-- ============================================================================
-- ADMINSOFTGPF - 00_MASTERDEPLOY.SQL
-- Plataforma: AdminSoftGPF (powered by PortaForza)
-- Descripción: Script maestro de despliegue ordenado para Azure SQL Database.
--
-- Orden de ejecución:
-- 1. 01_Schemas.sql           -> Creación de esquemas (saas, app, audit, sec)
-- 2. 02_Tables.sql            -> Creación de tablas, PKs, FKs, RowVersion
-- 3. 03_RowLevelSecurity.sql  -> Predicado sec.fn_tenant_isolation y Security Policies
-- 4. 04_Indexes.sql           -> Índices multi-tenant, FKs e idempotencia
-- 5. 05_StoredProcedures.sql  -> Stored Procedures CRUD, Soft-Anonymization y RLS
-- ============================================================================

PRINT '>>> Iniciando despliegue de base de datos AdminSoftGPF...';
GO

-- 1. Schemas
PRINT '>>> 1/5 Aplicando 01_Schemas.sql...';
GO
:r "01_Schemas.sql"
GO

-- 2. Tables
PRINT '>>> 2/5 Aplicando 02_Tables.sql...';
GO
:r "02_Tables.sql"
GO

-- 3. Row-Level Security
PRINT '>>> 3/5 Aplicando 03_RowLevelSecurity.sql...';
GO
:r "03_RowLevelSecurity.sql"
GO

-- 4. Indexes
PRINT '>>> 4/5 Aplicando 04_Indexes.sql...';
GO
:r "04_Indexes.sql"
GO

-- 5. Stored Procedures
PRINT '>>> 5/5 Aplicando 05_StoredProcedures.sql...';
GO
:r "05_StoredProcedures.sql"
GO

PRINT '>>> ✅ Despliegue de base de datos AdminSoftGPF completado con éxito.';
GO
