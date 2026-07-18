import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity, ActivityIndicator, StatusBar } from 'react-native';
import { supabase } from '../supabaseConfig';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

const THEME = {
  primary: '#6366f1',
  dark: '#0f172a',
  background: '#f8fafc',
  white: '#ffffff',
  border: '#e2e8f0',
  textMuted: '#64748b',
  success: '#22c55e'
};

export default function AdminAnalytics() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalItems: 0,
    totalValue: 0,
    avgPrice: 0,
    categories: {} as any
  });

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from('products').select('*');
      if (error) throw error;

      if (data) {
        const totalItems = data.length;
        const totalValue = data.reduce((sum, item) => sum + (parseFloat(item.price) || 0), 0);
        const avgPrice = totalItems > 0 ? totalValue / totalItems : 0;
        
        // Category breakdown
        const cats = data.reduce((acc: any, item: any) => {
          const c = item.category || 'Other';
          acc[c] = (acc[c] || 0) + 1;
          return acc;
        }, {});

        setStats({ totalItems, totalValue, avgPrice, categories: cats });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color={THEME.primary} /></View>;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={THEME.dark} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Business Insights</Text>
        <TouchableOpacity onPress={fetchAnalytics}>
          <Ionicons name="refresh" size={22} color={THEME.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        
        {/* Top Summary Cards */}
        <View style={styles.mainCard}>
          <Text style={styles.cardLabel}>TOTAL INVENTORY VALUE</Text>
          <Text style={styles.totalValText}>Rs. {stats.totalValue.toLocaleString()}</Text>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>Live Updates Enabled</Text>
          </View>
        </View>

        <View style={styles.row}>
          <View style={[styles.statBox, { marginRight: 15 }]}>
            <Ionicons name="cube-outline" size={24} color={THEME.primary} />
            <Text style={styles.statNum}>{stats.totalItems}</Text>
            <Text style={styles.statLabel}>Total Products</Text>
          </View>
          <View style={styles.statBox}>
            <Ionicons name="trending-up-outline" size={24} color={THEME.success} />
            <Text style={styles.statNum}>Rs. {Math.round(stats.avgPrice).toLocaleString()}</Text>
            <Text style={styles.statLabel}>Avg. Unit Price</Text>
          </View>
        </View>

        {/* Category Breakdown */}
        <Text style={styles.sectionTitle}>Category Analysis</Text>
        <View style={styles.catCard}>
          {Object.entries(stats.categories).map(([name, count]: any, index) => (
            <View key={index} style={styles.catRow}>
              <View style={styles.catInfo}>
                <View style={[styles.dot, { backgroundColor: index % 2 === 0 ? THEME.primary : THEME.success }]} />
                <Text style={styles.catName}>{name}</Text>
              </View>
              <Text style={styles.catCount}>{count} items</Text>
            </View>
          ))}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: THEME.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', padding: 20, backgroundColor: THEME.white, alignItems: 'center', borderBottomWidth: 1, borderBottomColor: THEME.border },
  headerTitle: { fontSize: 17, fontWeight: '800', color: THEME.dark },
  backBtn: { padding: 5 },
  scroll: { padding: 20 },
  mainCard: { backgroundColor: THEME.dark, borderRadius: 28, padding: 25, marginBottom: 20, elevation: 8 },
  cardLabel: { color: 'rgba(255,255,255,0.6)', fontSize: 11, fontWeight: '800', letterSpacing: 1 },
  totalValText: { color: THEME.white, fontSize: 32, fontWeight: '900', marginVertical: 10 },
  badge: { backgroundColor: 'rgba(255,255,255,0.1)', alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  badgeText: { color: THEME.white, fontSize: 10, fontWeight: '600' },
  row: { flexDirection: 'row', marginBottom: 25 },
  statBox: { flex: 1, backgroundColor: THEME.white, padding: 20, borderRadius: 24, borderWidth: 1, borderColor: THEME.border, alignItems: 'center' },
  statNum: { fontSize: 20, fontWeight: '800', color: THEME.dark, marginTop: 10 },
  statLabel: { fontSize: 12, color: THEME.textMuted, marginTop: 4 },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: THEME.dark, marginBottom: 15 },
  catCard: { backgroundColor: THEME.white, borderRadius: 24, padding: 20, borderWidth: 1, borderColor: THEME.border },
  catRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  catInfo: { flexDirection: 'row', alignItems: 'center' },
  dot: { width: 8, height: 8, borderRadius: 4, marginRight: 12 },
  catName: { fontSize: 14, fontWeight: '600', color: THEME.dark },
  catCount: { fontSize: 14, fontWeight: '700', color: THEME.primary }
});