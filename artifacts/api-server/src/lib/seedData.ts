import { db, screenerTable, ohlcTable } from "@workspace/db";

interface StockSeed {
  code: string;
  name: string;
  sector: string;
  industry: string;
  subSector: string;
  marketCapital: number;
  per?: number | null;
  pbv?: number | null;
  roe?: number | null;
  roa?: number | null;
  der?: number | null;
  npm?: number | null;
  week4PC?: number | null;
  week13PC?: number | null;
  week26PC?: number | null;
  week52PC?: number | null;
  ytdpc?: number | null;
  mtdpc?: number | null;
  notation?: string | null;
  basePrice: number;
  volatility: number;
}

const SEED_STOCKS: StockSeed[] = [
  { code: "BBCA", name: "Bank Central Asia Tbk", sector: "Financials", industry: "Banking", subSector: "Banks", marketCapital: 1050000000000000, per: 24.5, pbv: 4.2, roe: 18.5, roa: 2.8, der: 5.2, npm: 35.2, week4PC: 2.1, week13PC: 5.3, week26PC: 12.4, week52PC: 18.2, ytdpc: 8.5, mtdpc: 1.2, basePrice: 9450, volatility: 0.012 },
  { code: "BBRI", name: "Bank Rakyat Indonesia Tbk", sector: "Financials", industry: "Banking", subSector: "Banks", marketCapital: 750000000000000, per: 13.2, pbv: 2.1, roe: 16.8, roa: 2.1, der: 6.8, npm: 28.4, week4PC: 1.5, week13PC: 3.2, week26PC: 8.5, week52PC: 14.2, ytdpc: 6.2, mtdpc: 0.8, basePrice: 4200, volatility: 0.015 },
  { code: "BMRI", name: "Bank Mandiri Tbk", sector: "Financials", industry: "Banking", subSector: "Banks", marketCapital: 620000000000000, per: 11.8, pbv: 1.8, roe: 17.2, roa: 2.2, der: 6.2, npm: 30.1, week4PC: 1.8, week13PC: 4.1, week26PC: 9.8, week52PC: 15.5, ytdpc: 7.1, mtdpc: 1.0, basePrice: 6550, volatility: 0.013 },
  { code: "BBNI", name: "Bank Negara Indonesia Tbk", sector: "Financials", industry: "Banking", subSector: "Banks", marketCapital: 280000000000000, per: 9.5, pbv: 1.2, roe: 13.5, roa: 1.6, der: 7.1, npm: 25.8, week4PC: 0.8, week13PC: 2.5, week26PC: 6.2, week52PC: 10.5, ytdpc: 4.8, mtdpc: 0.5, basePrice: 4650, volatility: 0.014 },
  { code: "TLKM", name: "Telkom Indonesia Tbk", sector: "Telecommunications", industry: "Telecommunications", subSector: "Integrated Telecom", marketCapital: 320000000000000, per: 15.8, pbv: 2.8, roe: 18.2, roa: 5.2, der: 1.8, npm: 22.5, week4PC: -1.2, week13PC: -2.8, week26PC: -5.5, week52PC: -8.2, ytdpc: -3.5, mtdpc: -0.8, basePrice: 3100, volatility: 0.013 },
  { code: "ASII", name: "Astra International Tbk", sector: "Consumer Cyclicals", industry: "Automotive", subSector: "Automotive", marketCapital: 420000000000000, per: 12.5, pbv: 1.9, roe: 15.8, roa: 5.8, der: 1.2, npm: 8.5, week4PC: 1.2, week13PC: 3.5, week26PC: 7.8, week52PC: 12.5, ytdpc: 5.8, mtdpc: 0.8, basePrice: 4550, volatility: 0.014 },
  { code: "UNVR", name: "Unilever Indonesia Tbk", sector: "Consumer Non-Cyclicals", industry: "Food & Beverages", subSector: "Personal Care", marketCapital: 85000000000000, per: 28.5, pbv: 45.2, roe: 165.5, roa: 22.5, der: 1.5, npm: 18.5, week4PC: -0.5, week13PC: -1.8, week26PC: -4.2, week52PC: -8.5, ytdpc: -2.8, mtdpc: -0.3, basePrice: 2150, volatility: 0.011 },
  { code: "HMSP", name: "Hanjaya Mandala Sampoerna Tbk", sector: "Consumer Non-Cyclicals", industry: "Tobacco", subSector: "Tobacco", marketCapital: 180000000000000, per: 18.2, pbv: 5.8, roe: 32.5, roa: 22.1, der: 0.5, npm: 15.8, week4PC: 0.5, week13PC: 1.2, week26PC: 3.5, week52PC: 5.8, ytdpc: 2.5, mtdpc: 0.2, basePrice: 800, volatility: 0.012 },
  { code: "INDF", name: "Indofood Sukses Makmur Tbk", sector: "Consumer Non-Cyclicals", industry: "Food & Beverages", subSector: "Food Products", marketCapital: 95000000000000, per: 9.8, pbv: 1.2, roe: 12.5, roa: 4.8, der: 1.2, npm: 6.5, week4PC: 1.8, week13PC: 4.2, week26PC: 8.5, week52PC: 14.2, ytdpc: 6.2, mtdpc: 0.8, basePrice: 6300, volatility: 0.013 },
  { code: "ICBP", name: "Indofood CBP Sukses Makmur Tbk", sector: "Consumer Non-Cyclicals", industry: "Food & Beverages", subSector: "Food Products", marketCapital: 115000000000000, per: 18.5, pbv: 3.2, roe: 17.8, roa: 9.5, der: 1.0, npm: 12.8, week4PC: 2.2, week13PC: 5.5, week26PC: 11.2, week52PC: 18.5, ytdpc: 8.2, mtdpc: 1.1, basePrice: 9550, volatility: 0.012 },
  { code: "GGRM", name: "Gudang Garam Tbk", sector: "Consumer Non-Cyclicals", industry: "Tobacco", subSector: "Tobacco", marketCapital: 65000000000000, per: 12.2, pbv: 1.5, roe: 12.8, roa: 7.8, der: 0.6, npm: 8.2, week4PC: -0.8, week13PC: -2.1, week26PC: -4.5, week52PC: -7.8, ytdpc: -3.2, mtdpc: -0.4, basePrice: 22000, volatility: 0.016 },
  { code: "PGAS", name: "Perusahaan Gas Negara Tbk", sector: "Energy", industry: "Oil, Gas & Coal", subSector: "Gas Utilities", marketCapital: 58000000000000, per: 8.5, pbv: 1.1, roe: 13.5, roa: 4.5, der: 1.5, npm: 15.2, week4PC: 2.5, week13PC: 6.2, week26PC: 13.5, week52PC: 22.8, ytdpc: 10.2, mtdpc: 1.5, basePrice: 1550, volatility: 0.018 },
  { code: "PTBA", name: "Bukit Asam Tbk", sector: "Energy", industry: "Oil, Gas & Coal", subSector: "Coal", marketCapital: 42000000000000, per: 7.2, pbv: 2.2, roe: 32.5, roa: 18.5, der: 0.4, npm: 22.5, week4PC: 3.5, week13PC: 8.2, week26PC: 18.5, week52PC: 28.5, ytdpc: 14.2, mtdpc: 2.1, basePrice: 2800, volatility: 0.02 },
  { code: "ADRO", name: "Adaro Energy Indonesia Tbk", sector: "Energy", industry: "Oil, Gas & Coal", subSector: "Coal", marketCapital: 78000000000000, per: 6.8, pbv: 1.5, roe: 22.5, roa: 12.5, der: 0.8, npm: 18.8, week4PC: 4.2, week13PC: 10.5, week26PC: 22.8, week52PC: 35.5, ytdpc: 17.5, mtdpc: 2.5, basePrice: 2250, volatility: 0.022 },
  { code: "ITMG", name: "Indo Tambangraya Megah Tbk", sector: "Energy", industry: "Oil, Gas & Coal", subSector: "Coal", marketCapital: 35000000000000, per: 5.5, pbv: 2.8, roe: 52.5, roa: 32.5, der: 0.2, npm: 28.5, week4PC: 5.2, week13PC: 12.8, week26PC: 28.5, week52PC: 42.8, ytdpc: 22.5, mtdpc: 3.2, basePrice: 25500, volatility: 0.024 },
  { code: "ANTM", name: "Aneka Tambang Tbk", sector: "Basic Materials", industry: "Mining", subSector: "Metals & Minerals", marketCapital: 48000000000000, per: 22.5, pbv: 1.8, roe: 8.5, roa: 4.5, der: 0.8, npm: 8.2, week4PC: 1.5, week13PC: 3.8, week26PC: 8.5, week52PC: 14.2, ytdpc: 6.5, mtdpc: 0.8, basePrice: 1550, volatility: 0.022 },
  { code: "INCO", name: "Vale Indonesia Tbk", sector: "Basic Materials", industry: "Mining", subSector: "Metals & Minerals", marketCapital: 38000000000000, per: 18.5, pbv: 1.5, roe: 8.2, roa: 5.5, der: 0.5, npm: 15.5, week4PC: 2.8, week13PC: 7.2, week26PC: 15.8, week52PC: 25.5, ytdpc: 12.5, mtdpc: 1.8, basePrice: 3600, volatility: 0.023 },
  { code: "SMGR", name: "Semen Indonesia Tbk", sector: "Basic Materials", industry: "Cement", subSector: "Cement", marketCapital: 52000000000000, per: 28.5, pbv: 2.5, roe: 9.2, roa: 3.8, der: 0.9, npm: 7.8, week4PC: 0.5, week13PC: 1.2, week26PC: 2.8, week52PC: 5.5, ytdpc: 2.2, mtdpc: 0.3, basePrice: 5500, volatility: 0.013 },
  { code: "INTP", name: "Indocement Tunggal Prakarsa Tbk", sector: "Basic Materials", industry: "Cement", subSector: "Cement", marketCapital: 42000000000000, per: 35.5, pbv: 2.8, roe: 7.8, roa: 5.5, der: 0.2, npm: 12.5, week4PC: -1.2, week13PC: -3.2, week26PC: -6.5, week52PC: -10.8, ytdpc: -4.8, mtdpc: -0.6, basePrice: 7200, volatility: 0.014 },
  { code: "WIKA", name: "Wijaya Karya Tbk", sector: "Industrials", industry: "Construction", subSector: "Building Construction", marketCapital: 15000000000000, per: 18.5, pbv: 0.8, roe: 4.5, roa: 1.2, der: 2.8, npm: 3.8, week4PC: -2.5, week13PC: -6.2, week26PC: -12.5, week52PC: -20.5, ytdpc: -9.5, mtdpc: -1.2, notation: "GC", basePrice: 820, volatility: 0.025 },
  { code: "WSKT", name: "Waskita Karya Tbk", sector: "Industrials", industry: "Construction", subSector: "Building Construction", marketCapital: 8500000000000, per: null, pbv: 0.5, roe: -8.5, roa: -2.5, der: 5.8, npm: -5.2, week4PC: -5.2, week13PC: -12.5, week26PC: -22.5, week52PC: -35.8, ytdpc: -18.5, mtdpc: -2.5, notation: "GC", basePrice: 168, volatility: 0.035 },
  { code: "UNTR", name: "United Tractors Tbk", sector: "Industrials", industry: "Machinery", subSector: "Heavy Equipment", marketCapital: 165000000000000, per: 10.5, pbv: 2.2, roe: 21.5, roa: 10.5, der: 0.8, npm: 14.2, week4PC: 2.8, week13PC: 7.2, week26PC: 15.8, week52PC: 25.5, ytdpc: 12.2, mtdpc: 1.8, basePrice: 24500, volatility: 0.016 },
  { code: "AALI", name: "Astra Agro Lestari Tbk", sector: "Consumer Non-Cyclicals", industry: "Agriculture", subSector: "Plantation", marketCapital: 28000000000000, per: 14.5, pbv: 1.5, roe: 10.5, roa: 6.2, der: 0.6, npm: 12.5, week4PC: 1.5, week13PC: 3.8, week26PC: 8.5, week52PC: 14.2, ytdpc: 6.5, mtdpc: 0.8, basePrice: 8100, volatility: 0.018 },
  { code: "JPFA", name: "Japfa Comfeed Indonesia Tbk", sector: "Consumer Non-Cyclicals", industry: "Food & Beverages", subSector: "Poultry", marketCapital: 22000000000000, per: 12.8, pbv: 1.8, roe: 14.5, roa: 6.8, der: 1.2, npm: 5.8, week4PC: 3.2, week13PC: 8.5, week26PC: 18.8, week52PC: 30.2, ytdpc: 14.8, mtdpc: 2.2, basePrice: 1550, volatility: 0.025 },
  { code: "KLBF", name: "Kalbe Farma Tbk", sector: "Healthcare", industry: "Pharmaceuticals", subSector: "Healthcare Products", marketCapital: 95000000000000, per: 28.2, pbv: 4.8, roe: 17.5, roa: 14.8, der: 0.3, npm: 12.8, week4PC: 1.2, week13PC: 3.5, week26PC: 7.8, week52PC: 12.5, ytdpc: 6.2, mtdpc: 0.8, basePrice: 1600, volatility: 0.013 },
  { code: "SIDO", name: "Industri Jamu dan Farmasi Sido Muncul Tbk", sector: "Healthcare", industry: "Pharmaceuticals", subSector: "Traditional Medicine", marketCapital: 28000000000000, per: 22.5, pbv: 5.2, roe: 23.5, roa: 20.5, der: 0.1, npm: 22.8, week4PC: 0.8, week13PC: 2.2, week26PC: 5.5, week52PC: 9.2, ytdpc: 4.5, mtdpc: 0.5, basePrice: 520, volatility: 0.014 },
  { code: "MIKA", name: "Mitra Keluarga Karyasehat Tbk", sector: "Healthcare", industry: "Healthcare", subSector: "Hospitals", marketCapital: 48000000000000, per: 38.5, pbv: 6.2, roe: 16.8, roa: 13.5, der: 0.2, npm: 25.8, week4PC: 1.8, week13PC: 4.5, week26PC: 9.8, week52PC: 16.5, ytdpc: 7.8, mtdpc: 1.0, basePrice: 2800, volatility: 0.014 },
  { code: "GOTO", name: "GoTo Gojek Tokopedia Tbk", sector: "Technology", industry: "Technology", subSector: "Internet & Software", marketCapital: 85000000000000, per: null, pbv: 1.8, roe: -8.5, roa: -4.5, der: 0.5, npm: -12.5, week4PC: -3.5, week13PC: -8.2, week26PC: -15.8, week52PC: -25.5, ytdpc: -12.5, mtdpc: -1.5, basePrice: 58, volatility: 0.03 },
  { code: "BREN", name: "Barito Renewables Energy Tbk", sector: "Energy", industry: "Renewable Energy", subSector: "Geothermal", marketCapital: 220000000000000, per: 45.8, pbv: 8.2, roe: 18.5, roa: 8.5, der: 1.2, npm: 28.5, week4PC: 8.5, week13PC: 22.8, week26PC: 45.8, week52PC: 75.5, ytdpc: 38.5, mtdpc: 5.2, basePrice: 3800, volatility: 0.03 },
  { code: "AMMN", name: "Amman Mineral Internasional Tbk", sector: "Basic Materials", industry: "Mining", subSector: "Copper", marketCapital: 380000000000000, per: 28.5, pbv: 5.8, roe: 22.5, roa: 12.5, der: 0.8, npm: 32.5, week4PC: 5.8, week13PC: 15.2, week26PC: 32.8, week52PC: 52.5, ytdpc: 28.5, mtdpc: 3.8, basePrice: 7800, volatility: 0.026 },
  { code: "CUAN", name: "Petrindo Jaya Kreasi Tbk", sector: "Energy", industry: "Oil, Gas & Coal", subSector: "Coal", marketCapital: 185000000000000, per: 18.5, pbv: 12.5, roe: 68.5, roa: 38.5, der: 0.5, npm: 42.5, week4PC: 10.2, week13PC: 25.8, week26PC: 55.8, week52PC: 88.5, ytdpc: 48.5, mtdpc: 6.5, basePrice: 6500, volatility: 0.032 },
  { code: "TPIA", name: "Chandra Asri Pacific Tbk", sector: "Basic Materials", industry: "Chemicals", subSector: "Petrochemicals", marketCapital: 125000000000000, per: 35.5, pbv: 3.2, roe: 9.2, roa: 5.8, der: 1.2, npm: 8.5, week4PC: 1.2, week13PC: 3.5, week26PC: 7.8, week52PC: 12.5, ytdpc: 5.8, mtdpc: 0.8, basePrice: 8800, volatility: 0.016 },
  { code: "EMTK", name: "Elang Mahkota Teknologi Tbk", sector: "Telecommunications", industry: "Media", subSector: "Broadcasting", marketCapital: 35000000000000, per: 45.8, pbv: 2.8, roe: 6.2, roa: 3.8, der: 0.4, npm: 12.8, week4PC: -1.5, week13PC: -3.8, week26PC: -7.8, week52PC: -12.5, ytdpc: -5.8, mtdpc: -0.8, basePrice: 1850, volatility: 0.018 },
  { code: "MDKA", name: "Merdeka Copper Gold Tbk", sector: "Basic Materials", industry: "Mining", subSector: "Gold", marketCapital: 82000000000000, per: 45.2, pbv: 3.8, roe: 8.5, roa: 4.5, der: 1.5, npm: 12.5, week4PC: 3.8, week13PC: 9.5, week26PC: 20.8, week52PC: 33.5, ytdpc: 16.5, mtdpc: 2.2, basePrice: 2050, volatility: 0.025 },
  { code: "BKSL", name: "Sentul City Tbk", sector: "Properties & Real Estate", industry: "Real Estate", subSector: "Property", marketCapital: 5500000000000, per: 22.8, pbv: 0.5, roe: 2.2, roa: 1.2, der: 0.8, npm: 15.5, week4PC: 2.8, week13PC: 7.5, week26PC: 15.8, week52PC: 25.5, ytdpc: 12.8, mtdpc: 1.8, basePrice: 105, volatility: 0.025 },
  { code: "BSDE", name: "Bumi Serpong Damai Tbk", sector: "Properties & Real Estate", industry: "Real Estate", subSector: "Property Developer", marketCapital: 28000000000000, per: 12.5, pbv: 0.8, roe: 6.5, roa: 3.5, der: 0.6, npm: 22.5, week4PC: 1.5, week13PC: 3.8, week26PC: 8.5, week52PC: 14.2, ytdpc: 6.5, mtdpc: 0.8, basePrice: 1250, volatility: 0.016 },
  { code: "PWON", name: "Pakuwon Jati Tbk", sector: "Properties & Real Estate", industry: "Real Estate", subSector: "Property Developer", marketCapital: 22000000000000, per: 14.8, pbv: 1.2, roe: 8.5, roa: 5.2, der: 0.6, npm: 28.5, week4PC: 2.2, week13PC: 5.5, week26PC: 12.2, week52PC: 19.8, ytdpc: 9.5, mtdpc: 1.2, basePrice: 490, volatility: 0.016 },
  { code: "JSMR", name: "Jasa Marga Tbk", sector: "Industrials", industry: "Infrastructure", subSector: "Toll Roads", marketCapital: 42000000000000, per: 28.5, pbv: 2.2, roe: 7.8, roa: 2.5, der: 3.5, npm: 18.5, week4PC: 1.8, week13PC: 4.5, week26PC: 9.8, week52PC: 16.5, ytdpc: 7.8, mtdpc: 1.0, basePrice: 4400, volatility: 0.014 },
  { code: "EXCL", name: "XL Axiata Tbk", sector: "Telecommunications", industry: "Telecommunications", subSector: "Mobile Telecom", marketCapital: 32000000000000, per: 22.5, pbv: 1.8, roe: 8.2, roa: 2.8, der: 2.5, npm: 8.5, week4PC: 0.5, week13PC: 1.2, week26PC: 2.8, week52PC: 4.5, ytdpc: 2.2, mtdpc: 0.3, basePrice: 2050, volatility: 0.015 },
  { code: "ISAT", name: "Indosat Tbk", sector: "Telecommunications", industry: "Telecommunications", subSector: "Mobile Telecom", marketCapital: 82000000000000, per: 28.5, pbv: 3.2, roe: 11.5, roa: 3.8, der: 2.8, npm: 12.5, week4PC: 1.2, week13PC: 3.2, week26PC: 7.2, week52PC: 12.5, ytdpc: 5.8, mtdpc: 0.8, basePrice: 2600, volatility: 0.015 },
  { code: "ACES", name: "Ace Hardware Indonesia Tbk", sector: "Consumer Cyclicals", industry: "Retail", subSector: "Home Improvement Retail", marketCapital: 18500000000000, per: 28.5, pbv: 3.8, roe: 13.5, roa: 11.5, der: 0.2, npm: 10.8, week4PC: 1.8, week13PC: 4.5, week26PC: 9.8, week52PC: 16.5, ytdpc: 7.8, mtdpc: 1.0, basePrice: 820, volatility: 0.016 },
  { code: "MAPA", name: "Map Aktif Adiperkasa Tbk", sector: "Consumer Cyclicals", industry: "Retail", subSector: "Apparel Retail", marketCapital: 12000000000000, per: 22.5, pbv: 4.5, roe: 20.8, roa: 8.5, der: 1.2, npm: 8.5, week4PC: 2.5, week13PC: 6.2, week26PC: 13.8, week52PC: 22.5, ytdpc: 11.2, mtdpc: 1.5, basePrice: 680, volatility: 0.02 },
  { code: "AKRA", name: "AKR Corporindo Tbk", sector: "Energy", industry: "Oil Distribution", subSector: "Energy Distribution", marketCapital: 35000000000000, per: 18.5, pbv: 2.8, roe: 15.8, roa: 8.2, der: 0.8, npm: 8.5, week4PC: 2.2, week13PC: 5.5, week26PC: 12.2, week52PC: 19.8, ytdpc: 9.8, mtdpc: 1.2, basePrice: 1450, volatility: 0.017 },
  { code: "SMRA", name: "Summarecon Agung Tbk", sector: "Properties & Real Estate", industry: "Real Estate", subSector: "Property Developer", marketCapital: 14000000000000, per: 18.5, pbv: 1.2, roe: 6.8, roa: 3.5, der: 1.5, npm: 15.5, week4PC: 1.5, week13PC: 3.8, week26PC: 8.5, week52PC: 14.2, ytdpc: 6.5, mtdpc: 0.8, basePrice: 640, volatility: 0.017 },
  { code: "CPIN", name: "Charoen Pokphand Indonesia Tbk", sector: "Consumer Non-Cyclicals", industry: "Food & Beverages", subSector: "Poultry", marketCapital: 78000000000000, per: 22.5, pbv: 4.2, roe: 18.8, roa: 8.5, der: 0.8, npm: 7.5, week4PC: 3.8, week13PC: 9.5, week26PC: 20.8, week52PC: 33.5, ytdpc: 16.5, mtdpc: 2.2, basePrice: 4500, volatility: 0.018 },
  { code: "TOWR", name: "Sarana Menara Nusantara Tbk", sector: "Telecommunications", industry: "Tower", subSector: "Cell Towers", marketCapital: 55000000000000, per: 22.5, pbv: 4.8, roe: 21.5, roa: 8.5, der: 2.2, npm: 28.8, week4PC: 1.5, week13PC: 3.8, week26PC: 8.5, week52PC: 14.2, ytdpc: 6.5, mtdpc: 0.8, basePrice: 930, volatility: 0.013 },
  { code: "HEAL", name: "Medikaloka Hermina Tbk", sector: "Healthcare", industry: "Healthcare", subSector: "Hospitals", marketCapital: 25000000000000, per: 38.5, pbv: 4.8, roe: 12.8, roa: 8.5, der: 0.5, npm: 12.8, week4PC: 2.5, week13PC: 6.2, week26PC: 13.8, week52PC: 22.5, ytdpc: 11.2, mtdpc: 1.5, basePrice: 1580, volatility: 0.018 },
  { code: "BFIN", name: "BFI Finance Indonesia Tbk", sector: "Financials", industry: "Multifinance", subSector: "Finance", marketCapital: 18000000000000, per: 8.5, pbv: 1.8, roe: 22.5, roa: 5.8, der: 3.2, npm: 25.8, week4PC: 3.5, week13PC: 8.8, week26PC: 19.5, week52PC: 31.5, ytdpc: 15.8, mtdpc: 2.1, basePrice: 1250, volatility: 0.02 },
  { code: "ERAA", name: "Erajaya Swasembada Tbk", sector: "Consumer Cyclicals", industry: "Retail", subSector: "Electronics Retail", marketCapital: 8500000000000, per: 12.5, pbv: 1.5, roe: 12.8, roa: 5.5, der: 1.5, npm: 2.5, week4PC: 4.2, week13PC: 10.8, week26PC: 23.5, week52PC: 38.5, ytdpc: 19.5, mtdpc: 2.8, basePrice: 480, volatility: 0.025 },
  { code: "TKIM", name: "Pabrik Kertas Tjiwi Kimia Tbk", sector: "Basic Materials", industry: "Paper", subSector: "Paper", marketCapital: 22000000000000, per: 8.8, pbv: 0.9, roe: 10.5, roa: 5.8, der: 0.8, npm: 8.5, week4PC: 2.8, week13PC: 7.2, week26PC: 15.8, week52PC: 25.8, ytdpc: 12.8, mtdpc: 1.8, basePrice: 7800, volatility: 0.02 },
  { code: "DOID", name: "Delta Dunia Makmur Tbk", sector: "Energy", industry: "Oil, Gas & Coal", subSector: "Coal Mining Services", marketCapital: 12000000000000, per: 9.5, pbv: 2.5, roe: 28.5, roa: 8.5, der: 2.5, npm: 10.5, week4PC: 4.8, week13PC: 12.5, week26PC: 27.8, week52PC: 45.5, ytdpc: 22.8, mtdpc: 3.2, basePrice: 680, volatility: 0.028 },
];

