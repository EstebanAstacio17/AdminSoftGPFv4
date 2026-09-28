-- ============================================================================
-- ADMINSOFTGPF - 02_TABLES.SQL
-- Plataforma: AdminSoftGPF (powered by PortaForza)
-- Descripción: Definición DDL de todas las tablas del sistema.
-- ============================================================================

-- ============================================================================
-- 1. ESQUEMA SAAS (Administración Global de AdminSoftGPF)
-- ============================================================================

-- saas.Tenant: Clientes / Administradores de la plataforma
IF OBJECT_ID('saas.Tenant', 'U') IS NULL
BEGIN
    CREATE TABLE saas.Tenant
    (
        Id          UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_saas_Tenant PRIMARY KEY DEFAULT NEWSEQUENTIALID(),
        Name        NVARCHAR(150)    NOT NULL,
        TaxId       NVARCHAR(30)     NULL,
        Status      VARCHAR(20)      NOT NULL CONSTRAINT DF_Tenant_Status DEFAULT 'Active', -- 'Active', 'ReadOnly', 'Suspended'
        CreatedAt   DATETIME2        NOT NULL CONSTRAINT DF_Tenant_CreatedAt DEFAULT SYSUTCDATETIME()
    );
END
GO

-- saas.User: Identidad y Acceso de usuarios
IF OBJECT_ID('saas.[User]', 'U') IS NULL
BEGIN
    CREATE TABLE saas.[User]
    (
        Id           UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_saas_User PRIMARY KEY DEFAULT NEWSEQUENTIALID(),
        TenantId     UNIQUEIDENTIFIER NULL CONSTRAINT FK_User_Tenant REFERENCES saas.Tenant(Id),
        Email        NVARCHAR(200)    NOT NULL CONSTRAINT UQ_User_Email UNIQUE,
        PasswordHash NVARCHAR(500)    NOT NULL,
        Role         VARCHAR(50)      NOT NULL, -- 'PortaForzaAdmin', 'TenantAdmin', 'Accountant', 'Resident', 'Guard'
        IsActive     BIT              NOT NULL CONSTRAINT DF_User_IsActive DEFAULT 1
    );
END
GO

-- ============================================================================
-- 2. ESQUEMA APP (Core del Negocio - Propiedades, Personas, Finanzas)
-- ============================================================================

-- app.Property: Condominios, Plazas Comerciales o Residenciales
IF OBJECT_ID('app.Property', 'U') IS NULL
BEGIN
    CREATE TABLE app.Property
    (
        Id          UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_app_Property PRIMARY KEY DEFAULT NEWSEQUENTIALID(),
        TenantId    UNIQUEIDENTIFIER NOT NULL CONSTRAINT FK_Property_Tenant REFERENCES saas.Tenant(Id),
        Name        NVARCHAR(150)    NOT NULL,
        Address     NVARCHAR(300)    NOT NULL
    );
END
GO

-- app.Block: Torres, Zonas, Manzanas dentro de una propiedad
IF OBJECT_ID('app.Block', 'U') IS NULL
BEGIN
    CREATE TABLE app.Block
    (
        Id          UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_app_Block PRIMARY KEY DEFAULT NEWSEQUENTIALID(),
        TenantId    UNIQUEIDENTIFIER NOT NULL CONSTRAINT FK_Block_Tenant REFERENCES saas.Tenant(Id),
        PropertyId  UNIQUEIDENTIFIER NOT NULL CONSTRAINT FK_Block_Property REFERENCES app.Property(Id),
        Name        NVARCHAR(100)    NOT NULL
    );
END
GO

-- app.Unit: Apartamentos, Locales u Oficinas
IF OBJECT_ID('app.Unit', 'U') IS NULL
BEGIN
    CREATE TABLE app.Unit
    (
        Id          UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_app_Unit PRIMARY KEY DEFAULT NEWSEQUENTIALID(),
        TenantId    UNIQUEIDENTIFIER NOT NULL CONSTRAINT FK_Unit_Tenant REFERENCES saas.Tenant(Id),
        BlockId     UNIQUEIDENTIFIER NOT NULL CONSTRAINT FK_Unit_Block REFERENCES app.Block(Id),
        UnitNumber  NVARCHAR(50)     NOT NULL,
        Status      VARCHAR(30)      NOT NULL CONSTRAINT DF_Unit_Status DEFAULT 'Available'
    );
END
GO

