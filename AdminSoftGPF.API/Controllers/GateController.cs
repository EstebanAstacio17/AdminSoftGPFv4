using AdminSoftGPF.API.Common;
using AdminSoftGPF.Application.Common.CQRS;
using AdminSoftGPF.Application.Operations;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AdminSoftGPF.API.Controllers;

[ApiController]
[Route("api/v1/gate")]
[Authorize]
public sealed class GateController : ControllerBase
{
    private readonly IAppDispatcher _dispatcher;

    public GateController(IAppDispatcher dispatcher)
    {
        _dispatcher = dispatcher;
    }

    /// <summary>
    /// Genera una invitación / pase de visita con código QR.
    /// </summary>
    [HttpPost("passes")]
    [ProducesResponseType(typeof(VisitorPassDto), StatusCodes.Status201Created)]
    public async Task<IActionResult> CreatePass([FromBody] CreateVisitorPassDto dto, CancellationToken cancellationToken)
    {
        var result = await _dispatcher.SendAsync(new CreateVisitorPassCommand(dto.UnitId, dto.VisitorName, dto.VisitorIdNumber, dto.ValidFrom, dto.ValidTo), cancellationToken);
        return Ok(result);
    }

    /// <summary>
    /// Registra el ingreso de un visitante o vehículo en garita.
    /// </summary>
    [HttpPost("entries")]
    [Authorize(Roles = AppRoles.Staff)]
    [ProducesResponseType(typeof(object), StatusCodes.Status201Created)]
    public async Task<IActionResult> RegisterEntry([FromBody] RegisterGateEntryDto dto, CancellationToken cancellationToken)
    {
        var id = await _dispatcher.SendAsync(new RegisterGateEntryCommand(dto.PropertyId, dto.VisitorPassId, dto.VisitorName, dto.VehiclePlate), cancellationToken);
        return Ok(new { id });
    }

    /// <summary>
    /// Consulta la bitácora de accesos de una propiedad.
    /// </summary>
    [HttpGet("logs/property/{propertyId:guid}")]
    [Authorize(Roles = AppRoles.Staff)]
    [ProducesResponseType(typeof(IReadOnlyList<GateLogDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> ListGateLogs([FromRoute] Guid propertyId, [FromQuery] int maxRecords = 100, CancellationToken cancellationToken = default)
    {
        var result = await _dispatcher.QueryAsync(new ListGateLogsByPropertyQuery(propertyId, maxRecords), cancellationToken);
        return Ok(result);
    }
}
