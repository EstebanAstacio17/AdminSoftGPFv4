namespace AdminSoftGPF.Domain.Exceptions;

/// <summary>
/// Excepción lanzada cuando ocurre un conflicto de concurrencia optimista al validar el RowVersion en base de datos.
/// </summary>
public sealed class ConcurrencyConflictException : DomainException
{
    public string EntityName { get; }
    public object Key { get; }

    public ConcurrencyConflictException(string entityName, object key)
        : base($"El registro '{entityName}' con clave '{key}' fue modificado concurrentemente por otro proceso. Por favor recargue y reintente.")
    {
        EntityName = entityName;
        Key = key;
    }
}
