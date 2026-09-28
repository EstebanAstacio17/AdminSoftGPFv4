-- ============================================================================
-- ADMINSOFTGPF - 01_SCHEMAS.SQL
-- Plataforma: AdminSoftGPF (powered by PortaForza)
-- Descripción: Creación de esquemas lógicos para aislamiento y organización.
-- ============================================================================

IF NOT EXISTS (SELECT * FROM sys.schemas WHERE name = 'saas')
BEGIN
    EXEC('CREATE SCHEMA saas AUTHORIZATION dbo;');
END
GO

IF NOT EXISTS (SELECT * FROM sys.schemas WHERE name = 'app')
BEGIN
    EXEC('CREATE SCHEMA app AUTHORIZATION dbo;');
END
GO

IF NOT EXISTS (SELECT * FROM sys.schemas WHERE name = 'audit')
BEGIN
    EXEC('CREATE SCHEMA audit AUTHORIZATION dbo;');
END
GO

IF NOT EXISTS (SELECT * FROM sys.schemas WHERE name = 'sec')
BEGIN
    EXEC('CREATE SCHEMA sec AUTHORIZATION dbo;');
END
GO
