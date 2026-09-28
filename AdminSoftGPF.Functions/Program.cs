using AdminSoftGPF.Application;
using AdminSoftGPF.Application.Common.Interfaces;
using AdminSoftGPF.Functions.Workers;
using AdminSoftGPF.Infrastructure;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;

var builder = Host.CreateApplicationBuilder(args);

// Servicios de Infraestructura y Aplicación
builder.Services.AddApplicationServices();
builder.Services.AddInfrastructureServices();

// Contexto de Tenant para Workers en segundo plano
builder.Services.AddScoped<ITenantContext, WorkerTenantContext>();

// Registro de Workers en Segundo Plano
builder.Services.AddHostedService<OutboxProcessorWorker>();
builder.Services.AddHostedService<LateFeeCalculatorWorker>();

var host = builder.Build();
await host.RunAsync();

// Implementación de contexto para workers en segundo plano
internal sealed class WorkerTenantContext : ITenantContext
{
    public Guid? TenantId { get; set; } = null;
    public Guid? UserId { get; set; } = Guid.Parse("00000000-0000-0000-0000-000000000001");
    public string? Role { get; set; } = "WorkerSystem";
    public Guid? ImpersonatorId { get; set; } = null;
    public bool HasTenant => TenantId.HasValue && TenantId.Value != Guid.Empty;
}