-- app.Person: Residentes y Propietarios (Sujeto a Soft-Anonymization, PROHIBIDO DELETE)
IF OBJECT_ID('app.Person', 'U') IS NULL
BEGIN
    CREATE TABLE app.Person
    (
        Id          UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_app_Person PRIMARY KEY DEFAULT NEWSEQUENTIALID(),
        TenantId    UNIQUEIDENTIFIER NOT NULL CONSTRAINT FK_Person_Tenant REFERENCES saas.Tenant(Id),
        FirstName   NVARCHAR(100)    NOT NULL,
        LastName    NVARCHAR(100)    NOT NULL,
        Email       NVARCHAR(200)    NULL,
        TaxId       NVARCHAR(30)     NULL -- Cédula / RNC para comprobantes fiscales
    );
END
GO

-- app.UnitResident: Relación persona - unidad (Dueño / Inquilino)
IF OBJECT_ID('app.UnitResident', 'U') IS NULL
BEGIN
    CREATE TABLE app.UnitResident
    (
        Id               UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_app_UnitResident PRIMARY KEY DEFAULT NEWSEQUENTIALID(),
        TenantId         UNIQUEIDENTIFIER NOT NULL CONSTRAINT FK_UnitResident_Tenant REFERENCES saas.Tenant(Id),
        UnitId           UNIQUEIDENTIFIER NOT NULL CONSTRAINT FK_UnitResident_Unit REFERENCES app.Unit(Id),
        PersonId         UNIQUEIDENTIFIER NOT NULL CONSTRAINT FK_UnitResident_Person REFERENCES app.Person(Id),
        RelationshipType VARCHAR(30)      NOT NULL CONSTRAINT DF_UnitResident_Type DEFAULT 'Owner', -- 'Owner', 'Tenant'
        IsActive         BIT              NOT NULL CONSTRAINT DF_UnitResident_IsActive DEFAULT 1
    );
END
GO

-- app.Invoice: Facturas y Cuentas por Cobrar
IF OBJECT_ID('app.Invoice', 'U') IS NULL
BEGIN
    CREATE TABLE app.Invoice
    (
        Id                  UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_app_Invoice PRIMARY KEY DEFAULT NEWSEQUENTIALID(),
        TenantId            UNIQUEIDENTIFIER NOT NULL CONSTRAINT FK_Invoice_Tenant REFERENCES saas.Tenant(Id),
        UnitId              UNIQUEIDENTIFIER NOT NULL CONSTRAINT FK_Invoice_Unit REFERENCES app.Unit(Id),
        Amount              DECIMAL(19,4)    NOT NULL,
        BalanceDue          DECIMAL(19,4)    NOT NULL,
        Status              VARCHAR(30)      NOT NULL CONSTRAINT DF_Invoice_Status DEFAULT 'Unpaid', -- 'Draft', 'Unpaid', 'Partial', 'Paid', 'Cancelled'
        FiscalReceiptType   VARCHAR(10)      NULL, -- Ej. 'B01', 'B02'
        FiscalReceiptNumber VARCHAR(50)      NULL, -- NCF secuencial
        IssueDate           DATE             NOT NULL,
        DueDate             DATE             NOT NULL,
        RowVersion          ROWVERSION       NOT NULL -- Concurrencia optimista
    );
END
GO

-- app.Payment: Pagos recibidos / Ingresos de caja
IF OBJECT_ID('app.Payment', 'U') IS NULL
BEGIN
    CREATE TABLE app.Payment
    (
        Id            UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_app_Payment PRIMARY KEY DEFAULT NEWSEQUENTIALID(),
        TenantId      UNIQUEIDENTIFIER NOT NULL CONSTRAINT FK_Payment_Tenant REFERENCES saas.Tenant(Id),
        PersonId      UNIQUEIDENTIFIER NOT NULL CONSTRAINT FK_Payment_Person REFERENCES app.Person(Id),
        TotalAmount   DECIMAL(19,4)    NOT NULL,
        PaymentMethod VARCHAR(30)      NOT NULL, -- 'CreditCard', 'Transfer', 'Cash'
        ReferenceId   NVARCHAR(100)    NOT NULL, -- Idempotencia bancaria / pasarela
        Status        VARCHAR(30)      NOT NULL CONSTRAINT DF_Payment_Status DEFAULT 'Completed', -- 'Completed', 'Reverted'
        CreatedAt     DATETIME2        NOT NULL CONSTRAINT DF_Payment_CreatedAt DEFAULT SYSUTCDATETIME()
    );
END
GO

