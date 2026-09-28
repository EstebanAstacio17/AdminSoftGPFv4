# Documento Maestro de Arquitectura y Especificación Técnica
## Plataforma: AdminSoftGPF
Propiedad de: PortaForza

### 1. Topología del Ecosistema AdminSoftGPF

La plataforma se divide en 4 grandes interfaces web, cada una con un propósito y nivel de acceso distinto:

- AdminSoftGPF Backoffice (admin.adminsoftgpf.com): Portal de súper-administrador para el equipo de PortaForza. Aquí gestionas a tus clientes (Administradores), planes de suscripción, límites de almacenamiento y facturación de tu propio SaaS.
- Manager Portal (manager.adminsoftgpf.com): El portal donde entran tus clientes (Los Administradores de Propiedades). Aquí gestionan los condominios, plazas, facturación, conciliaciones, empleados y tickets.
- Resident Portal (portal.adminsoftgpf.com): Donde entran los dueños e inquilinos de los apartamentos/locales. Ven sus facturas, pagan en línea, reservan amenidades y crean pases de visita. Soporta PWA (Instalable en móvil).
- Gate Portal (gate.adminsoftgpf.com): Interfaz simplificada para uso exclusivo del personal de seguridad/garita. Permite escanear QRs, registrar entradas/salidas y validar identidades.

### 2. Stack Tecnológico Definitivo

