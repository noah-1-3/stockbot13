
import { supabase } from '@/app/integrations/supabase/client';
import AsyncStorage from '@react-native-async-storage/async-storage';

const CACHE_KEY_PREFIX = '@supabase_stock_cache_';
const CACHE_DURATION = 60000; // 1 minute cache

interface CachedData<T> {
  data: T;
  timestamp: number;
}

// Get cached data if available and not expired
const getCachedData = async <T>(key: string): Promise<T | null> => {
  try {
    const cached = await AsyncStorage.getItem(CACHE_KEY_PREFIX + key);
    if (!cached) return null;

    const cachedData: CachedData<T> = JSON.parse(cached);
    const now = Date.now();

    if (now - cachedData.timestamp < CACHE_DURATION) {
      console.log('✅ Using cached Supabase data for:', key);
      return cachedData.data;
    }

    console.log('⏰ Supabase cache expired for:', key);
    return null;
  } catch (error) {
    console.log('⚠️ Error getting cached Supabase data:', error);
    return null;
  }
};

// Cache data
const setCachedData = async <T>(key: string, data: T): Promise<void> => {
  try {
    const cachedData: CachedData<T> = {
      data,
      timestamp: Date.now(),
    };
    await AsyncStorage.setItem(CACHE_KEY_PREFIX + key, JSON.stringify(cachedData));
    console.log('💾 Cached Supabase data for:', key);
  } catch (error) {
    console.log('⚠️ Error caching Supabase data:', error);
  }
};

// Fetch stock quote using Supabase Edge Function
export const fetchStockQuoteSupabase = async (symbol: string): Promise<any | null> => {
  try {
    const cacheKey = `quote_${symbol}`;
    const cached = await getCachedData<any>(cacheKey);
    if (cached) return cached;

    console.log('🔄 Fetching stock quote from Supabase for:', symbol);
    
    const { data, error } = await supabase.functions.invoke('fetch-stock-data', {
      body: { symbol, action: 'quote' },
    });

    if (error) {
      console.log('⚠️ Supabase function error:', error.message);
      return { error: error.message };
    }

    if (!data || data.error) {
      console.log('⚠️ Error in response:', data?.error);
      return { error: data?.error || 'Unknown error' };
    }

    console.log('✅ Successfully fetched quote from Supabase for:', symbol);
    await setCachedData(cacheKey, data);
    return data;
  } catch (error: any) {
    console.log('⚠️ Error fetching stock quote from Supabase:', error.message);
    return { error: error.message };
  }
};

// Fetch historical data using Supabase Edge Function
export const fetchHistoricalDataSupabase = async (symbol: string): Promise<any | null> => {
  try {
    const cacheKey = `history_${symbol}`;
    const cached = await getCachedData<any>(cacheKey);
    if (cached) return cached;

    console.log('🔄 Fetching historical data from Supabase for:', symbol);
    
    const { data, error } = await supabase.functions.invoke('fetch-stock-data', {
      body: { symbol, action: 'history' },
    });

    if (error) {
      console.log('⚠️ Supabase function error:', error.message);
      return { error: error.message };
    }

    if (!data || data.error) {
      console.log('⚠️ Error in response:', data?.error);
      return { error: data?.error || 'Unknown error' };
    }

    console.log('✅ Successfully fetched history from Supabase for:', symbol);
    await setCachedData(cacheKey, data);
    return data;
  } catch (error: any) {
    console.log('⚠️ Error fetching historical data from Supabase:', error.message);
    return { error: error.message };
  }
};

// Fetch company profile using Supabase Edge Function
export const fetchCompanyProfileSupabase = async (symbol: string): Promise<any | null> => {
  try {
    const cacheKey = `profile_${symbol}`;
    const cached = await getCachedData<any>(cacheKey);
    if (cached) return cached;

    console.log('🔄 Fetching company profile from Supabase for:', symbol);
    
    const { data, error } = await supabase.functions.invoke('fetch-stock-data', {
      body: { symbol, action: 'profile' },
    });

    if (error) {
      console.log('⚠️ Supabase function error:', error.message);
      return { error: error.message };
    }

    if (!data || data.error) {
      console.log('⚠️ Error in response:', data?.error);
      return { error: data?.error || 'Unknown error' };
    }

    console.log('✅ Successfully fetched profile from Supabase for:', symbol);
    await setCachedData(cacheKey, data);
    return data;
  } catch (error: any) {
    console.log('⚠️ Error fetching company profile from Supabase:', error.message);
    return { error: error.message };
  }
};

// Search stocks using Supabase Edge Function
export const searchStocksSupabase = async (query: string): Promise<Array<{ symbol: string; description: string; type: string }>> => {
  try {
    if (!query || query.trim().length === 0) {
      return [];
    }

    const cacheKey = `search_${query.toLowerCase()}`;
    const cached = await getCachedData<Array<{ symbol: string; description: string; type: string }>>(cacheKey);
    if (cached) return cached;

    console.log('🔍 Searching stocks via Supabase with query:', query);
    
    const { data, error } = await supabase.functions.invoke('fetch-stock-data', {
      body: { symbol: query, action: 'search' },
    });

    if (error) {
      console.log('⚠️ Supabase function error:', error.message);
      return [];
    }

    if (!data || data.error) {
      console.log('⚠️ Error in response:', data?.error);
      return [];
    }

    console.log('✅ Found', data.length, 'stocks via Supabase matching:', query);
    await setCachedData(cacheKey, data);
    return data;
  } catch (error: any) {
    console.log('⚠️ Error searching stocks via Supabase:', error.message);
    return [];
  }
};