-- app.PaymentApplication: Cruzamiento de pago con facturas
IF OBJECT_ID('app.PaymentApplication', 'U') IS NULL
BEGIN
    CREATE TABLE app.PaymentApplication
    (
        Id            UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_app_PaymentApplication PRIMARY KEY DEFAULT NEWSEQUENTIALID(),
        TenantId      UNIQUEIDENTIFIER NOT NULL CONSTRAINT FK_PaymentApp_Tenant REFERENCES saas.Tenant(Id),
        PaymentId     UNIQUEIDENTIFIER NOT NULL CONSTRAINT FK_PaymentApp_Payment REFERENCES app.Payment(Id),
        InvoiceId     UNIQUEIDENTIFIER NOT NULL CONSTRAINT FK_PaymentApp_Invoice REFERENCES app.Invoice(Id),
        AppliedAmount DECIMAL(19,4)    NOT NULL
    );
END
GO

-- app.Receipt: Recibos y Comprobantes de pago con PDF en Blob Storage
IF OBJECT_ID('app.Receipt', 'U') IS NULL
BEGIN
    CREATE TABLE app.Receipt
    (
        Id            UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_app_Receipt PRIMARY KEY DEFAULT NEWSEQUENTIALID(),
        TenantId      UNIQUEIDENTIFIER NOT NULL CONSTRAINT FK_Receipt_Tenant REFERENCES saas.Tenant(Id),
        PaymentId     UNIQUEIDENTIFIER NOT NULL CONSTRAINT FK_Receipt_Payment REFERENCES app.Payment(Id),
        ReceiptNumber NVARCHAR(50)     NOT NULL,
        BlobUrl       NVARCHAR(1000)   NULL,
        CreatedAt     DATETIME2        NOT NULL CONSTRAINT DF_Receipt_CreatedAt DEFAULT SYSUTCDATETIME()
    );
END
GO

-- app.OutboxMessage: Bandeja de salida transaccional (Transactional Outbox)
IF OBJECT_ID('app.OutboxMessage', 'U') IS NULL
BEGIN
    CREATE TABLE app.OutboxMessage
    (
        Id          UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_app_OutboxMessage PRIMARY KEY DEFAULT NEWSEQUENTIALID(),
        TenantId    UNIQUEIDENTIFIER NOT NULL CONSTRAINT FK_Outbox_Tenant REFERENCES saas.Tenant(Id),
        EventType   VARCHAR(100)     NOT NULL,
        Payload     NVARCHAR(MAX)    NOT NULL,
        CreatedAt   DATETIME2        NOT NULL CONSTRAINT DF_Outbox_CreatedAt DEFAULT SYSUTCDATETIME(),
        ProcessedAt DATETIME2        NULL,
        Error       NVARCHAR(MAX)    NULL
    );
END
GO

-- app.Supplier: Proveedores de bienes y servicios
IF OBJECT_ID('app.Supplier', 'U') IS NULL
BEGIN
    CREATE TABLE app.Supplier
    (
        Id       UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_app_Supplier PRIMARY KEY DEFAULT NEWSEQUENTIALID(),
        TenantId UNIQUEIDENTIFIER NOT NULL CONSTRAINT FK_Supplier_Tenant REFERENCES saas.Tenant(Id),
        Name     NVARCHAR(150)    NOT NULL,
        TaxId    NVARCHAR(30)     NULL,
        Email    NVARCHAR(200)    NULL,
        Phone    NVARCHAR(50)     NULL,
        Address  NVARCHAR(300)    NULL,
        IsActive BIT              NOT NULL CONSTRAINT DF_Supplier_IsActive DEFAULT 1
    );
END
GO

-- app.Expense: Egresos y gastos operacionales
IF OBJECT_ID('app.Expense', 'U') IS NULL
BEGIN
    CREATE TABLE app.Expense
    (
        Id                  UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_app_Expense PRIMARY KEY DEFAULT NEWSEQUENTIALID(),
        TenantId            UNIQUEIDENTIFIER NOT NULL CONSTRAINT FK_Expense_Tenant REFERENCES saas.Tenant(Id),
        PropertyId          UNIQUEIDENTIFIER NOT NULL CONSTRAINT FK_Expense_Property REFERENCES app.Property(Id),
        SupplierId          UNIQUEIDENTIFIER NULL CONSTRAINT FK_Expense_Supplier REFERENCES app.Supplier(Id),
        Concept             NVARCHAR(250)    NOT NULL,
        Amount              DECIMAL(19,4)    NOT NULL,
        ExpenseDate         DATE             NOT NULL,
        FiscalReceiptNumber VARCHAR(50)      NULL,
        Status              VARCHAR(30)      NOT NULL CONSTRAINT DF_Expense_Status DEFAULT 'Paid'
    );
END
GO

