import React, { useState, useCallback } from 'react';
import { 
  View, Text, StyleSheet, Image, ScrollView, TouchableOpacity, ActivityIndicator 
} from 'react-native';
import { supabase } from '../../supabaseConfig';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function ProfileScreen() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useFocusEffect(
    useCallback(() => { fetchProfile(); }, [])
  );

  async function fetchProfile() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        let { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
        if (data) setProfile(data);
      }
    } catch (e) { 
      console.log(e); 
    } finally { 
      setLoading(false); 
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.replace('/login'); 
  };

  const MenuItem = ({ title, icon, route, color = "#5A31F4" }: { title: string, icon: any, route: string, color?: string }) => (
    <TouchableOpacity style={styles.menuItem} onPress={() => router.push(route as any)}>
      <View style={styles.menuLeft}>
        <View style={[styles.iconBg, { backgroundColor: color === "#5A31F4" ? '#F0EBFB' : '#E3F2FD' }]}>
          <Ionicons name={icon} size={22} color={color} />
        </View>
        <Text style={styles.menuText}>{title}</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color="#ccc" />
    </TouchableOpacity>
  );

  if (loading) return <ActivityIndicator style={{ flex: 1 }} color="#5A31F4" />;

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.headerCard}>
        <Image 
          source={{ uri: profile?.avatar_url || 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png' }} 
          style={styles.profileImg} 
        />
        <Text style={styles.nameText}>{profile?.full_name || 'User'}</Text>
        <Text style={styles.subText}>{profile?.phone_number || 'No Phone Number'}</Text>
        
       
        {profile?.role === 'admin' && (
          <View style={styles.adminBadge}>
            <Text style={styles.adminBadgeText}>ADMIN ACCOUNT</Text>
          </View>
        )}
      </View>

      <View style={styles.menuBox}>
        
        {profile?.role === 'admin' && (
          <MenuItem 
            title="Admin Dashboard" 
            icon="speedometer-outline" 
            route="/admin-dashboard" 
            color="#0984e3" 
          />
        )}

        <MenuItem title="Personal Info" icon="person-outline" route="/personal-info" />
        <MenuItem title="My Address" icon="location-outline" route="/shipping-address" />
        <MenuItem title="Payments & History" icon="receipt-outline" route="/history" />
        <MenuItem title="Payment Methods" icon="card-outline" route="/payment-methods" />
        <MenuItem title="Settings" icon="settings-outline" route="/settings" />
        
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={22} color="#ff4757" />
          <Text style={styles.logoutText}>Log out</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f8ff', paddingHorizontal: 20 },
  headerCard: { alignItems: 'center', marginTop: 60, marginBottom: 30 },
  profileImg: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#f9f9f9', borderWidth: 1, borderColor: '#eee' },
  nameText: { fontSize: 20, fontWeight: 'bold', marginTop: 15, color: '#333' },
  subText: { fontSize: 14, color: '#888', marginTop: 5 },
  adminBadge: { backgroundColor: '#E3F2FD', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20, marginTop: 10 },
  adminBadgeText: { color: '#4309e3', fontSize: 10, fontWeight: '800' },
  menuBox: { marginTop: 10 },
  menuItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 15, borderBottomWidth: 0.5, borderBottomColor: '#f0f0f0' },
  menuLeft: { flexDirection: 'row', alignItems: 'center' },
  iconBg: { width: 40, height: 40, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  menuText: { fontSize: 16, marginLeft: 15, fontWeight: '500', color: '#333' },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', marginTop: 30, paddingVertical: 15, marginBottom: 50 },
  logoutText: { fontSize: 16, marginLeft: 15, color: '#ff4757', fontWeight: 'bold' }
});
