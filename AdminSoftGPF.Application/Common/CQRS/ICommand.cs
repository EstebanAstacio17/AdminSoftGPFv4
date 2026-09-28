namespace AdminSoftGPF.Application.Common.CQRS;

/// <summary>
/// Representa una intención de mutar el estado del sistema sin valor de retorno.
/// </summary>
public interface ICommand
{
}

/// <summary>
/// Representa una intención de mutar el estado del sistema que retorna un resultado de tipo TResult.
/// </summary>
public interface ICommand<out TResult>
{
}

/// <summary>
/// Representa una consulta de solo lectura que retorna un resultado de tipo TResult.
/// </summary>
public interface IQuery<out TResult>
{
}
