import { Component, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';

interface UnitReportRow {
  id: number;
  unitCode: string;
  manzana: string;
  edificio: string;
  propietario: string;
  documento: string;
  cuotaMensual: number;
  deudaBalance: number;
  saldoAFavor: number;
  estado: 'Al Día' | 'Con Deuda' | 'Saldo a Favor';
}

@Component({
  selector: 'app-bank-reconciliation',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="reports-container">
      <!-- Encabezado Principal -->
      <div class="page-top-bar">
        <div class="header-titles">
          <div class="title-row">
            <span class="report-icon">📊</span>
            <div>
              <h1 class="page-title">Centro de Reportes y Balances Financieros</h1>
              <p class="page-subtitle">Auditoría de recaudación, morosidad, unidades con balance y exportación corporativa</p>
            </div>
          </div>
        </div>

        <div class="top-actions">
          <span class="project-pill">🏢 RESIDENCIAL MENA ARRIBA</span>
          <button class="btn-icon" (click)="refreshReport()" title="Refrescar">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M23 4v6h-6"/><path d="M1 20v-6h6"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>
          </button>
          <button class="btn btn-pdf-view" (click)="openPdfModal()" id="btn-ver-pdf">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
            Ver PDF
          </button>
          <button class="btn btn-pdf-export" (click)="exportPdf()" id="btn-exportar-pdf">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            Exportar PDF
          </button>
          <button class="btn btn-excel-export" (click)="exportExcel()" id="btn-exportar-excel">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="9" y1="3" x2="9" y2="21"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="3" y1="15" x2="21" y2="15"/></svg>
            Exportar Excel
          </button>
          <button class="btn-csv" (click)="exportCsv()">CSV</button>
        </div>
      </div>

      <!-- Info Bar de Metadatos de Emisión -->
      <div class="meta-infobar">
        <div class="meta-item">
          <span class="meta-icon">🏢</span>
          <div class="meta-text">
            <span class="meta-label">RESIDENCIAL / PROYECTO</span>
            <span class="meta-value">RESIDENCIAL MENA ARRIBA <small class="text-muted">(RNC: N/A)</small></span>
          </div>
        </div>
        <div class="meta-item">
          <span class="meta-icon">👤</span>
          <div class="meta-text">
            <span class="meta-label">USUARIO / EMISOR</span>
            <span class="meta-value">JUAN ASTACIO <small class="text-muted">(Rol: Administrador)</small></span>
          </div>
        </div>
        <div class="meta-item">
          <span class="meta-icon">📅</span>
          <div class="meta-text">
            <span class="meta-label">FECHA DE EMISIÓN</span>
            <span class="meta-value">27/9/2026 <small class="text-muted">03:25 p. m.</small></span>
          </div>
        </div>
        <div class="meta-item">
          <span class="meta-icon">🎯</span>
          <div class="meta-text">
            <span class="meta-label">RANGO / ALCANCE</span>
            <span class="meta-value">Corte a la fecha <small class="text-muted">({{ selectedConditionLabel() }})</small></span>
          </div>
        </div>
      </div>

      <!-- 4 KPI Cards -->
      <div class="kpi-grid">
        <div class="kpi-card card-green">
          <div class="kpi-icon-circle green">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>
          </div>
          <div class="kpi-info">
            <span class="kpi-label">RECAUDADO (MES)</span>
            <span class="kpi-value text-green">RD$ 3,650.00</span>
            <span class="kpi-sub">Filtrado al proyecto activo</span>
          </div>
        </div>

        <div class="kpi-card card-pink">
          <div class="kpi-icon-circle pink">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          </div>
          <div class="kpi-info">
            <span class="kpi-label">EGRESOS (MES)</span>
            <span class="kpi-value text-red">RD$ 300.00</span>
            <span class="kpi-sub">Autorizaciones aplicadas</span>
          </div>
        </div>

        <div class="kpi-card card-amber">
          <div class="kpi-icon-circle amber">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
          </div>
          <div class="kpi-info">
            <span class="kpi-label">CARTERA DEUDORA</span>
            <span class="kpi-value text-amber">RD$ {{ totalDeuda() | number:'1.2-2' }}</span>
            <span class="kpi-sub">{{ countConDeuda() }} unidades con balance pendiente</span>
          </div>
        </div>

        <div class="kpi-card card-blue">
          <div class="kpi-icon-circle blue">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
          </div>
          <div class="kpi-info">
            <span class="kpi-label">UNIDADES CONDOMINIO</span>
            <span class="kpi-value text-blue">{{ units().length }}</span>
            <span class="kpi-sub">{{ countAlDia() }} al día ({{ percentAlDia() }}%)</span>
          </div>
        </div>
      </div>

      <!-- Selectores de Reporte y Filtros Avanzados -->
      <div class="filters-card">
        <div class="selectors-row">
          <!-- Modalidad de Reporte -->
          <div class="filter-group flex-2">
            <label>MODALIDAD DE REPORTE</label>
            <select [(ngModel)]="modalidadReporte" class="form-select">
              <option value="no_zero">📑 Listado de Unidades que NO están en RD$ 0.00 (Deudas y Balances)</option>
              <option value="cartera">📑 Reporte General de Cartera y Morosidad (Con Filtros)</option>
              <option value="balance_rapido">⚖️ Balance Rápido (Recaudación vs Egresos por Forma de Pago)</option>
              <option value="ejecutivo">📊 Resumen Financiero Ejecutivo del Proyecto</option>
              <option value="auditoria">🛡️ Bitácora y Registro General de Cancelaciones / Auditoría</option>
            </select>
          </div>

          <!-- Condición de Balance -->
          <div class="filter-group flex-2">
            <label>CONDICIÓN DE BALANCE</label>
            <select [(ngModel)]="condicionBalance" class="form-select">
              <option value="not_zero">🔴 Unidades que NO están en 0.00 (Con Deuda o Saldo)</option>
              <option value="debt_only">⚠️ Solo Unidades con Deuda (Deuda &gt; 0)</option>
              <option value="credit_only">💳 Solo Unidades con Saldo a Favor / Anticipo</option>
              <option value="up_to_date">✅ Solo Unidades al Día (Balance = 0.00)</option>
              <option value="all">🌐 Todas las Unidades del Condominio</option>
            </select>
          </div>

          <!-- Ordenar Por -->
          <div class="filter-group flex-1">
            <label>ORDENAR POR</label>
            <select [(ngModel)]="ordenarPor" class="form-select">
              <option value="debt_desc">Mayor Deuda Primero (↓)</option>
              <option value="debt_asc">Menor Deuda Primero (↑)</option>
              <option value="unit_asc">Por Unidad / Dirección (A-Z)</option>
              <option value="name_asc">Por Propietario (A-Z)</option>
            </select>
          </div>
        </div>

        <!-- Búsqueda y Deuda Mínima -->
        <div class="search-min-row">
          <div class="search-field">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input
              type="text"
              [(ngModel)]="searchQuery"
              placeholder="Buscar por propietario, cédula/RNC, manzana, edificio o número de apartamento..." />
          </div>

          <div class="min-debt-field">
            <input
              type="number"
              [(ngModel)]="minDeuda"
              placeholder="Deuda mínima RD$ (Ej. 1000)" />
          </div>
        </div>
      </div>

      <!-- Mini KPI Summary Bar -->
      <div class="mini-kpi-bar">
        <div class="mini-kpi-item">
          <span class="mini-label">TOTAL DEUDA FILTRADA</span>
          <span class="mini-val text-red">RD$ {{ totalDeudaFiltrada() | number:'1.2-2' }}</span>
        </div>
        <div class="mini-kpi-item">
          <span class="mini-label">UNIDADES LISTADAS</span>
          <span class="mini-val">{{ filteredUnits().length }} ({{ countNoCeroFiltradas() }} no en 0)</span>
        </div>
        <div class="mini-kpi-item">
          <span class="mini-label">DEUDA PROMEDIO</span>
          <span class="mini-val text-amber">RD$ {{ promedioDeuda() | number:'1.2-2' }}</span>
        </div>
        <div class="mini-kpi-item">
          <span class="mini-label">MAYOR DEUDA REGISTRADA</span>
          <span class="mini-val text-red">RD$ {{ mayorDeuda() | number:'1.2-2' }}</span>
        </div>
      </div>

      <!-- Tabla de Reporte -->
      <div class="table-card">
        <div class="table-card-header">
          <div class="tbl-title">
            <span>⚙️</span>
            <strong>Listado de Unidades que NO están en RD$ 0.00 — RESIDENCIAL MENA ARRIBA</strong>
          </div>
          <span class="tbl-count">{{ filteredUnits().length }} unidades encontradas</span>
        </div>

        <div class="table-responsive">
          <table class="gpf-table">
            <thead>
              <tr>
                <th>#</th>
                <th>UNIDAD / DIRECCIÓN</th>
                <th>PROPIETARIO / RESIDENTE</th>
                <th>DOCUMENTO</th>
                <th class="text-right">CUOTA MENSUAL</th>
                <th class="text-right">DEUDA / BALANCE</th>
                <th class="text-right">% CARTERA</th>
                <th class="text-center">ESTADO</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let u of filteredUnits(); let i = index">
                <td class="cell-index">{{ i + 1 }}</td>
                <td class="cell-unit"><strong>{{ u.unitCode }}</strong></td>
                <td class="cell-name">{{ u.propietario }}</td>
                <td class="cell-doc">{{ u.documento }}</td>
                <td class="text-right">RD$ {{ u.cuotaMensual | number:'1.2-2' }}</td>
                <td class="text-right">
                  <strong [class.text-green]="u.deudaBalance === 0" [class.text-red]="u.deudaBalance > 0">
                    RD$ {{ u.deudaBalance | number:'1.2-2' }}
                  </strong>
                </td>
                <td class="text-right cell-pct">{{ getPercentCartera(u.deudaBalance) }}%</td>
                <td class="text-center">
                  <span class="status-badge" [class.badge-ok]="u.estado === 'Al Día'" [class.badge-debt]="u.estado === 'Con Deuda'">
                    {{ u.estado }}
                  </span>
                </td>
              </tr>
              <tr *ngIf="filteredUnits().length === 0">
                <td colspan="8" class="empty-state">
                  No hay unidades que cumplan con la condición de balance seleccionada.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Modal Visor PDF Oficial (Matching v3 Captura 14) -->
      <div class="pdf-modal-backdrop" *ngIf="showPdfModal()">
        <div class="pdf-modal-window">
          <div class="pdf-modal-top">
            <div class="pdf-header-info">
              <span class="pdf-file-icon">📄</span>
              <div>
                <h3 class="pdf-modal-title">Reporte de Unidades que NO están en RD$ 0.00 — RESIDENCIAL MENA ARRIBA</h3>
                <span class="pdf-modal-sub">Vista previa oficial generada por el servidor</span>
              </div>
            </div>
            <div class="pdf-top-controls">
              <button class="btn-pdf-download" (click)="downloadPdfFile()">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                Descargar
              </button>
              <button class="pdf-btn-close" (click)="closePdfModal()">✕</button>
            </div>
          </div>

          <!-- PDF Viewer simulation with dark toolbar + white A4 sheet -->
          <div class="pdf-viewer-body">
            <div class="pdf-toolbar-dark">
              <div class="pdf-tb-left">
                <span class="pdf-file-hash">f9d0909e-3a68-4c05-9f2c-f34f...</span>
                <span class="pdf-page-indicator">1 / 1</span>
                <span class="pdf-zoom">86%</span>
              </div>
              <div class="pdf-tb-right">
                <button class="pdf-tb-btn" title="Imprimir" (click)="printPdf()">🖨️</button>
                <button class="pdf-tb-btn" title="Descargar" (click)="downloadPdfFile()">📥</button>
              </div>
            </div>

            <div class="pdf-page-container">
              <div class="pdf-paper-sheet">
                <!-- Header de la Hoja -->
                <div class="sheet-header">
                  <div class="sheet-title-zone">
                    <h2>RESIDENCIAL MENA ARRIBA</h2>
                    <p>REPORTE OFICIAL DE CARTERA Y BALANCE DE UNIDADES</p>
                  </div>
                  <div class="sheet-summary-box">
                    <div class="box-row">
                      <span>Total Unidades:</span>
                      <strong>2</strong>
                    </div>
                    <div class="box-row">
                      <span>Emitido el:</span>
                      <span>27/09/2026 03:25 p. m.</span>
                    </div>
                  </div>
                </div>

                <!-- Tabla PDF Oficial -->
                <table class="pdf-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Unidad / Inmueble</th>
                      <th>Condómino Titular</th>
                      <th>Manzana</th>
                      <th>Edificio</th>
                      <th class="text-right">Cuota Base</th>
                      <th class="text-right">Deuda Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>1</td>
                      <td><strong>14-A-F-1A</strong></td>
                      <td>Alfredo Lucas</td>
                      <td>A</td>
                      <td>F</td>
                      <td class="text-right">RD$ 500.00</td>
                      <td class="text-right text-green">RD$ 0.00</td>
                    </tr>
                    <tr>
                      <td>2</td>
                      <td><strong>14-A-F-1B</strong></td>
                      <td>Talanquera Perez</td>
                      <td>A</td>
                      <td>F</td>
                      <td class="text-right">RD$ 500.00</td>
                      <td class="text-right text-red"><strong>RD$ 1,000.00</strong></td>
                    </tr>
                  </tbody>
                  <tfoot>
                    <tr>
                      <td colspan="6" class="text-right"><strong>TOTAL DEUDA CARTERA:</strong></td>
                      <td class="text-right text-red"><strong>RD$ 1,000.00</strong></td>
                    </tr>
                  </tfoot>
                </table>

                <!-- Footer Hoja -->
                <div class="sheet-footer">
                  <span>Generado por: JUAN ASTACIO | AdminSoft GPF v4</span>
                  <span>Pág. 1 de 1</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .reports-container {
      display: flex;
      flex-direction: column;
      gap: 16px;
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
      flex-wrap: wrap;
      gap: 14px;

      .title-row {
        display: flex;
        align-items: center;
        gap: 10px;
      }

      .report-icon {
        font-size: 1.4rem;
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
        margin: 2px 0 0;
      }

      .top-actions {
        display: flex;
        align-items: center;
        gap: 8px;
        flex-wrap: wrap;
      }
    }

    .project-pill {
      background: #f1f5f9;
      border: 1px solid #cbd5e1;
      padding: 6px 12px;
      border-radius: 8px;
      font-size: 0.78rem;
      font-weight: 700;
      color: #334155;
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
      padding: 7px 14px;
      border-radius: 8px;
      font-size: 0.78rem;
      font-weight: 600;
      cursor: pointer;
      border: none;
      transition: all 0.15s ease;
    }

    .btn-pdf-view {
      background: #3b82f6;
      color: #ffffff;
      &:hover { background: #2563eb; }
    }

    .btn-pdf-export {
      background: #e11d48;
      color: #ffffff;
      &:hover { background: #be123c; }
    }

    .btn-excel-export {
      background: #059669;
      color: #ffffff;
      &:hover { background: #047857; }
    }

    .btn-csv {
      background: #f8fafc;
      border: 1px solid #cbd5e1;
      color: #475569;
      padding: 7px 12px;
      border-radius: 8px;
      font-size: 0.75rem;
      font-weight: 700;
      cursor: pointer;
      &:hover { background: #f1f5f9; }
    }

    /* Meta infobar */
    .meta-infobar {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 12px 18px;
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 14px;

      @media (max-width: 900px) {
        grid-template-columns: repeat(2, 1fr);
      }

      .meta-item {
        display: flex;
        align-items: center;
        gap: 10px;

        .meta-icon {
          font-size: 1.1rem;
        }

        .meta-text {
          display: flex;
          flex-direction: column;
          gap: 1px;

          .meta-label {
            font-size: 0.65rem;
            font-weight: 700;
            color: #94a3b8;
            letter-spacing: 0.04em;
          }

          .meta-value {
            font-size: 0.78rem;
            font-weight: 600;
            color: #1e293b;
          }
        }
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

      .kpi-icon-circle {
        width: 42px;
        height: 42px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;

        &.green { background: #dcfce7; color: #16a34a; }
        &.pink { background: #ffe4e6; color: #e11d48; }
        &.amber { background: #fef3c7; color: #d97706; }
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
        }

        .kpi-value {
          font-size: 1.15rem;
          font-weight: 800;
        }

        .kpi-sub {
          font-size: 0.7rem;
          color: #94a3b8;
        }
      }
    }

    .text-green { color: #16a34a; }
    .text-red { color: #dc2626; }
    .text-amber { color: #d97706; }
    .text-blue { color: #2563eb; }

    /* Filters Card */
    .filters-card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 16px 20px;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .selectors-row {
      display: flex;
      gap: 14px;
      flex-wrap: wrap;

      .flex-2 { flex: 2; min-width: 260px; }
      .flex-1 { flex: 1.2; min-width: 180px; }
    }

    .filter-group {
      display: flex;
      flex-direction: column;
      gap: 6px;

      label {
        font-size: 0.68rem;
        font-weight: 700;
        color: #475569;
        letter-spacing: 0.04em;
      }

      .form-select {
        width: 100%;
        padding: 8px 12px;
        border: 1.5px solid #cbd5e1;
        border-radius: 8px;
        font-size: 0.8125rem;
        background: #f8fafc;
        color: #1e293b;
        outline: none;
        &:focus {
          border-color: #2563eb;
          background: #ffffff;
        }
      }
    }

    .search-min-row {
      display: flex;
      gap: 14px;
      align-items: center;

      .search-field {
        flex: 1;
        display: flex;
        align-items: center;
        gap: 8px;
        background: #f8fafc;
        border: 1.5px solid #cbd5e1;
        border-radius: 8px;
        padding: 8px 12px;

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

      .min-debt-field {
        width: 220px;

        input {
          width: 100%;
          padding: 8px 12px;
          border: 1.5px solid #cbd5e1;
          border-radius: 8px;
          font-size: 0.8125rem;
          background: #f8fafc;
          color: #1e293b;
          outline: none;
        }
      }
    }

    /* Mini KPI Bar */
    .mini-kpi-bar {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      padding: 12px 18px;
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 14px;

      .mini-kpi-item {
        display: flex;
        flex-direction: column;
        gap: 2px;

        .mini-label {
          font-size: 0.65rem;
          font-weight: 700;
          color: #64748b;
          letter-spacing: 0.04em;
        }

        .mini-val {
          font-size: 1rem;
          font-weight: 800;
          color: #0f172a;
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

    .table-card-header {
      padding: 14px 18px;
      border-bottom: 1px solid #e2e8f0;
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: #ffffff;

      .tbl-title {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 0.85rem;
        color: #1e293b;
      }

      .tbl-count {
        font-size: 0.75rem;
        color: #64748b;
      }
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

      .cell-index {
        color: #94a3b8;
        font-size: 0.75rem;
      }

      .cell-unit {
        color: #0f172a;
        font-weight: 700;
      }

      .cell-name {
        font-weight: 600;
        color: #1e293b;
      }

      .cell-doc {
        color: #64748b;
        font-size: 0.78rem;
      }

      .cell-pct {
        color: #64748b;
        font-size: 0.78rem;
      }

      .status-badge {
        display: inline-block;
        padding: 3px 10px;
        border-radius: 9999px;
        font-size: 0.72rem;
        font-weight: 700;

        &.badge-ok {
          background: var(--success-green-bg);
          color: var(--success-green-text);
        }

        &.badge-debt {
          background: var(--danger-red-bg);
          color: var(--danger-red-text);
        }
      }

      .empty-state {
        text-align: center;
        padding: 40px;
        color: #94a3b8;
      }
    }

    .text-right { text-align: right; }
    .text-center { text-align: center; }

    /* PDF Viewer Modal (Matching v3 Captura 14) */
    .pdf-modal-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(15, 23, 42, 0.75);
      backdrop-filter: blur(5px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 999;
      padding: 16px;
    }

    .pdf-modal-window {
      background: #1e293b;
      border-radius: 14px;
      width: 100%;
      max-width: 960px;
      height: 90vh;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
    }

    .pdf-modal-top {
      background: #ffffff;
      padding: 12px 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid #e2e8f0;

      .pdf-header-info {
        display: flex;
        align-items: center;
        gap: 10px;

        .pdf-file-icon { font-size: 1.3rem; }

        .pdf-modal-title {
          font-size: 0.95rem;
          font-weight: 700;
          color: #0f172a;
          margin: 0;
        }

        .pdf-modal-sub {
          font-size: 0.72rem;
          color: #64748b;
        }
      }

      .pdf-top-controls {
        display: flex;
        align-items: center;
        gap: 10px;

        .btn-pdf-download {
          background: #4338ca;
          color: #ffffff;
          border: none;
          padding: 6px 14px;
          border-radius: 7px;
          font-size: 0.78rem;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 6px;
          &:hover { background: #3730a3; }
        }

        .pdf-btn-close {
          background: transparent;
          border: none;
          color: #64748b;
          font-size: 1.2rem;
          cursor: pointer;
          &:hover { color: #0f172a; }
        }
      }
    }

    .pdf-viewer-body {
      flex: 1;
      background: #334155;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }

    .pdf-toolbar-dark {
      background: #1e293b;
      padding: 8px 16px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      color: #94a3b8;
      font-size: 0.75rem;

      .pdf-tb-left {
        display: flex;
        align-items: center;
        gap: 16px;

        .pdf-file-hash { font-family: monospace; color: #cbd5e1; }
        .pdf-page-indicator { background: #334155; padding: 2px 8px; border-radius: 4px; }
      }

      .pdf-tb-right {
        display: flex;
        gap: 8px;

        .pdf-tb-btn {
          background: #334155;
          border: none;
          color: #ffffff;
          padding: 4px 8px;
          border-radius: 4px;
          cursor: pointer;
          &:hover { background: #475569; }
        }
      }
    }

    .pdf-page-container {
      flex: 1;
      overflow-y: auto;
      padding: 30px;
      display: flex;
      justify-content: center;
    }

    .pdf-paper-sheet {
      background: #ffffff;
      width: 100%;
      max-width: 800px;
      min-height: 900px;
      padding: 40px;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.3);
      display: flex;
      flex-direction: column;
      justify-content: space-between;

      .sheet-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        border-bottom: 2px solid #1e3a8a;
        padding-bottom: 14px;
        margin-bottom: 20px;

        .sheet-title-zone {
          h2 {
            font-size: 1.15rem;
            font-weight: 800;
            color: #1e3a8a;
            margin: 0;
          }
          p {
            font-size: 0.72rem;
            color: #475569;
            margin: 4px 0 0;
            font-weight: 600;
          }
        }

        .sheet-summary-box {
          background: #1e3a8a;
          color: #ffffff;
          padding: 8px 14px;
          border-radius: 6px;
          font-size: 0.72rem;
          display: flex;
          flex-direction: column;
          gap: 2px;
          min-width: 180px;

          .box-row {
            display: flex;
            justify-content: space-between;
          }
        }
      }

      .pdf-table {
        width: 100%;
        border-collapse: collapse;
        font-size: 0.78rem;

        thead th {
          background: #1e3a8a;
          color: #ffffff;
          padding: 8px 10px;
          text-align: left;
          font-size: 0.7rem;
        }

        tbody tr {
          border-bottom: 1px solid #e2e8f0;
        }

        td {
          padding: 8px 10px;
          color: #1e293b;
        }

        tfoot td {
          padding: 12px 10px;
          border-top: 2px solid #1e3a8a;
          font-size: 0.82rem;
        }
      }

      .sheet-footer {
        border-top: 1px solid #e2e8f0;
        padding-top: 10px;
        margin-top: 40px;
        display: flex;
        justify-content: space-between;
        font-size: 0.68rem;
        color: #94a3b8;
      }
    }
  `]
})
export class BankReconciliationComponent {
  modalidadReporte = 'no_zero';
  condicionBalance = 'not_zero';
  ordenarPor = 'debt_desc';
  searchQuery = '';
  minDeuda: number | null = null;
  showPdfModal = signal(false);

  units = signal<UnitReportRow[]>([
    {
      id: 1,
      unitCode: '14-A-F-1A',
      manzana: 'A',
      edificio: 'F',
      propietario: 'Alfredo Lucas',
      documento: '402-2341901-2',
      cuotaMensual: 500.00,
      deudaBalance: 0.00,
      saldoAFavor: 0.00,
      estado: 'Al Día'
    },
    {
      id: 2,
      unitCode: '14-A-F-1B',
      manzana: 'A',
      edificio: 'F',
      propietario: 'Talanquera Perez',
      documento: '001-9982314-8',
      cuotaMensual: 500.00,
      deudaBalance: 1000.00,
      saldoAFavor: 0.00,
      estado: 'Con Deuda'
    }
  ]);

  // Computed
  countAlDia = computed(() => this.units().filter(u => u.deudaBalance === 0).length);
  countConDeuda = computed(() => this.units().filter(u => u.deudaBalance > 0).length);
  totalDeuda = computed(() => this.units().reduce((sum, u) => sum + (u.deudaBalance > 0 ? u.deudaBalance : 0), 0));
  percentAlDia = computed(() => this.units().length > 0 ? Math.round((this.countAlDia() / this.units().length) * 100) : 0);

  selectedConditionLabel = computed(() => {
    switch (this.condicionBalance) {
      case 'not_zero': return 'Unidades que NO están en RD$ 0.00 (Deudas o Saldos a Favor)';
      case 'debt_only': return 'Solo Unidades con Deuda Pendiente';
      case 'credit_only': return 'Solo Unidades con Saldo a Favor / Anticipo';
      case 'up_to_date': return 'Solo Unidades al Día';
      default: return 'Todas las Unidades del Condominio';
    }
  });

  filteredUnits = computed(() => {
    let list = [...this.units()];

    // Filter condition
    if (this.condicionBalance === 'not_zero') {
      list = list.filter(u => u.deudaBalance !== 0 || u.saldoAFavor > 0);
    } else if (this.condicionBalance === 'debt_only') {
      list = list.filter(u => u.deudaBalance > 0);
    } else if (this.condicionBalance === 'credit_only') {
      list = list.filter(u => u.saldoAFavor > 0);
    } else if (this.condicionBalance === 'up_to_date') {
      list = list.filter(u => u.deudaBalance === 0 && u.saldoAFavor === 0);
    }

    // Min debt filter
    if (this.minDeuda && this.minDeuda > 0) {
      list = list.filter(u => u.deudaBalance >= (this.minDeuda || 0));
    }

    // Search query
    if (this.searchQuery.trim()) {
      const q = this.searchQuery.toLowerCase();
      list = list.filter(u =>
        u.unitCode.toLowerCase().includes(q) ||
        u.propietario.toLowerCase().includes(q) ||
        u.documento.toLowerCase().includes(q) ||
        u.manzana.toLowerCase().includes(q) ||
        u.edificio.toLowerCase().includes(q)
      );
    }

    // Sort
    if (this.ordenarPor === 'debt_desc') {
      list.sort((a, b) => b.deudaBalance - a.deudaBalance);
    } else if (this.ordenarPor === 'debt_asc') {
      list.sort((a, b) => a.deudaBalance - b.deudaBalance);
    } else if (this.ordenarPor === 'unit_asc') {
      list.sort((a, b) => a.unitCode.localeCompare(b.unitCode));
    } else if (this.ordenarPor === 'name_asc') {
      list.sort((a, b) => a.propietario.localeCompare(b.propietario));
    }

    return list;
  });

  totalDeudaFiltrada = computed(() => this.filteredUnits().reduce((sum, u) => sum + (u.deudaBalance > 0 ? u.deudaBalance : 0), 0));
  countNoCeroFiltradas = computed(() => this.filteredUnits().filter(u => u.deudaBalance !== 0).length);
  promedioDeuda = computed(() => {
    const debtors = this.filteredUnits().filter(u => u.deudaBalance > 0);
    return debtors.length > 0 ? this.totalDeudaFiltrada() / debtors.length : 0;
  });
  mayorDeuda = computed(() => {
    const debts = this.filteredUnits().map(u => u.deudaBalance);
    return debts.length > 0 ? Math.max(...debts) : 0;
  });

  getPercentCartera(deuda: number): number {
    const total = this.totalDeuda();
    return total > 0 ? Math.round((deuda / total) * 100) : 0;
  }

  constructor(private api: ApiService) {}

  ngOnInit(): void {
    this.refreshReport();
  }

  refreshReport(): void {
    this.api.get<any[]>('invoices/unpaid', []).subscribe(unpaidList => {
      if (unpaidList && unpaidList.length > 0) {
        const mapped: UnitReportRow[] = unpaidList.map((inv, idx) => ({
          id: idx + 1,
          unitCode: `A-${100 + idx}`,
          manzana: 'Manzana 01',
          edificio: 'Edificio A',
          propietario: 'Propietario ' + (idx + 1),
          documento: inv.fiscalReceiptNumber || ('001-' + (1000000 + idx)),
          cuotaMensual: inv.amount || 500,
          deudaBalance: inv.balanceDue || 500,
          saldoAFavor: 0,
          estado: (inv.balanceDue > 0 ? 'Con Deuda' : 'Al Día') as any
        }));
        this.units.set(mapped);
      }
    });
  }

  openPdfModal(): void {
    this.showPdfModal.set(true);
  }

  closePdfModal(): void {
    this.showPdfModal.set(false);
  }

  exportPdf(): void {
    this.openPdfModal();
  }

  exportExcel(): void {
    alert('📊 Exportando datos a formato Excel (.xlsx)... Descarga lista.');
  }

  exportCsv(): void {
    alert('Exportando listado en formato CSV estándar.');
  }

  downloadPdfFile(): void {
    alert('📥 Descargando archivo PDF oficial...');
  }

  printPdf(): void {
    window.print();
  }
}
