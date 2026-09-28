-- ============================================================================
-- ADMINSOFTGPF - 05_STOREDPROCEDURES.SQL
-- Plataforma: AdminSoftGPF (powered by PortaForza)
-- Descripción: Procedimientos almacenados para consumo exclusivo vía ADO.NET.
--              Toda consulta/mutación incluye filtrado por TenantId y soporte
--              para Soft-Anonymization, RowVersion y transacciones atómicas.
-- ============================================================================

-- ============================================================================
-- 1. SAAS.TENANT PROCEDURES
-- ============================================================================

CREATE OR ALTER PROCEDURE saas.usp_Tenant_Create
    @Id UNIQUEIDENTIFIER OUTPUT,
    @Name NVARCHAR(150),
    @TaxId NVARCHAR(30) = NULL,
    @Status VARCHAR(20) = 'Active'
AS
BEGIN
    SET NOCOUNT ON;
    SET @Id = NEWID();

    INSERT INTO saas.Tenant (Id, Name, TaxId, Status, CreatedAt)
    VALUES (@Id, @Name, @TaxId, @Status, SYSUTCDATETIME());
END
GO

CREATE OR ALTER PROCEDURE saas.usp_Tenant_GetById
    @Id UNIQUEIDENTIFIER
AS
BEGIN
    SET NOCOUNT ON;
    SELECT Id, Name, TaxId, Status, CreatedAt
    FROM saas.Tenant
    WHERE Id = @Id;
END
GO

CREATE OR ALTER PROCEDURE saas.usp_Tenant_ListAll
AS
BEGIN
    SET NOCOUNT ON;
    SELECT Id, Name, TaxId, Status, CreatedAt
    FROM saas.Tenant
    ORDER BY CreatedAt DESC;
END
GO

CREATE OR ALTER PROCEDURE saas.usp_Tenant_UpdateStatus
    @Id UNIQUEIDENTIFIER,
    @Status VARCHAR(20)
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE saas.Tenant
    SET Status = @Status
    WHERE Id = @Id;
END
GO

-- ============================================================================
-- 2. SAAS.USER PROCEDURES
-- ============================================================================

CREATE OR ALTER PROCEDURE saas.usp_User_Create
    @Id UNIQUEIDENTIFIER OUTPUT,
    @TenantId UNIQUEIDENTIFIER = NULL,
    @Email NVARCHAR(200),
    @PasswordHash NVARCHAR(500),
    @Role VARCHAR(50),
    @IsActive BIT = 1
AS
BEGIN
    SET NOCOUNT ON;
    SET @Id = NEWID();

    INSERT INTO saas.[User] (Id, TenantId, Email, PasswordHash, Role, IsActive)
    VALUES (@Id, @TenantId, @Email, @PasswordHash, @Role, @IsActive);
END
GO

CREATE OR ALTER PROCEDURE saas.usp_User_GetById
    @Id UNIQUEIDENTIFIER
AS
BEGIN
    SET NOCOUNT ON;
    SELECT Id, TenantId, Email, PasswordHash, Role, IsActive
    FROM saas.[User]
    WHERE Id = @Id;
END
GO

CREATE OR ALTER PROCEDURE saas.usp_User_GetByEmail
    @Email NVARCHAR(200)
AS
BEGIN
    SET NOCOUNT ON;
    SELECT Id, TenantId, Email, PasswordHash, Role, IsActive
    FROM saas.[User]
    WHERE Email = @Email;
END
GO

CREATE OR ALTER PROCEDURE saas.usp_User_ListByTenant
    @TenantId UNIQUEIDENTIFIER
AS
BEGIN
    SET NOCOUNT ON;
    SELECT Id, TenantId, Email, PasswordHash, Role, IsActive
    FROM saas.[User]
    WHERE TenantId = @TenantId;
END
GO

CREATE OR ALTER PROCEDURE saas.usp_User_UpdatePassword
    @Id UNIQUEIDENTIFIER,
    @PasswordHash NVARCHAR(500)
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE saas.[User]
    SET PasswordHash = @PasswordHash
    WHERE Id = @Id;
END
GO

CREATE OR ALTER PROCEDURE saas.usp_User_SetActive
    @Id UNIQUEIDENTIFIER,
    @IsActive BIT
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE saas.[User]
    SET IsActive = @IsActive
    WHERE Id = @Id;
END
GO

-- ============================================================================
-- 3. APP.PROPERTY PROCEDURES
-- ============================================================================

