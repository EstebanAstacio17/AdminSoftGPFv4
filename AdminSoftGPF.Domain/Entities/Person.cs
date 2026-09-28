namespace AdminSoftGPF.Domain.Entities;

/// <summary>
/// Representa a un Residente o Propietario.
/// Sujeto a la regla inquebrantable de Soft-Anonymization (prohibido DELETE físico).
/// Esquema SQL: app.Person
/// </summary>
public sealed class Person
{
    /// <summary>PK — UNIQUEIDENTIFIER</summary>
    public Guid Id { get; set; }

    /// <summary>FK a saas.Tenant — UNIQUEIDENTIFIER. Aislamiento multi-tenant.</summary>
    public Guid TenantId { get; set; }

    /// <summary>Nombres — VARCHAR (Sujeto a anonimización si exige baja por privacidad)</summary>
    public string FirstName { get; set; } = string.Empty;

    /// <summary>Apellidos — VARCHAR (Sujeto a anonimización si exige baja por privacidad)</summary>
    public string LastName { get; set; } = string.Empty;

    /// <summary>Correo electrónico — VARCHAR</summary>
    public string? Email { get; set; }

    /// <summary>Cédula / RNC para comprobantes fiscales — VARCHAR</summary>
    public string? TaxId { get; set; }
}
