using AdminSoftGPF.API.Common;
using AdminSoftGPF.Application.Common.CQRS;
using AdminSoftGPF.Application.Operations;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AdminSoftGPF.API.Controllers;

[ApiController]
[Route("api/v1/expenses")]
[Authorize]
public sealed class ExpensesController : ControllerBase
{
    private readonly IAppDispatcher _dispatcher;

    public ExpensesController(IAppDispatcher dispatcher)
    {
        _dispatcher = dispatcher;
    }

    // ── Suppliers ───────────────────────────────────────────────────
    [HttpGet("suppliers")]
    [Authorize(Roles = AppRoles.Financial)]
    [ProducesResponseType(typeof(IReadOnlyList<SupplierDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> ListSuppliers(CancellationToken cancellationToken)
    {
        var result = await _dispatcher.QueryAsync(new ListSuppliersQuery(), cancellationToken);
        return Ok(result);
    }

    [HttpPost("suppliers")]
    [Authorize(Roles = AppRoles.Financial)]
    [ProducesResponseType(typeof(object), StatusCodes.Status201Created)]
    public async Task<IActionResult> CreateSupplier([FromBody] CreateSupplierDto dto, CancellationToken cancellationToken)
    {
        var id = await _dispatcher.SendAsync(new CreateSupplierCommand(dto.Name, dto.TaxId, dto.Email, dto.Phone, dto.Address), cancellationToken);
        return Ok(new { id });
    }

    // ── Expenses ────────────────────────────────────────────────────
    [HttpGet("property/{propertyId:guid}")]
    [Authorize(Roles = AppRoles.Financial)]
    [ProducesResponseType(typeof(IReadOnlyList<ExpenseDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> ListExpenses([FromRoute] Guid propertyId, CancellationToken cancellationToken)
    {
        var result = await _dispatcher.QueryAsync(new ListExpensesByPropertyQuery(propertyId), cancellationToken);
        return Ok(result);
    }

    [HttpPost]
    [Authorize(Roles = AppRoles.Financial)]
    [ProducesResponseType(typeof(object), StatusCodes.Status201Created)]
    public async Task<IActionResult> CreateExpense([FromBody] CreateExpenseDto dto, CancellationToken cancellationToken)
    {
        var id = await _dispatcher.SendAsync(new CreateExpenseCommand(dto.PropertyId, dto.SupplierId, dto.Concept, dto.Amount, dto.ExpenseDate, dto.FiscalReceiptNumber), cancellationToken);
        return Ok(new { id });
    }
}