// Get stocks from database
export const getStocksFromDB = async (symbols?: string[]): Promise<any[]> => {
  try {
    console.log('📊 Fetching stocks from database');
    
    let query = supabase.from('stocks').select('*');
    
    if (symbols && symbols.length > 0) {
      query = query.in('symbol', symbols);
    }
    
    const { data, error } = await query.order('last_updated', { ascending: false });

    if (error) {
      console.log('⚠️ Error fetching stocks from DB:', error.message);
      return [];
    }

    console.log('✅ Fetched', data?.length || 0, 'stocks from database');
    return data || [];
  } catch (error: any) {
    console.log('⚠️ Error getting stocks from database:', error.message);
    return [];
  }
};

// Get stock history from database
export const getStockHistoryFromDB = async (symbol: string, days: number = 30): Promise<any[]> => {
  try {
    console.log('📈 Fetching stock history from database for:', symbol);
    
    const { data, error } = await supabase
      .from('stock_history')
      .select('*')
      .eq('stock_symbol', symbol)
      .order('date', { ascending: false })
      .limit(days);

    if (error) {
      console.log('⚠️ Error fetching stock history from DB:', error.message);
      return [];
    }

    console.log('✅ Fetched', data?.length || 0, 'history records from database');
    return data || [];
  } catch (error: any) {
    console.log('⚠️ Error getting stock history from database:', error.message);
    return [];
  }
};

// Add stock to user's watchlist
export const addToWatchlist = async (symbol: string): Promise<boolean> => {
  try {
    console.log('➕ Adding', symbol, 'to watchlist');
    
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.log('⚠️ User not authenticated');
      return false;
    }

    const { error } = await supabase
      .from('user_watchlists')
      .insert({ user_id: user.id, stock_symbol: symbol });

    if (error) {
      console.log('⚠️ Error adding to watchlist:', error.message);
      return false;
    }

    console.log('✅ Added', symbol, 'to watchlist');
    return true;
  } catch (error: any) {
    console.log('⚠️ Error adding to watchlist:', error.message);
    return false;
  }
};

// Remove stock from user's watchlist
export const removeFromWatchlist = async (symbol: string): Promise<boolean> => {
  try {
    console.log('➖ Removing', symbol, 'from watchlist');
    
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.log('⚠️ User not authenticated');
      return false;
    }

    const { error } = await supabase
      .from('user_watchlists')
      .delete()
      .eq('user_id', user.id)
      .eq('stock_symbol', symbol);

    if (error) {
      console.log('⚠️ Error removing from watchlist:', error.message);
      return false;
    }

    console.log('✅ Removed', symbol, 'from watchlist');
    return true;
  } catch (error: any) {
    console.log('⚠️ Error removing from watchlist:', error.message);
    return false;
  }
};

// Get user's watchlist
export const getUserWatchlist = async (): Promise<string[]> => {
  try {
    console.log('📋 Fetching user watchlist');
    
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.log('⚠️ User not authenticated, returning empty watchlist');
      return [];
    }

    const { data, error } = await supabase
      .from('user_watchlists')
      .select('stock_symbol')
      .eq('user_id', user.id);

    if (error) {
      console.log('⚠️ Error fetching watchlist:', error.message);
      return [];
    }

    const symbols = data?.map(item => item.stock_symbol) || [];
    console.log('✅ Fetched watchlist with', symbols.length, 'stocks');
    return symbols;
  } catch (error: any) {
    console.log('⚠️ Error getting user watchlist:', error.message);
    return [];
  }
};

// Save stock prediction
export const savePrediction = async (
  symbol: string,
  predictionDate: string,
  predictedPrice: number,
  confidence: number
): Promise<boolean> => {
  try {
    console.log('💾 Saving prediction for', symbol);
    
    const { error } = await supabase
      .from('stock_predictions')
      .upsert({
        stock_symbol: symbol,
        prediction_date: predictionDate,
        predicted_price: predictedPrice,
        confidence: confidence,
      }, { onConflict: 'stock_symbol,prediction_date' });

    if (error) {
      console.log('⚠️ Error saving prediction:', error.message);
      return false;
    }

    console.log('✅ Saved prediction for', symbol);
    return true;
  } catch (error: any) {
    console.log('⚠️ Error saving prediction:', error.message);
    return false;
  }
};

// Get stock predictions
export const getStockPredictions = async (symbol: string, days: number = 7): Promise<any[]> => {
  try {
    console.log('🔮 Fetching predictions for', symbol);
    
    const { data, error } = await supabase
      .from('stock_predictions')
      .select('*')
      .eq('stock_symbol', symbol)
      .order('prediction_date', { ascending: true })
      .limit(days);

    if (error) {
      console.log('⚠️ Error fetching predictions:', error.message);
      return [];
    }

    console.log('✅ Fetched', data?.length || 0, 'predictions');
    return data || [];
  } catch (error: any) {
    console.log('⚠️ Error getting predictions:', error.message);
    return [];
  }
};

// Check Supabase connection
export const checkSupabaseConnection = async (): Promise<boolean> => {
  try {
    console.log('🔍 Checking Supabase connection...');
    
    const { data, error } = await supabase.from('stocks').select('count').limit(1);

    if (error) {
      console.log('⚠️ Supabase connection error:', error.message);
      return false;
    }

    console.log('✅ Supabase connection successful');
    return true;
  } catch (error: any) {
    console.log('⚠️ Supabase connection check failed:', error.message);
    return false;
  }
};

// Clear all Supabase cache
export const clearSupabaseCache = async (): Promise<void> => {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const cacheKeys = keys.filter(key => key.startsWith(CACHE_KEY_PREFIX));
    await AsyncStorage.multiRemove(cacheKeys);
    console.log('🗑️ Supabase cache cleared -', cacheKeys.length, 'items removed');
  } catch (error: any) {
    console.log('⚠️ Error clearing Supabase cache:', error.message);
  }
};
