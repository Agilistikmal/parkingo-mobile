export const API_BASE_URL = "https://parkingo-core.agil.zip";

export const API_ENDPOINTS = {
  AUTHENTICATE: "/v1/authenticate",
  PARKINGS: "/v1/parkings",
  BOOKINGS: "/v1/bookings",
  BOOKING_BY_REFERENCE: (reference: string) =>
    `/v1/bookings/reference/${reference}`,
} as const;

export const getFullUrl = (endpoint: string) => `${API_BASE_URL}${endpoint}`;

// Parking Slot Type
export interface ParkingSlot {
  id: number;
  parking_id: number;
  name: string;
  status: "AVAILABLE" | "BOOKED" | "NOT_AVAILABLE";
  fee: number;
  row: number;
  col: number;
  esp_hmac: string;
  preview_url: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

// Layout item type - apa yang ada di lokasi parkir
export type LayoutItem = "P" | "DOOR" | "ROAD" | "EXIT" | "IN" | "EMPTY";

// API Response Types
export interface Parking {
  id: number;
  name: string;
  address: string;
  default_fee: number;
  slug: string;
  latitude: number;
  longitude: number;
  layout?: LayoutItem[][];
  slots?: ParkingSlot[];
}

export interface ParkingResponse {
  data: Parking[];
}

export interface ParkingDetailResponse {
  data: Parking;
}

// Booking Request Type
export interface BookingRequest {
  plate_number: string;
  start_at: string;
  end_at: string;
  parking_id: number;
  slot_id: number;
}

export interface Booking {
  id: number;
  user_id: number;
  user?: {
    id: number;
    username: string;
    full_name: string;
    email: string;
    avatar_url: string;
    google_id: string;
    role: string;
    created_at: string;
    updated_at: string;
    deleted_at: string | null;
  };
  parking_id: number;
  parking?: {
    id: number;
    author_id: number;
    slug: string;
    name: string;
    address: string;
    default_fee: number;
    latitude: number;
    longitude: number;
    layout: LayoutItem[][];
    slots: ParkingSlot[] | null;
    created_at: string;
    updated_at: string;
    deleted_at: string | null;
  };
  slot_id: number;
  slot?: ParkingSlot;
  plate_number: string;
  start_at: string;
  end_at: string;
  total_hours: number;
  total_fee: number;
  payment_reference: string;
  payment_link: string;
  payment_expired_at: string;
  status: "UNPAID" | "PAID" | "CANCELLED" | "EXPIRED" | "COMPLETED";
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface BookingResponse {
  data: Booking;
}

export interface BookingsResponse {
  data: Booking[];
}
