using AdminSoftGPF.API.Common;
using AdminSoftGPF.Application.Auth.DTOs;
using AdminSoftGPF.Application.Common.Interfaces;
using AdminSoftGPF.Domain.Entities;
using AdminSoftGPF.Domain.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AdminSoftGPF.API.Controllers;

[ApiController]
[Route("api/v1/auth")]
public sealed class AuthController : ControllerBase
{
    private readonly IUserRepository _userRepository;
    private readonly ITenantRepository _tenantRepository;
    private readonly IJwtTokenService _jwtTokenService;
    private readonly IPasswordHasher _passwordHasher;
    private readonly IAuditLogRepository _auditLogRepository;

    public AuthController(
        IUserRepository userRepository,
        ITenantRepository tenantRepository,
        IJwtTokenService jwtTokenService,
        IPasswordHasher passwordHasher,
        IAuditLogRepository auditLogRepository)
    {
        _userRepository = userRepository;
        _tenantRepository = tenantRepository;
        _jwtTokenService = jwtTokenService;
        _passwordHasher = passwordHasher;
        _auditLogRepository = auditLogRepository;
    }

    /// <summary>
    /// Autenticación de usuarios y emisión de JWT con claims de Multi-Tenancy.
    /// </summary>
    [HttpPost("login")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(AuthResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> Login([FromBody] LoginRequest request, CancellationToken cancellationToken)
    {
        var user = await _userRepository.GetByEmailAsync(request.Email, cancellationToken);
        if (user == null || !_passwordHasher.VerifyPassword(request.Password, user.PasswordHash))
        {
            return Unauthorized(new { message = "Credenciales incorrectas." });
        }

        if (!user.IsActive)
        {
            return Unauthorized(new { message = "La cuenta del usuario se encuentra desactivada." });
        }

        string? tenantStatus = null;

        // Si el usuario pertenece a un Tenant específico, verificamos el estado del Tenant
        if (user.TenantId.HasValue && user.TenantId.Value != Guid.Empty)
        {
            var tenant = await _tenantRepository.GetByIdAsync(user.TenantId.Value, cancellationToken);
            if (tenant == null)
            {
                return Unauthorized(new { message = "El Tenant asignado no existe." });
            }

            if (tenant.Status == Tenant.TenantStatus.Suspended)
            {
                return StatusCode(StatusCodes.Status403Forbidden, new
                {
                    message = "La cuenta de este Tenant ha sido suspendida. Por favor contacte al soporte de PortaForza."
                });
            }

            tenantStatus = tenant.Status;
        }

        var token = _jwtTokenService.GenerateToken(user, tenantStatus);

        return Ok(new AuthResponse(
            Token: token,
            UserId: user.Id,
            Email: user.Email,
            Role: user.Role,
            TenantId: user.TenantId,
            TenantStatus: tenantStatus
        ));
    }

    /// <summary>
    /// Suplantación Segura (Impersonation). Exclusivo para SuperAdmins de PortaForza.
    /// Emite un JWT temporal con el TenantId objetivo y el claim oculto 'impersonator_id'.
    /// </summary>
    [HttpPost("impersonate/{tenantId:guid}")]
    [Authorize(Roles = AppRoles.PortaForzaAdmin)]
    [ProducesResponseType(typeof(AuthResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Impersonate(
        [FromRoute] Guid tenantId,
        [FromServices] ITenantContext tenantContext,
        CancellationToken cancellationToken)
    {
        var targetTenant = await _tenantRepository.GetByIdAsync(tenantId, cancellationToken);
        if (targetTenant == null)
        {
            return NotFound(new { message = $"No se encontró el Tenant con ID '{tenantId}'." });
        }

        var superAdminId = tenantContext.UserId ?? Guid.Empty;
        var superAdmin = await _userRepository.GetByIdAsync(superAdminId, cancellationToken);
        if (superAdmin == null)
        {
            return Unauthorized(new { message = "SuperAdmin no encontrado." });
        }

        var impersonationToken = _jwtTokenService.GenerateImpersonationToken(superAdmin, targetTenant.Id, targetTenant.Status);

        // Registro inmutable de auditoría por sesión de soporte/suplantación iniciada
        await _auditLogRepository.InsertAsync(new AuditLog
        {
            TenantId = targetTenant.Id,
            UserId = superAdmin.Id,
            ImpersonatorId = superAdmin.Id,
            Action = "ImpersonationStarted",
            TableName = "saas.Tenant",
            RecordId = targetTenant.Id.ToString(),
            OldValues = null,
            NewValues = System.Text.Json.JsonSerializer.Serialize(new
            {
                TargetTenantId = targetTenant.Id,
                TargetTenantName = targetTenant.Name,
                SuperAdminEmail = superAdmin.Email
            })
        }, cancellationToken);

        return Ok(new AuthResponse(
            Token: impersonationToken,
            UserId: superAdmin.Id,
            Email: superAdmin.Email,
            Role: AppRoles.TenantAdmin,
            TenantId: targetTenant.Id,
            TenantStatus: targetTenant.Status,
            ImpersonatorId: superAdmin.Id
        ));
    }
}
