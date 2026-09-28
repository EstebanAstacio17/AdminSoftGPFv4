-- ============================================================================
-- ADMINSOFTGPF - 03_ROWLEVELSECURITY.SQL
-- Plataforma: AdminSoftGPF (powered by PortaForza)
-- Descripción: Función de predicado y políticas de Row-Level Security (RLS)
--              vinculadas a SESSION_CONTEXT(N'TenantId') para aislamiento blindado.
-- ============================================================================

-- 1. Función de Predicado de Seguridad (Inline Table-Valued Function)
CREATE OR ALTER FUNCTION sec.fn_tenant_isolation(@TenantId UNIQUEIDENTIFIER)
RETURNS TABLE
WITH SCHEMABINDING
AS
RETURN
    SELECT 1 AS fn_tenant_isolation_result
    WHERE @TenantId = CONVERT(UNIQUEIDENTIFIER, SESSION_CONTEXT(N'TenantId'))
       OR IS_MEMBER('db_owner') = 1;
GO

-- 2. Eliminar política previa si existe para recreación idempotente
IF EXISTS (SELECT * FROM sys.security_policies WHERE name = 'TenantIsolationPolicy' AND schema_id = SCHEMA_ID('sec'))
BEGIN
    DROP SECURITY POLICY sec.TenantIsolationPolicy;
END
GO

-- 3. Creación de la Política de Seguridad Global con FILTER y BLOCK PREDICATES
CREATE SECURITY POLICY sec.TenantIsolationPolicy
    -- app.Property
    ADD FILTER PREDICATE sec.fn_tenant_isolation(TenantId) ON app.Property,
    ADD BLOCK  PREDICATE sec.fn_tenant_isolation(TenantId) ON app.Property,

    -- app.Block
    ADD FILTER PREDICATE sec.fn_tenant_isolation(TenantId) ON app.Block,
    ADD BLOCK  PREDICATE sec.fn_tenant_isolation(TenantId) ON app.Block,

    -- app.Unit
    ADD FILTER PREDICATE sec.fn_tenant_isolation(TenantId) ON app.Unit,
    ADD BLOCK  PREDICATE sec.fn_tenant_isolation(TenantId) ON app.Unit,

    -- app.Person
    ADD FILTER PREDICATE sec.fn_tenant_isolation(TenantId) ON app.Person,
    ADD BLOCK  PREDICATE sec.fn_tenant_isolation(TenantId) ON app.Person,

    -- app.UnitResident
    ADD FILTER PREDICATE sec.fn_tenant_isolation(TenantId) ON app.UnitResident,
    ADD BLOCK  PREDICATE sec.fn_tenant_isolation(TenantId) ON app.UnitResident,

    -- app.Invoice
    ADD FILTER PREDICATE sec.fn_tenant_isolation(TenantId) ON app.Invoice,
    ADD BLOCK  PREDICATE sec.fn_tenant_isolation(TenantId) ON app.Invoice,

    -- app.Payment
    ADD FILTER PREDICATE sec.fn_tenant_isolation(TenantId) ON app.Payment,
    ADD BLOCK  PREDICATE sec.fn_tenant_isolation(TenantId) ON app.Payment,

    -- app.PaymentApplication
    ADD FILTER PREDICATE sec.fn_tenant_isolation(TenantId) ON app.PaymentApplication,
    ADD BLOCK  PREDICATE sec.fn_tenant_isolation(TenantId) ON app.PaymentApplication,

    -- app.Receipt
    ADD FILTER PREDICATE sec.fn_tenant_isolation(TenantId) ON app.Receipt,
    ADD BLOCK  PREDICATE sec.fn_tenant_isolation(TenantId) ON app.Receipt,

    -- app.OutboxMessage
    ADD FILTER PREDICATE sec.fn_tenant_isolation(TenantId) ON app.OutboxMessage,
    ADD BLOCK  PREDICATE sec.fn_tenant_isolation(TenantId) ON app.OutboxMessage,

    -- app.Supplier
    ADD FILTER PREDICATE sec.fn_tenant_isolation(TenantId) ON app.Supplier,
    ADD BLOCK  PREDICATE sec.fn_tenant_isolation(TenantId) ON app.Supplier,

    -- app.Expense
    ADD FILTER PREDICATE sec.fn_tenant_isolation(TenantId) ON app.Expense,
    ADD BLOCK  PREDICATE sec.fn_tenant_isolation(TenantId) ON app.Expense,

    -- app.MaintenanceTicket
    ADD FILTER PREDICATE sec.fn_tenant_isolation(TenantId) ON app.MaintenanceTicket,
    ADD BLOCK  PREDICATE sec.fn_tenant_isolation(TenantId) ON app.MaintenanceTicket,

    -- app.Amenity
    ADD FILTER PREDICATE sec.fn_tenant_isolation(TenantId) ON app.Amenity,
    ADD BLOCK  PREDICATE sec.fn_tenant_isolation(TenantId) ON app.Amenity,

    -- app.AmenityBooking
    ADD FILTER PREDICATE sec.fn_tenant_isolation(TenantId) ON app.AmenityBooking,
    ADD BLOCK  PREDICATE sec.fn_tenant_isolation(TenantId) ON app.AmenityBooking,

    -- app.VisitorPass
    ADD FILTER PREDICATE sec.fn_tenant_isolation(TenantId) ON app.VisitorPass,
    ADD BLOCK  PREDICATE sec.fn_tenant_isolation(TenantId) ON app.VisitorPass,

    -- app.GateLog
    ADD FILTER PREDICATE sec.fn_tenant_isolation(TenantId) ON app.GateLog,
    ADD BLOCK  PREDICATE sec.fn_tenant_isolation(TenantId) ON app.GateLog,

    -- app.BankTransaction
    ADD FILTER PREDICATE sec.fn_tenant_isolation(TenantId) ON app.BankTransaction,
    ADD BLOCK  PREDICATE sec.fn_tenant_isolation(TenantId) ON app.BankTransaction,

    -- audit.AuditLog
    ADD FILTER PREDICATE sec.fn_tenant_isolation(TenantId) ON audit.AuditLog,
    ADD BLOCK  PREDICATE sec.fn_tenant_isolation(TenantId) ON audit.AuditLog
    WITH (STATE = ON);
GO
