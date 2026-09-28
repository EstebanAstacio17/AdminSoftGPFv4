using System.Net;
using System.Text.Json;
using AdminSoftGPF.Domain.Entities;
using Microsoft.AspNetCore.Http;

namespace AdminSoftGPF.API.Middleware;

/// <summary>
/// Intercepta las solicitudes HTTP y hace cumplir las reglas del ciclo de vida del Tenant:
/// - Active: Permite todo el tráfico autorizado.
/// - ReadOnly (Modo Degradado / Mora): Permite GET (consultas), bloquea POST/PUT/DELETE con 403 Forbidden.
/// - Suspended: Bloquea todo acceso con 403 Forbidden.
/// </summary>
public sealed class TenantStatusMiddleware
{
    private readonly RequestDelegate _next;

    public TenantStatusMiddleware(RequestDelegate next)
    {
        _next = next;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        var user = context.User;

        // Si la petición no está autenticada o es una ruta pública (ej. login), omitir
        if (user.Identity?.IsAuthenticated != true)
        {
            await _next(context);
            return;
        }

        // SuperAdmin de PortaForza nunca se bloquea
        var role = user.FindFirst(System.Security.Claims.ClaimTypes.Role)?.Value;
        if (role == User.UserRole.PortaForzaAdmin)
        {
            await _next(context);
            return;
        }

        var status = user.FindFirst("tenantStatus")?.Value;

        if (!string.IsNullOrEmpty(status))
        {
            if (string.Equals(status, Tenant.TenantStatus.Suspended, StringComparison.OrdinalIgnoreCase))
            {
                context.Response.StatusCode = (int)HttpStatusCode.Forbidden;
                context.Response.ContentType = "application/json";

                var response = new
                {
                    status = 403,
                    error = "Forbidden",
                    message = "La cuenta de este Tenant ha sido suspendida. Por favor contacte al soporte de PortaForza."
                };

                await context.Response.WriteAsync(JsonSerializer.Serialize(response));
                return;
            }

            if (string.Equals(status, Tenant.TenantStatus.ReadOnly, StringComparison.OrdinalIgnoreCase))
            {
                var method = context.Request.Method.ToUpperInvariant();
                if (method is "POST" or "PUT" or "DELETE" or "PATCH")
                {
                    context.Response.StatusCode = (int)HttpStatusCode.Forbidden;
                    context.Response.ContentType = "application/json";

                    var response = new
                    {
                        status = 403,
                        error = "TenantReadOnly",
                        message = "La cuenta del Tenant se encuentra en Modo Degradado (Solo Lectura) por morosidad. No se permiten operaciones de escritura hasta regularizar el pago del servicio SaaS."
                    };

                    await context.Response.WriteAsync(JsonSerializer.Serialize(response));
                    return;
                }
            }
        }

        await _next(context);
    }
}
