import type { FloorplanVehicle } from "@/types/health";

/**
 * ============================================================================
 * Mock floorplan fleet for Horizon Motors Auto Group — 12 rooftops, SE region.
 * ============================================================================
 *
 * Every unit carries:
 *   basis           — acquisition cost on which floorplan interest accrues
 *   projectedGross  — expected retail gross (typical 2026 used-car margins,
 *                     ~6-12% of basis, with aged/stale units compressed)
 *   daysOnLot       — age of the unit on the floorplan
 *
 * Fleet mix intentionally skews aged to make the "Profit Evaporator" visceral:
 * a handful of 70-100+ day units pull the monthly burn toward the loss
 * tolerance ceiling, which is exactly when the GM needs to *feel* the heat.
 *
 * 2026 market anchor: Prime dealer floorplan APR is running ~7.5% after the
 * 2025 rate-plateau cycle, with tightening expected in H2 2026.
 */

/**
 * Global floorplan lending rate. Used as the default / baseline APR and as
 * the starting point for the "What-If" rate-hike simulation.
 *
 * 2026 market anchor: prime dealer floorplan APR ≈ 7.5%.
 */
export const DEFAULT_FLOORPLAN_APR = 0.075;

/**
 * GM-authorized monthly floorplan-interest tolerance. When the projected
 * monthly burn closes in on this ceiling the thermometer turns orange; above
 * it the burn ticker flickers in fire-red "breach" mode.
 *
 * Scaled to the 12-rooftop group: ~$18k/month is typical for a ~$6M inventory
 * book at mid-single-digit rates.
 */
export const DEFAULT_LOSS_TOLERANCE_MONTHLY = 18_000;

const ROOFTOPS = [
  "Atlanta North",
  "Atlanta South",
  "Charlotte",
  "Raleigh",
  "Nashville",
  "Birmingham",
  "Jacksonville",
  "Tampa",
  "Orlando",
  "Miami",
  "Columbia",
  "Memphis",
];

interface FleetSeed {
  year: number;
  make: string;
  model: string;
  basis: number;
  grossPct: number; // expected gross as share of basis
}

/**
 * Curated fleet seed: a realistic blend of trucks, SUVs, sedans and EVs at
 * 2026 used-market price points. Grosses are modelled as a % of basis and
 * compressed on aged / distressed units when emitted below.
 */
