
import { StockData, WatchlistItem } from '@/types/stock';
import { 
  fetchStockQuoteSupabase, 
  fetchHistoricalDataSupabase, 
  fetchCompanyProfileSupabase,
  searchStocksSupabase,
  getStocksFromDB,
  getUserWatchlist,
  checkSupabaseConnection,
  savePrediction,
  getStockPredictions
} from '@/utils/supabaseStockService';

// Default stocks to display
export const mockStocks = [
  { symbol: 'AAPL', name: 'Apple Inc.', sector: 'Technology', basePrice: 175 },
  { symbol: 'GOOGL', name: 'Alphabet Inc.', sector: 'Technology', basePrice: 140 },
  { symbol: 'MSFT', name: 'Microsoft Corporation', sector: 'Technology', basePrice: 380 },
  { symbol: 'AMZN', name: 'Amazon.com Inc.', sector: 'Consumer Cyclical', basePrice: 170 },
  { symbol: 'TSLA', name: 'Tesla Inc.', sector: 'Automotive', basePrice: 245 },
  { symbol: 'META', name: 'Meta Platforms Inc.', sector: 'Technology', basePrice: 485 },
  { symbol: 'NVDA', name: 'NVIDIA Corporation', sector: 'Technology', basePrice: 880 },
  { symbol: 'JPM', name: 'JPMorgan Chase & Co.', sector: 'Financial Services', basePrice: 195 },
];

export const allUSStocks = mockStocks;

// Generate prediction data based on historical prices
function generatePredictionData(lastPrice: number, daysAhead: number, trend: number = 0.02): Array<{ date: string; price: number }> {
  const predictions = [];
  let currentPrice = lastPrice;
  const today = new Date();

  for (let i = 1; i <= daysAhead; i++) {
    const futureDate = new Date(today);
    futureDate.setDate(today.getDate() + i);
    
    const randomFactor = (Math.random() - 0.5) * 0.04;
    const trendFactor = trend * (1 + Math.random() * 0.5);
    currentPrice = currentPrice * (1 + trendFactor + randomFactor);
    
    predictions.push({
      date: futureDate.toISOString().split('T')[0],
      price: parseFloat(currentPrice.toFixed(2)),
    });
  }

  return predictions;
}

// Generate simulated stock data
function generateSimulatedData(symbol: string, name: string, basePrice: number, sector: string): StockData {
  console.log('📊 Generating simulated data for:', symbol);
  
  const changePercent = (Math.random() - 0.5) * 10;
  const change = basePrice * (changePercent / 100);
  const currentPrice = basePrice + change;

  const historical = [];
  let price = basePrice * 0.9;
  const today = new Date();

  for (let i = 30; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    price = price * (1 + (Math.random() - 0.48) * 0.05);
    historical.push({
      date: date.toISOString().split('T')[0],
      price: parseFloat(price.toFixed(2)),
    });
  }

  const lastPrice = historical[historical.length - 1].price;
  const trend = changePercent > 0 ? 0.02 : -0.01;
  const predictions = generatePredictionData(lastPrice, 7, trend);

  const predictedPrice = predictions[predictions.length - 1].price;
  const predictedChange = predictedPrice - currentPrice;
  const predictedChangePercent = (predictedChange / currentPrice) * 100;

  console.log('✅ Generated simulated data for', symbol, '- Price:', currentPrice.toFixed(2));

  return {
    symbol,
    name,
    currentPrice,
    previousClose: basePrice,
    change,
    changePercent,
    predictedPrice,
    predictedChange,
    predictedChangePercent,
    confidence: 0.65,
    historicalData: historical,
    predictionData: predictions,
    isRealData: false,
  };
}

// Fetch real stock data from Supabase
async function fetchRealStockData(symbol: string, name: string, sector: string, basePrice: number): Promise<StockData | null> {
  try {
    console.log('🔄 Attempting to fetch real stock data via Supabase for:', symbol);

    // Fetch quote
    const quoteData = await fetchStockQuoteSupabase(symbol);
    if (!quoteData || quoteData.error) {
      console.log('⚠️ Failed to fetch quote for', symbol, '- Error:', quoteData?.error);
      return null;
    }

    console.log('✅ Quote data received for', symbol, '- Price:', quoteData.c);

    // Fetch historical data
    const historicalData = await fetchHistoricalDataSupabase(symbol);
    if (!historicalData || historicalData.s !== 'ok' || historicalData.error) {
      console.log('⚠️ Failed to fetch historical data for', symbol);
      return null;
    }

    console.log('✅ Historical data received for', symbol, '- Points:', historicalData.t?.length || 0);

    // Fetch company profile for name
    const profile = await fetchCompanyProfileSupabase(symbol);
    const companyName = profile?.name || name;

    // Convert historical data to chart format
    const historical = historicalData.t.map((timestamp: number, index: number) => ({
      date: new Date(timestamp * 1000).toISOString().split('T')[0],
      price: historicalData.c[index],
    }));

    // Generate predictions
    const lastPrice = quoteData.c;
    const trend = quoteData.dp > 0 ? 0.02 : -0.01;
    const predictions = generatePredictionData(lastPrice, 7, trend);

    // Save predictions to database (don't await, fire and forget)
    savePrediction(symbol, predictions[predictions.length - 1].date, predictions[predictions.length - 1].price, 0.75).catch(err => {
      console.log('⚠️ Failed to save prediction:', err);
    });

    const predictedPrice = predictions[predictions.length - 1].price;
    const predictedChange = predictedPrice - lastPrice;
    const predictedChangePercent = (predictedChange / lastPrice) * 100;

    const stockData: StockData = {
      symbol,
      name: companyName,
      currentPrice: lastPrice,
      previousClose: quoteData.pc,
      change: quoteData.d,
      changePercent: quoteData.dp,
      predictedPrice,
      predictedChange,
      predictedChangePercent,
      confidence: 0.85,
      historicalData: historical,
      predictionData: predictions,
      isRealData: true,
    };

    console.log('✅ Successfully fetched real data via Supabase for:', symbol, '- Price:', lastPrice);
    return stockData;
  } catch (error) {
    console.log('⚠️ Error fetching real stock data for', symbol, ':', error);
    return null;
  }
}

