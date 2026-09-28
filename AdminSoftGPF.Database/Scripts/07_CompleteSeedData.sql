-- ============================================================================
-- ADMINSOFTGPF - 07_CompleteSeedData.sql
-- Plataforma: AdminSoftGPF (powered by PortaForza)
-- Descripción: Datos reales y completos para todas las entidades del sistema
-- ============================================================================

USE AdminSoftGPF_Dev;
GO

SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
SET NOCOUNT ON;
GO

PRINT '================================================================';
PRINT '>>> INICIANDO POBLADO DE DATOS REALES EN ADMINSOFTGPF...';
PRINT '================================================================';

-- 1. TENANT PRINCIPAL Y SECUNDARIO
DECLARE @Tenant1 UNIQUEIDENTIFIER = 'C1D2E3F4-1111-2222-3333-444444444444';
DECLARE @Tenant2 UNIQUEIDENTIFIER = 'C2D2E3F4-2222-3333-4444-555555555555';

IF NOT EXISTS (SELECT 1 FROM saas.Tenant WHERE Id = @Tenant1)
BEGIN
    INSERT INTO saas.Tenant (Id, Name, TaxId, Status, CreatedAt)
    VALUES (@Tenant1, 'Residencial Las Palmas', 'RNC-101-998877', 'Active', SYSUTCDATETIME());
END
ELSE
BEGIN
    UPDATE saas.Tenant SET Name = 'Residencial Las Palmas', TaxId = 'RNC-101-998877', Status = 'Active' WHERE Id = @Tenant1;
END

IF NOT EXISTS (SELECT 1 FROM saas.Tenant WHERE Id = @Tenant2)
BEGIN
    INSERT INTO saas.Tenant (Id, Name, TaxId, Status, CreatedAt)
    VALUES (@Tenant2, 'Torre del Parque Business & Residencial', 'RNC-131-445566', 'Active', SYSUTCDATETIME());
END
PRINT '>>> Tenants verificados.';

-- 2. USUARIOS CON HASH VALIDO (Password123!)
DECLARE @PasswordHash NVARCHAR(500) = '81018121A2BA84CB807DC6096F15911596D2B2F31F184BBC2D3D282821B10472:61B3063EAE3447A05D87EEADC1323570:100000:SHA256';

IF NOT EXISTS (SELECT 1 FROM saas.[User] WHERE Email = 'superadmin@portaforza.com')
BEGIN
    INSERT INTO saas.[User] (Id, TenantId, Email, PasswordHash, Role, IsActive)
    VALUES ('B1A2C3D4-0000-0000-0000-000000000001', NULL, 'superadmin@portaforza.com', @PasswordHash, 'PortaForzaAdmin', 1);
END

IF NOT EXISTS (SELECT 1 FROM saas.[User] WHERE Email = 'admin@condominio.com')
BEGIN
    INSERT INTO saas.[User] (Id, TenantId, Email, PasswordHash, Role, IsActive)
    VALUES ('B1A2C3D4-0000-0000-0000-000000000003', @Tenant1, 'admin@condominio.com', @PasswordHash, 'TenantAdmin', 1);
END

IF NOT EXISTS (SELECT 1 FROM saas.[User] WHERE Email = 'admin@portaforza.com')
BEGIN
    INSERT INTO saas.[User] (Id, TenantId, Email, PasswordHash, Role, IsActive)
    VALUES ('B1A2C3D4-0000-0000-0000-000000000002', @Tenant1, 'admin@portaforza.com', @PasswordHash, 'TenantAdmin', 1);
END

IF NOT EXISTS (SELECT 1 FROM saas.[User] WHERE Email = 'contabilidad@condominio.com')
BEGIN
    INSERT INTO saas.[User] (Id, TenantId, Email, PasswordHash, Role, IsActive)
    VALUES ('B1A2C3D4-0000-0000-0000-000000000006', @Tenant1, 'contabilidad@condominio.com', @PasswordHash, 'Accountant', 1);
END

IF NOT EXISTS (SELECT 1 FROM saas.[User] WHERE Email = 'guard@condominio.com')
BEGIN
    INSERT INTO saas.[User] (Id, TenantId, Email, PasswordHash, Role, IsActive)
    VALUES ('B1A2C3D4-0000-0000-0000-000000000004', @Tenant1, 'guard@condominio.com', @PasswordHash, 'Guard', 1);
