import React, { useEffect, useState } from 'react';
import { 
  View, Text, FlatList, StyleSheet, SafeAreaView, 
  ActivityIndicator, TouchableOpacity, StatusBar, Alert 
} from 'react-native';
import { supabase } from '../supabaseConfig';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function AdminOrdersScreen() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetchAdminOrders();
  }, []);

  const fetchAdminOrders = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (err: any) {
      console.error("Admin Order Fetch Error:", err);
      Alert.alert("Error", "Failed to load orders: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: string, userId: string) => {
    try {
      // 1. Update Order Status
      const { error: orderError } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId);

      if (orderError) throw orderError;

      // 2. Send Notification if delivered
      if (newStatus === 'Delivered') {
        const { error: notifyError } = await supabase
          .from('notifications')
          .insert([
            {
              user_id: userId,
              title: 'Order Delivered! 📦',
              message: `Your order #${orderId.toString().slice(0, 8).toUpperCase()} has been delivered successfully.`,
              is_read: false // Ensure 'is_read' exists as a BOOLEAN column in your DB
            }
          ]);
        
        if (notifyError) {
          console.error("Notification Insert Error:", notifyError);
          // Don't alert the admin for every notification failure to keep UX smooth
        }
      }

      // 3. Update Local State
      setOrders((prevOrders) =>
        prevOrders.map((order) =>
          order.id === orderId ? { ...order, status: newStatus } : order
        )
      );

      Alert.alert("Success ✅", `Order status updated to "${newStatus}"`);
    } catch (err: any) {
      Alert.alert("Update Failed ❌", err.message);
    }
  };

  const renderAdminOrderItem = ({ item }: { item: any }) => (
    <View style={styles.orderCard}>
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
        <Text style={styles.userLabel}>User ID: {item.user_id?.slice(0, 8)}...</Text>
        <Text style={styles.orderPrice}>Rs. {Number(item.total_amount).toLocaleString()}</Text>
        <View style={styles.locationBox}>
          <Ionicons name="location-outline" size={14} color="#636e72" />
          <Text style={styles.addressText}>{item.address || 'No Address Provided'}</Text>
        </View>
      </View>

      <View style={styles.orderBottom}>
        <Text style={styles.actionTitle}>Update Status:</Text>
        <View style={styles.btnGroup}>
          {item.status !== 'Dispatched' && item.status !== 'Delivered' && (
            <TouchableOpacity 
              style={[styles.actionBtn, { backgroundColor: '#007AFF' }]}
              onPress={() => updateOrderStatus(item.id, 'Dispatched', item.user_id)}
            >
              <Text style={styles.btnText}>Ship 🚚</Text>
            </TouchableOpacity>
          )}

          {item.status !== 'Delivered' && (
            <TouchableOpacity 
              style={[styles.actionBtn, { backgroundColor: '#00CE97' }]}
              onPress={() => updateOrderStatus(item.id, 'Delivered', item.user_id)}
            >
              <Text style={styles.btnText}>Deliver ✅</Text>
            </TouchableOpacity>
          )}

          {item.status === 'Delivered' && (
            <View style={styles.completedBox}>
              <Ionicons name="checkmark-circle" size={16} color="#00CE97" />
              <Text style={styles.completedText}>Order Completed</Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#2d3436" />
        </TouchableOpacity>
        <Text style={styles.title}>Admin Orders</Text>
        <TouchableOpacity onPress={fetchAdminOrders} style={styles.backBtn}>
          <Ionicons name="refresh" size={22} color="#5209e3" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.center}><ActivityIndicator size="large" color="#5209e3" /></View>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderAdminOrderItem}
          contentContainerStyle={styles.list}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFD' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#F1F4F9' },
  backBtn: { width: 45, height: 45, borderRadius: 15, backgroundColor: '#F1F4F9', justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 20, fontWeight: '900', color: '#2d3436' },
  list: { padding: 20 },
  orderCard: { backgroundColor: '#fff', borderRadius: 22, padding: 20, marginBottom: 15, elevation: 3 },
  orderTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
  idBadge: { backgroundColor: '#F1F4F9', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  idText: { fontSize: 12, fontWeight: '800', color: '#636e72' },
  statusTag: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  statusLabel: { fontSize: 12, fontWeight: '800' },
  orderMiddle: { marginBottom: 15, gap: 5 },
  userLabel: { fontSize: 12, color: '#b2bec3' },
  orderPrice: { fontSize: 22, fontWeight: '900', color: '#2d3436' },
  locationBox: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 5 },
  addressText: { fontSize: 13, color: '#636e72' },
  orderBottom: { paddingTop: 15, borderTopWidth: 1, borderTopColor: '#F1F4F9' },
  actionTitle: { fontSize: 13, fontWeight: '700', color: '#2d3436', marginBottom: 10 },
  btnGroup: { flexDirection: 'row', gap: 10 },
  actionBtn: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, justifyContent: 'center', alignItems: 'center', minWidth: 90 },
  btnText: { color: '#fff', fontWeight: '800', fontSize: 13 },
  completedBox: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#E6FFF2', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10 },
  completedText: { color: '#00CE97', fontWeight: '800', fontSize: 13 },
  center: { flex: 1, justifyContent: 'center' }
});