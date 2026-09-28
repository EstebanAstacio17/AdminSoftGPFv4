using AdminSoftGPF.API.Common;
using AdminSoftGPF.Application.Common.CQRS;
using AdminSoftGPF.Application.Units;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AdminSoftGPF.API.Controllers;

[ApiController]
[Route("api/v1/units")]
[Authorize]
public sealed class UnitsController : ControllerBase
{
    private readonly IAppDispatcher _dispatcher;

    public UnitsController(IAppDispatcher dispatcher)
    {
        _dispatcher = dispatcher;
    }

    /// <summary>
    /// Obtiene una unidad por ID.
    /// </summary>
    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(UnitDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetById([FromRoute] Guid id, CancellationToken cancellationToken)
    {
        var result = await _dispatcher.QueryAsync(new GetUnitByIdQuery(id), cancellationToken);
        return Ok(result);
    }

    /// <summary>
    /// Lista las unidades de un bloque o torre.
    /// </summary>
    [HttpGet("block/{blockId:guid}")]
    [ProducesResponseType(typeof(IReadOnlyList<UnitDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> ListByBlock([FromRoute] Guid blockId, CancellationToken cancellationToken)
    {
        var result = await _dispatcher.QueryAsync(new ListUnitsByBlockQuery(blockId), cancellationToken);
        return Ok(result);
    }

    /// <summary>
    /// Lista todas las unidades de una propiedad completa.
    /// </summary>
    [HttpGet("property/{propertyId:guid}")]
    [ProducesResponseType(typeof(IReadOnlyList<UnitDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> ListByProperty([FromRoute] Guid propertyId, CancellationToken cancellationToken)
    {
        var result = await _dispatcher.QueryAsync(new ListUnitsByPropertyQuery(propertyId), cancellationToken);
        return Ok(result);
    }

    /// <summary>
    /// Registra una nueva unidad (apartamento / local).
    /// </summary>
    [HttpPost]
    [Authorize(Roles = AppRoles.Management)]
    [ProducesResponseType(typeof(Guid), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Create([FromBody] CreateUnitDto dto, CancellationToken cancellationToken)
    {
        var id = await _dispatcher.SendAsync(new CreateUnitCommand(dto.BlockId, dto.UnitNumber, dto.Status), cancellationToken);
        return CreatedAtAction(nameof(GetById), new { id }, new { id });
    }

    /// <summary>
    /// Actualiza el número o estado de una unidad.
    /// </summary>
    [HttpPut("{id:guid}")]
    [Authorize(Roles = AppRoles.Management)]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Update([FromRoute] Guid id, [FromBody] UpdateUnitDto dto, CancellationToken cancellationToken)
    {
        await _dispatcher.SendAsync(new UpdateUnitCommand(id, dto.UnitNumber, dto.Status), cancellationToken);
        return NoContent();
    }
}