END

IF NOT EXISTS (SELECT 1 FROM saas.[User] WHERE Email = 'admin@torredelparque.com')
BEGIN
    INSERT INTO saas.[User] (Id, TenantId, Email, PasswordHash, Role, IsActive)
    VALUES ('B1A2C3D4-0000-0000-0000-000000000010', @Tenant2, 'admin@torredelparque.com', @PasswordHash, 'TenantAdmin', 1);
END

IF NOT EXISTS (SELECT 1 FROM saas.[User] WHERE Email = 'residente@torredelparque.com')
BEGIN
    INSERT INTO saas.[User] (Id, TenantId, Email, PasswordHash, Role, IsActive)
    VALUES ('B1A2C3D4-0000-0000-0000-000000000011', @Tenant2, 'residente@torredelparque.com', @PasswordHash, 'Resident', 1);
END

IF NOT EXISTS (SELECT 1 FROM saas.[User] WHERE Email = 'garita@torredelparque.com')
BEGIN
    INSERT INTO saas.[User] (Id, TenantId, Email, PasswordHash, Role, IsActive)
    VALUES ('B1A2C3D4-0000-0000-0000-000000000012', @Tenant2, 'garita@torredelparque.com', @PasswordHash, 'Guard', 1);
END

-- Tenant 3 en estado Degraded/Mora para probar middleware
DECLARE @Tenant3 UNIQUEIDENTIFIER = 'C3D3E3F4-3333-3333-3333-333333333333';
IF NOT EXISTS (SELECT 1 FROM saas.Tenant WHERE Id = @Tenant3)
BEGIN
    INSERT INTO saas.Tenant (Id, Name, TaxId, Status, CreatedAt)
    VALUES (@Tenant3, 'Torre Mora Residencial (Suspendida)', 'RNC-131-999999', 'ReadOnly', SYSUTCDATETIME());
END

IF NOT EXISTS (SELECT 1 FROM saas.[User] WHERE Email = 'degraded@torremora.com')
BEGIN
    INSERT INTO saas.[User] (Id, TenantId, Email, PasswordHash, Role, IsActive)
    VALUES ('B1A2C3D4-0000-0000-0000-000000000013', @Tenant3, 'degraded@torremora.com', @PasswordHash, 'TenantAdmin', 1);
END
PRINT '>>> Usuarios verificados.';

-- 3. PROPIEDADES (CONDOMINIOS / PLAZAS)
DECLARE @Prop1 UNIQUEIDENTIFIER = 'A1111111-1111-1111-1111-111111111111';
DECLARE @Prop2 UNIQUEIDENTIFIER = 'A2222222-2222-2222-2222-222222222222';

IF NOT EXISTS (SELECT 1 FROM app.Property WHERE Id = @Prop1)
BEGIN
    INSERT INTO app.Property (Id, TenantId, Name, Address)
    VALUES (@Prop1, @Tenant1, 'Residencial Las Palmas', 'Av. Anacaona #45, Los Cacicazgos, Santo Domingo, D.N.');
END

IF NOT EXISTS (SELECT 1 FROM app.Property WHERE Id = @Prop2)
BEGIN
    INSERT INTO app.Property (Id, TenantId, Name, Address)
    VALUES (@Prop2, @Tenant1, 'Torre Residencial Palmeras II', 'Calle Los Robles #12, Piantini, Santo Domingo, D.N.');
END
PRINT '>>> Propiedades creadas.';

-- 4. BLOQUES / TORRES
DECLARE @BlockA UNIQUEIDENTIFIER = 'BA111111-1111-1111-1111-111111111111';
DECLARE @BlockB UNIQUEIDENTIFIER = 'BB222222-2222-2222-2222-222222222222';
DECLARE @BlockC UNIQUEIDENTIFIER = 'BC333333-3333-3333-3333-333333333333';

IF NOT EXISTS (SELECT 1 FROM app.Block WHERE Id = @BlockA)
BEGIN
    INSERT INTO app.Block (Id, TenantId, PropertyId, Name)
    VALUES (@BlockA, @Tenant1, @Prop1, 'Torre A - Los Mangos');
END

