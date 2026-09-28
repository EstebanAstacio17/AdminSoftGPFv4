import { Component, signal, computed, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
type CatalogTab =
  | 'inmuebles'
  | 'unidades'
  | 'edificios'
  | 'manzanas'
  | 'tipos_propiedades'
  | 'cuotas'
  | 'bancos'
  | 'proveedores'
  | 'conceptos'
  | 'categorias_gastos';

interface ProjectInmueble {
  id: string; // Guid
  tenantId: string;
  nombre: string;
  direccion: string;
  // Campos locales mockeados para UI (no en DB)
  rnc: string;
  moraPct: number;
  tipo: string;
  amenidades: string[];
  contacto: string;
  estado: 'ACTIVO' | 'INACTIVO';
}

interface UnitItem {
  id: number;
  codigo: string;
  detalle: string;
  estado: 'Activo' | 'Inactivo';
}

interface BuildingItem {
  id: number;
  nombre: string;
  niveles: number;
  estado: 'Activo' | 'Inactivo';
}

interface BlockItem {
  id: number;
  manzana: string;
  descripcion: string;
  estado: 'Activo' | 'Inactivo';
}

interface PropertyTypeItem {
  id: number;
  codigo: string;
  nombre: string;
  descripcion: string;
  color: string;
  reqEdificio: boolean;
  reqNivel: boolean;
  estado: 'Activo' | 'Inactivo';
}

interface MaintenanceFeeItem {
  id: number;
  codigo: string;
  tipoInmueble: string;
  montoBase: number;
  estado: 'Activo' | 'Inactivo';
}

interface BankAccountItem {
  id: number;
  banco: string;
  numeroCuenta: string;
  tipo: 'Corriente' | 'Ahorro';
  titular: string;
  balanceInicial: number;
  estado: 'Activo' | 'Inactivo';
}

interface SupplierItem {
  id: number;
  rnc: string;
  nombre: string;
  telefono: string;
  correo: string;
  direccion: string;
  estado: 'Activo' | 'Inactivo';
}

interface ConceptItem {
  id: number;
  concepto: string;
  categoria: string;
  montoPredeterminado: number;
  descripcion: string;
  estado: 'ACTIVO' | 'INACTIVO';
}

interface ExpenseCategoryItem {
  id: number;
  categoria: string;
  descripcion: string;
  residencial: string;
  estado: 'ACTIVO' | 'INACTIVO';
}

@Component({
  selector: 'app-properties',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="catalogs-page">
      <!-- Encabezado Principal -->
      <div class="page-top-bar">
        <div class="header-titles">
          <div class="title-row">
            <span class="icon-gear">⚙️</span>
            <div>
              <h1 class="page-title">Gestión de Catálogos y Proyectos</h1>
              <p class="page-subtitle">Edita, actualiza, inhabilita o elimina proyectos y catálogos de manera segura con control de dependencias.</p>
            </div>
          </div>
        </div>

        <div class="top-project-select">
          <span class="lbl-proj">PROYECTO:</span>
          <select [(ngModel)]="currentProject" class="proj-dropdown">
            <option value="RESIDENCIAL MENA ARRIBA">RESIDENCIAL MENA ARRIBA</option>
            <option value="TORRE DEL PARQUE">TORRE DEL PARQUE</option>
            <option value="PLAZA EMPRESARIAL NORTE">PLAZA EMPRESARIAL NORTE</option>
          </select>
        </div>
      </div>

      <!-- Barra de 10 Pestañas de Catálogos (Matching v3 exactly) -->
      <div class="catalog-tabs-bar">
        <button
          class="cat-tab-btn"
          [class.active]="activeTab() === 'inmuebles'"
          (click)="activeTab.set('inmuebles')"
          id="tab-inmuebles">
          🏢 Inmuebles / Proyectos
        </button>
        <button
          class="cat-tab-btn"
          [class.active]="activeTab() === 'unidades'"
          (click)="activeTab.set('unidades')"
          id="tab-unidades">
          🏠 Apartamentos / Unidades
        </button>
        <button
          class="cat-tab-btn"
          [class.active]="activeTab() === 'edificios'"
          (click)="activeTab.set('edificios')"
          id="tab-edificios">
          🏢 Edificios / Torres
        </button>
        <button
          class="cat-tab-btn"
          [class.active]="activeTab() === 'manzanas'"
          (click)="activeTab.set('manzanas')"
          id="tab-manzanas">
          📍 Manzanas / Sectores
        </button>
        <button
          class="cat-tab-btn"
          [class.active]="activeTab() === 'tipos_propiedades'"
          (click)="activeTab.set('tipos_propiedades')"
          id="tab-tipos-propiedades">
          🗂️ Tipos de Propiedades
        </button>
        <button
          class="cat-tab-btn"
          [class.active]="activeTab() === 'cuotas'"
          (click)="activeTab.set('cuotas')"
          id="tab-cuotas">
          💲 Cuotas de Mantenimiento
        </button>
        <button
          class="cat-tab-btn"
          [class.active]="activeTab() === 'bancos'"
          (click)="activeTab.set('bancos')"
          id="tab-bancos">
          🏦 Cuentas Bancarias
        </button>
        <button
          class="cat-tab-btn"
          [class.active]="activeTab() === 'proveedores'"
          (click)="activeTab.set('proveedores')"
          id="tab-proveedores">
          👥 Proveedores
        </button>
        <button
          class="cat-tab-btn"
          [class.active]="activeTab() === 'conceptos'"
          (click)="activeTab.set('conceptos')"
          id="tab-conceptos">
          🧾 Conceptos y Servicios Facturables
        </button>
        <button
          class="cat-tab-btn"
          [class.active]="activeTab() === 'categorias_gastos'"
          (click)="activeTab.set('categorias_gastos')"
          id="tab-categorias-gastos">
          🏷️ Categorías de Gastos / Egresos
        </button>
      </div>

      <!-- Barra de Filtros y Acciones por Pestaña -->
      <div class="filters-action-bar">
        <div class="search-box">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input
            type="text"
            [(ngModel)]="searchFilter"
            [placeholder]="'Buscar en ' + getTabLabel(activeTab()) + '...'"
            id="input-search-catalog" />
        </div>

        <div class="status-select">
          <select [(ngModel)]="statusFilter" class="form-select-sm">
            <option value="ALL">Todos los estados</option>
            <option value="ACTIVO">Solo Activos</option>
            <option value="INACTIVO">Solo Inactivos</option>
          </select>
        </div>

        <div class="actions-right">
          <button *ngIf="activeTab() === 'categorias_gastos'" class="btn btn-secondary-outline" (click)="loadStandardTemplate()">
            ⚡ Cargar Plantilla Estándar
          </button>
          <button class="btn-icon" (click)="refreshCurrentTab()" title="Refrescar">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M23 4v6h-6"/><path d="M1 20v-6h6"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>
          </button>
          <button class="btn btn-primary" (click)="openCreateModal()" id="btn-nuevo-elemento">
            + Nuevo Elemento
          </button>
        </div>
      </div>

      <!-- Contenedores de Tablas según la Pestaña Activa -->
      <div class="table-container-card">

        <!-- TAB 1: INMUEBLES / PROYECTOS -->
        <div *ngIf="activeTab() === 'inmuebles'" class="table-responsive">
          <table class="gpf-table">
            <thead>
              <tr>
                <th>INMUEBLE / PROYECTO</th>
                <th>TIPO & ESTRUCTURA</th>
                <th>UBICACIÓN & DIRECCIÓN</th>
                <th>AMENIDADES & ÁREAS</th>
                <th>CONTACTO</th>
                <th class="text-center">ESTADO</th>
                <th class="text-center">ACCIONES</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let p of filteredInmuebles()">
                <td>
                  <div class="cell-prop-main">
                    <strong class="prop-title">{{ p.nombre }}</strong>
                    <div class="prop-sub-tags">
                      <span class="sub-tag">RNC: {{ p.rnc || 'No asignado' }}</span>
                      <span class="sub-tag tag-mora">Mora: {{ p.moraPct }}%</span>
                    </div>
                  </div>
                </td>
                <td>
                  <span class="type-badge blue">
                    <span class="type-icon">🏠</span>
                    {{ p.tipo }}
                  </span>
                </td>
                <td class="cell-addr">{{ p.direccion }}</td>
                <td>
                  <span class="amenities-summary" *ngIf="p.amenidades.length > 0">
                    {{ p.amenidades.join(', ') }}
                  </span>
                  <span class="text-muted" *ngIf="p.amenidades.length === 0">Sin amenidades</span>
                </td>
                <td class="cell-contact">{{ p.contacto || '—' }}</td>
                <td class="text-center">
                  <span class="status-pill" [class.active]="p.estado === 'ACTIVO'" [class.inactive]="p.estado === 'INACTIVO'">
                    {{ p.estado }}
                  </span>
                </td>
                <td class="text-center">
                  <div class="row-actions">
                    <button class="action-btn" title="Editar" (click)="editInmueble(p)">✏️</button>
                    <button class="action-btn" title="Activar/Desactivar" (click)="toggleInmueble(p)">⚡</button>
                    <button class="action-btn delete" title="Eliminar" (click)="deleteInmueble(p)">🗑️</button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- TAB 2: APARTAMENTOS / UNIDADES -->
        <div *ngIf="activeTab() === 'unidades'" class="table-responsive">
          <table class="gpf-table">
            <thead>
              <tr>
                <th>APARTAMENTO / CÓDIGO</th>
                <th>DETALLE / UBICACIÓN / NOTAS</th>
                <th class="text-center">ESTADO</th>
                <th class="text-center">ACCIONES</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let u of filteredUnidades()">
                <td><strong>{{ u.codigo }}</strong></td>
                <td>{{ u.detalle }}</td>
                <td class="text-center">
                  <span class="status-pill" [class.active]="u.estado === 'Activo'" [class.inactive]="u.estado === 'Inactivo'">
                    {{ u.estado }}
                  </span>
                </td>
                <td class="text-center">
                  <div class="row-actions">
                    <button class="action-btn" title="Editar">✏️</button>
                    <button class="action-btn delete" title="Eliminar">🗑️</button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- TAB 3: EDIFICIOS / TORRES -->
        <div *ngIf="activeTab() === 'edificios'" class="table-responsive">
          <table class="gpf-table">
            <thead>
              <tr>
                <th>NOMBRE EDIFICIO / TORRE</th>
                <th>NIVELES / PISOS</th>
                <th class="text-center">ESTADO</th>
                <th class="text-center">ACCIONES</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let e of filteredEdificios()">
                <td><strong>{{ e.nombre }}</strong></td>
                <td>{{ e.niveles }} Niveles</td>
                <td class="text-center">
                  <span class="status-pill" [class.active]="e.estado === 'Activo'" [class.inactive]="e.estado === 'Inactivo'">
                    {{ e.estado }}
                  </span>
                </td>
                <td class="text-center">
                  <div class="row-actions">
                    <button class="action-btn" title="Editar">✏️</button>
                    <button class="action-btn delete" title="Eliminar">🗑️</button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- TAB 4: MANZANAS / SECTORES -->
        <div *ngIf="activeTab() === 'manzanas'" class="table-responsive">
          <table class="gpf-table">
            <thead>
              <tr>
                <th>MANZANA / SECTOR</th>
                <th>DESCRIPCIÓN</th>
                <th class="text-center">ESTADO</th>
                <th class="text-center">ACCIONES</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let m of filteredManzanas()">
                <td><strong>Manzana {{ m.manzana }}</strong></td>
                <td>{{ m.descripcion }}</td>
                <td class="text-center">
                  <span class="status-pill" [class.active]="m.estado === 'Activo'" [class.inactive]="m.estado === 'Inactivo'">
                    {{ m.estado }}
                  </span>
                </td>
                <td class="text-center">
                  <div class="row-actions">
                    <button class="action-btn" title="Editar">✏️</button>
                    <button class="action-btn delete" title="Eliminar">🗑️</button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- TAB 5: TIPOS DE PROPIEDADES -->
        <div *ngIf="activeTab() === 'tipos_propiedades'" class="table-responsive">
          <table class="gpf-table">
            <thead>
              <tr>
                <th>CÓDIGO</th>
                <th>NOMBRE DEL TIPO</th>
                <th>DESCRIPCIÓN</th>
                <th class="text-center">COLOR</th>
                <th class="text-center">ESTADO</th>
                <th class="text-center">ACCIONES</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let tp of filteredTiposPropiedades()">
                <td><code>{{ tp.codigo }}</code></td>
                <td><strong>{{ tp.nombre }}</strong></td>
                <td>{{ tp.descripcion }}</td>
                <td class="text-center">
                  <span class="color-dot" [style.background]="tp.color"></span>
                </td>
                <td class="text-center">
                  <span class="status-pill" [class.active]="tp.estado === 'Activo'" [class.inactive]="tp.estado === 'Inactivo'">
                    {{ tp.estado }}
                  </span>
                </td>
                <td class="text-center">
                  <div class="row-actions">
                    <button class="action-btn" title="Editar">✏️</button>
                    <button class="action-btn delete" title="Eliminar">🗑️</button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- TAB 6: CUOTAS DE MANTENIMIENTO -->
        <div *ngIf="activeTab() === 'cuotas'" class="table-responsive">
          <table class="gpf-table">
            <thead>
              <tr>
                <th>CÓDIGO / CONCEPTO</th>
                <th>TIPO INMUEBLE</th>
                <th class="text-right">MONTO BASE RD$</th>
                <th class="text-center">ESTADO</th>
                <th class="text-center">ACCIONES</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let c of filteredCuotas()">
                <td><strong>{{ c.codigo }}</strong></td>
                <td>{{ c.tipoInmueble }}</td>
                <td class="text-right font-bold">RD$ {{ c.montoBase | number:'1.2-2' }}</td>
                <td class="text-center">
                  <span class="status-pill" [class.active]="c.estado === 'Activo'" [class.inactive]="c.estado === 'Inactivo'">
                    {{ c.estado }}
                  </span>
                </td>
                <td class="text-center">
                  <div class="row-actions">
                    <button class="action-btn" title="Editar">✏️</button>
                    <button class="action-btn delete" title="Eliminar">🗑️</button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- TAB 7: CUENTAS BANCARIAS -->
        <div *ngIf="activeTab() === 'bancos'" class="table-responsive">
          <table class="gpf-table">
            <thead>
              <tr>
                <th>BANCO / ENTIDAD</th>
                <th>NÚMERO DE CUENTA</th>
                <th>TIPO DE CUENTA</th>
                <th>TITULAR</th>
                <th class="text-right">BALANCE INICIAL RD$</th>
                <th class="text-center">ESTADO</th>
                <th class="text-center">ACCIONES</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let b of filteredBancos()">
                <td><strong>{{ b.banco }}</strong></td>
                <td><code>{{ b.numeroCuenta }}</code></td>
                <td>{{ b.tipo }}</td>
                <td>{{ b.titular }}</td>
                <td class="text-right font-bold">RD$ {{ b.balanceInicial | number:'1.2-2' }}</td>
                <td class="text-center">
                  <span class="status-pill" [class.active]="b.estado === 'Activo'" [class.inactive]="b.estado === 'Inactivo'">
                    {{ b.estado }}
                  </span>
                </td>
                <td class="text-center">
                  <div class="row-actions">
                    <button class="action-btn" title="Editar">✏️</button>
                    <button class="action-btn delete" title="Eliminar">🗑️</button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- TAB 8: PROVEEDORES -->
        <div *ngIf="activeTab() === 'proveedores'" class="table-responsive">
          <table class="gpf-table">
            <thead>
              <tr>
                <th>RNC / CÉDULA</th>
                <th>NOMBRE PROVEEDOR</th>
                <th>TELÉFONO</th>
                <th>CORREO ELECTRÓNICO</th>
                <th>DIRECCIÓN</th>
                <th class="text-center">ESTADO</th>
                <th class="text-center">ACCIONES</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let sup of filteredProveedores()">
                <td><code>{{ sup.rnc }}</code></td>
                <td><strong>{{ sup.nombre }}</strong></td>
                <td>{{ sup.telefono }}</td>
                <td>{{ sup.correo }}</td>
                <td>{{ sup.direccion }}</td>
                <td class="text-center">
                  <span class="status-pill" [class.active]="sup.estado === 'Activo'" [class.inactive]="sup.estado === 'Inactivo'">
                    {{ sup.estado }}
                  </span>
                </td>
                <td class="text-center">
                  <div class="row-actions">
                    <button class="action-btn" title="Editar">✏️</button>
                    <button class="action-btn delete" title="Eliminar">🗑️</button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- TAB 9: CONCEPTOS Y SERVICIOS FACTURABLES (Matching Captura 23) -->
        <div *ngIf="activeTab() === 'conceptos'" class="table-responsive">
          <table class="gpf-table">
            <thead>
              <tr>
                <th>CONCEPTO / SERVICIO</th>
                <th>CATEGORÍA</th>
                <th class="text-right">MONTO PREDETERMINADO</th>
                <th>DESCRIPCIÓN</th>
                <th class="text-center">ESTADO</th>
                <th class="text-center">ACCIONES</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let c of filteredConceptos()">
                <td>
                  <div class="bullet-concept">
                    <span class="blue-dot"></span>
                    <strong>{{ c.concepto }}</strong>
                  </div>
                </td>
                <td><span class="badge-cat">{{ c.categoria }}</span></td>
                <td class="text-right font-green font-bold">RD$ {{ c.montoPredeterminado | number:'1.2-2' }}</td>
                <td class="cell-desc">{{ c.descripcion }}</td>
                <td class="text-center">
                  <span class="status-pill-green" *ngIf="c.estado === 'ACTIVO'">ACTIVO</span>
                  <span class="status-pill-gray" *ngIf="c.estado === 'INACTIVO'">INACTIVO</span>
                </td>
                <td class="text-center">
                  <div class="row-actions">
                    <button class="action-btn" title="Editar">✏️</button>
                    <button class="action-btn" title="Estado">⚡</button>
                    <button class="action-btn delete" title="Eliminar">🗑️</button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- TAB 10: CATEGORÍAS DE GASTOS / EGRESOS (Matching Captura 23 bottom) -->
        <div *ngIf="activeTab() === 'categorias_gastos'" class="table-responsive">
          <table class="gpf-table">
            <thead>
              <tr>
                <th>CATEGORÍA DE GASTO</th>
                <th>DESCRIPCIÓN / ALCANCE</th>
                <th>RESIDENCIAL / PROYECTO</th>
                <th class="text-center">ESTADO</th>
                <th class="text-center">ACCIONES</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let g of filteredCategoriasGastos()">
                <td>
                  <div class="bullet-concept">
                    <span class="blue-dot"></span>
                    <strong>{{ g.categoria }}</strong>
                  </div>
                </td>
                <td>{{ g.descripcion }}</td>
                <td>{{ g.residencial }}</td>
                <td class="text-center">
                  <span class="status-pill-green" *ngIf="g.estado === 'ACTIVO'">ACTIVO</span>
                  <span class="status-pill-gray" *ngIf="g.estado === 'INACTIVO'">INACTIVO</span>
                </td>
                <td class="text-center">
                  <div class="row-actions">
                    <button class="action-btn" title="Editar">✏️</button>
                    <button class="action-btn" title="Estado">⚡</button>
                    <button class="action-btn delete" title="Eliminar">🗑️</button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

      </div>

      <!-- MODAL 1: NUEVO INMUEBLE / PROYECTO (Matching Capturas 17 & 18) -->
      <div class="modal-backdrop" *ngIf="showModalInmueble()">
        <div class="modal-box modal-lg">
          <div class="modal-header">
            <h3>Nuevo Elemento · Inmuebles / Proyectos</h3>
            <button class="modal-close" (click)="closeModalInmueble()">✕</button>
          </div>

          <div class="modal-body-scroll">
            <!-- 1. Tipo de Inmueble -->
            <div class="section-title">1. TIPO DE INMUEBLE / ENTIDAD ADMINISTRADA *</div>
            <div class="property-types-grid">
              <div
                class="type-selector-card"
                [class.selected]="selectedInmuebleType === 'Residencial / Urbanización'"
                (click)="selectedInmuebleType = 'Residencial / Urbanización'">
                <div class="card-icon-wrap blue">🏠</div>
                <div class="card-type-text">
                  <strong>Residencial / Urbanización</strong>
                  <p>Complejo residencial con manzanas, calles, bloques y áreas sociales</p>
                </div>
              </div>

              <div
                class="type-selector-card"
                [class.selected]="selectedInmuebleType === 'Torre Residencial / Edificio'"
                (click)="selectedInmuebleType = 'Torre Residencial / Edificio'">
                <div class="card-icon-wrap purple">🏢</div>
                <div class="card-type-text">
                  <strong>Torre Residencial / Edificio</strong>
                  <p>Torre vertical con niveles, apartamentos/penthouses, lobby y...</p>
                </div>
              </div>

              <div
                class="type-selector-card"
                [class.selected]="selectedInmuebleType === 'Torre Corporativa / Oficinas'"
                (click)="selectedInmuebleType = 'Torre Corporativa / Oficinas'">
                <div class="card-icon-wrap pink">🏬</div>
                <div class="card-type-text">
                  <strong>Torre Corporativa / Oficinas</strong>
                  <p>Edificio corporativo con suites empresariales, recepción y salas de...</p>
                </div>
              </div>

              <div
                class="type-selector-card"
                [class.selected]="selectedInmuebleType === 'Parque Industrial / Naves'"
                (click)="selectedInmuebleType = 'Parque Industrial / Naves'">
                <div class="card-icon-wrap amber">🏭</div>
                <div class="card-type-text">
                  <strong>Parque Industrial / Naves</strong>
                  <p>Parque logístico con naves, almacenes, patios de maniobra y muelles</p>
                </div>
              </div>

              <div
                class="type-selector-card"
                [class.selected]="selectedInmuebleType === 'Plaza Comercial / Centro'"
                (click)="selectedInmuebleType = 'Plaza Comercial / Centro'">
                <div class="card-icon-wrap green">🛍️</div>
                <div class="card-type-text">
                  <strong>Plaza Comercial / Centro</strong>
                  <p>Centro de compras con locales comerciales, bloques, módulos, nivele...</p>
                </div>
              </div>

              <div
                class="type-selector-card"
                [class.selected]="selectedInmuebleType === 'Casa / Villa Individual'"
                (click)="selectedInmuebleType = 'Casa / Villa Individual'">
                <div class="card-icon-wrap red">🏕️</div>
                <div class="card-type-text">
                  <strong>Casa / Villa Individual</strong>
                  <p>Propiedad o villa administrada de forma independiente con dirección formal</p>
                </div>
              </div>

              <div
                class="type-selector-card"
                [class.selected]="selectedInmuebleType === 'Solar / Terreno / Lote'"
                (click)="selectedInmuebleType = 'Solar / Terreno / Lote'">
                <div class="card-icon-wrap teal">📍</div>
                <div class="card-type-text">
                  <strong>Solar / Terreno / Lote</strong>
                  <p>Lote de terreno administrado con metraje y delimitación catastral</p>
                </div>
              </div>
            </div>

            <!-- 2. Identificación y Contacto -->
            <div class="section-title" style="margin-top: 20px;">🏢 2. IDENTIFICACIÓN Y CONTACTO DEL INMUEBLE</div>
            <div class="form-grid-2">
              <div class="form-group">
                <label>NOMBRE DEL INMUEBLE / PROYECTO *</label>
                <input type="text" [(ngModel)]="newInmueble.nombre" class="form-control" placeholder="Ej. TORRE BELLA VISTA / PARQUE INDUSTRIAL HAINA" />
              </div>
              <div class="form-group">
                <label>RNC / IDENTIFICACIÓN FISCAL</label>
                <input type="text" [(ngModel)]="newInmueble.rnc" class="form-control" placeholder="Ej. 1-32-45678-9" />
              </div>
            </div>

            <div class="form-grid-3">
              <div class="form-group">
                <label>TELÉFONO PRINCIPAL</label>
                <input type="text" [(ngModel)]="newInmueble.telefono" class="form-control" placeholder="Ej. 809-555-0100" />
              </div>
              <div class="form-group">
                <label>CORREO ELECTRÓNICO</label>
                <input type="email" [(ngModel)]="newInmueble.correo" class="form-control" placeholder="admin@inmueble.com" />
              </div>
              <div class="form-group">
                <label>OFICINA / ADMINISTRACIÓN</label>
                <input type="text" [(ngModel)]="newInmueble.oficina" class="form-control" placeholder="Ej. Lobby / Nivel 1" />
              </div>
            </div>

            <div class="form-row">
              <div class="form-group mora-box">
                <label>% RECARGO POR MORA *</label>
                <div class="mora-input-wrap">
                  <input type="number" [(ngModel)]="newInmueble.moraPct" class="form-control mora-input" placeholder="5" />
                  <span class="mora-badge">%</span>
                  <span class="mora-desc">Porcentaje de recargo por mora aplicado a las unidades con atrasos o deudas en la facturación masiva de este proyecto.</span>
                </div>
              </div>
            </div>

            <!-- 3. Ubicación y Dirección Física -->
            <div class="section-title" style="margin-top: 20px;">📍 3. UBICACIÓN Y DIRECCIÓN FÍSICA</div>
            <div class="form-group">
              <label>DIRECCIÓN COMPLETA (CALLE, NO., REFERENCIA) *</label>
              <input type="text" [(ngModel)]="newInmueble.direccion" class="form-control" placeholder="Ej. Av. Sarasota No. 45, esq. Winston Churchill" />
            </div>

            <div class="form-grid-3">
              <div class="form-group">
                <label>SECTOR / URBANIZACIÓN</label>
                <input type="text" [(ngModel)]="newInmueble.sector" class="form-control" placeholder="Ej. Bella Vista / Zona Industrial" />
              </div>
              <div class="form-group">
                <label>CIUDAD / MUNICIPIO</label>
                <input type="text" [(ngModel)]="newInmueble.ciudad" class="form-control" placeholder="Santo Domingo" />
              </div>
              <div class="form-group">
                <label>PROVINCIA</label>
                <input type="text" [(ngModel)]="newInmueble.provincia" class="form-control" placeholder="Santo Domingo" />
              </div>
            </div>

            <!-- 4. Configuración Estructural -->
            <div class="section-title" style="margin-top: 20px;">🏗️ 4. CONFIGURACIÓN DE ESTRUCTURA INTERNA</div>
            <div class="structure-checkboxes-grid">
              <label class="check-card">
                <input type="checkbox" [(ngModel)]="newInmueble.hasManzanas" />
                <div>
                  <strong>¿Tiene Manzanas / Bloques?</strong>
                  <span>Sectores alfanuméricos</span>
                </div>
              </label>

              <label class="check-card">
                <input type="checkbox" [(ngModel)]="newInmueble.hasEdificios" />
                <div>
                  <strong>¿Tiene Edificios / Torres?</strong>
                  <span>Estructuras verticales</span>
                </div>
              </label>

              <label class="check-card">
                <input type="checkbox" [(ngModel)]="newInmueble.hasNiveles" />
                <div>
                  <strong>¿Tiene Niveles / Pisos?</strong>
                  <span>Plantas arquitectónicas</span>
                </div>
              </label>

              <label class="check-card">
                <input type="checkbox" [(ngModel)]="newInmueble.hasNaves" />
                <div>
                  <strong>¿Tiene Naves / Almacenes?</strong>
                  <span>Módulos industriales</span>
                </div>
              </label>

              <label class="check-card">
                <input type="checkbox" [(ngModel)]="newInmueble.hasLocales" />
                <div>
                  <strong>¿Tiene Locales Comerciales?</strong>
                  <span>Puntos de venta</span>
                </div>
              </label>
            </div>

            <!-- 5. Amenidades y Áreas Comunes -->
            <div class="section-title" style="margin-top: 20px;">✨ 5. AMENIDADES Y ÁREAS COMUNES DISPONIBLES</div>
            <div class="amenities-tags-grid">
              <button
                *ngFor="let am of availableAmenities"
                type="button"
                class="amenity-chip"
                [class.selected]="selectedAmenities.has(am)"
                (click)="toggleAmenity(am)">
                {{ selectedAmenities.has(am) ? '✔' : '+' }} {{ am }}
              </button>
            </div>

            <!-- 6. Estado -->
            <div class="form-group" style="margin-top: 20px;">
              <label>ESTADO DEL INMUEBLE</label>
              <select [(ngModel)]="newInmueble.estado" class="form-control">
                <option value="ACTIVO">Activo (Habilitado para cobros y registros)</option>
                <option value="INACTIVO">Inactivo</option>
              </select>
            </div>
          </div>

          <div class="modal-footer">
            <button class="btn btn-outline" (click)="closeModalInmueble()">Cancelar</button>
            <button class="btn btn-primary" (click)="saveInmueble()">Crear Registro</button>
          </div>
        </div>
      </div>

      <!-- MODAL GENÉRICO PARA OTROS CATÁLOGOS (Apartamentos, Bancos, Proveedores, etc.) -->
      <div class="modal-backdrop" *ngIf="showGenericModal()">
        <div class="modal-box">
          <div class="modal-header">
            <h3>Nuevo Elemento · {{ getTabLabel(activeTab()) }}</h3>
            <button class="modal-close" (click)="showGenericModal.set(false)">✕</button>
          </div>

          <div class="modal-body">
            <!-- Dynamic fields depending on activeTab -->
            <div *ngIf="activeTab() === 'unidades'">
              <div class="form-group">
                <label>APARTAMENTO / CÓDIGO *</label>
                <input type="text" [(ngModel)]="genericForm.codigo" class="form-control" placeholder="Ej. A-101 / 202" />
              </div>
              <div class="form-group" style="margin-top: 12px;">
                <label>DETALLE / UBICACIÓN / NOTAS</label>
                <input type="text" [(ngModel)]="genericForm.detalle" class="form-control" placeholder="Ej. 4to Piso, 3 habitaciones, 2 baños" />
              </div>
            </div>

            <div *ngIf="activeTab() === 'bancos'">
              <div class="form-group">
                <label>BANCO / ENTIDAD *</label>
                <input type="text" [(ngModel)]="genericForm.banco" class="form-control" placeholder="Ej. Banco Popular" />
              </div>
              <div class="form-group" style="margin-top: 12px;">
                <label>NÚMERO DE CUENTA *</label>
                <input type="text" [(ngModel)]="genericForm.numeroCuenta" class="form-control" placeholder="Ej. 784561230" />
              </div>
              <div class="form-group" style="margin-top: 12px;">
                <label>TIPO DE CUENTA</label>
                <select [(ngModel)]="genericForm.tipoCuenta" class="form-control">
                  <option value="Corriente">Corriente</option>
                  <option value="Ahorro">Ahorro</option>
                </select>
              </div>
              <div class="form-group" style="margin-top: 12px;">
                <label>TITULAR</label>
                <input type="text" [(ngModel)]="genericForm.titular" class="form-control" placeholder="Ej. Condominio Altos" />
              </div>
            </div>

            <div *ngIf="activeTab() === 'proveedores'">
              <div class="form-group">
                <label>RNC / CÉDULA *</label>
                <input type="text" [(ngModel)]="genericForm.rnc" class="form-control" placeholder="Ej. 131234567" />
              </div>
              <div class="form-group" style="margin-top: 12px;">
                <label>NOMBRE PROVEEDOR *</label>
                <input type="text" [(ngModel)]="genericForm.nombre" class="form-control" placeholder="Ej. Servicios Eléctricos SRL" />
              </div>
              <div class="form-group" style="margin-top: 12px;">
                <label>TELÉFONO</label>
                <input type="text" [(ngModel)]="genericForm.telefono" class="form-control" placeholder="Ej. 809-555-4321" />
              </div>
              <div class="form-group" style="margin-top: 12px;">
                <label>CORREO ELECTRÓNICO</label>
                <input type="email" [(ngModel)]="genericForm.correo" class="form-control" placeholder="contacto@proveedor.com" />
              </div>
            </div>

            <div *ngIf="activeTab() === 'categorias_gastos'">
              <div class="form-group">
                <label>NOMBRE DE LA CATEGORÍA DE GASTO *</label>
                <input type="text" [(ngModel)]="genericForm.categoriaGasto" class="form-control" placeholder="Ej. Mantenimiento de Bombas, Seguridad, Jardinería, etc." />
              </div>
              <div class="form-group" style="margin-top: 12px;">
                <label>DESCRIPCIÓN / ALCANCE DEL GASTO</label>
                <input type="text" [(ngModel)]="genericForm.descripcionGasto" class="form-control" placeholder="Ej. Gastos de compra de repuestos, servicios técnicos y mano de obra para equipos comunes..." />
              </div>
            </div>

            <div class="form-group" style="margin-top: 14px;">
              <label>ESTADO</label>
              <select [(ngModel)]="genericForm.estado" class="form-control">
                <option value="Activo">Activo (Habilitado)</option>
                <option value="Inactivo">Inactivo</option>
              </select>
            </div>
          </div>

          <div class="modal-footer">
            <button class="btn btn-outline" (click)="showGenericModal.set(false)">Cancelar</button>
            <button class="btn btn-primary" (click)="saveGenericItem()">Crear Registro</button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .catalogs-page {
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

      .icon-gear { font-size: 1.3rem; }

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

      .top-project-select {
        display: flex;
        align-items: center;
        gap: 8px;

        .lbl-proj {
          font-size: 0.7rem;
          font-weight: 700;
          color: #64748b;
        }

        .proj-dropdown {
          padding: 6px 12px;
          border: 1.5px solid #cbd5e1;
          border-radius: 8px;
          font-size: 0.8125rem;
          font-weight: 600;
          color: #0f172a;
          background: #f8fafc;
        }
      }
    }

    /* 10 Tab buttons bar */
    .catalog-tabs-bar {
      display: flex;
      gap: 6px;
      overflow-x: auto;
      background: #f1f5f9;
      padding: 6px;
      border-radius: 10px;

      .cat-tab-btn {
        background: transparent;
        border: none;
        padding: 8px 14px;
        border-radius: 7px;
        font-size: 0.78rem;
        font-weight: 600;
        color: #64748b;
        cursor: pointer;
        white-space: nowrap;
        transition: all 0.15s ease;

        &:hover { color: #0f172a; }

        &.active {
          background: #ffffff;
          color: #2563eb;
          box-shadow: 0 1px 3px rgba(0,0,0,0.08);
          font-weight: 700;
        }
      }
    }

    /* Filters toolbar */
    .filters-action-bar {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 12px 18px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 12px;
      flex-wrap: wrap;

      .search-box {
        flex: 1;
        min-width: 240px;
        display: flex;
        align-items: center;
        gap: 8px;
        background: #f8fafc;
        border: 1.5px solid #cbd5e1;
        border-radius: 8px;
        padding: 6px 12px;

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

      .status-select {
        .form-select-sm {
          padding: 6px 10px;
          border: 1.5px solid #cbd5e1;
          border-radius: 8px;
          font-size: 0.78rem;
          background: #f8fafc;
          color: #334155;
          outline: none;
        }
      }

      .actions-right {
        display: flex;
        align-items: center;
        gap: 8px;
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

    .btn-secondary-outline {
      background: #f8fafc;
      border: 1.5px solid #cbd5e1;
      color: #334155;
      font-size: 0.78rem;
      &:hover { background: #e2e8f0; }
    }

    .btn-outline {
      background: #ffffff;
      border: 1px solid #cbd5e1;
      color: #475569;
      &:hover { background: #f1f5f9; }
    }

    /* Tables */
    .table-container-card {
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

    .cell-prop-main {
      display: flex;
      flex-direction: column;
      gap: 4px;

      .prop-title {
        font-size: 0.85rem;
        color: #0f172a;
      }

      .prop-sub-tags {
        display: flex;
        gap: 6px;

        .sub-tag {
          font-size: 0.68rem;
          color: #64748b;
        }

        .tag-mora {
          background: #fef3c7;
          color: #b45309;
          padding: 1px 5px;
          border-radius: 4px;
          font-weight: 700;
        }
      }
    }

    .type-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 3px 8px;
      border-radius: 6px;
      font-size: 0.72rem;
      font-weight: 600;

      &.blue {
        background: #eff6ff;
        color: #2563eb;
        border: 1px solid #bfdbfe;
      }
    }

    .status-pill {
      display: inline-block;
      padding: 2px 8px;
      border-radius: 9999px;
      font-size: 0.7rem;
      font-weight: 700;

      &.active {
        background: #dcfce7;
        color: #15803d;
      }

      &.inactive {
        background: #fee2e2;
        color: #b91c1c;
      }
    }

    .status-pill-green {
      background: #dcfce7;
      color: #15803d;
      padding: 2px 8px;
      border-radius: 9999px;
      font-size: 0.7rem;
      font-weight: 700;
    }

    .status-pill-gray {
      background: #f1f5f9;
      color: #64748b;
      padding: 2px 8px;
      border-radius: 9999px;
      font-size: 0.7rem;
      font-weight: 700;
    }

    .bullet-concept {
      display: flex;
      align-items: center;
      gap: 8px;

      .blue-dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: #2563eb;
      }
    }

    .badge-cat {
      background: #f1f5f9;
      color: #475569;
      padding: 2px 8px;
      border-radius: 6px;
      font-size: 0.72rem;
      font-weight: 600;
    }

    .color-dot {
      display: inline-block;
      width: 16px;
      height: 16px;
      border-radius: 50%;
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

    .font-green { color: #16a34a; }
    .font-bold { font-weight: 700; }
    .text-right { text-align: right; }
    .text-center { text-align: center; }

    /* Modals */
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
      max-width: 580px;
      max-height: 90vh;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);

      &.modal-lg {
        max-width: 760px;
      }
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px 24px;
      border-bottom: 1px solid #f1f5f9;

      h3 {
        margin: 0;
        font-size: 1.1rem;
        font-weight: 700;
        color: #0f172a;
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

    .modal-body-scroll {
      padding: 20px 24px;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .modal-body {
      padding: 20px 24px;
    }

    .section-title {
      font-size: 0.72rem;
      font-weight: 700;
      color: #475569;
      letter-spacing: 0.04em;
    }

    /* Property Types Cards Grid */
    .property-types-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 10px;
      margin-top: 8px;
    }

    .type-selector-card {
      border: 1.5px solid #e2e8f0;
      border-radius: 10px;
      padding: 12px;
      display: flex;
      gap: 10px;
      cursor: pointer;
      transition: all 0.15s ease;

      &:hover { border-color: #2563eb; }

      &.selected {
        border-color: #2563eb;
        background: #eff6ff;
      }

      .card-icon-wrap {
        font-size: 1.3rem;
      }

      .card-type-text {
        display: flex;
        flex-direction: column;
        gap: 2px;

        strong {
          font-size: 0.78rem;
          color: #0f172a;
        }

        p {
          font-size: 0.68rem;
          color: #64748b;
          margin: 0;
          line-height: 1.3;
        }
      }
    }

    .form-grid-2 {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
    }

    .form-grid-3 {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
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
    }

    .mora-box {
      background: #fffbeb;
      border: 1px solid #fde68a;
      border-radius: 10px;
      padding: 12px;
    }

    .mora-input-wrap {
      display: flex;
      align-items: center;
      gap: 8px;

      .mora-input {
        width: 80px;
        background: #ffffff;
        font-weight: 700;
        color: #b45309;
      }

      .mora-badge {
        font-weight: 700;
        color: #b45309;
      }

      .mora-desc {
        font-size: 0.72rem;
        color: #92400e;
      }
    }

    .structure-checkboxes-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 10px;
      margin-top: 8px;

      .check-card {
        display: flex;
        align-items: flex-start;
        gap: 8px;
        border: 1px solid #e2e8f0;
        padding: 10px;
        border-radius: 8px;
        background: #f8fafc;
        cursor: pointer;

        input { margin-top: 3px; }

        div {
          display: flex;
          flex-direction: column;
          strong { font-size: 0.75rem; color: #1e293b; }
          span { font-size: 0.68rem; color: #64748b; }
        }
      }
    }

    .amenities-tags-grid {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-top: 8px;

      .amenity-chip {
        padding: 6px 12px;
        border-radius: 9999px;
        border: 1px solid #cbd5e1;
        background: #ffffff;
        font-size: 0.72rem;
        font-weight: 600;
        color: #334155;
        cursor: pointer;
        transition: all 0.15s ease;

        &:hover { background: #f1f5f9; }

        &.selected {
          background: #4338ca;
          color: #ffffff;
          border-color: #4338ca;
        }
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
export class PropertiesComponent implements OnInit {
  private api = inject(ApiService);
  currentProject = 'RESIDENCIAL MENA ARRIBA';
  activeTab = signal<CatalogTab>('inmuebles');
  searchFilter = '';
  statusFilter = 'ALL';

  showModalInmueble = signal(false);
  showGenericModal = signal(false);

  ngOnInit() {
    this.refreshProperties();
  }

  // Tab 1: Inmuebles
  inmuebles = signal<ProjectInmueble[]>([]);

  refreshProperties() {
    this.api.get<any[]>('properties', []).subscribe({
      next: (data: any[]) => {
        const mapped = (data || []).map((d: any) => ({
          id: d.id,
          tenantId: d.tenantId,
          nombre: d.name,
          direccion: d.address || '—',
          rnc: 'N/A', // No está en el backend
          moraPct: 10,
          tipo: 'Condominio',
          amenidades: [],
          contacto: '—',
          estado: 'ACTIVO' as const
        }));
        this.inmuebles.set(mapped);
      },
      error: (err: any) => console.error('Error fetching properties', err)
    });
  }

  // Tab 2: Unidades
  unidades = signal<UnitItem[]>([
    { id: 1, codigo: '14-A-F-1A', detalle: '4to Piso, 3 habs, Manzana A Edificio F', estado: 'Activo' },
    { id: 2, codigo: '14-A-F-1B', detalle: '1er Piso, 2 habs, Manzana A Edificio F', estado: 'Activo' }
  ]);

  // Tab 3: Edificios
  edificios = signal<BuildingItem[]>([
    { id: 1, nombre: 'Edificio A', niveles: 4, estado: 'Activo' },
    { id: 2, nombre: 'Edificio F', niveles: 4, estado: 'Activo' }
  ]);

  // Tab 4: Manzanas
  manzanas = signal<BlockItem[]>([
    { id: 1, manzana: 'A', descripcion: 'Sector Principal Entrada Oeste', estado: 'Activo' },
    { id: 2, manzana: 'B', descripcion: 'Sector Jardines Este', estado: 'Activo' }
  ]);

  // Tab 5: Tipos de Propiedades
  tiposPropiedades = signal<PropertyTypeItem[]>([
    { id: 1, codigo: 'VILLA', nombre: 'Villa Residencial', descripcion: 'Inmueble unifamiliar vacacional con áreas comunes exclusivas', color: '#2563eb', reqEdificio: false, reqNivel: true, estado: 'Activo' },
    { id: 2, codigo: 'NAVE', nombre: 'Nave Industrial', descripcion: 'Módulo logístico de almacenamiento', color: '#f59e0b', reqEdificio: false, reqNivel: false, estado: 'Activo' },
    { id: 3, codigo: 'LOCAL', nombre: 'Local Comercial', descripcion: 'Punto de venta y retail', color: '#10b981', reqEdificio: true, reqNivel: true, estado: 'Activo' }
  ]);

  // Tab 6: Cuotas de Mantenimiento
  cuotas = signal<MaintenanceFeeItem[]>([
    { id: 1, codigo: 'CUOTA_BASE_A', tipoInmueble: 'Apartamento', montoBase: 500.00, estado: 'Activo' },
    { id: 2, codigo: 'CUOTA_LOCAL_COM', tipoInmueble: 'Local Comercial', montoBase: 1200.00, estado: 'Activo' }
  ]);

  // Tab 7: Cuentas Bancarias
  bancos = signal<BankAccountItem[]>([
    { id: 1, banco: 'Banco Popular Dominicano', numeroCuenta: '784561230', tipo: 'Corriente', titular: 'Residencial Mena Arriba', balanceInicial: 345800.00, estado: 'Activo' },
    { id: 2, banco: 'Banreservas', numeroCuenta: '960012455', tipo: 'Ahorro', titular: 'Residencial Mena Arriba Fondo Reserva', balanceInicial: 120450.00, estado: 'Activo' }
  ]);

  // Tab 8: Proveedores
  proveedores = signal<SupplierItem[]>([
    { id: 1, rnc: '1-32-29831-2', nombre: 'ASTEJE SERVICIOS', telefono: '809-555-4321', correo: 'contacto@asteje.com', direccion: 'Av. Las Américas #45', estado: 'Activo' },
    { id: 2, rnc: '1-01-02345-6', nombre: 'EDESUR DOMINICANA', telefono: '809-683-9393', correo: 'soporte@edesur.com.do', direccion: 'Av. Tiradentes', estado: 'Activo' }
  ]);

  // Tab 9: Conceptos Facturables (Matching Captura 23)
  conceptos = signal<ConceptItem[]>([
    { id: 1, concepto: 'Cuota de Mantenimiento', categoria: 'Mantenimiento', montoPredeterminado: 0.00, descripcion: 'Cuota regular mensual de mantenimiento', estado: 'ACTIVO' },
    { id: 2, concepto: 'Consumo de Gas Común', categoria: 'Gas', montoPredeterminado: 0.00, descripcion: 'Servicio de gas medido o cuota fija', estado: 'ACTIVO' },
    { id: 3, concepto: 'Recogida de Basura', categoria: 'Basura', montoPredeterminado: 0.00, descripcion: 'Servicio de recolección de desechos sólidos', estado: 'ACTIVO' },
    { id: 4, concepto: 'Recargo por Mora', categoria: 'Recargo', montoPredeterminado: 0.00, descripcion: 'Recargo porcentual o fijo por atraso de pago', estado: 'ACTIVO' },
    { id: 5, concepto: 'Cuota Extraordinaria', categoria: 'Extraordinaria', montoPredeterminado: 0.00, descripcion: 'Aportes extraordinarios de capital o proyectos', estado: 'ACTIVO' }
  ]);

  // Tab 10: Categorías de Gastos (Matching Captura 23)
  categoriasGastos = signal<ExpenseCategoryItem[]>([
    { id: 1, categoria: 'PAGO SUPLIDOR', descripcion: 'telefonía Claro', residencial: 'RESIDENCIAL MENA ARRIBA', estado: 'ACTIVO' },
    { id: 2, categoria: 'PROVEEDOR', descripcion: 'FUMIGACION', residencial: 'RESIDENCIAL MENA ARRIBA', estado: 'ACTIVO' },
    { id: 3, categoria: 'NOMINA', descripcion: 'NOMINA PERSONAL FIJO', residencial: 'RESIDENCIAL MENA ARRIBA', estado: 'ACTIVO' },
    { id: 4, categoria: 'Mantenimiento y Reparaciones', descripcion: 'Mantenimiento preventivo, correctivo e infraestructura general', residencial: 'RESIDENCIAL MENA ARRIBA', estado: 'ACTIVO' },
    { id: 5, categoria: 'Servicios Públicos', descripcion: 'Electricidad de áreas comunes, agua, gas y servicios básicos', residencial: 'RESIDENCIAL MENA ARRIBA', estado: 'ACTIVO' },
    { id: 6, categoria: 'Seguridad y Vigilancia', descripcion: 'Servicio de guardianía, cámaras y control de acceso', residencial: 'RESIDENCIAL MENA ARRIBA', estado: 'ACTIVO' },
    { id: 7, categoria: 'Limpieza y Conserjería', descripcion: 'Insumos de limpieza, conserje y mantenimiento de áreas comunes', residencial: 'RESIDENCIAL MENA ARRIBA', estado: 'ACTIVO' },
    { id: 8, categoria: 'Nómina y Personal', descripcion: 'Sueldos, incentivos y cargas laborales de empleados fijos', residencial: 'RESIDENCIAL MENA ARRIBA', estado: 'ACTIVO' }
  ]);

  // Form State for Inmueble
  selectedInmuebleType = 'Residencial / Urbanización';
  selectedAmenities = new Set<string>(['Seguridad 24/7 / Garita', 'Áreas Verdes / Jardines']);

  availableAmenities = [
    'Piscina / Jacuzzi',
    'Gimnasio Equipado',
    'Lobby Climatizado',
    'Seguridad 24/7 / Garita',
    'Planta Eléctrica Total',
    'Ascensores de Alta Velocidad',
    'Gazebo / Terraza Social / BBQ',
    'Área de Juegos Infantiles',
    'Cancha Tenis / Pádel',
    'Cancha Baloncesto / Multiuso',
    'Parqueo de Visitas',
    'Salón de Eventos',
    'Muelles de Carga / Patios',
    'Áreas Verdes / Jardines',
    'Gas Común / Cisterna / Pozo',
    'CCTV / Cámaras de Vigilancia',
    'Portón Eléctrico Automático'
  ];

  newInmueble: any = {
    nombre: '',
    rnc: '',
    telefono: '',
    correo: '',
    oficina: '',
    moraPct: 5,
    direccion: '',
    sector: '',
    ciudad: 'Santo Domingo',
    provincia: 'Santo Domingo',
    hasManzanas: true,
    hasEdificios: true,
    hasNiveles: true,
    hasNaves: false,
    hasLocales: false,
    estado: 'ACTIVO'
  };

  genericForm: any = { estado: 'Activo' };

  // Filtered computed lists
  filteredInmuebles = computed(() => {
    let list = this.inmuebles();
    if (this.statusFilter !== 'ALL') list = list.filter(i => i.estado === this.statusFilter);
    if (this.searchFilter.trim()) {
      const q = this.searchFilter.toLowerCase();
      list = list.filter(i => i.nombre.toLowerCase().includes(q) || i.direccion.toLowerCase().includes(q));
    }
    return list;
  });

  filteredUnidades = computed(() => this.unidades().filter(u => !this.searchFilter || u.codigo.toLowerCase().includes(this.searchFilter.toLowerCase())));
  filteredEdificios = computed(() => this.edificios().filter(e => !this.searchFilter || e.nombre.toLowerCase().includes(this.searchFilter.toLowerCase())));
  filteredManzanas = computed(() => this.manzanas().filter(m => !this.searchFilter || m.manzana.toLowerCase().includes(this.searchFilter.toLowerCase())));
  filteredTiposPropiedades = computed(() => this.tiposPropiedades().filter(tp => !this.searchFilter || tp.nombre.toLowerCase().includes(this.searchFilter.toLowerCase())));
  filteredCuotas = computed(() => this.cuotas().filter(c => !this.searchFilter || c.codigo.toLowerCase().includes(this.searchFilter.toLowerCase())));
  filteredBancos = computed(() => this.bancos().filter(b => !this.searchFilter || b.banco.toLowerCase().includes(this.searchFilter.toLowerCase()) || b.numeroCuenta.includes(this.searchFilter)));
  filteredProveedores = computed(() => this.proveedores().filter(p => !this.searchFilter || p.nombre.toLowerCase().includes(this.searchFilter.toLowerCase()) || p.rnc.includes(this.searchFilter)));
  filteredConceptos = computed(() => this.conceptos().filter(c => !this.searchFilter || c.concepto.toLowerCase().includes(this.searchFilter.toLowerCase()) || c.categoria.toLowerCase().includes(this.searchFilter.toLowerCase())));
  filteredCategoriasGastos = computed(() => this.categoriasGastos().filter(g => !this.searchFilter || g.categoria.toLowerCase().includes(this.searchFilter.toLowerCase()) || g.descripcion.toLowerCase().includes(this.searchFilter.toLowerCase())));

  getTabLabel(tab: CatalogTab): string {
    const map: Record<CatalogTab, string> = {
      inmuebles: 'Inmuebles / Proyectos',
      unidades: 'Apartamentos / Unidades',
      edificios: 'Edificios / Torres',
      manzanas: 'Manzanas / Sectores',
      tipos_propiedades: 'Tipos de Propiedades',
      cuotas: 'Cuotas de Mantenimiento',
      bancos: 'Cuentas Bancarias',
      proveedores: 'Proveedores',
      conceptos: 'Conceptos y Servicios Facturables',
      categorias_gastos: 'Categorías de Gastos / Egresos'
    };
    return map[tab] || tab;
  }

  toggleAmenity(am: string): void {
    if (this.selectedAmenities.has(am)) {
      this.selectedAmenities.delete(am);
    } else {
      this.selectedAmenities.add(am);
    }
  }

  openCreateModal(): void {
    if (this.activeTab() === 'inmuebles') {
      this.showModalInmueble.set(true);
    } else {
      this.genericForm = { estado: 'Activo' };
      this.showGenericModal.set(true);
    }
  }

  closeModalInmueble(): void {
    this.showModalInmueble.set(false);
  }

  saveInmueble(): void {
    if (!this.newInmueble.nombre) {
      alert('Por favor complete el nombre del inmueble.');
      return;
    }

    const dto = {
      name: this.newInmueble.nombre,
      address: this.newInmueble.direccion
    };

    this.api.post<any>('properties', dto).subscribe({
      next: () => {
        this.refreshProperties();
        this.closeModalInmueble();
      },
      error: (err: any) => {
        console.error('Error al guardar propiedad', err);
        alert('No se pudo crear la propiedad.');
      }
    });
  }

  saveGenericItem(): void {
    const tab = this.activeTab();
    if (tab === 'unidades') {
      if (!this.genericForm.codigo) return;
      this.unidades.update(l => [...l, { id: l.length + 1, codigo: this.genericForm.codigo, detalle: this.genericForm.detalle || '', estado: this.genericForm.estado }]);
    } else if (tab === 'bancos') {
      if (!this.genericForm.banco || !this.genericForm.numeroCuenta) return;
      this.bancos.update(l => [...l, { id: l.length + 1, banco: this.genericForm.banco, numeroCuenta: this.genericForm.numeroCuenta, tipo: this.genericForm.tipoCuenta || 'Corriente', titular: this.genericForm.titular || '', balanceInicial: 0, estado: this.genericForm.estado }]);
    } else if (tab === 'proveedores') {
      if (!this.genericForm.nombre) return;
      this.proveedores.update(l => [...l, { id: l.length + 1, rnc: this.genericForm.rnc || 'N/A', nombre: this.genericForm.nombre, telefono: this.genericForm.telefono || '', correo: this.genericForm.correo || '', direccion: '', estado: this.genericForm.estado }]);
    } else if (tab === 'categorias_gastos') {
      if (!this.genericForm.categoriaGasto) return;
      this.categoriasGastos.update(l => [...l, { id: l.length + 1, categoria: this.genericForm.categoriaGasto, descripcion: this.genericForm.descripcionGasto || '', residencial: 'RESIDENCIAL MENA ARRIBA', estado: 'ACTIVO' }]);
    }
    this.showGenericModal.set(false);
  }

  loadStandardTemplate(): void {
    alert('⚡ Se ha cargado la plantilla estándar de categorías de egresos para condominios de República Dominicana.');
  }

  refreshCurrentTab(): void {
    // Refresh action
  }

  editInmueble(p: ProjectInmueble): void {
    alert(`Editar inmueble: ${p.nombre}`);
  }

  toggleInmueble(p: ProjectInmueble): void {
    // Si existiera un endpoint para togglear estado:
    // this.api.put(`properties/${p.id}/status`, { status: p.estado === 'ACTIVO' ? 'INACTIVO' : 'ACTIVO' }).subscribe(...)
    this.inmuebles.update(list => list.map(i => i.id === p.id ? { ...i, estado: i.estado === 'ACTIVO' ? 'INACTIVO' : 'ACTIVO' } : i));
  }

  deleteInmueble(p: ProjectInmueble): void {
    if (confirm(`¿Está seguro de eliminar el inmueble "${p.nombre}"?`)) {
      this.api.delete<void>(`properties/${p.id}`).subscribe({
        next: () => this.refreshProperties(),
        error: (err: any) => console.error('Error al eliminar propiedad', err)
      });
    }
  }
}
