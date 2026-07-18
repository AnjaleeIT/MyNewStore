import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, SafeAreaView, 
  StatusBar, ScrollView, ActivityIndicator, Dimensions, RefreshControl,
  LayoutAnimation, Platform, UIManager
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../supabaseConfig'; 

const { width } = Dimensions.get('window');

// Android වල LayoutAnimation වැඩ කරන්න මේක අනිවාර්යයි
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface DashboardStats {
  orders: number;
  products: number;
  sales: number;
  tickets: number;
}

export default function AdminDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  
  const [liveTime, setLiveTime] = useState<string>('');
  const [liveDate, setLiveDate] = useState<string>('');

  const [stats, setStats] = useState<DashboardStats>({ 
    orders: 0, 
    products: 0, 
    sales: 0, 
    tickets: 0 
  });

  // 🕒 Live Date & Time Tracker
  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      const timeOptions: Intl.DateTimeFormatOptions = { hour: '2-digit', minute: '2-digit', hour12: true };
      const dateOptions: Intl.DateTimeFormatOptions = { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' };
      setLiveTime(now.toLocaleTimeString('en-US', timeOptions));
      setLiveDate(now.toLocaleDateString('en-US', dateOptions));
    };
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  const fetchRealTimeStats = async () => {
    try {
      const [productsRes, ordersRes, salesRes, ticketsRes] = await Promise.all([
        supabase.from('products').select('*', { count: 'exact', head: true }),
        supabase.from('orders').select('*', { count: 'exact', head: true }),
        supabase.from('orders').select('total_amount'),
        supabase.from('support_tickets').select('*', { count: 'exact', head: true }).eq('status', 'pending')
      ]);

      const totalSales = salesRes.data?.reduce((acc, curr) => {
        return acc + (Number(curr.total_amount) || 0);
      }, 0) || 0;

      // 🔥 UI Spring Animation
      LayoutAnimation.configureNext(LayoutAnimation.Presets.spring);

      setStats({
        products: productsRes.count || 0,
        orders: ordersRes.count || 0,
        sales: totalSales,
        tickets: ticketsRes.count || 0
      });
      
    } catch (error: any) {
      console.error("Dashboard Sync Error:", error.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // ⚡ High-Performance Unified Real-time Engine
  useEffect(() => {
    // පළමු වතාවට ඩේටා ටික ලෝඩ් කරගන්නවා
    fetchRealTimeStats();

    // සියලුම ටේබල් ලයිව් ට්‍රැක් කරන්න තනි චැනල් එකක් භාවිතා කරයි
    const dashboardChannel = supabase
      .channel('db-console-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, () => { fetchRealTimeStats(); })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => { fetchRealTimeStats(); })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'support_tickets' }, () => { fetchRealTimeStats(); })
      .subscribe((status) => {
        console.log(`Supabase Sync Status: ${status}`);
      });

    return () => {
      supabase.removeChannel(dashboardChannel);
    };
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchRealTimeStats();
  }, []);

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color="#4F46E5" />
        <Text style={styles.loadingText}>Synthesizing Console Engine...</Text>
      </View>
    );
  }

  // 📈 Graph Dynamics
  const maxBarHeight = 100;
  const ordersHeight = stats.orders > 0 ? Math.min(maxBarHeight, 30 + stats.orders * 12) : 20;
  const inventoryHeight = stats.products > 0 ? Math.min(maxBarHeight, 20 + stats.products * 4) : 15;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.brandTitle}>LeeStyle <Text style={styles.accentText}>Console</Text></Text>
          <View style={styles.clockContainer}>
            <Text style={styles.liveTimeText}>{liveTime || '00:00 AM'}</Text>
            <View style={styles.bulletSeparator} />
            <Text style={styles.liveDateText}>{liveDate || 'Loading system date...'}</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.iconCircle} onPress={onRefresh} activeOpacity={0.7}>
          {refreshing ? (
            <ActivityIndicator size="small" color="#4F46E5" />
          ) : (
            <Ionicons name="refresh" size={16} color="#4F46E5" />
          )}
        </TouchableOpacity>
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#4F46E5" />
        }
      >
        
        {/* Main Analytics Card */}
        <View style={styles.mainAnalyticsContainer}>
          <View style={styles.earningCard}>
            <View style={styles.cardHeaderRow}>
              <Text style={styles.cardLabel}>TOTAL REVENUE</Text>
              <View style={styles.growthBadge}>
                <View style={styles.liveDot} />
                <Text style={styles.growthText}>Live Engine</Text>
              </View>
            </View>
            <Text style={styles.mainAmount}>Rs. {stats.sales.toLocaleString()}</Text>
            
            <View style={styles.miniGraphWrap}>
              <View style={[styles.graphNode, styles.activeNode]} />
              <View style={[styles.graphLine, styles.activeLine]} />
              <View style={[styles.graphNode, styles.activeNode]} />
              <View style={[styles.graphLine, styles.activeLine]} />
              <View style={[styles.graphNode, styles.activeNode]} />
              <View style={[styles.graphLine, styles.activeLine]} />
              <View style={[styles.graphNode, styles.pulseNode]} />
            </View>
          </View>

          {/* 📊 Chart */}
          <View style={styles.chartVisualCard}>
            <Text style={styles.chartTitle}>Infrastructure Load Nodes (Live)</Text>
            <View style={styles.barChartContainer}>
              
              <View style={styles.barColumn}>
                <View style={[styles.barFill, { height: 35, backgroundColor: '#E2E8F0' }]} />
                <Text style={styles.barLabel}>Node 01</Text>
              </View>

              <View style={styles.barColumn}>
                <View style={[styles.barFill, { height: 60, backgroundColor: '#E2E8F0' }]} />
                <Text style={styles.barLabel}>Node 02</Text>
              </View>

              <View style={styles.barColumn}>
                <View style={[styles.barFill, { height: 45, backgroundColor: '#E2E8F0' }]} />
                <Text style={styles.barLabel}>Node 03</Text>
              </View>

              {/* Orders Dynamic Bar */}
              <View style={styles.barColumn}>
                <View style={styles.countBadgeWrap}>
                  <Text style={styles.countBadgeText}>{stats.orders}</Text>
                </View>
                <View style={[styles.barFill, { height: ordersHeight, backgroundColor: '#4F46E5' }]} />
                <Text style={[styles.barLabel, { color: '#4F46E5', fontWeight: '800' }]}>Orders</Text>
              </View>

              {/* Inventory Dynamic Bar */}
              <View style={styles.barColumn}>
                <View style={styles.countBadgeWrap}>
                  <Text style={styles.countBadgeText}>{stats.products}</Text>
                </View>
                <View style={[styles.barFill, { height: inventoryHeight, backgroundColor: '#10B981' }]} />
                <Text style={[styles.barLabel, { color: '#10B981', fontWeight: '800' }]}>Inventory</Text>
              </View>

            </View>
          </View>
        </View>

        {/* Pro Horizontal Slider Metrics Grid */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalGrid} contentContainerStyle={styles.horizontalGridContent}>
          <MiniMetricCard icon="cube-sharp" color="#4F46E5" count={stats.products} label="Catalogued Items" onPress={() => router.push('/admin-inventory')} />
          <MiniMetricCard icon="cart-sharp" color="#10B981" count={stats.orders} label="Active Pipelines" onPress={() => router.push('/admin-orders')} />
          <MiniMetricCard icon="chatbubbles-sharp" color="#F59E0B" count={stats.tickets} label="Pending Tickets" onPress={() => router.push('/AdminTicketsScreen')} />
        </ScrollView>

        <Text style={styles.sectionTitle}>System Infrastructure</Text>
        
        {/* Command Center */}
        <View style={styles.actionGrid}>
          <ActionButton title="Orders" sub="Manage Shipments" icon="receipt-sharp" color="#4F46E5" onPress={() => router.push('/admin-orders')} />
          <ActionButton title="Catalogue" sub="Add Products" icon="add-circle-sharp" color="#10B981" onPress={() => router.push('/admin-add-product')} />
          <ActionButton title="Inventory" sub="Stock Controller" icon="layers-sharp" color="#F59E0B" onPress={() => router.push('/admin-inventory')} />
          <ActionButton title="Analytics" sub="Business Insights" icon="pie-chart-sharp" color="#EC4899" onPress={() => router.push('/admin-analytics')} />
          <ActionButton title="Support Desk" sub="Client Messages" icon="chatbubbles-sharp" color="#5A31F4" onPress={() => router.push('/AdminTicketsScreen')} />
          <ActionButton title="Broadcast" sub="Send Push Alerts" icon="megaphone-sharp" color="#06B6D4" onPress={() => router.push('/admin-broadcast')} />
        </View>

        <TouchableOpacity style={styles.footerBtn} onPress={() => router.replace('/')} activeOpacity={0.8}>
          <Ionicons name="swap-horizontal-sharp" size={16} color="#64748B" />
          <Text style={styles.footerBtnText}>Switch to Core Terminal</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