-- app.MaintenanceTicket: Incidencias y tickets de Helpdesk
IF OBJECT_ID('app.MaintenanceTicket', 'U') IS NULL
BEGIN
    CREATE TABLE app.MaintenanceTicket
    (
        Id                 UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_app_MaintenanceTicket PRIMARY KEY DEFAULT NEWSEQUENTIALID(),
        TenantId           UNIQUEIDENTIFIER NOT NULL CONSTRAINT FK_Ticket_Tenant REFERENCES saas.Tenant(Id),
        PropertyId         UNIQUEIDENTIFIER NOT NULL CONSTRAINT FK_Ticket_Property REFERENCES app.Property(Id),
        UnitId             UNIQUEIDENTIFIER NULL CONSTRAINT FK_Ticket_Unit REFERENCES app.Unit(Id),
        ReportedByPersonId UNIQUEIDENTIFIER NOT NULL CONSTRAINT FK_Ticket_Person REFERENCES app.Person(Id),
        Title              NVARCHAR(150)    NOT NULL,
        Description        NVARCHAR(MAX)    NOT NULL,
        Priority           VARCHAR(30)      NOT NULL CONSTRAINT DF_Ticket_Priority DEFAULT 'Medium',
        Status             VARCHAR(30)      NOT NULL CONSTRAINT DF_Ticket_Status DEFAULT 'Open',
        CreatedAt          DATETIME2        NOT NULL CONSTRAINT DF_Ticket_CreatedAt DEFAULT SYSUTCDATETIME(),
        ResolvedAt         DATETIME2        NULL
    );
END
GO

-- app.Amenity: Catálogo de áreas comunes y amenidades
IF OBJECT_ID('app.Amenity', 'U') IS NULL
BEGIN
    CREATE TABLE app.Amenity
    (
        Id         UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_app_Amenity PRIMARY KEY DEFAULT NEWSEQUENTIALID(),
        TenantId   UNIQUEIDENTIFIER NOT NULL CONSTRAINT FK_Amenity_Tenant REFERENCES saas.Tenant(Id),
        PropertyId UNIQUEIDENTIFIER NOT NULL CONSTRAINT FK_Amenity_Property REFERENCES app.Property(Id),
        Name       NVARCHAR(100)    NOT NULL,
        Capacity   INT              NOT NULL CONSTRAINT DF_Amenity_Capacity DEFAULT 1,
        HourlyRate DECIMAL(19,4)    NOT NULL CONSTRAINT DF_Amenity_Rate DEFAULT 0,
        IsActive   BIT              NOT NULL CONSTRAINT DF_Amenity_IsActive DEFAULT 1
    );
END
GO

-- app.AmenityBooking: Reservas de amenidades
IF OBJECT_ID('app.AmenityBooking', 'U') IS NULL
BEGIN
    CREATE TABLE app.AmenityBooking
    (
        Id          UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_app_AmenityBooking PRIMARY KEY DEFAULT NEWSEQUENTIALID(),
        TenantId    UNIQUEIDENTIFIER NOT NULL CONSTRAINT FK_Booking_Tenant REFERENCES saas.Tenant(Id),
        AmenityId   UNIQUEIDENTIFIER NOT NULL CONSTRAINT FK_Booking_Amenity REFERENCES app.Amenity(Id),
        PersonId    UNIQUEIDENTIFIER NOT NULL CONSTRAINT FK_Booking_Person REFERENCES app.Person(Id),
        UnitId      UNIQUEIDENTIFIER NOT NULL CONSTRAINT FK_Booking_Unit REFERENCES app.Unit(Id),
        StartTime   DATETIME2        NOT NULL,
        EndTime     DATETIME2        NOT NULL,
        TotalAmount DECIMAL(19,4)    NOT NULL CONSTRAINT DF_Booking_Amount DEFAULT 0,
        Status      VARCHAR(30)      NOT NULL CONSTRAINT DF_Booking_Status DEFAULT 'Confirmed',
        CreatedAt   DATETIME2        NOT NULL CONSTRAINT DF_Booking_CreatedAt DEFAULT SYSUTCDATETIME()
    );
END
GO

-- app.VisitorPass: Pases de visita e invitaciones QR
IF OBJECT_ID('app.VisitorPass', 'U') IS NULL
BEGIN
    CREATE TABLE app.VisitorPass
    (
        Id              UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_app_VisitorPass PRIMARY KEY DEFAULT NEWSEQUENTIALID(),
        TenantId        UNIQUEIDENTIFIER NOT NULL CONSTRAINT FK_Pass_Tenant REFERENCES saas.Tenant(Id),
        UnitId          UNIQUEIDENTIFIER NOT NULL CONSTRAINT FK_Pass_Unit REFERENCES app.Unit(Id),
        VisitorName     NVARCHAR(150)    NOT NULL,
        VisitorIdNumber VARCHAR(50)      NULL,
        ValidFrom       DATETIME2        NOT NULL,
        ValidTo         DATETIME2        NOT NULL,
        QrCodeToken     VARCHAR(100)     NOT NULL,
        Status          VARCHAR(30)      NOT NULL CONSTRAINT DF_Pass_Status DEFAULT 'Active'
    );
