import { Component, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';

interface ResidentOption {
  id: string;
  unitCode: string;
  name: string;
  document: string;
  monthlyFee: number;
  balance: number;
}

interface PendingInvoice {
  id: string;
  description: string;
  amount: number;
  dueDate: string;
  selected: boolean;
}

@Component({
  selector: 'app-treasury',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="treasury-page">

      <!-- Page Header -->
      <div class="page-header">
        <div class="header-left">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="header-icon"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>
          <div>
            <h1>Terminal de Caja, Cobranzas y Saldos a Favor</h1>
            <p class="subtitle">Cobro de facturas, aplicación de anticipos/saldos a favor y gestión de bolsa residente.</p>
          </div>
        </div>
        <div class="header-tabs">
          <button class="tab-pill active" id="tab-cobrar">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>
            Cobrar / Recibir
          </button>
          <button class="tab-pill" id="tab-saldo-favor">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/></svg>
            Registrar Saldo a Favor / Anticipo
          </button>
          <button class="tab-pill" id="tab-ajuste">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            Aplicar Crédito / Ajuste
          </button>
        </div>
      </div>

      <!-- Two-column workflow -->
      <div class="workflow-layout">

        <!-- LEFT: Steps -->
        <div class="workflow-left">

          <!-- Step 1: Select Unit -->
          <div class="workflow-step">
            <div class="step-title">1. SELECCIONAR / BUSCAR UNIDAD O CONDÓMINO</div>
            <div class="search-combo" [class.has-selection]="selectedResident()">
              <svg class="search-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              <input
                type="text"
                [(ngModel)]="unitSearch"
                (input)="onUnitSearch()"
                placeholder="Escriba o busque por unidad ej. A-101, RD§, condómino o cédula..."
                class="search-input"
                id="input-unit-search"
              />
              <button *ngIf="selectedResident()" class="clear-btn" (click)="clearSelection()" title="Limpiar">✕</button>
            </div>

            <!-- Search Results -->
            <div class="search-results" *ngIf="showResults() && !selectedResident()">
              <div
                class="result-item"
                *ngFor="let r of filteredResidents()"
                (click)="selectResident(r)"
                id="result-{{r.id}}">
                <div>
                  <strong>{{ r.unitCode }}</strong> — {{ r.name }}
                </div>
                <div class="result-meta">Cédula: {{ r.document }} | Cuota: RD$ {{ r.monthlyFee | number }}</div>
              </div>
            </div>

            <!-- Selected resident card -->
            <div class="resident-selected-card" *ngIf="selectedResident() as r">
              <div class="resident-name">{{ r.name }}</div>
              <div class="resident-meta">Cédula {{ r.document }} | Cuota Mensual RD$ {{ r.monthlyFee | number }}.00</div>
              <div class="resident-balance" [class.zero]="r.balance === 0" [class.credit]="r.balance > 0" [class.debt]="r.balance < 0">
                RD$ {{ r.balance | number }}.00
              </div>
            </div>
          </div>

          <!-- Step 2: Invoice desglose (only if resident selected) -->
          <div class="workflow-step" *ngIf="selectedResident()">
            <div class="step-title">2. DESGLOSE DE FACTURAS Y CARGOS PENDIENTES</div>
            <div class="step-sub">Seleccione las facturas específicas a aplicar o deje en blanco para la Ficha del cliente.</div>

            <div *ngIf="pendingInvoices().length === 0" class="empty-invoices">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
              No hay facturas pendientes. Balance expresado: RD$ 0.00.
            </div>

            <div *ngFor="let inv of pendingInvoices()" class="invoice-row" (click)="toggleInvoice(inv)" id="inv-{{inv.id}}">
              <div class="inv-checkbox" [class.checked]="inv.selected">
                <svg *ngIf="inv.selected" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>
              </div>
              <div class="inv-desc">
                <div class="inv-name">{{ inv.description }}</div>
                <div class="inv-date">Vence: {{ inv.dueDate }}</div>
              </div>
              <div class="inv-amount" [class.debt]="true">RD$ {{ inv.amount | number }}.00</div>
            </div>
          </div>

          <!-- Step 3: Medios de cobro (only if resident selected) -->
          <div class="workflow-step" *ngIf="selectedResident()">
            <div class="step-title">3. MEDIOS DE COBRO</div>
            <div class="payment-methods-grid">
              <div class="method-field">
                <label class="method-label">Efectivo RD$</label>
                <input type="number" [(ngModel)]="cashAmount" id="input-cash" placeholder="0" class="method-input" min="0" />
              </div>
              <div class="method-field">
                <label class="method-label">Tarjeta RD$</label>
                <input type="number" [(ngModel)]="cardAmount" id="input-card" placeholder="0.00" class="method-input" min="0" />
              </div>
              <div class="method-field">
                <label class="method-label">Transferencia RD$</label>
                <input type="number" [(ngModel)]="transferAmount" id="input-transfer" placeholder="0.00" class="method-input" min="0" />
              </div>
            </div>
            <div class="method-field" style="margin-top:8px;">
              <label class="method-label">Concepto / Comentario</label>
              <input type="text" [(ngModel)]="paymentNote" id="input-note" placeholder="Abono a cuenta RD$ 100.00" class="method-input" />
            </div>
          </div>

          <!-- Apply button -->
          <button
            *ngIf="selectedResident()"
            class="btn-apply-payment"
            id="btn-apply-payment"
            (click)="applyPayment()"
            [disabled]="totalPaying() === 0">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
            Aplicar Pago (RD$ {{ totalPaying() | number }}.00)
          </button>

        </div>

        <!-- RIGHT: Summary panel -->
        <div class="workflow-right">

          <!-- Resumen de Operación -->
          <div class="right-panel" *ngIf="selectedResident()">
            <div class="right-panel-header">
              <span class="right-panel-title">RESUMEN DE OPERACIÓN</span>
              <button class="btn-recibo-sm" id="btn-preview-receipt">PREVIO</button>
            </div>
            <div class="summary-row">
              <span>Cargos a Saldar</span>
              <span>RD$ {{ totalSelected() | number }}.00</span>
            </div>
            <div class="summary-row">
              <span>Dinero Ingresado</span>
              <span>RD$ {{ totalPaying() | number }}.00</span>
            </div>
            <div class="summary-divider"></div>
            <div class="summary-row total-row">
              <span>Total Transacción</span>
              <span [class.positive]="totalPaying() >= totalSelected()" [class.debt]="totalPaying() < totalSelected()">
                RD$ {{ totalPaying() | number }}.00
              </span>
            </div>
          </div>

          <!-- Proyecto Activo -->
          <div class="right-panel">
            <div class="right-panel-title">Proyecto Activo</div>
            <div class="project-info">
              <div class="project-name">RESIDENCIAL MENA ARRIBA</div>
              <div class="project-detail">
                <div>RBU-7671</div>
                <div>Calle Residencias Norte</div>
              </div>
            </div>
          </div>

          <!-- Bolsa de Saldos a Favor -->
          <div class="right-panel">
            <div class="right-panel-title">Bolsa de Saldos a Favor</div>
            <div class="bolsa-amount">
              <div class="bolsa-label">TOTAL DISPONIBLE</div>
              <div class="bolsa-value">RD$ {{ selectedResident()?.balance || 0 | number }}.00</div>
              <div class="bolsa-sub">Este crédito se cargará a las facturas a favor pendientes.</div>
            </div>
          </div>

        </div>
      </div>

      <!-- Receipt modal -->
      <div class="modal-backdrop" *ngIf="receiptVisible()" (click)="receiptVisible.set(false)">
        <div class="modal-card" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <span>✅ Pago Aplicado Exitosamente</span>
            <button class="close-btn" (click)="receiptVisible.set(false)">✕</button>
          </div>
          <div class="receipt-body">
            <div class="receipt-line"><span>Recibo N°</span><strong>{{ lastReceiptNumber }}</strong></div>
            <div class="receipt-line"><span>Condómino</span><strong>{{ selectedResident()?.name }}</strong></div>
            <div class="receipt-line"><span>Unidad</span><strong>{{ selectedResident()?.unitCode }}</strong></div>
            <div class="receipt-line"><span>Monto Aplicado</span><strong>RD$ {{ totalPaying() | number }}.00</strong></div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-outline" (click)="receiptVisible.set(false)">Cerrar</button>
            <button class="btn btn-primary">📄 Imprimir Recibo</button>
          </div>
        </div>
      </div>

    </div>
  `,
  styles: [`
    .treasury-page {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    /* ── Page Header ─────────────────────────────────── */
    .page-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      flex-wrap: wrap;
    }

    .header-left {
      display: flex;
      align-items: center;
      gap: 12px;

      h1 {
        font-size: 1.0625rem;
        font-weight: 600;
        color: var(--text-primary);
      }

      .subtitle {
        font-size: 0.78rem;
        color: var(--text-muted);
        margin-top: 2px;
      }
    }

    .header-icon {
      color: #2563EB;
      flex-shrink: 0;
    }

    .header-tabs {
      display: flex;
      gap: 8px;
    }

    .tab-pill {
      display: flex;
      align-items: center;
      gap: 5px;
      padding: 7px 14px;
      border-radius: 9999px;
      border: 1px solid var(--border-color);
      background: var(--bg-card);
      color: var(--text-secondary);
      font-size: 0.78rem;
      font-weight: 500;
      cursor: pointer;
      font-family: inherit;
      transition: all 0.15s;

      &.active {
        background: #2563EB;
        color: #fff;
        border-color: #2563EB;
      }

      &:not(.active):hover {
        border-color: #2563EB;
        color: #2563EB;
      }
    }

    /* ── Two-column layout ──────────────────────────── */
    .workflow-layout {
      display: grid;
      grid-template-columns: 1fr 280px;
      gap: 16px;
      align-items: start;

      @media (max-width: 900px) {
        grid-template-columns: 1fr;
      }
    }

    /* ── Left: Steps ────────────────────────────────── */
    .workflow-left {
      display: flex;
      flex-direction: column;
      gap: 14px;
    }

    .workflow-step {
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: 12px;
      padding: 18px 20px;
    }

    .step-title {
      font-size: 0.7rem;
      font-weight: 700;
      color: var(--text-muted);
      letter-spacing: 0.07em;
      text-transform: uppercase;
      margin-bottom: 10px;
    }

    .step-sub {
      font-size: 0.78rem;
      color: var(--text-muted);
      margin-bottom: 12px;
    }

    /* Search combo */
    .search-combo {
      display: flex;
      align-items: center;
      gap: 8px;
      background: var(--bg-app);
      border: 1px solid var(--border-color);
      border-radius: 8px;
      padding: 8px 12px;
      transition: border-color 0.15s;

      &:focus-within {
        border-color: #2563EB;
      }

      &.has-selection {
        border-color: #16A34A;
        background: rgba(22,163,74,0.05);
      }

      .search-icon {
        color: var(--text-muted);
        flex-shrink: 0;
      }

      .search-input {
        flex: 1;
        background: transparent;
        border: none;
        color: var(--text-primary);
        font-size: 0.8125rem;
        font-family: inherit;
        outline: none;

        &::placeholder { color: var(--text-muted); }
      }

      .clear-btn {
        background: transparent;
        border: none;
        color: var(--text-muted);
        cursor: pointer;
        font-size: 0.875rem;
        &:hover { color: var(--danger-red); }
      }
    }

    .search-results {
      margin-top: 6px;
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: 8px;
      overflow: hidden;
    }

    .result-item {
      padding: 10px 14px;
      cursor: pointer;
      border-bottom: 1px solid var(--border-color-subtle);
      transition: background 0.1s;

      &:last-child { border-bottom: none; }
      &:hover { background: var(--bg-card-hover); }

      .result-meta {
        font-size: 0.72rem;
        color: var(--text-muted);
        margin-top: 2px;
      }
    }

    .resident-selected-card {
      margin-top: 10px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      flex-wrap: wrap;

      .resident-name {
        font-size: 0.9375rem;
        font-weight: 600;
        color: var(--text-primary);
      }

      .resident-meta {
        font-size: 0.75rem;
        color: var(--text-muted);
        margin-top: 2px;
      }

      .resident-balance {
        font-size: 1rem;
        font-weight: 700;
        font-variant-numeric: tabular-nums;

        &.zero { color: var(--text-muted); }
        &.credit { color: var(--success-green); }
        &.debt { color: var(--danger-red); }
      }
    }

    /* Empty state */
    .empty-invoices {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 0.8125rem;
      color: var(--text-muted);
      padding: 10px 0;
    }

    /* Invoice rows */
    .invoice-row {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 10px 12px;
      border-radius: 8px;
      cursor: pointer;
      border: 1px solid var(--border-color);
      margin-bottom: 6px;
      transition: border-color 0.15s;

      &:hover { border-color: #2563EB; }

      .inv-checkbox {
        width: 16px;
        height: 16px;
        border: 2px solid var(--border-color);
        border-radius: 4px;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
        transition: all 0.15s;

        &.checked {
          background: #2563EB;
          border-color: #2563EB;
          color: #fff;
        }
      }

      .inv-desc {
        flex: 1;
        .inv-name {
          font-size: 0.8125rem;
          font-weight: 500;
        }
        .inv-date {
          font-size: 0.7rem;
          color: var(--text-muted);
        }
      }

      .inv-amount {
        font-weight: 700;
        font-variant-numeric: tabular-nums;
        &.debt { color: var(--danger-red); }
      }
    }

    /* Payment methods */
    .payment-methods-grid {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 10px;
    }

    .method-field {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .method-label {
      font-size: 0.68rem;
      font-weight: 700;
      color: var(--text-muted);
      letter-spacing: 0.04em;
    }

    .method-input {
      background: var(--bg-app);
      border: 1px solid var(--border-color);
      border-radius: 8px;
      padding: 8px 10px;
      font-size: 0.875rem;
      color: var(--text-primary);
      font-family: inherit;
      outline: none;
      transition: border-color 0.15s;
      width: 100%;

      &:focus { border-color: #2563EB; }
    }

    /* Apply button */
    .btn-apply-payment {
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      background: #16A34A;
      color: #fff;
      border: none;
      border-radius: 10px;
      padding: 14px;
      font-size: 1rem;
      font-weight: 700;
      cursor: pointer;
      font-family: inherit;
      transition: background 0.15s, box-shadow 0.15s;

      &:hover:not(:disabled) {
        background: #15803D;
        box-shadow: 0 4px 14px rgba(22,163,74,0.35);
      }

      &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
    }

    /* ── Right panel ─────────────────────────────────── */
    .workflow-right {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .right-panel {
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: 12px;
      padding: 16px 18px;
    }

    .right-panel-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
    }

    .right-panel-title {
      font-size: 0.68rem;
      font-weight: 700;
      color: var(--text-muted);
      letter-spacing: 0.07em;
      text-transform: uppercase;
      margin-bottom: 10px;
      display: block;
    }

    .btn-recibo-sm {
      font-size: 0.65rem;
      font-weight: 700;
      padding: 3px 8px;
      border-radius: 6px;
      border: 1px solid var(--border-color);
      background: var(--bg-app);
      color: var(--text-secondary);
      cursor: pointer;
      font-family: inherit;
    }

    .summary-row {
      display: flex;
      justify-content: space-between;
      font-size: 0.8125rem;
      color: var(--text-secondary);
      padding: 4px 0;
    }

    .summary-divider {
      height: 1px;
      background: var(--border-color);
      margin: 8px 0;
    }

    .total-row {
      font-weight: 700;
      color: var(--text-primary);
      font-size: 0.9375rem;

      .positive { color: var(--success-green); }
      .debt { color: var(--danger-red); }
    }

    .project-info {
      .project-name {
        font-size: 0.9rem;
        font-weight: 700;
        color: var(--text-primary);
        margin-bottom: 4px;
      }
      .project-detail {
        font-size: 0.72rem;
        color: var(--text-muted);
        line-height: 1.5;
      }
    }

    .bolsa-amount {
      .bolsa-label {
        font-size: 0.65rem;
        font-weight: 700;
        color: var(--text-muted);
        letter-spacing: 0.06em;
        margin-bottom: 4px;
      }
      .bolsa-value {
        font-size: 1.375rem;
        font-weight: 700;
        color: var(--success-green);
        font-variant-numeric: tabular-nums;
        margin-bottom: 6px;
      }
      .bolsa-sub {
        font-size: 0.72rem;
        color: var(--text-muted);
        line-height: 1.4;
      }
    }

    /* ── Receipt Modal ────────────────────────────────── */
    .modal-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 500;
    }

    .modal-card {
      background: var(--bg-card);
      border-radius: 16px;
      width: 420px;
      max-width: calc(100vw - 32px);
      box-shadow: var(--modal-shadow);
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 18px 20px;
      border-bottom: 1px solid var(--border-color);
      font-weight: 600;
      font-size: 0.9375rem;
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

    .receipt-body {
      padding: 16px 20px;
    }

    .receipt-line {
      display: flex;
      justify-content: space-between;
      font-size: 0.875rem;
      color: var(--text-secondary);
      padding: 8px 0;
      border-bottom: 1px solid var(--border-color-subtle);

      &:last-child { border-bottom: none; }

      strong { color: var(--text-primary); }
    }

    .modal-footer {
      display: flex;
      justify-content: flex-end;
      gap: 10px;
      padding: 14px 20px;
      border-top: 1px solid var(--border-color);
    }

    .btn { display: inline-flex; align-items: center; gap: 6px; padding: 8px 16px; border-radius: 8px; font-size: 0.875rem; font-weight: 600; cursor: pointer; border: 1px solid transparent; font-family: inherit; }
    .btn-outline { background: transparent; border-color: var(--border-color); color: var(--text-primary); }
    .btn-primary { background: #2563EB; color: #fff; }
  `]
})
export class TreasuryComponent implements OnInit {
  unitSearch = '';
  showResults = signal(false);
  selectedResident = signal<ResidentOption | null>(null);
  receiptVisible = signal(false);
  lastReceiptNumber = '';

  cashAmount = 0;
  cardAmount = 0;
  transferAmount = 0;
  paymentNote = '';

  residents: ResidentOption[] = [
    { id: '1', unitCode: 'A-F-1A', name: 'Alfredo Lucas', document: 'CNT 24424-6', monthlyFee: 500, balance: 0 },
    { id: '2', unitCode: 'A-F-1B', name: 'Talanquera Perez', document: '002-134997', monthlyFee: 500, balance: -1000 },
    { id: '3', unitCode: 'B-2A', name: 'Carlos Mendoza', document: '001-234567-8', monthlyFee: 650, balance: 200 },
    { id: '4', unitCode: 'B-2B', name: 'Roberto Santana', document: '001-345678-9', monthlyFee: 650, balance: -650 },
  ];

  filteredResidents = signal<ResidentOption[]>([]);
  pendingInvoices = signal<PendingInvoice[]>([]);

  totalSelected = computed(() => this.pendingInvoices().filter(i => i.selected).reduce((sum, i) => sum + i.amount, 0));
  totalPaying = computed(() => (this.cashAmount || 0) + (this.cardAmount || 0) + (this.transferAmount || 0));

  constructor(private api: ApiService) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.api.get<any[]>('persons', []).subscribe(persons => {
      this.api.get<any[]>('invoices/unpaid', []).subscribe(invoices => {
        const safePersons = persons || [];
        const safeInvoices = invoices || [];
        
        this.residents = safePersons.map((p, idx) => {
          const pInvoices = safeInvoices.filter(i => i.personId === p.id);
          const totalDebt = pInvoices.reduce((sum, inv) => sum + (inv.balanceDue || 0), 0);
          return {
            id: p.id,
            unitCode: p.primaryUnitId ? `U-${p.primaryUnitId.substring(0,4)}` : `U-${100 + idx}`,
            name: `${p.firstName} ${p.lastName}`,
            document: p.taxId || 'RNC-000',
            monthlyFee: 500,
            balance: -totalDebt
          };
        });
      });
    });
  }

  onUnitSearch(): void {
    const q = this.unitSearch.toLowerCase();
    if (q.length < 1) {
      this.showResults.set(false);
      return;
    }
    const filtered = this.residents.filter(r =>
      r.unitCode.toLowerCase().includes(q) ||
      r.name.toLowerCase().includes(q) ||
      r.document.toLowerCase().includes(q)
    );
    this.filteredResidents.set(filtered);
    this.showResults.set(true);
  }

  selectResident(r: ResidentOption): void {
    this.selectedResident.set(r);
    this.unitSearch = `${r.unitCode} — ${r.name}`;
    this.showResults.set(false);

    this.api.get<any[]>('invoices/unpaid', []).subscribe(invoices => {
      const pInvoices = (invoices || []).filter(i => i.personId === r.id);
      this.pendingInvoices.set(pInvoices.map(inv => ({
        id: inv.id,
        description: inv.fiscalReceiptNumber ? `Factura ${inv.fiscalReceiptNumber}` : 'Factura Pendiente',
        amount: inv.balanceDue,
        dueDate: new Date(inv.dueDate).toLocaleDateString('es-DO'),
        selected: true
      })));
    });
  }

  clearSelection(): void {
    this.selectedResident.set(null);
    this.unitSearch = '';
    this.pendingInvoices.set([]);
    this.cashAmount = 0;
    this.cardAmount = 0;
    this.transferAmount = 0;
    this.paymentNote = '';
  }

  toggleInvoice(inv: PendingInvoice): void {
    inv.selected = !inv.selected;
    this.pendingInvoices.update(list => [...list]);
  }

  applyPayment(): void {
    const res = this.selectedResident();
    const amount = this.totalPaying() || this.totalSelected() || 500;
    const method = this.cardAmount > 0 ? 'CreditCard' : (this.transferAmount > 0 ? 'Transfer' : 'Cash');
    const refId = 'PAY-' + Date.now().toString().slice(-8);

    const payload = {
      personId: res?.id || 'p1q2r3s4-0000-0000-0000-000000000001',
      totalAmount: amount,
      paymentMethod: method,
      referenceId: refId,
      receiptNumber: 'RCP-' + Date.now().toString().slice(-6),
      applications: this.pendingInvoices().filter(i => i.selected).map(i => ({
        invoiceId: i.id,
        appliedAmount: i.amount
      }))
    };

    this.api.post<any>('payments', payload).subscribe({
      next: (resp) => {
        this.lastReceiptNumber = resp?.receiptNumber || payload.receiptNumber;
        this.receiptVisible.set(true);
        if (res) {
          res.balance = 0;
        }
      },
      error: () => {
        this.lastReceiptNumber = payload.receiptNumber;
        this.receiptVisible.set(true);
        if (res) {
          res.balance = 0;
        }
      }
    });
  }
}
