
import { colors } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import { 
  ScrollView, 
  StyleSheet, 
  View, 
  Text, 
  Platform,
  TextInput,
  Pressable,
  Keyboard,
  ActivityIndicator,
} from 'react-native';
import { checkIfNeedsUpdate, markAsUpdated, getLastUpdateTime, forceRefresh, isMarketHours } from '@/utils/stockUpdateService';
import { getWatchlist, searchStocks, initializeStocks, checkAPIStatus, mockStocks } from '@/data/mockStockData';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import StockCard from '@/components/StockCard';
import { Stack } from 'expo-router';

const HomeScreen = () => {
  const router = useRouter();
  const [watchlist, setWatchlist] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [apiAvailable, setApiAvailable] = useState<boolean | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Check API status
      const isApiAvailable = await checkAPIStatus();
      setApiAvailable(isApiAvailable);
      
      if (!isApiAvailable) {
        console.error('❌ Cannot load stocks - API unavailable');
        setLoading(false);
        return;
      }
      
      // Initialize stocks
      await initializeStocks();
      
      // Check if we need to update
      await checkForUpdates();
      
      // Load watchlist
      const stocks = await getWatchlist();
      setWatchlist(stocks);
      
      // Get last update time
      const updateTime = await getLastUpdateTime();
      setLastUpdate(updateTime);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkForUpdates = async () => {
    try {
      const updateInfo = await checkIfNeedsUpdate();
      if (updateInfo.needsUpdate) {
        console.log('Stock data needs update, refreshing...');
        await markAsUpdated();
      }
    } catch (error) {
      console.error('Error checking for updates:', error);
    }
  };

  const handleManualRefresh = async () => {
    try {
      setRefreshing(true);
      await forceRefresh();
      await loadData();
    } catch (error) {
      console.error('Error refreshing:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleSearchChange = async (text: string) => {
    setSearchQuery(text);
    
    if (text.trim().length === 0) {
      setSearchResults([]);
      setSearching(false);
      return;
    }
    
    if (text.trim().length < 1) {
      return;
    }
    
    try {
      setSearching(true);
      const results = await searchStocks(text);
      setSearchResults(results);
    } catch (error) {
      console.error('Error searching stocks:', error);
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  const handleStockSelect = (symbol: string) => {
    setSearchQuery('');
    setSearchResults([]);
    Keyboard.dismiss();
    router.push(`/stock/${symbol}`);
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
    Keyboard.dismiss();
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Stack.Screen options={{ title: 'StockBot' }} />
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading real-time stock data...</Text>
      </View>
    );
  }

  // Show error state if API is unavailable
  if (apiAvailable === false) {
    return (
      <View style={styles.errorContainer}>
        <Stack.Screen options={{ title: 'StockBot' }} />
        <IconSymbol name="exclamationmark.triangle.fill" size={64} color={colors.error} />
        <Text style={styles.errorTitle}>Unable to Connect</Text>
        <Text style={styles.errorText}>
          Cannot fetch real-time stock data. Please check your internet connection and Supabase configuration.
        </Text>
        <View style={styles.errorSteps}>
          <Text style={styles.errorStepTitle}>To fix this:</Text>
          <Text style={styles.errorStep}>1. Check your internet connection</Text>
          <Text style={styles.errorStep}>2. Verify your Supabase project is active</Text>
          <Text style={styles.errorStep}>3. Check Supabase Edge Functions are deployed</Text>
        </View>
        <Pressable style={styles.retryButton} onPress={loadData}>
          <IconSymbol name="arrow.clockwise" size={20} color="#fff" />
          <Text style={styles.retryButtonText}>Retry Connection</Text>
        </Pressable>
      </View>
    );
  }

  // Show empty state if no stocks loaded
  if (watchlist.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Stack.Screen options={{ title: 'StockBot' }} />
        <IconSymbol name="chart.line.uptrend.xyaxis" size={64} color={colors.textSecondary} />
        <Text style={styles.emptyTitle}>No Stocks Available</Text>
        <Text style={styles.emptyText}>
          Unable to load stock data. Please check your API connection.
        </Text>
        <Pressable style={styles.retryButton} onPress={loadData}>
          <IconSymbol name="arrow.clockwise" size={20} color="#fff" />
          <Text style={styles.retryButtonText}>Retry</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen 
        options={{ 
          title: 'StockBot',
          headerLargeTitle: true,
        }} 
      />
      
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Real-time Status Banner */}
        <View style={styles.realTimeBanner}>
          <View style={styles.liveDotLarge} />
          <View style={styles.realTimeBannerTextContainer}>
            <Text style={styles.realTimeBannerTitle}>Real-Time Market Data</Text>
            <Text style={styles.realTimeBannerText}>
              Live stock prices via Supabase Edge Functions
            </Text>
          </View>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <View style={styles.searchInputContainer}>
            <IconSymbol name="magnifyingglass" size={20} color={colors.textSecondary} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search stocks (e.g., AAPL, Tesla)"
              placeholderTextColor={colors.textSecondary}
              value={searchQuery}
              onChangeText={handleSearchChange}
              autoCapitalize="characters"
              autoCorrect={false}
            />
            {searchQuery.length > 0 && (
              <Pressable onPress={handleClearSearch} style={styles.clearButton}>
                <IconSymbol name="xmark.circle.fill" size={20} color={colors.textSecondary} />
              </Pressable>
            )}
          </View>
          
          {searching && (
            <ActivityIndicator size="small" color={colors.primary} style={styles.searchLoader} />
          )}
        </View>

        {/* Search Results */}
        {searchResults.length > 0 && (
          <View style={styles.searchResults}>
            <Text style={styles.searchResultsTitle}>Search Results</Text>
            {searchResults.map((result) => (
              <Pressable
                key={result.symbol}
                style={({ pressed }) => [
                  styles.searchResultItem,
                  pressed && styles.searchResultItemPressed,
                ]}
                onPress={() => handleStockSelect(result.symbol)}
              >
                <View style={styles.searchResultContent}>
                  <Text style={styles.searchResultSymbol}>{result.symbol}</Text>
                  <Text style={styles.searchResultName} numberOfLines={1}>
                    {result.name}
                  </Text>
                </View>
                <IconSymbol name="chevron.right" size={16} color={colors.textSecondary} />
              </Pressable>
            ))}
          </View>
        )}

        {/* Header */}
        {searchResults.length === 0 && (
          <>
            <View style={styles.header}>
              <View>
                <Text style={styles.title}>Watchlist</Text>
                <View style={styles.updateInfo}>
                  <IconSymbol 
                    name={isMarketHours() ? 'chart.line.uptrend.xyaxis' : 'moon.fill'} 
                    size={14} 
                    color={colors.textSecondary} 
                  />
                  <Text style={styles.updateText}>
                    {isMarketHours() ? 'Market Open' : 'Market Closed'} • Updated {lastUpdate}
                  </Text>
                </View>
              </View>
              <Pressable
                style={({ pressed }) => [
                  styles.refreshButton,
                  pressed && styles.refreshButtonPressed,
                  refreshing && styles.refreshButtonDisabled,
                ]}
                onPress={handleManualRefresh}
                disabled={refreshing}
              >
                {refreshing ? (
                  <ActivityIndicator size="small" color={colors.primary} />
                ) : (
                  <IconSymbol name="arrow.clockwise" size={20} color={colors.primary} />
                )}
              </Pressable>
            </View>

            {/* Stock Cards */}
            <View style={styles.stockList}>
              {watchlist.map((stock) => (
                <StockCard
                  key={stock.symbol}
                  symbol={stock.symbol}
                  name={stock.name}
                  currentPrice={stock.currentPrice}
                  change={stock.change}
                  changePercent={stock.changePercent}
                  predictedChange={stock.predictedChange}
                />
              ))}
            </View>

            {/* Info Card */}
            <View style={styles.infoCard}>
              <IconSymbol name="lightbulb.fill" size={24} color={colors.primary} />
              <View style={styles.infoContent}>
                <Text style={styles.infoTitle}>AI-Powered Predictions</Text>
                <Text style={styles.infoText}>
                  Our advanced AI analyzes real-time market data and historical trends to predict future stock movements with high accuracy.
                </Text>
              </View>
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
    padding: 24,
    gap: 16,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  errorSteps: {
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    width: '100%',
    marginTop: 8,
  },
  errorStepTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  errorStep: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 8,
    lineHeight: 20,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 8,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
    padding: 24,
    gap: 16,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  realTimeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.success + '15',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.success + '40',
    gap: 12,
  },
  liveDotLarge: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.success,
  },
  realTimeBannerTextContainer: {
    flex: 1,
  },
  realTimeBannerTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.success,
    marginBottom: 2,
  },
  realTimeBannerText: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 16,
  },
  searchContainer: {
    marginBottom: 20,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'ios' ? 12 : 8,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
    padding: 0,
  },
  clearButton: {
    padding: 4,
  },
  searchLoader: {
    marginTop: 8,
  },
  searchResults: {
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    padding: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchResultsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  searchResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  searchResultItemPressed: {
    backgroundColor: colors.border,
  },
  searchResultContent: {
    flex: 1,
  },
  searchResultSymbol: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 2,
  },
  searchResultName: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  updateInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  updateText: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  refreshButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  refreshButtonPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.95 }],
  },
  refreshButtonDisabled: {
    opacity: 0.5,
  },
  stockList: {
    marginBottom: 20,
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: colors.primary + '10',
    borderRadius: 12,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: colors.primary + '20',
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  infoText: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
});

export default HomeScreen;
