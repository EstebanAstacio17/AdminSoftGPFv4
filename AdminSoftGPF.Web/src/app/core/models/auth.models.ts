export interface UserSession {
  userId: string;
  email: string;
  role: 'PortaForzaAdmin' | 'TenantAdmin' | 'Accountant' | 'Resident' | 'Guard';
  tenantId?: string;
  tenantStatus?: 'Active' | 'ReadOnly' | 'Suspended';
  impersonatorId?: string;
  token: string;
}

export interface LoginResponse {
  token: string;
  userId: string;
  email: string;
  role: string;
  tenantId?: string;
  tenantStatus?: string;
  impersonatorId?: string;
}