function getWorkingDays(startDate: Date, endDate: Date): Date[] {
  const days: Date[] = [];
  const current = new Date(startDate);
  while (current <= endDate) {
    const dow = current.getDay();
    if (dow !== 0 && dow !== 6) {
      days.push(new Date(current));
    }
    current.setDate(current.getDate() + 1);
  }
  return days;
}

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0x100000000;
  };
}

function generateOhlc(
  code: string,
  basePrice: number,
  volatility: number,
  week26PC: number | null,
  days: Date[]
): Array<{
  code: string;
  date: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  value: number;
  bidVolume: number;
  offerVolume: number;
  foreignBuy: number;
  foreignSell: number;
}> {
  const totalReturn = (week26PC ?? 0) / 100;
  const dailyDrift = totalReturn / (days.length || 1);
  const seed = code.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const rand = seededRandom(seed);

  const roundToLot = (price: number): number => {
    if (price < 200) return Math.round(price);
    if (price < 500) return Math.round(price / 2) * 2;
    if (price < 2000) return Math.round(price / 5) * 5;
    if (price < 5000) return Math.round(price / 25) * 25;
    return Math.round(price / 50) * 50;
  };

  const startPrice = basePrice / (1 + totalReturn);
  let prevClose = roundToLot(startPrice);

  return days.map((day) => {
    const shock = (rand() - 0.5) * 2 * volatility;
    const close = Math.max(1, prevClose * (1 + dailyDrift + shock));
    const roundedClose = roundToLot(close);

    const highFactor = 1 + rand() * volatility * 0.8;
    const lowFactor = 1 - rand() * volatility * 0.8;
    const open = roundToLot(prevClose * (1 + (rand() - 0.5) * volatility * 0.5));
    const high = roundToLot(Math.max(open, roundedClose) * highFactor);
    const low = roundToLot(Math.min(open, roundedClose) * lowFactor);

    const baseVolume = (basePrice < 500 ? 20000000 : basePrice < 2000 ? 5000000 : 1000000);
    const volume = Math.round(baseVolume * (0.5 + rand()) / 100) * 100;
    const value = Math.round(volume * roundedClose);

    const bidRatio = 0.3 + rand() * 0.4;
    const bidVolume = Math.round(volume * bidRatio / 100) * 100;
    const offerVolume = volume - bidVolume;

    const foreignFraction = 0.05 + rand() * 0.25;
    const foreignBuy = Math.round(value * foreignFraction * (0.4 + rand() * 0.6));
    const foreignSell = Math.round(value * foreignFraction * (0.4 + rand() * 0.6));

    const dateStr = day.toISOString().slice(0, 10).replace(/-/g, "");
    const dateInt = parseInt(dateStr, 10);

    prevClose = roundedClose;

    return {
      code,
      date: dateInt,
      open,
      high,
      low,
      close: roundedClose,
      volume,
      value,
      bidVolume,
      offerVolume,
      foreignBuy,
      foreignSell,
    };
  });
}

