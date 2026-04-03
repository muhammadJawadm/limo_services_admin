export const bookingStats = [
  { month: "Jan", rides: 420, revenue: 68200 },
  { month: "Feb", rides: 465, revenue: 73550 },
  { month: "Mar", rides: 512, revenue: 80400 },
  { month: "Apr", rides: 548, revenue: 86120 },
  { month: "May", rides: 590, revenue: 93810 },
  { month: "Jun", rides: 634, revenue: 101460 },
]

export const serviceMix = [
  { name: "Point to Point", value: 46 },
  { name: "Hourly", value: 31 },
  { name: "Airport", value: 23 },
]

export const bookings = [
  {
    id: "BK-9124",
    rider: "Noah Sullivan",
    pickup: "LAX Terminal B",
    dropoff: "Beverly Hills Hotel",
    serviceType: "Airport Transfer",
    carType: "Premium SUV",
    dateTime: "2026-04-03 08:30",
    fare: 172,
    payment: "Paid",
    status: "Confirmed",
    driver: "Daniel Foster",
  },
  {
    id: "BK-9125",
    rider: "Olivia Chen",
    pickup: "Downtown LA",
    dropoff: "Santa Monica Pier",
    serviceType: "Point to Point",
    carType: "Business Sedan",
    dateTime: "2026-04-03 09:10",
    fare: 88,
    payment: "Paid",
    status: "On Trip",
    driver: "Sarah Blake",
  },
  {
    id: "BK-9126",
    rider: "Ava Ramirez",
    pickup: "Century City",
    dropoff: "LAX Terminal 4",
    serviceType: "Airport Transfer",
    carType: "Luxury SUV",
    dateTime: "2026-04-03 10:05",
    fare: 146,
    payment: "Pending",
    status: "Driver Assigned",
    driver: "Marcus Reed",
  },
  {
    id: "BK-9127",
    rider: "Mason Patel",
    pickup: "SFO Terminal 2",
    dropoff: "Palo Alto",
    serviceType: "Hourly",
    carType: "Premium Sedan",
    dateTime: "2026-04-03 11:30",
    fare: 235,
    payment: "Paid",
    status: "Confirmed",
    driver: "Nina Hayes",
  },
  {
    id: "BK-9128",
    rider: "Sophia Walker",
    pickup: "Houston Galleria",
    dropoff: "River Oaks",
    serviceType: "Point to Point",
    carType: "Business Sedan",
    dateTime: "2026-04-03 12:20",
    fare: 74,
    payment: "Refunded",
    status: "Cancelled",
    driver: "Unassigned",
  },
  {
    id: "BK-9129",
    rider: "Liam Carter",
    pickup: "JFK Terminal 1",
    dropoff: "Manhattan Midtown",
    serviceType: "Airport Transfer",
    carType: "Premium SUV",
    dateTime: "2026-04-03 13:10",
    fare: 198,
    payment: "Paid",
    status: "Completed",
    driver: "Chris Doyle",
  },
]

export const drivers = [
  { id: "DRV-201", name: "Daniel Foster", city: "Los Angeles", rating: 4.9, tripsToday: 6, status: "Online" },
  { id: "DRV-202", name: "Sarah Blake", city: "Los Angeles", rating: 4.8, tripsToday: 5, status: "On Trip" },
  { id: "DRV-203", name: "Marcus Reed", city: "San Francisco", rating: 4.7, tripsToday: 4, status: "Online" },
  { id: "DRV-204", name: "Nina Hayes", city: "San Francisco", rating: 4.9, tripsToday: 7, status: "On Trip" },
  { id: "DRV-205", name: "Chris Doyle", city: "New York", rating: 4.8, tripsToday: 5, status: "Offline" },
]

export const fleet = [
  { id: "VH-101", model: "Mercedes S-Class", classType: "Premium Sedan", plate: "8KLS201", city: "Los Angeles", utilization: 82, status: "Available" },
  { id: "VH-102", model: "Cadillac Escalade", classType: "Premium SUV", plate: "9QPM114", city: "Los Angeles", utilization: 76, status: "On Trip" },
  { id: "VH-103", model: "BMW 7 Series", classType: "Business Sedan", plate: "7ARC990", city: "San Francisco", utilization: 69, status: "Available" },
  { id: "VH-104", model: "Lincoln Navigator", classType: "Luxury SUV", plate: "6MPT343", city: "Houston", utilization: 73, status: "Maintenance" },
  { id: "VH-105", model: "Audi A8", classType: "Premium Sedan", plate: "5HGH751", city: "New York", utilization: 78, status: "On Trip" },
]

export const customers = [
  { id: "CUS-7701", name: "Noah Sullivan", segment: "Corporate", rides: 34, city: "Los Angeles", spend: 5410, loyalty: "Platinum" },
  { id: "CUS-7702", name: "Olivia Chen", segment: "Individual", rides: 18, city: "Los Angeles", spend: 2190, loyalty: "Gold" },
  { id: "CUS-7703", name: "Ava Ramirez", segment: "Corporate", rides: 24, city: "San Francisco", spend: 3875, loyalty: "Gold" },
  { id: "CUS-7704", name: "Mason Patel", segment: "VIP", rides: 41, city: "San Francisco", spend: 7260, loyalty: "Platinum" },
  { id: "CUS-7705", name: "Sophia Walker", segment: "Individual", rides: 9, city: "Houston", spend: 980, loyalty: "Silver" },
]

export const payments = [
  { id: "PM-3201", bookingId: "BK-9124", customer: "Noah Sullivan", method: "Card", amount: 172, status: "Settled", date: "2026-04-03" },
  { id: "PM-3202", bookingId: "BK-9125", customer: "Olivia Chen", method: "Apple Pay", amount: 88, status: "Settled", date: "2026-04-03" },
  { id: "PM-3203", bookingId: "BK-9126", customer: "Ava Ramirez", method: "Card", amount: 146, status: "Pending", date: "2026-04-03" },
  { id: "PM-3204", bookingId: "BK-9128", customer: "Sophia Walker", method: "Card", amount: 74, status: "Refunded", date: "2026-04-03" },
  { id: "PM-3205", bookingId: "BK-9129", customer: "Liam Carter", method: "Card", amount: 198, status: "Settled", date: "2026-04-03" },
]

export const alerts = [
  { id: 1, title: "Surge pricing active", detail: "Los Angeles Downtown has 1.5x surge for next 45 minutes.", level: "warning", time: "5m ago" },
  { id: 2, title: "Fleet maintenance", detail: "Vehicle VH-104 scheduled service window starts in 2 hours.", level: "info", time: "18m ago" },
  { id: 3, title: "Driver onboarding", detail: "2 partner drivers completed KYC verification and are ready to activate.", level: "success", time: "33m ago" },
]

export const statusPill = {
  Confirmed: "bg-blue-100 text-blue-700",
  "Driver Assigned": "bg-indigo-100 text-indigo-700",
  "On Trip": "bg-amber-100 text-amber-800",
  Completed: "bg-emerald-100 text-emerald-700",
  Cancelled: "bg-rose-100 text-rose-700",
  Paid: "bg-emerald-100 text-emerald-700",
  Pending: "bg-amber-100 text-amber-800",
  Refunded: "bg-rose-100 text-rose-700",
  Settled: "bg-emerald-100 text-emerald-700",
  Available: "bg-emerald-100 text-emerald-700",
  Maintenance: "bg-amber-100 text-amber-800",
  Online: "bg-emerald-100 text-emerald-700",
  Offline: "bg-slate-100 text-slate-700",
}

export function toCurrency(value) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value)
}