CREATE OR ALTER PROCEDURE app.usp_Property_Create
    @Id UNIQUEIDENTIFIER OUTPUT,
    @TenantId UNIQUEIDENTIFIER,
    @Name NVARCHAR(150),
    @Address NVARCHAR(300)
AS
BEGIN
    SET NOCOUNT ON;
    SET @Id = NEWID();

    INSERT INTO app.Property (Id, TenantId, Name, Address)
    VALUES (@Id, @TenantId, @Name, @Address);
END
GO

CREATE OR ALTER PROCEDURE app.usp_Property_GetById
    @Id UNIQUEIDENTIFIER,
    @TenantId UNIQUEIDENTIFIER
AS
BEGIN
    SET NOCOUNT ON;
    SELECT Id, TenantId, Name, Address
    FROM app.Property
    WHERE Id = @Id AND TenantId = @TenantId;
END
GO

CREATE OR ALTER PROCEDURE app.usp_Property_ListByTenant
    @TenantId UNIQUEIDENTIFIER
AS
BEGIN
    SET NOCOUNT ON;
    SELECT Id, TenantId, Name, Address
    FROM app.Property
    WHERE TenantId = @TenantId
    ORDER BY Name ASC;
END
GO

CREATE OR ALTER PROCEDURE app.usp_Property_Update
    @Id UNIQUEIDENTIFIER,
    @TenantId UNIQUEIDENTIFIER,
    @Name NVARCHAR(150),
    @Address NVARCHAR(300)
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE app.Property
    SET Name = @Name, Address = @Address
    WHERE Id = @Id AND TenantId = @TenantId;
END
GO

-- ============================================================================
-- 4. APP.BLOCK PROCEDURES
-- ============================================================================

CREATE OR ALTER PROCEDURE app.usp_Block_Create
    @Id UNIQUEIDENTIFIER OUTPUT,
    @TenantId UNIQUEIDENTIFIER,
    @PropertyId UNIQUEIDENTIFIER,
    @Name NVARCHAR(100)
AS
BEGIN
    SET NOCOUNT ON;
    SET @Id = NEWID();

    INSERT INTO app.Block (Id, TenantId, PropertyId, Name)
    VALUES (@Id, @TenantId, @PropertyId, @Name);
END
GO

CREATE OR ALTER PROCEDURE app.usp_Block_GetById
    @Id UNIQUEIDENTIFIER,
    @TenantId UNIQUEIDENTIFIER
AS
BEGIN
    SET NOCOUNT ON;
    SELECT Id, TenantId, PropertyId, Name
    FROM app.Block
    WHERE Id = @Id AND TenantId = @TenantId;
END
GO

CREATE OR ALTER PROCEDURE app.usp_Block_ListByProperty
    @PropertyId UNIQUEIDENTIFIER,
    @TenantId UNIQUEIDENTIFIER
AS
BEGIN
    SET NOCOUNT ON;
    SELECT Id, TenantId, PropertyId, Name
    FROM app.Block
    WHERE PropertyId = @PropertyId AND TenantId = @TenantId
    ORDER BY Name ASC;
END
GO

CREATE OR ALTER PROCEDURE app.usp_Block_Update
    @Id UNIQUEIDENTIFIER,
    @TenantId UNIQUEIDENTIFIER,
    @Name NVARCHAR(100)
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE app.Block
    SET Name = @Name
    WHERE Id = @Id AND TenantId = @TenantId;
END
GO

-- ============================================================================
-- 5. APP.UNIT PROCEDURES
-- ============================================================================

CREATE OR ALTER PROCEDURE app.usp_Unit_Create
    @Id UNIQUEIDENTIFIER OUTPUT,
    @TenantId UNIQUEIDENTIFIER,
    @BlockId UNIQUEIDENTIFIER,
    @UnitNumber NVARCHAR(50),
    @Status VARCHAR(30) = 'Available'
AS
BEGIN
    SET NOCOUNT ON;
    SET @Id = NEWID();

    INSERT INTO app.Unit (Id, TenantId, BlockId, UnitNumber, Status)
    VALUES (@Id, @TenantId, @BlockId, @UnitNumber, @Status);
END
GO

CREATE OR ALTER PROCEDURE app.usp_Unit_GetById
    @Id UNIQUEIDENTIFIER,
    @TenantId UNIQUEIDENTIFIER
AS
BEGIN
    SET NOCOUNT ON;
    SELECT Id, TenantId, BlockId, UnitNumber, Status
    FROM app.Unit
    WHERE Id = @Id AND TenantId = @TenantId;
END
GO

