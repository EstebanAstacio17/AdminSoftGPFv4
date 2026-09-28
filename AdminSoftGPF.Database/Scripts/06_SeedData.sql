-- ============================================================================
-- ADMINSOFTGPF - 06_SEEDDATA.SQL
-- Plataforma: AdminSoftGPF (powered by PortaForza)
-- Descripción: Datos iniciales de prueba para Tenants, Usuarios, Propiedades y Unidades.
-- ============================================================================

USE AdminSoftGPF_Dev;
GO

SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
SET NOCOUNT ON;
GO

-- 1. Tenant Demo: Residencial Las Palmas
DECLARE @TenantId UNIQUEIDENTIFIER = 'C1D2E3F4-1111-2222-3333-444444444444';

IF NOT EXISTS (SELECT 1 FROM saas.Tenant WHERE Id = @TenantId)
BEGIN
    INSERT INTO saas.Tenant (Id, Name, TaxId, Status, CreatedAt)
    VALUES (@TenantId, 'Residencial Las Palmas', 'RNC-101-998877', 'Active', SYSUTCDATETIME());
    PRINT '>>> Tenant creado: Residencial Las Palmas';
END
GO

-- 2. Usuarios Demo (Contraseña común: Password123!)
DECLARE @TenantId UNIQUEIDENTIFIER = 'C1D2E3F4-1111-2222-3333-444444444444';
DECLARE @PasswordHash NVARCHAR(500) = '81018121A2BA84CB807DC6096F15911596D2B2F31F184BBC2D3D282821B10472:61B3063EAE3447A05D87EEADC1323570:100000:SHA256';

-- SuperAdmin Global PortaForza
IF NOT EXISTS (SELECT 1 FROM saas.[User] WHERE Email = 'superadmin@portaforza.com')
BEGIN
    INSERT INTO saas.[User] (Id, TenantId, Email, PasswordHash, Role, IsActive)
    VALUES ('B1A2C3D4-0000-0000-0000-000000000001', NULL, 'superadmin@portaforza.com', @PasswordHash, 'PortaForzaAdmin', 1);
    PRINT '>>> Usuario SuperAdmin creado: superadmin@portaforza.com';
END

-- Administrador de Tenant
IF NOT EXISTS (SELECT 1 FROM saas.[User] WHERE Email = 'admin@portaforza.com')
BEGIN
    INSERT INTO saas.[User] (Id, TenantId, Email, PasswordHash, Role, IsActive)
    VALUES ('B1A2C3D4-0000-0000-0000-000000000002', @TenantId, 'admin@portaforza.com', @PasswordHash, 'TenantAdmin', 1);
    PRINT '>>> Usuario TenantAdmin creado: admin@portaforza.com';
END

IF NOT EXISTS (SELECT 1 FROM saas.[User] WHERE Email = 'admin@condominio.com')
BEGIN
    INSERT INTO saas.[User] (Id, TenantId, Email, PasswordHash, Role, IsActive)
    VALUES ('B1A2C3D4-0000-0000-0000-000000000003', @TenantId, 'admin@condominio.com', @PasswordHash, 'TenantAdmin', 1);
    PRINT '>>> Usuario TenantAdmin creado: admin@condominio.com';
END

-- Guardia de Garita
IF NOT EXISTS (SELECT 1 FROM saas.[User] WHERE Email = 'guard@condominio.com')
BEGIN
    INSERT INTO saas.[User] (Id, TenantId, Email, PasswordHash, Role, IsActive)
    VALUES ('B1A2C3D4-0000-0000-0000-000000000004', @TenantId, 'guard@condominio.com', @PasswordHash, 'Guard', 1);
    PRINT '>>> Usuario Guard creado: guard@condominio.com';
END

-- Residente
IF NOT EXISTS (SELECT 1 FROM saas.[User] WHERE Email = 'residente@condominio.com')
BEGIN
    INSERT INTO saas.[User] (Id, TenantId, Email, PasswordHash, Role, IsActive)
    VALUES ('B1A2C3D4-0000-0000-0000-000000000005', @TenantId, 'residente@condominio.com', @PasswordHash, 'Resident', 1);
    PRINT '>>> Usuario Resident creado: residente@condominio.com';
END
GO