IF NOT EXISTS (SELECT 1 FROM app.Block WHERE Id = @BlockB)
BEGIN
    INSERT INTO app.Block (Id, TenantId, PropertyId, Name)
    VALUES (@BlockB, @Tenant1, @Prop1, 'Torre B - Los Laureles');
END

IF NOT EXISTS (SELECT 1 FROM app.Block WHERE Id = @BlockC)
BEGIN
    INSERT INTO app.Block (Id, TenantId, PropertyId, Name)
    VALUES (@BlockC, @Tenant1, @Prop2, 'Torre Principal');
END
PRINT '>>> Bloques/Torres creados.';

-- 5. UNIDADES / APARTAMENTOS
DECLARE @UnitA101 UNIQUEIDENTIFIER = 'DA101000-0000-0000-0000-000000000001';
DECLARE @UnitA102 UNIQUEIDENTIFIER = 'DA102000-0000-0000-0000-000000000002';
DECLARE @UnitA201 UNIQUEIDENTIFIER = 'DA201000-0000-0000-0000-000000000003';
DECLARE @UnitB101 UNIQUEIDENTIFIER = 'DB101000-0000-0000-0000-000000000004';
DECLARE @UnitB102 UNIQUEIDENTIFIER = 'DB102000-0000-0000-0000-000000000005';
DECLARE @UnitB201 UNIQUEIDENTIFIER = 'DB201000-0000-0000-0000-000000000006';

IF NOT EXISTS (SELECT 1 FROM app.Unit WHERE Id = @UnitA101)
    INSERT INTO app.Unit (Id, TenantId, BlockId, UnitNumber, Status) VALUES (@UnitA101, @Tenant1, @BlockA, 'A-101', 'Occupied');

IF NOT EXISTS (SELECT 1 FROM app.Unit WHERE Id = @UnitA102)
    INSERT INTO app.Unit (Id, TenantId, BlockId, UnitNumber, Status) VALUES (@UnitA102, @Tenant1, @BlockA, 'A-102', 'Occupied');

IF NOT EXISTS (SELECT 1 FROM app.Unit WHERE Id = @UnitA201)
    INSERT INTO app.Unit (Id, TenantId, BlockId, UnitNumber, Status) VALUES (@UnitA201, @Tenant1, @BlockA, 'A-201', 'Available');

IF NOT EXISTS (SELECT 1 FROM app.Unit WHERE Id = @UnitB101)
    INSERT INTO app.Unit (Id, TenantId, BlockId, UnitNumber, Status) VALUES (@UnitB101, @Tenant1, @BlockB, 'B-101', 'Occupied');

IF NOT EXISTS (SELECT 1 FROM app.Unit WHERE Id = @UnitB102)
    INSERT INTO app.Unit (Id, TenantId, BlockId, UnitNumber, Status) VALUES (@UnitB102, @Tenant1, @BlockB, 'B-102', 'Occupied');

IF NOT EXISTS (SELECT 1 FROM app.Unit WHERE Id = @UnitB201)
    INSERT INTO app.Unit (Id, TenantId, BlockId, UnitNumber, Status) VALUES (@UnitB201, @Tenant1, @BlockB, 'B-201', 'Occupied');

PRINT '>>> Unidades creadas.';

-- 6. PERSONAS (PROPIETARIOS / RESIDENTES)
DECLARE @Person1 UNIQUEIDENTIFIER = 'E1000000-0000-0000-0000-000000000001';
DECLARE @Person2 UNIQUEIDENTIFIER = 'E2000000-0000-0000-0000-000000000002';
DECLARE @Person3 UNIQUEIDENTIFIER = 'E3000000-0000-0000-0000-000000000003';
DECLARE @Person4 UNIQUEIDENTIFIER = 'E4000000-0000-0000-0000-000000000004';
DECLARE @Person5 UNIQUEIDENTIFIER = 'E5000000-0000-0000-0000-000000000005';

IF NOT EXISTS (SELECT 1 FROM app.Person WHERE Id = @Person1)
    INSERT INTO app.Person (Id, TenantId, FirstName, LastName, Email, TaxId)
    VALUES (@Person1, @Tenant1, 'Juan Carlos', 'Pérez Morales', 'juan.perez@gmail.com', '001-0987654-3');

