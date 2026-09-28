import { Component, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';

interface ExpenseItem {
  id: number;
  egresoNumber: string;
  fecha: string;
  beneficiario: string;
  beneficiarioRnc?: string;
  ncf: string;
  categoria: string;
  subcategoria?: string;
  viaPago: string;
  cuentaBancaria?: string;
  referencia: string;
  monto: number;
  estado: 'Pagado' | 'Pendiente' | 'Anulado';
  registradoPor: string;
  concepto: string;
}

@Component({
  selector: 'app-expenses',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="expenses-container">
      <!-- Encabezado de Página -->
      <div class="page-top-bar">
        <div class="header-titles">
          <div class="title-row">
            <span class="currency-icon">$</span>
            <h1 class="page-title">Egresos y Autorizaciones de Pago</h1>
          </div>
          <p class="page-subtitle">Control de gastos, órdenes de desembolso, auditoría de cheques/transferencias y anulación normativa</p>
        </div>
        <div class="top-actions">
          <button class="btn-refresh" (click)="refreshData()" title="Refrescar datos">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M23 4v6h-6"/><path d="M1 20v-6h6"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>
          </button>
          <button class="btn btn-primary" (click)="openModal()" id="btn-nuevo-egreso">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
            Nueva Autorización de Pago
          </button>
        </div>
      </div>

      <!-- 4 KPI Cards -->
      <div class="kpi-grid">
        <!-- 1: Pagados -->
        <div class="kpi-card card-green">
          <div class="kpi-icon-circle green">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>
          </div>
          <div class="kpi-info">
            <span class="kpi-label">EGRESOS PAGADOS</span>
            <span class="kpi-value">RD$ {{ totalPagados() | number:'1.2-2' }}</span>
            <span class="kpi-subtext">{{ countPagados() }} comprobantes aplicados</span>
          </div>
        </div>

        <!-- 2: Pendientes -->
        <div class="kpi-card card-amber">
          <div class="kpi-icon-circle amber">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          </div>
          <div class="kpi-info">
            <span class="kpi-label">PENDIENTES DE PAGO</span>
            <span class="kpi-value">RD$ {{ totalPendientes() | number:'1.2-2' }}</span>
            <span class="kpi-subtext">{{ countPendientes() }} por desembolsar</span>
          </div>
        </div>

        <!-- 3: Anulados -->
        <div class="kpi-card card-red">
          <div class="kpi-icon-circle red">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>
          </div>
          <div class="kpi-info">
            <span class="kpi-label">ANULADOS (AUDITADOS)</span>
            <span class="kpi-value">RD$ {{ totalAnulados() | number:'1.2-2' }}</span>
            <span class="kpi-subtext">{{ countAnulados() }} excluidos de balance</span>
          </div>
        </div>

        <!-- 4: Total Registros -->
        <div class="kpi-card card-blue">
          <div class="kpi-icon-circle blue">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
          </div>
          <div class="kpi-info">
            <span class="kpi-label">TOTAL REGISTROS</span>
            <span class="kpi-value">{{ expenses().length }}</span>
            <span class="kpi-subtext">RESIDENCIAL MENA ARRIBA</span>
          </div>
        </div>
      </div>

      <!-- Filtros y Pestañas -->
      <div class="filter-toolbar">
        <div class="status-tabs">
          <button
            class="tab-btn"
            [class.active]="selectedTab() === 'Todos'"
            (click)="selectedTab.set('Todos')">
            Todos {{ expenses().length }}
          </button>
          <button
            class="tab-btn"
            [class.active]="selectedTab() === 'Pagados'"
            (click)="selectedTab.set('Pagados')">
            Pagados {{ countPagados() }}
          </button>
          <button
            class="tab-btn"
            [class.active]="selectedTab() === 'Pendientes'"
            (click)="selectedTab.set('Pendientes')">
            Pendientes {{ countPendientes() }}
          </button>
          <button
            class="tab-btn"
            [class.active]="selectedTab() === 'Anulados'"
            (click)="selectedTab.set('Anulados')">
            Anulados {{ countAnulados() }}
          </button>
        </div>

        <div class="search-date-group">
          <div class="search-box">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input
              type="text"
              [(ngModel)]="searchQuery"
              placeholder="Buscar proveedor, NCF, ref..."
              id="input-search-egresos" />
          </div>

          <div class="date-range">
            <input type="date" [(ngModel)]="startDate" class="date-input" />
            <span class="date-sep">a</span>
            <input type="date" [(ngModel)]="endDate" class="date-input" />
            <button class="btn btn-primary btn-filter">Filtrar</button>
          </div>
        </div>
      </div>

      <!-- Tabla de Egresos -->
      <div class="table-card">
        <div class="table-responsive">
          <table class="gpf-table">
            <thead>
              <tr>
                <th># EGRESO</th>
                <th>FECHA</th>
                <th>PROVEEDOR / BENEFICIARIO</th>
                <th>NCF / REF</th>
                <th>CONCEPTO / CATEGORÍA</th>
                <th>VÍA DE PAGO</th>
                <th class="text-right">MONTO RD$</th>
                <th class="text-center">ESTADO</th>
                <th>REGISTRADO POR</th>
                <th class="text-center">ACCIONES</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let item of filteredExpenses()">
                <td class="cell-strong">#{{ item.id }}</td>
                <td class="cell-date">{{ item.fecha }}</td>
                <td>
                  <div class="supplier-info">
                    <span class="supplier-name">{{ item.beneficiario }}</span>
                    <span class="supplier-rnc" *ngIf="item.beneficiarioRnc">{{ item.beneficiarioRnc }}</span>
                  </div>
                </td>
                <td class="cell-ncf">{{ item.ncf || '—' }}</td>
                <td>
                  <div class="category-tag">
                    <span class="cat-title">{{ item.categoria }}</span>
                    <span class="cat-sub" *ngIf="item.subcategoria">{{ item.subcategoria }}</span>
                  </div>
                </td>
                <td>
                  <div class="payment-info">
                    <span class="pay-method">{{ item.viaPago }}</span>
                    <span class="pay-ref" *ngIf="item.referencia">{{ item.referencia }}</span>
                  </div>
                </td>
                <td class="text-right cell-amount">
                  <strong>RD$ {{ item.monto | number:'1.2-2' }}</strong>
                </td>
                <td class="text-center">
                  <span class="status-badge" [class.status-paid]="item.estado === 'Pagado'" [class.status-pending]="item.estado === 'Pendiente'" [class.status-void]="item.estado === 'Anulado'">
                    <span class="dot"></span>
                    {{ item.estado }}
                  </span>
                </td>
                <td class="cell-user">{{ item.registradoPor }}</td>
                <td class="text-center">
                  <div class="action-buttons">
                    <button class="btn-action view" (click)="viewDetail(item)" title="Ver detalle">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                    </button>
                    <button class="btn-action print" (click)="printVoucher(item)" title="Imprimir Comprobante">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
                    </button>
                    <button class="btn-action delete" (click)="annulExpense(item)" title="Anular Egreso">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
                    </button>
                  </div>
                </td>
              </tr>
              <tr *ngIf="filteredExpenses().length === 0">
                <td colspan="10" class="empty-state">
                  No se encontraron órdenes de egreso registradas para el filtro seleccionado.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Modal Nueva Orden de Pago / Egreso (Matching v3 Captura 12) -->
      <div class="modal-backdrop" *ngIf="showNewModal()">
        <div class="modal-box">
          <div class="modal-header">
            <div class="modal-title-wrap">
              <div class="modal-icon-blue">$</div>
              <div>
                <h3 class="modal-title">Nueva Orden de Pago / Egreso</h3>
                <span class="modal-subtitle">Residencial: <strong>RESIDENCIAL MENA ARRIBA</strong></span>
              </div>
            </div>
            <button class="modal-close" (click)="closeModal()">✕</button>
          </div>

          <div class="modal-body">
            <!-- Beneficiario / Proveedor -->
            <div class="form-row">
              <div class="form-group full-width">
                <div class="label-with-hint">
                  <label>BENEFICIARIO / PROVEEDOR *</label>
                  <span class="hint-count">{{ suppliers.length }} suplidores en catálogo</span>
                </div>
                <div class="input-with-action">
                  <div class="select-wrapper">
                    <svg class="select-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg>
                    <select [(ngModel)]="formBeneficiario" class="form-control" id="select-beneficiario">
                      <option value="" disabled selected>Escriba para buscar o ingresar beneficiario...</option>
                      <option *ngFor="let s of suppliers" [value]="s.nombre">{{ s.nombre }} ({{ s.rnc }})</option>
                    </select>
                  </div>
                  <button class="btn-icon-add" title="Crear nuevo suplidor" (click)="quickAddSupplier()">+</button>
                </div>
              </div>
            </div>

            <!-- Monto & NCF -->
            <div class="form-grid-2">
              <div class="form-group">
                <label>MONTO A DESEMBOLSAR RD$ *</label>
                <div class="input-amount-wrapper">
                  <span class="amount-prefix">RD$</span>
                  <input type="number" [(ngModel)]="formMonto" class="form-control amount-input" placeholder="0.00" min="0" step="0.01" />
                </div>
              </div>
              <div class="form-group">
                <label>NCF / NO. FACTURA SUPLIDOR</label>
                <input type="text" [(ngModel)]="formNcf" class="form-control" placeholder="Ej. B0100004523" />
              </div>
            </div>

            <!-- Categoría de Gasto & Estado -->
            <div class="form-grid-2">
              <div class="form-group">
                <label>CATEGORÍA DE GASTO *</label>
                <div class="input-with-action">
                  <select [(ngModel)]="formCategoria" class="form-control">
                    <option value="PAGO SUPLIDOR">PAGO SUPLIDOR</option>
                    <option value="Mantenimiento y Reparaciones">Mantenimiento y Reparaciones</option>
                    <option value="Servicios Públicos (Luz / Agua)">Servicios Públicos (Luz / Agua)</option>
                    <option value="Seguridad y Vigilancia">Seguridad y Vigilancia</option>
                    <option value="Limpieza y Conserjería">Limpieza y Conserjería</option>
                    <option value="Nómina y Personal">Nómina y Personal</option>
                    <option value="Honorarios Profesionales">Honorarios Profesionales</option>
                    <option value="Gastos Administrativos / Bancarios">Gastos Administrativos / Bancarios</option>
                  </select>
                  <button class="btn-icon-add" title="Crear categoría">+</button>
                </div>
              </div>

              <div class="form-group">
                <label>ESTADO DE LA ORDEN</label>
                <select [(ngModel)]="formEstado" class="form-control">
                  <option value="Pagado">Pagado (Desembolso Realizado)</option>
                  <option value="Pendiente">Pendiente de Pago</option>
                </select>
              </div>
            </div>

            <!-- Vía de Pago & Referencia -->
            <div class="form-grid-2">
              <div class="form-group">
                <label>VÍA / MEDIO DE PAGO</label>
                <select [(ngModel)]="formViaPago" class="form-control">
                  <option value="Transferencia Bancaria">Transferencia Bancaria</option>
                  <option value="Cheque">Cheque</option>
                  <option value="Efectivo (Caja Chica)">Efectivo (Caja Chica)</option>
                  <option value="Tarjeta Corporativa">Tarjeta Corporativa</option>
                </select>
              </div>

              <div class="form-group">
                <label>NO. CHEQUE / REFERENCIA</label>
                <input type="text" [(ngModel)]="formReferencia" class="form-control" placeholder="Ej. Cheque #4502 / Transf #849302" />
              </div>
            </div>

            <!-- Cuenta Bancaria Débito -->
            <div class="form-row">
              <div class="form-group full-width">
                <label>CUENTA BANCARIA DE DÉBITO</label>
                <select [(ngModel)]="formCuentaBancaria" class="form-control">
                  <option value="">Seleccione cuenta de origen...</option>
                  <option value="Banco Popular Corriente - No. 784561230 (RD$ 345,800.00)">Banco Popular Corriente - No. 784561230 (RD$ 345,800.00)</option>
                  <option value="Banreservas Ahorros - No. 960012455 (RD$ 120,450.00)">Banreservas Ahorros - No. 960012455 (RD$ 120,450.00)</option>
                  <option value="BHD León Operativa - No. 102938472 (RD$ 84,200.00)">BHD León Operativa - No. 102938472 (RD$ 84,200.00)</option>
                </select>
              </div>
            </div>

            <!-- Justificación / Concepto -->
            <div class="form-row">
              <div class="form-group full-width">
                <label>CONCEPTO DEL DESEMBOLSO / JUSTIFICACIÓN *</label>
                <textarea
                  [(ngModel)]="formConcepto"
                  rows="3"
                  class="form-control textarea"
                  placeholder="Detalle del egreso conforme a las normas de contabilidad del condominio..."></textarea>
              </div>
            </div>
          </div>

          <div class="modal-footer">
            <div class="footer-total">
              Total orden: <strong>RD$ {{ (formMonto || 0) | number:'1.2-2' }}</strong>
            </div>
            <div class="footer-buttons">
              <button class="btn btn-outline" (click)="closeModal()">Cancelar</button>
              <button class="btn btn-primary" (click)="saveExpense()" id="btn-submit-egreso">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>
                Registrar Desembolso
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .expenses-container {
      display: flex;
      flex-direction: column;
      gap: 20px;
      padding: 4px 0 30px;
    }

    /* Page top bar */
    .page-top-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 16px 20px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.02);

      .header-titles {
        .title-row {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .currency-icon {
          font-size: 1.2rem;
          font-weight: 800;
          color: #2563eb;
        }

        .page-title {
          font-size: 1.25rem;
          font-weight: 700;
          color: #0f172a;
          margin: 0;
        }

        .page-subtitle {
          font-size: 0.78rem;
          color: #64748b;
          margin: 4px 0 0;
        }
      }

      .top-actions {
        display: flex;
        align-items: center;
        gap: 10px;
      }
    }

    .btn-refresh {
      background: #f8fafc;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      width: 38px;
      height: 38px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #64748b;
      cursor: pointer;
      transition: all 0.15s ease;
      &:hover {
        background: #f1f5f9;
        color: #0f172a;
      }
    }

    /* KPI Grid */
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 16px;

      @media (max-width: 900px) {
        grid-template-columns: repeat(2, 1fr);
      }
    }

    .kpi-card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 16px;
      display: flex;
      align-items: center;
      gap: 14px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.02);

      .kpi-icon-circle {
        width: 42px;
        height: 42px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;

        &.green { background: #dcfce7; color: #16a34a; }
        &.amber { background: #fef3c7; color: #d97706; }
        &.red { background: #fee2e2; color: #dc2626; }
        &.blue { background: #dbeafe; color: #2563eb; }
      }

      .kpi-info {
        display: flex;
        flex-direction: column;
        gap: 2px;

        .kpi-label {
          font-size: 0.68rem;
          font-weight: 700;
          color: #64748b;
          letter-spacing: 0.04em;
        }

        .kpi-value {
          font-size: 1.15rem;
          font-weight: 800;
          color: #0f172a;
        }

        .kpi-subtext {
          font-size: 0.72rem;
          color: #94a3b8;
        }
      }
    }

    /* Filters toolbar */
    .filter-toolbar {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 12px 16px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 12px;
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
        font-size: 0.8rem;
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

    .search-date-group {
      display: flex;
      align-items: center;
      gap: 12px;
      flex-wrap: wrap;

      .search-box {
        display: flex;
        align-items: center;
        gap: 8px;
        background: #f8fafc;
        border: 1px solid #cbd5e1;
        border-radius: 8px;
        padding: 6px 12px;
        width: 240px;

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

      .date-range {
        display: flex;
        align-items: center;
        gap: 6px;

        .date-input {
          padding: 6px 10px;
          border: 1px solid #cbd5e1;
          border-radius: 8px;
          font-size: 0.78rem;
          background: #f8fafc;
          color: #334155;
          outline: none;
        }

        .date-sep {
          font-size: 0.75rem;
          color: #94a3b8;
        }

        .btn-filter {
          padding: 6px 14px;
          font-size: 0.78rem;
          border-radius: 8px;
        }
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
        white-space: nowrap;
      }

      tbody tr {
        border-bottom: 1px solid #f1f5f9;
        transition: background 0.1s ease;
        &:hover { background: #f8fafc; }
      }

      td {
        padding: 12px 14px;
        color: #334155;
        vertical-align: middle;
      }

      .cell-strong {
        font-weight: 700;
        color: #0f172a;
      }

      .cell-date {
        color: #64748b;
        font-size: 0.78rem;
        white-space: nowrap;
      }

      .supplier-info {
        display: flex;
        flex-direction: column;
        .supplier-name {
          font-weight: 600;
          color: #0f172a;
        }
        .supplier-rnc {
          font-size: 0.7rem;
          color: #94a3b8;
        }
      }

      .cell-ncf {
        font-family: monospace;
        font-size: 0.75rem;
        color: #64748b;
      }

      .category-tag {
        display: flex;
        flex-direction: column;
        .cat-title {
          font-weight: 600;
          color: #1e293b;
          font-size: 0.78rem;
        }
        .cat-sub {
          font-size: 0.7rem;
          color: #64748b;
        }
      }

      .payment-info {
        display: flex;
        flex-direction: column;
        .pay-method {
          font-weight: 600;
          color: #334155;
          font-size: 0.78rem;
        }
        .pay-ref {
          font-size: 0.7rem;
          color: #94a3b8;
        }
      }

      .cell-amount {
        font-weight: 700;
        color: #dc2626;
        font-size: 0.85rem;
      }

      .cell-user {
        font-size: 0.78rem;
        color: #64748b;
      }

      .status-badge {
        display: inline-flex;
        align-items: center;
        gap: 5px;
        padding: 3px 10px;
        border-radius: 9999px;
        font-size: 0.72rem;
        font-weight: 600;

        .dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
        }

        &.status-paid {
          background: var(--success-green-bg);
          color: var(--success-green-text);
          .dot { background: var(--success-green); }
        }

        &.status-pending {
          background: var(--warning-orange-bg);
          color: var(--warning-orange-text);
          .dot { background: var(--warning-orange); }
        }

        &.status-void {
          background: var(--danger-red-bg);
          color: var(--danger-red-text);
          .dot { background: var(--danger-red); }
        }
      }

      .action-buttons {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 6px;

        .btn-action {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 6px;
          width: 28px;
          height: 28px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          color: #64748b;
          transition: all 0.15s ease;

          &:hover {
            background: #e2e8f0;
            color: #0f172a;
          }

          &.delete:hover {
            background: #fee2e2;
            color: #dc2626;
            border-color: #fca5a5;
          }
        }
      }

      .empty-state {
        text-align: center;
        padding: 40px;
        color: #94a3b8;
        font-size: 0.875rem;
      }
    }

    .text-right { text-align: right; }
    .text-center { text-align: center; }

    /* Modal Backdrop and Box (matching v3 layout) */
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
      max-width: 620px;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
      display: flex;
      flex-direction: column;
      overflow: hidden;
      animation: modalSlide 0.2s ease;
    }

    @keyframes modalSlide {
      from { transform: scale(0.96); opacity: 0; }
      to { transform: scale(1); opacity: 1; }
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 18px 24px;
      border-bottom: 1px solid #f1f5f9;

      .modal-title-wrap {
        display: flex;
        align-items: center;
        gap: 12px;

        .modal-icon-blue {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: #2563eb;
          color: #ffffff;
          font-weight: 800;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.1rem;
        }

        .modal-title {
          font-size: 1.1rem;
          font-weight: 700;
          color: #0f172a;
          margin: 0;
        }

        .modal-subtitle {
          font-size: 0.75rem;
          color: #64748b;
          strong { color: #2563eb; }
        }
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
      display: flex;
      flex-direction: column;
      gap: 14px;
      max-height: 75vh;
      overflow-y: auto;
    }

    .form-grid-2 {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 14px;
    }

    .form-row {
      display: flex;
      flex-direction: column;
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 6px;

      label {
        font-size: 0.68rem;
        font-weight: 700;
        color: #475569;
        letter-spacing: 0.04em;
      }

      .label-with-hint {
        display: flex;
        justify-content: space-between;
        align-items: center;
        label { margin-bottom: 0; }
        .hint-count {
          font-size: 0.68rem;
          color: #94a3b8;
        }
      }
    }

    .input-with-action {
      display: flex;
      gap: 8px;
      align-items: center;

      .select-wrapper {
        position: relative;
        flex: 1;

        .select-icon {
          position: absolute;
          left: 10px;
          top: 50%;
          transform: translateY(-50%);
          color: #94a3b8;
          pointer-events: none;
        }

        select {
          padding-left: 34px;
        }
      }

      .btn-icon-add {
        width: 38px;
        height: 38px;
        border-radius: 8px;
        background: #2563eb;
        color: #ffffff;
        border: none;
        font-size: 1.2rem;
        font-weight: 600;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
        &:hover { background: #1d4ed8; }
      }
    }

    .form-control {
      width: 100%;
      padding: 9px 12px;
      border: 1.5px solid #cbd5e1;
      border-radius: 8px;
      font-size: 0.8125rem;
      color: #0f172a;
      background: #f8fafc;
      outline: none;
      transition: all 0.15s ease;

      &:focus {
        border-color: #2563eb;
        background: #ffffff;
        box-shadow: 0 0 0 3px rgba(37,99,235,0.1);
      }
    }

    .input-amount-wrapper {
      position: relative;
      display: flex;
      align-items: center;

      .amount-prefix {
        position: absolute;
        left: 12px;
        font-weight: 700;
        color: #dc2626;
        font-size: 0.8125rem;
        pointer-events: none;
      }

      .amount-input {
        padding-left: 48px;
        font-weight: 700;
        color: #dc2626;
      }
    }

    .textarea {
      resize: vertical;
      min-height: 70px;
    }

    .modal-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px 24px;
      border-top: 1px solid #f1f5f9;
      background: #f8fafc;

      .footer-total {
        font-size: 0.85rem;
        color: #475569;
        strong {
          color: #dc2626;
          font-size: 1.05rem;
        }
      }

      .footer-buttons {
        display: flex;
        gap: 10px;
      }
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
      &:hover { background: #f1f5f9; color: #0f172a; }
    }
  `]
})
export class ExpensesComponent {
  selectedTab = signal<'Todos' | 'Pagados' | 'Pendientes' | 'Anulados'>('Todos');
  searchQuery = '';
  startDate = '';
  endDate = '';
  showNewModal = signal(false);

  // Form Model
  formBeneficiario = '';
  formMonto: number | null = null;
  formNcf = '';
  formCategoria = 'PAGO SUPLIDOR';
  formEstado: 'Pagado' | 'Pendiente' = 'Pagado';
  formViaPago = 'Transferencia Bancaria';
  formReferencia = '';
  formCuentaBancaria = '';
  formConcepto = '';

  suppliers = [
    { id: 1, nombre: 'ASTEJE SERVICIOS', rnc: '1-32-29831-2' },
    { id: 2, nombre: 'EDESUR DOMINICANA', rnc: '1-01-02345-6' },
    { id: 3, nombre: 'CAASD SANTO DOMINGO', rnc: '1-01-89021-3' },
    { id: 4, nombre: 'ELEVADORES DOMINICANOS SRL', rnc: '1-30-77612-4' },
    { id: 5, nombre: 'SEGURIDAD Y PROTECCION NACIONAL', rnc: '1-31-88902-1' },
    { id: 6, nombre: 'FUMIGACION & PLAGAS DEL CARIBE', rnc: '1-30-44129-8' }
  ];

  expenses = signal<ExpenseItem[]>([
    {
      id: 15,
      egresoNumber: 'EGR-00015',
      fecha: '4/9/2026',
      beneficiario: 'ASTEJE SERVICIOS',
      beneficiarioRnc: '1-32-29831-2',
      ncf: 'B0200001209',
      categoria: 'PRUEBAS',
      subcategoria: 'Mantenimiento',
      viaPago: 'Transferencia',
      cuentaBancaria: 'Banco Popular',
      referencia: 'POPULAR CTRE01200',
      monto: 300.00,
      estado: 'Pagado',
      registradoPor: 'Admin',
      concepto: 'Mantenimiento menor de prueba y reparación de luminarias en pasillo principal'
    },
    {
      id: 14,
      egresoNumber: 'EGR-00014',
      fecha: '28/8/2026',
      beneficiario: 'EDESUR DOMINICANA',
      beneficiarioRnc: '1-01-02345-6',
      ncf: 'B0100009841',
      categoria: 'Servicios Públicos',
      subcategoria: 'Luz y Energía',
      viaPago: 'Transferencia',
      referencia: 'Transf #992381',
      monto: 14500.00,
      estado: 'Pagado',
      registradoPor: 'Juan Astacio',
      concepto: 'Factura eléctrica áreas comunes agosto 2026'
    },
    {
      id: 13,
      egresoNumber: 'EGR-00013',
      fecha: '20/8/2026',
      beneficiario: 'CAASD SANTO DOMINGO',
      beneficiarioRnc: '1-01-89021-3',
      ncf: 'B0100004521',
      categoria: 'Servicios Públicos',
      subcategoria: 'Agua Potable',
      viaPago: 'Cheque',
      referencia: 'Cheque #4012',
      monto: 3200.00,
      estado: 'Pagado',
      registradoPor: 'Juan Astacio',
      concepto: 'Servicio de agua potable y cisterna comunitaria'
    }
  ]);

  // Computed KPIs
  countPagados = computed(() => this.expenses().filter(e => e.estado === 'Pagado').length);
  countPendientes = computed(() => this.expenses().filter(e => e.estado === 'Pendiente').length);
  countAnulados = computed(() => this.expenses().filter(e => e.estado === 'Anulado').length);

  totalPagados = computed(() => this.expenses().filter(e => e.estado === 'Pagado').reduce((sum, e) => sum + e.monto, 0));
  totalPendientes = computed(() => this.expenses().filter(e => e.estado === 'Pendiente').reduce((sum, e) => sum + e.monto, 0));
  totalAnulados = computed(() => this.expenses().filter(e => e.estado === 'Anulado').reduce((sum, e) => sum + e.monto, 0));

  filteredExpenses = computed(() => {
    let list = this.expenses();
    const tab = this.selectedTab();
    if (tab === 'Pagados') list = list.filter(e => e.estado === 'Pagado');
    else if (tab === 'Pendientes') list = list.filter(e => e.estado === 'Pendiente');
    else if (tab === 'Anulados') list = list.filter(e => e.estado === 'Anulado');

    if (this.searchQuery.trim()) {
      const q = this.searchQuery.toLowerCase();
      list = list.filter(e =>
        e.beneficiario.toLowerCase().includes(q) ||
        (e.ncf && e.ncf.toLowerCase().includes(q)) ||
        (e.referencia && e.referencia.toLowerCase().includes(q)) ||
        e.categoria.toLowerCase().includes(q)
      );
    }
    return list;
  });

  constructor(private api: ApiService) {}

  ngOnInit(): void {
    this.loadExpensesAndSuppliers();
  }

  loadExpensesAndSuppliers(): void {
    this.api.get<any[]>('properties', []).subscribe(props => {
      const pId = props && props.length > 0 ? props[0].id : 'a1b2c3d4-0000-0000-0000-000000000001';
      this.api.get<any[]>(`expenses/property/${pId}`, []).subscribe(expList => {
        if (expList && expList.length > 0) {
          const mapped: ExpenseItem[] = expList.map((e, idx) => ({
            id: idx + 1,
            egresoNumber: `EGR-${String(idx + 1).padStart(5, '0')}`,
            fecha: e.expenseDate ? new Date(e.expenseDate).toLocaleDateString('es-DO') : new Date().toLocaleDateString('es-DO'),
            beneficiario: e.supplierName || 'Proveedor General',
            beneficiarioRnc: e.taxId || '1-01-00000-1',
            ncf: e.fiscalReceiptNumber || 'B0100001234',
            categoria: 'Mantenimiento General',
            viaPago: 'Transferencia Bancaria',
            referencia: `TRF-${idx + 100}`,
            monto: e.amount || 1000,
            estado: (e.status === 'Paid' ? 'Pagado' : (e.status === 'Cancelled' ? 'Anulado' : 'Pendiente')) as any,
            registradoPor: 'Admin SoftGPF',
            concepto: e.concept || 'Gasto operacional'
          }));
          this.expenses.set(mapped);
        }
      });
    });

    this.api.get<any[]>('expenses/suppliers', []).subscribe(supList => {
      if (supList && supList.length > 0) {
        this.suppliers = supList.map((s, idx) => ({
          id: idx + 1,
          nombre: s.name,
          rnc: s.taxId || ''
        }));
      }
    });
  }

  openModal(): void {
    this.formBeneficiario = '';
    this.formMonto = null;
    this.formNcf = '';
    this.formCategoria = 'PAGO SUPLIDOR';
    this.formEstado = 'Pagado';
    this.formViaPago = 'Transferencia Bancaria';
    this.formReferencia = '';
    this.formCuentaBancaria = '';
    this.formConcepto = '';
    this.showNewModal.set(true);
  }

  closeModal(): void {
    this.showNewModal.set(false);
  }

  quickAddSupplier(): void {
    const name = prompt('Ingrese el nombre del nuevo proveedor:');
    if (name && name.trim()) {
      const rnc = prompt('Ingrese el RNC o Cédula:') || '';
      const payload = {
        name: name.trim(),
        taxId: rnc.trim(),
        email: 'proveedor@portaforza.com',
        phone: '809-000-0000',
        address: 'Santo Domingo'
      };

      this.api.post<any>('expenses/suppliers', payload).subscribe({
        next: () => {
          const newSup = { id: this.suppliers.length + 1, nombre: name.trim(), rnc: rnc.trim() };
          this.suppliers.push(newSup);
          this.formBeneficiario = newSup.nombre;
        }
      });
    }
  }

  saveExpense(): void {
    if (!this.formBeneficiario || !this.formMonto || this.formMonto <= 0) {
      alert('Por favor complete el beneficiario y el monto válido a desembolsar.');
      return;
    }

    const matchedSupplier = this.suppliers.find(s => s.nombre === this.formBeneficiario);

    const payload = {
      propertyId: 'a1b2c3d4-0000-0000-0000-000000000001',
      supplierId: null,
      concept: this.formConcepto || `Pago a ${this.formBeneficiario}`,
      amount: Number(this.formMonto),
      expenseDate: '2026-09-28',
      fiscalReceiptNumber: this.formNcf || 'B0100009999'
    };

    this.api.post<any>('expenses', payload).subscribe({
      next: (res) => {
        const newExp: ExpenseItem = {
          id: this.expenses().length + 1,
          egresoNumber: `EGR-${String(this.expenses().length + 1).padStart(5, '0')}`,
          fecha: new Date().toLocaleDateString('es-DO'),
          beneficiario: this.formBeneficiario,
          beneficiarioRnc: matchedSupplier?.rnc || '',
          ncf: this.formNcf || '—',
          categoria: this.formCategoria,
          viaPago: this.formViaPago,
          cuentaBancaria: this.formCuentaBancaria,
          referencia: this.formReferencia,
          monto: Number(this.formMonto),
          estado: this.formEstado,
          registradoPor: 'Admin',
          concepto: this.formConcepto || 'Sin detalle adicional'
        };
        this.expenses.update(list => [newExp, ...list]);
        this.closeModal();
      }
    });
  }

  refreshData(): void {
    this.loadExpensesAndSuppliers();
  }

  viewDetail(item: ExpenseItem): void {
    alert(`Detalle de Egreso #${item.id}:\n\nBeneficiario: ${item.beneficiario}\nMonto: RD$ ${item.monto.toFixed(2)}\nConcepto: ${item.concepto}\nEstado: ${item.estado}\nVía: ${item.viaPago} (${item.referencia})`);
  }

  printVoucher(item: ExpenseItem): void {
    window.print();
  }

  annulExpense(item: ExpenseItem): void {
    if (confirm(`¿Está seguro de anular la orden de egreso #${item.id} (${item.beneficiario} - RD$ ${item.monto.toFixed(2)})? Esta acción quedará auditada.`)) {
      this.expenses.update(list => list.map(e => e.id === item.id ? { ...e, estado: 'Anulado' } : e));
    }
  }
}