END
GO

-- app.GateLog: Bitácora física de accesos en garita
IF OBJECT_ID('app.GateLog', 'U') IS NULL
BEGIN
    CREATE TABLE app.GateLog
    (
        Id            UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_app_GateLog PRIMARY KEY DEFAULT NEWSEQUENTIALID(),
        TenantId      UNIQUEIDENTIFIER NOT NULL CONSTRAINT FK_GateLog_Tenant REFERENCES saas.Tenant(Id),
        PropertyId    UNIQUEIDENTIFIER NOT NULL CONSTRAINT FK_GateLog_Property REFERENCES app.Property(Id),
        VisitorPassId UNIQUEIDENTIFIER NULL CONSTRAINT FK_GateLog_Pass REFERENCES app.VisitorPass(Id),
        GuardUserId   UNIQUEIDENTIFIER NOT NULL CONSTRAINT FK_GateLog_Guard REFERENCES saas.[User](Id),
        VisitorName   NVARCHAR(150)    NOT NULL,
        VehiclePlate  VARCHAR(30)      NULL,
        EntryTime     DATETIME2        NOT NULL CONSTRAINT DF_GateLog_EntryTime DEFAULT SYSUTCDATETIME(),
        ExitTime      DATETIME2        NULL
    );
END
GO

-- app.BankTransaction: Líneas de extractos bancarios para conciliación
IF OBJECT_ID('app.BankTransaction', 'U') IS NULL
BEGIN
    CREATE TABLE app.BankTransaction
    (
        Id               UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_app_BankTransaction PRIMARY KEY DEFAULT NEWSEQUENTIALID(),
        TenantId         UNIQUEIDENTIFIER NOT NULL CONSTRAINT FK_BankTx_Tenant REFERENCES saas.Tenant(Id),
        PropertyId       UNIQUEIDENTIFIER NOT NULL CONSTRAINT FK_BankTx_Property REFERENCES app.Property(Id),
        TransactionDate  DATE             NOT NULL,
        Description      NVARCHAR(250)    NOT NULL,
        Amount           DECIMAL(19,4)    NOT NULL,
        ReferenceNumber  NVARCHAR(100)    NULL,
        IsReconciled     BIT              NOT NULL CONSTRAINT DF_BankTx_Reconciled DEFAULT 0,
        MatchedPaymentId UNIQUEIDENTIFIER NULL CONSTRAINT FK_BankTx_Payment REFERENCES app.Payment(Id),
        ImportedAt       DATETIME2        NOT NULL CONSTRAINT DF_BankTx_ImportedAt DEFAULT SYSUTCDATETIME()
    );
END
GO

-- ============================================================================
-- 3. ESQUEMA AUDIT (Trazabilidad Inmutable y Soporte con Impersonation)
-- ============================================================================

-- audit.AuditLog: Registro append-only de modificaciones
IF OBJECT_ID('audit.AuditLog', 'U') IS NULL
BEGIN
    CREATE TABLE audit.AuditLog
    (
        Id             BIGINT IDENTITY(1,1) NOT NULL CONSTRAINT PK_audit_AuditLog PRIMARY KEY,
        TenantId       UNIQUEIDENTIFIER     NOT NULL CONSTRAINT FK_AuditLog_Tenant REFERENCES saas.Tenant(Id),
        UserId         UNIQUEIDENTIFIER     NOT NULL,
        ImpersonatorId UNIQUEIDENTIFIER     NULL, -- SuperAdmin que ejecutó la acción si fue impersonated
        Action         VARCHAR(30)          NOT NULL, -- 'Insert', 'Update', 'Delete', 'Anonymize'
        TableName      VARCHAR(100)         NOT NULL,
        RecordId       VARCHAR(100)         NOT NULL,
        OldValues      NVARCHAR(MAX)        NULL, -- JSON
        NewValues      NVARCHAR(MAX)        NULL, -- JSON
        CreatedAt      DATETIME2            NOT NULL CONSTRAINT DF_AuditLog_CreatedAt DEFAULT SYSUTCDATETIME()
    );
END
GO
