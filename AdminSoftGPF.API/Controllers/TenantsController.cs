using AdminSoftGPF.API.Common;
using AdminSoftGPF.Application.Common.CQRS;
using AdminSoftGPF.Application.Tenants;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AdminSoftGPF.API.Controllers;

[ApiController]
[Route("api/v1/tenants")]
[Authorize(Roles = AppRoles.PortaForzaAdmin)]
public sealed class TenantsController : ControllerBase
{
    private readonly IAppDispatcher _dispatcher;

    public TenantsController(IAppDispatcher dispatcher)
    {
        _dispatcher = dispatcher;
    }

    /// <summary>
    /// Lista todos los Tenants del sistema SaaS. Exclusivo para SuperAdmins de PortaForza.
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(IReadOnlyList<TenantDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> ListAll(CancellationToken cancellationToken)
    {
        var result = await _dispatcher.QueryAsync(new ListTenantsQuery(), cancellationToken);
        return Ok(result);
    }

    /// <summary>
    /// Obtiene el detalle de un Tenant por ID.
    /// </summary>
    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(TenantDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetById([FromRoute] Guid id, CancellationToken cancellationToken)
    {
        var result = await _dispatcher.QueryAsync(new GetTenantByIdQuery(id), cancellationToken);
        return Ok(result);
    }

    /// <summary>
    /// Registra un nuevo Tenant en la plataforma SaaS.
    /// </summary>
    [HttpPost]
    [ProducesResponseType(typeof(Guid), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Create([FromBody] CreateTenantDto dto, CancellationToken cancellationToken)
    {
        var id = await _dispatcher.SendAsync(new CreateTenantCommand(dto.Name, dto.TaxId), cancellationToken);
        return CreatedAtAction(nameof(GetById), new { id }, new { id });
    }

    /// <summary>
    /// Actualiza el estado del ciclo de vida del Tenant ('Active', 'ReadOnly', 'Suspended').
    /// </summary>
    [HttpPatch("{id:guid}/status")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateStatus([FromRoute] Guid id, [FromBody] UpdateTenantStatusDto dto, CancellationToken cancellationToken)
    {
        await _dispatcher.SendAsync(new UpdateTenantStatusCommand(id, dto.Status), cancellationToken);
        return NoContent();
    }
}
