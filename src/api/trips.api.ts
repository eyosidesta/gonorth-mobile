import { api } from '../lib/api';

export interface Trip {
  id: string;
  driverId: string;
  vehicleId: string | null;
  status: string;
  bookingMode: 'instant' | 'request';
  departureAt: string;
  totalPassengerSeats: number;
  availableSeats: number;
  tripMode: 'passengers_only' | 'passengers_and_packages' | 'packages_only';
  maxPackageSize: string | null;
  pkgPriceEnvelope: number | null;
  pkgPriceSmall: number | null;
  pkgPriceMedium: number | null;
  pkgPriceLarge: number | null;
  preferences: Record<string, any> | null;
  notes: string | null;
  province: string | null;
  originWaypointId: string;
  originName: string;
  originLat: number;
  originLng: number;
  destinationWaypointId: string;
  destinationName: string;
  destinationLat: number;
  destinationLng: number;
  price: number;
  distanceKm: number;
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
  driverAvgRating: number | null;
  driverReviewCount: number;
  originDistanceKm?: number;
  destinationDistanceKm?: number;
}

export interface SearchParams {
  fromLat: number;
  fromLng: number;
  toLat: number;
  toLng: number;
  date: string;
  seats?: number;
  radius?: number;
}

export const tripsApi = {
  search: (params: SearchParams) => api.get<Trip[]>('/trips', { params }),
  findOne: (id: string) => api.get<Trip>(`/trips/${id}`),
  listMine: () => api.get<Trip[]>('/trips/mine'),
  create: (data: any) => api.post<Trip>('/trips', data),
  update: (id: string, data: any) => api.patch<Trip>(`/trips/${id}`, data),
  activate: (id: string) => api.post(`/trips/${id}/activate`),
  cancel: (id: string) => api.delete(`/trips/${id}`),
};
