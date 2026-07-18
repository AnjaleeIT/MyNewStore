import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../supabaseConfig';

export default function OrderTracking() {
  const { id } = useLocalSearchParams();
  const [order, setOrder] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    fetchOrder();
  }, [id]);

  const fetchOrder = async () => {
    const { data } = await supabase.from('orders').select('*').eq('id', Number(id)).single();
    if (data) setOrder(data);
  };

  const getStatusIndex = (status: string) => {
    if (status === 'Pending') return 1;
    if (status === 'Shipped') return 2;
    if (status === 'Delivered') return 3;
    return 0;
  };

  if (!order) return <ActivityIndicator style={{ flex: 1 }} />;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}><Ionicons name="chevron-back" size={24} /></TouchableOpacity>
        <Text style={styles.title}>Track Order #{order.id}</Text>
      </View>

      <View style={styles.statusContainer}>
        {['Pending', 'Shipped', 'Delivered'].map((status, index) => (
          <View key={status} style={styles.step}>
            <View style={[styles.dot, getStatusIndex(order.status) >= index + 1 ? styles.activeDot : {}]} />
            <Text style={getStatusIndex(order.status) >= index + 1 ? styles.activeText : styles.inactiveText}>{status}</Text>
          </View>
        ))}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 20 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 40 },
  title: { fontSize: 20, fontWeight: '800', marginLeft: 20 },
  statusContainer: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20 },
  step: { alignItems: 'center' },
  dot: { width: 20, height: 20, borderRadius: 10, backgroundColor: '#ccc', marginBottom: 10 },
  activeDot: { backgroundColor: '#5209e3' },
  activeText: { fontWeight: '700', color: '#5209e3' },
  inactiveText: { color: '#ccc' }
});