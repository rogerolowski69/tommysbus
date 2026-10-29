import { z } from "zod";

export const MAX_PASSENGERS = 14;

export const tripSearchSchema = z
  .object({
    tripType: z.enum(["ONE_WAY", "ROUND_TRIP"]),
    origin: z.string().min(1, "Choose a pickup location"),
    destination: z.string().min(1, "Choose a destination"),
    departDate: z.iso.date("Choose a departure date"),
    returnDate: z.union([z.iso.date(), z.literal("")]),
    adults: z.coerce.number<number>().int().min(1, "At least one adult").max(MAX_PASSENGERS),
    children: z.coerce.number<number>().int().min(0).max(MAX_PASSENGERS - 1),
  })
  .superRefine((v, ctx) => {
    if (v.origin && v.origin === v.destination) {
      ctx.addIssue({ code: "custom", path: ["destination"], message: "Destination must differ from pickup" });
    }
    if (v.adults + v.children > MAX_PASSENGERS) {
      ctx.addIssue({
        code: "custom",
        path: ["children"],
        message: `Online bookings are limited to ${MAX_PASSENGERS} travelers — request a charter for larger groups`,
      });
    }
    if (v.tripType === "ROUND_TRIP") {
      if (!v.returnDate) ctx.addIssue({ code: "custom", path: ["returnDate"], message: "Choose a return date" });
      else if (v.returnDate < v.departDate)
        ctx.addIssue({ code: "custom", path: ["returnDate"], message: "Return must be on or after departure" });
    }
  });

export type TripSearch = z.infer<typeof tripSearchSchema>;

const phoneDigits = (s: string) => s.replace(/\D/g, "").length;

export const passengerSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, "Enter the lead passenger's full name")
    .max(120)
    .refine((s) => !/[<>{}]/.test(s), "Name contains invalid characters"),
  email: z.email("Enter a valid email address").max(254),
  phone: z
    .string()
    .trim()
    .max(20)
    .refine((s) => phoneDigits(s) >= 10 && phoneDigits(s) <= 15, "Enter a valid phone number"),
  bags: z.coerce.number<number>().int().min(0).max(60),
  notes: z.string().max(1000, "Keep notes under 1000 characters"),
});

export type PassengerDetails = z.infer<typeof passengerSchema>;
