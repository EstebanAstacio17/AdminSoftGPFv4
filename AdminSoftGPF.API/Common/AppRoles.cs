namespace AdminSoftGPF.API.Common;

/// <summary>
/// Constantes de roles para autorización en Controladores y Políticas de Seguridad.
/// </summary>
public static class AppRoles
{
    public const string PortaForzaAdmin = "PortaForzaAdmin";
    public const string TenantAdmin     = "TenantAdmin";
    public const string Accountant      = "Accountant";
    public const string Resident        = "Resident";
    public const string Guard           = "Guard";

    // ── Combinaciones de roles comunes ─────────────────────────────
    public const string Management = "PortaForzaAdmin,TenantAdmin";
    public const string Financial  = "PortaForzaAdmin,TenantAdmin,Accountant";
    public const string Staff      = "PortaForzaAdmin,TenantAdmin,Accountant,Guard";
}
