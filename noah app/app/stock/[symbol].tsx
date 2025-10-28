
import { colors } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import { LineChart } from 'react-native-chart-kit';
import React, { useState, useEffect } from 'react';
import { getStockBySymbol, generateDynamicPrediction, getCompanyDescription } from '@/data/mockStockData';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  Pressable,
  Dimensions,
  Platform,
  TextInput,
  Modal,
  ActivityIndicator,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';

const StockDetailScreen = () => {
  const router = useRouter();
  const params = useLocalSearchParams<{ symbol: string }>();
  const [stock, setStock] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)); // Default to 7 days ahead
  const [tempDate, setTempDate] = useState(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)); // Temporary date for iOS spinner
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Extract symbol from params - handle both string and array cases
  const symbol = Array.isArray(params.symbol) ? params.symbol[0] : params.symbol;

  useEffect(() => {
    console.log('📱 StockDetailScreen mounted with params:', params);
    console.log('📱 Extracted symbol:', symbol);
    
    if (symbol) {
      loadStockData();
    } else {
      console.error('❌ No symbol provided in params');
      setError('No stock symbol provided');
      setLoading(false);
    }
  }, [symbol]);

  const loadStockData = async () => {
    try {
      console.log('🔄 Loading stock data for symbol:', symbol);
      setLoading(true);
      setError(null);
      
      const stockData = await getStockBySymbol(symbol);
      
      console.log('📊 Stock data received:', stockData ? 'Success' : 'Failed');
      
      if (stockData) {
        console.log('✅ Setting stock data:', {
          symbol: stockData.symbol,
          name: stockData.name,
          price: stockData.currentPrice,
          isRealData: stockData.isRealData
        });
        setStock(stockData);
      } else {
        console.error('❌ No stock data returned for:', symbol);
        setError(`Unable to load data for ${symbol}`);
      }
    } catch (error) {
      console.error('❌ Error loading stock data:', error);
      setError('An error occurred while loading stock data');
    } finally {
      setLoading(false);
    }
  };

  const handleGeneratePrediction = async () => {
    if (!stock) return;

    try {
      setGenerating(true);
      const today = new Date();
      const daysAhead = Math.ceil((selectedDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysAhead <= 0) {
        alert('Please select a future date');
        setGenerating(false);
        return;
      }

      console.log('🔮 Generating prediction for', stock.symbol, 'for', daysAhead, 'days ahead');
      console.log('📅 Selected date:', formatDate(selectedDate));
      
      const predictionResult = await generateDynamicPrediction(stock.symbol, selectedDate);
      
      if (predictionResult) {
        console.log('✅ Prediction generated successfully');
        // Update stock with new prediction data
        setStock({
          ...stock,
          predictedPrice: predictionResult.predictedPrice,
          predictionData: predictionResult.predictionData,
          confidence: predictionResult.confidence,
          predictedChange: predictionResult.predictedPrice - stock.currentPrice,
          predictedChangePercent: ((predictionResult.predictedPrice - stock.currentPrice) / stock.currentPrice) * 100,
        });
        alert(`Prediction generated for ${formatDate(selectedDate)}!\nPredicted price: $${predictionResult.predictedPrice.toFixed(2)}`);
      } else {
        console.error('❌ Failed to generate prediction');
        alert('Failed to generate prediction. Please try again.');
      }
    } catch (error) {
      console.error('❌ Error generating prediction:', error);
      alert('An error occurred while generating the prediction.');
    } finally {
      setGenerating(false);
    }
  };

  const handlePresetDate = async (daysAhead: number) => {
    console.log(`📅 Preset date selected: ${daysAhead} days ahead`);
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + daysAhead);
    setSelectedDate(futureDate);
    setTempDate(futureDate);
    
    // Automatically generate prediction for the preset date
    if (!stock) return;

    try {
      setGenerating(true);
      console.log('🔮 Generating prediction for', stock.symbol, 'for', daysAhead, 'days ahead');
      console.log('📅 Selected date:', formatDate(futureDate));
      
      const predictionResult = await generateDynamicPrediction(stock.symbol, futureDate);
      
      if (predictionResult) {
        console.log('✅ Prediction generated successfully');
        // Update stock with new prediction data
        setStock({
          ...stock,
          predictedPrice: predictionResult.predictedPrice,
          predictionData: predictionResult.predictionData,
          confidence: predictionResult.confidence,
          predictedChange: predictionResult.predictedPrice - stock.currentPrice,
          predictedChangePercent: ((predictionResult.predictedPrice - stock.currentPrice) / stock.currentPrice) * 100,
        });
        alert(`Prediction generated for ${formatDate(futureDate)}!\nPredicted price: $${predictionResult.predictedPrice.toFixed(2)}`);
      } else {
        console.error('❌ Failed to generate prediction');
        alert('Failed to generate prediction. Please try again.');
      }
    } catch (error) {
      console.error('❌ Error generating prediction:', error);
      alert('An error occurred while generating the prediction.');
    } finally {
      setGenerating(false);
    }
  };

  const handleDateChange = (event: any, date?: Date) => {
    console.log('📅 Date picker event:', event?.type || 'no event type', 'Date:', date);
    
    if (Platform.OS === 'android') {
      // On Android, hide the picker first
      setShowDatePicker(false);
      
      // Check if user confirmed or dismissed
      if (date && event?.type !== 'dismissed') {
        // User confirmed the date
        console.log('✅ Android date confirmed:', date);
        setSelectedDate(date);
        setTempDate(date);
      } else {
        // User cancelled
        console.log('❌ Android date picker dismissed');
      }
    } else {
      // On iOS, update the temp date as user scrolls
      if (date) {
        console.log('🔄 iOS date changed:', date);
        setTempDate(date);
      }
    }
  };

  const handleConfirmDate = () => {
    console.log('✅ Confirming date selection:', tempDate);
    setSelectedDate(tempDate);
    setShowDatePicker(false);
  };

  const handleCancelDate = () => {
    console.log('❌ Cancelling date selection');
    setTempDate(selectedDate); // Reset to previously selected date
    setShowDatePicker(false);
  };

  const handleOpenDatePicker = () => {
    console.log('📅 Opening date picker - Current state:', showDatePicker);
    console.log('📅 Selected date:', selectedDate);
    console.log('📅 Platform:', Platform.OS);
    setTempDate(selectedDate); // Initialize temp date with current selection
    setShowDatePicker(true);
    console.log('📅 Date picker state set to true');
  };

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  const getDaysAhead = (date: Date = selectedDate): number => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);
    return Math.ceil((targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Stack.Screen options={{ title: symbol || 'Loading...' }} />
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading stock data for {symbol}...</Text>
        <Text style={styles.loadingSubtext}>Fetching real-time market data</Text>
      </View>
    );
  }

  if (error || !stock) {
    return (
      <View style={styles.errorContainer}>
        <Stack.Screen options={{ title: 'Error' }} />
        <IconSymbol name="exclamationmark.triangle" size={48} color={colors.error} />
        <Text style={styles.errorText}>
          {error || `Unable to load data for ${symbol}`}
        </Text>
        <Text style={styles.errorSubtext}>
          Please check your connection and try again
        </Text>
        <Pressable style={styles.retryButton} onPress={loadStockData}>
          <IconSymbol name="arrow.clockwise" size={18} color="#fff" />
          <Text style={styles.retryButtonText}>Retry</Text>
        </Pressable>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </Pressable>
      </View>
    );
  }

  const isPositive = stock.change >= 0;
  const isPredictedPositive = stock.predictedChange >= 0;
  const screenWidth = Dimensions.get('window').width;

  // Combine historical and prediction data for chart
  const chartData = [
    ...stock.historicalData.map((d: any) => d.price),
    ...stock.predictionData.map((d: any) => d.price),
  ];

  const chartLabels = [
    ...stock.historicalData.map((d: any) => d.date.split('-')[2]),
    ...stock.predictionData.map((d: any) => d.date.split('-')[2]),
  ];

  const companyDescription = getCompanyDescription(symbol);

  return (
    <View style={styles.container}>
      <Stack.Screen 
        options={{ 
          title: symbol,
          headerBackTitle: 'Back',
        }} 
      />
      
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View style={styles.titleContainer}>
              <Text style={styles.symbol}>{stock.symbol}</Text>
              <View style={styles.realTimeBadge}>
                <View style={styles.liveDot} />
                <Text style={styles.realTimeText}>{stock.isRealData ? 'LIVE' : 'DEMO'}</Text>
              </View>
            </View>
            <Text style={styles.name}>{stock.name}</Text>
          </View>
          
          <View style={styles.priceContainer}>
            <Text style={styles.price}>${stock.currentPrice.toFixed(2)}</Text>
            <View style={[styles.changeContainer, isPositive ? styles.positive : styles.negative]}>
              <IconSymbol
                name={isPositive ? 'arrow.up' : 'arrow.down'}
                size={16}
                color={isPositive ? colors.success : colors.error}
              />
              <Text style={[styles.change, isPositive ? styles.positiveText : styles.negativeText]}>
                ${Math.abs(stock.change).toFixed(2)} ({Math.abs(stock.changePercent).toFixed(2)}%)
              </Text>
            </View>
          </View>
        </View>

        {/* Data Source Info */}
        <View style={styles.dataSourceCard}>
          <IconSymbol 
            name={stock.isRealData ? "checkmark.circle.fill" : "info.circle.fill"} 
            size={20} 
            color={stock.isRealData ? colors.success : colors.primary} 
          />
          <View style={styles.dataSourceTextContainer}>
            <Text style={styles.dataSourceText}>
              {stock.isRealData ? 'Real-time market data via Supabase' : 'Simulated market data'}
            </Text>
            <Text style={styles.dataSourceSubtext}>
              {stock.isRealData ? 'Updated live during market hours' : 'Realistic demo data for testing'}
            </Text>
          </View>
        </View>

        {/* Chart */}
        <View style={styles.chartContainer}>
          <Text style={styles.sectionTitle}>Price History & Prediction</Text>
          <LineChart
            data={{
              labels: chartLabels.filter((_, i) => i % 5 === 0),
              datasets: [{
                data: chartData,
              }],
            }}
            width={screenWidth - 32}
            height={220}
            chartConfig={{
              backgroundColor: colors.cardBackground,
              backgroundGradientFrom: colors.cardBackground,
              backgroundGradientTo: colors.cardBackground,
              decimalPlaces: 2,
              color: (opacity = 1) => `rgba(99, 102, 241, ${opacity})`,
              labelColor: (opacity = 1) => colors.textSecondary,
              style: {
                borderRadius: 16,
              },
              propsForDots: {
                r: '0',
              },
              propsForBackgroundLines: {
                strokeDasharray: '',
                stroke: colors.border,
                strokeWidth: 1,
              },
            }}
            bezier
            style={styles.chart}
            withInnerLines={true}
            withOuterLines={true}
            withVerticalLines={false}
            withHorizontalLines={true}
            withVerticalLabels={true}
            withHorizontalLabels={true}
          />
          <View style={styles.chartLegend}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: colors.primary }]} />
              <Text style={styles.legendText}>Historical Data</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: colors.primary, opacity: 0.5 }]} />
              <Text style={styles.legendText}>AI Prediction</Text>
            </View>
          </View>
        </View>

        {/* Prediction Card */}
        <View style={styles.predictionCard}>
          <View style={styles.predictionHeader}>
            <IconSymbol name="brain" size={24} color={colors.primary} />
            <Text style={styles.sectionTitle}>AI Prediction</Text>
          </View>
          
          <View style={styles.predictionContent}>
            <View style={styles.predictionRow}>
              <Text style={styles.predictionLabel}>Predicted Price ({getDaysAhead()} days)</Text>
              <Text style={styles.predictionValue}>${stock.predictedPrice.toFixed(2)}</Text>
            </View>
            
            <View style={styles.predictionRow}>
              <Text style={styles.predictionLabel}>Expected Change</Text>
              <View style={[styles.predictionBadge, isPredictedPositive ? styles.predictionPositive : styles.predictionNegative]}>
                <IconSymbol
                  name={isPredictedPositive ? 'arrow.up.right' : 'arrow.down.right'}
                  size={14}
                  color={isPredictedPositive ? colors.success : colors.error}
                />
                <Text style={[styles.predictionBadgeText, isPredictedPositive ? styles.positiveText : styles.negativeText]}>
                  {isPredictedPositive ? '+' : ''}{stock.predictedChangePercent.toFixed(2)}%
                </Text>
              </View>
            </View>
            
            <View style={styles.predictionRow}>
              <Text style={styles.predictionLabel}>Confidence</Text>
              <View style={styles.confidenceContainer}>
                <View style={styles.confidenceBar}>
                  <View style={[styles.confidenceFill, { width: `${stock.confidence * 100}%` }]} />
                </View>
                <Text style={styles.confidenceText}>{(stock.confidence * 100).toFixed(0)}%</Text>
              </View>
            </View>
          </View>

          {/* Date Selection Section */}
          <View style={styles.customPredictionSection}>
            <Text style={styles.customPredictionTitle}>Custom Date Prediction</Text>
            
            {/* Selected Date Display */}
            <View style={styles.selectedDateDisplay}>
              <IconSymbol name="calendar" size={18} color={colors.primary} />
              <View style={styles.selectedDateInfo}>
                <Text style={styles.selectedDateText}>{formatDate(selectedDate)}</Text>
                <Text style={styles.selectedDateDaysText}>
                  {getDaysAhead()} {getDaysAhead() === 1 ? 'day' : 'days'} ahead
                </Text>
              </View>
            </View>

            {/* Preset Date Buttons */}
            <View style={styles.presetDatesContainer}>
              <Text style={styles.presetDatesLabel}>Quick Select:</Text>
              <View style={styles.presetDatesGrid}>
                <Pressable
                  style={({ pressed }) => [
                    styles.presetDateButton,
                    getDaysAhead() === 7 && styles.presetDateButtonActive,
                    pressed && styles.presetDateButtonPressed,
                  ]}
                  onPress={() => handlePresetDate(7)}
                  disabled={generating}
                >
                  <Text style={[
                    styles.presetDateButtonText,
                    getDaysAhead() === 7 && styles.presetDateButtonTextActive,
                  ]}>
                    7 days ahead
                  </Text>
                </Pressable>

                <Pressable
                  style={({ pressed }) => [
                    styles.presetDateButton,
                    getDaysAhead() === 14 && styles.presetDateButtonActive,
                    pressed && styles.presetDateButtonPressed,
                  ]}
                  onPress={() => handlePresetDate(14)}
                  disabled={generating}
                >
                  <Text style={[
                    styles.presetDateButtonText,
                    getDaysAhead() === 14 && styles.presetDateButtonTextActive,
                  ]}>
                    14 days ahead
                  </Text>
                </Pressable>

                <Pressable
                  style={({ pressed }) => [
                    styles.presetDateButton,
                    getDaysAhead() === 30 && styles.presetDateButtonActive,
                    pressed && styles.presetDateButtonPressed,
                  ]}
                  onPress={() => handlePresetDate(30)}
                  disabled={generating}
                >
                  <Text style={[
                    styles.presetDateButtonText,
                    getDaysAhead() === 30 && styles.presetDateButtonTextActive,
                  ]}>
                    30 days ahead
                  </Text>
                </Pressable>

                <Pressable
                  style={({ pressed }) => [
                    styles.presetDateButton,
                    getDaysAhead() === 60 && styles.presetDateButtonActive,
                    pressed && styles.presetDateButtonPressed,
                  ]}
                  onPress={() => handlePresetDate(60)}
                  disabled={generating}
                >
                  <Text style={[
                    styles.presetDateButtonText,
                    getDaysAhead() === 60 && styles.presetDateButtonTextActive,
                  ]}>
                    60 days ahead
                  </Text>
                </Pressable>
              </View>
            </View>

            {/* Action Buttons */}
            <View style={styles.predictionActions}>
              <Pressable
                style={({ pressed }) => [
                  styles.changeDateButton,
                  pressed && styles.changeDateButtonPressed,
                ]}
                onPress={handleOpenDatePicker}
              >
                <IconSymbol name="calendar.badge.clock" size={18} color={colors.primary} />
                <Text style={styles.changeDateButtonText}>Custom Date</Text>
              </Pressable>

              <Pressable
                style={({ pressed }) => [
                  styles.generateButton,
                  pressed && styles.generateButtonPressed,
                  generating && styles.generateButtonDisabled,
                ]}
                onPress={handleGeneratePrediction}
                disabled={generating}
              >
                {generating ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <IconSymbol name="sparkles" size={18} color="#fff" />
                    <Text style={styles.generateButtonText}>Generate</Text>
                  </>
                )}
              </Pressable>
            </View>
          </View>
        </View>

        {/* Company Info */}
        <View style={styles.infoCard}>
          <Text style={styles.sectionTitle}>About {stock.name}</Text>
          <Text style={styles.infoText}>{companyDescription}</Text>
        </View>

        {/* Stats */}
        <View style={styles.statsCard}>
          <Text style={styles.sectionTitle}>Key Statistics</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Open</Text>
              <Text style={styles.statValue}>${stock.previousClose.toFixed(2)}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Current</Text>
              <Text style={styles.statValue}>${stock.currentPrice.toFixed(2)}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Day Change</Text>
              <Text style={[styles.statValue, isPositive ? styles.positiveText : styles.negativeText]}>
                {isPositive ? '+' : ''}{stock.changePercent.toFixed(2)}%
              </Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Forecast</Text>
              <Text style={[styles.statValue, isPredictedPositive ? styles.positiveText : styles.negativeText]}>
                {isPredictedPositive ? '+' : ''}{stock.predictedChangePercent.toFixed(2)}%
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Date Picker Modal - Only show on iOS */}
      {Platform.OS === 'ios' && (
        <Modal
          visible={showDatePicker}
          transparent={true}
          animationType="slide"
          onRequestClose={handleCancelDate}
        >
          <View style={styles.modalOverlay}>
            <Pressable 
              style={styles.modalOverlayTouchable} 
              onPress={handleCancelDate}
            />
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Select Prediction Date</Text>
                <Pressable onPress={handleCancelDate}>
                  <IconSymbol name="xmark.circle.fill" size={24} color={colors.textSecondary} />
                </Pressable>
              </View>
              
              {/* Selected Date Display in Modal */}
              <View style={styles.modalSelectedDateContainer}>
                <IconSymbol name="calendar" size={20} color={colors.primary} />
                <View style={styles.modalSelectedDateTextContainer}>
                  <Text style={styles.modalSelectedDateLabel}>Selected Date</Text>
                  <Text style={styles.modalSelectedDateValue}>{formatDate(tempDate)}</Text>
                  <Text style={styles.modalSelectedDateDays}>
                    {getDaysAhead(tempDate)} {getDaysAhead(tempDate) === 1 ? 'day' : 'days'} ahead
                  </Text>
                </View>
              </View>

              {/* Date Picker */}
              <View style={styles.datePickerContainer}>
                <DateTimePicker
                  value={tempDate}
                  mode="date"
                  display="spinner"
                  onChange={handleDateChange}
                  minimumDate={new Date(Date.now() + 24 * 60 * 60 * 1000)} // Tomorrow
                  maximumDate={new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)} // 1 year ahead
                  textColor={colors.text}
                  themeVariant="dark"
                />
              </View>
              
              <View style={styles.modalActions}>
                <Pressable
                  style={[styles.modalButton, styles.modalButtonCancel]}
                  onPress={handleCancelDate}
                >
                  <Text style={styles.modalButtonTextCancel}>Cancel</Text>
                </Pressable>
                <Pressable
                  style={[styles.modalButton, styles.modalButtonConfirm]}
                  onPress={handleConfirmDate}
                >
                  <IconSymbol name="checkmark.circle.fill" size={16} color="#fff" />
                  <Text style={styles.modalButtonTextConfirm}>Confirm Date</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>
      )}

      {/* Android Date Picker - Native dialog */}
      {Platform.OS === 'android' && showDatePicker && (
        <DateTimePicker
          value={tempDate}
          mode="date"
          display="default"
          onChange={handleDateChange}
          minimumDate={new Date(Date.now() + 24 * 60 * 60 * 1000)} // Tomorrow
          maximumDate={new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)} // 1 year ahead
        />
      )}
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
    gap: 12,
    padding: 20,
  },
  loadingText: {
    fontSize: 16,
    color: colors.text,
    fontWeight: '600',
  },
  loadingSubtext: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
    padding: 20,
    gap: 16,
  },
  errorText: {
    fontSize: 18,
    color: colors.text,
    fontWeight: '600',
    textAlign: 'center',
  },
  errorSubtext: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  backButton: {
    backgroundColor: colors.border,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  header: {
    marginBottom: 16,
  },
  headerTop: {
    marginBottom: 12,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 4,
  },
  symbol: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.text,
  },
  realTimeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.success + '20',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.success,
    gap: 4,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.success,
  },
  realTimeText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.success,
  },
  name: {
    fontSize: 18,
    color: colors.textSecondary,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 12,
  },
  price: {
    fontSize: 36,
    fontWeight: '700',
    color: colors.text,
  },
  changeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  positive: {
    backgroundColor: colors.success + '15',
  },
  negative: {
    backgroundColor: colors.error + '15',
  },
  change: {
    fontSize: 15,
    fontWeight: '600',
  },
  positiveText: {
    color: colors.success,
  },
  negativeText: {
    color: colors.error,
  },
  dataSourceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.success + '10',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    gap: 10,
    borderWidth: 1,
    borderColor: colors.success + '30',
  },
  dataSourceTextContainer: {
    flex: 1,
  },
  dataSourceText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  dataSourceSubtext: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  chartContainer: {
    backgroundColor: colors.cardBackground,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 12,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  chartLegend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    marginTop: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  predictionCard: {
    backgroundColor: colors.cardBackground,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  predictionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  predictionContent: {
    gap: 16,
    marginBottom: 20,
  },
  predictionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  predictionLabel: {
    fontSize: 15,
    color: colors.textSecondary,
  },
  predictionValue: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  predictionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  predictionPositive: {
    backgroundColor: colors.success + '10',
    borderColor: colors.success + '40',
  },
  predictionNegative: {
    backgroundColor: colors.error + '10',
    borderColor: colors.error + '40',
  },
  predictionBadgeText: {
    fontSize: 15,
    fontWeight: '700',
  },
  confidenceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  confidenceBar: {
    width: 100,
    height: 8,
    backgroundColor: colors.border,
    borderRadius: 4,
    overflow: 'hidden',
  },
  confidenceFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 4,
  },
  confidenceText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  customPredictionSection: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 16,
    gap: 12,
  },
  customPredictionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  selectedDateDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary + '10',
    borderRadius: 10,
    padding: 12,
    gap: 10,
    borderWidth: 1,
    borderColor: colors.primary + '30',
  },
  selectedDateInfo: {
    flex: 1,
  },
  selectedDateText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  selectedDateDaysText: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: '500',
  },
  presetDatesContainer: {
    gap: 8,
  },
  presetDatesLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  presetDatesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  presetDateButton: {
    flex: 1,
    minWidth: '47%',
    backgroundColor: colors.border,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  presetDateButtonActive: {
    backgroundColor: colors.primary + '20',
    borderColor: colors.primary,
  },
  presetDateButtonPressed: {
    opacity: 0.7,
  },
  presetDateButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
  },
  presetDateButtonTextActive: {
    color: colors.primary,
    fontWeight: '700',
  },
  predictionActions: {
    flexDirection: 'row',
    gap: 10,
  },
  changeDateButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: colors.border,
    paddingVertical: 12,
    borderRadius: 10,
  },
  changeDateButtonPressed: {
    opacity: 0.7,
  },
  changeDateButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  generateButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: colors.success,
    paddingVertical: 12,
    borderRadius: 10,
  },
  generateButtonPressed: {
    opacity: 0.8,
  },
  generateButtonDisabled: {
    opacity: 0.6,
  },
  generateButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
  },
  infoCard: {
    backgroundColor: colors.cardBackground,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  infoText: {
    fontSize: 15,
    color: colors.textSecondary,
    lineHeight: 22,
  },
  statsCard: {
    backgroundColor: colors.cardBackground,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statItem: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: colors.background,
    padding: 12,
    borderRadius: 10,
  },
  statLabel: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  modalOverlayTouchable: {
    flex: 1,
  },
  modalContent: {
    backgroundColor: colors.cardBackground,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  modalSelectedDateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary + '15',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    gap: 12,
    borderWidth: 1,
    borderColor: colors.primary + '30',
  },
  modalSelectedDateTextContainer: {
    flex: 1,
  },
  modalSelectedDateLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  modalSelectedDateValue: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 2,
  },
  modalSelectedDateDays: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: '600',
  },
  datePickerContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  modalButtonCancel: {
    backgroundColor: colors.border,
  },
  modalButtonConfirm: {
    backgroundColor: colors.primary,
  },
  modalButtonTextCancel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  modalButtonTextConfirm: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});

export default StockDetailScreen;
