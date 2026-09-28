using AdminSoftGPF.API.Common;
using AdminSoftGPF.Application.Billing;
using AdminSoftGPF.Application.Common.CQRS;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AdminSoftGPF.API.Controllers;

[ApiController]
[Route("api/v1/invoices")]
[Authorize]
public sealed class InvoicesController : ControllerBase
{
    private readonly IAppDispatcher _dispatcher;

    public InvoicesController(IAppDispatcher dispatcher)
    {
        _dispatcher = dispatcher;
    }

    /// <summary>
    /// Obtiene el detalle de una factura por ID.
    /// </summary>
    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(InvoiceDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetById([FromRoute] Guid id, CancellationToken cancellationToken)
    {
        var result = await _dispatcher.QueryAsync(new GetInvoiceByIdQuery(id), cancellationToken);
        return Ok(result);
    }

    /// <summary>
    /// Lista el historial de facturas emitidas a una unidad.
    /// </summary>
    [HttpGet("unit/{unitId:guid}")]
    [ProducesResponseType(typeof(IReadOnlyList<InvoiceDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> ListByUnit([FromRoute] Guid unitId, CancellationToken cancellationToken)
    {
        var result = await _dispatcher.QueryAsync(new ListInvoicesByUnitQuery(unitId), cancellationToken);
        return Ok(result);
    }

    /// <summary>
    /// Lista todas las facturas impagas o en mora del Tenant actual (Cuentas por Cobrar).
    /// </summary>
    [HttpGet("unpaid")]
    [Authorize(Roles = AppRoles.Financial)]
    [ProducesResponseType(typeof(IReadOnlyList<InvoiceDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> ListUnpaid(CancellationToken cancellationToken)
    {
        var result = await _dispatcher.QueryAsync(new ListUnpaidInvoicesQuery(), cancellationToken);
        return Ok(result);
    }

    /// <summary>
    /// Emite una factura individual para una unidad.
    /// </summary>
    [HttpPost]
    [Authorize(Roles = AppRoles.Financial)]
    [ProducesResponseType(typeof(Guid), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Create([FromBody] CreateInvoiceDto dto, CancellationToken cancellationToken)
    {
        var id = await _dispatcher.SendAsync(new CreateInvoiceCommand(
            dto.UnitId,
            dto.Amount,
            dto.IssueDate,
            dto.DueDate,
            dto.FiscalReceiptType,
            dto.FiscalReceiptNumber
        ), cancellationToken);

        return CreatedAtAction(nameof(GetById), new { id }, new { id });
    }

    /// <summary>
    /// Emite facturación masiva recurrente (mantenimiento) para todas las unidades de una propiedad.
    /// </summary>
    [HttpPost("bulk")]
    [Authorize(Roles = AppRoles.Financial)]
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> GenerateBulk([FromBody] BulkInvoiceDto dto, CancellationToken cancellationToken)
    {
        var count = await _dispatcher.SendAsync(new GenerateBulkInvoicesCommand(
            dto.PropertyId,
            dto.Amount,
            dto.IssueDate,
            dto.DueDate,
            dto.FiscalReceiptType,
            dto.FiscalPrefix
        ), cancellationToken);

        return Ok(new { totalInvoicesCreated = count, message = $"Se generaron {count} facturas exitosamente." });
    }
}
