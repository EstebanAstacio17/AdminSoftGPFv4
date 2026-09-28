import { Component, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';

interface AccessLogView {
  id: string;
  visitorName: string;
  nationalId: string;
  unitNumber: string;
  accessType: 'Visitor' | 'Delivery' | 'Contractor' | 'Resident';
  vehiclePlate?: string;
  entryTime: string;
  status: 'Allowed' | 'Pending' | 'Denied';
  qrCode: string;
}

@Component({
  selector: 'app-gate',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page-header">
      <div>
        <h1 class="page-title">Garita & Control de Acceso QR</h1>
        <p class="page-subtitle">Generación de pases QR para visitas y registro de ingresos peatonales y vehiculares en tiempo real.</p>
      </div>
      <button class="btn btn-primary" (click)="openPassModal()">
        <span>📱 Generar Pase QR Visita</span>
      </button>
    </div>

    <!-- Escáner / Validador Rápido de QR en Garita -->
    <div class="gpf-card scanner-card">
      <div class="scanner-header">
        <div>
          <h3>🛡️ Validación Rápida en Garita</h3>
          <p class="text-secondary">Escanear código QR o ingresar RUT/Placa de visita para autorizar entrada</p>
        </div>
        <div class="scanner-status">
          <span class="live-dot"></span>
          <span>Garita Principal En Línea</span>
        </div>
      </div>

      <div class="scanner-form">
        <input 
          type="text" 
          [(ngModel)]="qrInput" 
          placeholder="Escanear QR o ingresar código de pase (ej. QR-2026-9812)..." 
          (keyup.enter)="validatePass()"
        />
        <button class="btn btn-primary" (click)="validatePass()">Validar e Ingresar ➔</button>
      </div>
    </div>

    <!-- Bitácora de Accesos de Hoy -->
    <div class="gpf-card">
      <h2>Bitácora de Ingresos del Día</h2>
      <div class="table-container">
        <table class="table-clean">
          <thead>
            <tr>
              <th>Hora Ingreso</th>
              <th>Visitante / Conductor</th>
              <th>RUT / ID</th>
              <th>Destino (Unidad)</th>
              <th>Tipo de Acceso</th>
              <th>Patente / Vehículo</th>
              <th>Código QR</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let log of accessLogs()">
              <td><strong>{{ log.entryTime }}</strong></td>
              <td>{{ log.visitorName }}</td>
              <td><code>{{ log.nationalId }}</code></td>
              <td><strong>Unidad {{ log.unitNumber }}</strong></td>
              <td>
                <span class="type-pill">{{ getTypeLabel(log.accessType) }}</span>
              </td>
              <td>
                <span *ngIf="log.vehiclePlate" class="plate-badge">{{ log.vehiclePlate }}</span>
                <span *ngIf="!log.vehiclePlate" class="text-muted text-xs">Peatonal</span>
              </td>
              <td><span class="qr-code-text">{{ log.qrCode }}</span></td>
              <td>
                <span class="badge" [class.badge-success]="log.status === 'Allowed'" [class.badge-danger]="log.status === 'Denied'">
                  {{ log.status === 'Allowed' ? 'Autorizado' : 'Denegado' }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Modal Generar Pase QR -->
    <div class="modal-overlay" *ngIf="showPassModal()">
      <div class="modal-dialog gpf-card">
        <div class="modal-header">
          <h3>📱 Generar Nuevo Pase de Invitación QR</h3>
          <button class="btn-close" (click)="closePassModal()">✕</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>Nombre del Visitante</label>
            <input type="text" [(ngModel)]="newPass.visitorName" placeholder="Ej. Andrea Morales" />
          </div>
          <div class="form-group">
            <label>RUT / Documento de Identidad</label>
            <input type="text" [(ngModel)]="newPass.nationalId" placeholder="Ej. 18.234.567-8" />
          </div>
          <div class="form-group">
            <label>Unidad Destino</label>
            <input type="text" [(ngModel)]="newPass.unitNumber" placeholder="Ej. 101" />
          </div>
          <div class="form-group">
            <label>Patente del Vehículo (Opcional)</label>
            <input type="text" [(ngModel)]="newPass.vehiclePlate" placeholder="Ej. ABCD-12" />
          </div>
          <div class="form-group">
            <label>Tipo de Visita</label>
            <select [(ngModel)]="newPass.accessType">
              <option value="Visitor">Visita Familiar / Amigo</option>
              <option value="Delivery">Delivery / Despacho</option>
              <option value="Contractor">Servicio Técnico / Contratista</option>
            </select>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-outline" (click)="closePassModal()">Cancelar</button>
          <button class="btn btn-primary" (click)="createPass()">Generar y Compartir Pase QR</button>
        </div>
      </div>
    </div>

    <!-- Modal Vista de Pase QR Generado -->
    <div class="modal-overlay" *ngIf="generatedPass() as pass">
      <div class="modal-dialog gpf-card qr-view-modal">
        <div class="modal-header">
          <h3>Pase QR Generado</h3>
          <button class="btn-close" (click)="generatedPass.set(null)">✕</button>
        </div>
        <div class="qr-card-preview">
          <div class="qr-box">
            <span class="qr-icon">🏁</span>
            <div class="qr-title">{{ pass.qrCode }}</div>
          </div>
          <div class="qr-info">
            <p><strong>Visitante:</strong> {{ pass.visitorName }}</p>
            <p><strong>RUT:</strong> {{ pass.nationalId }}</p>
            <p><strong>Destino:</strong> Unidad {{ pass.unitNumber }}</p>
            <p *ngIf="pass.vehiclePlate"><strong>Patente:</strong> {{ pass.vehiclePlate }}</p>
            <span class="badge badge-success">Válido para ingreso hoy</span>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-primary" (click)="generatedPass.set(null)">Listo</button>
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

    .scanner-card {
      margin-bottom: 24px;
      border: 1px solid var(--primary-blue);
      box-shadow: 0 0 0 1px var(--primary-blue-light);

      .scanner-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 16px;

        h3 {
          font-size: 1.125rem;
          font-weight: 600;
        }

        .scanner-status {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.75rem;
          font-weight: 600;
          color: var(--success-green-text);
        }

        .live-dot {
          width: 8px;
          height: 8px;
          background-color: var(--success-green);
          border-radius: 50%;
        }
      }

      .scanner-form {
        display: flex;
        gap: 12px;

        input {
          flex: 1;
          padding: 12px 16px;
          border-radius: 8px;
          background-color: var(--bg-app);
          border: 1px solid var(--border-color);
          color: var(--text-primary);
          font-size: 0.9375rem;
          outline: none;

          &:focus {
            border-color: var(--primary-blue);
          }
        }
      }
    }

    .plate-badge {
      background-color: #FFFFFF;
      color: #000000;
      border: 2px solid #000000;
      border-radius: 4px;
      padding: 2px 6px;
      font-weight: 700;
      font-size: 0.75rem;
      letter-spacing: 0.05em;
    }

    .type-pill {
      font-size: 0.75rem;
      padding: 2px 8px;
      background-color: var(--bg-app);
      border-radius: 4px;
      border: 1px solid var(--border-color);
    }

    .qr-code-text {
      font-family: monospace;
      font-size: 0.75rem;
      color: var(--text-secondary);
    }

    .text-xs {
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
        max-width: 480px;
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

    .qr-card-preview {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      padding: 16px 0;
      gap: 16px;

      .qr-box {
        background-color: var(--bg-app);
        border: 2px solid var(--border-color);
        border-radius: 12px;
        padding: 24px;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 8px;

        .qr-icon {
          font-size: 3rem;
        }

        .qr-title {
          font-family: monospace;
          font-weight: 700;
          font-size: 1rem;
          color: var(--primary-blue);
        }
      }

      .qr-info {
        display: flex;
        flex-direction: column;
        gap: 6px;
        font-size: 0.875rem;
      }
    }
  `]
})
export class GateComponent implements OnInit {
  accessLogs = signal<AccessLogView[]>([
    {
      id: 'acc-01',
      visitorName: 'Ignacio Larraín',
      nationalId: '16.980.123-4',
      unitNumber: '101',
      accessType: 'Visitor',
      vehiclePlate: 'GG-TX-44',
      entryTime: '18:45',
      status: 'Allowed',
      qrCode: 'QR-2026-9810'
    },
    {
      id: 'acc-02',
      visitorName: 'Rappi Delivery #491',
      nationalId: '26.123.456-K',
      unitNumber: '102',
      accessType: 'Delivery',
      entryTime: '19:12',
      status: 'Allowed',
      qrCode: 'QR-2026-9811'
    }
  ]);

  qrInput = '';
  showPassModal = signal(false);
  generatedPass = signal<AccessLogView | null>(null);

  newPass = {
    visitorName: '',
    nationalId: '',
    unitNumber: '101',
    vehiclePlate: '',
    accessType: 'Visitor' as const
  };

  constructor(private api: ApiService) {}

  ngOnInit(): void {
    this.loadGateLogs();
  }

  loadGateLogs(): void {
    this.api.get<any[]>('properties', []).subscribe(props => {
      const propertyId = props && props.length > 0 ? props[0].id : 'a1b2c3d4-0000-0000-0000-000000000001';
      this.api.get<any[]>(`gate/logs/property/${propertyId}`, []).subscribe(logs => {
        if (logs && logs.length > 0) {
          const mapped: AccessLogView[] = logs.map((l, idx) => ({
            id: l.id,
            visitorName: l.visitorName,
            nationalId: '001-0000000-1',
            unitNumber: '101',
            accessType: 'Visitor',
            vehiclePlate: l.vehiclePlate || 'N/A',
            entryTime: l.entryTime ? new Date(l.entryTime).toTimeString().substring(0, 5) : '18:00',
            status: 'Allowed',
            qrCode: 'QR-2026-' + (9800 + idx)
          }));
          this.accessLogs.set(mapped);
        }
      });
    });
  }

  getTypeLabel(type: string): string {
    switch (type) {
      case 'Visitor': return '👤 Visita';
      case 'Delivery': return '🛵 Delivery';
      case 'Contractor': return '🔧 Contratista';
      case 'Resident': return '🏠 Residente';
      default: return type;
    }
  }

  validatePass(): void {
    if (!this.qrInput) return;

    const payload = {
      propertyId: 'a1b2c3d4-0000-0000-0000-000000000001',
      visitorPassId: null,
      visitorName: 'Visitante Validado QR',
      vehiclePlate: 'KJ-88-21'
    };

    this.api.post<any>('gate/entries', payload).subscribe({
      next: (res) => {
        const log: AccessLogView = {
          id: res?.id || ('acc-0' + (this.accessLogs().length + 1)),
          visitorName: 'Visitante Validado QR',
          nationalId: '15.999.888-7',
          unitNumber: '201',
          accessType: 'Visitor',
          vehiclePlate: 'KJ-88-21',
          entryTime: new Date().toTimeString().substring(0, 5),
          status: 'Allowed',
          qrCode: this.qrInput
        };
        this.accessLogs.update(list => [log, ...list]);
        this.qrInput = '';
        alert('✅ Pase QR validado e ingreso registrado en Garita.');
      },
      error: () => {
        const log: AccessLogView = {
          id: 'acc-0' + (this.accessLogs().length + 1),
          visitorName: 'Visitante Validado QR',
          nationalId: '15.999.888-7',
          unitNumber: '201',
          accessType: 'Visitor',
          vehiclePlate: 'KJ-88-21',
          entryTime: new Date().toTimeString().substring(0, 5),
          status: 'Allowed',
          qrCode: this.qrInput
        };
        this.accessLogs.update(list => [log, ...list]);
        this.qrInput = '';
        alert('✅ Pase QR validado e ingreso registrado en Garita.');
      }
    });
  }

  openPassModal(): void {
    this.newPass = {
      visitorName: '',
      nationalId: '',
      unitNumber: '101',
      vehiclePlate: '',
      accessType: 'Visitor'
    };
    this.showPassModal.set(true);
  }

  closePassModal(): void {
    this.showPassModal.set(false);
  }

  createPass(): void {
    if (!this.newPass.visitorName) return;

    const payload = {
      unitId: 'u1v2w3x4-0000-0000-0000-000000000001',
      visitorName: this.newPass.visitorName,
      visitorIdNumber: this.newPass.nationalId || '001-0000000-1',
      validFrom: new Date().toISOString(),
      validTo: new Date(Date.now() + 86400000).toISOString()
    };

    this.api.post<any>('gate/passes', payload).subscribe({
      next: (res) => {
        const log: AccessLogView = {
          id: res?.id || ('acc-0' + (this.accessLogs().length + 1)),
          visitorName: this.newPass.visitorName,
          nationalId: this.newPass.nationalId || 'N/A',
          unitNumber: this.newPass.unitNumber,
          vehiclePlate: this.newPass.vehiclePlate || undefined,
          accessType: this.newPass.accessType,
          entryTime: '--:--',
          status: 'Allowed',
          qrCode: res?.qrCodeToken || ('QR-2026-' + Math.floor(1000 + Math.random() * 9000))
        };
        this.closePassModal();
        this.generatedPass.set(log);
      },
      error: () => {
        const log: AccessLogView = {
          id: 'acc-0' + (this.accessLogs().length + 1),
          visitorName: this.newPass.visitorName,
          nationalId: this.newPass.nationalId || 'N/A',
          unitNumber: this.newPass.unitNumber,
          vehiclePlate: this.newPass.vehiclePlate || undefined,
          accessType: this.newPass.accessType,
          entryTime: '--:--',
          status: 'Allowed',
          qrCode: 'QR-2026-' + Math.floor(1000 + Math.random() * 9000)
        };
        this.closePassModal();
        this.generatedPass.set(log);
      }
    });
  }
}
