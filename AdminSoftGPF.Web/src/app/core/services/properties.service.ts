import { Injectable, inject } from '@angular/core';
import { ApiService } from './api.service';
import { Observable } from 'rxjs';

export interface PropertyDto {
  id: string;
  tenantId: string;
  name: string;
  address: string;
}

export interface CreatePropertyDto {
  name: string;
  address: string;
}

@Injectable({
  providedIn: 'root'
})
export class PropertiesService {
  private api = inject(ApiService);

  getProperties(): Observable<PropertyDto[]> {
    return this.api.get<PropertyDto[]>('properties', []);
  }

  getProperty(id: string): Observable<PropertyDto> {
    return this.api.get<PropertyDto>(`properties/${id}`);
  }

  createProperty(data: CreatePropertyDto): Observable<string> {
    return this.api.post<string>('properties', data);
  }

  updateProperty(id: string, data: CreatePropertyDto): Observable<void> {
    return this.api.put<void>(`properties/${id}`, data);
  }
}
