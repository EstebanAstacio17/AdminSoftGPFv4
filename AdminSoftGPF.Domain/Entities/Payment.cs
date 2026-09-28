namespace AdminSoftGPF.Domain.Entities;

/// <summary>
/// Representa un Ingreso o Pago recibido de una persona.
/// Esquema SQL: app.Payment
/// </summary>
public sealed class Payment
{
    /// <summary>PK — UNIQUEIDENTIFIER</summary>
    public Guid Id { get; set; }

    /// <summary>FK a saas.Tenant — UNIQUEIDENTIFIER. Aislamiento multi-tenant.</summary>
    public Guid TenantId { get; set; }

    /// <summary>FK a app.Person — UNIQUEIDENTIFIER</summary>
    public Guid PersonId { get; set; }

    /// <summary>Monto total pagado — DECIMAL(19,4)</summary>
    public decimal TotalAmount { get; set; }

    /// <summary>
    /// Método de pago: 'CreditCard', 'Transfer', 'Cash' — VARCHAR
    /// </summary>
    public string PaymentMethod { get; set; } = PaymentMethods.Transfer;

    /// <summary>
    /// Clave de Idempotencia / Referencia bancaria (UNIQUE por Tenant)
    /// para evitar doble cobro o duplicación.
    /// — VARCHAR
    /// </summary>
    public string ReferenceId { get; set; } = string.Empty;

    /// <summary>
    /// Estado del pago: 'Completed', 'Reverted' — VARCHAR
    /// </summary>
    public string Status { get; set; } = PaymentStatuses.Completed;

    // ── Constantes de métodos y estados válidos ───────────────────

    public static class PaymentMethods
    {
        public const string CreditCard = "CreditCard";
        public const string Transfer   = "Transfer";
        public const string Cash       = "Cash";
    }

    public static class PaymentStatuses
    {
        public const string Completed = "Completed";
        public const string Reverted  = "Reverted";
    }
}
