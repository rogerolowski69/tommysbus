import { z } from "zod";

export const SERVICE_TYPES = [
  { value: "CHARTER", label: "Private charter (group trip)" },
  { value: "MEDICAL", label: "Medical appointment ride (non-emergency)" },
  { value: "GROCERY_PHARMACY", label: "Grocery / pharmacy run" },
  { value: "SHOPPING", label: "Walmart / shopping trip" },
  { value: "HOURLY", label: "Hire by the hour" },
] as const;

export type ServiceType = (typeof SERVICE_TYPES)[number]["value"];
export const isServiceType = (v: unknown): v is ServiceType => SERVICE_TYPES.some((t) => t.value === v);

export const charterSchema = z
  .object({
    service_type: z.enum(["CHARTER", "MEDICAL", "GROCERY_PHARMACY", "SHOPPING", "HOURLY"]),
    contact_name: z.string().trim().min(2, "Enter your name").max(120),
    email: z.email("Enter a valid email address"),
    phone: z
      .string()
      .trim()
      .refine((s) => s.replace(/\D/g, "").length >= 10, "Enter a valid phone number"),
    origin: z.string().trim().min(2, "Enter a pickup city or address area").max(120),
    destination: z.string().trim().min(2, "Enter a destination").max(120),
    travel_date: z.iso.date("Choose a date"),
    pickup_time: z.union([z.iso.time({ precision: -1 }), z.literal("")]),
    return_date: z.union([z.iso.date(), z.literal("")]),
    hours_requested: z.coerce.number<number>().int().min(0).max(12),
    passenger_count: z.coerce.number<number>().int().min(1, "At least 1 passenger").max(250),
    message: z.string().max(2000),
  })
  .refine((v) => !v.return_date || v.return_date >= v.travel_date, {
    path: ["return_date"],
    message: "Return date must be on or after the travel date",
  })
  .refine((v) => v.service_type !== "HOURLY" || v.hours_requested >= 1, {
    path: ["hours_requested"],
    message: "Choose how many hours you need",
  });

export type CharterForm = z.infer<typeof charterSchema>;