IF NOT EXISTS (SELECT 1 FROM app.Person WHERE Id = @Person2)
    INSERT INTO app.Person (Id, TenantId, FirstName, LastName, Email, TaxId)
    VALUES (@Person2, @Tenant1, 'María Elena', 'Rodríguez Santana', 'maria.rodriguez@gmail.com', '001-1234567-8');

IF NOT EXISTS (SELECT 1 FROM app.Person WHERE Id = @Person3)
    INSERT INTO app.Person (Id, TenantId, FirstName, LastName, Email, TaxId)
    VALUES (@Person3, @Tenant1, 'Carlos Eduardo', 'Gómez Tavárez', 'carlos.gomez@gmail.com', '001-4567890-1');

IF NOT EXISTS (SELECT 1 FROM app.Person WHERE Id = @Person4)
    INSERT INTO app.Person (Id, TenantId, FirstName, LastName, Email, TaxId)
    VALUES (@Person4, @Tenant1, 'Ana Patricia', 'Martínez De León', 'ana.martinez@gmail.com', '001-9876543-2');

IF NOT EXISTS (SELECT 1 FROM app.Person WHERE Id = @Person5)
    INSERT INTO app.Person (Id, TenantId, FirstName, LastName, Email, TaxId)
    VALUES (@Person5, @Tenant1, 'Roberto Antonio', 'Fernández Peña', 'residente@condominio.com', '001-7788990-5');

PRINT '>>> Personas registradas.';

-- 7. RELACIONES PERSONA-UNIDAD (UNIT RESIDENTS)
IF NOT EXISTS (SELECT 1 FROM app.UnitResident WHERE UnitId = @UnitA101 AND PersonId = @Person1)
    INSERT INTO app.UnitResident (TenantId, UnitId, PersonId, RelationshipType, IsActive) VALUES (@Tenant1, @UnitA101, @Person1, 'Owner', 1);

IF NOT EXISTS (SELECT 1 FROM app.UnitResident WHERE UnitId = @UnitA102 AND PersonId = @Person2)
    INSERT INTO app.UnitResident (TenantId, UnitId, PersonId, RelationshipType, IsActive) VALUES (@Tenant1, @UnitA102, @Person2, 'Owner', 1);

IF NOT EXISTS (SELECT 1 FROM app.UnitResident WHERE UnitId = @UnitB101 AND PersonId = @Person3)
    INSERT INTO app.UnitResident (TenantId, UnitId, PersonId, RelationshipType, IsActive) VALUES (@Tenant1, @UnitB101, @Person3, 'Owner', 1);

IF NOT EXISTS (SELECT 1 FROM app.UnitResident WHERE UnitId = @UnitB102 AND PersonId = @Person4)
    INSERT INTO app.UnitResident (TenantId, UnitId, PersonId, RelationshipType, IsActive) VALUES (@Tenant1, @UnitB102, @Person4, 'Tenant', 1);

IF NOT EXISTS (SELECT 1 FROM app.UnitResident WHERE UnitId = @UnitB201 AND PersonId = @Person5)
    INSERT INTO app.UnitResident (TenantId, UnitId, PersonId, RelationshipType, IsActive) VALUES (@Tenant1, @UnitB201, @Person5, 'Owner', 1);

PRINT '>>> Asignaciones UnitResident completadas.';

-- 8. PROVEEDORES (SUPPLIERS)
DECLARE @Sup1 UNIQUEIDENTIFIER = 'CA100000-0000-0000-0000-000000000001';
DECLARE @Sup2 UNIQUEIDENTIFIER = 'CA200000-0000-0000-0000-000000000002';
DECLARE @Sup3 UNIQUEIDENTIFIER = 'CA300000-0000-0000-0000-000000000003';
DECLARE @Sup4 UNIQUEIDENTIFIER = 'CA400000-0000-0000-0000-000000000004';
DECLARE @Sup5 UNIQUEIDENTIFIER = 'CA500000-0000-0000-0000-000000000005';

IF NOT EXISTS (SELECT 1 FROM app.Supplier WHERE Id = @Sup1)
    INSERT INTO app.Supplier (Id, TenantId, Name, TaxId, Email, Phone, Address, IsActive)
    VALUES (@Sup1, @Tenant1, 'EDESUR Dominicana S.A.', '1-01-02345-6', 'corporativo@edesur.com.do', '809-683-9393', 'Av. Tiradentes #47, Santo Domingo', 1);

