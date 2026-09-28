import { Component, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';

interface TicketView {
  id: string;
  ticketNumber: string;
  title: string;
  category: 'Plumbing' | 'Electrical' | 'Elevator' | 'Noise' | 'CommonArea';
  priority: 'High' | 'Medium' | 'Low';
  status: 'Open' | 'InProgress' | 'Resolved' | 'Closed';
  createdAt: string;
  reportedBy: string;
  unitNumber: string;
  assignedTo?: string;
}

@Component({
  selector: 'app-helpdesk',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page-header">
      <div>
        <h1 class="page-title">Helpdesk e Incidencias</h1>
        <p class="page-subtitle">Gestión de tickets de mantención, reclamos de copropietarios y seguimiento de resoluciones.</p>
      </div>
      <button class="btn btn-primary" (click)="openTicketModal()">
        <span>+ Nuevo Ticket de Mantención</span>
      </button>
    </div>

    <!-- Tablero de Estado de Tickets -->
    <div class="stats-row">
      <div class="gpf-card stat-item">
        <span class="stat-label">Tickets Abiertos</span>
        <span class="stat-value amount-executive debt">{{ countStatus('Open') }}</span>
      </div>
      <div class="gpf-card stat-item">
        <span class="stat-label">En Progreso / Asignados</span>
        <span class="stat-value amount-executive">{{ countStatus('InProgress') }}</span>
      </div>
      <div class="gpf-card stat-item">
        <span class="stat-label">Resueltos (Este Mes)</span>
        <span class="stat-value amount-executive positive">{{ countStatus('Resolved') }}</span>
      </div>
      <div class="gpf-card stat-item">
        <span class="stat-label">Tiempo Promedio Resolución</span>
        <span class="stat-value amount-executive">4.2 hrs</span>
      </div>
    </div>

    <!-- Listado de Tickets -->
    <div class="gpf-card">
      <div class="table-container">
        <table class="table-clean">
          <thead>
            <tr>
              <th>Ticket</th>
              <th>Título & Categoría</th>
              <th>Prioridad</th>
              <th>Reportado Por</th>
              <th>Fecha Creación</th>
              <th>Asignado A</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let t of tickets()">
              <td><strong>{{ t.ticketNumber }}</strong></td>
              <td>
                <div>
                  <strong>{{ t.title }}</strong>
                  <div class="text-secondary text-xs">{{ getCategoryLabel(t.category) }}</div>
                </div>
              </td>
              <td>
                <span class="badge" [class.badge-danger]="t.priority === 'High'" [class.badge-warning]="t.priority === 'Medium'" [class.badge-primary]="t.priority === 'Low'">
                  {{ t.priority === 'High' ? 'Alta' : (t.priority === 'Medium' ? 'Media' : 'Baja') }}
                </span>
              </td>
              <td>
                <div>
                  <span>{{ t.reportedBy }}</span>
                  <div class="text-secondary text-xs">Unidad {{ t.unitNumber }}</div>
                </div>
              </td>
              <td>{{ t.createdAt }}</td>
              <td>{{ t.assignedTo || 'Sin asignar' }}</td>
              <td>
                <span class="badge" [class.badge-danger]="t.status === 'Open'" [class.badge-warning]="t.status === 'InProgress'" [class.badge-success]="t.status === 'Resolved'">
                  {{ getStatusLabel(t.status) }}
                </span>
              </td>
              <td>
                <div class="action-buttons">
                  <button *ngIf="t.status === 'Open'" class="btn btn-outline btn-xs" (click)="updateStatus(t, 'InProgress')">Asignar ➔</button>
                  <button *ngIf="t.status === 'InProgress'" class="btn btn-outline btn-xs" (click)="updateStatus(t, 'Resolved')">Resolver ✓</button>
                  <button *ngIf="t.status === 'Resolved'" class="btn btn-outline btn-xs" (click)="updateStatus(t, 'Closed')">Cerrar</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Modal Nuevo Ticket -->
    <div class="modal-overlay" *ngIf="showModal()">
      <div class="modal-dialog gpf-card">
        <div class="modal-header">
          <h3>Crear Ticket de Mantención / Incidencia</h3>
          <button class="btn-close" (click)="closeModal()">✕</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>Título Breve de la Incidencia</label>
            <input type="text" [(ngModel)]="newTicket.title" placeholder="Ej. Fuga de agua en pasillo piso 4" />
          </div>
          <div class="form-group">
            <label>Categoría</label>
            <select [(ngModel)]="newTicket.category">
              <option value="Plumbing">Gasfitería / Cañerías</option>
              <option value="Electrical">Electricidad e Iluminación</option>
              <option value="Elevator">Ascensores</option>
              <option value="CommonArea">Áreas Comunes / Fachada</option>
              <option value="Noise">Ruidos Molestos / Convivencia</option>
            </select>
          </div>
          <div class="form-group">
            <label>Prioridad</label>
            <select [(ngModel)]="newTicket.priority">
              <option value="High">Alta (Urgencia operacional)</option>
              <option value="Medium">Media</option>
              <option value="Low">Baja (Mantenimiento menor)</option>
            </select>
          </div>
          <div class="form-group">
            <label>Unidad Reportante</label>
            <input type="text" [(ngModel)]="newTicket.unitNumber" placeholder="Ej. 102" />
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-outline" (click)="closeModal()">Cancelar</button>
          <button class="btn btn-primary" (click)="saveTicket()">Crear Ticket</button>
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

    .text-xs {
      font-size: 0.75rem;
    }

    .action-buttons {
      display: flex;
      gap: 6px;
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
export class HelpdeskComponent implements OnInit {
  tickets = signal<TicketView[]>([
    {
      id: 't-01',
      ticketNumber: 'TCK-2026-0042',
      title: 'Ruido extraño en Ascensor Principal Torre A',
      category: 'Elevator',
      priority: 'High',
      status: 'InProgress',
      createdAt: '2026-09-27 08:30',
      reportedBy: 'Carlos Silva',
      unitNumber: '101',
      assignedTo: 'Técnico Schindler'
    },
    {
      id: 't-02',
      ticketNumber: 'TCK-2026-0041',
      title: 'Luz quemada en pasillo subterráneo -1',
      category: 'Electrical',
      priority: 'Low',
      status: 'Open',
      createdAt: '2026-09-26 19:10',
      reportedBy: 'María José Valenzuela',
      unitNumber: '102'
    },
    {
      id: 't-03',
      ticketNumber: 'TCK-2026-0040',
      title: 'Filtración menor en llave de paso jardín central',
      category: 'Plumbing',
      priority: 'Medium',
      status: 'Resolved',
      createdAt: '2026-09-25 11:20',
      reportedBy: 'Conserjería',
      unitNumber: 'Común',
      assignedTo: 'Juan Pérez (Mantención)'
    }
  ]);

  showModal = signal(false);
  newTicket: Partial<TicketView> = { category: 'Plumbing', priority: 'Medium' };

  constructor(private api: ApiService) {}

  ngOnInit(): void {
    this.loadTickets();
  }

  loadTickets(): void {
    this.api.get<any[]>('properties', []).subscribe(props => {
      const propertyId = props && props.length > 0 ? props[0].id : 'a1b2c3d4-0000-0000-0000-000000000001';
      this.api.get<any[]>(`helpdesk/property/${propertyId}`, []).subscribe(res => {
        if (res && res.length > 0) {
          const mapped: TicketView[] = res.map((t, idx) => ({
            id: t.id,
            ticketNumber: `TCK-2026-${String(idx + 50).padStart(4, '0')}`,
            title: t.title,
            category: 'CommonArea',
            priority: t.priority as any || 'Medium',
            status: t.status as any || 'Open',
            createdAt: t.createdAt || '2026-09-28 10:00',
            reportedBy: 'Residente',
            unitNumber: '101'
          }));
          this.tickets.set(mapped);
        }
      });
    });
  }

  countStatus(status: string): number {
    return this.tickets().filter(t => t.status === status).length;
  }

  getCategoryLabel(category: string): string {
    switch (category) {
      case 'Elevator': return '🛗 Ascensores';
      case 'Electrical': return '💡 Electricidad';
      case 'Plumbing': return '🚰 Gasfitería';
      case 'CommonArea': return '🏢 Áreas Comunes';
      case 'Noise': return '🔊 Ruidos Molestos';
      default: return category;
    }
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'Open': return 'Abierto';
      case 'InProgress': return 'En Progreso';
      case 'Resolved': return 'Resuelto';
      case 'Closed': return 'Cerrado';
      default: return status;
    }
  }

  updateStatus(ticket: TicketView, newStatus: any): void {
    this.api.patch<void>(`helpdesk/tickets/${ticket.id}/status`, { status: newStatus }).subscribe({
      next: () => {
        this.tickets.update(list => list.map(t => t.id === ticket.id ? { ...t, status: newStatus } : t));
      },
      error: () => {
        this.tickets.update(list => list.map(t => t.id === ticket.id ? { ...t, status: newStatus } : t));
      }
    });
  }

  openTicketModal(): void {
    this.newTicket = { category: 'Plumbing', priority: 'Medium' };
    this.showModal.set(true);
  }

  closeModal(): void {
    this.showModal.set(false);
  }

  saveTicket(): void {
    if (!this.newTicket.title) return;

    const payload = {
      propertyId: 'a1b2c3d4-0000-0000-0000-000000000001',
      unitId: null,
      reportedByPersonId: 'p1q2r3s4-0000-0000-0000-000000000001',
      title: this.newTicket.title,
      description: `Incidencia en categoría ${this.newTicket.category || 'General'}`,
      priority: this.newTicket.priority || 'Medium'
    };

    this.api.post<any>('helpdesk/tickets', payload).subscribe({
      next: (res) => {
        const t: TicketView = {
          id: res?.id || ('t-0' + (this.tickets().length + 1)),
          ticketNumber: 'TCK-2026-00' + (43 + this.tickets().length),
          title: this.newTicket.title || 'Nueva incidencia',
          category: this.newTicket.category as any || 'Plumbing',
          priority: this.newTicket.priority as any || 'Medium',
          status: 'Open',
          createdAt: '2026-09-28 ' + new Date().toTimeString().substring(0, 5),
          reportedBy: 'Administración',
          unitNumber: this.newTicket.unitNumber || '101'
        };
        this.tickets.update(list => [t, ...list]);
        this.closeModal();
      }
    });
  }
}
