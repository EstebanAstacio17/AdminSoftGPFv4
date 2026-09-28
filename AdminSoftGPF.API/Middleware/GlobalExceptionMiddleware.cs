using System.Net;
using System.Text.Json;
using AdminSoftGPF.Domain.Exceptions;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;

namespace AdminSoftGPF.API.Middleware;

/// <summary>
/// Middleware centralizado para interceptar todas las excepciones y traducirlas
/// a respuestas JSON estandarizadas (RFC 7807 Problem Details).
/// </summary>
public sealed class GlobalExceptionMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<GlobalExceptionMiddleware> _logger;

    public GlobalExceptionMiddleware(RequestDelegate next, ILogger<GlobalExceptionMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (Exception ex)
        {
            await HandleExceptionAsync(context, ex);
        }
    }

    private async Task HandleExceptionAsync(HttpContext context, Exception exception)
    {
        var (statusCode, title, message) = exception switch
        {
            EntityNotFoundException notFound => (
                HttpStatusCode.NotFound,
                "Recurso No Encontrado",
                notFound.Message
            ),
            TenantSuspendedException suspended => (
                HttpStatusCode.Forbidden,
                "Tenant Suspendido o Degradado",
                suspended.Message
            ),
            DuplicateEntityException duplicate => (
                HttpStatusCode.Conflict,
                "Conflicto de Unicidad",
                duplicate.Message
            ),
            ConcurrencyConflictException concurrency => (
                HttpStatusCode.Conflict,
                "Conflicto de Concurrencia Optimista",
                concurrency.Message
            ),
            DomainException domain => (
                HttpStatusCode.BadRequest,
                "Error de Regla de Negocio",
                domain.Message
            ),
            UnauthorizedAccessException unauth => (
                HttpStatusCode.Unauthorized,
                "No Autorizado",
                unauth.Message
            ),
            _ => (
                HttpStatusCode.InternalServerError,
                "Error Interno del Servidor",
                "Ocurrió un error inesperado al procesar la solicitud."
            )
        };

        if (statusCode == HttpStatusCode.InternalServerError)
        {
            _logger.LogError(exception, "Error no controlado al procesar petición HTTP: {Path}", context.Request.Path);
        }
        else
        {
            _logger.LogWarning("Excepción de dominio/negocio interceptada [{Title}]: {Message}", title, message);
        }

        context.Response.ContentType = "application/problem+json";
        context.Response.StatusCode = (int)statusCode;

        var problemDetails = new
        {
            type = $"https://httpstatuses.com/{(int)statusCode}",
            title,
            status = (int)statusCode,
            detail = message,
            instance = context.Request.Path.ToString()
        };

        await context.Response.WriteAsync(JsonSerializer.Serialize(problemDetails));
    }
}
