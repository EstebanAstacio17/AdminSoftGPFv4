import { Component, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';

interface UnitClient {
  id: string;
  unitCode: string;        // "A-F-1A"
  direccion: string;
  clientName: string;
  document: string;
  monthlyFee: number;
  balance: number;         // negative = debt, positive = credit, 0 = al dia
  status: 'Al día' | 'Pendiente' | 'En mora';
  propertyType: 'Apartamento / Condominio' | 'Casa Residencial / Villa' | 'Local Comercial' | 'Oficina Corporativa';
}

@Component({
  selector: 'app-residents',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="residents-page">

      <!-- Search + filter row -->
      <div class="controls-row">
        <div class="search-box">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input
            id="input-search-units"
            type="text"
            [(ngModel)]="searchQuery"
            placeholder="Buscar por nombre, documento o unidad..."
          />
        </div>

        <div class="filter-tabs">
          <button class="filter-tab" [class.active]="activeFilter() === 'all'" (click)="activeFilter.set('all')" id="filter-all">
            Todos <span class="count-badge">{{ units().length }}</span>
          </button>
          <button class="filter-tab" [class.active]="activeFilter() === 'al-dia'" (click)="activeFilter.set('al-dia')" id="filter-al-dia">
            Con Deuda <span class="count-badge debt-badge">{{ countDebt() }}</span>
          </button>
          <button class="filter-tab" [class.active]="activeFilter() === 'al-dia-only'" (click)="activeFilter.set('al-dia-only')" id="filter-al-dia-only">
            Al Día <span class="count-badge ok-badge">{{ countOk() }}</span>
          </button>
        </div>

        <button class="btn-new-client" id="btn-new-client" (click)="openModal()">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Nuevo Cliente
        </button>
      </div>

      <!-- Main table -->
      <div class="table-card">
        <table class="units-table">
          <thead>
            <tr>
              <th>
                <input type="checkbox" id="check-all" />
              </th>
              <th>UNIDAD / DIRECCIÓN</th>
              <th>CLIENTE</th>
              <th>DOCUMENTO</th>
              <th>CUOTA MENSUAL</th>
              <th>BALANCE DEUDA</th>
              <th>ESTADO</th>
              <th>ACCIONES</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let u of filteredUnits()" class="table-row" id="row-unit-{{u.id}}">
              <td>
                <input type="checkbox" id="check-{{u.id}}" />
              </td>
              <td>
                <div class="unit-cell">
                  <span class="unit-code">{{ u.unitCode }}</span>
                  <span class="unit-dir">{{ u.direccion }}</span>
                </div>
              </td>
              <td>
                <span class="client-name">{{ u.clientName }}</span>
              </td>
              <td>
                <span class="doc-cell">{{ u.document }}</span>
              </td>
              <td>
                <span class="fee-cell">RD$ {{ u.monthlyFee | number }}.00</span>
              </td>
              <td>
                <span class="balance-cell" [class.debt]="u.balance < 0" [class.ok]="u.balance >= 0">
                  {{ u.balance < 0 ? 'RD$ ' + (u.balance | number) + '.00' : 'RD$ 0.00' }}
                </span>
              </td>
              <td>
                <span class="status-badge" [ngClass]="getStatusClass(u.status)">{{ u.status }}</span>
              </td>
              <td>
                <div class="actions-cell">
                  <button class="action-btn" [id]="'btn-edit-' + u.id" title="Editar">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                  </button>
                  <button class="action-btn" [id]="'btn-view-' + u.id" title="Ver detalle">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  </button>
                </div>
              </td>
            </tr>
            <tr *ngIf="filteredUnits().length === 0">
              <td colspan="8" class="empty-state">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                No hay unidades que coincidan con tu búsqueda.
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Modal: Registrar Cliente -->
      <div class="modal-backdrop" *ngIf="modalOpen()" (click)="closeModal()">
        <div class="modal-card" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <span>Registrar Cliente</span>
            <button class="close-btn" (click)="closeModal()" id="btn-close-modal">✕</button>
          </div>
          <div class="modal-body">
            <div class="form-row">
              <div class="field-group">
                <label class="field-label">NOMBRE COMPLETO</label>
                <input type="text" [(ngModel)]="newName" id="new-name" placeholder="Ej. Juan Pérez" />
              </div>
              <div class="field-group">
                <label class="field-label">CÉDULA / DOCUMENTO</label>
                <input type="text" [(ngModel)]="newDoc" id="new-doc" placeholder="001-0000000-0" />
              </div>
            </div>

            <div class="form-row-3">
              <div class="field-group">
                <label class="field-label">CELULAR</label>
                <input type="tel" [(ngModel)]="newCelular" id="new-celular" placeholder="809-000-0000" />
              </div>
              <div class="field-group">
                <label class="field-label">TELÉFONO</label>
                <input type="tel" [(ngModel)]="newPhone" id="new-phone" placeholder="809-000-0000" />
              </div>
              <div class="field-group">
                <label class="field-label">CORREO</label>
                <input type="email" [(ngModel)]="newEmail" id="new-email" placeholder="correo@ejemplo.com" />
              </div>
            </div>

            <div class="field-group" style="margin-bottom: 12px;">
              <label class="field-label">TIPO DE PROPIEDAD / INMUEBLE</label>
              <div class="prop-types">
                <button
                  class="prop-type-btn"
                  [class.selected]="newPropertyType === t"
                  *ngFor="let t of propertyTypes"
                  (click)="newPropertyType = t"
                  [id]="'prop-type-' + t">
                  {{ t }}
                </button>
              </div>
            </div>

            <div class="form-row-4">
              <div class="field-group">
                <label class="field-label">MANZANA / SECTOR</label>
                <select [(ngModel)]="newManzana" id="new-manzana"><option value="">Seleccione...</option><option>A</option><option>B</option><option>C</option></select>
              </div>
              <div class="field-group">
                <label class="field-label">EDIFICIO / TORRE</label>
                <select [(ngModel)]="newEdificio" id="new-edificio"><option value="">Seleccione...</option><option>F</option><option>G</option></select>
              </div>
              <div class="field-group">
                <label class="field-label">APARTAMENTO / UNIDAD *</label>
                <select [(ngModel)]="newUnidad" id="new-unidad"><option value="">Seleccione...</option><option>1A</option><option>1B</option><option>2A</option></select>
              </div>
              <div class="field-group">
                <label class="field-label">CUOTA MENSUAL</label>
                <select [(ngModel)]="newCuota" id="new-cuota"><option value="">Seleccione...</option><option>500</option><option>650</option></select>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn-cancel" (click)="closeModal()" id="btn-cancel-modal">Cancelar</button>
            <button class="btn-save" (click)="saveClient()" id="btn-save-modal">Guardar Cliente</button>
          </div>
        </div>
      </div>

    </div>
  `,
  styles: [`
    .residents-page {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    /* ── Controls Row ───────────────────────────────── */
    .controls-row {
      display: flex;
      align-items: center;
      gap: 12px;
      flex-wrap: wrap;
    }

    .search-box {
      display: flex;
      align-items: center;
      gap: 8px;
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: 8px;
      padding: 8px 14px;
      flex: 1;
      min-width: 240px;

      svg { color: var(--text-muted); flex-shrink: 0; }

      input {
        background: transparent;
        border: none;
        outline: none;
        color: var(--text-primary);
        font-size: 0.8125rem;
        font-family: inherit;
        width: 100%;

        &::placeholder { color: var(--text-muted); }
      }
    }

    .filter-tabs {
      display: flex;
      gap: 6px;
    }

    .filter-tab {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 7px 14px;
      border-radius: 8px;
      border: 1px solid var(--border-color);
      background: var(--bg-card);
      color: var(--text-secondary);
      font-size: 0.8rem;
      font-weight: 500;
      cursor: pointer;
      font-family: inherit;
      transition: all 0.15s;

      &.active {
        border-color: #2563EB;
        color: #2563EB;
        background: rgba(37,99,235,0.08);
      }

      &:not(.active):hover {
        border-color: var(--text-secondary);
      }
    }

    .count-badge {
      font-size: 0.7rem;
      font-weight: 700;
      background: var(--bg-app);
      padding: 1px 6px;
      border-radius: 9999px;
    }

    .debt-badge {
      background: var(--danger-red-bg);
      color: var(--danger-red-text);
    }

    .ok-badge {
      background: var(--success-green-bg);
      color: var(--success-green-text);
    }

    .btn-new-client {
      display: flex;
      align-items: center;
      gap: 6px;
      background: #2563EB;
      color: #fff;
      border: none;
      border-radius: 8px;
      padding: 9px 16px;
      font-size: 0.8125rem;
      font-weight: 600;
      cursor: pointer;
      font-family: inherit;
      flex-shrink: 0;
      transition: background 0.15s;

      &:hover { background: #1D4ED8; }
    }

    /* ── Table ──────────────────────────────────────── */
    .table-card {
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: 12px;
      overflow: hidden;
    }

    .units-table {
      width: 100%;
      border-collapse: collapse;

      thead {
        background: var(--bg-app);

        th {
          padding: 10px 14px;
          font-size: 0.65rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          color: var(--text-muted);
          text-align: left;
          border-bottom: 1px solid var(--border-color);
        }
      }

      .table-row {
        border-bottom: 1px solid var(--border-color-subtle);
        transition: background 0.1s;

        &:last-child { border-bottom: none; }
        &:hover { background: var(--bg-card-hover); }

        td {
          padding: 12px 14px;
          vertical-align: middle;
        }
      }
    }

    .unit-cell {
      display: flex;
      flex-direction: column;
    }

    .unit-code {
      font-size: 0.8125rem;
      font-weight: 700;
      color: var(--text-primary);
    }

    .unit-dir {
      font-size: 0.7rem;
      color: var(--text-muted);
    }

    .client-name {
      font-size: 0.8125rem;
      font-weight: 500;
      color: var(--text-primary);
    }

    .doc-cell {
      font-size: 0.78rem;
      color: var(--text-secondary);
      font-family: 'Courier New', monospace;
    }

    .fee-cell {
      font-size: 0.8125rem;
      color: var(--text-secondary);
      font-variant-numeric: tabular-nums;
    }

    .balance-cell {
      font-size: 0.875rem;
      font-weight: 700;
      font-variant-numeric: tabular-nums;

      &.debt { color: var(--danger-red); }
      &.ok { color: var(--text-muted); }
    }

    .status-badge {
      display: inline-flex;
      align-items: center;
      padding: 3px 10px;
      border-radius: 9999px;
      font-size: 0.72rem;
      font-weight: 700;

      &.status-ok { background: var(--success-green-bg); color: var(--success-green-text); }
      &.status-pending { background: var(--warning-orange-bg); color: var(--warning-orange-text); }
      &.status-debt { background: var(--danger-red-bg); color: var(--danger-red-text); }
    }

    .actions-cell {
      display: flex;
      gap: 6px;
    }

    .action-btn {
      width: 28px;
      height: 28px;
      border-radius: 6px;
      border: 1px solid var(--border-color);
      background: transparent;
      color: var(--text-secondary);
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.1s;

      &:hover {
        background: var(--bg-app);
        border-color: #2563EB;
        color: #2563EB;
      }
    }

    .empty-state {
      text-align: center;
      color: var(--text-muted);
      font-size: 0.875rem;
      padding: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
    }

    /* ── Modal ──────────────────────────────────────── */
    .modal-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 500;
      padding: 16px;
    }

    .modal-card {
      background: var(--bg-card);
      border-radius: 16px;
      width: 580px;
      max-width: 100%;
      max-height: 90vh;
      overflow-y: auto;
      box-shadow: var(--modal-shadow);
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 18px 22px;
      border-bottom: 1px solid var(--border-color);
      font-size: 1rem;
      font-weight: 700;
      color: var(--text-primary);
    }

    .close-btn {
      background: transparent;
      border: none;
      color: var(--text-muted);
      cursor: pointer;
      font-size: 1rem;
      &:hover { color: var(--text-primary); }
    }

    .modal-body {
      padding: 20px 22px;
    }

    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
      margin-bottom: 12px;
    }

    .form-row-3 {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 12px;
      margin-bottom: 12px;
    }

    .form-row-4 {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr 1fr;
      gap: 10px;
    }

    .field-group {
      display: flex;
      flex-direction: column;
      gap: 5px;
    }

    .field-label {
      font-size: 0.65rem;
      font-weight: 700;
      color: var(--text-muted);
      letter-spacing: 0.06em;
      text-transform: uppercase;
    }

    input, select {
      background: var(--bg-app);
      border: 1px solid var(--border-color);
      border-radius: 8px;
      padding: 9px 12px;
      color: var(--text-primary);
      font-size: 0.8125rem;
      font-family: inherit;
      outline: none;
      transition: border-color 0.15s;
      width: 100%;

      &:focus { border-color: #2563EB; }
      &::placeholder { color: var(--text-muted); }
    }

    .prop-types {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
    }

    .prop-type-btn {
      padding: 6px 12px;
      border-radius: 9999px;
      border: 1.5px solid var(--border-color);
      background: transparent;
      color: var(--text-secondary);
      font-size: 0.75rem;
      cursor: pointer;
      font-family: inherit;
      transition: all 0.15s;

      &.selected {
        background: #2563EB;
        border-color: #2563EB;
        color: #fff;
      }

      &:not(.selected):hover { border-color: #2563EB; color: #2563EB; }
    }

    .modal-footer {
      display: flex;
      justify-content: flex-end;
      gap: 10px;
      padding: 14px 22px;
      border-top: 1px solid var(--border-color);
    }

    .btn-cancel {
      padding: 9px 18px;
      border-radius: 8px;
      border: 1px solid var(--border-color);
      background: transparent;
      color: var(--text-secondary);
      font-size: 0.875rem;
      font-weight: 500;
      cursor: pointer;
      font-family: inherit;
    }

    .btn-save {
      padding: 9px 20px;
      border-radius: 8px;
      border: none;
      background: #2563EB;
      color: #fff;
      font-size: 0.875rem;
      font-weight: 600;
      cursor: pointer;
      font-family: inherit;
      &:hover { background: #1D4ED8; }
    }
  `]
})
export class ResidentsComponent implements OnInit {
  searchQuery = '';
  activeFilter = signal<'all' | 'al-dia' | 'al-dia-only'>('all');
  modalOpen = signal(false);

  newName = '';
  newDoc = '';
  newCelular = '';
  newPhone = '';
  newEmail = '';
  newPropertyType = 'Apartamento / Condominio';
  newManzana = '';
  newEdificio = '';
  newUnidad = '';
  newCuota = '';

  propertyTypes = ['Apartamento / Condominio', 'Casa Residencial / Villa', 'Local Comercial', 'Oficina Corporativa', 'Terreno / Lote', 'Nave Industrial / Almacen'];

  units = signal<UnitClient[]>([
    { id: '1', unitCode: 'A-F-1A', direccion: 'Bloque A - Piso F', clientName: 'Alfredo Lucas', document: 'CNT 24424-6', monthlyFee: 500, balance: 0, status: 'Al día', propertyType: 'Apartamento / Condominio' },
    { id: '2', unitCode: 'A-F-1B', direccion: 'Bloque A - Piso F', clientName: 'Talanquera Perez', document: '002-134997', monthlyFee: 500, balance: -1000, status: 'Pendiente', propertyType: 'Apartamento / Condominio' },
    { id: '3', unitCode: 'B-2A', direccion: 'Bloque B - Piso 2', clientName: 'Carlos Mendoza', document: '001-234567-8', monthlyFee: 650, balance: 0, status: 'Al día', propertyType: 'Apartamento / Condominio' },
    { id: '4', unitCode: 'B-2B', direccion: 'Bloque B - Piso 2', clientName: 'Roberto Santana', document: '001-345678-9', monthlyFee: 650, balance: -650, status: 'En mora', propertyType: 'Apartamento / Condominio' },
    { id: '5', unitCode: 'C-1A', direccion: 'Bloque C - Piso 1', clientName: 'Maria González', document: '001-456789-0', monthlyFee: 500, balance: 200, status: 'Al día', propertyType: 'Apartamento / Condominio' },
  ]);

  constructor(private api: ApiService, private auth: AuthService) {}

  ngOnInit(): void {
    this.loadPersonsFromApi();
  }

  loadPersonsFromApi(): void {
    this.api.get<any[]>('persons', []).subscribe(persons => {
      this.api.get<any[]>('invoices/unpaid', []).subscribe(invoices => {
        const safePersons = persons || [];
        const safeInvoices = invoices || [];
        
        if (safePersons.length > 0) {
          const mapped: UnitClient[] = safePersons.map((p, idx) => {
            const pInvoices = safeInvoices.filter(i => i.personId === p.id);
            const totalDebt = pInvoices.reduce((sum, inv) => sum + (inv.balanceDue || 0), 0);
            
            return {
              id: p.id,
              unitCode: p.primaryUnitId ? `U-${p.primaryUnitId.substring(0,4)}` : `U-${100 + idx}`,
              direccion: 'Residencial Principal',
              clientName: `${p.firstName} ${p.lastName}`,
              document: p.taxId || 'RNC-0000',
              monthlyFee: 500,
              balance: -totalDebt,
              status: totalDebt > 0 ? 'En mora' : 'Al día',
              propertyType: 'Apartamento / Condominio'
            };
          });
          this.units.set(mapped);
        }
      });
    });
  }

  countDebt = computed(() => this.units().filter(u => u.balance < 0).length);
  countOk = computed(() => this.units().filter(u => u.balance >= 0).length);

  filteredUnits = computed(() => {
    let list = this.units();
    const q = this.searchQuery.toLowerCase();
    if (q) {
      list = list.filter(u =>
        u.unitCode.toLowerCase().includes(q) ||
        u.clientName.toLowerCase().includes(q) ||
        u.document.toLowerCase().includes(q)
      );
    }
    if (this.activeFilter() === 'al-dia') {
      list = list.filter(u => u.balance < 0);
    } else if (this.activeFilter() === 'al-dia-only') {
      list = list.filter(u => u.balance >= 0);
    }
    return list;
  });

  getStatusClass(status: string): string {
    switch (status) {
      case 'Al día': return 'status-ok';
      case 'Pendiente': return 'status-pending';
      case 'En mora': return 'status-debt';
      default: return '';
    }
  }

  openModal(): void { this.modalOpen.set(true); }
  closeModal(): void { this.modalOpen.set(false); }

  saveClient(): void {
    if (!this.newName) return;
    const parts = this.newName.trim().split(' ');
    const firstName = parts[0] || 'Cliente';
    const lastName = parts.slice(1).join(' ') || 'Nuevo';

    const payload = {
      firstName: firstName,
      lastName: lastName,
      email: this.newEmail || `${firstName.toLowerCase()}@cliente.com`,
      taxId: this.newDoc || '001-0000000-1'
    };

    this.api.post<any>('persons', payload).subscribe({
      next: (res) => {
        const newClient: UnitClient = {
          id: res?.id || ('c-' + Date.now()),
          unitCode: this.newUnidad || 'A-101',
          direccion: `${this.newEdificio || 'Edificio A'} - ${this.newManzana || 'Mz 1'}`,
          clientName: this.newName,
          document: this.newDoc || 'RNC-000',
          monthlyFee: parseFloat(this.newCuota) || 500,
          balance: 0,
          status: 'Al día',
          propertyType: this.newPropertyType as any
        };
        this.units.update(list => [newClient, ...list]);
        this.closeModal();
      }
    });
  }

  anonymizeClient(client: UnitClient): void {
    this.api.post<void>(`persons/${client.id}/anonymize`, {}).subscribe({
      next: () => {
        this.units.update(list => list.map(u => u.id === client.id ? { ...u, clientName: 'Usuario Anonimizado', document: 'N/A' } : u));
      }
    });
  }
}
