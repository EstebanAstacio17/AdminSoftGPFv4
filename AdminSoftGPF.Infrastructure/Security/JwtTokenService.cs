using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using AdminSoftGPF.Application.Common.Interfaces;
using AdminSoftGPF.Domain.Entities;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;

namespace AdminSoftGPF.Infrastructure.Security;

/// <summary>
/// Generador de tokens JWT para autenticación estándar y suplantación segura (Impersonation).
/// </summary>
public sealed class JwtTokenService : IJwtTokenService
{
    private readonly IConfiguration _configuration;

    public JwtTokenService(IConfiguration configuration)
    {
        _configuration = configuration;
    }

    public string GenerateToken(User user, string? tenantStatus)
    {
        var claims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
            new(JwtRegisteredClaimNames.Email, user.Email),
            new(ClaimTypes.Role, user.Role),
            new(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
        };

        if (user.TenantId.HasValue && user.TenantId.Value != Guid.Empty)
        {
            claims.Add(new Claim("tenantId", user.TenantId.Value.ToString()));
        }

        if (!string.IsNullOrEmpty(tenantStatus))
        {
            claims.Add(new Claim("tenantStatus", tenantStatus));
        }

        return CreateJwtToken(claims, expiryHours: 8);
    }

    public string GenerateImpersonationToken(User superAdmin, Guid targetTenantId, string? targetTenantStatus)
    {
        var claims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub, superAdmin.Id.ToString()),
            new(JwtRegisteredClaimNames.Email, superAdmin.Email),
            new(ClaimTypes.Role, User.UserRole.TenantAdmin), // Adopta rol administrativo del tenant
            new("tenantId", targetTenantId.ToString()),
            new("impersonator_id", superAdmin.Id.ToString()), // Marca inmutable de auditoría
            new(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
        };

        if (!string.IsNullOrEmpty(targetTenantStatus))
        {
            claims.Add(new Claim("tenantStatus", targetTenantStatus));
        }

        // Token temporal de soporte con menor tiempo de vida (2 horas)
        return CreateJwtToken(claims, expiryHours: 2);
    }

    private string CreateJwtToken(IEnumerable<Claim> claims, int expiryHours)
    {
        var secretKey = _configuration["Jwt:Key"] 
            ?? "AdminSoftGPF_SuperSecretKey_2026_PortaForza_SecurityKey123!";
        var issuer = _configuration["Jwt:Issuer"] ?? "AdminSoftGPF";
        var audience = _configuration["Jwt:Audience"] ?? "AdminSoftGPF_Clients";

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey));
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var tokenDescriptor = new SecurityTokenDescriptor
        {
            Subject = new ClaimsIdentity(claims),
            Expires = DateTime.UtcNow.AddHours(expiryHours),
            Issuer = issuer,
            Audience = audience,
            SigningCredentials = credentials
        };

        var handler = new JwtSecurityTokenHandler();
        var token = handler.CreateToken(tokenDescriptor);
        return handler.WriteToken(token);
    }
}
