using AdminSoftGPF.Domain.Entities;

namespace AdminSoftGPF.Application.Common.Interfaces;

/// <summary>
/// Servicio para generación de tokens JWT de autenticación y suplantación segura (Impersonation).
/// </summary>
public interface IJwtTokenService
{
    /// <summary>
    /// Genera un token JWT para un usuario autenticado estándar.
    /// </summary>
    string GenerateToken(User user, string? tenantStatus);

    /// <summary>
    /// Genera un token JWT temporal con el TenantId objetivo y el claim oculto impersonator_id.
    /// Exclusivo para suplantación segura por PortaForzaAdmin.
    /// </summary>
    string GenerateImpersonationToken(User superAdmin, Guid targetTenantId, string? targetTenantStatus);
}
