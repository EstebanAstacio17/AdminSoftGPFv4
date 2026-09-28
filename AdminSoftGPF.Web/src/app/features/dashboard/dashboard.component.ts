import { Component, signal, OnInit } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ApiService } from '../../core/services/api.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, DecimalPipe],
  template: `
    <div class="dashboard-page">

      <!-- ① Condominio Seleccionado — Hero Card (matches v3 blue header) -->
      <div class="condo-hero-card">
        <div class="hero-left">
          <div class="hero-tag">Condominio Seleccionado</div>
          <h1 class="hero-name">{{ property()?.name || 'Cargando Propiedad...' }}</h1>
          <div class="hero-meta">
            <span>{{ property()?.address || '—' }}</span>
          </div>
        </div>
        <div class="hero-actions">
          <button class="btn-hero-secondary" id="btn-dashboard-refresh">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
            Actualizar
          </button>
          <button class="btn-hero-primary" routerLink="/billing" id="btn-emit-invoices">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
            Emitir Cuotas
          </button>
          <button class="btn-hero-green" routerLink="/treasury" id="btn-new-payment">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>
            Nuevo Factura
          </button>
        </div>
      </div>

      <!-- ② KPIs Row -->
      <div class="kpis-row">
        <div class="kpi-card" id="kpi-recaudacion">
          <div class="kpi-label">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>
            RECAUDACIÓN (MES)
          </div>
          <div class="kpi-value positive">RD$ 0.00</div>
          <div class="kpi-sub">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
            Ingresos cobrados
          </div>
        </div>

        <div class="kpi-card" id="kpi-cartera">
          <div class="kpi-label">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
            CARTERA PENDIENTE
          </div>
          <div class="kpi-value danger">RD$ {{ carteraTotal() | number:'1.2-2' }}</div>
          <div class="kpi-sub">Total por cobrar</div>
        </div>

        <div class="kpi-card" id="kpi-egresos">
          <div class="kpi-label">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
            EGRESOS / GASTOS
          </div>
          <div class="kpi-value warning">RD$ {{ egresosTotal() | number:'1.2-2' }}</div>
          <div class="kpi-sub">Autorizaciones aprobadas</div>
        </div>

        <div class="kpi-card" id="kpi-ordenes">
          <div class="kpi-label">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
            TOTAL ÓRDENES
          </div>
          <div class="kpi-value neutral">{{ ticketsTotal() }}</div>
          <div class="kpi-sub">Tickets de soporte</div>
        </div>
      </div>

      <!-- ③ Two-column: Estado de Cartera + Balance Rápido -->
      <div class="sections-row">

        <!-- Estado de la Cartera -->
        <div class="section-card">
          <div class="section-title">Estado de la Cartera</div>
          <div class="section-sub">Distribución de condóminos al día vs en morosidad</div>
          <div class="cartera-bar-group">
            <div class="bar-label">
              <span>Al Día (7 unidades)</span>
              <span class="bar-pct al-dia">50%</span>
            </div>
            <div class="progress-bar">
              <div class="bar-fill fill-green" style="width: 50%"></div>
            </div>
            <div class="bar-label" style="margin-top:10px;">
              <span>Con Deuda (5 unidades)</span>
              <span class="bar-pct en-mora">50%</span>
            </div>
            <div class="progress-bar">
              <div class="bar-fill fill-red" style="width: 50%"></div>
            </div>
          </div>
          <a routerLink="/residents" class="link-all" id="link-ver-unidades">Ver todas las unidades →</a>
        </div>

        <!-- Balance Rápido por Vía de Pago -->
        <div class="section-card">
          <div class="section-header-row">
            <div>
              <div class="section-title">Balance Rápido por Vía de Pago</div>
              <div class="section-sub">Últimos 30 días de recaudación y desembolsos</div>
            </div>
            <a routerLink="/bank-reconciliation" class="link-all" id="link-ver-reporte">Ver reporte completo →</a>
          </div>

          <table class="balance-table">
            <thead>
              <tr>
                <th>VÍA DE PAGO</th>
                <th>INGRESOS</th>
                <th>EGRESOS</th>
                <th>BALANCE NETO</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Efectivo</td>
                <td>RD$ 1,375.00</td>
                <td class="zero">RD$ 0.00</td>
                <td class="positive-val">RD$ 1,375.00</td>
              </tr>
              <tr>
                <td>Transferencia</td>
                <td>RD$ 0.00</td>
                <td class="danger-val">RD$ -300.00</td>
                <td class="danger-val">RD$ -300.00</td>
              </tr>
              <tr>
                <td>Tarjeta de Crédito / Débito</td>
                <td>RD$ 2,475.00</td>
                <td class="zero">RD$ 0.00</td>
                <td class="positive-val">RD$ 2,475.00</td>
              </tr>
              <tr>
                <td>Cheque</td>
                <td class="zero">RD$ 0.00</td>
                <td class="zero">RD$ 0.00</td>
                <td class="zero">RD$ 0.00</td>
              </tr>
            </tbody>
          </table>
        </div>

      </div>

    </div>
  `,
  styles: [`
    .dashboard-page {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    /* ── Hero Card (Blue) ─────────────────────────────── */
    .condo-hero-card {
      background: linear-gradient(135deg, #1e3a8a 0%, #2563EB 60%, #1D4ED8 100%);
      border-radius: 14px;
      padding: 22px 24px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      color: #fff;
    }

    .hero-tag {
      font-size: 0.7rem;
      font-weight: 700;
      letter-spacing: 0.07em;
      color: rgba(255,255,255,0.65);
      margin-bottom: 4px;
      text-transform: uppercase;
    }

    .hero-name {
      font-size: 1.375rem;
      font-weight: 700;
      letter-spacing: -0.3px;
      margin-bottom: 4px;
    }

    .hero-meta {
      font-size: 0.78rem;
      color: rgba(255,255,255,0.7);
    }

    .hero-actions {
      display: flex;
      gap: 8px;
      flex-shrink: 0;
    }

    .btn-hero-secondary {
      display: flex;
      align-items: center;
      gap: 6px;
      background: rgba(255,255,255,0.15);
      border: 1px solid rgba(255,255,255,0.3);
      color: #fff;
      border-radius: 8px;
      padding: 8px 14px;
      font-size: 0.8125rem;
      font-weight: 500;
      cursor: pointer;
      font-family: inherit;
      transition: background 0.15s;
      &:hover { background: rgba(255,255,255,0.25); }
    }

    .btn-hero-primary {
      display: flex;
      align-items: center;
      gap: 6px;
      background: rgba(255,255,255,0.2);
      border: 1px solid rgba(255,255,255,0.4);
      color: #fff;
      border-radius: 8px;
      padding: 8px 14px;
      font-size: 0.8125rem;
      font-weight: 600;
      cursor: pointer;
      font-family: inherit;
      text-decoration: none;
      transition: background 0.15s;
      &:hover { background: rgba(255,255,255,0.3); }
    }

    .btn-hero-green {
      display: flex;
      align-items: center;
      gap: 6px;
      background: #16A34A;
      border: none;
      color: #fff;
      border-radius: 8px;
      padding: 8px 14px;
      font-size: 0.8125rem;
      font-weight: 600;
      cursor: pointer;
      font-family: inherit;
      text-decoration: none;
      transition: background 0.15s;
      &:hover { background: #15803D; }
    }

    /* ── KPI Row ──────────────────────────────────────── */
    .kpis-row {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 14px;

      @media (max-width: 1200px) {
        grid-template-columns: repeat(2, 1fr);
      }
      @media (max-width: 700px) {
        grid-template-columns: 1fr;
      }
    }

    .kpi-card {
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: 12px;
      padding: 18px 20px;
    }

    .kpi-label {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 0.65rem;
      font-weight: 700;
      color: var(--text-muted);
      letter-spacing: 0.07em;
      text-transform: uppercase;
      margin-bottom: 10px;
    }

    .kpi-value {
      font-size: 1.5rem;
      font-weight: 700;
      letter-spacing: -0.5px;
      font-variant-numeric: tabular-nums;
      margin-bottom: 6px;

      &.positive { color: var(--success-green); }
      &.danger { color: var(--danger-red); }
      &.warning { color: var(--warning-orange); }
      &.neutral { color: var(--text-primary); }
    }

    .kpi-sub {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 0.7rem;
      color: var(--text-muted);
    }

    /* ── Two-column Sections ──────────────────────────── */
    .sections-row {
      display: grid;
      grid-template-columns: 1fr 2fr;
      gap: 16px;

      @media (max-width: 1100px) {
        grid-template-columns: 1fr;
      }
    }

    .section-card {
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: 12px;
      padding: 20px;
    }

    .section-header-row {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 14px;
    }

    .section-title {
      font-size: 0.9375rem;
      font-weight: 600;
      color: var(--text-primary);
      margin-bottom: 2px;
    }

    .section-sub {
      font-size: 0.72rem;
      color: var(--text-muted);
      margin-bottom: 14px;
    }

    .link-all {
      font-size: 0.75rem;
      color: #2563EB;
      text-decoration: none;
      &:hover { text-decoration: underline; }
    }

    /* Cartera bars */
    .cartera-bar-group {
      margin-bottom: 12px;
    }

    .bar-label {
      display: flex;
      justify-content: space-between;
      font-size: 0.78rem;
      color: var(--text-secondary);
      margin-bottom: 5px;
    }

    .bar-pct {
      font-weight: 600;
      &.al-dia { color: var(--success-green); }
      &.en-mora { color: var(--danger-red); }
    }

    .progress-bar {
      height: 8px;
      background: var(--bg-app);
      border-radius: 99px;
      overflow: hidden;
    }

    .bar-fill {
      height: 100%;
      border-radius: 99px;
      transition: width 0.5s ease;

      &.fill-green { background: var(--success-green); }
      &.fill-red { background: var(--danger-red); }
    }

    /* Balance table */
    .balance-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.8125rem;
      margin-top: 8px;

      th {
        text-align: left;
        font-size: 0.65rem;
        font-weight: 700;
        color: var(--text-muted);
        text-transform: uppercase;
        letter-spacing: 0.06em;
        padding: 8px 10px;
        border-bottom: 1px solid var(--border-color);
      }

      td {
        padding: 10px 10px;
        border-bottom: 1px solid var(--border-color-subtle);
        color: var(--text-secondary);
        font-variant-numeric: tabular-nums;
      }

      tr:last-child td { border-bottom: none; }
    }

    .positive-val { color: var(--success-green); font-weight: 600; }
    .danger-val { color: var(--danger-red); font-weight: 600; }
    .zero { color: var(--text-muted); }
  `]
})
export class DashboardComponent implements OnInit {
  property = signal<any>(null);
  carteraTotal = signal(0);
  egresosTotal = signal(0);
  ticketsTotal = signal(0);

  constructor(public auth: AuthService, private api: ApiService) {}

  ngOnInit() {
    this.api.get<any[]>('properties', []).subscribe(props => {
      if (props && props.length > 0) {
        const prop = props[0];
        this.property.set(prop);
        this.loadMetrics(prop.id);
      }
    });
  }

  loadMetrics(propertyId: string) {
    this.api.get<any[]>('invoices/unpaid', []).subscribe(inv => {
      const sum = (inv || []).reduce((acc, i) => acc + (i.balanceDue || 0), 0);
      this.carteraTotal.set(sum);
    });
    
    this.api.get<any[]>(`expenses/property/${propertyId}`, []).subscribe(exp => {
      const sum = (exp || []).reduce((acc, e) => acc + (e.amount || 0), 0);
      this.egresosTotal.set(sum);
    });

    this.api.get<any[]>(`helpdesk/property/${propertyId}`, []).subscribe(tickets => {
      this.ticketsTotal.set((tickets || []).length);
    });
  }
}

