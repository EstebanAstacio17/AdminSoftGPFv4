using System.Text;
using AdminSoftGPF.API.Middleware;
using AdminSoftGPF.API.Services;
using AdminSoftGPF.Application;
using AdminSoftGPF.Application.Common.Interfaces;
using AdminSoftGPF.Infrastructure;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;

var builder = WebApplication.CreateBuilder(args);

// 1. Controladores, CORS y Serialización
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAngularDev", policy =>
    {
        policy.WithOrigins("http://localhost:4200", "https://localhost:4200")
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddOpenApi();

// 2. Contexto HTTP y Multi-Tenancy
builder.Services.AddHttpContextAccessor();
builder.Services.AddScoped<ITenantContext, TenantContext>();

// 3. Capas de Aplicación (CQRS Ligero) e Infraestructura (ADO.NET, Repositorios, Seguridad)
builder.Services.AddApplicationServices();
builder.Services.AddInfrastructureServices();

// 4. Configuración de Autenticación JWT
var jwtKey = builder.Configuration["Jwt:Key"] 
    ?? "AdminSoftGPF_SuperSecretKey_2026_PortaForza_SecurityKey123!";
var jwtIssuer = builder.Configuration["Jwt:Issuer"] ?? "AdminSoftGPF";
var jwtAudience = builder.Configuration["Jwt:Audience"] ?? "AdminSoftGPF_Clients";

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = jwtIssuer,
        ValidAudience = jwtAudience,
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey)),
        ClockSkew = TimeSpan.FromMinutes(5)
    };
});

builder.Services.AddAuthorization();

var app = builder.Build();

// ── Pipeline de Middlewares ──────────────────────────────────────────

// A. Manejador Global de Excepciones (al inicio del pipeline)
app.UseMiddleware<GlobalExceptionMiddleware>();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseHttpsRedirection();

// Habilitar CORS
app.UseCors("AllowAngularDev");

// B. Autenticación y Autorización
app.UseAuthentication();
app.UseAuthorization();

// C. Control de Modo Degradado y Ciclo de Vida del Tenant
app.UseMiddleware<TenantStatusMiddleware>();

// D. Mapeo de Controladores de la API
app.MapControllers();

app.Run();
