namespace AdminSoftGPF.Application.Common.Interfaces;

/// <summary>
/// Provee el contexto del Tenant del usuario actualmente autenticado (obtenido del JWT).
/// Se utiliza para inyectar automáticamente el TenantId en el SESSION_CONTEXT de Azure SQL.
/// </summary>
public interface ITenantContext
{
    /// <summary>
    /// Identificador del Tenant actual. Es null si el usuario es SuperAdmin global
    /// o si se ejecuta en una llamada anónima (ej. Login inicial).
    /// </summary>
    Guid? TenantId { get; }

    /// <summary>
    /// Identificador del usuario autenticado (claim sub).
    /// </summary>
    Guid? UserId { get; }

    /// <summary>
    /// Rol del usuario autenticado.
    /// </summary>
    string? Role { get; }

    /// <summary>
    /// Si la sesión actual es producto de una suplantación segura (Impersonation),
    /// contiene el ID del SuperAdmin de PortaForza que ejecuta la acción.
    /// </summary>
    Guid? ImpersonatorId { get; }

    /// <summary>
    /// Indica si hay un Tenant autenticado en la solicitud actual.
    /// </summary>
    bool HasTenant => TenantId.HasValue && TenantId.Value != Guid.Empty;
}
