namespace AdminSoftGPF.Domain.Exceptions;

/// <summary>
/// Excepción para violaciones de reglas de negocio del dominio AdminSoftGPF.
/// </summary>
public class DomainException : Exception
{
    public DomainException(string message) : base(message)
    {
    }

    public DomainException(string message, Exception innerException) : base(message, innerException)
    {
    }
}