IF NOT EXISTS (SELECT 1 FROM app.Supplier WHERE Id = @Sup2)
    INSERT INTO app.Supplier (Id, TenantId, Name, TaxId, Email, Phone, Address, IsActive)
    VALUES (@Sup2, @Tenant1, 'CAASD Corporación del Acueducto', '1-01-55443-2', 'facturacion@caasd.gov.do', '809-562-3500', 'Calle Euclides Morillo #65', 1);

IF NOT EXISTS (SELECT 1 FROM app.Supplier WHERE Id = @Sup3)
    INSERT INTO app.Supplier (Id, TenantId, Name, TaxId, Email, Phone, Address, IsActive)
    VALUES (@Sup3, @Tenant1, 'Asteje Servicios de Mantenimiento', '1-32-29831-2', 'contacto@asteje.com', '809-555-4321', 'Av. Las Américas #45', 1);

IF NOT EXISTS (SELECT 1 FROM app.Supplier WHERE Id = @Sup4)
    INSERT INTO app.Supplier (Id, TenantId, Name, TaxId, Email, Phone, Address, IsActive)
    VALUES (@Sup4, @Tenant1, 'Seguridad y Protección GPF SRL', '1-30-99881-4', 'operaciones@seguridadgpf.com', '809-221-8899', 'Av. 27 de Febrero #200', 1);

IF NOT EXISTS (SELECT 1 FROM app.Supplier WHERE Id = @Sup5)
    INSERT INTO app.Supplier (Id, TenantId, Name, TaxId, Email, Phone, Address, IsActive)
    VALUES (@Sup5, @Tenant1, 'Elevadores Schindler Dominicana', '1-01-77882-9', 'soporte@schindler.com.do', '809-540-1234', 'Av. Winston Churchill', 1);

PRINT '>>> Proveedores creados.';

-- 9. GASTOS / EGRESOS OPERACIONALES
IF NOT EXISTS (SELECT 1 FROM app.Expense WHERE PropertyId = @Prop1 AND Concept = 'Factura Eléctrica Zonas Comunes - Septiembre')
    INSERT INTO app.Expense (TenantId, PropertyId, SupplierId, Concept, Amount, ExpenseDate, FiscalReceiptNumber, Status)
    VALUES (@Tenant1, @Prop1, @Sup1, 'Factura Eléctrica Zonas Comunes - Septiembre', 48500.00, '2026-09-15', 'B0100004521', 'Paid');

IF NOT EXISTS (SELECT 1 FROM app.Expense WHERE PropertyId = @Prop1 AND Concept = 'Servicio de Seguridad 24/7 Quincena 1')
    INSERT INTO app.Expense (TenantId, PropertyId, SupplierId, Concept, Amount, ExpenseDate, FiscalReceiptNumber, Status)
    VALUES (@Tenant1, @Prop1, @Sup4, 'Servicio de Seguridad 24/7 Quincena 1', 32500.00, '2026-09-15', 'B0100008812', 'Paid');

IF NOT EXISTS (SELECT 1 FROM app.Expense WHERE PropertyId = @Prop1 AND Concept = 'Mantenimiento Preventivo de Elevadores')
    INSERT INTO app.Expense (TenantId, PropertyId, SupplierId, Concept, Amount, ExpenseDate, FiscalReceiptNumber, Status)
    VALUES (@Tenant1, @Prop1, @Sup5, 'Mantenimiento Preventivo de Elevadores', 22000.00, '2026-09-20', 'B0100003399', 'Paid');

IF NOT EXISTS (SELECT 1 FROM app.Expense WHERE PropertyId = @Prop1 AND Concept = 'Limpieza y Conserjería Zonas Comunes')
    INSERT INTO app.Expense (TenantId, PropertyId, SupplierId, Concept, Amount, ExpenseDate, FiscalReceiptNumber, Status)
    VALUES (@Tenant1, @Prop1, @Sup3, 'Limpieza y Conserjería Zonas Comunes', 18500.00, '2026-09-22', 'B0100001244', 'Paid');

PRINT '>>> Gastos/Egresos registrados.';

