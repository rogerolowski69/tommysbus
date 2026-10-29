import { ClockIcon, PillIcon, ShoppingCartIcon, StethoscopeIcon } from "lucide-react";

import type { ServiceType } from "./validation/charter";

export const localServices: {
  type: ServiceType;
  icon: typeof ClockIcon;
  title: string;
  summary: string;
  destinations: string[];
  details: string[];
}[] = [
  {
    type: "MEDICAL",
    icon: StethoscopeIcon,
    title: "Medical appointment rides",
    summary: "Door-to-door rides to doctor visits, specialists and outpatient appointments.",
    destinations: ["Gainesville", "Jacksonville"],
    details: [
      "Round-trip same-day service with wait time available",
      "A companion or caregiver may ride along",
      "Non-emergency only — not an ambulance or medical transport service",
    ],
  },
  {
    type: "GROCERY_PHARMACY",
    icon: PillIcon,
    title: "Grocery & pharmacy runs",
    summary: "Get to the store or pick up prescriptions without needing a car.",
    destinations: ["Crescent City", "Palatka"],
    details: ["Help loading bags on and off the vehicle", "Combine stops — grocery, pharmacy, bank", "Great for regular weekly trips"],
  },
  {
    type: "SHOPPING",
    icon: ShoppingCartIcon,
    title: "Walmart & shopping trips",
    summary: "Shopping runs to Walmart and other stores for individuals, families or small groups.",
    destinations: ["Palatka", "Crescent City area", "Other stores on request"],
    details: ["Set pickup and return times", "Room for shopping bags", "Group trips for residences or communities"],
  },
  {
    type: "HOURLY",
    icon: ClockIcon,
    title: "Hire by the hour",
    summary: "Book a driver and vehicle for a block of time and go where you need, in any order.",
    destinations: ["Anywhere in our service area"],
    details: ["Errands, multiple stops, events or outings", "Minimum booking applies", "Price set by the hour, not the mile"],
  },
];
