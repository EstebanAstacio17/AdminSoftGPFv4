using AdminSoftGPF.API.Common;
using AdminSoftGPF.Application.Common.CQRS;
using AdminSoftGPF.Application.Properties;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AdminSoftGPF.API.Controllers;

[ApiController]
[Route("api/v1/blocks")]
[Authorize]
public sealed class BlocksController : ControllerBase
{
    private readonly IAppDispatcher _dispatcher;

    public BlocksController(IAppDispatcher dispatcher)
    {
        _dispatcher = dispatcher;
    }

    /// <summary>
    /// Lista todos los bloques / torres de una propiedad específica.
    /// </summary>
    [HttpGet("property/{propertyId:guid}")]
    [ProducesResponseType(typeof(IReadOnlyList<BlockDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> ListByProperty([FromRoute] Guid propertyId, CancellationToken cancellationToken)
    {
        var result = await _dispatcher.QueryAsync(new ListBlocksByPropertyQuery(propertyId), cancellationToken);
        return Ok(result);
    }

    /// <summary>
    /// Crea un nuevo bloque o torre dentro de una propiedad.
    /// </summary>
    [HttpPost]
    [Authorize(Roles = AppRoles.Management)]
    [ProducesResponseType(typeof(Guid), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Create([FromBody] CreateBlockDto dto, CancellationToken cancellationToken)
    {
        var id = await _dispatcher.SendAsync(new CreateBlockCommand(dto.PropertyId, dto.Name), cancellationToken);
        return Ok(new { id });
    }
}
