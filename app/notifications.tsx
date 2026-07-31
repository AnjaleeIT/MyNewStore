import React, { useEffect, useState } from 'react';
import { 
  View, Text, FlatList, StyleSheet, SafeAreaView, 
  StatusBar, TouchableOpacity, ActivityIndicator, RefreshControl, Modal, Dimensions,
  ScrollView, Platform 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { supabase } from '../supabaseConfig';

const { height } = Dimensions.get('window');

const COLORS = {
  primary: '#06B6D4',     
  primaryDark: '#0891B2',
  dark: '#0F172A',        
  muted: '#64748B',       
  light: '#F8FAFC',       
  white: '#FFFFFF',
  border: '#F1F5F9',
  accent: '#FFB020'       
};

export default function UserNotification() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const [selectedNoti, setSelectedNoti] = useState<any>(null);
  const [modalVisible, setModalVisible] = useState<boolean>(false);

  useEffect(() => {
    let channel: any;

    const setupNotifications = async () => {
      await fetchNotifications();

      try {
        const { data: { session } } = await supabase.auth.getSession();
        const currentUserId = session?.user?.id;

        channel = supabase
          .channel('public:notifications')
          .on(
            'postgres_changes',
            { event: 'INSERT', schema: 'public', table: 'notifications' },
            (payload) => {
              if (payload.new.user_id === null || payload.new.user_id === currentUserId) {
                setNotifications((prev) => [payload.new, ...prev]);
              }
            }
          );

        if (session?.access_token) {
          channel.subscribe(async (status: string) => {
            if (status === 'SUBSCRIBED') {
              await channel.track({ user_token: session.access_token });
            }
          });
        } else {
          channel.subscribe();
        }

      } catch (err) {
        console.error("Realtime setup error:", err);
      }
    };

    setupNotifications();

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, []);

  const fetchNotifications = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const currentUserId = session?.user?.id;

      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data) {
        const filteredData = data.filter(item => {
          return item.user_id === null || item.user_id === currentUserId;
        });
        
        setNotifications(filteredData);
      }
    } catch (error: any) {
      console.error("Fetch Error:", error.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchNotifications();
  };

  const handleOpenNoti = (item: any) => {
    setSelectedNoti(item);
    setModalVisible(true);
  };

  const formatTime = (isoString: string) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={22} color={COLORS.dark} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
        <View style={styles.headerIconBox}>
         
          <Ionicons name="notifications-outline" size={19} color={COLORS.primary} />
        </View>
      </View>

      {/* Main Content */}
      {loading ? (
        <View style={styles.centerBox}>
          <ActivityIndicator size="small" color={COLORS.primary} />
          <Text style={styles.loadingText}>Syncing updates...</Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} colors={[COLORS.primary]} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconCircle}>
                <Ionicons name="mail-open-outline" size={40} color={COLORS.muted} />
              </View>
              <Text style={styles.emptyTextTitle}>All Caught Up!</Text>
              <Text style={styles.emptyTextSub}>When admin deploys system updates or shipping alerts, they will appear here instantly.</Text>
            </View>
          }
          renderItem={({ item }) => (
            <TouchableOpacity 
              style={styles.card} 
              activeOpacity={0.9} 
              onPress={() => handleOpenNoti(item)}
            >
              <View style={styles.cardIndicator} />
              <View style={styles.cardBody}>
                <View style={styles.cardHeader}>
                  <View style={styles.iconContainer}>
                    <Ionicons name="chatbox-ellipses-outline" size={18} color={COLORS.primary} />
                  </View>
                  <View style={styles.textWrap}>
                    <Text style={styles.title} numberOfLines={1}>{item.title}</Text>
                    <Text style={styles.timestamp}>{formatTime(item.created_at)}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color="#CBD5E1" />
                </View>
                <Text style={styles.message} numberOfLines={2}>{item.message}</Text>
              </View>
            </TouchableOpacity>
          )}
        />
      )}

      {/* Pop-up Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity 
            style={styles.modalDismissArea} 
            activeOpacity={1} 
            onPress={() => setModalVisible(false)} 
          />
          <View style={styles.modalContent}>
            <View style={styles.modalHandle} />
            
            <View style={styles.modalHeaderRow}>
              <View style={styles.modalBellCircle}>
                <Ionicons name="megaphone" size={22} color={COLORS.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalMainTitle}>{selectedNoti?.title}</Text>
                <Text style={styles.modalTimeStr}>{formatTime(selectedNoti?.created_at)}</Text>
              </View>
            </View>

            <View style={styles.modalDivider} />

            <ScrollView showsVerticalScrollIndicator={false} style={styles.modalBodyScroll}>
              <Text style={styles.modalMessageText}>{selectedNoti?.message}</Text>
            </ScrollView>

            <TouchableOpacity 
              style={styles.closeButton} 
              onPress={() => setModalVisible(false)}
              activeOpacity={0.8}
            >
              <Text style={styles.closeButtonText}>Dismiss Message</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.light },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingHorizontal: 20, 
    paddingVertical: 16, 
    backgroundColor: COLORS.white, 
    borderBottomWidth: 1, 
    borderBottomColor: COLORS.border,
    elevation: 2
  },
  backBtn: { width: 40, height: 40, borderRadius: 14, backgroundColor: COLORS.light, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: COLORS.border },
  headerTitle: { fontSize: 19, fontWeight: '800', color: COLORS.dark, letterSpacing: -0.5 },
  headerIconBox: { width: 40, height: 40, borderRadius: 14, backgroundColor: '#06B6D40C', justifyContent: 'center', alignItems: 'center' },
  centerBox: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.light },
  loadingText: { marginTop: 12, fontSize: 13, color: COLORS.muted, fontWeight: '600' },
  listContainer: { padding: 16, paddingBottom: 40 },
  card: { 
    flexDirection: 'row',
    backgroundColor: COLORS.white, 
    borderRadius: 20, 
    marginBottom: 14, 
    borderWidth: 1, 
    borderColor: COLORS.border, 
    overflow: 'hidden',
    elevation: 1 
  },
  cardIndicator: { width: 5, backgroundColor: COLORS.primary },
  cardBody: { flex: 1, padding: 16 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  iconContainer: { width: 34, height: 34, borderRadius: 10, backgroundColor: '#06B6D40A', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  textWrap: { flex: 1 },
  title: { fontSize: 15, fontWeight: '800', color: COLORS.dark },
  timestamp: { fontSize: 11, color: COLORS.muted, marginTop: 2, fontWeight: '500' },
  message: { fontSize: 13, color: COLORS.muted, lineHeight: 19, paddingLeft: 2 },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', marginTop: height * 0.15, paddingHorizontal: 32 },
  emptyIconCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: COLORS.white, justifyContent: 'center', alignItems: 'center', marginBottom: 20, borderWidth: 1, borderColor: COLORS.border },
  emptyTextTitle: { color: COLORS.dark, fontSize: 18, fontWeight: '800', marginBottom: 8 },
  emptyTextSub: { color: COLORS.muted, fontSize: 13, textAlign: 'center', lineHeight: 20, fontWeight: '500' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.45)', justifyContent: 'flex-end' },
  modalDismissArea: { flex: 1 },
  modalContent: { 
    backgroundColor: COLORS.white, 
    borderTopLeftRadius: 32, 
    borderTopRightRadius: 32, 
    paddingHorizontal: 24, 
    paddingTop: 12, 
    paddingBottom: Platform.OS === 'ios' ? 34 : 24,
    maxHeight: height * 0.75,
    elevation: 10
  },
  modalHandle: { width: 40, height: 5, borderRadius: 2.5, backgroundColor: '#E2E8F0', alignSelf: 'center', marginBottom: 20 },
  modalHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 16 },
  modalBellCircle: { width: 48, height: 48, borderRadius: 16, backgroundColor: '#06B6D412', justifyContent: 'center', alignItems: 'center' },
  modalMainTitle: { fontSize: 18, fontWeight: '900', color: COLORS.dark },
  modalTimeStr: { fontSize: 12, color: COLORS.muted, marginTop: 3, fontWeight: '600' },
  modalDivider: { height: 1, backgroundColor: COLORS.border, marginBottom: 18 },
  modalBodyScroll: { marginBottom: 24 },
  modalMessageText: { fontSize: 14, color: '#475569', lineHeight: 23, fontWeight: '500' },
  closeButton: { 
    backgroundColor: COLORS.dark, 
    paddingVertical: 16, 
    borderRadius: 18, 
    alignItems: 'center',
  },
  closeButtonText: { color: COLORS.white, fontSize: 14, fontWeight: '800' }
});