const SEED: FleetSeed[] = [
  { year: 2023, make: "Ford", model: "F-150 XLT", basis: 42_800, grossPct: 0.09 },
  { year: 2022, make: "Ford", model: "F-150 Lariat", basis: 48_500, grossPct: 0.085 },
  { year: 2024, make: "Ford", model: "Bronco Sport", basis: 29_750, grossPct: 0.11 },
  { year: 2023, make: "Ford", model: "Explorer", basis: 34_900, grossPct: 0.09 },
  { year: 2022, make: "Ford", model: "Mustang GT", basis: 38_600, grossPct: 0.08 },

  { year: 2024, make: "Chevrolet", model: "Silverado 1500", basis: 44_300, grossPct: 0.09 },
  { year: 2023, make: "Chevrolet", model: "Tahoe LT", basis: 52_900, grossPct: 0.08 },
  { year: 2022, make: "Chevrolet", model: "Equinox", basis: 23_400, grossPct: 0.1 },
  { year: 2024, make: "Chevrolet", model: "Traverse", basis: 36_250, grossPct: 0.095 },
  { year: 2023, make: "Chevrolet", model: "Malibu", basis: 21_800, grossPct: 0.07 },

  { year: 2023, make: "GMC", model: "Sierra 1500", basis: 47_200, grossPct: 0.085 },
  { year: 2024, make: "GMC", model: "Acadia", basis: 38_900, grossPct: 0.09 },
  { year: 2022, make: "GMC", model: "Yukon Denali", basis: 61_500, grossPct: 0.075 },

  { year: 2023, make: "Ram", model: "1500 Big Horn", basis: 43_700, grossPct: 0.09 },
  { year: 2024, make: "Ram", model: "2500 Laramie", basis: 58_900, grossPct: 0.08 },
  { year: 2022, make: "Jeep", model: "Grand Cherokee", basis: 39_400, grossPct: 0.09 },
  { year: 2024, make: "Jeep", model: "Wrangler Rubicon", basis: 46_800, grossPct: 0.085 },
  { year: 2023, make: "Jeep", model: "Compass", basis: 26_100, grossPct: 0.1 },

  { year: 2024, make: "Toyota", model: "RAV4 Hybrid", basis: 32_800, grossPct: 0.11 },
  { year: 2023, make: "Toyota", model: "Camry XSE", basis: 28_700, grossPct: 0.1 },
  { year: 2024, make: "Toyota", model: "Tacoma TRD", basis: 41_200, grossPct: 0.11 },
  { year: 2022, make: "Toyota", model: "Highlander", basis: 36_400, grossPct: 0.095 },
  { year: 2023, make: "Toyota", model: "Corolla", basis: 21_900, grossPct: 0.08 },

  { year: 2024, make: "Honda", model: "CR-V Hybrid", basis: 33_900, grossPct: 0.1 },
  { year: 2023, make: "Honda", model: "Accord Touring", basis: 30_200, grossPct: 0.09 },
  { year: 2022, make: "Honda", model: "Civic Si", basis: 24_750, grossPct: 0.09 },
  { year: 2024, make: "Honda", model: "Pilot Elite", basis: 43_100, grossPct: 0.09 },

  { year: 2023, make: "Nissan", model: "Rogue SV", basis: 25_600, grossPct: 0.095 },
  { year: 2022, make: "Nissan", model: "Altima", basis: 19_400, grossPct: 0.065 },
  { year: 2024, make: "Nissan", model: "Frontier PRO-4X", basis: 35_700, grossPct: 0.09 },

  { year: 2024, make: "Subaru", model: "Outback", basis: 29_300, grossPct: 0.1 },
  { year: 2023, make: "Subaru", model: "Forester", basis: 26_800, grossPct: 0.095 },

  { year: 2024, make: "Hyundai", model: "Tucson Hybrid", basis: 31_100, grossPct: 0.1 },
  { year: 2023, make: "Hyundai", model: "Santa Fe", basis: 33_400, grossPct: 0.09 },
  { year: 2022, make: "Hyundai", model: "Sonata", basis: 21_500, grossPct: 0.07 },

  { year: 2024, make: "Kia", model: "Telluride SX", basis: 44_900, grossPct: 0.1 },
  { year: 2023, make: "Kia", model: "Sportage", basis: 26_750, grossPct: 0.095 },
  { year: 2022, make: "Kia", model: "Forte", basis: 18_400, grossPct: 0.065 },

  { year: 2024, make: "BMW", model: "X5 xDrive40i", basis: 58_400, grossPct: 0.075 },
  { year: 2023, make: "BMW", model: "330i", basis: 37_800, grossPct: 0.08 },
  { year: 2022, make: "BMW", model: "5 Series", basis: 44_900, grossPct: 0.07 },

  { year: 2023, make: "Mercedes-Benz", model: "GLC 300", basis: 46_200, grossPct: 0.08 },
  { year: 2024, make: "Mercedes-Benz", model: "C 300", basis: 41_700, grossPct: 0.085 },
  { year: 2022, make: "Mercedes-Benz", model: "GLE 350", basis: 56_800, grossPct: 0.07 },

  { year: 2023, make: "Audi", model: "Q5", basis: 43_100, grossPct: 0.08 },
  { year: 2024, make: "Audi", model: "A4 Premium", basis: 38_900, grossPct: 0.085 },

  { year: 2023, make: "Lexus", model: "RX 350", basis: 49_400, grossPct: 0.085 },
  { year: 2024, make: "Lexus", model: "NX 350h", basis: 44_900, grossPct: 0.09 },

  { year: 2024, make: "Tesla", model: "Model Y LR", basis: 41_800, grossPct: 0.085 },
  { year: 2023, make: "Tesla", model: "Model 3 LR", basis: 34_700, grossPct: 0.08 },
  { year: 2022, make: "Tesla", model: "Model S", basis: 58_900, grossPct: 0.065 },

  { year: 2024, make: "Chevrolet", model: "Corvette Stingray", basis: 72_500, grossPct: 0.07 },
  { year: 2022, make: "Dodge", model: "Challenger R/T", basis: 34_800, grossPct: 0.08 },
  { year: 2023, make: "Mazda", model: "CX-5", basis: 27_400, grossPct: 0.09 },
  { year: 2024, make: "Mazda", model: "CX-50", basis: 31_700, grossPct: 0.095 },
  { year: 2022, make: "Volkswagen", model: "Atlas", basis: 32_900, grossPct: 0.08 },
  { year: 2024, make: "Volkswagen", model: "ID.4", basis: 36_400, grossPct: 0.075 },
  { year: 2023, make: "Acura", model: "MDX", basis: 48_700, grossPct: 0.08 },
  { year: 2024, make: "Infiniti", model: "QX60", basis: 49_900, grossPct: 0.075 },
];

