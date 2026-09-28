import { Component, signal, computed, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
interface UserRecord {
  id: string | number;
  usuarioLogin: string;
  documento: string;
  nombreCompleto: string;
  correo: string;
  telefono: string;
  rol: 'Administrador' | 'Cajero / Operador' | 'Contador' | 'Seguridad / Garita' | 'Residente';
  residenciales: string[];
  accesoTotal: boolean;
  estado: 'Activo' | 'Inactivo' | 'Pendiente';
}

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="users-container">
      <!-- Encabezado de Página -->
      <div class="page-top-bar">
        <div class="header-titles">
          <div class="title-row">
            <span class="icon-shield">🛡️</span>
            <div>
              <h1 class="page-title">Control de Usuarios y Residenciales</h1>
              <p class="page-subtitle">Gestión integral de credenciales, roles de acceso y compartimentación de residenciales autorizados</p>
            </div>
          </div>
        </div>

        <div class="top-actions">
          <button class="btn-icon" (click)="refreshUsers()" title="Refrescar">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M23 4v6h-6"/><path d="M1 20v-6h6"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>
          </button>
          <button class="btn btn-primary" (click)="openCreateModal()" id="btn-nuevo-usuario">
            + Nuevo Usuario
          </button>
        </div>
      </div>

      <!-- Filtros y Pestañas de Estado (Matching Captura 24) -->
      <div class="filter-toolbar">
        <div class="status-tabs">
          <button
            class="tab-btn"
            [class.active]="selectedTab() === 'Todos'"
            (click)="selectedTab.set('Todos')">
            Todos ({{ users().length }})
          </button>
          <button
            class="tab-btn"
            [class.active]="selectedTab() === 'Pendientes'"
            (click)="selectedTab.set('Pendientes')">
            Pendientes ({{ countPendientes() }})
          </button>
          <button
            class="tab-btn"
            [class.active]="selectedTab() === 'Activos'"
            (click)="selectedTab.set('Activos')">
            Activos ({{ countActivos() }})
          </button>
          <button
            class="tab-btn"
            [class.active]="selectedTab() === 'Inactivos'"
            (click)="selectedTab.set('Inactivos')">
            Inactivos ({{ countInactivos() }})
          </button>
        </div>

        <div class="search-box">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input
            type="text"
            [(ngModel)]="searchQuery"
            placeholder="Buscar por usuario, nombre..."
            id="input-search-users" />
        </div>
      </div>

      <!-- Tabla de Usuarios (Matching Captura 24) -->
      <div class="table-card">
        <div class="table-responsive">
          <table class="gpf-table">
            <thead>
              <tr>
                <th>USUARIO</th>
                <th>NOMBRE COMPLETO</th>
                <th>NIVEL / ROL</th>
                <th>RESIDENCIALES AUTORIZADOS</th>
                <th class="text-center">ESTADO</th>
                <th class="text-center">ACCIONES</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let u of filteredUsers()">
                <td>
                  <div class="user-id-cell">
                    <div class="avatar-circle" [style.background]="getAvatarBg(u.nombreCompleto)">
                      {{ getInitials(u.nombreCompleto) }}
                    </div>
                    <div class="user-meta">
                      <strong class="user-login">{{ u.usuarioLogin }}</strong>
                      <span class="user-doc" *ngIf="u.documento">{{ u.documento }}</span>
                    </div>
                  </div>
                </td>
                <td>
                  <div class="full-name-cell">
                    <strong class="name-text">{{ u.nombreCompleto }}</strong>
                    <div class="contact-sub">
                      <span *ngIf="u.correo">✉️ {{ u.correo }}</span>
                      <span *ngIf="u.telefono">📞 {{ u.telefono }}</span>
                    </div>
                  </div>
                </td>
                <td>
                  <span class="role-badge" [class.role-admin]="u.rol === 'Administrador'">
                    {{ u.rol }}
                  </span>
                </td>
                <td>
                  <div class="residence-badges" *ngIf="u.accesoTotal">
                    <span class="badge-total-access">
                      <span class="dot-blue"></span> Acceso Total (Admin)
                    </span>
                  </div>
                  <div class="residence-badges" *ngIf="!u.accesoTotal">
                    <span class="badge-residence" *ngFor="let r of u.residenciales">{{ r }}</span>
                  </div>
                </td>
                <td class="text-center">
                  <div class="status-wrap">
                    <span class="status-pill" [class.active]="u.estado === 'Activo'" [class.inactive]="u.estado === 'Inactivo'" [class.pending]="u.estado === 'Pendiente'">
                      <span class="dot"></span>
                      {{ u.estado }}
                    </span>
                    <button *ngIf="u.estado === 'Pendiente'" class="btn-approve" (click)="approveUser(u)" title="Aprobar usuario">
                      ✔ Aprobar
                    </button>
                  </div>
                </td>
                <td class="text-center">
                  <div class="row-actions">
                    <button class="action-btn" (click)="toggleLock(u)" [title]="u.estado === 'Activo' ? 'Inhabilitar' : 'Habilitar'">
                      {{ u.estado === 'Activo' ? '🔒' : '🔓' }}
                    </button>
                    <button class="action-btn" (click)="resetPassword(u)" title="Reestablecer Contraseña">🔑</button>
                    <button class="action-btn" (click)="editUser(u)" title="Editar">✏️</button>
                    <button class="action-btn delete" (click)="deleteUser(u)" title="Eliminar">🗑️</button>
                  </div>
                </td>
              </tr>
              <tr *ngIf="filteredUsers().length === 0">
                <td colspan="6" class="empty-state">
                  No se encontraron usuarios registrados para el filtro seleccionado.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Modal Nuevo Usuario (Matching Captura 25) -->
      <div class="modal-backdrop" *ngIf="showCreateModal()">
        <div class="modal-box">
          <div class="modal-header">
            <div>
              <h3 class="modal-title">Nuevo Usuario</h3>
              <p class="modal-subtitle">Complete los campos para registrar o actualizar el acceso del operador.</p>
            </div>
            <button class="modal-close" (click)="closeCreateModal()">✕</button>
          </div>

          <div class="modal-body">
            <!-- Usuario login & Cédula -->
            <div class="form-grid-2">
              <div class="form-group">
                <div class="label-with-badge">
                  <label>USUARIO (LOGIN) *</label>
                  <span class="badge-auto">AUTO-GENERADO</span>
                </div>
                <input
                  type="text"
                  [value]="computedLogin()"
                  readonly
                  class="form-control readonly-input" />
              </div>

              <div class="form-group">
                <label>CÉDULA / DOCUMENTO</label>
                <input type="text" [(ngModel)]="formDocumento" class="form-control" placeholder="ej. 001-0000000-0" />
              </div>
            </div>

            <!-- Nombre & Apellido -->
            <div class="form-grid-2">
              <div class="form-group">
                <label>NOMBRE *</label>
                <input type="text" [(ngModel)]="formNombre" class="form-control" placeholder="ej. Juan" />
              </div>
              <div class="form-group">
                <label>APELLIDO *</label>
                <input type="text" [(ngModel)]="formApellido" class="form-control" placeholder="ej. Astacio" />
              </div>
            </div>

            <!-- Correo & Celular -->
            <div class="form-grid-2">
              <div class="form-group">
                <label>CORREO ELECTRÓNICO *</label>
                <input type="email" [(ngModel)]="formCorreo" class="form-control" placeholder="correo@ejemplo.com" />
              </div>
              <div class="form-group">
                <label>NÚMERO DE CELULAR *</label>
                <input type="text" [(ngModel)]="formTelefono" class="form-control" placeholder="(809) 000-0000" />
              </div>
            </div>

            <!-- Contraseña Inicial -->
            <div class="form-group">
              <label>CONTRASEÑA INICIAL *</label>
              <input type="password" [(ngModel)]="formPassword" class="form-control" placeholder="Mínimo 6 caracteres" />
            </div>

            <!-- Nivel / Rol & Estado de Cuenta -->
            <div class="form-grid-2">
              <div class="form-group">
                <label>NIVEL / ROL</label>
                <select [(ngModel)]="formRol" class="form-control">
                  <option value="Administrador">Administrador</option>
                  <option value="Cajero / Operador">Cajero / Operador</option>
                  <option value="Contador">Contador</option>
                  <option value="Seguridad / Garita">Seguridad / Garita</option>
                  <option value="Residente">Residente / Condómino</option>
                </select>
              </div>

              <div class="form-group">
                <label>ESTADO DE CUENTA</label>
                <select [(ngModel)]="formEstado" class="form-control">
                  <option value="Activo">Activo</option>
                  <option value="Inactivo">Inactivo</option>
                  <option value="Pendiente">Pendiente</option>
                </select>
              </div>
            </div>

            <!-- Residenciales Asignados -->
            <div class="form-group">
              <div class="residences-header">
                <label>RESIDENCIALES ASIGNADOS ({{ selectedResidences.size }})</label>
                <div class="res-quick-actions">
                  <span class="btn-link" (click)="selectAllResidences()">Todos</span>
                  <span class="btn-link text-red" (click)="clearAllResidences()">Ninguno</span>
                </div>
              </div>

              <div class="residences-checklist">
                <label class="res-checkbox" *ngFor="let res of availableResidences">
                  <input
                    type="checkbox"
                    [checked]="selectedResidences.has(res)"
                    (change)="toggleResidence(res)" />
                  <span>{{ res }}</span>
                </label>
              </div>
            </div>
          </div>

          <div class="modal-footer">
            <button class="btn btn-outline" (click)="closeCreateModal()">Cancelar</button>
            <button class="btn btn-primary" (click)="saveUser()">
              ✔ Crear Usuario
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .users-container {
      display: flex;
      flex-direction: column;
      gap: 16px;
      padding: 4px 0 30px;
    }

    .page-top-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 16px 20px;
      flex-wrap: wrap;
      gap: 14px;

      .title-row {
        display: flex;
        align-items: center;
        gap: 10px;
      }

      .icon-shield { font-size: 1.3rem; }

      .page-title {
        font-size: 1.25rem;
        font-weight: 700;
        color: #0f172a;
        margin: 0;
      }

      .page-subtitle {
        font-size: 0.78rem;
        color: #64748b;
        margin: 2px 0 0;
      }

      .top-actions {
        display: flex;
        align-items: center;
        gap: 10px;
      }
    }

    .btn-icon {
      background: #f8fafc;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      width: 36px;
      height: 36px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #64748b;
      cursor: pointer;
      &:hover { background: #e2e8f0; color: #0f172a; }
    }

    .btn {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 8px 16px;
      border-radius: 8px;
      font-size: 0.8125rem;
      font-weight: 600;
      cursor: pointer;
      border: none;
      transition: all 0.15s ease;
    }

    .btn-primary {
      background: #2563eb;
      color: #ffffff;
      &:hover { background: #1d4ed8; }
    }

    .btn-outline {
      background: #ffffff;
      border: 1px solid #cbd5e1;
      color: #475569;
      &:hover { background: #f1f5f9; }
    }

    /* Filters Toolbar */
    .filter-toolbar {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 12px 18px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 12px;
      flex-wrap: wrap;
    }

    .status-tabs {
      display: flex;
      gap: 6px;
      background: #f1f5f9;
      padding: 4px;
      border-radius: 8px;

      .tab-btn {
        background: transparent;
        border: none;
        padding: 6px 14px;
        border-radius: 6px;
        font-size: 0.78rem;
        font-weight: 600;
        color: #64748b;
        cursor: pointer;
        transition: all 0.15s ease;

        &.active {
          background: #ffffff;
          color: #2563eb;
          box-shadow: 0 1px 2px rgba(0,0,0,0.05);
        }
      }
    }

    .search-box {
      display: flex;
      align-items: center;
      gap: 8px;
      background: #f8fafc;
      border: 1.5px solid #cbd5e1;
      border-radius: 8px;
      padding: 6px 12px;
      min-width: 240px;

      svg { color: #94a3b8; }

      input {
        border: none;
        background: transparent;
        font-size: 0.8125rem;
        color: #0f172a;
        outline: none;
        width: 100%;
      }
    }

    /* Table */
    .table-card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.02);
      overflow: hidden;
    }

    .table-responsive {
      overflow-x: auto;
    }

    .gpf-table {
      width: 100%;
      border-collapse: collapse;
      text-align: left;
      font-size: 0.8125rem;

      thead th {
        background: #f8fafc;
        color: #475569;
        font-size: 0.7rem;
        font-weight: 700;
        letter-spacing: 0.04em;
        padding: 12px 14px;
        border-bottom: 1px solid #e2e8f0;
      }

      tbody tr {
        border-bottom: 1px solid #f1f5f9;
        &:hover { background: #f8fafc; }
      }

      td {
        padding: 12px 14px;
        color: #334155;
        vertical-align: middle;
      }
    }

    .user-id-cell {
      display: flex;
      align-items: center;
      gap: 10px;

      .avatar-circle {
        width: 34px;
        height: 34px;
        border-radius: 50%;
        color: #ffffff;
        font-weight: 700;
        font-size: 0.75rem;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
      }

      .user-meta {
        display: flex;
        flex-direction: column;

        .user-login {
          font-size: 0.8rem;
          color: #0f172a;
        }

        .user-doc {
          font-size: 0.68rem;
          color: #94a3b8;
        }
      }
    }

    .full-name-cell {
      display: flex;
      flex-direction: column;

      .name-text {
        font-size: 0.82rem;
        color: #1e293b;
      }

      .contact-sub {
        display: flex;
        gap: 8px;
        font-size: 0.68rem;
        color: #64748b;
      }
    }

    .role-badge {
      background: #eff6ff;
      color: #2563eb;
      border: 1px solid #bfdbfe;
      padding: 3px 8px;
      border-radius: 6px;
      font-size: 0.72rem;
      font-weight: 600;
    }

    .residence-badges {
      display: flex;
      flex-wrap: wrap;
      gap: 4px;

      .badge-total-access {
        background: #f0fdf4;
        color: #15803d;
        border: 1px solid #bbf7d0;
        padding: 2px 8px;
        border-radius: 6px;
        font-size: 0.72rem;
        font-weight: 600;
        display: inline-flex;
        align-items: center;
        gap: 5px;

        .dot-blue {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #16a34a;
        }
      }

      .badge-residence {
        background: #f1f5f9;
        color: #475569;
        padding: 2px 6px;
        border-radius: 4px;
        font-size: 0.68rem;
      }
    }

    .status-wrap {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
    }

    .status-pill {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      padding: 2px 8px;
      border-radius: 9999px;
      font-size: 0.7rem;
      font-weight: 700;

      .dot {
        width: 6px;
        height: 6px;
        border-radius: 50%;
      }

      &.active {
        background: #dcfce7;
        color: #15803d;
        .dot { background: #16a34a; }
      }

      &.inactive {
        background: #fee2e2;
        color: #b91c1c;
        .dot { background: #dc2626; }
      }

      &.pending {
        background: #fef3c7;
        color: #b45309;
        .dot { background: #d97706; }
      }
    }

    .btn-approve {
      background: #10b981;
      color: #ffffff;
      border: none;
      padding: 3px 8px;
      border-radius: 5px;
      font-size: 0.68rem;
      font-weight: 700;
      cursor: pointer;
      &:hover { background: #059669; }
    }

    .row-actions {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;

      .action-btn {
        background: #f8fafc;
        border: 1px solid #e2e8f0;
        border-radius: 6px;
        width: 28px;
        height: 28px;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        font-size: 0.8rem;
        color: #64748b;
        &:hover { background: #e2e8f0; color: #0f172a; }
        &.delete:hover { background: #fee2e2; color: #dc2626; border-color: #fca5a5; }
      }
    }

    .text-center { text-align: center; }

    /* Modal Styling */
    .modal-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(15, 23, 42, 0.6);
      backdrop-filter: blur(4px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 999;
      padding: 16px;
    }

    .modal-box {
      background: #ffffff;
      border-radius: 16px;
      width: 100%;
      max-width: 540px;
      max-height: 90vh;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      padding: 18px 24px;
      border-bottom: 1px solid #f1f5f9;

      .modal-title {
        font-size: 1.15rem;
        font-weight: 700;
        color: #0f172a;
        margin: 0;
      }

      .modal-subtitle {
        font-size: 0.75rem;
        color: #64748b;
        margin: 4px 0 0;
      }

      .modal-close {
        background: transparent;
        border: none;
        font-size: 1.2rem;
        color: #94a3b8;
        cursor: pointer;
        &:hover { color: #0f172a; }
      }
    }

    .modal-body {
      padding: 20px 24px;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .form-grid-2 {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 5px;

      label {
        font-size: 0.68rem;
        font-weight: 700;
        color: #475569;
        letter-spacing: 0.04em;
      }

      .label-with-badge {
        display: flex;
        justify-content: space-between;
        align-items: center;

        .badge-auto {
          background: #eff6ff;
          color: #2563eb;
          font-size: 0.6rem;
          font-weight: 700;
          padding: 1px 6px;
          border-radius: 4px;
        }
      }
    }

    .form-control {
      width: 100%;
      padding: 8px 12px;
      border: 1.5px solid #cbd5e1;
      border-radius: 8px;
      font-size: 0.8125rem;
      color: #0f172a;
      background: #f8fafc;
      outline: none;
      &:focus {
        border-color: #2563eb;
        background: #ffffff;
      }

      &.readonly-input {
        background: #f1f5f9;
        font-family: monospace;
        font-weight: 700;
        color: #334155;
      }
    }

    .residences-header {
      display: flex;
      justify-content: space-between;
      align-items: center;

      .res-quick-actions {
        display: flex;
        gap: 8px;

        .btn-link {
          font-size: 0.68rem;
          font-weight: 700;
          color: #2563eb;
          cursor: pointer;
          &:hover { text-decoration: underline; }

          &.text-red { color: #dc2626; }
        }
      }
    }

    .residences-checklist {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 10px;
      display: flex;
      flex-direction: column;
      gap: 8px;

      .res-checkbox {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 0.78rem;
        color: #1e293b;
        cursor: pointer;
      }
    }

    .modal-footer {
      padding: 14px 24px;
      border-top: 1px solid #f1f5f9;
      background: #f8fafc;
      display: flex;
      justify-content: flex-end;
      gap: 10px;
    }
  `]
})
export class UsersComponent implements OnInit {
  private api = inject(ApiService);
  private auth = inject(AuthService);

  selectedTab = signal<'Todos' | 'Pendientes' | 'Activos' | 'Inactivos'>('Todos');
  searchQuery = '';
  showCreateModal = signal(false);

  // Form
  formDocumento = '';
  formNombre = '';
  formApellido = '';
  formCorreo = '';
  formTelefono = '';
  formPassword = '';
  formRol: any = 'Cajero / Operador';
  formEstado: 'Activo' | 'Inactivo' | 'Pendiente' = 'Activo';
  selectedResidences = new Set<string>(['RESIDENCIAL MENA ARRIBA']);

  availableResidences = [
    'RESIDENCIAL MENA ARRIBA',
    'NOVO RESIDENCES',
    'PLAZA MENA ARRIBA'
  ];

  users = signal<UserRecord[]>([]);

  ngOnInit() {
    this.refreshUsers();
  }

  countPendientes = computed(() => this.users().filter(u => u.estado === 'Pendiente').length);
  countActivos = computed(() => this.users().filter(u => u.estado === 'Activo').length);
  countInactivos = computed(() => this.users().filter(u => u.estado === 'Inactivo').length);

  filteredUsers = computed(() => {
    let list = this.users();
    const tab = this.selectedTab();
    if (tab === 'Pendientes') list = list.filter(u => u.estado === 'Pendiente');
    else if (tab === 'Activos') list = list.filter(u => u.estado === 'Activo');
    else if (tab === 'Inactivos') list = list.filter(u => u.estado === 'Inactivo');

    if (this.searchQuery.trim()) {
      const q = this.searchQuery.toLowerCase();
      list = list.filter(u =>
        u.usuarioLogin.toLowerCase().includes(q) ||
        u.nombreCompleto.toLowerCase().includes(q) ||
        u.correo.toLowerCase().includes(q) ||
        u.documento.includes(q)
      );
    }
    return list;
  });

  computedLogin = computed(() => {
    if (!this.formNombre && !this.formApellido) return 'AUTO (NOMBRE + APELLIDO)';
    const n = (this.formNombre || '').slice(0, 3).toUpperCase();
    const a = (this.formApellido || '').slice(0, 5).toUpperCase();
    return `${n}${a}`;
  });

  getInitials(name: string): string {
    const parts = name.split(' ').filter(Boolean);
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.slice(0, 2).toUpperCase();
  }

  getAvatarBg(name: string): string {
    const colors = ['#2563eb', '#7c3aed', '#db2777', '#059669', '#d97706', '#0284c7'];
    const idx = Math.abs(name.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)) % colors.length;
    return colors[idx];
  }

  openCreateModal(): void {
    this.formDocumento = '';
    this.formNombre = '';
    this.formApellido = '';
    this.formCorreo = '';
    this.formTelefono = '';
    this.formPassword = '';
    this.formRol = 'Cajero / Operador';
    this.formEstado = 'Activo';
    this.selectedResidences = new Set<string>(['RESIDENCIAL MENA ARRIBA']);
    this.showCreateModal.set(true);
  }

  closeCreateModal(): void {
    this.showCreateModal.set(false);
  }

  toggleResidence(res: string): void {
    if (this.selectedResidences.has(res)) {
      this.selectedResidences.delete(res);
    } else {
      this.selectedResidences.add(res);
    }
  }

  selectAllResidences(): void {
    this.availableResidences.forEach(r => this.selectedResidences.add(r));
  }

  clearAllResidences(): void {
    this.selectedResidences.clear();
  }

  saveUser(): void {
    if (!this.formNombre || !this.formApellido || !this.formCorreo || !this.formPassword) {
      alert('Por favor complete el nombre, apellido, correo y contraseña inicial.');
      return;
    }

    const dto = {
      email: this.formCorreo.trim(),
      password: this.formPassword,
      role: this.formRol === 'Administrador' ? 'TenantAdmin' : 'Accountant'
    };

    this.api.post<any>('users', dto).subscribe({
      next: (newId) => {
        this.refreshUsers(); // Recargar lista desde el backend
        this.closeCreateModal();
      },
      error: (err) => {
        console.error('Error al crear usuario', err);
        alert('Ocurrió un error al crear el usuario. Revise la consola.');
      }
    });
  }

  approveUser(u: UserRecord): void {
    this.users.update(list => list.map(item => item.id === u.id ? { ...item, estado: 'Activo' } : item));
  }

  toggleLock(u: UserRecord): void {
    const isCurrentlyActive = u.estado === 'Activo';
    this.api.patch(`users/${u.id}/status`, !isCurrentlyActive).subscribe({
      next: () => {
        this.refreshUsers();
      },
      error: (err) => {
        console.error('Error al cambiar estado', err);
        alert('No se pudo actualizar el estado.');
      }
    });
  }

  resetPassword(u: UserRecord): void {
    alert(`Se ha enviado un enlace de restablecimiento de contraseña a: ${u.correo}`);
  }

  editUser(u: UserRecord): void {
    alert(`Editar datos de: ${u.nombreCompleto}`);
  }

  deleteUser(u: UserRecord): void {
    if (confirm(`¿Está seguro de eliminar el usuario "${u.usuarioLogin}" (${u.nombreCompleto})?`)) {
      this.users.update(list => list.filter(item => item.id !== u.id));
    }
  }

  refreshUsers(): void {
    this.api.get<any[]>('users').subscribe({
      next: (data) => {
        const mapped: UserRecord[] = data.map(d => ({
          id: d.id,
          usuarioLogin: d.email.split('@')[0].toUpperCase(),
          documento: '—', // No disponible en UserDto base
          nombreCompleto: d.email, // Ajustar según los campos del backend (Ideal si hubiera Profile)
          correo: d.email,
          telefono: '—',
          rol: d.role === 'TenantAdmin' ? 'Administrador' : 'Cajero / Operador',
          residenciales: ['RESIDENCIAL MENA ARRIBA'],
          accesoTotal: d.role === 'TenantAdmin',
          estado: d.isActive ? 'Activo' : 'Inactivo'
        }));
        this.users.set(mapped);
      },
      error: (err) => {
        console.error('Error al cargar usuarios', err);
      }
    });
  }
}
