using AdminSoftGPF.Domain.Entities;

namespace AdminSoftGPF.Domain.Interfaces;

/// <summary>
/// Puerto de salida para persistencia de Propiedades (Esquema app.Property).
/// </summary>
public interface IPropertyRepository
{
    Task<Property?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<Property>> ListByTenantAsync(CancellationToken cancellationToken = default);
    Task<Guid> CreateAsync(Property property, CancellationToken cancellationToken = default);
    Task UpdateAsync(Property property, CancellationToken cancellationToken = default);
}
