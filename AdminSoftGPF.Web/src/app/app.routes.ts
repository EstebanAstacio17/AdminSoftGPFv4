import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'dashboard',
    canActivate: [authGuard],
    loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent)
  },
  {
    path: 'properties',
    canActivate: [authGuard],
    loadComponent: () => import('./features/properties/properties.component').then(m => m.PropertiesComponent)
  },
  {
    path: 'residents',
    canActivate: [authGuard],
    loadComponent: () => import('./features/residents/residents.component').then(m => m.ResidentsComponent)
  },
  {
    path: 'billing',
    canActivate: [authGuard],
    loadComponent: () => import('./features/billing/billing.component').then(m => m.BillingComponent)
  },
  {
    path: 'treasury',
    canActivate: [authGuard],
    loadComponent: () => import('./features/treasury/treasury.component').then(m => m.TreasuryComponent)
  },
  {
    path: 'expenses',
    canActivate: [authGuard],
    loadComponent: () => import('./features/expenses/expenses.component').then(m => m.ExpensesComponent)
  },
  {
    path: 'helpdesk',
    canActivate: [authGuard],
    loadComponent: () => import('./features/helpdesk/helpdesk.component').then(m => m.HelpdeskComponent)
  },
  {
    path: 'facilities',
    canActivate: [authGuard],
    loadComponent: () => import('./features/facilities/facilities.component').then(m => m.FacilitiesComponent)
  },
  {
    path: 'gate',
    canActivate: [authGuard],
    loadComponent: () => import('./features/gate/gate.component').then(m => m.GateComponent)
  },
  {
    path: 'bank-reconciliation',
    canActivate: [authGuard],
    loadComponent: () => import('./features/bank-reconciliation/bank-reconciliation.component').then(m => m.BankReconciliationComponent)
  },
  {
    path: 'users',
    canActivate: [authGuard],
    loadComponent: () => import('./features/users/users.component').then(m => m.UsersComponent)
  },
  {
    path: 'backoffice',
    canActivate: [authGuard],
    loadComponent: () => import('./features/backoffice/backoffice.component').then(m => m.BackofficeComponent)
  },
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full'
  },
  {
    path: '**',
    redirectTo: 'login'
  }
];