-- 10. FACTURAS (CUENTAS POR COBRAR / INVOICES)
DECLARE @Inv1 UNIQUEIDENTIFIER = 'F1000000-0000-0000-0000-000000000001';
DECLARE @Inv2 UNIQUEIDENTIFIER = 'F2000000-0000-0000-0000-000000000002';
DECLARE @Inv3 UNIQUEIDENTIFIER = 'F3000000-0000-0000-0000-000000000003';
DECLARE @Inv4 UNIQUEIDENTIFIER = 'F4000000-0000-0000-0000-000000000004';
DECLARE @Inv5 UNIQUEIDENTIFIER = 'F5000000-0000-0000-0000-000000000005';

IF NOT EXISTS (SELECT 1 FROM app.Invoice WHERE Id = @Inv1)
    INSERT INTO app.Invoice (Id, TenantId, UnitId, Amount, BalanceDue, Status, FiscalReceiptType, FiscalReceiptNumber, IssueDate, DueDate)
    VALUES (@Inv1, @Tenant1, @UnitA101, 6500.00, 0.00, 'Paid', 'B01', 'B0100000001', '2026-09-01', '2026-09-10');

IF NOT EXISTS (SELECT 1 FROM app.Invoice WHERE Id = @Inv2)
    INSERT INTO app.Invoice (Id, TenantId, UnitId, Amount, BalanceDue, Status, FiscalReceiptType, FiscalReceiptNumber, IssueDate, DueDate)
    VALUES (@Inv2, @Tenant1, @UnitA102, 6500.00, 6500.00, 'Unpaid', 'B01', 'B0100000002', '2026-09-01', '2026-09-10');

IF NOT EXISTS (SELECT 1 FROM app.Invoice WHERE Id = @Inv3)
    INSERT INTO app.Invoice (Id, TenantId, UnitId, Amount, BalanceDue, Status, FiscalReceiptType, FiscalReceiptNumber, IssueDate, DueDate)
    VALUES (@Inv3, @Tenant1, @UnitB101, 8000.00, 0.00, 'Paid', 'B01', 'B0100000003', '2026-09-01', '2026-09-10');

IF NOT EXISTS (SELECT 1 FROM app.Invoice WHERE Id = @Inv4)
    INSERT INTO app.Invoice (Id, TenantId, UnitId, Amount, BalanceDue, Status, FiscalReceiptType, FiscalReceiptNumber, IssueDate, DueDate)
    VALUES (@Inv4, @Tenant1, @UnitB102, 7200.00, 3600.00, 'Partial', 'B01', 'B0100000004', '2026-09-01', '2026-09-10');

IF NOT EXISTS (SELECT 1 FROM app.Invoice WHERE Id = @Inv5)
    INSERT INTO app.Invoice (Id, TenantId, UnitId, Amount, BalanceDue, Status, FiscalReceiptType, FiscalReceiptNumber, IssueDate, DueDate)
    VALUES (@Inv5, @Tenant1, @UnitB201, 6500.00, 6500.00, 'Unpaid', 'B01', 'B0100000005', '2026-09-01', '2026-09-10');

PRINT '>>> Facturas generadas.';

-- 11. PAGOS, APLICACIONES Y RECIBOS
DECLARE @Pay1 UNIQUEIDENTIFIER = 'AA100000-0000-0000-0000-000000000001';
DECLARE @Pay2 UNIQUEIDENTIFIER = 'AA200000-0000-0000-0000-000000000002';
DECLARE @Pay3 UNIQUEIDENTIFIER = 'AA300000-0000-0000-0000-000000000003';

IF NOT EXISTS (SELECT 1 FROM app.Payment WHERE Id = @Pay1)
BEGIN
    INSERT INTO app.Payment (Id, TenantId, PersonId, TotalAmount, PaymentMethod, ReferenceId, Status, CreatedAt)
    VALUES (@Pay1, @Tenant1, @Person1, 6500.00, 'Transfer', 'TRX-BPD-984421', 'Completed', SYSUTCDATETIME());

    INSERT INTO app.PaymentApplication (TenantId, PaymentId, InvoiceId, AppliedAmount)
    VALUES (@Tenant1, @Pay1, @Inv1, 6500.00);

    INSERT INTO app.Receipt (TenantId, PaymentId, ReceiptNumber, BlobUrl, CreatedAt)
    VALUES (@Tenant1, @Pay1, 'REC-2026-000001', 'https://blob.portaforza.com/receipts/REC-2026-000001.pdf', SYSUTCDATETIME());
END

