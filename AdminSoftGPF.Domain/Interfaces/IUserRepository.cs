using AdminSoftGPF.Domain.Entities;

namespace AdminSoftGPF.Domain.Interfaces;

/// <summary>
/// Puerto de salida para persistencia de Usuarios (Esquema saas.User).
/// </summary>
public interface IUserRepository
{
    Task<User?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<User?> GetByEmailAsync(string email, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<User>> ListByTenantAsync(Guid tenantId, CancellationToken cancellationToken = default);
    Task<Guid> CreateAsync(User user, CancellationToken cancellationToken = default);
    Task UpdatePasswordHashAsync(Guid id, string passwordHash, CancellationToken cancellationToken = default);
    Task SetActiveStatusAsync(Guid id, bool isActive, CancellationToken cancellationToken = default);
}
