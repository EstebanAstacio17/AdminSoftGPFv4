using AdminSoftGPF.Domain.Entities;

namespace AdminSoftGPF.Domain.Interfaces;

/// <summary>
/// Puerto de salida para persistencia de Bloques/Torres (Esquema app.Block).
/// </summary>
public interface IBlockRepository
{
    Task<Block?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<Block>> ListByPropertyAsync(Guid propertyId, CancellationToken cancellationToken = default);
    Task<Guid> CreateAsync(Block block, CancellationToken cancellationToken = default);
    Task UpdateAsync(Block block, CancellationToken cancellationToken = default);
}