CREATE OR ALTER PROCEDURE app.usp_Unit_ListByBlock
    @BlockId UNIQUEIDENTIFIER,
    @TenantId UNIQUEIDENTIFIER
AS
BEGIN
    SET NOCOUNT ON;
    SELECT Id, TenantId, BlockId, UnitNumber, Status
    FROM app.Unit
    WHERE BlockId = @BlockId AND TenantId = @TenantId
    ORDER BY UnitNumber ASC;
END
GO

CREATE OR ALTER PROCEDURE app.usp_Unit_ListByProperty
    @PropertyId UNIQUEIDENTIFIER,
    @TenantId UNIQUEIDENTIFIER
AS
BEGIN
    SET NOCOUNT ON;
    SELECT u.Id, u.TenantId, u.BlockId, u.UnitNumber, u.Status
    FROM app.Unit u
    INNER JOIN app.Block b ON u.BlockId = b.Id
    WHERE b.PropertyId = @PropertyId AND u.TenantId = @TenantId
    ORDER BY u.UnitNumber ASC;
END
GO

CREATE OR ALTER PROCEDURE app.usp_Unit_Update
    @Id UNIQUEIDENTIFIER,
    @TenantId UNIQUEIDENTIFIER,
    @UnitNumber NVARCHAR(50),
    @Status VARCHAR(30)
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE app.Unit
    SET UnitNumber = @UnitNumber, Status = @Status
    WHERE Id = @Id AND TenantId = @TenantId;
END
GO

-- ============================================================================
-- 6. APP.PERSON PROCEDURES (Con Soft-Anonymization y PROHIBIDO DELETE)
-- ============================================================================

CREATE OR ALTER PROCEDURE app.usp_Person_Create
    @Id UNIQUEIDENTIFIER OUTPUT,
    @TenantId UNIQUEIDENTIFIER,
    @FirstName NVARCHAR(100),
    @LastName NVARCHAR(100),
    @Email NVARCHAR(200) = NULL,
    @TaxId NVARCHAR(30) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SET @Id = NEWID();

    INSERT INTO app.Person (Id, TenantId, FirstName, LastName, Email, TaxId)
    VALUES (@Id, @TenantId, @FirstName, @LastName, @Email, @TaxId);
END
GO

CREATE OR ALTER PROCEDURE app.usp_Person_GetById
    @Id UNIQUEIDENTIFIER,
    @TenantId UNIQUEIDENTIFIER
AS
BEGIN
    SET NOCOUNT ON;
    SELECT Id, TenantId, FirstName, LastName, Email, TaxId
    FROM app.Person
    WHERE Id = @Id AND TenantId = @TenantId;
END
GO

CREATE OR ALTER PROCEDURE app.usp_Person_ListByTenant
    @TenantId UNIQUEIDENTIFIER
AS
BEGIN
    SET NOCOUNT ON;
    SELECT Id, TenantId, FirstName, LastName, Email, TaxId
    FROM app.Person
    WHERE TenantId = @TenantId
    ORDER BY LastName ASC, FirstName ASC;
END
GO

CREATE OR ALTER PROCEDURE app.usp_Person_Update
    @Id UNIQUEIDENTIFIER,
    @TenantId UNIQUEIDENTIFIER,
    @FirstName NVARCHAR(100),
    @LastName NVARCHAR(100),
    @Email NVARCHAR(200) = NULL,
    @TaxId NVARCHAR(30) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE app.Person
    SET FirstName = @FirstName, LastName = @LastName, Email = @Email, TaxId = @TaxId
    WHERE Id = @Id AND TenantId = @TenantId;
END
GO

-- Soft-Anonymization: Anonimiza los datos PII sin romper la FK histórica
CREATE OR ALTER PROCEDURE app.usp_Person_Anonymize
    @Id UNIQUEIDENTIFIER,
    @TenantId UNIQUEIDENTIFIER
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE app.Person
    SET FirstName = N'Usuario',
        LastName  = N'Anonimizado',
        Email     = NULL,
        TaxId     = NULL
    WHERE Id = @Id AND TenantId = @TenantId;
END
GO

-- ============================================================================
-- 7. APP.UNITRESIDENT PROCEDURES
-- ============================================================================

CREATE OR ALTER PROCEDURE app.usp_UnitResident_Assign
    @Id UNIQUEIDENTIFIER OUTPUT,
    @TenantId UNIQUEIDENTIFIER,
    @UnitId UNIQUEIDENTIFIER,
    @PersonId UNIQUEIDENTIFIER,
    @RelationshipType VARCHAR(30) = 'Owner',
    @IsActive BIT = 1
