import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  template: `
    <aside class="sidebar-aside">
      <nav class="sidebar-nav">

        <!-- Manager / Admin / Accountant navigation (matches v3 exactly) -->
        <ng-container *ngIf="isManager()">

          <a routerLink="/dashboard" routerLinkActive="active" class="nav-item" id="nav-dashboard">
            <span class="nav-icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
            </span>
            <span class="nav-label">Dashboard</span>
          </a>

          <a routerLink="/residents" routerLinkActive="active" class="nav-item" id="nav-residents">
            <span class="nav-icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            </span>
            <span class="nav-label">Unidades y Clientes</span>
          </a>

          <a routerLink="/treasury" routerLinkActive="active" class="nav-item" id="nav-treasury">
            <span class="nav-icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>
            </span>
            <span class="nav-label">Caja y Cobranzas</span>
          </a>

          <a routerLink="/billing" routerLinkActive="active" class="nav-item" id="nav-billing">
            <span class="nav-icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
            </span>
            <span class="nav-label">Facturación</span>
          </a>

          <a routerLink="/expenses" routerLinkActive="active" class="nav-item" id="nav-expenses">
            <span class="nav-icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            </span>
            <span class="nav-label">Egresos y Pagos</span>
          </a>

          <a routerLink="/bank-reconciliation" routerLinkActive="active" class="nav-item" id="nav-reports">
            <span class="nav-icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
            </span>
            <span class="nav-label">Reportes y Balances</span>
          </a>

          <a routerLink="/properties" routerLinkActive="active" class="nav-item" id="nav-catalogs">
            <span class="nav-icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
            </span>
            <span class="nav-label">Catálogos / Proyectos</span>
          </a>

          <a routerLink="/helpdesk" routerLinkActive="active" class="nav-item" id="nav-helpdesk">
            <span class="nav-icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>
            </span>
            <span class="nav-label">Helpdesk / Mantenimiento</span>
          </a>

          <a routerLink="/facilities" routerLinkActive="active" class="nav-item" id="nav-facilities">
            <span class="nav-icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
            </span>
            <span class="nav-label">Amenidades</span>
          </a>

          <div class="nav-divider"></div>

          <a routerLink="/gate" routerLinkActive="active" class="nav-item" id="nav-gate">
            <span class="nav-icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="6" height="18"/><rect x="16" y="3" width="6" height="18"/><path d="M8 3v18"/><path d="M16 3v18"/><rect x="8" y="10" width="8" height="4"/></svg>
            </span>
            <span class="nav-label">Garita / Accesos</span>
          </a>

          <a routerLink="/users" routerLinkActive="active" class="nav-item" id="nav-users">
            <span class="nav-icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="23" y1="11" x2="17" y2="11"/><line x1="20" y1="8" x2="20" y2="14"/></svg>
            </span>
            <span class="nav-label">Usuarios y Roles</span>
          </a>

        </ng-container>

        <!-- SuperAdmin (Backoffice) -->
        <ng-container *ngIf="isSuperAdmin()">
          <div class="nav-section-label">BACKOFFICE SAAS</div>
          <a routerLink="/backoffice" routerLinkActive="active" class="nav-item" id="nav-backoffice">
            <span class="nav-icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
            </span>
            <span class="nav-label">Tenants & Clientes</span>
            <span class="nav-chip">SaaS</span>
          </a>
          <a routerLink="/dashboard" routerLinkActive="active" class="nav-item" id="nav-metrics">
            <span class="nav-icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
            </span>
            <span class="nav-label">Métricas Globales</span>
          </a>
        </ng-container>

        <!-- Garita / Seguridad -->
        <ng-container *ngIf="isGuard() && !isManager()">
          <div class="nav-section-label">GARITA & SEGURIDAD</div>
          <a routerLink="/gate" routerLinkActive="active" class="nav-item" id="nav-gate-guard">
            <span class="nav-icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            </span>
            <span class="nav-label">Control de Accesos</span>
          </a>
        </ng-container>

        <!-- Residente -->
        <ng-container *ngIf="isResident()">
          <div class="nav-section-label">PORTAL RESIDENTE</div>
          <a routerLink="/billing" routerLinkActive="active" class="nav-item" id="nav-my-invoices">
            <span class="nav-icon">🧾</span>
            <span class="nav-label">Mis Facturas</span>
          </a>
          <a routerLink="/facilities" routerLinkActive="active" class="nav-item" id="nav-my-bookings">
            <span class="nav-icon">🏊</span>
            <span class="nav-label">Reservas</span>
          </a>
          <a routerLink="/gate" routerLinkActive="active" class="nav-item" id="nav-my-qr">
            <span class="nav-icon">📱</span>
            <span class="nav-label">Mis Invitaciones QR</span>
          </a>
        </ng-container>

      </nav>

      <!-- Footer -->
      <div class="sidebar-footer">
        <div class="security-row">
          <span class="security-dot"></span>
          <span>RLS & ADO.NET Activo</span>
        </div>
        <div class="version-text">AdminSoftGPF v4 · .NET 10 · SQL Server</div>
        <div class="version-text" *ngIf="auth.currentUser() as u">
          <span class="user-footer-name">{{ getUserName(u.email) }}</span>
          <br/>
          <span class="user-footer-db">Conectado: Azure SQL Server</span>
          <br/>
          <span class="user-footer-powered">Powered by <strong>PortaForza</strong></span>
        </div>
      </div>
    </aside>
  `,
  styles: [`
    .sidebar-aside {
      width: 220px;
      min-width: 220px;
      background: var(--bg-card);
      border-right: 1px solid var(--border-color);
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      height: calc(100vh - 56px);
      position: sticky;
      top: 56px;
      overflow-y: auto;
      overflow-x: hidden;
    }

    .sidebar-nav {
      display: flex;
      flex-direction: column;
      padding: 12px 8px;
      gap: 2px;
    }

    .nav-section-label {
      font-size: 0.625rem;
      font-weight: 700;
      color: var(--text-muted);
      letter-spacing: 0.07em;
      padding: 10px 10px 4px;
      text-transform: uppercase;
    }

    .nav-divider {
      height: 1px;
      background: var(--border-color);
      margin: 6px 10px;
    }

    .nav-item {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 8px 10px;
      border-radius: 7px;
      color: var(--text-secondary);
      font-size: 0.8125rem;
      font-weight: 500;
      transition: background 0.12s ease, color 0.12s ease;
      text-decoration: none;

      .nav-icon {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 18px;
        flex-shrink: 0;
        color: var(--text-muted);
      }

      .nav-label {
        flex: 1;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .nav-chip {
        font-size: 0.6rem;
        font-weight: 700;
        background: rgba(37,99,235,0.15);
        color: #2563EB;
        padding: 2px 6px;
        border-radius: 4px;
        letter-spacing: 0.04em;
        flex-shrink: 0;
      }

      &:hover {
        background: var(--bg-card-hover);
        color: var(--text-primary);

        .nav-icon { color: var(--text-primary); }
      }

      &.active {
        background: rgba(37, 99, 235, 0.12);
        color: #2563EB;
        font-weight: 600;

        .nav-icon { color: #2563EB; }
      }
    }

    /* ── Footer ──────────────────────────────────────── */
    .sidebar-footer {
      border-top: 1px solid var(--border-color);
      padding: 12px 12px 14px;
    }

    .security-row {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 0.7rem;
      color: #4ADE80;
      font-weight: 600;
      margin-bottom: 4px;
    }

    .security-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: #4ADE80;
      flex-shrink: 0;
      animation: pulse 2s infinite;
    }

    @keyframes pulse {
      0%, 100% { opacity: 0.7; }
      50% { opacity: 1; }
    }

    .version-text {
      font-size: 0.65rem;
      color: var(--text-muted);
      line-height: 1.5;
      margin-top: 4px;
    }

    .user-footer-name {
      font-weight: 600;
      color: var(--text-secondary);
      font-size: 0.7rem;
    }

    .user-footer-db, .user-footer-powered {
      font-size: 0.63rem;
      color: var(--text-muted);
    }

    strong { font-weight: 700; }
  `]
})
export class SidebarComponent {
  constructor(public auth: AuthService) {}

  isManager(): boolean {
    const role = this.auth.currentRole();
    return role === 'TenantAdmin' || role === 'Accountant' || role === 'PortaForzaAdmin';
  }

  isSuperAdmin(): boolean {
    return this.auth.currentRole() === 'PortaForzaAdmin';
  }

  isGuard(): boolean {
    return this.auth.currentRole() === 'Guard';
  }

  isResident(): boolean {
    return this.auth.currentRole() === 'Resident';
  }

  getUserName(email: string): string {
    return email.split('@')[0].replace(/\./g, ' ');
  }
}