// Generate stock data (tries Supabase first, falls back to simulated)
export async function generateStockData(
  symbol: string,
  name: string,
  basePrice: number,
  sector: string
): Promise<StockData> {
  console.log('🎯 generateStockData called for:', symbol);
  
  // Try to fetch real data via Supabase
  const realData = await fetchRealStockData(symbol, name, sector, basePrice);
  if (realData) {
    console.log('✅ Returning real data for:', symbol);
    return realData;
  }

  // Fallback to simulated data
  console.log('📊 Using simulated data for:', symbol);
  return generateSimulatedData(symbol, name, basePrice, sector);
}

// Generate mock stocks
export async function generateMockStocks(): Promise<StockData[]> {
  console.log('📊 Generating stock data...');
  
  const stockPromises = mockStocks.map(stock =>
    generateStockData(stock.symbol, stock.name, stock.basePrice, stock.sector)
  );

  const stocks = await Promise.all(stockPromises);
  console.log('✅ Generated', stocks.length, 'stocks');
  return stocks;
}

// Get watchlist
export async function getWatchlist(): Promise<WatchlistItem[]> {
  try {
    console.log('📋 Getting watchlist...');
    
    // Get user's watchlist symbols
    const watchlistSymbols = await getUserWatchlist();
    
    if (watchlistSymbols.length === 0) {
      console.log('⚠️ Watchlist is empty, using default stocks');
      // Return default stocks if watchlist is empty
      const stocks = await generateMockStocks();
      return stocks.slice(0, 5).map(stock => ({
        symbol: stock.symbol,
        name: stock.name,
        currentPrice: stock.currentPrice,
        change: stock.change,
        changePercent: stock.changePercent,
        predictedChange: stock.predictedChange,
      }));
    }

    // Fetch data for watchlist stocks
    const stockPromises = watchlistSymbols.map(async (symbol) => {
      const stockInfo = mockStocks.find(s => s.symbol === symbol) || { 
        symbol, 
        name: symbol, 
        sector: 'Unknown',
        basePrice: 150 + Math.random() * 200
      };
      return generateStockData(stockInfo.symbol, stockInfo.name, stockInfo.basePrice, stockInfo.sector);
    });

    const stocks = await Promise.all(stockPromises);
    
    return stocks.map(stock => ({
      symbol: stock.symbol,
      name: stock.name,
      currentPrice: stock.currentPrice,
      change: stock.change,
      changePercent: stock.changePercent,
      predictedChange: stock.predictedChange,
    }));
  } catch (error) {
    console.error('❌ Error getting watchlist:', error);
    return [];
  }
}

// Search stocks
export async function searchStocks(query: string): Promise<WatchlistItem[]> {
  try {
    if (!query || query.trim().length === 0) {
      return [];
    }

    console.log('🔍 Searching stocks:', query);
    
    // Try Supabase search first
    const results = await searchStocksSupabase(query);
    
    if (results.length > 0) {
      // Fetch data for search results
      const stockPromises = results.slice(0, 10).map(result => {
        const stockInfo = mockStocks.find(s => s.symbol === result.symbol);
        const basePrice = stockInfo?.basePrice || 150 + Math.random() * 200;
        return generateStockData(result.symbol, result.description, basePrice, 'Unknown');
      });

      const stocks = await Promise.all(stockPromises);
      
      return stocks.map(stock => ({
        symbol: stock.symbol,
        name: stock.name,
        currentPrice: stock.currentPrice,
        change: stock.change,
        changePercent: stock.changePercent,
        predictedChange: stock.predictedChange,
      }));
    }

    // Fallback to local search
    console.log('⚠️ No results from Supabase, searching local stocks');
    const filtered = mockStocks.filter(
      stock =>
        stock.symbol.toLowerCase().includes(query.toLowerCase()) ||
        stock.name.toLowerCase().includes(query.toLowerCase())
    );

    const stockPromises = filtered.map(stock =>
      generateStockData(stock.symbol, stock.name, stock.basePrice, stock.sector)
    );

    const stocks = await Promise.all(stockPromises);
    
    return stocks.map(stock => ({
      symbol: stock.symbol,
      name: stock.name,
      currentPrice: stock.currentPrice,
      change: stock.change,
      changePercent: stock.changePercent,
      predictedChange: stock.predictedChange,
    }));
  } catch (error) {
    console.error('❌ Error searching stocks:', error);
    return [];
  }
}

