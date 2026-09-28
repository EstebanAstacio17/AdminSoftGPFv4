using AdminSoftGPF.API.Common;
using AdminSoftGPF.Application.Common.CQRS;
using AdminSoftGPF.Application.Operations;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AdminSoftGPF.API.Controllers;

[ApiController]
[Route("api/v1/helpdesk")]
[Authorize]
public sealed class HelpdeskController : ControllerBase
{
    private readonly IAppDispatcher _dispatcher;

    public HelpdeskController(IAppDispatcher dispatcher)
    {
        _dispatcher = dispatcher;
    }

    [HttpGet("property/{propertyId:guid}")]
    [ProducesResponseType(typeof(IReadOnlyList<MaintenanceTicketDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> ListByProperty([FromRoute] Guid propertyId, CancellationToken cancellationToken)
    {
        var result = await _dispatcher.QueryAsync(new ListTicketsByPropertyQuery(propertyId), cancellationToken);
        return Ok(result);
    }

    [HttpPost]
    [ProducesResponseType(typeof(object), StatusCodes.Status201Created)]
    public async Task<IActionResult> Create([FromBody] CreateTicketDto dto, CancellationToken cancellationToken)
    {
        var id = await _dispatcher.SendAsync(new CreateTicketCommand(dto.PropertyId, dto.UnitId, dto.ReportedByPersonId, dto.Title, dto.Description, dto.Priority), cancellationToken);
        return Ok(new { id });
    }

    [HttpPatch("{id:guid}/status")]
    [Authorize(Roles = AppRoles.Management)]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> UpdateStatus([FromRoute] Guid id, [FromBody] string status, CancellationToken cancellationToken)
    {
        await _dispatcher.SendAsync(new UpdateTicketStatusCommand(id, status), cancellationToken);
        return NoContent();
    }
}
