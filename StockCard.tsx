
import { colors } from '@/styles/commonStyles';
import React from 'react';
import { IconSymbol } from './IconSymbol';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';

interface StockCardProps {
  symbol: string;
  name: string;
  currentPrice: number;
  change: number;
  changePercent: number;
  predictedChange: number;
}

const StockCard: React.FC<StockCardProps> = ({
  symbol,
  name,
  currentPrice,
  change,
  changePercent,
  predictedChange,
}) => {
  const router = useRouter();
  const isPositive = change >= 0;
  const isPredictedPositive = predictedChange >= 0;

  const handlePress = () => {
    console.log('🎯 StockCard pressed - Navigating to:', `/stock/${symbol}`);
    console.log('📊 Stock data:', { symbol, name, currentPrice });
    router.push(`/stock/${symbol}`);
  };

  return (
    <Pressable
      style={({ pressed }) => [
        styles.card,
        pressed && styles.cardPressed,
      ]}
      onPress={handlePress}
    >
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Text style={styles.symbol}>{symbol}</Text>
          <View style={styles.realTimeBadge}>
            <View style={styles.liveDot} />
            <Text style={styles.realTimeText}>LIVE</Text>
          </View>
        </View>
        <Text style={styles.name} numberOfLines={1}>{name}</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.priceSection}>
          <Text style={styles.price}>${currentPrice.toFixed(2)}</Text>
          <View style={[styles.changeContainer, isPositive ? styles.positive : styles.negative]}>
            <IconSymbol
              name={isPositive ? 'arrow.up' : 'arrow.down'}
              size={14}
              color={isPositive ? colors.success : colors.error}
            />
            <Text style={[styles.change, isPositive ? styles.positiveText : styles.negativeText]}>
              ${Math.abs(change).toFixed(2)} ({Math.abs(changePercent).toFixed(2)}%)
            </Text>
          </View>
        </View>

        <View style={styles.predictionSection}>
          <Text style={styles.predictionLabel}>AI Prediction</Text>
          <View style={[styles.predictionBadge, isPredictedPositive ? styles.predictionPositive : styles.predictionNegative]}>
            <IconSymbol
              name={isPredictedPositive ? 'arrow.up.right' : 'arrow.down.right'}
              size={12}
              color={isPredictedPositive ? colors.success : colors.error}
            />
            <Text style={[styles.predictionText, isPredictedPositive ? styles.positiveText : styles.negativeText]}>
              {isPredictedPositive ? '+' : ''}{predictedChange.toFixed(2)}%
            </Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.cardBackground,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.98 }],
  },
  header: {
    marginBottom: 12,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  symbol: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  realTimeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.success + '20',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
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
    fontSize: 10,
    fontWeight: '600',
    color: colors.success,
  },
  name: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  content: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  priceSection: {
    flex: 1,
  },
  price: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  changeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  positive: {
    backgroundColor: colors.success + '15',
  },
  negative: {
    backgroundColor: colors.error + '15',
  },
  change: {
    fontSize: 13,
    fontWeight: '600',
  },
  positiveText: {
    color: colors.success,
  },
  negativeText: {
    color: colors.error,
  },
  predictionSection: {
    alignItems: 'flex-end',
  },
  predictionLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    marginBottom: 4,
    fontWeight: '500',
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
  predictionText: {
    fontSize: 13,
    fontWeight: '700',
  },
});

export default StockCard;