// Get stock by symbol
export async function getStockBySymbol(symbol: string): Promise<StockData | null> {
  try {
    console.log('📊 getStockBySymbol called for:', symbol);
    
    if (!symbol) {
      console.error('❌ No symbol provided to getStockBySymbol');
      return null;
    }
    
    const stockInfo = mockStocks.find(s => s.symbol === symbol);
    
    if (stockInfo) {
      console.log('✅ Found stock info in mockStocks:', stockInfo.name);
      const data = await generateStockData(stockInfo.symbol, stockInfo.name, stockInfo.basePrice, stockInfo.sector);
      console.log('✅ Generated stock data:', data ? 'Success' : 'Failed');
      return data;
    }
    
    // If not in mock stocks, try to fetch anyway
    console.log('⚠️ Stock not in mockStocks, generating with defaults');
    return await generateStockData(symbol, symbol, 150 + Math.random() * 200, 'Unknown');
  } catch (error) {
    console.error('❌ Error in getStockBySymbol:', error);
    return null;
  }
}

// Generate dynamic prediction
export async function generateDynamicPrediction(
  symbol: string,
  targetDate: Date
): Promise<{ predictedPrice: number; confidence: number; predictionData: Array<{ date: string; price: number }> } | null> {
  try {
    console.log('🔮 Generating dynamic prediction for:', symbol);
    
    const stock = await getStockBySymbol(symbol);
    if (!stock) {
      console.error('❌ Could not get stock data for prediction');
      return null;
    }

    const today = new Date();
    const daysAhead = Math.ceil((targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (daysAhead <= 0) {
      console.error('❌ Target date must be in the future');
      return null;
    }

    console.log('📈 Generating prediction for', daysAhead, 'days ahead');
    const trend = stock.changePercent > 0 ? 0.02 : -0.01;
    const predictions = generatePredictionData(stock.currentPrice, daysAhead, trend);

    // Save predictions to database (fire and forget)
    savePrediction(symbol, predictions[predictions.length - 1].date, predictions[predictions.length - 1].price, 0.75).catch(err => {
      console.log('⚠️ Failed to save prediction:', err);
    });

    console.log('✅ Prediction generated successfully');
    return {
      predictedPrice: predictions[predictions.length - 1].price,
      confidence: 0.75,
      predictionData: predictions,
    };
  } catch (error) {
    console.error('❌ Error generating dynamic prediction:', error);
    return null;
  }
}

// Get company description
export async function getCompanyDescription(symbol: string): Promise<string> {
  try {
    const profile = await fetchCompanyProfileSupabase(symbol);
    if (profile && profile.name) {
      return `${profile.name} is a leading company in the ${profile.finnhubIndustry || 'industry'} sector. The company is headquartered in ${profile.country || 'the United States'} and trades on the ${profile.exchange || 'stock exchange'}.`;
    }
    
    // Fallback to mock description
    const stockInfo = mockStocks.find(s => s.symbol === symbol);
    if (stockInfo) {
      return `${stockInfo.name} is a leading company in the ${stockInfo.sector} sector.`;
    }
    
    return `${symbol} is a publicly traded company.`;
  } catch (error) {
    console.log('⚠️ Error getting company description:', error);
    const stockInfo = mockStocks.find(s => s.symbol === symbol);
    if (stockInfo) {
      return `${stockInfo.name} is a leading company in the ${stockInfo.sector} sector.`;
    }
    return `${symbol} is a publicly traded company.`;
  }
}

// Initialize stocks
export async function initializeStocks(): Promise<void> {
  console.log('🚀 Initializing stocks...');
  await generateMockStocks();
  console.log('✅ Stocks initialized');
}

// Check API status - returns boolean
export async function checkAPIStatus(): Promise<boolean> {
  try {
    const isAvailable = await checkSupabaseConnection();
    console.log('API Status:', isAvailable ? 'Available' : 'Unavailable');
    return isAvailable;
  } catch (error) {
    console.error('❌ Error checking API status:', error);
    return false;
  }
}

// Get detailed API status - returns object with details
export async function getDetailedAPIStatus(): Promise<{
  isAvailable: boolean;
  message: string;
  suggestion: string;
}> {
  const isAvailable = await checkSupabaseConnection();
  
  if (isAvailable) {
    return {
      isAvailable: true,
      message: 'Supabase connection is active',
      suggestion: 'Real-time stock data is available. Note: Alpha Vantage API has rate limits (25 requests/day on free tier).',
    };
  }
  
  return {
    isAvailable: false,
    message: 'Using simulated stock data',
    suggestion: 'Simulated data provides realistic stock movements for demonstration purposes.',
  };
}
