using AdminSoftGPF.API.Common;
using AdminSoftGPF.Application.Common.CQRS;
using AdminSoftGPF.Application.Treasury;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AdminSoftGPF.API.Controllers;

[ApiController]
[Route("api/v1/payments")]
[Authorize]
public sealed class PaymentsController : ControllerBase
{
    private readonly IAppDispatcher _dispatcher;

    public PaymentsController(IAppDispatcher dispatcher)
    {
        _dispatcher = dispatcher;
    }

    /// <summary>
    /// Obtiene el detalle de un pago por ID.
    /// </summary>
    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(PaymentDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetById([FromRoute] Guid id, CancellationToken cancellationToken)
    {
        var result = await _dispatcher.QueryAsync(new GetPaymentByIdQuery(id), cancellationToken);
        return Ok(result);
    }

    /// <summary>
    /// Consulta un pago por su referencia / clave de idempotencia para verificar si ya fue procesado.
    /// </summary>
    [HttpGet("reference/{referenceId}")]
    [ProducesResponseType(typeof(PaymentDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetByReference([FromRoute] string referenceId, CancellationToken cancellationToken)
    {
        var result = await _dispatcher.QueryAsync(new GetPaymentByReferenceQuery(referenceId), cancellationToken);
        if (result == null) return NotFound(new { message = $"No se encontró un pago con la referencia '{referenceId}'." });
        return Ok(result);
    }

    /// <summary>
    /// Lista el historial de pagos efectuados por una persona.
    /// </summary>
    [HttpGet("person/{personId:guid}")]
    [ProducesResponseType(typeof(IReadOnlyList<PaymentDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> ListByPerson([FromRoute] Guid personId, CancellationToken cancellationToken)
    {
        var result = await _dispatcher.QueryAsync(new ListPaymentsByPersonQuery(personId), cancellationToken);
        return Ok(result);
    }

    /// <summary>
    /// Procesa de forma transaccional y atómica un pago:
    /// 1. Registra el pago en app.Payment
    /// 2. Aplica el dinero contra las facturas en app.PaymentApplication
    /// 3. Actualiza el BalanceDue y Status de cada factura (con verificación de concurrencia)
    /// 4. Emite el recibo oficial en app.Receipt
    /// 5. Encola evento en app.OutboxMessage para notificación asíncrona
    /// </summary>
    [HttpPost]
    [Authorize(Roles = AppRoles.Financial)]
    [ProducesResponseType(typeof(ProcessPaymentResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> ProcessPayment([FromBody] ProcessPaymentRequestDto dto, CancellationToken cancellationToken)
    {
        var result = await _dispatcher.SendAsync(new ProcessPaymentCommand(
            dto.PersonId,
            dto.TotalAmount,
            dto.PaymentMethod,
            dto.ReferenceId,
            dto.Applications,
            dto.CustomReceiptNumber
        ), cancellationToken);

        return Ok(result);
    }
}
