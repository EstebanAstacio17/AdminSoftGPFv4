using AdminSoftGPF.Domain.Entities;

namespace AdminSoftGPF.Domain.Interfaces;

/// <summary>
/// Puerto de salida para asignación de personas a unidades (Esquema app.UnitResident).
/// </summary>
public interface IUnitResidentRepository
{
    Task<IReadOnlyList<UnitResident>> ListByUnitAsync(Guid unitId, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<UnitResident>> ListByPersonAsync(Guid personId, CancellationToken cancellationToken = default);
    Task<Guid> AssignAsync(UnitResident unitResident, CancellationToken cancellationToken = default);
    Task DeactivateAsync(Guid id, CancellationToken cancellationToken = default);
}