IF NOT EXISTS (SELECT 1 FROM app.Payment WHERE Id = @Pay2)
BEGIN
    INSERT INTO app.Payment (Id, TenantId, PersonId, TotalAmount, PaymentMethod, ReferenceId, Status, CreatedAt)
    VALUES (@Pay2, @Tenant1, @Person3, 8000.00, 'CreditCard', 'AUTH-VISA-771239', 'Completed', SYSUTCDATETIME());

    INSERT INTO app.PaymentApplication (TenantId, PaymentId, InvoiceId, AppliedAmount)
    VALUES (@Tenant1, @Pay2, @Inv3, 8000.00);

    INSERT INTO app.Receipt (TenantId, PaymentId, ReceiptNumber, BlobUrl, CreatedAt)
    VALUES (@Tenant1, @Pay2, 'REC-2026-000002', 'https://blob.portaforza.com/receipts/REC-2026-000002.pdf', SYSUTCDATETIME());
END

IF NOT EXISTS (SELECT 1 FROM app.Payment WHERE Id = @Pay3)
BEGIN
    INSERT INTO app.Payment (Id, TenantId, PersonId, TotalAmount, PaymentMethod, ReferenceId, Status, CreatedAt)
    VALUES (@Pay3, @Tenant1, @Person4, 3600.00, 'Cash', 'CASH-REC-2026-09', 'Completed', SYSUTCDATETIME());

    INSERT INTO app.PaymentApplication (TenantId, PaymentId, InvoiceId, AppliedAmount)
    VALUES (@Tenant1, @Pay3, @Inv4, 3600.00);

    INSERT INTO app.Receipt (TenantId, PaymentId, ReceiptNumber, BlobUrl, CreatedAt)
    VALUES (@Tenant1, @Pay3, 'REC-2026-000003', 'https://blob.portaforza.com/receipts/REC-2026-000003.pdf', SYSUTCDATETIME());
END

PRINT '>>> Pagos y Recibos procesados.';

-- 12. AMENIDADES Y RESERVAS
DECLARE @Amenity1 UNIQUEIDENTIFIER = 'EE100000-0000-0000-0000-000000000001';
DECLARE @Amenity2 UNIQUEIDENTIFIER = 'EE200000-0000-0000-0000-000000000002';
DECLARE @Amenity3 UNIQUEIDENTIFIER = 'EE300000-0000-0000-0000-000000000003';
DECLARE @Amenity4 UNIQUEIDENTIFIER = 'EE400000-0000-0000-0000-000000000004';

IF NOT EXISTS (SELECT 1 FROM app.Amenity WHERE Id = @Amenity1)
    INSERT INTO app.Amenity (Id, TenantId, PropertyId, Name, Capacity, HourlyRate, IsActive)
    VALUES (@Amenity1, @Tenant1, @Prop1, 'Piscina Infinity & Terraza Solárium', 30, 0.00, 1);

IF NOT EXISTS (SELECT 1 FROM app.Amenity WHERE Id = @Amenity2)
    INSERT INTO app.Amenity (Id, TenantId, PropertyId, Name, Capacity, HourlyRate, IsActive)
    VALUES (@Amenity2, @Tenant1, @Prop1, 'Salón Multiusos / Eventos', 80, 1500.00, 1);

IF NOT EXISTS (SELECT 1 FROM app.Amenity WHERE Id = @Amenity3)
    INSERT INTO app.Amenity (Id, TenantId, PropertyId, Name, Capacity, HourlyRate, IsActive)
    VALUES (@Amenity3, @Tenant1, @Prop1, 'Cancha de Pádel Climatizada', 4, 500.00, 1);

IF NOT EXISTS (SELECT 1 FROM app.Amenity WHERE Id = @Amenity4)
    INSERT INTO app.Amenity (Id, TenantId, PropertyId, Name, Capacity, HourlyRate, IsActive)
    VALUES (@Amenity4, @Tenant1, @Prop1, 'Gimnasio Equipado LifeFitness', 20, 0.00, 1);

IF NOT EXISTS (SELECT 1 FROM app.AmenityBooking WHERE AmenityId = @Amenity2)
    INSERT INTO app.AmenityBooking (TenantId, AmenityId, PersonId, UnitId, StartTime, EndTime, TotalAmount, Status)
    VALUES (@Tenant1, @Amenity2, @Person1, @UnitA101, '2026-10-05 18:00:00', '2026-10-05 23:00:00', 7500.00, 'Confirmed');

