
import AsyncStorage from '@react-native-async-storage/async-storage';
import { allUSStocks } from '@/data/mockStockData';

const LAST_UPDATE_KEY = '@stock_last_update';
const STOCK_DATA_KEY = '@stock_data_cache';

export interface StockUpdateInfo {
  lastUpdate: string;
  needsUpdate: boolean;
}

// Check if stock data needs to be updated (once per day)
export const checkIfNeedsUpdate = async (): Promise<StockUpdateInfo> => {
  try {
    const lastUpdateStr = await AsyncStorage.getItem(LAST_UPDATE_KEY);
    
    if (!lastUpdateStr) {
      console.log('No previous update found, needs update');
      return { lastUpdate: '', needsUpdate: true };
    }
    
    const lastUpdate = new Date(lastUpdateStr);
    const now = new Date();
    
    // Check if it's a different day
    const lastUpdateDay = lastUpdate.toDateString();
    const currentDay = now.toDateString();
    
    const needsUpdate = lastUpdateDay !== currentDay;
    
    console.log('Last update:', lastUpdateDay, 'Current:', currentDay, 'Needs update:', needsUpdate);
    
    return {
      lastUpdate: lastUpdate.toISOString(),
      needsUpdate,
    };
  } catch (error) {
    console.error('Error checking update status:', error);
    return { lastUpdate: '', needsUpdate: true };
  }
};

// Mark that stock data has been updated
export const markAsUpdated = async (): Promise<void> => {
  try {
    const now = new Date().toISOString();
    await AsyncStorage.setItem(LAST_UPDATE_KEY, now);
    console.log('Marked stock data as updated at:', now);
  } catch (error) {
    console.error('Error marking as updated:', error);
  }
};

