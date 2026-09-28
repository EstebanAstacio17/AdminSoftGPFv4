using AdminSoftGPF.API.Common;
using AdminSoftGPF.Application.Common.CQRS;
using AdminSoftGPF.Application.Operations;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AdminSoftGPF.API.Controllers;

[ApiController]
[Route("api/v1/bank-reconciliation")]
[Authorize(Roles = AppRoles.Financial)]
public sealed class BankReconciliationController : ControllerBase
{
    private readonly IAppDispatcher _dispatcher;

    public BankReconciliationController(IAppDispatcher dispatcher)
    {
        _dispatcher = dispatcher;
    }

    /// <summary>
    /// Importa líneas de extracto bancario para conciliación.
    /// </summary>
    [HttpPost("import")]
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    public async Task<IActionResult> ImportStatement([FromBody] ImportStatementDto dto, CancellationToken cancellationToken)
    {
        var count = await _dispatcher.SendAsync(new ImportBankStatementCommand(dto.PropertyId, dto.Transactions), cancellationToken);
        return Ok(new { totalImported = count, message = $"Se importaron {count} transacciones bancarias." });
    }

    /// <summary>
    /// Lista transacciones bancarias pendientes de conciliación.
    /// </summary>
    [HttpGet("unreconciled/property/{propertyId:guid}")]
    [ProducesResponseType(typeof(IReadOnlyList<BankTransactionDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> ListUnreconciled([FromRoute] Guid propertyId, CancellationToken cancellationToken)
    {
        var result = await _dispatcher.QueryAsync(new ListUnreconciledTransactionsQuery(propertyId), cancellationToken);
        return Ok(result);
    }

    /// <summary>
    /// Realiza el cruce / conciliación entre una línea bancaria y un pago registrado.
    /// </summary>
    [HttpPost("match")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> MatchTransaction([FromBody] MatchBankTransactionDto dto, CancellationToken cancellationToken)
    {
        await _dispatcher.SendAsync(new MatchBankTransactionCommand(dto.BankTransactionId, dto.PaymentId), cancellationToken);
        return NoContent();
    }
}
