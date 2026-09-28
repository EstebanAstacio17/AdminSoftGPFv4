namespace AdminSoftGPF.Domain.Exceptions;

/// <summary>
/// Excepción lanzada cuando una operación de mutación (POST/PUT/DELETE) se intenta
/// ejecutar sobre un Tenant en estado 'ReadOnly' (Modo Degradado / Mora) o 'Suspended'.
/// </summary>
public sealed class TenantSuspendedException : DomainException
{
    public Guid TenantId { get; }
    public string Status { get; }

    public TenantSuspendedException(Guid tenantId, string status)
        : base($"El Tenant '{tenantId}' se encuentra en estado '{status}' y no permite modificaciones operativas.")
    {
        TenantId = tenantId;
        Status = status;
    }
}
