-- ============================================================================
-- ADMINSOFTGPF - 08_ROWVERSION_MIGRATION.SQL
-- Plataforma: AdminSoftGPF (powered by PortaForza)
-- Auditoria: HALLAZGO CRITICO #10 - Remediacion
-- Descripcion: Agrega columna RowVersion (ROWVERSION/TIMESTAMP) a todas las
--              tablas transaccionales que la requerían segun el documento:
--              "docs/Esquema_BaseDatos_PortaForza.md" - Consideraciones Globales:
--              "Toda tabla transaccional incluye una columna RowVersion
--               (tipo TIMESTAMP/ROWVERSION) para evitar sobreescritura de datos
--               simultanea." (Concurrencia Optimista)
--
-- Tablas afectadas:
--   1. app.Payment            - Transaccional critica (flujo de caja)
--   2. app.PaymentApplication - Transaccional (cruzamiento pago/factura)
--   3. app.MaintenanceTicket  - Transaccional (estado mutable)
--   4. app.AmenityBooking     - Transaccional (reserva de recursos)
-- ============================================================================

PRINT '=== INICIO MIGRACION: Adicion de RowVersion a tablas transaccionales ===';
GO

-- ============================================================================
-- 1. app.Payment
-- ============================================================================
IF NOT EXISTS (
    SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = 'app'
      AND TABLE_NAME   = 'Payment'
      AND COLUMN_NAME  = 'RowVersion'
)
BEGIN
    ALTER TABLE app.Payment ADD RowVersion ROWVERSION NOT NULL;
    PRINT '[OK] RowVersion anadida a app.Payment';
END
ELSE
    PRINT '[SKIP] app.Payment ya posee RowVersion.';
GO

-- ============================================================================
-- 2. app.PaymentApplication
-- ============================================================================
IF NOT EXISTS (
    SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = 'app'
      AND TABLE_NAME   = 'PaymentApplication'
      AND COLUMN_NAME  = 'RowVersion'
)
BEGIN
    ALTER TABLE app.PaymentApplication ADD RowVersion ROWVERSION NOT NULL;
    PRINT '[OK] RowVersion anadida a app.PaymentApplication';
END
ELSE
    PRINT '[SKIP] app.PaymentApplication ya posee RowVersion.';
GO

-- ============================================================================
-- 3. app.MaintenanceTicket
-- ============================================================================
IF NOT EXISTS (
    SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = 'app'
      AND TABLE_NAME   = 'MaintenanceTicket'
      AND COLUMN_NAME  = 'RowVersion'
)
BEGIN
    ALTER TABLE app.MaintenanceTicket ADD RowVersion ROWVERSION NOT NULL;
    PRINT '[OK] RowVersion anadida a app.MaintenanceTicket';
END
ELSE
    PRINT '[SKIP] app.MaintenanceTicket ya posee RowVersion.';
GO

-- ============================================================================
-- 4. app.AmenityBooking
-- ============================================================================
IF NOT EXISTS (
    SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = 'app'
      AND TABLE_NAME   = 'AmenityBooking'
      AND COLUMN_NAME  = 'RowVersion'
)
BEGIN
    ALTER TABLE app.AmenityBooking ADD RowVersion ROWVERSION NOT NULL;
    PRINT '[OK] RowVersion anadida a app.AmenityBooking';
END
ELSE
    PRINT '[SKIP] app.AmenityBooking ya posee RowVersion.';
GO

-- ============================================================================
-- SP: app.usp_Ticket_UpdateStatus  (con concurrencia optimista via RowVersion)
-- Segun Arquitectura_PortaForza.md: toda actualizacion de estado mutable
-- debe protegerse contra escrituras concurrentes.
-- El error 51001 es capturado por ConcurrencyConflictException en C#.
-- ============================================================================
CREATE OR ALTER PROCEDURE app.usp_Ticket_UpdateStatus
    @Id         UNIQUEIDENTIFIER,
    @TenantId   UNIQUEIDENTIFIER,
    @Status     VARCHAR(30),
    @RowVersion BINARY(8)       -- Valor leido previo por el cliente
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @Current BINARY(8);
    SELECT @Current = CAST(RowVersion AS BINARY(8))
    FROM   app.MaintenanceTicket
    WHERE  Id = @Id AND TenantId = @TenantId;

    IF @Current IS NULL
    BEGIN
        RAISERROR('Ticket no encontrado o fuera del scope del Tenant.', 16, 1);
        RETURN;
    END

    IF @Current <> @RowVersion
    BEGIN
        -- 51001 mapeado a ConcurrencyConflictException en la capa de repositorio
        RAISERROR('Conflicto de concurrencia: el ticket fue modificado por otro proceso.', 16, 51001);
        RETURN;
    END

    UPDATE app.MaintenanceTicket
    SET    Status     = @Status,
           ResolvedAt = CASE
                          WHEN @Status IN ('Resolved', 'Closed') THEN SYSUTCDATETIME()
                          ELSE ResolvedAt
                        END
    WHERE  Id       = @Id
      AND  TenantId = @TenantId;

    -- Retorna el nuevo RowVersion para que el cliente lo actualice en memoria
    SELECT CAST(RowVersion AS BINARY(8)) AS NewRowVersion
    FROM   app.MaintenanceTicket
    WHERE  Id = @Id;
END
GO

-- ============================================================================
-- SP: app.usp_Booking_UpdateStatus  (concurrencia optimista AmenityBooking)
-- ============================================================================
CREATE OR ALTER PROCEDURE app.usp_Booking_UpdateStatus
    @Id         UNIQUEIDENTIFIER,
    @TenantId   UNIQUEIDENTIFIER,
    @Status     VARCHAR(30),
    @RowVersion BINARY(8)
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @Current BINARY(8);
    SELECT @Current = CAST(RowVersion AS BINARY(8))
    FROM   app.AmenityBooking
    WHERE  Id = @Id AND TenantId = @TenantId;

    IF @Current IS NULL
    BEGIN
        RAISERROR('Reserva no encontrada o fuera del scope del Tenant.', 16, 1);
        RETURN;
    END

    IF @Current <> @RowVersion
    BEGIN
        RAISERROR('Conflicto de concurrencia: la reserva fue modificada por otro proceso.', 16, 51001);
        RETURN;
    END

    UPDATE app.AmenityBooking
    SET    Status = @Status
    WHERE  Id       = @Id
      AND  TenantId = @TenantId;

    SELECT CAST(RowVersion AS BINARY(8)) AS NewRowVersion
    FROM   app.AmenityBooking
    WHERE  Id = @Id;
END
GO

-- ============================================================================
-- VERIFICACION FINAL
-- ============================================================================
PRINT '';
PRINT '=== VERIFICACION: Columnas RowVersion en esquema app ===';

SELECT
    TABLE_SCHEMA AS [Esquema],
    TABLE_NAME   AS [Tabla],
    COLUMN_NAME  AS [Columna],
    DATA_TYPE    AS [TipoDato]
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = 'app'
  AND COLUMN_NAME  = 'RowVersion'
ORDER BY TABLE_NAME;

PRINT '=== FIN MIGRACION ===';
