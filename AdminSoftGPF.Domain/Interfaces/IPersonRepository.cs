using AdminSoftGPF.Domain.Entities;

namespace AdminSoftGPF.Domain.Interfaces;

/// <summary>
/// Puerto de salida para persistencia y Soft-Anonymization de Personas (Esquema app.Person).
/// </summary>
public interface IPersonRepository
{
    Task<Person?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<Person>> ListByTenantAsync(CancellationToken cancellationToken = default);
    Task<Guid> CreateAsync(Person person, CancellationToken cancellationToken = default);
    Task UpdateAsync(Person person, CancellationToken cancellationToken = default);

    /// <summary>
    /// Aplica el patrón Soft-Anonymization para cumplir con privacidad y derecho al olvido,
    /// preservando la clave primaria para proteger la integridad contable histórica.
    /// PROHIBIDO el DELETE físico.
    /// </summary>
    Task AnonymizeAsync(Guid id, CancellationToken cancellationToken = default);
}
