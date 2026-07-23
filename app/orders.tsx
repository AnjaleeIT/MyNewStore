import React, { useEffect, useState } from 'react';
import { 
  View, Text, FlatList, StyleSheet, SafeAreaView, 
  ActivityIndicator, TouchableOpacity, StatusBar, Alert 
} from 'react-native';
import { supabase } from '../supabaseConfig';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function MyOrdersScreen() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetchOrders();

  
    let orderChannel: any;

    const setupRealtimeSubscription = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // 'orders' 
      orderChannel = supabase
        .channel('user-orders-status')
        .on(
          'postgres_changes',
          {
            event: 'UPDATE', 
            schema: 'public',
            table: 'orders',
            filter: `user_id=eq.${user.id}` 
          },
          (payload) => {
            const updatedOrder = payload.new;

            // (No need to manual refresh)
            setOrders((prevOrders) =>
              prevOrders.map((order) =>
                order.id === updatedOrder.id ? updatedOrder : order
              )
            );

            
            if (updatedOrder.status === 'Delivered') {
              Alert.alert(
                "🚚 Order Delivered!",
                `Good news! Your order #${updatedOrder.id.slice(0, 8).toUpperCase()} has been delivered successfully. Thank you!`
              );
            } else {
              Alert.alert(
                "📦 Order Update",
                `Your order #${updatedOrder.id.slice(0, 8).toUpperCase()} status is now: ${updatedOrder.status}`
              );
            }
          }
        )
        .subscribe();
    };

    setupRealtimeSubscription();

    
    return () => {
      if (orderChannel) {
        supabase.removeChannel(orderChannel);
      }
    };
  }, []);

  const fetchOrders = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (err) {
      console.error("Order Fetch Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const renderOrderItem = ({ item }: { item: any }) => (
    <TouchableOpacity style={styles.orderCard} activeOpacity={0.7}>
      <View style={styles.orderTop}>
        <View style={styles.idBadge}>
         
          <Text style={styles.idText}>#{item.id.toString().slice(0, 8).toUpperCase()}</Text>
        </View>
        <View style={[
          styles.statusTag, 
          { backgroundColor: item.status === 'Pending' ? '#FFF9E6' : item.status === 'Delivered' ? '#E6FFF2' : '#E6F0FF' }
        ]}>
          <Text style={[
            styles.statusLabel, 
            { color: item.status === 'Pending' ? '#FFB800' : item.status === 'Delivered' ? '#00CE97' : '#007AFF' }
          ]}>
            {item.status}
          </Text>
        </View>
      </View>
      
      <View style={styles.orderMiddle}>
        <Text style={styles.orderPrice}>Rs. {Number(item.total_amount).toLocaleString()}</Text>
        <Text style={styles.orderDate}>{new Date(item.created_at).toDateString()}</Text>
      </View>

      <View style={styles.orderBottom}>
        <View style={styles.locationBox}>
          <Ionicons name="location-outline" size={14} color="#b2bec3" />
          <Text style={styles.addressText} numberOfLines={1}>{item.address}</Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color="#b2bec3" />
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#2d3436" />
        </TouchableOpacity>
        <Text style={styles.title}>My History</Text>
        <View style={{ width: 45 }} />
      </View>

      {loading ? (
        <View style={styles.center}><ActivityIndicator size="large" color="#5209e3" /></View>
      ) : orders.length === 0 ? (
        <View style={styles.emptyState}>
          <View style={styles.iconCircle}>
             <Ionicons name="receipt-outline" size={50} color="#b2bec3" />
          </View>
          <Text style={styles.emptyTitle}>No orders yet</Text>
          <Text style={styles.emptySub}>Your shopping history will appear here.</Text>
        </View>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderOrderItem}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFD' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, backgroundColor: '#fff' },
  backBtn: { width: 45, height: 45, borderRadius: 15, backgroundColor: '#F1F4F9', justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 20, fontWeight: '900', color: '#2d3436' },
  list: { padding: 20 },
  orderCard: { backgroundColor: '#fff', borderRadius: 25, padding: 20, marginBottom: 15, elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10 },
  orderTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
  idBadge: { backgroundColor: '#F1F4F9', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  idText: { fontSize: 12, fontWeight: '800', color: '#636e72' },
  statusTag: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  statusLabel: { fontSize: 12, fontWeight: '800' },
  orderMiddle: { marginBottom: 15 },
  orderPrice: { fontSize: 22, fontWeight: '900', color: '#2d3436' },
  orderDate: { fontSize: 13, color: '#b2bec3', marginTop: 2 },
  orderBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 15, borderTopWidth: 1, borderTopColor: '#F1F4F9' },
  locationBox: { flexDirection: 'row', alignItems: 'center', gap: 5, flex: 1 },
  addressText: { fontSize: 13, color: '#b2bec3', flex: 1 },
  center: { flex: 1, justifyContent: 'center' },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  iconCircle: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#F1F4F9', justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  emptyTitle: { fontSize: 20, fontWeight: '900', color: '#2d3436' },
  emptySub: { fontSize: 14, color: '#b2bec3', textAlign: 'center', marginTop: 10 }
});
