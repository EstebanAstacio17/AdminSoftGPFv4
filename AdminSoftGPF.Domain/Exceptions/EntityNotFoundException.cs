namespace AdminSoftGPF.Domain.Exceptions;

/// <summary>
/// Excepción lanzada cuando una entidad solicitada no existe dentro del ámbito del Tenant actual.
/// </summary>
public sealed class EntityNotFoundException : DomainException
{
    public string EntityName { get; }
    public object Key { get; }

    public EntityNotFoundException(string entityName, object key)
        : base($"No se encontró la entidad '{entityName}' con identificador '{key}'.")
    {
        EntityName = entityName;
        Key = key;
    }
}
