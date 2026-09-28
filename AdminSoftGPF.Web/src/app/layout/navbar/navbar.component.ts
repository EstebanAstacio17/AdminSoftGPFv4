import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';
import { ThemeService } from '../../core/services/theme.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule],
  template: `
    <!-- Banner de Suplantación Segura (Impersonation) -->
    <div *ngIf="auth.isImpersonated()" class="impersonation-banner">
      <div class="banner-content">
        <span class="pulse-dot"></span>
        <strong>Modo Soporte Activo:</strong>&nbsp;Estás operando en nombre del cliente
        <span class="badge badge-warning">Impersonated</span>
      </div>
      <button class="btn-banner-exit" (click)="auth.logout()">Salir del modo soporte</button>
    </div>

    <!-- Banner de Modo Degradado (Mora) -->
    <div *ngIf="auth.isDegradedMode()" class="degraded-mode-banner">
      <div>
        ⚠️ <strong>Modo Degradado (Solo Lectura):</strong> La cuenta del Tenant presenta morosidad en su suscripción SaaS. Operaciones de escritura bloqueadas.
      </div>
      <button class="btn-pay">Pagar Suscripción</button>
    </div>

    <!-- Barra de Navegación Superior -->
    <header class="navbar-header">

      <!-- Izquierda: Logo + versión -->
      <div class="nav-left">
        <div class="brand-logo">
          <div class="logo-icon">
            <span>GPF</span>
          </div>
          <div class="logo-text-block">
            <div class="logo-main">AdminSoft<strong>GPF</strong></div>
            <div class="logo-sub">Sistema Empresarial de Administración</div>
          </div>
        </div>
      </div>

      <!-- Centro: Selector de proyecto -->
      <div class="nav-center" *ngIf="auth.isAuthenticated()">
        <div class="project-selector" (click)="toggleProjectMenu()" id="project-selector-btn">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
          <span class="project-label">PROYECTO:</span>
          <span class="project-name">{{ currentProject() }}</span>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"/></svg>
        </div>

        <!-- Project dropdown -->
        <div class="project-dropdown" *ngIf="projectMenuOpen()">
          <div class="dropdown-item" *ngFor="let p of projects" (click)="selectProject(p)" id="project-item-{{p.id}}">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>
            {{ p.name }}
          </div>
        </div>
      </div>

      <!-- Derecha: Tema + Usuario -->
      <div class="nav-right">
        <!-- Botón Tema -->
        <button
          class="icon-btn"
          id="btn-toggle-theme"
          (click)="theme.toggleTheme()"
          [title]="theme.isDarkMode() ? 'Cambiar a Modo Día' : 'Cambiar a Modo Noche'">
          <span *ngIf="theme.isDarkMode()">☀️</span>
          <span *ngIf="!theme.isDarkMode()">🌙</span>
        </button>

        <!-- Info de Usuario -->
        <div class="user-zone" *ngIf="auth.currentUser() as user">
          <div class="user-avatar" id="user-avatar-btn" (click)="toggleUserMenu()">
            {{ user.email[0].toUpperCase() }}
          </div>
          <div class="user-info">
            <div class="user-name">{{ getUserDisplayName(user.email) }}</div>
            <div class="user-role">{{ formatRole(user.role) }}</div>
          </div>

          <!-- User dropdown -->
          <div class="user-dropdown" *ngIf="userMenuOpen()">
            <div class="dropdown-item-danger" (click)="auth.logout()" id="btn-logout">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
              Cerrar Sesión
            </div>
          </div>
        </div>

        <!-- Botón X / cerrar menú lateral en mobile -->
        <button class="icon-btn mobile-only" id="btn-close-nav" title="Cerrar menú">✕</button>
      </div>
    </header>
  `,
  styles: [`
    /* ── Impersonation Banner ──────────────────────────── */
    .impersonation-banner {
      background: #78350F;
      color: #FEF3C7;
      padding: 7px 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 0.8rem;
      border-bottom: 1px solid #92400E;

      .banner-content {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .pulse-dot {
        width: 8px;
        height: 8px;
        background: #F59E0B;
        border-radius: 50%;
        animation: pulse 1.5s infinite;
      }
    }

    .btn-banner-exit {
      background: rgba(255,255,255,0.15);
      border: 1px solid rgba(255,255,255,0.3);
      color: #FEF3C7;
      border-radius: 6px;
      padding: 4px 10px;
      font-size: 0.75rem;
      cursor: pointer;
      font-family: inherit;
      &:hover { background: rgba(255,255,255,0.25); }
    }

    @keyframes pulse {
      0%, 100% { transform: scale(0.95); opacity: 0.7; }
      50% { transform: scale(1.2); opacity: 1; }
    }

    /* ── Degraded Mode Banner ──────────────────────────── */
    .degraded-mode-banner {
      background: rgba(234, 88, 12, 0.1);
      border-bottom: 1px solid #EA580C;
      color: #FB923C;
      padding: 8px 20px;
      font-size: 0.8rem;
      font-weight: 600;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .btn-pay {
      background: #EA580C;
      color: #ffffff;
      border: none;
      border-radius: 6px;
      padding: 4px 12px;
      font-size: 0.75rem;
      cursor: pointer;
      font-family: inherit;
    }

    /* ── Navbar Header ─────────────────────────────────── */
    .navbar-header {
      height: 56px;
      background: var(--bg-card);
      border-bottom: 1px solid var(--border-color);
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 16px;
      position: sticky;
      top: 0;
      z-index: 200;
      gap: 12px;
    }

    /* ── Left: Brand Logo ──────────────────────────────── */
    .nav-left {
      display: flex;
      align-items: center;
      flex-shrink: 0;
    }

    .brand-logo {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .logo-icon {
      width: 32px;
      height: 32px;
      background: linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%);
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;

      span {
        color: #fff;
        font-size: 0.625rem;
        font-weight: 800;
        letter-spacing: -0.5px;
      }
    }

    .logo-text-block {
      line-height: 1.2;
    }

    .logo-main {
      font-size: 0.9375rem;
      font-weight: 500;
      color: var(--text-primary);

      strong {
        font-weight: 700;
        color: #2563EB;
      }
    }

    .logo-sub {
      font-size: 0.65rem;
      color: var(--text-muted);
    }

    /* ── Center: Project Selector ──────────────────────── */
    .nav-center {
      flex: 1;
      display: flex;
      justify-content: center;
      position: relative;
    }

    .project-selector {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 6px 14px;
      background: var(--bg-app);
      border: 1px solid var(--border-color);
      border-radius: 8px;
      cursor: pointer;
      font-size: 0.8125rem;
      transition: border-color 0.15s ease;
      user-select: none;

      &:hover { border-color: #2563EB; }

      .project-label {
        color: var(--text-muted);
        font-size: 0.7rem;
        font-weight: 700;
        letter-spacing: 0.05em;
      }

      .project-name {
        color: var(--text-primary);
        font-weight: 600;
        font-size: 0.8125rem;
      }

      svg { color: var(--text-muted); }
    }

    .project-dropdown {
      position: absolute;
      top: calc(100% + 6px);
      left: 50%;
      transform: translateX(-50%);
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: 10px;
      padding: 6px;
      min-width: 240px;
      box-shadow: var(--modal-shadow);
      z-index: 300;
    }

    .dropdown-item {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 12px;
      border-radius: 7px;
      font-size: 0.8125rem;
      color: var(--text-secondary);
      cursor: pointer;
      transition: background 0.1s ease;

      &:hover {
        background: var(--bg-card-hover);
        color: var(--text-primary);
      }
    }

    /* ── Right: Theme + User ───────────────────────────── */
    .nav-right {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-shrink: 0;
    }

    .icon-btn {
      background: var(--bg-app);
      border: 1px solid var(--border-color);
      color: var(--text-secondary);
      width: 32px;
      height: 32px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      font-size: 0.875rem;
      transition: border-color 0.15s ease;

      &:hover { border-color: var(--text-secondary); }
    }

    .mobile-only {
      display: none;
    }

    .user-zone {
      display: flex;
      align-items: center;
      gap: 8px;
      position: relative;
    }

    .user-avatar {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: rgba(37, 99, 235, 0.15);
      border: 1.5px solid #2563EB;
      color: #2563EB;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 0.875rem;
      cursor: pointer;
    }

    .user-info {
      line-height: 1.2;

      .user-name {
        font-size: 0.8rem;
        font-weight: 600;
        color: var(--text-primary);
      }

      .user-role {
        font-size: 0.7rem;
        color: var(--text-muted);
      }
    }

    .user-dropdown {
      position: absolute;
      top: calc(100% + 8px);
      right: 0;
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: 10px;
      padding: 6px;
      min-width: 160px;
      box-shadow: var(--modal-shadow);
      z-index: 300;
    }

    .dropdown-item-danger {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 12px;
      border-radius: 7px;
      font-size: 0.8125rem;
      color: var(--danger-red-text);
      cursor: pointer;
      transition: background 0.1s ease;

      &:hover { background: var(--danger-red-bg); }
    }

    .badge {
      display: inline-flex;
      align-items: center;
      padding: 2px 8px;
      border-radius: 9999px;
      font-size: 0.7rem;
      font-weight: 600;
    }

    .badge-warning {
      background: rgba(234, 88, 12, 0.2);
      color: #FB923C;
    }
  `]
})
export class NavbarComponent {
  projectMenuOpen = signal(false);
  userMenuOpen = signal(false);
  currentProject = signal('RESIDENCIAL MENA ARRIBA');

  projects = [
    { id: 1, name: 'RESIDENCIAL MENA ARRIBA' },
    { id: 2, name: 'TORRE DEL PARQUE' },
    { id: 3, name: 'PLAZA EMPRESARIAL NORTE' },
  ];

  constructor(public auth: AuthService, public theme: ThemeService) {}

  toggleProjectMenu(): void {
    this.projectMenuOpen.update(v => !v);
    this.userMenuOpen.set(false);
  }

  toggleUserMenu(): void {
    this.userMenuOpen.update(v => !v);
    this.projectMenuOpen.set(false);
  }

  selectProject(p: { id: number; name: string }): void {
    this.currentProject.set(p.name);
    this.projectMenuOpen.set(false);
  }

  getUserDisplayName(email: string): string {
    return email.split('@')[0].replace(/\./g, ' ');
  }

  formatRole(role: string): string {
    const map: Record<string, string> = {
      'PortaForzaAdmin': 'SuperAdmin',
      'TenantAdmin': 'Administrador',
      'Accountant': 'Contador',
      'Guard': 'Garita / Seguridad',
      'Resident': 'Residente',
    };
    return map[role] || role;
  }
}
