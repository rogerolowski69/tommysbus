export const site = {
  name: "Tommy's Bus",
  tagline: "Your Ride Across Central Florida.",
  description:
    "Scheduled regional shuttle and private charter service connecting Palatka, Ocala and Orlando. " +
    "Demonstration website — schedules and fares are placeholders.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  allowIndexing: process.env.ALLOW_INDEXING === "true",
  // Fictional placeholder contact details (555-01xx numbers are reserved for fiction).
  phone: "(386) 555-0100",
  phoneHref: "tel:+13865550100",
  email: "hello@tommysbus.com",
  serviceArea: "Palatka · Ocala · Orlando · Central & Northeast Florida",
  hours: "Reservations desk (demo): Mon–Sat, 7 AM – 7 PM ET",
} as const;

export const mainNav = [
  { href: "/", label: "Home" },
  { href: "/routes", label: "Routes & Schedules" },
  { href: "/fares", label: "Fares" },
  { href: "/locations", label: "Pickup Locations" },
  { href: "/services", label: "Local Trips" },
  { href: "/charters", label: "Private Charters" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
] as const;

export const DEMO_NOTICE =
  "Demonstration site: all schedules, stops, fares and reservations are placeholders pending operator validation. No payments are taken.";
