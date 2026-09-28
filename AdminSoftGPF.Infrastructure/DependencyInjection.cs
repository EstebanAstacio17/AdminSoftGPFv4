using AdminSoftGPF.Application.Common.Interfaces;
using AdminSoftGPF.Domain.Interfaces;
using AdminSoftGPF.Infrastructure.BlobStorage;
using AdminSoftGPF.Infrastructure.Data;
using AdminSoftGPF.Infrastructure.Data.Repositories;
using AdminSoftGPF.Infrastructure.Security;
using Microsoft.Extensions.DependencyInjection;

namespace AdminSoftGPF.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructureServices(this IServiceCollection services)
    {
        // 1. Fábrica de conexiones SQL con inyección de SESSION_CONTEXT(TenantId)
        services.AddScoped<IDbConnectionFactory, DbConnectionFactory>();

        // 2. Registro de Repositorios Core ADO.NET
        services.AddScoped<ITenantRepository, TenantRepository>();
        services.AddScoped<IUserRepository, UserRepository>();
        services.AddScoped<IPropertyRepository, PropertyRepository>();
        services.AddScoped<IBlockRepository, BlockRepository>();
        services.AddScoped<IUnitRepository, UnitRepository>();
        services.AddScoped<IPersonRepository, PersonRepository>();
        services.AddScoped<IUnitResidentRepository, UnitResidentRepository>();
        services.AddScoped<IInvoiceRepository, InvoiceRepository>();
        services.AddScoped<IPaymentRepository, PaymentRepository>();
        services.AddScoped<IAuditLogRepository, AuditLogRepository>();
        services.AddScoped<IOutboxRepository, OutboxRepository>();

        // 3. Repositorios Operacionales (Fase 7)
        services.AddScoped<ISupplierRepository, SupplierRepository>();
        services.AddScoped<IExpenseRepository, ExpenseRepository>();
        services.AddScoped<IMaintenanceTicketRepository, MaintenanceTicketRepository>();
        services.AddScoped<IFacilitiesRepository, FacilitiesRepository>();
        services.AddScoped<ISecurityAccessRepository, SecurityAccessRepository>();
        services.AddScoped<IBankReconciliationRepository, BankReconciliationRepository>();

        // 4. Servicios Cloud (Blob Storage)
        services.AddScoped<IBlobStorageService, AzureBlobStorageService>();

        // 5. Seguridad y Criptografía
        services.AddSingleton<IPasswordHasher, PasswordHasher>();
        services.AddScoped<IJwtTokenService, JwtTokenService>();

        return services;
    }
}
