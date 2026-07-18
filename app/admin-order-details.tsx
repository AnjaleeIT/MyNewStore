import React, { useEffect, useState } from 'react';
import { 
  View, Text, StyleSheet, ScrollView, TouchableOpacity, 
  SafeAreaView, ActivityIndicator, StatusBar, Alert, TextInput, Dimensions 
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { supabase } from '../supabaseConfig';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

const DESIGN = {
  primary: '#007AFF', 
  dark: '#000000',
  softGray: '#F2F2F7',
  border: '#E5E5EA',
  success: '#34C759',
  white: '#FFFFFF',
  secondaryText: '#8E8E93'
};

export default function AdminOrderDetails() {
  const { id } = useLocalSearchParams();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  
  const [shipInfo, setShipInfo] = useState('');
  const [delInfo, setDelInfo] = useState('');
  const router = useRouter();

  useEffect(() => { if (id) fetchOrder(); }, [id]);

  const fetchOrder = async () => {
    setLoading(true);
    const { data } = await supabase.from('orders').select('*').eq('id', Number(id)).single();
    if (data) {
      setOrder(data);
      setShipInfo(data.shipping_details || '');
      setDelInfo(data.delivery_details || '');
    }
    setLoading(false);
  };

  const updateOrder = async (newStatus: string) => {
    if (updating) return;
    setUpdating(true);

    const { error } = await supabase
      .from('orders')
      .update({ 
        status: newStatus,
        shipping_details: shipInfo,
        delivery_details: delInfo 
      })
      .eq('id', Number(id));

    setUpdating(false);

    if (!error) {
      setOrder((prev: any) => ({ ...prev, status: newStatus }));
      Alert.alert("Success", `Order status updated to ${newStatus}`);
    } else {
      Alert.alert("Error", "Check if shipping_details/delivery_details columns exist in DB.");
    }
  };

  if (loading) return <View style={styles.centered}><ActivityIndicator size="large" color={DESIGN.primary} /></View>;

  const orderItems = order.items ? (typeof order.items === 'string' ? JSON.parse(order.items) : order.items) : [];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {/* Ultra-Sleek Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn}>
          <Ionicons name="arrow-back" size={22} color={DESIGN.dark} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Order Master</Text>
        <TouchableOpacity onPress={fetchOrder} style={styles.headerBtn}>
          <Ionicons name="refresh" size={20} color={DESIGN.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        
        {/* Minimalist Status Head */}
        <View style={styles.heroSection}>
          <Text style={styles.labelMicro}>ORDER STATUS</Text>
          <View style={styles.statusRow}>
            <Text style={styles.statusTextLarge}>{order.status}</Text>
            <View style={[styles.statusIndicator, { backgroundColor: order.status === 'Delivered' ? DESIGN.success : DESIGN.primary }]} />
          </View>
        </View>

        {/* Courier Intelligence Card */}
        <View style={styles.mainCard}>
          <Text style={styles.labelMicro}>LOGISTICS DATA</Text>
          <View style={styles.inputGroup}>
            <View style={styles.inputIcon}><Ionicons name="car" size={18} color={DESIGN.primary} /></View>
            <TextInput 
              style={styles.field} 
              value={shipInfo} 
              onChangeText={setShipInfo} 
              placeholder="Courier ID (e.g. PRONTO-882)" 
              placeholderTextColor={DESIGN.secondaryText}
            />
          </View>
          <View style={styles.inputGroup}>
            <View style={styles.inputIcon}><Ionicons name="time" size={18} color={DESIGN.primary} /></View>
            <TextInput 
              style={styles.field} 
              value={delInfo} 
              onChangeText={setDelInfo} 
              placeholder="Estimated Arrival" 
              placeholderTextColor={DESIGN.secondaryText}
            />
          </View>
        </View>

        {/* Order Breakdown Card */}
        <View style={styles.mainCard}>
          <Text style={styles.labelMicro}>ITEMIZED SUMMARY</Text>
          {orderItems.map((item: any, i: number) => (
            <View key={i} style={styles.itemRow}>
              <View style={styles.itemMain}>
                <Text style={styles.itemNameText}>{item.name}</Text>
                <Text style={styles.itemQtyText}>Quantity: {item.quantity}</Text>
              </View>
              <Text style={styles.itemPriceText}>Rs. {(item.price * item.quantity).toLocaleString()}</Text>
            </View>
          ))}
          <View style={styles.line} />
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Settlement</Text>
            <Text style={styles.totalValue}>Rs. {Number(order.total_amount).toLocaleString()}</Text>
          </View>
        </View>

        {/* Dynamic Pipeline Controls */}
        <Text style={styles.labelMicroCenter}>ACTION PIPELINE</Text>
        <View style={styles.pipelineBox}>
          {['Pending', 'Shipped', 'Delivered'].map((s) => (
            <TouchableOpacity 
              key={s} 
              style={[styles.pipelineBtn, order.status === s && styles.activePipelineBtn]} 
              onPress={() => updateOrder(s)}
              disabled={updating}
            >
              <Text style={[styles.pipelineBtnText, order.status === s && styles.activePipelineBtnText]}>{s}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: DESIGN.white },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: DESIGN.softGray },
  headerTitle: { fontSize: 16, fontWeight: '800', letterSpacing: -0.5 },
  headerBtn: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center', backgroundColor: DESIGN.softGray },
  scroll: { padding: 20 },
  heroSection: { marginBottom: 25 },
  labelMicro: { fontSize: 10, fontWeight: '800', color: DESIGN.secondaryText, letterSpacing: 1, marginBottom: 8 },
  labelMicroCenter: { fontSize: 10, fontWeight: '800', color: DESIGN.secondaryText, letterSpacing: 1, textAlign: 'center', marginBottom: 15 },
  statusRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  statusTextLarge: { fontSize: 36, fontWeight: '900', letterSpacing: -1 },
  statusIndicator: { width: 10, height: 10, borderRadius: 5 },
  mainCard: { backgroundColor: DESIGN.white, borderRadius: 20, padding: 20, marginBottom: 20, borderWidth: 1, borderColor: DESIGN.border },
  inputGroup: { flexDirection: 'row', alignItems: 'center', backgroundColor: DESIGN.softGray, borderRadius: 15, paddingHorizontal: 15, marginBottom: 10 },
  inputIcon: { marginRight: 10 },
  field: { flex: 1, height: 50, fontSize: 14, fontWeight: '600', color: DESIGN.dark },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  itemMain: { flex: 1 },
  itemNameText: { fontSize: 15, fontWeight: '700', color: DESIGN.dark },
  itemQtyText: { fontSize: 12, color: DESIGN.secondaryText, marginTop: 2 },
  itemPriceText: { fontSize: 15, fontWeight: '800' },
  line: { height: 1, backgroundColor: DESIGN.border, marginVertical: 15 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totalLabel: { fontSize: 14, fontWeight: '600', color: DESIGN.secondaryText },
  totalValue: { fontSize: 24, fontWeight: '900', color: DESIGN.primary },
  pipelineBox: { flexDirection: 'row', backgroundColor: DESIGN.softGray, padding: 6, borderRadius: 20, marginBottom: 20 },
  pipelineBtn: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 15 },
  activePipelineBtn: { backgroundColor: DESIGN.dark, elevation: 5 },
  pipelineBtnText: { fontSize: 12, fontWeight: '800', color: DESIGN.secondaryText },
  activePipelineBtnText: { color: DESIGN.white }
});