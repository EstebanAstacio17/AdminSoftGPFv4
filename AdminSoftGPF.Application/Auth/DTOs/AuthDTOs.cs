namespace AdminSoftGPF.Application.Auth.DTOs;

public sealed record LoginRequest(string Email, string Password);

public sealed record AuthResponse(
    string Token,
    Guid UserId,
    string Email,
    string Role,
    Guid? TenantId,
    string? TenantStatus,
    Guid? ImpersonatorId = null
);

public sealed record ImpersonateRequest(Guid TargetTenantId);
