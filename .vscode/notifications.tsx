import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { FlatList, SafeAreaView, StyleSheet, Text, TouchableOpacity, View, StatusBar } from 'react-native';

// Mock Data - 'read' කියන property එක අලුතින් එකතු කළා
const INITIAL_NOTIFICATIONS = [
  { id: '1', title: 'Order Shipped!', desc: 'Your AirPods Gen 2 have been shipped to Udugampola.', time: '2h ago', icon: 'bus', read: false },
  { id: '2', title: 'Big Sale Live!', desc: '30% OFF on all Smart Watches for HNDIT students.', time: '5h ago', icon: 'gift', read: false },
  { id: '3', title: 'Payment Success', desc: 'Payment for your last order was successful.', time: '1d ago', icon: 'checkmark-circle', read: true },
];

export default function Notifications() {
  const router = useRouter();
  const [notifications, setNotifications] = useState(INITIAL_NOTIFICATIONS);

  // සියලුම නොටිෆිකේෂන් මකා දැමීම
  const clearAll = () => setNotifications([]);

  // පණිවිඩයක් කියවූ බව සටහන් කිරීම
  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={24} color="black" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Notifications</Text>
        </View>
        {notifications.length > 0 && (
          <TouchableOpacity onPress={clearAll}>
            <Text style={styles.clearText}>Clear All</Text>
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconBox}>
              <Ionicons name="notifications-off-outline" size={60} color="#ccc" />
            </View>
            <Text style={styles.emptyTitle}>No notifications yet</Text>
            <Text style={styles.emptyDesc}>We'll let you know when something important happens.</Text>
          </View>
        )}
        renderItem={({ item }) => (
          <TouchableOpacity 
            style={[styles.notiCard, !item.read && styles.unreadCard]} 
            onPress={() => markAsRead(item.id)}
          >
            <View style={[styles.iconBox, { backgroundColor: item.read ? '#F1F3F6' : '#E3EFFB' }]}>
              <Ionicons name={item.icon as any} size={22} color={item.read ? '#8E8E93' : '#007AFF'} />
            </View>
            
            <View style={styles.content}>
              <View style={styles.titleRow}>
                <Text style={styles.notiTitle}>{item.title}</Text>
                {!item.read && <View style={styles.unreadDot} />}
              </View>
              <Text style={styles.notiDesc} numberOfLines={2}>{item.desc}</Text>
              <Text style={styles.notiTime}>{item.time}</Text>
            </View>
          </TouchableOpacity>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FD' },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    paddingHorizontal: 20, 
    paddingVertical: 15, 
    alignItems: 'center', 
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0'
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center' },
  headerTitle: { fontSize: 20, fontWeight: '800', marginLeft: 15, color: '#1A1A1A' },
  backBtn: { width: 40, height: 40, backgroundColor: '#F5F5F5', borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  clearText: { color: '#FF3B30', fontWeight: '700', fontSize: 14 },
  listContent: { paddingBottom: 30 },
  notiCard: { 
    flexDirection: 'row', 
    padding: 16, 
    backgroundColor: '#fff', 
    marginHorizontal: 15, 
    marginTop: 12, 
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#F0F0F0'
  },
  unreadCard: { 
    backgroundColor: '#FFFFFF',
    borderColor: '#E3EFFB',
    elevation: 3,
    shadowColor: '#007AFF',
    shadowOpacity: 0.05,
    shadowRadius: 10,
  },
  iconBox: { width: 52, height: 52, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  content: { flex: 1, marginLeft: 15 },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  notiTitle: { fontSize: 15, fontWeight: '700', color: '#1A1A1A' },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#007AFF' },
  notiDesc: { fontSize: 14, color: '#666', marginTop: 4, lineHeight: 20 },
  notiTime: { fontSize: 12, color: '#AAA', marginTop: 10, fontWeight: '500' },
  // Empty State Styles
  emptyContainer: { alignItems: 'center', justifyContent: 'center', marginTop: 100, paddingHorizontal: 40 },
  emptyIconBox: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  emptyTitle: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  emptyDesc: { fontSize: 14, color: '#888', textAlign: 'center', marginTop: 10, lineHeight: 20 }
});