PRINT '>>> Amenidades y Reservas creadas.';

-- 13. PASES DE VISITA Y CONTROL DE GARITA
DECLARE @Pass1 UNIQUEIDENTIFIER = 'DE100000-0000-0000-0000-000000000001';
DECLARE @GuardUser UNIQUEIDENTIFIER = 'B1A2C3D4-0000-0000-0000-000000000004';

IF NOT EXISTS (SELECT 1 FROM app.VisitorPass WHERE Id = @Pass1)
    INSERT INTO app.VisitorPass (Id, TenantId, UnitId, VisitorName, VisitorIdNumber, ValidFrom, ValidTo, QrCodeToken, Status)
    VALUES (@Pass1, @Tenant1, @UnitA101, 'Ing. Manuel Castillo', '402-234991-0', '2026-09-28 08:00:00', '2026-09-28 20:00:00', 'QR-PASS-20260928-8831', 'Active');

IF NOT EXISTS (SELECT 1 FROM app.GateLog WHERE VisitorPassId = @Pass1)
    INSERT INTO app.GateLog (TenantId, PropertyId, VisitorPassId, GuardUserId, VisitorName, VehiclePlate, EntryTime)
    VALUES (@Tenant1, @Prop1, @Pass1, @GuardUser, 'Ing. Manuel Castillo', 'A982143', SYSUTCDATETIME());

PRINT '>>> Pases de visita y accesos en garita configurados.';

-- 14. TICKETS DE MANTENIMIENTO / HELPDESK
IF NOT EXISTS (SELECT 1 FROM app.MaintenanceTicket WHERE PropertyId = @Prop1 AND Title = 'Fuga de agua en tubería de área social')
    INSERT INTO app.MaintenanceTicket (TenantId, PropertyId, UnitId, ReportedByPersonId, Title, Description, Priority, Status, CreatedAt)
    VALUES (@Tenant1, @Prop1, NULL, @Person1, 'Fuga de agua en tubería de área social', 'Se detectó goteo constante cerca de los baños del área de piscina.', 'High', 'Open', SYSUTCDATETIME());

IF NOT EXISTS (SELECT 1 FROM app.MaintenanceTicket WHERE PropertyId = @Prop1 AND Title = 'Lámpara de pasillo 3er piso parpadeando')
    INSERT INTO app.MaintenanceTicket (TenantId, PropertyId, UnitId, ReportedByPersonId, Title, Description, Priority, Status, CreatedAt)
    VALUES (@Tenant1, @Prop1, @UnitA102, @Person2, 'Lámpara de pasillo 3er piso parpadeando', 'La luminaria LED del pasillo frente al apto A-102 parpadea.', 'Low', 'Resolved', SYSUTCDATETIME());

PRINT '>>> Tickets de Helpdesk cargados.';

-- 15. TRANSACCIONES BANCARIAS PARA CONCILIACION
IF NOT EXISTS (SELECT 1 FROM app.BankTransaction WHERE PropertyId = @Prop1 AND ReferenceNumber = 'TRX-BPD-984421')
    INSERT INTO app.BankTransaction (TenantId, PropertyId, TransactionDate, Description, Amount, ReferenceNumber, IsReconciled, MatchedPaymentId)
    VALUES (@Tenant1, @Prop1, '2026-09-02', 'TRANSFERENCIA BANCO POPULAR CREDITO - JUAN PEREZ', 6500.00, 'TRX-BPD-984421', 1, @Pay1);

IF NOT EXISTS (SELECT 1 FROM app.BankTransaction WHERE PropertyId = @Prop1 AND ReferenceNumber = 'DEP-BHD-002931')
    INSERT INTO app.BankTransaction (TenantId, PropertyId, TransactionDate, Description, Amount, ReferenceNumber, IsReconciled, MatchedPaymentId)
    VALUES (@Tenant1, @Prop1, '2026-09-27', 'DEPOSITO EFECTIVO CAJERO AUTO BHD - REF 002931', 6500.00, 'DEP-BHD-002931', 0, NULL);

PRINT '================================================================';
PRINT '>>> POBLADO DE DATOS REALES COMPLETADO CON EXITO EN SQL SERVER!';
PRINT '================================================================';
GO