AS
BEGIN
    SET NOCOUNT ON;
    SET @Id = NEWID();

    INSERT INTO app.UnitResident (Id, TenantId, UnitId, PersonId, RelationshipType, IsActive)
    VALUES (@Id, @TenantId, @UnitId, @PersonId, @RelationshipType, @IsActive);
END
GO

CREATE OR ALTER PROCEDURE app.usp_UnitResident_ListByUnit
    @UnitId UNIQUEIDENTIFIER,
    @TenantId UNIQUEIDENTIFIER
AS
BEGIN
    SET NOCOUNT ON;
    SELECT Id, TenantId, UnitId, PersonId, RelationshipType, IsActive
    FROM app.UnitResident
    WHERE UnitId = @UnitId AND TenantId = @TenantId AND IsActive = 1;
END
GO

CREATE OR ALTER PROCEDURE app.usp_UnitResident_ListByPerson
    @PersonId UNIQUEIDENTIFIER,
    @TenantId UNIQUEIDENTIFIER
AS
BEGIN
    SET NOCOUNT ON;
    SELECT Id, TenantId, UnitId, PersonId, RelationshipType, IsActive
    FROM app.UnitResident
    WHERE PersonId = @PersonId AND TenantId = @TenantId;
END
GO

CREATE OR ALTER PROCEDURE app.usp_UnitResident_Deactivate
    @Id UNIQUEIDENTIFIER,
    @TenantId UNIQUEIDENTIFIER
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE app.UnitResident
    SET IsActive = 0
    WHERE Id = @Id AND TenantId = @TenantId;
END
GO

-- ============================================================================
-- 8. APP.INVOICE PROCEDURES (Con RowVersion)
-- ============================================================================

CREATE OR ALTER PROCEDURE app.usp_Invoice_Create
    @Id UNIQUEIDENTIFIER OUTPUT,
    @TenantId UNIQUEIDENTIFIER,
    @UnitId UNIQUEIDENTIFIER,
    @Amount DECIMAL(19,4),
    @BalanceDue DECIMAL(19,4),
    @Status VARCHAR(30) = 'Unpaid',
    @FiscalReceiptType VARCHAR(10) = NULL,
    @FiscalReceiptNumber VARCHAR(50) = NULL,
    @IssueDate DATE,
    @DueDate DATE
AS
BEGIN
    SET NOCOUNT ON;
    SET @Id = NEWID();

    INSERT INTO app.Invoice (Id, TenantId, UnitId, Amount, BalanceDue, Status, FiscalReceiptType, FiscalReceiptNumber, IssueDate, DueDate)
    VALUES (@Id, @TenantId, @UnitId, @Amount, @BalanceDue, @Status, @FiscalReceiptType, @FiscalReceiptNumber, @IssueDate, @DueDate);
END
GO

CREATE OR ALTER PROCEDURE app.usp_Invoice_GetById
    @Id UNIQUEIDENTIFIER,
    @TenantId UNIQUEIDENTIFIER
AS
BEGIN
    SET NOCOUNT ON;
    SELECT Id, TenantId, UnitId, Amount, BalanceDue, Status, FiscalReceiptType, FiscalReceiptNumber, IssueDate, DueDate, RowVersion
    FROM app.Invoice
    WHERE Id = @Id AND TenantId = @TenantId;
END
GO

CREATE OR ALTER PROCEDURE app.usp_Invoice_ListByUnit
    @UnitId UNIQUEIDENTIFIER,
    @TenantId UNIQUEIDENTIFIER
AS
BEGIN
    SET NOCOUNT ON;
    SELECT Id, TenantId, UnitId, Amount, BalanceDue, Status, FiscalReceiptType, FiscalReceiptNumber, IssueDate, DueDate, RowVersion
    FROM app.Invoice
    WHERE UnitId = @UnitId AND TenantId = @TenantId
    ORDER BY DueDate DESC;
END
GO

CREATE OR ALTER PROCEDURE app.usp_Invoice_ListUnpaidByTenant
    @TenantId UNIQUEIDENTIFIER
AS
BEGIN
    SET NOCOUNT ON;
    SELECT Id, TenantId, UnitId, Amount, BalanceDue, Status, FiscalReceiptType, FiscalReceiptNumber, IssueDate, DueDate, RowVersion
    FROM app.Invoice
    WHERE TenantId = @TenantId AND Status IN ('Unpaid', 'Partial')
    ORDER BY DueDate ASC;
END
GO

