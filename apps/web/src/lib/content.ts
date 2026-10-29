export type Faq = { question: string; answer: string };

export const faqs: Faq[] = [
  {
    question: "Is Tommy's Bus taking real reservations?",
    answer:
      "Not yet. This website is a working demonstration. Reservations made here are stored as demo records, are never charged, and do not guarantee a seat on a real vehicle.",
  },
  {
    question: "How do I book a seat?",
    answer:
      "Choose your pickup city, destination, date and number of travelers, pick a departure with seats available, enter the lead passenger's details and review the price. You'll receive a booking reference and a private link to view your reservation.",
  },
  {
    question: "How far ahead can I book?",
    answer:
      "The demo schedule lets you search departures up to 60 days ahead. Seats are held for a limited time after you reserve; in a live service, payment would confirm the hold.",
  },
  {
    question: "Do children ride at a different fare?",
    answer:
      "Yes. Children aged 2–11 travel at a reduced child fare. At least one adult must travel on each reservation.",
  },
  {
    question: "How much luggage can I bring?",
    answer:
      "Each passenger may bring one checked bag and one small personal item at no extra cost. Additional checked bags carry a per-bag fee each way, up to a per-passenger maximum. See the Fares page for current demo amounts.",
  },
  {
    question: "Do you pick up at Orlando International Airport (MCO)?",
    answer:
      "No. The demo schedule includes drop-off near the MCO area only. Airport pickups would require authorization from the airport authority, which has not been obtained.",
  },
  {
    question: "Can I change or cancel a reservation?",
    answer:
      "You can cancel a demo reservation from its private confirmation link. Changes would be handled by the reservations desk in a live service.",
  },
  {
    question: "Can you drive me to a medical appointment in Gainesville or Jacksonville?",
    answer:
      "Yes — request a medical appointment ride on the Local Trips page with your appointment date and time. These are non-emergency rides only; we are not an ambulance or medical transport provider. A companion may ride along.",
  },
  {
    question: "Do you do grocery, pharmacy or Walmart trips?",
    answer:
      "Yes. We offer local runs to grocery stores, pharmacies and Walmart in Crescent City and Palatka. Request a trip with your preferred pickup time, or book us by the hour for several stops.",
  },
  {
    question: "Can I hire a driver by the hour?",
    answer:
      "Yes. Hourly hire gives you a driver and vehicle for a block of time, with a minimum booking. See the Fares page for the current demo hourly rate.",
  },
  {
    question: "Do you offer group or private trips?",
    answer:
      "Groups of six or more booking together receive a group rate on scheduled departures. For larger groups or custom itineraries, request a private charter quote.",
  },
];

export const testimonials = [
  {
    quote: "Booking took two minutes and the confirmation page had everything I needed.",
    name: "Sample Rider A.",
    context: "Palatka → Orlando (fictional)",
  },
  {
    quote: "Clear pickup instructions and a simple fare table — exactly what a regional shuttle site should have.",
    name: "Sample Rider B.",
    context: "Ocala → Orlando (fictional)",
  },
  {
    quote: "The charter request form made planning our group trip easy.",
    name: "Sample Organizer C.",
    context: "Private charter (fictional)",
  },
] as const;
