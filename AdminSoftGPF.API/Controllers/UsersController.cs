using AdminSoftGPF.API.Common;
using AdminSoftGPF.Application.Common.CQRS;
using AdminSoftGPF.Application.Common.Interfaces;
using AdminSoftGPF.Application.Users;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AdminSoftGPF.API.Controllers;

[ApiController]
[Route("api/v1/users")]
[Authorize]
public sealed class UsersController : ControllerBase
{
    private readonly IAppDispatcher _dispatcher;
    private readonly ITenantContext _tenantContext;

    public UsersController(IAppDispatcher dispatcher, ITenantContext tenantContext)
    {
        _dispatcher = dispatcher;
        _tenantContext = tenantContext;
    }

    /// <summary>
    /// Lista los usuarios asociados al Tenant actual o al especificado (para PortaForzaAdmin).
    /// </summary>
    [HttpGet]
    [Authorize(Roles = AppRoles.Management)]
    [ProducesResponseType(typeof(IReadOnlyList<UserDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> ListByTenant([FromQuery] Guid? tenantId, CancellationToken cancellationToken)
    {
        var targetTenantId = _tenantContext.TenantId ?? tenantId ?? Guid.Empty;
        var result = await _dispatcher.QueryAsync(new ListUsersByTenantQuery(targetTenantId), cancellationToken);
        return Ok(result);
    }

    /// <summary>
    /// Obtiene los detalles de un usuario por ID.
    /// </summary>
    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(UserDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetById([FromRoute] Guid id, CancellationToken cancellationToken)
    {
        var result = await _dispatcher.QueryAsync(new GetUserByIdQuery(id), cancellationToken);
        return Ok(result);
    }

    /// <summary>
    /// Crea un nuevo usuario con hashing seguro de contraseña.
    /// </summary>
    [HttpPost]
    [Authorize(Roles = AppRoles.Management)]
    [ProducesResponseType(typeof(Guid), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> Create([FromBody] CreateUserDto dto, CancellationToken cancellationToken)
    {
        var tenantId = _tenantContext.TenantId ?? dto.TenantId;
        var id = await _dispatcher.SendAsync(new CreateUserCommand(tenantId, dto.Email, dto.Password, dto.Role), cancellationToken);
        return CreatedAtAction(nameof(GetById), new { id }, new { id });
    }

    /// <summary>
    /// Habilita o deshabilita la cuenta de un usuario.
    /// </summary>
    [HttpPatch("{id:guid}/status")]
    [Authorize(Roles = AppRoles.Management)]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> SetActiveStatus([FromRoute] Guid id, [FromBody] bool isActive, CancellationToken cancellationToken)
    {
        await _dispatcher.SendAsync(new SetUserActiveStatusCommand(id, isActive), cancellationToken);
        return NoContent();
    }
}
