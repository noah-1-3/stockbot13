
import { colors } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import { getDetailedAPIStatus } from '@/data/mockStockData';
import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  Platform,
  Pressable,
  Linking,
} from 'react-native';
import { getAPIStatus } from '@/utils/stockApiService';
import { checkSupabaseConnection } from '@/utils/supabaseStockService';
import { Stack } from 'expo-router';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: 20,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 15,
  },
  card: {
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
      web: {
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      },
    }),
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusIcon: {
    marginRight: 12,
  },
  statusText: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
  },
  statusValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  statusAvailable: {
    color: colors.success,
  },
  statusUnavailable: {
    color: colors.error,
  },
  messageText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 8,
    lineHeight: 20,
  },
  button: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    marginTop: 12,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  infoText: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  badge: {
    backgroundColor: colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginLeft: 8,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
});

export default function ProfileScreen() {
  const [apiStatus, setApiStatus] = useState<{
    isAvailable: boolean;
    message: string;
    suggestion: string;
  } | null>(null);
  const [supabaseStatus, setSupabaseStatus] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAPIStatus();
  }, []);

  const loadAPIStatus = async () => {
    setLoading(true);
    try {
      const [apiResult, supabaseResult, detailedStatus] = await Promise.all([
        getAPIStatus(),
        checkSupabaseConnection(),
        getDetailedAPIStatus(),
      ]);
      setApiStatus(detailedStatus);
      setSupabaseStatus(supabaseResult);
    } catch (error) {
      console.error('Error loading API status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenSupabase = () => {
    Linking.openURL('https://supabase.com/dashboard/project/ajjixvbjxpnqyimuwfan');
  };

  const handleOpenDocs = () => {
    Linking.openURL('https://supabase.com/docs');
  };

  return (
    <View style={styles.container}>
      <Stack.Screen 
        options={{
          title: 'Profile & Settings',
          headerStyle: {
            backgroundColor: colors.background,
          },
          headerTintColor: colors.text,
        }}
      />
      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>App Information</Text>
          <View style={styles.card}>
            <View style={styles.statusRow}>
              <IconSymbol name="chart.line.uptrend.xyaxis" size={24} color={colors.primary} style={styles.statusIcon} />
              <Text style={styles.statusText}>StockBot</Text>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>v1.0</Text>
              </View>
            </View>
            <Text style={styles.infoText}>
              AI-powered stock prediction app using historical data and machine learning algorithms.
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data Sources</Text>
          
          <View style={styles.card}>
            <View style={styles.statusRow}>
              <IconSymbol 
                name="server.rack" 
                size={24} 
                color={supabaseStatus ? colors.success : colors.error} 
                style={styles.statusIcon} 
              />
              <Text style={styles.statusText}>Supabase</Text>
              <Text style={[
                styles.statusValue,
                supabaseStatus ? styles.statusAvailable : styles.statusUnavailable
              ]}>
                {loading ? 'Checking...' : supabaseStatus ? 'Connected' : 'Disconnected'}
              </Text>
            </View>
            <Text style={styles.messageText}>
              {loading 
                ? 'Checking Supabase connection...' 
                : supabaseStatus 
                  ? 'Real-time database and edge functions are active. Stock data is stored and cached in Supabase.'
                  : 'Unable to connect to Supabase. Please check your internet connection.'}
            </Text>
            <Pressable style={styles.button} onPress={handleOpenSupabase}>
              <Text style={styles.buttonText}>Open Supabase Dashboard</Text>
            </Pressable>
          </View>

          <View style={styles.card}>
            <View style={styles.statusRow}>
              <IconSymbol 
                name="network" 
                size={24} 
                color={apiStatus?.isAvailable ? colors.success : colors.error} 
                style={styles.statusIcon} 
              />
              <Text style={styles.statusText}>Alpha Vantage API</Text>
              <Text style={[
                styles.statusValue,
                apiStatus?.isAvailable ? styles.statusAvailable : styles.statusUnavailable
              ]}>
                {loading ? 'Checking...' : apiStatus?.isAvailable ? 'Active' : 'Inactive'}
              </Text>
            </View>
            <Text style={styles.messageText}>
              {loading ? 'Checking API status...' : apiStatus?.message}
            </Text>
            {apiStatus?.suggestion && (
              <Text style={[styles.messageText, { marginTop: 4 }]}>
                {apiStatus.suggestion}
              </Text>
            )}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Features</Text>
          <View style={styles.card}>
            <View style={styles.statusRow}>
              <IconSymbol name="checkmark.circle.fill" size={24} color={colors.success} style={styles.statusIcon} />
              <Text style={styles.statusText}>Real-time Stock Data</Text>
            </View>
            <View style={styles.statusRow}>
              <IconSymbol name="checkmark.circle.fill" size={24} color={colors.success} style={styles.statusIcon} />
              <Text style={styles.statusText}>Historical Analysis</Text>
            </View>
            <View style={styles.statusRow}>
              <IconSymbol name="checkmark.circle.fill" size={24} color={colors.success} style={styles.statusIcon} />
              <Text style={styles.statusText}>Price Predictions</Text>
            </View>
            <View style={styles.statusRow}>
              <IconSymbol name="checkmark.circle.fill" size={24} color={colors.success} style={styles.statusIcon} />
              <Text style={styles.statusText}>Supabase Integration</Text>
            </View>
            <View style={styles.statusRow}>
              <IconSymbol name="checkmark.circle.fill" size={24} color={colors.success} style={styles.statusIcon} />
              <Text style={styles.statusText}>Edge Functions</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Resources</Text>
          <Pressable style={styles.card} onPress={handleOpenDocs}>
            <View style={styles.statusRow}>
              <IconSymbol name="book.fill" size={24} color={colors.primary} style={styles.statusIcon} />
              <Text style={styles.statusText}>Supabase Documentation</Text>
              <IconSymbol name="chevron.right" size={20} color={colors.textSecondary} />
            </View>
          </Pressable>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}
