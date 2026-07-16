export type LocationInput = {
  name: string;
  address?: string | null;
  longitude: number;
  latitude: number;
};

export type FieldError = {
  field?: string;
  message: string;
};

export type ApiErrorPayload = {
  code: string;
  message: string;
  fieldErrors?: FieldError[];
  traceId?: string;
  scheduleId?: string;
};
