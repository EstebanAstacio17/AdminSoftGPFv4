using AdminSoftGPF.Domain.Entities;

namespace AdminSoftGPF.Domain.Interfaces;

/// <summary>
/// Puerto de salida para persistencia de Tenants (Esquema saas.Tenant).
/// </summary>
public interface ITenantRepository
{
    Task<Tenant?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<Tenant>> ListAllAsync(CancellationToken cancellationToken = default);
    Task<Guid> CreateAsync(Tenant tenant, CancellationToken cancellationToken = default);
    Task UpdateStatusAsync(Guid id, string status, CancellationToken cancellationToken = default);
}
