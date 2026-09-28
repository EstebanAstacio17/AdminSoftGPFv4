import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="login-page">
      <div class="login-card">

        <!-- Logo -->
        <div class="login-header">
          <div class="brand">
            <span class="brand-admin">AdminSoft</span><span class="brand-gpf">GPF</span>
          </div>
          <p class="brand-subtitle">Sistema Empresarial de Administración General</p>
        </div>

        <!-- Tab switcher -->
        <div class="tab-switcher">
          <button
            class="tab-btn"
            [class.active]="activeTab() === 'login'"
            (click)="activeTab.set('login')"
            id="tab-login">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            Iniciar Sesión
          </button>
          <button
            class="tab-btn"
            [class.active]="activeTab() === 'register'"
            (click)="activeTab.set('register')"
            id="tab-register">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg>
            Crear Cuenta
          </button>
        </div>

        <!-- LOGIN FORM -->
        <ng-container *ngIf="activeTab() === 'login'">
          <form (ngSubmit)="onLogin()" id="login-form">
            <div class="field-group">
              <label class="field-label">USUARIO O CORREO ELECTRÓNICO</label>
              <div class="input-wrap">
                <svg class="input-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                <input
                  id="login-email"
                  type="text"
                  [(ngModel)]="email"
                  name="email"
                  required
                  placeholder="usuario o correo@ejemplo.com"
                  autocomplete="username"
                />
              </div>
            </div>

            <div class="field-group">
              <label class="field-label">CONTRASEÑA</label>
              <div class="input-wrap">
                <svg class="input-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                <input
                  id="login-password"
                  type="password"
                  [(ngModel)]="password"
                  name="password"
                  required
                  placeholder="••••••••"
                  autocomplete="current-password"
                />
              </div>
            </div>

            <div *ngIf="errorMsg" class="error-alert">{{ errorMsg }}</div>

            <button type="submit" id="btn-login" class="btn-primary-full" [disabled]="loading">
              <span *ngIf="loading">Iniciando sesión...</span>
              <span *ngIf="!loading">Iniciar Sesión</span>
            </button>

            <p class="link-center">
              <a href="#" (click)="$event.preventDefault(); activeTab.set('register')">¿No tienes cuenta? Regístrate aquí</a>
            </p>
          </form>

          <!-- Demo presets -->
          <div class="demo-section">
            <div class="demo-divider">
              <span>ACCESO RÁPIDO PARA DEMOSTRACIÓN</span>
            </div>
            <div class="demo-grid">
              <button class="demo-btn" id="demo-superadmin" (click)="setPreset('superadmin@portaforza.com', 'PortaForzaAdmin')">⚡ SuperAdmin</button>
              <button class="demo-btn" id="demo-admin" (click)="setPreset('admin@torredelparque.com', 'TenantAdmin')">🏢 Administrador</button>
              <button class="demo-btn" id="demo-mora" (click)="setPreset('degraded@torremora.com', 'TenantAdmin')">⚠️ Cuenta en Mora</button>
              <button class="demo-btn" id="demo-resident" (click)="setPreset('residente@torredelparque.com', 'Resident')">📱 Residente</button>
              <button class="demo-btn" id="demo-guard" (click)="setPreset('garita@torredelparque.com', 'Guard')">🛡️ Garita</button>
            </div>
          </div>
        </ng-container>

        <!-- REGISTER FORM -->
        <ng-container *ngIf="activeTab() === 'register'">
          <form (ngSubmit)="onRegister()" id="register-form">
            <div class="two-col">
              <div class="field-group">
                <label class="field-label">NOMBRE *</label>
                <input id="reg-nombre" type="text" [(ngModel)]="regNombre" name="regNombre" placeholder="Ej. Juan" />
              </div>
              <div class="field-group">
                <label class="field-label">APELLIDO *</label>
                <input id="reg-apellido" type="text" [(ngModel)]="regApellido" name="regApellido" placeholder="Ej. Astacio" />
              </div>
            </div>

            <div class="field-group">
              <label class="field-label">CORREO ELECTRÓNICO VÁLIDO *</label>
              <div class="input-wrap">
                <svg class="input-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,12 2,6"/></svg>
                <input id="reg-email" type="email" [(ngModel)]="regEmail" name="regEmail" placeholder="nombre@empresa.com" />
              </div>
            </div>

            <div class="two-col">
              <div class="field-group">
                <label class="field-label">USUARIO (AUTO) * <span class="auto-tag">Auto-generado</span></label>
                <div class="input-wrap">
                  <svg class="input-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                  <input type="text" [value]="regNombre && regApellido ? regNombre + regApellido : ''" placeholder="AUTO (NOMBRE + APEL)" readonly />
                </div>
              </div>
              <div class="field-group">
                <label class="field-label">NÚMERO DE CELULAR *</label>
                <div class="input-wrap">
                  <svg class="input-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.16 2 2 0 0 1 3.62 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.6a16 16 0 0 0 6 6l.96-.97a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                  <input id="reg-celular" type="tel" [(ngModel)]="regCelular" name="regCelular" placeholder="809-555-0100" />
                </div>
              </div>
            </div>

            <div class="two-col">
              <div class="field-group">
                <label class="field-label">CONTRASEÑA * (MÍN 6 CAR.)</label>
                <div class="input-wrap">
                  <svg class="input-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                  <input id="reg-password" type="password" [(ngModel)]="regPassword" name="regPassword" placeholder="••••••••" />
                </div>
              </div>
              <div class="field-group">
                <label class="field-label">CONFIRMAR CONTRASEÑA *</label>
                <div class="input-wrap">
                  <svg class="input-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                  <input id="reg-password-confirm" type="password" [(ngModel)]="regPasswordConfirm" name="regPasswordConfirm" placeholder="••••••••" />
                </div>
              </div>
            </div>

            <div class="info-box">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
              Tu cuenta se registrará como <strong>Pendiente de Aprobación</strong> y será autorizada por un administrador.
            </div>

            <button type="submit" id="btn-register" class="btn-primary-full">
              Enviar Solicitud de Registro
            </button>

            <p class="link-center">
              ¿Ya tienes una cuenta autorizada? <a href="#" (click)="$event.preventDefault(); activeTab.set('login')">Inicia sesión</a>
            </p>
          </form>
        </ng-container>

        <!-- Footer -->
        <div class="card-footer">
          <a href="#">Política de Privacidad</a>
          <span>·</span>
          <a href="#">Términos de Servicio</a>
          <br/>
          <span>PortaForza &copy; 2026. Todos los derechos reservados.</span>
        </div>

      </div>
    </div>
  `,
  styles: [`
    .login-page {
      min-height: 100vh;
      background: #000000;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 24px;
    }

    .login-card {
      background: #1a1a1a;
      border-radius: 20px;
      padding: 32px 28px;
      width: 100%;
      max-width: 420px;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.6);
    }

    .login-header {
      text-align: center;
      margin-bottom: 24px;
    }

    .brand {
      font-size: 1.5rem;
      font-weight: 400;
      letter-spacing: -0.3px;
      margin-bottom: 6px;
    }

    .brand-admin {
      color: #ffffff;
      font-weight: 500;
    }

    .brand-gpf {
      color: #2563EB;
      font-weight: 700;
    }

    .brand-subtitle {
      font-size: 0.78rem;
      color: #6B7280;
    }

    /* Tab switcher */
    .tab-switcher {
      display: flex;
      background: #111111;
      border-radius: 10px;
      padding: 4px;
      margin-bottom: 24px;
      gap: 4px;
    }

    .tab-btn {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      padding: 8px 12px;
      border: none;
      border-radius: 7px;
      font-size: 0.8125rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.15s ease;
      color: #6B7280;
      background: transparent;
      font-family: inherit;

      &.active {
        background: #2a2a2a;
        color: #ffffff;
        box-shadow: 0 1px 3px rgba(0,0,0,0.4);
      }

      &:hover:not(.active) {
        color: #9CA3AF;
      }
    }

    /* Form fields */
    .field-group {
      margin-bottom: 16px;
    }

    .field-label {
      display: block;
      font-size: 0.6875rem;
      font-weight: 700;
      color: #6B7280;
      letter-spacing: 0.05em;
      margin-bottom: 6px;
    }

    .auto-tag {
      color: #2563EB;
      font-weight: 600;
      text-transform: none;
      letter-spacing: 0;
    }

    .input-wrap {
      position: relative;
    }

    .input-icon {
      position: absolute;
      left: 12px;
      top: 50%;
      transform: translateY(-50%);
      color: #6B7280;
    }

    input {
      width: 100%;
      background: #111111;
      border: 1px solid #2a2a2a;
      border-radius: 10px;
      color: #e5e5e5;
      font-size: 0.875rem;
      padding: 10px 14px;
      font-family: inherit;
      transition: border-color 0.15s ease;

      &:focus {
        outline: none;
        border-color: #2563EB;
      }

      &::placeholder {
        color: #4B5563;
      }
    }

    .input-wrap input {
      padding-left: 38px;
    }

    .two-col {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
    }

    .error-alert {
      background: rgba(220, 38, 38, 0.15);
      border: 1px solid rgba(220, 38, 38, 0.4);
      color: #F87171;
      border-radius: 8px;
      padding: 10px 14px;
      font-size: 0.8125rem;
      margin-bottom: 12px;
    }

    .btn-primary-full {
      width: 100%;
      background: #2563EB;
      color: #ffffff;
      border: none;
      border-radius: 10px;
      padding: 12px;
      font-size: 0.9375rem;
      font-weight: 600;
      cursor: pointer;
      font-family: inherit;
      transition: background 0.15s ease, box-shadow 0.15s ease;
      margin-top: 4px;

      &:hover:not(:disabled) {
        background: #1D4ED8;
        box-shadow: 0 4px 14px rgba(37,99,235,0.4);
      }

      &:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }
    }

    .link-center {
      text-align: center;
      font-size: 0.8rem;
      color: #6B7280;
      margin-top: 14px;

      a {
        color: #2563EB;
        text-decoration: none;
        &:hover { text-decoration: underline; }
      }
    }

    .info-box {
      display: flex;
      gap: 8px;
      align-items: flex-start;
      background: rgba(37, 99, 235, 0.12);
      border: 1px solid rgba(37, 99, 235, 0.3);
      border-radius: 8px;
      padding: 10px 14px;
      font-size: 0.8rem;
      color: #93C5FD;
      margin-bottom: 16px;

      strong { color: #60A5FA; }
      svg { flex-shrink: 0; margin-top: 1px; }
    }

    /* Demo presets */
    .demo-section {
      margin-top: 24px;
    }

    .demo-divider {
      text-align: center;
      position: relative;
      margin-bottom: 12px;

      &::before {
        content: '';
        position: absolute;
        top: 50%;
        left: 0;
        right: 0;
        height: 1px;
        background: #2a2a2a;
      }

      span {
        position: relative;
        background: #1a1a1a;
        padding: 0 10px;
        font-size: 0.65rem;
        font-weight: 700;
        color: #4B5563;
        letter-spacing: 0.06em;
      }
    }

    .demo-grid {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .demo-btn {
      background: #111111;
      border: 1px solid #2a2a2a;
      border-radius: 8px;
      color: #9CA3AF;
      font-size: 0.78rem;
      padding: 7px 12px;
      text-align: left;
      cursor: pointer;
      font-family: inherit;
      transition: all 0.15s ease;

      &:hover {
        border-color: #2563EB;
        color: #e5e5e5;
        background: rgba(37,99,235,0.08);
      }
    }

    /* Footer */
    .card-footer {
      margin-top: 20px;
      padding-top: 16px;
      border-top: 1px solid #2a2a2a;
      text-align: center;
      font-size: 0.72rem;
      color: #4B5563;
      line-height: 1.8;

      a {
        color: #2563EB;
        text-decoration: none;
        &:hover { text-decoration: underline; }
      }
    }
  `]
})
export class LoginComponent {
  activeTab = signal<'login' | 'register'>('login');
  email = '';
  password = '';
  loading = false;
  errorMsg = '';

  // Register fields
  regNombre = '';
  regApellido = '';
  regEmail = '';
  regCelular = '';
  regPassword = '';
  regPasswordConfirm = '';

  constructor(
    private api: ApiService,
    private auth: AuthService,
    private router: Router
  ) {
    if (this.auth.isAuthenticated()) {
      const role = this.auth.currentRole();
      if (role === 'PortaForzaAdmin') {
        this.router.navigate(['/backoffice']);
      } else if (role === 'Guard') {
        this.router.navigate(['/gate']);
      } else if (role === 'Resident') {
        this.router.navigate(['/billing']);
      } else {
        this.router.navigate(['/dashboard']);
      }
    }
  }

  setPreset(email: string, _role: string): void {
    this.email = email;
    this.password = 'Password123!';
    this.onLogin();
  }

  onLogin(): void {
    this.loading = true;
    this.errorMsg = '';
    this.api.login({ email: this.email, password: this.password }).subscribe({
      next: (response) => {
        this.auth.setSession(response);
        this.loading = false;
        if (response.role === 'PortaForzaAdmin') {
          this.router.navigate(['/backoffice']);
        } else if (response.role === 'Guard') {
          this.router.navigate(['/gate']);
        } else if (response.role === 'Resident') {
          this.router.navigate(['/billing']);
        } else {
          this.router.navigate(['/dashboard']);
        }
      },
      error: () => {
        this.loading = false;
        this.errorMsg = 'Credenciales incorrectas. Intente de nuevo.';
      }
    });
  }

  onRegister(): void {
    // Registration is pending admin approval — show info message
    alert('Solicitud enviada. Un administrador aprobará tu cuenta en breve.');
    this.activeTab.set('login');
  }
}
