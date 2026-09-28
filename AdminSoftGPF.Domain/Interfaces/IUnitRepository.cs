using AdminSoftGPF.Domain.Entities;

namespace AdminSoftGPF.Domain.Interfaces;

/// <summary>
/// Puerto de salida para persistencia de Unidades (Esquema app.Unit).
/// </summary>
public interface IUnitRepository
{
    Task<Unit?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<Unit>> ListByBlockAsync(Guid blockId, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<Unit>> ListByPropertyAsync(Guid propertyId, CancellationToken cancellationToken = default);
    Task<Guid> CreateAsync(Unit unit, CancellationToken cancellationToken = default);
    Task UpdateAsync(Unit unit, CancellationToken cancellationToken = default);
}