/**
 * A bounded pseudo-random generator seeded by VIN index, so the fleet stays
 * stable across hot-reloads and between consumers (tests, hook, card).
 */
function seededRand(i: number, salt = 0): number {
  const x = Math.sin(i * 9301 + salt * 49297 + 101) * 43758.5453;
  return x - Math.floor(x);
}

/**
 * Days-on-lot distribution, tuned to produce a realistic aging curve:
 *
 *   • ~55% of units < 30d (fresh inventory)
 *   • ~25% between 30–60d (ripening)
 *   • ~20% > 60d (aged / distressed — drives the "toxic" flag)
 */
function seedDaysOnLot(i: number): number {
  const r = seededRand(i, 11);
  if (r < 0.55) return Math.round(2 + seededRand(i, 12) * 28); // 2–30
  if (r < 0.8) return Math.round(30 + seededRand(i, 13) * 30); // 30–60
  return Math.round(60 + seededRand(i, 14) * 55); // 60–115
}

/**
 * Compress the projected gross on aged units (dealers discount to move them),
 * and on 90+ day "distressed" units we often sell at a loss — modelled as a
 * gross of ~50% of the base expectation.
 */
function agedGrossMultiplier(daysOnLot: number): number {
  if (daysOnLot <= 45) return 1;
  if (daysOnLot <= 60) return 0.85;
  if (daysOnLot <= 90) return 0.65;
  return 0.45;
}

/**
 * Synthetic 17-char VIN built deterministically from the seed index. Uses the
 * standard "no I/O/Q" VIN character set so anything downstream that validates
 * length or checksum style at least doesn't immediately blow up.
 */
const VIN_CHARS = "ABCDEFGHJKLMNPRSTUVWXYZ0123456789";
function mockVin(index: number, make: string, year: number): string {
  const makePrefix = make.replace(/[^A-Z]/gi, "").slice(0, 3).toUpperCase().padEnd(3, "X");
  const yearChar = VIN_CHARS[year % VIN_CHARS.length];
  let tail = "";
  for (let k = 0; k < 10; k++) {
    tail += VIN_CHARS[Math.floor(seededRand(index, 20 + k) * VIN_CHARS.length)];
  }
  const digits = (100000 + index).toString().slice(-3);
  return `${makePrefix}${yearChar}${digits}${tail}`.slice(0, 17).toUpperCase();
}

export const MOCK_FLEET: FloorplanVehicle[] = SEED.map((seed, i) => {
  const daysOnLot = seedDaysOnLot(i);
  const baseGross = seed.basis * seed.grossPct;
  const projectedGross = Math.round(baseGross * agedGrossMultiplier(daysOnLot));
  const rooftop = ROOFTOPS[i % ROOFTOPS.length];
  return {
    vin: mockVin(i, seed.make, seed.year),
    year: seed.year,
    make: seed.make,
    model: seed.model,
    rooftop,
    basis: seed.basis,
    projectedGross,
    daysOnLot,
  } satisfies FloorplanVehicle;
});
