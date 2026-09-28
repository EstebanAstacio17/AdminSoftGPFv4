namespace AdminSoftGPF.Domain.Exceptions;

/// <summary>
/// Excepción lanzada cuando se intenta crear o actualizar un registro violando una restricción de unicidad de negocio.
/// </summary>
public sealed class DuplicateEntityException : DomainException
{
    public string EntityName { get; }
    public string FieldName { get; }
    public object Value { get; }

    public DuplicateEntityException(string entityName, string fieldName, object value)
        : base($"Ya existe un registro de '{entityName}' con el valor '{value}' para el campo '{fieldName}'.")
    {
        EntityName = entityName;
        FieldName = fieldName;
        Value = value;
    }
}
