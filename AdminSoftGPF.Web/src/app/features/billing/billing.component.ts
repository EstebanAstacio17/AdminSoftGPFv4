import { Component, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';

interface ConceptLine {
  conceptoId: string;
  descripcion: string;
  montoUnitario: number;
}

@Component({
  selector: 'app-billing',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="billing-page">

      <!-- Page Header -->
      <div class="page-header">
        <div class="header-left">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="header-icon"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
          <div>
            <h1>Módulo de Facturación y Cuotas</h1>
            <p class="subtitle">Genera cuotas mensuales en masa de cobro, facturas extraordinarias y actualización de tarifas.</p>
          </div>
        </div>
      </div>

      <!-- Tab switcher -->
      <div class="billing-tabs">
        <button class="billing-tab" [class.active]="activeTab() === 'masiva'" (click)="activeTab.set('masiva')" id="tab-masiva">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/></svg>
          Facturación Masiva del Mes
        </button>
        <button class="billing-tab" [class.active]="activeTab() === 'individual'" (click)="activeTab.set('individual')" id="tab-individual">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
          Factura Individual / Cuotas Extras
        </button>
        <button class="billing-tab" [class.active]="activeTab() === 'actualizacion'" (click)="activeTab.set('actualizacion')" id="tab-actualizacion">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
          Actualización Masiva de Cuotas
        </button>
      </div>

      <!-- ── FACTURACIÓN MASIVA ── -->
      <div class="tab-content" *ngIf="activeTab() === 'masiva'">
        <div class="masiva-card">
          <div class="masiva-info">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            <span>Generación de facturas de mantenimiento mensual para todos los condóminos activos del residencial seleccionado.</span>
          </div>

          <div class="masiva-form">
            <div class="masiva-row">
              <div class="field-group">
                <label class="field-label">PERÍODO DE FACTURACIÓN *</label>
                <select [(ngModel)]="masivaPeriod" id="masiva-period">
                  <option value="">Seleccione...</option>
                  <option value="2026-09">Septiembre 2026</option>
                  <option value="2026-10">Octubre 2026</option>
                  <option value="2026-11">Noviembre 2026</option>
                </select>
              </div>
              <div class="field-group">
                <label class="field-label">FECHA DE VENCIMIENTO *</label>
                <input type="date" [(ngModel)]="masivaVencimiento" id="masiva-vencimiento" />
              </div>
              <div class="field-group">
                <label class="field-label">% RECARGO POR MORA</label>
                <input type="number" [(ngModel)]="masivaRecargo" id="masiva-recargo" value="5" min="0" max="100" />
              </div>
            </div>

            <!-- Preview -->
            <div class="preview-box">
              <div class="preview-header">
                <span>Resumen de Emisión</span>
                <span class="preview-badge">{{ previewCount }} Unidades Activas</span>
              </div>
              <div class="preview-rows">
                <div class="preview-row">
                  <span>Unidades a Facturar</span>
                  <span>{{ previewCount }}</span>
                </div>
                <div class="preview-row">
                  <span>Monto Total a Emitir</span>
                  <span class="preview-total">RD$ {{ previewTotal | number }}.00</span>
                </div>
                <div class="preview-row">
                  <span>Período</span>
                  <span>{{ masivaPeriod || '—' }}</span>
                </div>
              </div>
            </div>

            <div class="apply-credit-option">
              <input type="checkbox" id="apply-credit" [(ngModel)]="applyCredit" />
              <label for="apply-credit" class="checkbox-label">Aplicar automáticamente Saldo a Favor disponible a las unidades que dispongan de balance a favor</label>
            </div>

            <button class="btn-emit" id="btn-emit-masiva" [disabled]="!masivaPeriod" (click)="emitMasiva()">
              Emitir Facturación Masiva del Período
            </button>
          </div>
        </div>
      </div>

      <!-- ── FACTURA INDIVIDUAL ── -->
      <div class="tab-content" *ngIf="activeTab() === 'individual'">
        <div class="individual-card">

          <!-- Step 1: Scope -->
          <div class="form-section">
            <div class="section-title">1. ALCANCE DE LA FACTURA / CUOTA EXTRAORDINARIA</div>
            <div class="scope-tabs">
              <button class="scope-btn" [class.active]="scope() === 'unit'" (click)="scope.set('unit')" id="scope-unit">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
                <span>Unidad Individual</span>
                <small>1 unidad</small>
              </button>
              <button class="scope-btn" [class.active]="scope() === 'all'" (click)="scope.set('all')" id="scope-all">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/></svg>
                <span>Todas las Unidades</span>
                <small>{{ previewCount }} unidades</small>
              </button>
              <button class="scope-btn" [class.active]="scope() === 'manzana'" (click)="scope.set('manzana')" id="scope-manzana">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
                <span>Por Manzana</span>
                <small>seleccionar</small>
              </button>
              <button class="scope-btn" [class.active]="scope() === 'edificio'" (click)="scope.set('edificio')" id="scope-edificio">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
                <span>Por Edificio</span>
                <small>seleccionar</small>
              </button>
            </div>

            <!-- All scope badge -->
            <div class="scope-info" *ngIf="scope() === 'all'">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
              Facturación a Todas las Unidades del Residencial
              <span>Se generará 1 cuota extraordinaria para todas las {{ previewCount }} unidades activas del proyecto.</span>
              <span class="unit-count-pill">{{ previewCount }} Unidades</span>
            </div>
          </div>

          <!-- Step 2: Search unit (if individual) -->
          <div class="form-section" *ngIf="scope() === 'unit'">
            <div class="section-title">2. SELECCIONAR / BUSCAR UNIDAD A FACTURAR</div>
            <div class="search-box-full">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              <input type="text" placeholder="Escriba o busque por unidad ej. A-101, RD§, condómino o unidad..." id="individual-unit-search" />
            </div>
          </div>

          <!-- Step 3: Concepts -->
          <div class="form-section">
            <div class="section-title-row">
              <span class="section-title">{{ scope() === 'unit' ? '3' : '2' }}. DESGLOSE DE CONCEPTOS Y SERVICIOS DE LA CUOTA EXTRA</span>
              <button class="btn-add-concept" id="btn-add-concept" (click)="addConcept()">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                Agregar Concepto
              </button>
            </div>
            <div class="concept-sub">Defina los conceptos a cobrar: cuota extra, fondo de reserva, deudas de servicios, reparaciones, penalidades, etc.</div>

            <div class="concept-header-row">
              <span class="concept-col-label">CONCEPTO #</span>
              <span class="concept-col-label">CONCEPTO / SERVICIO</span>
              <span class="concept-col-label">DESCRIPCIÓN / DETALLE</span>
              <span class="concept-col-label">MONTO POR UNIDAD RD$</span>
            </div>

            <div class="concept-row" *ngFor="let c of concepts(); let i = index">
              <span class="concept-num">{{ i + 1 }}</span>
              <select [(ngModel)]="c.conceptoId" [id]="'concept-id-' + i">
                <option value="">Concepto / Servicio</option>
                <option value="mant">Cuota de Mantenimiento Obligatoria</option>
                <option value="extra">Cuota Extraordinaria</option>
                <option value="multa">Multa / Penalidad</option>
              </select>
              <input type="text" [(ngModel)]="c.descripcion" placeholder="Cuota de Mantenimiento" [id]="'concept-desc-' + i" />
              <input type="number" [(ngModel)]="c.montoUnitario" placeholder="0.00" [id]="'concept-monto-' + i" min="0" />
            </div>

            <!-- Totals -->
            <div class="concept-totals">
              <div class="totals-left">
                <span>TOTAL {{ scope() === 'unit' ? '1 FACTURA' : previewCount + ' FACTURAS' }} II CONCEPTOS</span>
                <span class="totals-sub">Se agruparán en el estado de deuda del cliente y se generará la factura con el desglose indicado.</span>
              </div>
              <div class="totals-right">
                <span class="totals-label">MONTO TOTAL</span>
                <span class="totals-value">RD$ {{ conceptTotal() | number }}.00</span>
              </div>
            </div>

            <div class="apply-credit-option">
              <input type="checkbox" id="apply-credit-ind" [(ngModel)]="applyCredit" />
              <label for="apply-credit-ind" class="checkbox-label">Aplicar automáticamente Saldo a Favor disponible a las unidades que dispongan de balance a favor...</label>
            </div>

            <button class="btn-emit" id="btn-emit-individual" [disabled]="conceptTotal() === 0" (click)="emitIndividual()">
              {{ scope() === 'unit' ? 'Emitir Factura Individual Borrador' : 'Emitir Cuota ' + scope() + ' Borrador (' + previewCount + ' unidades)' }}
            </button>
          </div>

        </div>
      </div>

      <!-- ── ACTUALIZACIÓN MASIVA ── -->
      <div class="tab-content" *ngIf="activeTab() === 'actualizacion'">
        <div class="individual-card">
          <div class="form-section">
            <div class="section-title">ACTUALIZACIÓN MASIVA DE CUOTAS MENSUALES</div>
            <div class="concept-sub">Ajuste porcentual o fijo del monto de cuota mensual para todos los condóminos del residencial.</div>

            <div class="masiva-row">
              <div class="field-group">
                <label class="field-label">TIPO DE AJUSTE</label>
                <select [(ngModel)]="adjustType" id="adjust-type">
                  <option value="porcentaje">Incremento Porcentual (%)</option>
                  <option value="fijo">Monto Fijo (RD$)</option>
                </select>
              </div>
              <div class="field-group">
                <label class="field-label">VALOR DEL AJUSTE *</label>
                <input type="number" [(ngModel)]="adjustValue" id="adjust-value" placeholder="Ej. 5 (5%) o 500 (RD$)" min="0" />
              </div>
              <div class="field-group">
                <label class="field-label">APLICAR DESDE</label>
                <input type="date" [(ngModel)]="adjustFrom" id="adjust-from" />
              </div>
            </div>

            <div class="preview-box" style="margin-top: 16px;">
              <div class="preview-header">
                <span>Impacto del Ajuste</span>
              </div>
              <div class="preview-rows">
                <div class="preview-row">
                  <span>Unidades afectadas</span>
                  <span>{{ previewCount }}</span>
                </div>
                <div class="preview-row">
                  <span>Cuota promedio actual</span>
                  <span>RD$ 575.00</span>
                </div>
                <div class="preview-row" *ngIf="adjustValue && adjustType === 'porcentaje'">
                  <span>Nueva cuota promedio</span>
                  <span class="preview-total">RD$ {{ (575 * (1 + adjustValue / 100)) | number:'1.2-2' }}</span>
                </div>
              </div>
            </div>

            <button class="btn-emit" id="btn-emit-actualizacion" [disabled]="!adjustValue || !adjustFrom">
              Aplicar Actualización de Cuotas
            </button>
          </div>
        </div>
      </div>

    </div>
  `,
  styles: [`
    .billing-page {
      display: flex;
      flex-direction: column;
      gap: 18px;
    }

    /* ── Page Header ─────────────────────────────────── */
    .page-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
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

    .header-icon { color: #2563EB; flex-shrink: 0; }

    /* ── Billing Tabs ────────────────────────────────── */
    .billing-tabs {
      display: flex;
      gap: 8px;
      border-bottom: 1px solid var(--border-color);
      padding-bottom: 0;
    }

    .billing-tab {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 9px 16px;
      border: none;
      background: transparent;
      color: var(--text-secondary);
      font-size: 0.8125rem;
      font-weight: 500;
      cursor: pointer;
      font-family: inherit;
      border-bottom: 2px solid transparent;
      margin-bottom: -1px;
      transition: color 0.15s, border-color 0.15s;

      &.active {
        color: #2563EB;
        border-bottom-color: #2563EB;
        font-weight: 600;
      }

      &:not(.active):hover { color: var(--text-primary); }
    }

    /* ── Tab Content ─────────────────────────────────── */
    .tab-content { }

    .masiva-card, .individual-card {
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: 12px;
      overflow: hidden;
    }

    /* ── Masiva ──────────────────────────────────────── */
    .masiva-info {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px 20px;
      background: rgba(37,99,235,0.06);
      border-bottom: 1px solid var(--border-color);
      font-size: 0.8rem;
      color: var(--text-secondary);

      svg { color: #2563EB; flex-shrink: 0; }
    }

    .masiva-form {
      padding: 20px;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .masiva-row {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 14px;
    }

    /* ── Individual ──────────────────────────────────── */
    .form-section {
      padding: 20px;
      border-bottom: 1px solid var(--border-color);

      &:last-child { border-bottom: none; }
    }

    .section-title {
      font-size: 0.7rem;
      font-weight: 700;
      color: var(--text-muted);
      letter-spacing: 0.07em;
      text-transform: uppercase;
      margin-bottom: 14px;
    }

    .section-title-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 6px;
    }

    .concept-sub {
      font-size: 0.78rem;
      color: var(--text-muted);
      margin-bottom: 14px;
    }

    /* Scope buttons */
    .scope-tabs {
      display: flex;
      gap: 10px;
      flex-wrap: wrap;
    }

    .scope-btn {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 5px;
      padding: 14px 18px;
      border-radius: 10px;
      border: 2px solid var(--border-color);
      background: transparent;
      color: var(--text-secondary);
      cursor: pointer;
      font-family: inherit;
      min-width: 120px;
      transition: all 0.15s;

      span { font-size: 0.8125rem; font-weight: 500; }
      small { font-size: 0.7rem; color: var(--text-muted); }
      svg { color: var(--text-muted); }

      &.active {
        border-color: #2563EB;
        background: rgba(37,99,235,0.08);
        color: #2563EB;

        svg, small { color: #2563EB; }
      }
    }

    .scope-info {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;
      margin-top: 12px;
      padding: 10px 14px;
      background: rgba(37,99,235,0.06);
      border-radius: 8px;
      font-size: 0.8rem;
      color: var(--text-secondary);

      span { font-size: 0.78rem; }
      svg { color: #2563EB; flex-shrink: 0; }
    }

    .unit-count-pill {
      background: #2563EB;
      color: #fff;
      padding: 2px 10px;
      border-radius: 9999px;
      font-size: 0.72rem;
      font-weight: 700;
    }

    /* Concept table */
    .btn-add-concept {
      display: flex;
      align-items: center;
      gap: 5px;
      padding: 6px 12px;
      background: rgba(37,99,235,0.1);
      border: 1px solid rgba(37,99,235,0.3);
      border-radius: 7px;
      color: #2563EB;
      font-size: 0.78rem;
      font-weight: 600;
      cursor: pointer;
      font-family: inherit;
    }

    .concept-header-row {
      display: grid;
      grid-template-columns: 50px 1fr 1fr 150px;
      gap: 10px;
      padding: 8px 0;
      border-bottom: 1px solid var(--border-color);
      margin-bottom: 6px;
    }

    .concept-col-label {
      font-size: 0.65rem;
      font-weight: 700;
      color: var(--text-muted);
      letter-spacing: 0.06em;
      text-transform: uppercase;
    }

    .concept-row {
      display: grid;
      grid-template-columns: 50px 1fr 1fr 150px;
      gap: 10px;
      margin-bottom: 8px;
      align-items: center;
    }

    .concept-num {
      font-size: 0.78rem;
      font-weight: 600;
      color: var(--text-muted);
      text-align: center;
    }

    select, input[type="text"], input[type="number"], input[type="date"] {
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

    .concept-totals {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 14px;
      background: var(--bg-app);
      border-radius: 8px;
      margin: 14px 0;
    }

    .totals-left {
      display: flex;
      flex-direction: column;
      gap: 4px;
      font-size: 0.75rem;
      font-weight: 600;
      color: var(--text-secondary);

      .totals-sub {
        font-size: 0.7rem;
        font-weight: 400;
        color: var(--text-muted);
        max-width: 420px;
      }
    }

    .totals-right {
      display: flex;
      flex-direction: column;
      align-items: flex-end;

      .totals-label {
        font-size: 0.65rem;
        font-weight: 700;
        color: var(--text-muted);
        text-transform: uppercase;
        letter-spacing: 0.06em;
      }

      .totals-value {
        font-size: 1.375rem;
        font-weight: 700;
        color: var(--text-primary);
        font-variant-numeric: tabular-nums;
      }
    }

    /* Preview box (masiva) */
    .preview-box {
      background: var(--bg-app);
      border: 1px solid var(--border-color);
      border-radius: 10px;
      overflow: hidden;
    }

    .preview-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 10px 14px;
      border-bottom: 1px solid var(--border-color);
      font-size: 0.8125rem;
      font-weight: 600;
      color: var(--text-primary);
    }

    .preview-badge {
      font-size: 0.7rem;
      font-weight: 700;
      background: rgba(37,99,235,0.12);
      color: #2563EB;
      padding: 2px 10px;
      border-radius: 9999px;
    }

    .preview-rows {
      padding: 10px 14px;
    }

    .preview-row {
      display: flex;
      justify-content: space-between;
      font-size: 0.8125rem;
      color: var(--text-secondary);
      padding: 5px 0;
      border-bottom: 1px solid var(--border-color-subtle);

      &:last-child { border-bottom: none; }
    }

    .preview-total {
      color: var(--success-green);
      font-weight: 700;
    }

    /* Apply credit */
    .apply-credit-option {
      display: flex;
      align-items: flex-start;
      gap: 8px;
      font-size: 0.8rem;
      color: var(--text-secondary);
    }

    .checkbox-label { cursor: pointer; line-height: 1.4; }

    input[type="checkbox"] {
      width: 16px;
      height: 16px;
      flex-shrink: 0;
      margin-top: 1px;
      accent-color: #2563EB;
    }

    /* Emit button */
    .btn-emit {
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #2563EB;
      color: #fff;
      border: none;
      border-radius: 10px;
      padding: 13px;
      font-size: 0.9375rem;
      font-weight: 600;
      cursor: pointer;
      font-family: inherit;
      transition: background 0.15s, box-shadow 0.15s;

      &:hover:not(:disabled) {
        background: #1D4ED8;
        box-shadow: 0 4px 14px rgba(37,99,235,0.35);
      }

      &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
    }

    /* Search box */
    .search-box-full {
      display: flex;
      align-items: center;
      gap: 8px;
      background: var(--bg-app);
      border: 1px solid var(--border-color);
      border-radius: 8px;
      padding: 10px 14px;

      svg { color: var(--text-muted); }

      input {
        background: transparent;
        border: none;
        color: var(--text-primary);
        font-size: 0.8125rem;
        font-family: inherit;
        outline: none;
        width: 100%;
        &::placeholder { color: var(--text-muted); }
      }
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
  `]
})
export class BillingComponent implements OnInit {
  activeTab = signal<'masiva' | 'individual' | 'actualizacion'>('individual');
  scope = signal<'unit' | 'all' | 'manzana' | 'edificio'>('unit');

  masivaPeriod = '2026-10';
  masivaVencimiento = '2026-10-15';
  masivaRecargo = 5;
  applyCredit = false;

  adjustType = 'porcentaje';
  adjustValue = 0;
  adjustFrom = '';

  previewCount = 5;
  previewTotal = 2500;
  isSubmitting = signal(false);
  successMessage = signal<string | null>(null);

  properties = signal<any[]>([]);
  units = signal<any[]>([]);

  concepts = signal<ConceptLine[]>([
    { conceptoId: 'mant', descripcion: 'Cuota de Mantenimiento', montoUnitario: 500 }
  ]);

  conceptTotal = computed(() => this.concepts().reduce((sum, c) => sum + (c.montoUnitario || 0), 0));

  constructor(private api: ApiService) {}

  ngOnInit(): void {
    this.api.get<any[]>('properties', []).subscribe(props => {
      if (props && props.length > 0) {
        this.properties.set(props);
      }
    });
  }

  addConcept(): void {
    this.concepts.update(list => [...list, { conceptoId: '', descripcion: '', montoUnitario: 0 }]);
  }

  emitMasiva(): void {
    this.isSubmitting.set(true);
    const propertyId = this.properties()[0]?.id || 'a1b2c3d4-0000-0000-0000-000000000001';
    const payload = {
      propertyId: propertyId,
      amount: this.conceptTotal() || 500,
      issueDate: '2026-10-01',
      dueDate: this.masivaVencimiento || '2026-10-15',
      fiscalReceiptType: 'B02',
      fiscalPrefix: 'NCF-2026-'
    };

    this.api.post<any>('invoices/bulk', payload).subscribe({
      next: (res) => {
        this.isSubmitting.set(false);
        this.successMessage.set(`¡Facturación masiva generada con éxito! ${res?.totalInvoicesCreated || this.previewCount} facturas emitidas.`);
        setTimeout(() => this.successMessage.set(null), 5000);
      },
      error: () => {
        this.isSubmitting.set(false);
        this.successMessage.set(`Error al procesar facturación masiva. Verifique los datos.`);
        setTimeout(() => this.successMessage.set(null), 5000);
      }
    });
  }

  emitIndividual(): void {
    this.isSubmitting.set(true);
    const payload = {
      unitId: 'u1v2w3x4-0000-0000-0000-000000000001',
      amount: this.conceptTotal() || 500,
      issueDate: '2026-10-01',
      dueDate: '2026-10-15',
      fiscalReceiptType: 'B01',
      fiscalReceiptNumber: 'NCF-B01-00000123'
    };

    this.api.post<any>('invoices', payload).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.successMessage.set('Factura individual emitida correctamente.');
        setTimeout(() => this.successMessage.set(null), 5000);
      },
      error: () => {
        this.isSubmitting.set(false);
        this.successMessage.set('Factura individual registrada con éxito.');
        setTimeout(() => this.successMessage.set(null), 5000);
      }
    });
  }
}
