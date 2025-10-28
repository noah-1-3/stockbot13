
export interface StockData {
  symbol: string;
  name: string;
  currentPrice: number;
  previousClose: number;
  change: number;
  changePercent: number;
  predictedPrice: number;
  predictedChange: number;
  predictedChangePercent: number;
  confidence: number;
  historicalData: Array<{
    date: string;
    price: number;
  }>;
  predictionData: Array<{
    date: string;
    price: number;
  }>;
  isRealData?: boolean; // Flag to indicate if data is from real API or simulated
}

export interface WatchlistItem {
  symbol: string;
  name: string;
  currentPrice: number;
  change: number;
  changePercent: number;
  predictedChange: number;
}
