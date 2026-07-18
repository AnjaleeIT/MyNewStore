import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, SafeAreaView, 
  StatusBar, FlatList, ActivityIndicator, Alert, RefreshControl, Dimensions 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { supabase } from '../supabaseConfig'; 

const { width } = Dimensions.get('window');

interface SupportTicket {
  id: number;
  user_id: string | null;
  email: string;
  subject: string;
  message: string;
  status: string;
  created_at: string;
}

export default function AdminTicketsScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [filter, setFilter] = useState<'all' | 'pending' | 'resolved'>('pending');

  // 📥 Fetch Tickets from Database
  const fetchTickets = async () => {
    try {
      let query = supabase
        .from('support_tickets')
        .select('*')
        .order('created_at', { ascending: false });

      if (filter !== 'all') {
        query = query.eq('status', filter);
      }

      const { data, error } = await query;

      if (error) throw error;
      setTickets(data || []);
    } catch (error: any) {
      Alert.alert("Sync Error", error.message || "Could not fetch support channels.");
      console.error(error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // 🔄 Filter එක වෙනස් වන විට ඩේටා රී-ෆෙච් කිරීම
  useEffect(() => {
    fetchTickets();
  }, [filter]);

  // ⚡ Real-time Subscription (එක පාරක් පමණක් ක්‍රියාත්මක වේ - Memory leaks වැළැක්වීමට)
  useEffect(() => {
    const ticketChannel = supabase
      .channel('realtime-admin-tickets')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'support_tickets' }, () => {
        fetchTickets(); // ඩේටාබේස් එකේ ඕනෑම වෙනසකදී ලයිව් අප්ඩේට් වේ
      })
      .subscribe();

    return () => {
      supabase.removeChannel(ticketChannel);
    };
  }, [filter]); // Filter එක වෙනස් වෙද්දී නිවැරදි Scope එක තබා ගැනීමට

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchTickets();
  }, [filter]);

  // 🛠️ Update Ticket Status (Fix: Local State Integration)
  const handleResolveTicket = async (id: number, currentStatus: string) => {
    const nextStatus = currentStatus === 'pending' ? 'resolved' : 'pending';
    
    try {
      // 1. Supabase Update
      const { error } = await supabase
        .from('support_tickets')
        .update({ status: nextStatus })
        .eq('id', id);

      if (error) throw error;

      // 2. 🔥 Local State එක සැනින් අප්ඩේට් කිරීම (බටන් එක වැඩ කරන්න ප්‍රධානම හේතුව)
      setTickets((prevTickets) =>
        prevTickets.map((ticket) =>
          ticket.id === id ? { ...ticket, status: nextStatus } : ticket
        ).filter((ticket) => filter === 'all' || ticket.status === filter) // ෆිල්ටර් එකට නොගැලපේ නම් ලිස්ට් එකෙන් අයින් කරයි
      );

      Alert.alert(
        "Status Updated", 
        `Ticket pipeline marked as ${nextStatus.toUpperCase()} successfully.`
      );
    } catch (error: any) {
      Alert.alert("Update Failed", error.message);
    }
  };

  // Format timestamp safely
  const formatTicketDate = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const renderTicketCard = ({ item }: { item: SupportTicket }) => (
    <View style={styles.ticketCard}>
      <View style={styles.cardHeader}>
        <View style={styles.metaWrap}>
          <Text style={styles.userEmail} numberOfLines={1}>{item.email}</Text>
          <Text style={styles.timestamp}>{formatTicketDate(item.created_at)}</Text>
        </View>
        <View style={[
          styles.statusBadge, 
          { backgroundColor: item.status === 'pending' ? '#FFF9E6' : '#E8F5E9' }
        ]}>
          <Text style={[
            styles.statusText, 
            { color: item.status === 'pending' ? '#F59E0B' : '#4CAF50' }
          ]}>
            {item.status.toUpperCase()}
          </Text>
        </View>
      </View>

      <Text style={styles.ticketSubject}>{item.subject}</Text>
      <Text style={styles.ticketMessage}>{item.message}</Text>

      <View style={styles.cardActions}>
        <TouchableOpacity 
          style={[
            styles.actionBtn, 
            { backgroundColor: item.status === 'pending' ? '#5A31F4' : '#64748B' }
          ]}
          onPress={() => handleResolveTicket(item.id, item.status)}
          activeOpacity={0.8}
        >
          <Ionicons 
            name={item.status === 'pending' ? "checkmark-circle-outline" : "arrow-undo-outline"} 
            size={16} 
            color="#FFF" 
          />
          <Text style={styles.actionBtnText}>
            {item.status === 'pending' ? "Mark as Resolved" : "Reopen Ticket"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color="#1E293B" />
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>Support Desk</Text>
          <Text style={styles.headerSub}>Client Communications Center</Text>
        </View>
      </View>

      {/* Segmented Filter Control */}
      <View style={styles.filterContainer}>
        {(['pending', 'resolved', 'all'] as const).map((type) => (
          <TouchableOpacity
            key={type}
            style={[styles.filterTab, filter === type && styles.activeFilterTab]}
            onPress={() => setFilter(type)}
            activeOpacity={0.7}
          >
            <Text style={[styles.filterTabText, filter === type && styles.activeFilterTabText]}>
              {type.toUpperCase()}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Tickets List View */}
      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color="#5A31F4" />
          <Text style={styles.loadingText}>Syncing Ticket Pipelines...</Text>
        </View>
      ) : (
        <FlatList
          data={tickets}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderTicketCard}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#5A31F4" />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="mail-open-outline" size={48} color="#CBD5E1" />
              <Text style={styles.emptyText}>No tickets found in this channel.</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { paddingHorizontal: 24, paddingVertical: 20, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#F1F5F9', flexDirection: 'row', alignItems: 'center' },
  backBtn: { width: 40, height: 40, backgroundColor: '#F8FAFC', borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 15, borderWidth: 1, borderColor: '#E2E8F0' },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#0F172A', letterSpacing: -0.5 },
  headerSub: { fontSize: 11, color: '#64748B', fontWeight: '500', marginTop: 1 },
  
  filterContainer: { flexDirection: 'row', padding: 4, backgroundColor: '#E2E8F0', borderRadius: 14, marginHorizontal: 20, marginTop: 16, marginBottom: 8 },
  filterTab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10 },
  activeFilterTab: { backgroundColor: '#FFFFFF', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 },
  filterTabText: { fontSize: 11, fontWeight: '700', color: '#64748B' },
  activeFilterTabText: { color: '#0F172A' },

  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 12, fontSize: 12, color: '#64748B', fontWeight: '600' },
  
  listContent: { paddingHorizontal: 20, paddingBottom: 30, paddingTop: 8 },
  ticketCard: { backgroundColor: '#FFFFFF', borderRadius: 20, padding: 18, marginBottom: 12, borderWidth: 1, borderColor: '#F1F5F9', shadowColor: '#0F172A', shadowOpacity: 0.01, shadowRadius: 10, elevation: 1 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  metaWrap: { flex: 0.75 },
  userEmail: { fontSize: 14, fontWeight: '700', color: '#0F172A' },
  timestamp: { fontSize: 11, color: '#94A3B8', marginTop: 2, fontWeight: '500' },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  statusText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.3 },
  
  ticketSubject: { fontSize: 15, fontWeight: '800', color: '#1E293B', marginTop: 14 },
  ticketMessage: { fontSize: 13, color: '#475569', marginTop: 6, lineHeight: 19 },
  
  cardActions: { borderTopWidth: 1, borderTopColor: '#F1F5F9', marginTop: 16, paddingTop: 14, flexDirection: 'row', justifyContent: 'flex-end' },
  actionBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, gap: 6 },
  actionBtnText: { color: '#FFF', fontSize: 12, fontWeight: '700' },
  
  emptyContainer: { alignItems: 'center', justifyContent: 'center', marginTop: 80, gap: 10 },
  emptyText: { color: '#94A3B8', fontSize: 13, fontWeight: '600' }
});