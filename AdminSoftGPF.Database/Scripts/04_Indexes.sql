-- ============================================================================
-- ADMINSOFTGPF - 04_INDEXES.SQL
-- Plataforma: AdminSoftGPF (powered by PortaForza)
-- Descripción: Índices para optimización de consultas multi-tenant,
--              integridad de claves foráneas y búsquedas frecuentes.
-- ============================================================================

-- ============================================================================
-- 1. ÍNDICES SOBRE TENANTID (Aislamiento y Filtrado RLS)
-- ============================================================================

SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO

CREATE NONCLUSTERED INDEX IX_User_TenantId ON saas.[User](TenantId) WHERE TenantId IS NOT NULL;
CREATE NONCLUSTERED INDEX IX_Property_TenantId ON app.Property(TenantId);
CREATE NONCLUSTERED INDEX IX_Block_TenantId ON app.Block(TenantId);
CREATE NONCLUSTERED INDEX IX_Unit_TenantId ON app.Unit(TenantId);
CREATE NONCLUSTERED INDEX IX_Person_TenantId ON app.Person(TenantId);
CREATE NONCLUSTERED INDEX IX_UnitResident_TenantId ON app.UnitResident(TenantId);
CREATE NONCLUSTERED INDEX IX_Invoice_TenantId ON app.Invoice(TenantId);
CREATE NONCLUSTERED INDEX IX_Payment_TenantId ON app.Payment(TenantId);
CREATE NONCLUSTERED INDEX IX_PaymentApplication_TenantId ON app.PaymentApplication(TenantId);
CREATE NONCLUSTERED INDEX IX_Receipt_TenantId ON app.Receipt(TenantId);
CREATE NONCLUSTERED INDEX IX_AuditLog_TenantId ON audit.AuditLog(TenantId);
GO

-- ============================================================================
-- 2. ÍNDICES DE CLAVES FORÁNEAS Y RELACIONES
-- ============================================================================

CREATE NONCLUSTERED INDEX IX_Block_PropertyId ON app.Block(PropertyId);
CREATE NONCLUSTERED INDEX IX_Unit_BlockId ON app.Unit(BlockId);
CREATE NONCLUSTERED INDEX IX_UnitResident_UnitId ON app.UnitResident(UnitId);
CREATE NONCLUSTERED INDEX IX_UnitResident_PersonId ON app.UnitResident(PersonId);
CREATE NONCLUSTERED INDEX IX_Invoice_UnitId ON app.Invoice(UnitId);
CREATE NONCLUSTERED INDEX IX_Payment_PersonId ON app.Payment(PersonId);
CREATE NONCLUSTERED INDEX IX_PaymentApp_PaymentId ON app.PaymentApplication(PaymentId);
CREATE NONCLUSTERED INDEX IX_PaymentApp_InvoiceId ON app.PaymentApplication(InvoiceId);
CREATE NONCLUSTERED INDEX IX_Receipt_PaymentId ON app.Receipt(PaymentId);
GO

-- ============================================================================
-- 3. ÍNDICES COMPUESTOS Y RESTRICCIONES DE NEGOCIO
-- ============================================================================

-- Idempotencia estricta por Tenant en Pagos (evita doble cargo bancario / pasarela)
CREATE UNIQUE NONCLUSTERED INDEX UQ_Payment_Tenant_ReferenceId 
ON app.Payment(TenantId, ReferenceId);
GO

-- Consultas de facturas pendientes/mora por Tenant
CREATE NONCLUSTERED INDEX IX_Invoice_Tenant_Status 
ON app.Invoice(TenantId, Status) 
INCLUDE (UnitId, Amount, BalanceDue, DueDate);
GO

-- Consultas de trazabilidad y auditoría cronológica
CREATE NONCLUSTERED INDEX IX_AuditLog_Tenant_CreatedAt 
ON audit.AuditLog(TenantId, CreatedAt DESC);

CREATE NONCLUSTERED INDEX IX_AuditLog_Table_Record 
ON audit.AuditLog(TableName, RecordId);
GO