// Sub Components
const MiniMetricCard = ({ icon, color, count, label, onPress }: any) => (
  <TouchableOpacity style={styles.miniMetricCard} onPress={onPress} activeOpacity={0.7}>
    <View style={[styles.iconBox, { backgroundColor: color + '0F' }]}>
      <Ionicons name={icon} size={18} color={color} />
    </View>
    <View style={styles.miniMetricMeta}>
      <Text style={styles.miniNum}>{count.toLocaleString()}</Text>
      <Text style={styles.miniLabel}>{label}</Text>
    </View>
  </TouchableOpacity>
);

const ActionButton = ({ title, sub, icon, color, onPress }: any) => (
  <TouchableOpacity style={styles.actionCard} onPress={onPress} activeOpacity={0.7}>
    <View style={[styles.actionIconWrap, { backgroundColor: color + '0B' }]}>
      <Ionicons name={icon} size={20} color={color} />
    </View>
    <View style={{ flex: 1 }}>
      <Text style={styles.actionTitle} numberOfLines={1}>{title}</Text>
      <Text style={styles.actionSub} numberOfLines={1}>{sub}</Text>
    </View>
    <Ionicons name="chevron-forward-sharp" size={12} color="#94A3B8" />
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8FAFC' },
  loadingText: { marginTop: 12, fontSize: 13, color: '#64748B', fontWeight: '600', letterSpacing: 0.3 },
  header: { paddingHorizontal: 24, paddingVertical: 20, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#F1F5F9', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerLeft: { flex: 1 },
  brandTitle: { fontSize: 22, fontWeight: '900', color: '#0F172A', letterSpacing: -0.5 },
  accentText: { color: '#4F46E5', fontWeight: '900' },
  clockContainer: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  liveTimeText: { fontSize: 12, color: '#334155', fontWeight: '800', letterSpacing: 0.2 },
  bulletSeparator: { width: 4, height: 4, borderRadius: 2, backgroundColor: '#CBD5E1', marginHorizontal: 8 },
  liveDateText: { fontSize: 11, color: '#64748B', fontWeight: '600' },
  iconCircle: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#F8FAFC', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#E2E8F0' },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 40 },
  mainAnalyticsContainer: { backgroundColor: '#FFFFFF', borderRadius: 24, padding: 20, marginVertical: 16, borderWidth: 1, borderColor: '#F1F5F9', shadowColor: '#0F172A', shadowOpacity: 0.02, shadowRadius: 15, elevation: 2 },
  earningCard: { backgroundColor: '#EEF2F6', padding: 20, borderRadius: 18, borderLeftWidth: 4, borderLeftColor: '#4F46E5' },
  cardHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardLabel: { color: '#475569', fontSize: 10, fontWeight: '800', letterSpacing: 0.8 },
  growthBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, gap: 5, borderWidth: 1, borderColor: '#E2E8F0' },
  liveDot: { width: 5, height: 5, borderRadius: 2.5, backgroundColor: '#10B981' },
  growthText: { color: '#334155', fontSize: 10, fontWeight: '700' },
  mainAmount: { color: '#0F172A', fontSize: 30, fontWeight: '900', marginTop: 8, letterSpacing: -0.5 },
  miniGraphWrap: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', height: 20, marginTop: 16 },
  graphNode: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#CBD5E1' },
  activeNode: { backgroundColor: '#4F46E5' },
  pulseNode: { backgroundColor: '#10B981', transform: [{ scale: 1.2 }] },
  graphLine: { height: 1.5, width: 40, backgroundColor: '#E2E8F0' },
  activeLine: { backgroundColor: '#818CF8' },
  chartVisualCard: { marginTop: 24 },
  chartTitle: { fontSize: 11, fontWeight: '800', color: '#64748B', marginBottom: 22, textTransform: 'uppercase', letterSpacing: 0.5 },
  barChartContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', height: 115, paddingHorizontal: 4 },
  barColumn: { alignItems: 'center', gap: 6 },
  barFill: { width: (width - 150) / 5, borderRadius: 6 },
  barLabel: { fontSize: 10, color: '#94A3B8', fontWeight: '700', marginTop: 4 },
  countBadgeWrap: { backgroundColor: '#F1F5F9', paddingHorizontal: 5, paddingVertical: 2, borderRadius: 6, marginBottom: 2 },
  countBadgeText: { fontSize: 9, fontWeight: '800', color: '#475569' },
  horizontalGrid: { marginVertical: 8 },
  horizontalGridContent: { gap: 12, paddingRight: 20 },
  miniMetricCard: { flexDirection: 'row', backgroundColor: '#FFFFFF', padding: 16, borderRadius: 18, alignItems: 'center', gap: 12, borderWidth: 1, borderColor: '#F1F5F9', width: width * 0.44 },
  iconBox: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  miniMetricMeta: { flex: 1 },
  miniNum: { fontSize: 18, fontWeight: '800', color: '#0F172A' },
  miniLabel: { fontSize: 11, color: '#64748B', fontWeight: '600', marginTop: 1 },
  sectionTitle: { fontSize: 12, fontWeight: '800', color: '#475569', marginTop: 28, marginBottom: 16, letterSpacing: 0.8, textTransform: 'uppercase', paddingLeft: 2 },
  actionGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  actionCard: { width: (width - 52) / 2, backgroundColor: '#FFFFFF', padding: 14, borderRadius: 18, marginBottom: 12, flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderColor: '#F1F5F9' },
  actionIconWrap: { width: 38, height: 38, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  actionTitle: { fontSize: 13, fontWeight: '800', color: '#0F172A' },
  actionSub: { fontSize: 10, color: '#94A3B8', marginTop: 1 },
  footerBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 20, padding: 16, backgroundColor: '#FFFFFF', borderRadius: 18, borderWidth: 1, borderColor: '#E2E8F0' },
  footerBtnText: { marginLeft: 8, color: '#64748b', fontWeight: '700', fontSize: 13 }
});