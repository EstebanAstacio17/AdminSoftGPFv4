import { Injectable, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { UserSession, LoginResponse } from '../models/auth.models';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSignal = signal<UserSession | null>(this.getStoredSession());

  currentUser = this.currentUserSignal.asReadonly();
  isLoggedIn = computed(() => !!this.currentUserSignal());
  isAuthenticated = computed(() => !!this.currentUserSignal());
  isImpersonated = computed(() => !!this.currentUserSignal()?.impersonatorId);
  isDegradedMode = computed(() => this.currentUserSignal()?.tenantStatus === 'ReadOnly');
  currentRole = computed(() => this.currentUserSignal()?.role || '');

  constructor(private router: Router) {}

  setSession(response: LoginResponse): void {
    const session: UserSession = {
      userId: response.userId,
      email: response.email,
      role: response.role as any,
      tenantId: response.tenantId,
      tenantStatus: response.tenantStatus as any,
      impersonatorId: response.impersonatorId,
      token: response.token
    };

    localStorage.setItem('gpf-session', JSON.stringify(session));
    this.currentUserSignal.set(session);
  }

  logout(): void {
    localStorage.removeItem('gpf-session');
    this.currentUserSignal.set(null);
    this.router.navigate(['/login']);
  }

  getToken(): string | null {
    return this.currentUserSignal()?.token || null;
  }

  private getStoredSession(): UserSession | null {
    const stored = localStorage.getItem('gpf-session');
    if (!stored) return null;
    try {
      return JSON.parse(stored) as UserSession;
    } catch {
      return null;
    }
  }
}
