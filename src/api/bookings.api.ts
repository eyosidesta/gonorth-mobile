import { api } from '../lib/api';

export interface Booking {
  id: string;
  tripId: string;
  passengerId: string;
  seats: number;
  totalPrice: number;
  status: 'pending' | 'confirmed' | 'declined' | 'cancelled' |
          'pending_payment' | 'pending_approval' | 'approved' |
          'cancelled_passenger' | 'cancelled_driver';
  message: string | null;
  createdAt: string;
  // trip join fields (passenger view)
  originName?: string;
  destinationName?: string;
  departureAt?: string;
  driverFirstName?: string;
  driverLastName?: string;
  driverAvgRating?: number | null;
  driverReviewCount?: number;
  bookingMode?: 'instant' | 'request';
  driverId?: string;
}

export interface DriverBooking {
  id: string;
  tripId: string;
  passengerId: string;
  seats: number;
  totalPrice: number;
  status: string;
  message: string | null;
  createdAt: string;
  passenger: {
    id: string;
    firstName: string;
    lastName: string;
    avatarUrl: string | null;
  };
  fromWaypoint: { name: string } | null;
  toWaypoint: { name: string } | null;
  trip: {
    id: string;
    departureAt: string;
  };
}

export interface CreateBookingDto {
  tripId: string;
  fromWaypointId: string;
  toWaypointId: string;
  seats: number;
}

export const bookingsApi = {
  create: (data: CreateBookingDto) => api.post<Booking>('/bookings', data),
  listMine: () => api.get<Booking[]>('/bookings/mine'),
  listForDriver: () => api.get<DriverBooking[]>('/bookings/driver'),
  findOne: (id: string) => api.get<DriverBooking>(`/bookings/${id}`),
  cancel: (id: string) => api.delete(`/bookings/${id}`),
  approve: (id: string) => api.patch(`/bookings/${id}/approve`),
  decline: (id: string) => api.patch(`/bookings/${id}/decline`),
};
