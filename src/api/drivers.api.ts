import { api } from '../lib/api';

export interface Vehicle {
  id: string;
  make: string;
  model: string;
  year: number;
  color: string;
  plateNumber: string;
  province: string;
  passengerSeatCount: number;
  hasAc: boolean;
  isPrimary: boolean;
}

export interface CreateVehicleDto {
  make: string;
  model: string;
  year: number;
  color: string;
  plateNumber: string;
  province: string;
  passengerSeatCount: number;
  hasAc: boolean;
}

export const driversApi = {
  createProfile: (formData: FormData) =>
    api.post('/drivers/profile', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  getProfile: () => api.get('/drivers/profile'),

  listVehicles: () => api.get<Vehicle[]>('/drivers/vehicles'),

  addVehicle: (dto: CreateVehicleDto) =>
    api.post<Vehicle>('/drivers/vehicles', dto),

  updateVehicle: (id: string, dto: Partial<CreateVehicleDto>) =>
    api.patch<Vehicle>(`/drivers/vehicles/${id}`, dto),

  deleteVehicle: (id: string) =>
    api.delete(`/drivers/vehicles/${id}`),

  setPrimary: (id: string) =>
    api.post<Vehicle>(`/drivers/vehicles/${id}/primary`),
};
