/** Static sector / sub-sector catalog for onboarding (India-style labels). */

export type SectorRow = { code: string; name: string; subSectors: { code: string; name: string }[] };

export const SECTORS: SectorRow[] = [
  {
    code: "bfsi",
    name: "Bfsi",
    subSectors: [
      { code: "banking", name: "Banking" },
      { code: "insurance", name: "Insurance" },
      { code: "nbfc", name: "Nbfc" },
      { code: "stock-broking", name: "Stock Broking" },
      { code: "fintech", name: "Fintech" },
      { code: "bfsi-other", name: "Others" },
    ],
  },
  {
    code: "education",
    name: "Education",
    subSectors: [
      { code: "k12", name: "K-12" },
      { code: "higher-ed", name: "Higher Education" },
      { code: "edtech", name: "Edtech" },
      { code: "coaching", name: "Coaching" },
      { code: "vocational", name: "Vocational Training" },
      { code: "education-other", name: "Others" },
    ],
  },
  {
    code: "government",
    name: "Government",
    subSectors: [
      { code: "central", name: "Central / Psu" },
      { code: "state", name: "State Government" },
      { code: "local-body", name: "Local Body" },
      { code: "defence", name: "Defence" },
      { code: "government-other", name: "Others" },
    ],
  },
  {
    code: "health",
    name: "Health",
    subSectors: [
      { code: "hospitals", name: "Hospitals" },
      { code: "clinics", name: "Clinics & Diagnostics" },
      { code: "pharma", name: "Pharma" },
      { code: "med-devices", name: "Medical Devices" },
      { code: "health-it", name: "Health It" },
      { code: "health-other", name: "Others" },
    ],
  },
  {
    code: "information-technology",
    name: "Information Technology",
    subSectors: [
      { code: "asp", name: "Application Service Providers" },
      { code: "cloud-dc", name: "Cloud / Datacentre Services" },
      { code: "networking", name: "Computer Networking" },
      { code: "consulting", name: "Consulting" },
      { code: "cybercafe", name: "Cybercafe" },
      { code: "data-processing", name: "Data Processing Services" },
      { code: "dotcom", name: "Dotcom" },
      { code: "erp-crm-saas", name: "Erp/Crm/Sas Service Providers" },
      { code: "hardware", name: "Hardware" },
      { code: "software", name: "Software" },
      { code: "web-app", name: "Web / App Development" },
      { code: "it-other", name: "Others" },
    ],
  },
  {
    code: "it-enabled-services-ites",
    name: "It Enabled Services (Ites)",
    subSectors: [
      { code: "bpo", name: "Bpo" },
      { code: "kpo", name: "Kpo" },
      { code: "lpo", name: "Lpo" },
      { code: "analytics-outsourcing", name: "Analytics Outsourcing" },
      { code: "ites-other", name: "Others" },
    ],
  },
  {
    code: "manufacturing",
    name: "Manufacturing",
    subSectors: [
      { code: "automotive", name: "Automotive" },
      { code: "electronics", name: "Electronics" },
      { code: "textiles", name: "Textiles" },
      { code: "food-beverage", name: "Food & Beverage" },
      { code: "heavy-engineering", name: "Heavy Engineering" },
      { code: "manufacturing-other", name: "Others" },
    ],
  },
  {
    code: "media",
    name: "Media",
    subSectors: [
      { code: "broadcast", name: "Broadcast" },
      { code: "print", name: "Print" },
      { code: "digital-media", name: "Digital Media" },
      { code: "entertainment", name: "Entertainment" },
      { code: "media-other", name: "Others" },
    ],
  },
  {
    code: "professional",
    name: "Professional",
    subSectors: [
      { code: "legal", name: "Legal" },
      { code: "audit-tax", name: "Audit & Tax" },
      { code: "architecture", name: "Architecture & Design" },
      { code: "management-consulting", name: "Management Consulting" },
      { code: "professional-other", name: "Others" },
    ],
  },
  {
    code: "services",
    name: "Services",
    subSectors: [
      { code: "facilities", name: "Facilities Management" },
      { code: "logistics", name: "Logistics & Supply Chain" },
      { code: "travel", name: "Travel & Hospitality" },
      { code: "real-estate", name: "Real Estate Services" },
      { code: "services-other", name: "Others" },
    ],
  },
  {
    code: "trade",
    name: "Trade",
    subSectors: [
      { code: "retail", name: "Retail" },
      { code: "wholesale", name: "Wholesale" },
      { code: "ecommerce", name: "E-Commerce" },
      { code: "import-export", name: "Import / Export" },
      { code: "trade-other", name: "Others" },
    ],
  },
  {
    code: "utility",
    name: "Utility",
    subSectors: [
      { code: "power", name: "Power" },
      { code: "water", name: "Water" },
      { code: "gas", name: "Gas" },
      { code: "telecom-infra", name: "Telecom Infrastructure" },
      { code: "utility-other", name: "Others" },
    ],
  },
];

export function findSector(code: string): SectorRow | undefined {
  return SECTORS.find((s) => s.code === code.toLowerCase());
}