CREATE OR ALTER PROCEDURE app.usp_Invoice_UpdateBalanceAndStatus
    @Id UNIQUEIDENTIFIER,
    @TenantId UNIQUEIDENTIFIER,
    @BalanceDue DECIMAL(19,4),
    @Status VARCHAR(30),
    @RowVersion ROWVERSION
AS
BEGIN
    SET NOCOUNT ON;

    UPDATE app.Invoice
    SET BalanceDue = @BalanceDue,
        Status = @Status
    WHERE Id = @Id 
      AND TenantId = @TenantId 
      AND RowVersion = @RowVersion;

    IF @@ROWCOUNT = 0
    BEGIN
        THROW 51000, 'Conflicto de concurrencia optimista al actualizar Invoice (RowVersion desactualizado).', 1;
    END
END
GO

-- ============================================================================
-- 9. APP.PAYMENT & TREASURY PROCEDURES
-- ============================================================================

CREATE OR ALTER PROCEDURE app.usp_Payment_GetById
    @Id UNIQUEIDENTIFIER,
    @TenantId UNIQUEIDENTIFIER
AS
BEGIN
    SET NOCOUNT ON;
    SELECT Id, TenantId, PersonId, TotalAmount, PaymentMethod, ReferenceId, Status, CreatedAt
    FROM app.Payment
    WHERE Id = @Id AND TenantId = @TenantId;
END
GO

CREATE OR ALTER PROCEDURE app.usp_Payment_GetByReferenceId
    @ReferenceId NVARCHAR(100),
    @TenantId UNIQUEIDENTIFIER
AS
BEGIN
    SET NOCOUNT ON;
    SELECT Id, TenantId, PersonId, TotalAmount, PaymentMethod, ReferenceId, Status, CreatedAt
    FROM app.Payment
    WHERE ReferenceId = @ReferenceId AND TenantId = @TenantId;
END
GO

CREATE OR ALTER PROCEDURE app.usp_Payment_ListByPerson
    @PersonId UNIQUEIDENTIFIER,
    @TenantId UNIQUEIDENTIFIER
AS
BEGIN
    SET NOCOUNT ON;
    SELECT Id, TenantId, PersonId, TotalAmount, PaymentMethod, ReferenceId, Status, CreatedAt
    FROM app.Payment
    WHERE PersonId = @PersonId AND TenantId = @TenantId
    ORDER BY CreatedAt DESC;
END
GO

-- ============================================================================
-- 10. AUDIT.AUDITLOG PROCEDURES
-- ============================================================================

CREATE OR ALTER PROCEDURE audit.usp_AuditLog_Insert
    @Id BIGINT OUTPUT,
    @TenantId UNIQUEIDENTIFIER,
    @UserId UNIQUEIDENTIFIER,
    @ImpersonatorId UNIQUEIDENTIFIER = NULL,
    @Action VARCHAR(30),
    @TableName VARCHAR(100),
    @RecordId VARCHAR(100),
    @OldValues NVARCHAR(MAX) = NULL,
    @NewValues NVARCHAR(MAX) = NULL
AS
BEGIN
    SET NOCOUNT ON;

    INSERT INTO audit.AuditLog (TenantId, UserId, ImpersonatorId, Action, TableName, RecordId, OldValues, NewValues, CreatedAt)
    VALUES (@TenantId, @UserId, @ImpersonatorId, @Action, @TableName, @RecordId, @OldValues, @NewValues, SYSUTCDATETIME());

    SET @Id = SCOPE_IDENTITY();
END
GO

CREATE OR ALTER PROCEDURE audit.usp_AuditLog_ListByRecord
    @TableName VARCHAR(100),
    @RecordId VARCHAR(100)
AS
BEGIN
    SET NOCOUNT ON;
    SELECT Id, TenantId, UserId, ImpersonatorId, Action, TableName, RecordId, OldValues, NewValues, CreatedAt
    FROM audit.AuditLog
    WHERE TableName = @TableName AND RecordId = @RecordId
    ORDER BY CreatedAt DESC;
END
GO

CREATE OR ALTER PROCEDURE audit.usp_AuditLog_ListByTenant
    @TenantId UNIQUEIDENTIFIER,
    @MaxRecords INT = 100
AS
BEGIN
    SET NOCOUNT ON;
    SELECT TOP (@MaxRecords) Id, TenantId, UserId, ImpersonatorId, Action, TableName, RecordId, OldValues, NewValues, CreatedAt
    FROM audit.AuditLog
    WHERE TenantId = @TenantId
    ORDER BY CreatedAt DESC;
END
GO
