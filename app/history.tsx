import React, { useState, useCallback } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  TouchableOpacity, 
  StyleSheet, 
  ActivityIndicator, 
  SafeAreaView, 
  StatusBar 
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../supabaseConfig';

const COLORS = {
  primary: '#5F1BE9',    // Brand Purple
  bg: '#F8FAFC',         // Light Premium Slate Background
  card: '#FFFFFF',       // Pure White
  textMain: '#0F172A',   // Deep Slate Black
  textSec: '#94A3B8',    // Muted Slate Grey
  successBg: '#F0FDF4',  // Light Pastel Green for Delivered
  successText: '#16A34A',
  warningBg: '#FFF7ED',  // Light Pastel Orange for Pending
  warningText: '#EA580C'
};

export default function OrderHistory() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useFocusEffect(
    useCallback(() => { 
      fetchOrders(); 
    }, [])
  );

  const fetchOrders = async () => {
    try {
      setLoading(true);
      // 💡 .order('id', { ascending: false })
      const { data } = await supabase.from('orders').select('*').order('id', { ascending: false });
      setOrders(data || []);
    } catch (err) {
      console.log("Error fetching order history:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton} activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={24} color={COLORS.textMain} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Order History</Text>
        <View style={{ width: 38 }} />
      </View>

      {loading ? (
        <View style={styles.centerLoading}>
          <ActivityIndicator size="small" color={COLORS.primary} />
        </View>
      ) : (
        <FlatList
          data={orders}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={() => (
            <View style={styles.emptyContainer}>
              <Ionicons name="receipt-outline" size={44} color={COLORS.textSec} />
              <Text style={styles.emptyText}>No orders placed yet</Text>
            </View>
          )}
          renderItem={({ item }) => {
            const isDelivered = item.status?.toLowerCase() === 'delivered';
            
           
            const safeId = item.id ? String(item.id).toUpperCase() : 'UNKNOWN';
            
            return (
              <TouchableOpacity 
                style={styles.card} 
                onPress={() => router.push({ pathname: '/order-details', params: { id: item.id } })}
                activeOpacity={0.9}
              >
                <View style={styles.cardLeftContent}>
                  <View style={styles.iconBox}>
                    <Ionicons name="bag-check" size={20} color={COLORS.primary} />
                  </View>
                  
                  <View style={styles.infoBox}>
                   
                    <Text style={styles.orderId}>Order #{safeId}</Text>
                    <Text style={styles.date}>
                      {item.created_at 
                        ? new Date(item.created_at).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })
                        : 'Today'
                      }
                    </Text>
                    <Text style={styles.price}>Rs. {Number(item.total_amount).toLocaleString()}</Text>
                  </View>
                </View>

                {/* Status Badge */}
                <View style={[styles.statusBadge, isDelivered ? styles.badgeSuccess : styles.badgeWarning]}>
                  <Text style={[styles.statusText, isDelivered ? styles.textSuccess : styles.textWarning]}>
                    {item.status || 'Pending'}
                  </Text>
                </View>

              </TouchableOpacity>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, backgroundColor: COLORS.card, borderBottomWidth: 1, borderColor: '#F1F5F9' },
  headerTitle: { fontSize: 18, fontWeight: '800', color: COLORS.textMain },
  backButton: { width: 38, height: 38, borderRadius: 12, backgroundColor: '#F8FAFC', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#E2E8F0' },
  centerLoading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  list: { padding: 16, paddingBottom: 40 },
  emptyContainer: { alignItems: 'center', marginTop: 160, gap: 10 },
  emptyText: { color: COLORS.textSec, fontSize: 13, fontWeight: '600' },
  card: { backgroundColor: COLORS.card, padding: 16, borderRadius: 22, marginBottom: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: '#F1F5F9', elevation: 3, shadowColor: '#0F172A', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.02, shadowRadius: 8 },
  cardLeftContent: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  iconBox: { width: 44, height: 44, borderRadius: 14, backgroundColor: '#F3E8FF', justifyContent: 'center', alignItems: 'center' },
  infoBox: { flexDirection: 'column' },
  orderId: { fontSize: 14, fontWeight: '700', color: COLORS.textMain },
  date: { fontSize: 11, color: COLORS.textSec, fontWeight: '600', marginTop: 2 },
  price: { fontWeight: '800', fontSize: 14, color: COLORS.textMain, marginTop: 4 },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  badgeSuccess: { backgroundColor: COLORS.successBg },
  textSuccess: { color: COLORS.successText, fontSize: 11, fontWeight: '800', textTransform: 'uppercase' },
  badgeWarning: { backgroundColor: COLORS.warningBg },
  textWarning: { color: COLORS.warningText, fontSize: 11, fontWeight: '800', textTransform: 'uppercase' },
  statusText: { fontSize: 11, fontWeight: '800' }
});
