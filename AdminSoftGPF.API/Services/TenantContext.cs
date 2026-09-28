using System.Security.Claims;
using AdminSoftGPF.Application.Common.Interfaces;
using Microsoft.AspNetCore.Http;

namespace AdminSoftGPF.API.Services;

/// <summary>
/// Extrae el TenantId, UserId, Role e ImpersonatorId desde las Claims del JWT
/// en el HttpContext de la solicitud actual.
/// </summary>
public sealed class TenantContext : ITenantContext
{
    private readonly IHttpContextAccessor _httpContextAccessor;

    public TenantContext(IHttpContextAccessor httpContextAccessor)
    {
        _httpContextAccessor = httpContextAccessor;
    }

    public Guid? TenantId
    {
        get
        {
            var user = _httpContextAccessor.HttpContext?.User;
            if (user == null) return null;

            var tenantClaim = user.FindFirst("tenantId")?.Value;
            if (Guid.TryParse(tenantClaim, out var tenantId))
            {
                return tenantId;
            }

            return null;
        }
    }

    public Guid? UserId
    {
        get
        {
            var user = _httpContextAccessor.HttpContext?.User;
            if (user == null) return null;

            var subClaim = user.FindFirst(ClaimTypes.NameIdentifier)?.Value
                ?? user.FindFirst("sub")?.Value;

            if (Guid.TryParse(subClaim, out var userId))
            {
                return userId;
            }

            return null;
        }
    }

    public string? Role
    {
        get
        {
            var user = _httpContextAccessor.HttpContext?.User;
            return user?.FindFirst(ClaimTypes.Role)?.Value;
        }
    }

    public Guid? ImpersonatorId
    {
        get
        {
            var user = _httpContextAccessor.HttpContext?.User;
            if (user == null) return null;

            var impClaim = user.FindFirst("impersonator_id")?.Value;
            if (Guid.TryParse(impClaim, out var impId))
            {
                return impId;
            }

            return null;
        }
    }
}
