import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';

interface TenantView {
  id: string;
  name: string;
  subdomain: string;
  plan: 'Basic' | 'Professional' | 'Enterprise';
  status: 'Active' | 'ReadOnly' | 'Suspended';
  propertiesCount: number;
  totalUnitsCount: number;
  monthlyRevenue: number;
  createdAt: string;
}

@Component({
  selector: 'app-backoffice',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page-header">
      <div>
        <h1 class="page-title">Backoffice PortaForza (SuperAdmin)</h1>
        <p class="page-subtitle">Gestión global de Tenants SaaS, estados de suscripción, modo degradado y suplantación segura.</p>
      </div>
      <button class="btn btn-primary" (click)="openTenantModal()">
        <span>+ Onboarding Nuevo Tenant</span>
      </button>
    </div>

    <!-- Métricas Globales de la Plataforma SaaS -->
    <div class="stats-row">
      <div class="gpf-card stat-item">
        <span class="stat-label">Tenants / Clientes SaaS</span>
        <span class="stat-value amount-executive">{{ tenants().length }}</span>
      </div>
      <div class="gpf-card stat-item">
        <span class="stat-label">MRR (Ingresos Recurrentes)</span>
        <span class="stat-value amount-executive positive">$4,890,000</span>
      </div>
      <div class="gpf-card stat-item">
        <span class="stat-label">Total Unidades Gestionadas</span>
        <span class="stat-value amount-executive">1,240</span>
      </div>
      <div class="gpf-card stat-item">
        <span class="stat-label">Tenants en Mora (ReadOnly)</span>
        <span class="stat-value amount-executive debt">1 Tenant</span>
      </div>
    </div>

    <!-- Directorio de Tenants -->
    <div class="gpf-card">
      <div class="table-header-controls">
        <h2>Directorio de Tenants Inmobiliarios</h2>
        <div class="search-box">
          <input type="text" [(ngModel)]="searchQuery" placeholder="Buscar tenant por nombre o subdominio..." />
        </div>
      </div>

      <div class="table-container">
        <table class="table-clean">
          <thead>
            <tr>
              <th>Cliente / Razón Social</th>
              <th>Subdominio SaaS</th>
              <th>Plan</th>
              <th>Propiedades / Uds</th>
              <th>MRR ($)</th>
              <th>Estado Suscripción</th>
              <th>Acciones de Soporte</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let t of filteredTenants()">
              <td>
                <div class="tenant-name-col">
                  <strong>{{ t.name }}</strong>
                  <span class="tenant-id-sub">ID: {{ t.id }}</span>
                </div>
              </td>
              <td><code>{{ t.subdomain }}.adminsoftgpf.com</code></td>
              <td><span class="plan-tag">{{ t.plan }}</span></td>
              <td>{{ t.propertiesCount }} condominios ({{ t.totalUnitsCount }} uds)</td>
              <td><span class="amount-executive positive">&#36;{{ t.monthlyRevenue | number }}</span></td>
              <td>
                <span 
                  class="badge" 
                  [class.badge-success]="t.status === 'Active'" 
                  [class.badge-warning]="t.status === 'ReadOnly'" 
                  [class.badge-danger]="t.status === 'Suspended'"
                >
                  {{ getStatusLabel(t.status) }}
                </span>
              </td>
              <td>
                <div class="actions-group">
                  <!-- Botón Suplantación Segura (Impersonation) -->
                  <button 
                    class="btn btn-outline btn-xs impersonate-btn" 
                    (click)="impersonateTenant(t)"
                    title="Suplantar de forma segura para soporte con auditoría"
                  >
                    ⚡ Suplantar (Soporte)
                  </button>

                  <!-- Toggle de Modo Degradado -->
                  <button 
                    *ngIf="t.status === 'Active'" 
                    class="btn btn-outline btn-xs" 
                    (click)="setStatus(t, 'ReadOnly')"
                    title="Activar Modo Degradado (Mora)"
                  >
                    ⚠️ Poner en Mora
                  </button>
                  <button 
                    *ngIf="t.status === 'ReadOnly'" 
                    class="btn btn-outline btn-xs btn-success-text" 
                    (click)="setStatus(t, 'Active')"
                    title="Reactivar Tenant"
                  >
                    ✓ Reactivar
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Modal Onboarding Nuevo Tenant -->
    <div class="modal-overlay" *ngIf="showModal()">
      <div class="modal-dialog gpf-card">
        <div class="modal-header">
          <h3>⚡ Onboarding de Nuevo Tenant SaaS</h3>
          <button class="btn-close" (click)="closeModal()">✕</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>Nombre de la Empresa Administradora</label>
            <input type="text" [(ngModel)]="newTenant.name" placeholder="Ej. Administraciones Los Andes SpA" />
          </div>
          <div class="form-group">
            <label>Subdominio Único</label>
            <input type="text" [(ngModel)]="newTenant.subdomain" placeholder="losandes" />
          </div>
          <div class="form-group">
            <label>Plan de Suscripción</label>
            <select [(ngModel)]="newTenant.plan">
              <option value="Basic">Basic (Hasta 100 unidades)</option>
              <option value="Professional">Professional (Hasta 500 unidades)</option>
              <option value="Enterprise">Enterprise (Ilimitado)</option>
            </select>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-outline" (click)="closeModal()">Cancelar</button>
          <button class="btn btn-primary" (click)="saveTenant()">Aprovisionar Tenant ➔</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 24px;

      .page-title {
        font-size: 1.5rem;
        font-weight: 700;
        letter-spacing: -0.5px;
      }

      .page-subtitle {
        font-size: 0.875rem;
        color: var(--text-secondary);
        margin-top: 4px;
      }
    }

    .stats-row {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 16px;
      margin-bottom: 24px;

      .stat-item {
        padding: 16px 20px;
        display: flex;
        flex-direction: column;
        gap: 4px;

        .stat-label {
          font-size: 0.75rem;
          color: var(--text-secondary);
          text-transform: uppercase;
          font-weight: 600;
          letter-spacing: 0.05em;
        }

        .stat-value {
          font-size: 1.5rem;
        }
      }
    }

    .table-header-controls {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;

      h2 {
        font-size: 1.125rem;
        font-weight: 600;
      }

      .search-box input {
        padding: 8px 14px;
        background-color: var(--bg-app);
        border: 1px solid var(--border-color);
        border-radius: 8px;
        color: var(--text-primary);
        font-size: 0.8125rem;
      }
    }

    .tenant-name-col {
      display: flex;
      flex-direction: column;

      .tenant-id-sub {
        font-size: 0.6875rem;
        color: var(--text-muted);
        font-family: monospace;
      }
    }

    .plan-tag {
      font-size: 0.75rem;
      font-weight: 600;
      padding: 2px 8px;
      background-color: var(--bg-app);
      border-radius: 4px;
      border: 1px solid var(--border-color);
    }

    .actions-group {
      display: flex;
      gap: 6px;
    }

    .impersonate-btn {
      color: #F59E0B;
      border-color: #F59E0B;

      &:hover {
        background-color: #78350F;
        color: #FEF3C7;
      }
    }

    .btn-success-text {
      color: var(--success-green-text);
    }

    .btn-xs {
      padding: 4px 10px;
      font-size: 0.75rem;
    }

    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.6);
      backdrop-filter: blur(4px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;

      .modal-dialog {
        width: 100%;
        max-width: 500px;
        background-color: var(--bg-card);
        padding: 24px;
        box-shadow: var(--modal-shadow);

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
          padding-bottom: 12px;
          border-bottom: 1px solid var(--border-color);

          .btn-close {
            background: none;
            border: none;
            color: var(--text-secondary);
            font-size: 1.125rem;
            cursor: pointer;
          }
        }

        .modal-footer {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          margin-top: 24px;
          padding-top: 16px;
          border-top: 1px solid var(--border-color);
        }
      }
    }
  `]
})
export class BackofficeComponent {
  tenants = signal<TenantView[]>([
    {
      id: 'c1d2e3f4-1111-2222-3333-444444444444',
      name: 'Administraciones Parque Central SpA',
      subdomain: 'parquecentral',
      plan: 'Professional',
      status: 'Active',
      propertiesCount: 4,
      totalUnitsCount: 256,
      monthlyRevenue: 245000,
      createdAt: '2026-01-15'
    },
    {
      id: 'c1d2e3f4-2222-3333-4444-555555555555',
      name: 'Gestión Inmobiliaria Los Robles',
      subdomain: 'losrobles',
      plan: 'Basic',
      status: 'ReadOnly',
      propertiesCount: 1,
      totalUnitsCount: 64,
      monthlyRevenue: 95000,
      createdAt: '2026-03-20'
    },
    {
      id: 'c1d2e3f4-3333-4444-5555-666666666666',
      name: 'Condominios del Sur SpA',
      subdomain: 'delsur',
      plan: 'Enterprise',
      status: 'Active',
      propertiesCount: 12,
      totalUnitsCount: 920,
      monthlyRevenue: 750000,
      createdAt: '2026-02-10'
    }
  ]);

  searchQuery = '';
  showModal = signal(false);
  newTenant: Partial<TenantView> = { plan: 'Professional' };

  constructor(
    private api: ApiService,
    private auth: AuthService,
    private router: Router
  ) {}

  filteredTenants(): TenantView[] {
    return this.tenants().filter(t => {
      if (this.searchQuery) {
        const q = this.searchQuery.toLowerCase();
        return t.name.toLowerCase().includes(q) || t.subdomain.toLowerCase().includes(q);
      }
      return true;
    });
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'Active': return 'Activo';
      case 'ReadOnly': return 'Modo Degradado (Mora)';
      case 'Suspended': return 'Suspendido';
      default: return status;
    }
  }

  setStatus(tenant: TenantView, status: 'Active' | 'ReadOnly' | 'Suspended'): void {
    this.tenants.update(list => list.map(t => t.id === tenant.id ? { ...t, status } : t));
  }

  impersonateTenant(tenant: TenantView): void {
    this.api.impersonate(tenant.id).subscribe({
      next: (response) => {
        this.auth.setSession(response);
        this.router.navigate(['/dashboard']);
      }
    });
  }

  openTenantModal(): void {
    this.newTenant = { plan: 'Professional' };
    this.showModal.set(true);
  }

  closeModal(): void {
    this.showModal.set(false);
  }

  saveTenant(): void {
    if (!this.newTenant.name || !this.newTenant.subdomain) return;
    const t: TenantView = {
      id: 'c1d2e3f4-0000-0000-0000-' + Math.floor(100000000000 + Math.random() * 900000000000),
      name: this.newTenant.name,
      subdomain: this.newTenant.subdomain,
      plan: this.newTenant.plan as any || 'Professional',
      status: 'Active',
      propertiesCount: 0,
      totalUnitsCount: 0,
      monthlyRevenue: 150000,
      createdAt: '2026-09-27'
    };
    this.tenants.update(list => [t, ...list]);
    this.closeModal();
  }
}