export async function seedIfEmpty(): Promise<void> {
  try {
    const existing = await db.select({ code: screenerTable.code }).from(screenerTable).limit(1);
    const hasOhlc = await db.select({ code: ohlcTable.code }).from(ohlcTable).limit(1);

    if (existing.length > 0 && hasOhlc.length > 0) return;

    console.log("[seed] Seeding sample IDX stock data...");
    for (const stock of SEED_STOCKS) {
      await db.insert(screenerTable).values({
        code: stock.code,
        name: stock.name,
        sector: stock.sector,
        industry: stock.industry,
        subSector: stock.subSector,
        marketCapital: stock.marketCapital,
        per: stock.per ?? null,
        pbv: stock.pbv ?? null,
        roe: stock.roe ?? null,
        roa: stock.roa ?? null,
        der: stock.der ?? null,
        npm: stock.npm ?? null,
        week4PC: stock.week4PC ?? null,
        week13PC: stock.week13PC ?? null,
        week26PC: stock.week26PC ?? null,
        week52PC: stock.week52PC ?? null,
        ytdpc: stock.ytdpc ?? null,
        mtdpc: stock.mtdpc ?? null,
        notation: stock.notation ?? null,
      }).onConflictDoNothing();
    }
    console.log(`[seed] Seeded ${SEED_STOCKS.length} stocks`);

    console.log("[seed] Generating 1-year OHLC price history...");
    const endDate = new Date();
    const startDate = new Date();
    startDate.setFullYear(startDate.getFullYear() - 1);
    const workingDays = getWorkingDays(startDate, endDate);

    for (const stock of SEED_STOCKS) {
      const rows = generateOhlc(stock.code, stock.basePrice, stock.volatility, stock.week26PC ?? null, workingDays);
      for (const row of rows) {
        await db.insert(ohlcTable).values(row).onConflictDoNothing();
      }
    }
    console.log(`[seed] Generated OHLC data for ${SEED_STOCKS.length} stocks (${workingDays.length} days each)`);
  } catch (err) {
    console.error("[seed] Error seeding data:", err);
  }
}
