import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, ActivityIndicator, StatusBar, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { supabase } from '../supabaseConfig';
import { Ionicons } from '@expo/vector-icons';

const COLORS = {
  primary: '#5A31F4',
  bg: '#F8F9FA',
  card: '#FFFFFF',
  textMain: '#1A1A1A',
  textSec: '#7D7D7D',
  success: '#10B981',
  warning: '#F59E0B'
};

export default function OrderDetails() {
  const { id } = useLocalSearchParams();
  const [order, setOrder] = useState<any>(null);
  const [items, setItems] = useState<any[]>([]);
  const router = useRouter();

  useEffect(() => { if (id) fetchOrder(); }, [id]);

  const fetchOrder = async () => {
    const { data } = await supabase.from('orders').select('*').eq('id', Number(id)).single();
    if (data) {
      setOrder(data);
      try {
        const parsed = typeof data.items === 'string' ? JSON.parse(data.items) : (data.items || []);
        setItems(Array.isArray(parsed) ? parsed : [parsed]);
      } catch (e) { setItems([]); }
    }
  };

  const updateStatus = async (status: string) => {
    const { error } = await supabase.from('orders').update({ status }).eq('id', Number(id));
    if (!error) { Alert.alert("Success", `Status updated to ${status}`); fetchOrder(); }
  };


  const getStatusColor = (status: string) => {
    if (status === 'Pending') return COLORS.warning;
    if (status === 'Shipped') return COLORS.primary;
    if (status === 'Delivered') return COLORS.success;
    return COLORS.textSec;
  };

 
  const getStatusSteps = () => {
    const status = order?.status;
    const steps = ['Pending', 'Shipped', 'Delivered'];
    const currentIndex = steps.indexOf(status);
    return steps.map((s, index) => ({
      label: s,
      isActive: index <= currentIndex
    }));
  };

  if (!order) return <ActivityIndicator style={{ flex: 1 }} color={COLORS.primary} />;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color={COLORS.textMain} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Order Details</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.heroBox}>
          <Text style={styles.heroLabel}>Total Payment</Text>
          <Text style={styles.heroValue}>Rs. {Number(order.total_amount).toLocaleString()}</Text>
          
        
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(order.status) + '20' }]}>
            <Text style={{ color: getStatusColor(order.status), fontWeight: '700' }}>
              {order.status}
            </Text>
          </View>
        </View>

        {/* Tracking Progress Bar */}
        <View style={styles.statusContainer}>
          {getStatusSteps().map((step, index) => (
            <View key={index} style={styles.stepWrapper}>
              <View style={[styles.stepDot, step.isActive && { backgroundColor: getStatusColor(order.status) }]} />
              {index < 2 && <View style={[styles.stepLine, step.isActive && { backgroundColor: getStatusColor(order.status) }]} />}
              <Text style={[styles.stepText, step.isActive && { color: getStatusColor(order.status) }]}>{step.label}</Text>
            </View>
          ))}
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionHeading}>Purchased Items</Text>
          {items.map((item, index) => (
            <View key={index} style={styles.infoRow}>
              <Text style={styles.itemText}>{item.name} x {item.quantity}</Text>
              <Text style={styles.value}>Rs. {Number(item.price).toLocaleString()}</Text>
            </View>
          ))}
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionHeading}>Order Summary</Text>
          <InfoRow label="Order ID" value={`#${order.id}`} />
          <InfoRow label="Date" value={new Date(order.created_at).toLocaleDateString('en-GB')} />
        </View>

        <View style={styles.buttonContainer}>
          <Text style={styles.sectionHeading}>Update Order Status</Text>
          <View style={styles.btnRow}>
            {['Pending', 'Shipped', 'Delivered'].map((s) => (
              <TouchableOpacity 
                key={s} 
                style={[styles.actionBtn, order.status === s && { backgroundColor: getStatusColor(s) }]} 
                onPress={() => updateStatus(s)}
              >
                <Text style={[styles.btnText, order.status === s && { color: '#fff' }]}>{s}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const InfoRow = ({ label, value }: any) => (
  <View style={styles.infoRow}>
    <Text style={styles.label}>{label}</Text>
    <Text style={styles.value}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, backgroundColor: COLORS.card },
  headerTitle: { fontSize: 20, fontWeight: '700', color: COLORS.textMain },
  backButton: { padding: 5 },
  scroll: { padding: 20 },
  heroBox: { alignItems: 'center', marginBottom: 20, backgroundColor: COLORS.card, padding: 30, borderRadius: 25 },
  heroLabel: { color: COLORS.textSec, fontSize: 14 },
  heroValue: { fontSize: 32, fontWeight: '900', color: COLORS.textMain, marginVertical: 10 },
  statusBadge: { paddingHorizontal: 15, paddingVertical: 6, borderRadius: 10 },
  card: { backgroundColor: COLORS.card, padding: 20, borderRadius: 20, marginBottom: 15 },
  sectionHeading: { fontSize: 16, fontWeight: '800', marginBottom: 15, color: COLORS.textMain },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  label: { color: COLORS.textSec, fontSize: 14 },
  value: { fontWeight: '600', color: COLORS.textMain },
  itemText: { color: COLORS.textMain, fontSize: 14 },
  buttonContainer: { padding: 20, backgroundColor: COLORS.card, borderRadius: 20 },
  btnRow: { flexDirection: 'row', justifyContent: 'space-between' },
  actionBtn: { flex: 1, marginHorizontal: 5, padding: 12, backgroundColor: '#F0EBFB', borderRadius: 12, alignItems: 'center' },
  btnText: { fontWeight: '700', color: COLORS.primary },
  statusContainer: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 10, marginBottom: 30 },
  stepWrapper: { alignItems: 'center', flex: 1 },
  stepDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#ccc', marginBottom: 5 },
  stepLine: { position: 'absolute', top: 5, left: '60%', width: '80%', height: 2, backgroundColor: '#ccc' },
  stepText: { fontSize: 10, color: '#ccc', fontWeight: '600' }
});
