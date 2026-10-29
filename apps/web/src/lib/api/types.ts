import type { components } from "./schema";

type Schemas = components["schemas"];

export type Location = Schemas["Location"];
export type LocationSummary = Schemas["LocationSummary"];
export type Route = Schemas["Route"];
export type Trip = Schemas["Trip"];
export type Fare = Schemas["Fare"];
export type PricingPolicy = Schemas["PricingPolicy"];
export type Quote = Schemas["Quote"];
export type QuoteRequest = Schemas["QuoteRequestRequest"];
export type BookingCreateRequest = Schemas["BookingCreateRequest"];
export type BookingCreated = Schemas["BookingCreated"];
export type BookingDetail = Schemas["BookingDetail"];
export type BookingStatus = Schemas["BookingStatusEnum"];
export type CharterInquiryRequest = Schemas["CharterInquiryCreateRequest"];
