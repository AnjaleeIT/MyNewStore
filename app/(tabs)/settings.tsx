import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import React, { useState, useCallback, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Image, 
  ScrollView, 
  TouchableOpacity, 
  ActivityIndicator,
  Modal,
  FlatList,
  SafeAreaView,
  Alert,
  StatusBar 
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../../supabaseConfig'; 

const COLORS = {
  primary: '#5F1BE9',    // Brand Purple
  bg: '#F8FAFC',         // Premium Light Background
  card: '#FFFFFF',       // Pure White
  textMain: '#0F172A',   // Deep Slate Black
  textSec: '#94A3B8',    // Muted Grey
  border: '#F1F5F9'
};

export default function SettingsScreen() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false); 
  const router = useRouter();

  // 🔔 Notifications States
  const [modalVisible, setModalVisible] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // 🔔 Pop-up Detail Card States
  const [selectedNoti, setSelectedNoti] = useState<any>(null);
  const [detailModalVisible, setDetailModalVisible] = useState<boolean>(false);

  // 💡 CUSTOM LOGOUT WARNING POPUP STATE
  const [logoutModalVisible, setLogoutModalVisible] = useState<boolean>(false);

  useFocusEffect(
    useCallback(() => {
      fetchProfile();
      fetchInitialData();
    }, [])
  );

  //  Notifications Database 
  const fetchInitialData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;

      const userId = session.user.id;

      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data) {
        const filtered = data.filter((n: any) => n.user_id === null || n.user_id === userId);
        setNotifications(filtered);
        setUnreadCount(filtered.filter((n: any) => n.is_read === false).length);
      }
    } catch (err) {
      console.log("Error fetching initial notifications:", err);
    }
  };

  // 🔔 Real-time notifi Listener
  useEffect(() => {
    let channel: any;

    async function setupNotifications() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;

      await fetchInitialData();

      channel = supabase
        .channel('public:settings-live-notifications')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'notifications' },
          () => {
            fetchInitialData(); 
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
    }

    setupNotifications();

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, []);

  async function fetchProfile() {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        let { data } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();
        
        if (data) {
          setProfile({ ...data, email: session.user.email });
        }
      }
    } catch (e) {
      console.log("Error fetching profile:", e);
    } finally {
      setLoading(false);
    }
  }

  // 📸 Image Upload Logic (Expo SDK 54 ArrayBuffer)
  const pickAndUploadImage = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (permissionResult.granted === false) {
        Alert.alert("Permission Required", "You need to allow gallery access to upload a profile picture.");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: 'images',
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) return;

      setUploading(true);
      const pickedImageUri = result.assets[0].uri;

      const response = await fetch(pickedImageUri);
      const arrayBuffer = await response.arrayBuffer();

      const fileExt = pickedImageUri.split('.').pop() || 'jpg';
      const fileName = `${profile.id}-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, arrayBuffer, { 
          contentType: `image/${fileExt}`,
          upsert: true 
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', profile.id);

      if (updateError) throw updateError;

      setProfile((prev: any) => ({ ...prev, avatar_url: publicUrl }));
      Alert.alert("Success 🎉", "Profile picture updated successfully!");

    } catch (error: any) {
      console.error("Upload Error:", error);
      Alert.alert("Upload Error", "Could not upload image. Check bucket settings.");
    } finally {
      setUploading(false);
    }
  };

  const markAsRead = async (item: any) => {
    setSelectedNoti(item);
    setDetailModalVisible(true);

    if (item.is_read === false) {
      setNotifications((prev) =>
        prev.map((n) => (n.id === item.id ? { ...n, is_read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));

      await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', item.id);
    }
  };

  const clearAll = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      await supabase.from('notifications').delete().eq('user_id', session.user.id);
      await fetchInitialData();
    }
  };

  const handleLogout = () => {
    setLogoutModalVisible(true); 
  };

  const confirmLogout = async () => {
    try {
      setLogoutModalVisible(false); 
      setModalVisible(false);       // Notifications Modal 
      await supabase.auth.signOut(); 
      
      setTimeout(() => {
        router.replace('/login' as any);
      }, 300);
    } catch (error) {
      console.log("Error during logout:", error);
      Alert.alert("Error", "Could not log out. Please try again.");
    }
  };

  if (loading) return <ActivityIndicator style={{ flex: 1, justifyContent: 'center' }} color={COLORS.primary} />;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      {/* Premium Balanced Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={24} color={COLORS.textMain} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView style={styles.container} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        
        {/* Profile Card Section */}
        <View style={styles.profileCard}>
          <View style={styles.avatarWrapper}>
            <Image 
              source={{ uri: profile?.avatar_url || 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png' }} 
              style={styles.avatar} 
              resizeMode="cover" //  resizeMode moved directly to prop
            />
            <TouchableOpacity style={styles.cameraBadge} onPress={pickAndUploadImage} disabled={uploading} activeOpacity={0.8}>
              {uploading ? <ActivityIndicator size="small" color="#FFFFFF" /> : <Ionicons name="camera" size={15} color="#FFFFFF" />}
            </TouchableOpacity>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.nameText}>{profile?.full_name || 'User'}</Text>
            <Text style={styles.emailText}>{profile?.email || 'No email provided'}</Text>
          </View>
        </View>

        {/* CATEGORY 1: Account Information */}
        <Text style={styles.sectionHeader}>Account Information</Text>
        <View style={styles.menuGroupCard}>
          
          <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/personal-info' as any)}>
            <View style={styles.menuItemLeft}>
              <View style={styles.iconWrapper}><Ionicons name="person-outline" size={18} color={COLORS.primary} /></View>
              <Text style={styles.menuText}>Personal Info</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={COLORS.textSec} />
          </TouchableOpacity>
          
          <View style={styles.innerDivider} />

          <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/shipping-address' as any)}>
            <View style={styles.menuItemLeft}>
              <View style={styles.iconWrapper}><Ionicons name="location-outline" size={18} color={COLORS.primary} /></View>
              <Text style={styles.menuText}>Shipping Address</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={COLORS.textSec} />
          </TouchableOpacity>

          <View style={styles.innerDivider} />

          <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/payment-methods' as any)}>
            <View style={styles.menuItemLeft}>
              <View style={styles.iconWrapper}><Ionicons name="card-outline" size={18} color={COLORS.primary} /></View>
              <Text style={styles.menuText}>Payment Methods</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={COLORS.textSec} />
          </TouchableOpacity>
        </View>

        {/* CATEGORY 2: App Settings */}
        <Text style={[styles.sectionHeader, { marginTop: 24 }]}>App Settings</Text>
        <View style={styles.menuGroupCard}>
          
          <TouchableOpacity style={styles.menuItem} onPress={() => setModalVisible(true)}>
            <View style={styles.menuItemLeft}>
              <View style={styles.iconWrapper}><Ionicons name="notifications-outline" size={18} color={COLORS.primary} /></View>
              <Text style={styles.menuText}>Notifications</Text>
            </View>
            <View style={styles.rightRowInline}>
              {unreadCount > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{unreadCount}</Text>
                </View>
              )}
              <Ionicons name="chevron-forward" size={16} color={COLORS.textSec} />
            </View>
          </TouchableOpacity>
          
          <View style={styles.innerDivider} />

          <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/security' as any)}>
            <View style={styles.menuItemLeft}>
              <View style={styles.iconWrapper}><Ionicons name="shield-checkmark-outline" size={18} color={COLORS.primary} /></View>
              <Text style={styles.menuText}>Privacy & Security</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={COLORS.textSec} />
          </TouchableOpacity>

          <View style={styles.innerDivider} />

          <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/support' as any)}>
            <View style={styles.menuItemLeft}>
              <View style={styles.iconWrapper}><Ionicons name="help-circle-outline" size={18} color={COLORS.primary} /></View>
              <Text style={styles.menuText}>Help & Support</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={COLORS.textSec} />
          </TouchableOpacity>
        </View>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
          <Ionicons name="log-out-outline" size={18} color="#EF4444" />
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>

      </ScrollView>

      {/* 🔔 NOTIFICATION MAIN LIST MODAL */}
      <Modal
        animationType="slide"
        transparent={false}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <View style={styles.modalHeaderLeft}>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.modalCloseBtn}>
                <Ionicons name="close" size={22} color={COLORS.textMain} />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Notifications</Text>
            </View>
            {notifications.length > 0 && (
              <TouchableOpacity onPress={clearAll}>
                <Text style={styles.clearText}>Clear All</Text>
              </TouchableOpacity>
            )}
          </View>

          <FlatList
            data={notifications}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={() => (
              <View style={styles.emptyContainer}>
                <Ionicons name="notifications-off-outline" size={54} color={COLORS.textSec} />
                <Text style={styles.emptyTitle}>No notifications yet</Text>
                <Text style={styles.emptyDesc}>Real-world order updates will appear here.</Text>
              </View>
            )}
            renderItem={({ item }) => {
              const isItemRead = item.is_read === true;

              return (
                <TouchableOpacity 
                  style={[styles.notiCard, !isItemRead && styles.unreadCard]} 
                  onPress={() => markAsRead(item)} 
                  activeOpacity={0.9}
                >
                  <View style={[styles.notiIconBox, { backgroundColor: isItemRead ? '#F1F5F9' : '#F3E8FF' }]}>
                    <Ionicons name={item.icon || "mail-open-outline"} size={20} color={isItemRead ? '#94A3B8' : COLORS.primary} />
                  </View>
                  
                  <View style={styles.notiContent}>
                    <View style={styles.titleRow}>
                      <Text style={[styles.notiTitle, isItemRead && styles.readNotiTitle]} numberOfLines={1}>{item.title}</Text>
                      {!isItemRead && <View style={styles.unreadDot} />}
                    </View>
                    <Text style={[styles.notiDesc, isItemRead && styles.readNotiDesc]} numberOfLines={2}>{item.message}</Text>
                    <Text style={styles.notiTime}>
                      {new Date(item.created_at).toLocaleDateString()} at {new Date(item.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            }}
          />
        </SafeAreaView>

        {/* 🔔 DETAILED POP-UP MODAL PANEL */}
        <Modal
          animationType="fade"
          transparent={true}
          visible={detailModalVisible}
          onRequestClose={() => setDetailModalVisible(false)}
        >
          <View style={styles.popupOverlay}>
            <View style={styles.popupCard}>
              <View style={styles.popupHeader}>
                <View style={styles.popupIconCircle}>
                  <Ionicons name="megaphone" size={20} color={COLORS.primary} />
                </View>
                <Text style={styles.popupTitle}>{selectedNoti?.title}</Text>
              </View>
              <View style={styles.popupDivider} />
              <ScrollView style={{ maxHeight: 180 }} showsVerticalScrollIndicator={false}>
                <Text style={styles.popupMessage}>{selectedNoti?.message}</Text>
              </ScrollView>
              <TouchableOpacity 
                style={styles.popupButton} 
                onPress={() => setDetailModalVisible(false)}
                activeOpacity={0.9}
              >
                <Text style={styles.popupButtonText}>Got it</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </Modal>

      {/* ⚠️ CUSTOM LOGOUT WARNING POP-UP WINDOW MODAL */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={logoutModalVisible}
        onRequestClose={() => setLogoutModalVisible(false)}
      >
        <View style={styles.popupOverlay}>
          <View style={styles.popupCard}>
            <View style={styles.popupHeader}>
              <View style={[styles.popupIconCircle, { backgroundColor: '#FEF2F2' }]}>
                <Ionicons name="warning" size={22} color="#EF4444" />
              </View>
              <Text style={styles.popupTitle}>Log Out</Text>
            </View>
            <View style={styles.popupDivider} />
            
            <Text style={[styles.popupMessage, { color: '#64748B', textAlign: 'center', marginBottom: 10 }]}>
              Are you sure you want to log out from LeeStyle Store? You will need to sign in again to browse your dashboard.
            </Text>

            <View style={styles.popupBtnRow}>
              <TouchableOpacity 
                style={styles.popupCancelBtn} 
                onPress={() => setLogoutModalVisible(false)}
                activeOpacity={0.7}
              >
                <Text style={styles.popupCancelBtnText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.popupConfirmBtn} 
                onPress={confirmLogout}
                activeOpacity={0.8}
              >
                <Text style={styles.popupConfirmBtnText}>Log Out</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.bg },
  container: { flex: 1, padding: 16 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, backgroundColor: COLORS.card, borderBottomWidth: 1, borderColor: COLORS.border },
  backBtn: { width: 38, height: 38, borderRadius: 12, backgroundColor: '#F8FAFC', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#E2E8F0' },
  headerTitle: { fontSize: 18, fontWeight: '800', color: COLORS.textMain },
  
  profileCard: { flexDirection: 'row', alignItems: 'center', gap: 16, backgroundColor: COLORS.card, padding: 16, borderRadius: 24, borderWidth: 1, borderColor: COLORS.border, marginBottom: 20 },
  avatarWrapper: { position: 'relative' },
  avatar: { width: 58, height: 58, borderRadius: 18, backgroundColor: '#E2E8F0', borderWidth: 2, borderColor: '#F3E8FF' },
  cameraBadge: { position: 'absolute', bottom: -4, right: -4, backgroundColor: COLORS.primary, width: 24, height: 24, borderRadius: 12, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#FFFFFF', elevation: 3 },
  profileInfo: { flex: 1 },
  nameText: { fontSize: 16, fontWeight: '800', color: COLORS.textMain },
  emailText: { fontSize: 12, color: COLORS.textSec, fontWeight: '600', marginTop: 2 },
  
  sectionHeader: { fontSize: 13, fontWeight: '800', color: COLORS.textSec, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10, marginLeft: 4 },
  menuGroupCard: { backgroundColor: COLORS.card, borderRadius: 24, borderWidth: 1, borderColor: COLORS.border, overflow: 'hidden', marginBottom: 4 },
  menuItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 16 },
  menuItemLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconWrapper: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#F3E8FF', justifyContent: 'center', alignItems: 'center' },
  menuText: { fontSize: 14, fontWeight: '700', color: COLORS.textMain },
  rightRowInline: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  badge: { backgroundColor: COLORS.primary, width: 18, height: 18, borderRadius: 9, justifyContent: 'center', alignItems: 'center' },
  badgeText: { color: '#fff', fontSize: 10, fontWeight: '800' },
  
  innerDivider: { height: 1, backgroundColor: '#F1F5F9', marginLeft: 60 },
  
  logoutBtn: { flexDirection: 'row', height: 52, borderRadius: 18, backgroundColor: '#FEF2F2', justifyContent: 'center', alignItems: 'center', gap: 8, marginTop: 28, borderWidth: 1, borderColor: '#FEE2E2' },
  logoutText: { color: '#EF4444', fontSize: 14, fontWeight: '800' },

  modalContainer: { flex: 1, backgroundColor: COLORS.bg },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, alignItems: 'center', backgroundColor: COLORS.card, borderBottomWidth: 1, borderColor: COLORS.border },
  modalHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  modalCloseBtn: { width: 38, height: 38, borderRadius: 12, backgroundColor: '#F8FAFC', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#E2E8F0' },
  modalTitle: { fontSize: 18, fontWeight: '800', color: COLORS.textMain },
  clearText: { color: '#EF4444', fontWeight: '700', fontSize: 13 },
  
  // 💡 FIXED: shadow* styles replaced cleanly with Expo SDK 54 custom box shadows
  notiCard: { flexDirection: 'row', padding: 14, backgroundColor: COLORS.card, borderRadius: 20, marginBottom: 12, borderWidth: 1, borderColor: COLORS.border, boxShadow: '0px 2px 6px rgba(0,0,0,0.02)' },
  unreadCard: { borderColor: '#EAE6FF', boxShadow: '0px 4px 12px rgba(95,27,233,0.04)' },
  notiIconBox: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  notiContent: { flex: 1, marginLeft: 12 },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  notiTitle: { fontSize: 14, fontWeight: '700', color: COLORS.textMain, flex: 1, marginRight: 8 },
  readNotiTitle: { color: '#64748B', fontWeight: '500' },
  unreadDot: { width: 7, height: 7, borderRadius: 3.5, backgroundColor: COLORS.primary },
  notiDesc: { fontSize: 13, color: '#334155', marginTop: 4, lineHeight: 18, fontWeight: '500' },
  readNotiDesc: { color: '#94A3B8' },
  notiTime: { fontSize: 11, color: '#CBD5E1', marginTop: 8, fontWeight: '600' },
  
  emptyContainer: { alignItems: 'center', justifyContent: 'center', marginTop: 140, paddingHorizontal: 40, gap: 8 },
  emptyTitle: { fontSize: 16, fontWeight: '800', color: COLORS.textMain },
  emptyDesc: { fontSize: 13, color: COLORS.textSec, textAlign: 'center', lineHeight: 18 },

  popupOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.4)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  // 💡 FIXED: shadow* styles optimized via modern boxShadow attribute
  popupCard: { backgroundColor: '#FFFFFF', width: '100%', borderRadius: 24, padding: 20, borderWidth: 1, borderColor: COLORS.border, boxShadow: '0px 10px 25px rgba(0,0,0,0.06)' },
  popupHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  popupIconCircle: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#F3E8FF', justifyContent: 'center', alignItems: 'center' },
  popupTitle: { fontSize: 16, fontWeight: '800', color: COLORS.textMain, flex: 1 },
  popupDivider: { height: 1, backgroundColor: COLORS.border, marginVertical: 14 },
  popupMessage: { fontSize: 14, color: '#334155', lineHeight: 22, fontWeight: '500' },
  popupButton: { backgroundColor: COLORS.primary, height: 46, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginTop: 18 },
  popupButtonText: { color: '#FFFFFF', fontSize: 14, fontWeight: '800' },

  popupBtnRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 12, marginTop: 20 },
  popupCancelBtn: { flex: 1, backgroundColor: '#F1F5F9', height: 46, borderRadius: 14, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#E2E8F0' },
  popupCancelBtnText: { color: '#64748B', fontSize: 14, fontWeight: '700' },
  popupConfirmBtn: { flex: 1, backgroundColor: '#EF4444', height: 46, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  popupConfirmBtnText: { color: '#FFFFFF', fontSize: 14, fontWeight: '800' }
});
