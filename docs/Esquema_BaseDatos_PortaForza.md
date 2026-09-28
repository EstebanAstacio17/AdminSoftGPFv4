# Diseño del Esquema de Base de Datos
## Plataforma: AdminSoftGPF (powered by PortaForza)

### 1. Consideraciones Globales y Seguridad
- Motor: Azure SQL Database.
- Multitenancy: Se utiliza un esquema de Base de Datos Compartida con Esquema Compartido. TODAS las tablas del negocio tienen una columna `TenantId`.
- Seguridad a Nivel de Fila (RLS): Se implementará una función de predicado de seguridad en SQL Server vinculada a `SESSION_CONTEXT(N'TenantId')` para garantizar que ninguna consulta filtre datos entre Tenants.
- Concurrencia Optimista: Toda tabla transaccional incluye una columna `RowVersion` (tipo TIMESTAMP/ROWVERSION) para evitar sobreescritura de datos simultánea.
- Auditoría Append-Only: No se hacen `DELETE` físicos en tablas financieras ni de personas (Soft-Anonymization).

### 2. Esquemas de Base de Datos (Schemas)
La base de datos se divide en tres esquemas lógicos (Schemas SQL):
1. `saas`: Tablas de administración global de AdminSoftGPF.
2. `app`: Tablas del negocio (Propiedades, Facturación, Residentes).
3. `audit`: Tablas de registro de auditoría inmutable.

### 3. Diccionario de Datos: Esquema `saas`

#### saas.Tenant (Los Administradores / Clientes de AdminSoftGPF)
- `Id` (PK, UNIQUEIDENTIFIER)
- `Name` (VARCHAR)
- `TaxId` (VARCHAR): RNC/NIT del Administrador para su propia facturación.
- `Status` (VARCHAR): 'Active', 'ReadOnly', 'Suspended'. (Implementa el Modo Degradado).
- `CreatedAt` (DATETIME2)

#### saas.User (Identidad y Acceso)
- `Id` (PK, UNIQUEIDENTIFIER)
- `TenantId` (FK a saas.Tenant, NULLABLE): Es NULL para los SuperAdmins de PortaForza.
- `Email` (VARCHAR, UNIQUE)
- `PasswordHash` (VARCHAR)
- `Role` (VARCHAR): 'PortaForzaAdmin', 'TenantAdmin', 'Accountant', 'Resident', 'Guard'.
- `IsActive` (BIT)

### 4. Diccionario de Datos: Esquema `app` (Core del Negocio)

#### app.Property (Propiedades / Condominios / Plazas)
- `Id` (PK, UNIQUEIDENTIFIER)
- `TenantId` (FK a saas.Tenant, INDEX)
- `Name` (VARCHAR)
- `Address` (VARCHAR)

#### app.Block (Torres / Zonas / Manzanas)
- `Id` (PK, UNIQUEIDENTIFIER)
- `TenantId` (FK a saas.Tenant)
- `PropertyId` (FK a app.Property)
- `Name` (VARCHAR)

#### app.Unit (Apartamentos / Locales)
- `Id` (PK, UNIQUEIDENTIFIER)
- `TenantId` (FK a saas.Tenant)
- `BlockId` (FK a app.Block)
- `UnitNumber` (VARCHAR)
- `Status` (VARCHAR)

#### app.Person (Residentes y Propietarios)
- `Id` (PK, UNIQUEIDENTIFIER)
- `TenantId` (FK a saas.Tenant)
- `FirstName` (VARCHAR): Sujeto a anonimización si exige baja por privacidad.
- `LastName` (VARCHAR)
- `Email` (VARCHAR)
- `TaxId` (VARCHAR): Cédula / RNC para generar comprobantes fiscales.

#### app.UnitResident (Tabla Intermedia: Quién vive/es dueño de qué)
- `Id` (PK, UNIQUEIDENTIFIER)
- `TenantId` (FK a saas.Tenant)
- `UnitId` (FK a app.Unit)
- `PersonId` (FK a app.Person)
- `RelationshipType` (VARCHAR): 'Owner' (Propietario), 'Tenant' (Inquilino).
- `IsActive` (BIT)