- Backend: .NET 10 LTS (C# 14). Robustez, rendimiento y soporte a largo plazo.
- API Web: ASP.NET Core 10 Web API. RESTful APIs documentadas vía OpenAPI.
- Arquitectura: Monolito Modular + CQRS Ligero. Escalabilidad sin la complejidad prematura.
- Acceso a Datos: ADO.NET (Microsoft.Data.SqlClient). Máximo rendimiento y control sobre las consultas.
- Base de Datos: Azure SQL Database. Motor relacional T-SQL nativo en la nube.
- Frontend: Angular 22.x (TypeScript 6.x). Framework empresarial maduro, seguro y estructurado.
- UI Componentes: Angular Material + SCSS. Consistencia visual, componentes accesibles y responsivos.
- Archivos: Azure Blob Storage. Almacenamiento seguro, privado y escalable para PDFs e imágenes.
- Mensajería: Azure Service Bus. Colas para enviar notificaciones masivas sin bloquear la API.
- Workers: Azure Functions. Ejecución de tareas programadas.
- Secretos: Azure Key Vault. Almacenamiento seguro de credenciales bancarias.
- Despliegue: Github Actions + Bicep (IaC). Integración continua y despliegue como código en Azure.

### 3. Modelo de Aislamiento de Datos (Multi-Tenancy)

La arquitectura de seguridad de datos se basa en el patrón Shared Database, Shared Schema.
- Regla estricta: Toda tabla perteneciente al negocio tendrá una columna TenantId.
- El backend captura el TenantId desde el JWT (Token de Autenticación) del usuario autenticado. Ningún usuario puede enviar su propio TenantId por URL o Body.
- Seguridad a Nivel de Fila (RLS): Azure SQL Database utilizará Row-Level Security asociado al SESSION_CONTEXT. Incluso si un desarrollador escribe mal un SELECT, la base de datos bloqueará el acceso a los datos de otro Tenant.
- Las tablas maestras (Ej. Usuarios del sistema SaaS, Planes de Suscripción) pertenecerán al esquema SaaS, aisladas del esquema App.

### 4. Estructura de la Solución Backend (.NET)

La solución (AdminSoftGPF.sln) se organizará en una arquitectura limpia y modular de 6 proyectos principales, aislando completamente las reglas de negocio de la tecnología:

- AdminSoftGPF.Domain: El corazón. Contiene Entidades, Reglas de Negocio, Excepciones y Enums.
- AdminSoftGPF.Application: Orquestación (Casos de Uso). Implementa CQRS Ligero. Aquí están los Commands y Queries.
- AdminSoftGPF.Infrastructure: La conexión con el mundo exterior. Contiene los adaptadores para Azure SQL, Blob Storage, pasarelas de pago, etc.
- AdminSoftGPF.API: Los Controladores HTTP (Controllers), validación de seguridad (JWT, CORS) y Middlewares.
- AdminSoftGPF.Functions: Procesos en segundo plano (Workers) que escuchan Service Bus o se ejecutan por temporizador.
- AdminSoftGPF.Database: Proyecto de base de datos (DACPAC) con todos los scripts T-SQL de tablas, índices y SPs.

### 5. Flujos de Trabajo (Workflows) Críticos

#### A. Modelo Financiero y Doble Facturación
El sistema debe manejar dos dominios financieros completamente separados:
- Facturación SaaS (PortaForza a Tenant): Gestionada a nivel global. Facturación automática a la tarjeta de crédito del Administrador por usar la plataforma AdminSoftGPF.
- Facturación de Propiedad (Tenant a Residente): Lo que el Administrador le cobra al Propietario. Sigue el ciclo contable estricto: Factura (Deuda) -> Pago (Ingreso) -> AplicacionPago (Cruzamiento) -> Recibo (Documento).

#### B. Conciliación Bancaria
Motor de importación de extractos (CSV, OFX, Excel) para cruzar automáticamente las transferencias bancarias de los residentes contra las cuentas por cobrar, utilizando reglas de coincidencia.

#### C. Bandeja de Salida Transaccional (Transactional Outbox)
Cuando un administrador registra un pago, el sistema hace dos cosas en la misma transacción de SQL: guarda el recibo y guarda un mensaje a enviar. Un proceso asíncrono lee este mensaje y envía el correo/WhatsApp.

#### D. Pagos en Línea e Idempotencia
Módulo agnóstico de pasarelas de pago (Azul, CardNET, Stripe, etc.). Idempotencia obligatoria para prevención de cargos dobles.

### 6. Estructura y Módulos del Dominio

- SaaS Core: Tenants, Suscripciones, Límites, Facturación SaaS.
- Identity & Access: Usuarios, Roles, Permisos granulares, Autenticación.
- Property Management: Propiedades (Plazas, Residenciales), Zonas/Bloques, Unidades, Propietarios, Inquilinos.
- Billing & Accounting: Conceptos de cobro, Generación masiva de cargos, Recargos por mora, Estados de Cuenta.
- Treasury (Caja): Cuentas Bancarias, Registro de Pagos, Emisión de Recibos, Conciliación.
- Expenses (Egresos): Proveedores, Registro de Gastos, Compras.
- Helpdesk: Gestión de incidencias, tickets de mantenimiento.
- Facilities: Catálogo de amenidades, reglas de reserva, disponibilidad.
- Security & Access: Listas de visitantes, Invitaciones QR, Bitácora de garita.

### 7. Operaciones Críticas para Producción (Day-2 Operations)

Para asegurar la viabilidad empresarial y operativa sin romper los principios arquitectónicos, se implementan las siguientes soluciones:

#### A. Migración y Onboarding de Datos
- Patrón Arquitectónico: Two-Phase Upload (Dry-Run Pattern).
- Implementación: El archivo Excel/CSV se procesa primero en memoria aplicando reglas de negocio sin afectar la BD. Retorna un JSON con validaciones línea por línea.
- Ejecución: Una vez validado, se encola en Azure Service Bus y una Azure Function ejecuta la inserción masiva de Unidades, Propietarios y Saldos Iniciales en una sola transacción SQL.

#### B. Soporte Técnico y Suplantación Segura (Impersonation)
- Patrón Arquitectónico: JWT Impersonation Claims + Immutable Audit Log.
- Implementación: Endpoint dedicado `/api/v1/auth/impersonate/{tenantId}` exclusivo para PortaForzaAdmin. Emite un JWT temporal con el TenantId del cliente y un claim oculto `impersonator_id`.
- Seguridad: El middleware de auditoría intercepta toda acción y registra de forma inmutable ("Acción realizada por el Admin de la Propiedad, suplantado por SuperAdmin X").

#### C. Ciclo de Vida del SaaS y Morosidad
- Patrón Arquitectónico: Global Authorization Middleware.
- Implementación: Columna `Status` en la tabla `Tenant` (Active, ReadOnly, Suspended).
- Reglas: Un Middleware en ASP.NET Core intercepta las peticiones. Si el Tenant es moroso (ReadOnly), se permiten solicitudes HTTP GET (residentes pueden consultar su histórico) pero se bloquean solicitudes HTTP POST/PUT/DELETE del administrador con un `403 Forbidden`, impidiendo la operación comercial hasta el pago.

#### D. Cumplimiento Legal y Fiscal (Compliance)
- Fiscal (NCF/RNC): Inclusión de campos `TaxId` en tablas `Person` y `Tenant`. Tablas `Invoice` y `Receipt` incluyen `FiscalReceiptType` (ej. B01, B02) y `FiscalReceiptNumber` (NCF). Las secuencias fiscales se controlan aisladas por Tenant en SQL.
- Privacidad (Derecho al Olvido): Patrón Soft-Anonymization. Se prohíben operaciones DELETE físicas para Personas. Un comando UPDATE sobrescribe la data personal (PII) con "Usuario Anonimizado", manteniendo intacto el `PersonId` para proteger la integridad contable del histórico.
- Offboarding: Azure Function diseñada para generar exportaciones asíncronas en ZIP (CSVs/PDFs) alojadas en Blob Storage mediante URL firmada (SAS Token) de 24h de validez.

#### E. Despliegues sin Interrupciones (Zero-Downtime)
- Infraestructura: Uso de Azure App Service Deployment Slots. El código se despliega en Staging (precalentamiento) y luego ejecuta un Swap de IP en caliente (0 downtime).
- Software: Versionamiento estricto de API (`/api/v1/`) acoplado a un Service Worker en Angular (PWA) que descarga las actualizaciones en segundo plano, evitando romper peticiones en vuelo del usuario.