// Get the last update time as a formatted string
export const getLastUpdateTime = async (): Promise<string> => {
  try {
    const lastUpdateStr = await AsyncStorage.getItem(LAST_UPDATE_KEY);
    
    if (!lastUpdateStr) {
      return 'Never';
    }
    
    const lastUpdate = new Date(lastUpdateStr);
    const now = new Date();
    
    // Calculate time difference
    const diffMs = now.getTime() - lastUpdate.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (diffHours < 1) {
      if (diffMinutes < 1) {
        return 'Just now';
      }
      return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago`;
    } else if (diffHours < 24) {
      return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    } else {
      const diffDays = Math.floor(diffHours / 24);
      return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    }
  } catch (error) {
    console.error('Error getting last update time:', error);
    return 'Unknown';
  }
};

// Force a manual refresh of stock data
export const forceRefresh = async (): Promise<void> => {
  try {
    console.log('Forcing stock data refresh...');
    await markAsUpdated();
  } catch (error) {
    console.error('Error forcing refresh:', error);
  }
};

// Clear all cached data (for debugging)
export const clearCache = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(LAST_UPDATE_KEY);
    await AsyncStorage.removeItem(STOCK_DATA_KEY);
    console.log('Cache cleared');
  } catch (error) {
    console.error('Error clearing cache:', error);
  }
};

// Enhanced pseudo-random number generator with seed
const seededRandom = (seed: number): number => {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
};

// Get a deterministic seed based on date and symbol
const getDailySeed = (symbol?: string): number => {
  const today = new Date();
  const dateStr = today.toISOString().split('T')[0];
  
  let hash = 0;
  const str = dateStr + (symbol || '');
  
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  
  return Math.abs(hash);
};

// Check if current time is during market hours (9:30 AM - 4:00 PM ET, Mon-Fri)
export const isMarketHours = (): boolean => {
  const now = new Date();
  const day = now.getDay();
  const hour = now.getHours();
  
  // Weekend check (0 = Sunday, 6 = Saturday)
  if (day === 0 || day === 6) {
    return false;
  }
  
  // Simplified market hours check (not accounting for timezone)
  // In a real app, you'd convert to ET timezone
  if (hour < 9 || hour >= 16) {
    return false;
  }
  
  return true;
};

// Get sector-based correlation factor
const getSectorCorrelation = (sector: string): number => {
  const seed = getDailySeed(sector);
  const random = seededRandom(seed);
  
  // Sectors tend to move together, so we add a correlation factor
  // This makes tech stocks move similarly, financials move similarly, etc.
  return -0.015 + (random * 0.03); // -1.5% to +1.5%
};

// Get volatility multiplier based on stock characteristics
const getVolatilityMultiplier = (symbol: string, sector: string): number => {
  // Different sectors have different volatility levels
  const sectorVolatility: { [key: string]: number } = {
    'Technology': 1.3,
    'Healthcare': 1.1,
    'Financial Services': 0.9,
    'Consumer Defensive': 0.7,
    'Consumer Cyclical': 1.0,
    'Energy': 1.4,
    'Industrials': 0.9,
    'Communication Services': 1.2,
    'Real Estate': 0.8,
    'Automotive': 1.5,
  };
  
  const baseVolatility = sectorVolatility[sector] || 1.0;
  
  // Add some stock-specific variation
  const seed = getDailySeed(symbol);
  const stockVariation = 0.8 + (seededRandom(seed) * 0.4); // 0.8 to 1.2
  
  return baseVolatility * stockVariation;
};

// Enhanced daily variation with realistic market behavior
export const getDailyVariation = (symbol?: string, sector?: string): number => {
  const seed = getDailySeed(symbol);
  const random = seededRandom(seed);
  
  // Base market movement (-2% to +2%)
  let variation = -0.02 + (random * 0.04);
  
  // Add sector correlation if provided
  if (sector) {
    const sectorMove = getSectorCorrelation(sector);
    variation = (variation * 0.6) + (sectorMove * 0.4); // 60% individual, 40% sector
  }
  
  // Add volatility multiplier if symbol provided
  if (symbol && sector) {
    const volatilityMult = getVolatilityMultiplier(symbol, sector);
    variation = variation * volatilityMult;
  }
  
  // Market tends to have a slight upward bias over time (0.02% per day average)
  const longTermBias = 0.0002;
  variation += longTermBias;
  
  // Clamp to reasonable daily limits (-10% to +10%)
  variation = Math.max(-0.10, Math.min(0.10, variation));
  
  // Convert to multiplier (e.g., -2% becomes 0.98, +2% becomes 1.02)
  return 1 + variation;
};

// Get trend persistence factor (stocks tend to continue their recent trend)
export const getTrendPersistence = (recentChanges: number[]): number => {
  if (recentChanges.length < 3) {
    return 0;
  }
  
  // Calculate average recent change
  const avgChange = recentChanges.reduce((sum, change) => sum + change, 0) / recentChanges.length;
  
  // Trend persistence: if stock has been going up, it's more likely to continue up
  // But with diminishing effect (max 30% influence)
  const persistence = Math.max(-0.003, Math.min(0.003, avgChange * 0.3));
  
  return persistence;
};

// Simulate intraday price movement (for more realistic updates)
export const getIntradayVariation = (): number => {
  const now = new Date();
  const minutes = now.getHours() * 60 + now.getMinutes();
  
  // Market opens at 9:30 AM (570 minutes), closes at 4:00 PM (960 minutes)
  const marketOpen = 570;
  const marketClose = 960;
  
  if (minutes < marketOpen || minutes > marketClose) {
    return 1.0; // No change outside market hours
  }
  
  // More volatility at market open and close
  const minutesSinceOpen = minutes - marketOpen;
  const minutesUntilClose = marketClose - minutes;
  const totalMarketMinutes = marketClose - marketOpen;
  
  // Higher volatility in first and last 30 minutes
  let volatilityFactor = 1.0;
  if (minutesSinceOpen < 30) {
    volatilityFactor = 1.5;
  } else if (minutesUntilClose < 30) {
    volatilityFactor = 1.3;
  }
  
  // Small random intraday movement
  const seed = getDailySeed() + minutes;
  const random = seededRandom(seed);
  const intradayChange = (-0.002 + (random * 0.004)) * volatilityFactor; // -0.2% to +0.2%
  
  return 1 + intradayChange;
};

// Get market sentiment factor (simulates overall market conditions)
export const getMarketSentiment = (): number => {
  const seed = getDailySeed('MARKET');
  const random = seededRandom(seed);
  
  // Overall market sentiment affects all stocks
  // -1% to +1% market-wide movement
  const sentiment = -0.01 + (random * 0.02);
  
  return sentiment;
};

// Enhanced variation with all factors combined
export const getEnhancedDailyVariation = (
  symbol: string,
  sector: string,
  recentChanges?: number[]
): number => {
  // Base daily variation
  let variation = getDailyVariation(symbol, sector);
  
  // Add trend persistence if we have recent data
  if (recentChanges && recentChanges.length > 0) {
    const trend = getTrendPersistence(recentChanges);
    variation = variation * (1 + trend);
  }
  
  // Add market sentiment
  const sentiment = getMarketSentiment();
  variation = variation * (1 + sentiment);
  
  // Add intraday variation if during market hours
  if (isMarketHours()) {
    const intraday = getIntradayVariation();
    variation = variation * intraday;
  }
  
  return variation;
};