### 5. Diccionario de Datos: Módulo Financiero (Billing & Treasury)

#### app.Invoice (Facturas / Cuentas por Cobrar)
- `Id` (PK, UNIQUEIDENTIFIER)
- `TenantId` (FK a saas.Tenant, INDEX)
- `UnitId` (FK a app.Unit)
- `Amount` (DECIMAL(19,4))
- `BalanceDue` (DECIMAL(19,4))
- `Status` (VARCHAR): 'Draft', 'Unpaid', 'Partial', 'Paid', 'Cancelled'.
- `FiscalReceiptType` (VARCHAR): Ej. 'B01', 'B02'.
- `FiscalReceiptNumber` (VARCHAR): El NCF generado secuencialmente.
- `IssueDate` (DATE)
- `DueDate` (DATE)
- `RowVersion` (ROWVERSION)

#### app.Payment (Ingresos / Cajas)
- `Id` (PK, UNIQUEIDENTIFIER)
- `TenantId` (FK a saas.Tenant)
- `PersonId` (FK a app.Person)
- `TotalAmount` (DECIMAL(19,4))
- `PaymentMethod` (VARCHAR): 'CreditCard', 'Transfer', 'Cash'.
- `ReferenceId` (VARCHAR, UNIQUE por Tenant): Clave de Idempotencia para evitar doble cobro de pasarela.
- `Status` (VARCHAR): 'Completed', 'Reverted'.

#### app.PaymentApplication (Aplicación del Dinero a Facturas)
- `Id` (PK, UNIQUEIDENTIFIER)
- `TenantId` (FK a saas.Tenant)
- `PaymentId` (FK a app.Payment)
- `InvoiceId` (FK a app.Invoice)
- `AppliedAmount` (DECIMAL(19,4))

#### app.Receipt (Recibos / Comprobantes)
- `Id` (PK, UNIQUEIDENTIFIER)
- `TenantId` (FK a saas.Tenant)
- `PaymentId` (FK a app.Payment)
- `ReceiptNumber` (VARCHAR)
- `BlobUrl` (VARCHAR): URL del PDF generado guardado de forma privada en Azure Blob Storage.

### 6. Diccionario de Datos: Esquema `audit`

#### audit.AuditLog (Histórico Inmutable y Soporte)
- `Id` (PK, BIGINT IDENTITY)
- `TenantId` (FK a saas.Tenant)
- `UserId` (FK a saas.User): El usuario que ejecutó la acción real.
- `ImpersonatorId` (FK a saas.User, NULLABLE): ID del SuperAdmin de PortaForza si fue suplantación.
- `Action` (VARCHAR): 'Insert', 'Update', 'Delete', 'Anonymize'.
- `TableName` (VARCHAR)
- `RecordId` (VARCHAR)
- `OldValues` (JSON)
- `NewValues` (JSON)
- `CreatedAt` (DATETIME2)

### 7. Implementación de Row-Level Security (Ejemplo Técnico)
El script T-SQL que blindará los datos entre clientes se verá conceptualmente así para cada tabla:

```sql
CREATE FUNCTION sec.fn_tenant_isolation(@TenantId UNIQUEIDENTIFIER)
    RETURNS TABLE
    WITH SCHEMABINDING
AS
    RETURN SELECT 1 AS fn_tenant_isolation_result
    WHERE @TenantId = CONVERT(UNIQUEIDENTIFIER, SESSION_CONTEXT(N'TenantId'))
    OR IS_MEMBER('db_owner') = 1;
GO

CREATE SECURITY POLICY sec.TenantIsolationPolicy
    ADD FILTER PREDICATE sec.fn_tenant_isolation(TenantId) ON app.Invoice,
    ADD BLOCK PREDICATE sec.fn_tenant_isolation(TenantId) ON app.Invoice
    WITH (STATE = ON);
```
