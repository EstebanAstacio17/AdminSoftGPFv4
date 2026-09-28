import { Component, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';

interface FacilityView {
  id: string;
  name: string;
  type: 'Barbecue' | 'EventRoom' | 'Pool' | 'Gym' | 'PaddleCourt';
  capacity: number;
  hourlyFee: number;
  cleaningFee: number;
  status: 'Available' | 'Maintenance';
}

interface BookingView {
  id: string;
  facilityName: string;
  residentName: string;
  unitNumber: string;
  date: string;
  timeSlot: string;
  totalCost: number;
  status: 'Confirmed' | 'PendingApproval' | 'Cancelled';
}

@Component({
  selector: 'app-facilities',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page-header">
      <div>
        <h1 class="page-title">Amenidades y Reservas de Áreas Comunes</h1>
        <p class="page-subtitle">Gestión de quinchos, salas de eventos, canchas y aforos con control de cobro automático.</p>
      </div>
      <button class="btn btn-primary" (click)="openBookingModal()">
        <span>+ Nueva Reserva</span>
      </button>
    </div>

    <!-- Catálogo de Amenidades Disponibles -->
    <div class="facilities-grid">
      <div *ngFor="let f of facilities()" class="gpf-card facility-card">
        <div class="facility-icon">{{ getFacilityIcon(f.type) }}</div>
        <div class="facility-body">
          <div class="facility-header">
            <h3>{{ f.name }}</h3>
            <span class="badge" [class.badge-success]="f.status === 'Available'" [class.badge-warning]="f.status === 'Maintenance'">
              {{ f.status === 'Available' ? 'Disponible' : 'En Mantención' }}
            </span>
          </div>
          <div class="facility-details">
            <span>👥 Aforo máx: <strong>{{ f.capacity }} personas</strong></span>
            <span>💰 Tarifa: <strong>&#36;{{ f.hourlyFee | number }} / bloque</strong></span>
            <span>🧹 Aseo: <strong>&#36;{{ f.cleaningFee | number }}</strong></span>
          </div>
          <button class="btn btn-outline btn-block" (click)="quickReserve(f)">Reservar Espacio</button>
        </div>
      </div>
    </div>

    <!-- Calendario / Listado de Reservas Confirmadas -->
    <div class="gpf-card bookings-section">
      <h2>Próximas Reservas Agendadas</h2>
      <div class="table-container">
        <table class="table-clean">
          <thead>
            <tr>
              <th>Espacio Común</th>
              <th>Residente & Unidad</th>
              <th>Fecha del Evento</th>
              <th>Horario / Bloque</th>
              <th>Costo Total</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let b of bookings()">
              <td><strong>{{ b.facilityName }}</strong></td>
              <td>
                <div>
                  <strong>{{ b.residentName }}</strong>
                  <div class="text-secondary text-xs">Unidad {{ b.unitNumber }}</div>
                </div>
              </td>
              <td>{{ b.date }}</td>
              <td><span class="slot-pill">{{ b.timeSlot }}</span></td>
              <td><span class="amount-executive">&#36;{{ b.totalCost | number }}</span></td>
              <td>
                <span class="badge" [class.badge-success]="b.status === 'Confirmed'" [class.badge-warning]="b.status === 'PendingApproval'">
                  {{ b.status === 'Confirmed' ? 'Confirmada' : 'Pendiente Pago' }}
                </span>
              </td>
              <td>
                <button class="btn btn-outline btn-xs" (click)="cancelBooking(b)">Cancelar</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Modal Reservar -->
    <div class="modal-overlay" *ngIf="showModal()">
      <div class="modal-dialog gpf-card">
        <div class="modal-header">
          <h3>Agendar Espacio Común</h3>
          <button class="btn-close" (click)="closeModal()">✕</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>Amenidad / Espacio</label>
            <select [(ngModel)]="newBooking.facilityId">
              <option *ngFor="let f of facilities()" [value]="f.id">{{ f.name }} (&#36;{{ f.hourlyFee }} / bloque)</option>
            </select>
          </div>
          <div class="form-group">
            <label>Unidad Inmobiliaria</label>
            <input type="text" [(ngModel)]="newBooking.unitNumber" placeholder="Ej. 101" />
          </div>
          <div class="form-group">
            <label>Fecha de la Reserva</label>
            <input type="date" [(ngModel)]="newBooking.date" />
          </div>
          <div class="form-group">
            <label>Bloque Horario</label>
            <select [(ngModel)]="newBooking.timeSlot">
              <option value="12:00 - 17:00 (Almuerzo)">12:00 - 17:00 (Almuerzo)</option>
              <option value="18:00 - 23:30 (Cena / Noche)">18:00 - 23:30 (Cena / Noche)</option>
            </select>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-outline" (click)="closeModal()">Cancelar</button>
          <button class="btn btn-primary" (click)="saveBooking()">Confirmar y Cargar a Factura</button>
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

    .facilities-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
      gap: 20px;
      margin-bottom: 28px;

      .facility-card {
        display: flex;
        flex-direction: column;
        gap: 12px;

        .facility-icon {
          font-size: 2.25rem;
        }

        .facility-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;

          h3 {
            font-size: 1.0625rem;
            font-weight: 600;
          }
        }

        .facility-details {
          display: flex;
          flex-direction: column;
          gap: 4px;
          font-size: 0.8125rem;
          color: var(--text-secondary);
          margin: 12px 0;
        }

        .btn-block {
          width: 100%;
        }
      }
    }

    .bookings-section {
      h2 {
        font-size: 1.125rem;
        font-weight: 600;
        margin-bottom: 16px;
      }
    }

    .slot-pill {
      font-size: 0.75rem;
      padding: 2px 8px;
      background-color: var(--bg-app);
      border-radius: 4px;
      border: 1px solid var(--border-color);
    }

    .text-xs {
      font-size: 0.75rem;
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
export class FacilitiesComponent implements OnInit {
  facilities = signal<FacilityView[]>([
    {
      id: 'fac-01',
      name: 'Quincho Panorámico Piso 17',
      type: 'Barbecue',
      capacity: 25,
      hourlyFee: 25000,
      cleaningFee: 15000,
      status: 'Available'
    },
    {
      id: 'fac-02',
      name: 'Salón de Eventos & Lounge',
      type: 'EventRoom',
      capacity: 50,
      hourlyFee: 40000,
      cleaningFee: 25000,
      status: 'Available'
    },
    {
      id: 'fac-03',
      name: 'Cancha de Pádel Cristal',
      type: 'PaddleCourt',
      capacity: 4,
      hourlyFee: 12000,
      cleaningFee: 0,
      status: 'Available'
    }
  ]);

  bookings = signal<BookingView[]>([
    {
      id: 'bk-01',
      facilityName: 'Quincho Panorámico Piso 17',
      residentName: 'Carlos Silva',
      unitNumber: '101',
      date: '2026-10-03',
      timeSlot: '18:00 - 23:30 (Cena / Noche)',
      totalCost: 40000,
      status: 'Confirmed'
    },
    {
      id: 'bk-02',
      facilityName: 'Cancha de Pádel Cristal',
      residentName: 'Rodrigo Fuentes',
      unitNumber: '201',
      date: '2026-09-28',
      timeSlot: '19:00 - 20:30',
      totalCost: 12000,
      status: 'Confirmed'
    }
  ]);

  showModal = signal(false);
  newBooking = {
    facilityId: 'fac-01',
    unitNumber: '102',
    date: '2026-10-04',
    timeSlot: '18:00 - 23:30 (Cena / Noche)'
  };

  constructor(private api: ApiService) {}

  ngOnInit(): void {
    this.loadAmenities();
  }

  loadAmenities(): void {
    this.api.get<any[]>('properties', []).subscribe(props => {
      const propertyId = props && props.length > 0 ? props[0].id : 'a1b2c3d4-0000-0000-0000-000000000001';
      this.api.get<any[]>(`facilities/amenities/property/${propertyId}`, []).subscribe(res => {
        if (res && res.length > 0) {
          const mapped: FacilityView[] = res.map((f, idx) => ({
            id: f.id,
            name: f.name,
            type: 'EventRoom',
            capacity: f.capacity || 20,
            hourlyFee: f.hourlyRate || 500,
            cleaningFee: 0,
            status: f.isActive ? 'Available' : 'Maintenance'
          }));
          this.facilities.set(mapped);
        }
      });
    });
  }

  getFacilityIcon(type: string): string {
    switch (type) {
      case 'Barbecue': return '🍖';
      case 'EventRoom': return '🎉';
      case 'PaddleCourt': return '🎾';
      case 'Pool': return '🏊';
      case 'Gym': return '🏋️';
      default: return '🏢';
    }
  }

  quickReserve(facility: FacilityView): void {
    this.newBooking.facilityId = facility.id;
    this.showModal.set(true);
  }

  openBookingModal(): void {
    this.showModal.set(true);
  }

  closeModal(): void {
    this.showModal.set(false);
  }

  saveBooking(): void {
    const facility = this.facilities().find(f => f.id === this.newBooking.facilityId);
    if (!facility) return;

    const payload = {
      amenityId: facility.id.startsWith('fac-') ? 'a1b2c3d4-0000-0000-0000-000000000001' : facility.id,
      personId: 'p1q2r3s4-0000-0000-0000-000000000001',
      unitId: 'u1v2w3x4-0000-0000-0000-000000000001',
      startTime: `${this.newBooking.date}T18:00:00`,
      endTime: `${this.newBooking.date}T23:30:00`,
      totalAmount: facility.hourlyFee + facility.cleaningFee
    };

    this.api.post<any>('facilities/bookings', payload).subscribe({
      next: (res) => {
        const b: BookingView = {
          id: res?.id || ('bk-0' + (this.bookings().length + 1)),
          facilityName: facility.name,
          residentName: 'Residente Principal',
          unitNumber: this.newBooking.unitNumber,
          date: this.newBooking.date,
          timeSlot: this.newBooking.timeSlot,
          totalCost: facility.hourlyFee + facility.cleaningFee,
          status: 'Confirmed'
        };
        this.bookings.update(list => [b, ...list]);
        this.closeModal();
      }
    });
  }

  cancelBooking(b: BookingView): void {
    this.bookings.update(list => list.filter(item => item.id !== b.id));
  }
}
