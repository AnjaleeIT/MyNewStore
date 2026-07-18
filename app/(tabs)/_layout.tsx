import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { useCart } from '../context/CartContext'; 
import { useEffect, useState } from 'react';
import { supabase } from '../../supabaseConfig';

export default function TabLayout() {
  const { cart } = useCart();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    
    const checkUserRole = async () => {
      try {
        // getUser වෙනුවට getSession භාවිතා කිරීමෙන් "Lock broken" error එක වළක්වා ගත හැක
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user && isMounted) {
          const { data, error } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', session.user.id)
            .single();
          
          if (!error && data?.role === 'admin') {
            setIsAdmin(true);
          }
        }
      } catch (err) {
        console.error("Role check failed:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    checkUserRole();
    return () => { isMounted = false; };
  }, []);

  // දත්ත ලැබෙන තෙක් මුකුත් නොපෙන්වීම (Refresh වීම සහ Error වළක්වා ගැනීමට)
  if (loading) return null;

  return (
    <Tabs screenOptions={{ 
      headerShown: false,
      tabBarActiveTintColor: '#5209e3', 
      tabBarInactiveTintColor: '#95a5a6',
      tabBarShowLabel: true,
      tabBarLabelStyle: { fontSize: 10, fontWeight: '700', marginBottom: 5 },
      tabBarStyle: { 
        height: 65, 
        backgroundColor: '#ffffff', 
        borderTopWidth: 1, 
        borderTopColor: '#f1f2f6',
        ...Platform.select({
          ios: { shadowColor: '#000', shadowOffset: { width: 0, height: -2 }, shadowOpacity: 0.05, shadowRadius: 3 },
          android: { elevation: 8 }
        })
      }
    }}>
      
      {/* 1. Home Screen */}
      <Tabs.Screen 
        name="index" 
        options={{ 
          title: 'Home', 
          tabBarIcon: ({ color, focused }) => <Ionicons name={focused ? "home" : "home-outline"} size={22} color={color} /> 
        }} 
      />

      {/* 2. Explore Screen */}
      <Tabs.Screen 
        name="explore" 
        options={{ 
          title: 'Explore', 
          tabBarIcon: ({ color, focused }) => <Ionicons name={focused ? "compass" : "compass-outline"} size={22} color={color} /> 
        }} 
      />
      
      {/* 3. Admin Tab - href එක මෙලෙස සැකසීමෙන් පේජ් එක මාරු වීම නිවැරදි වේ */}
      <Tabs.Screen 
        name="admin-dashboard" 
        options={{ 
          title: 'Admin',
          href: isAdmin ? '/admin-dashboard' : null, 
          tabBarIcon: ({ color, focused }) => <Ionicons name={focused ? "shield" : "shield-outline"} size={22} color={color} /> 
        }} 
      />

      {/* 4. Cart Screen */}
      <Tabs.Screen 
        name="cart" 
        options={{ 
          title: 'Cart', 
          tabBarIcon: ({ color, focused }) => (
            <View style={{ width: 24, height: 24 }}>
              <Ionicons name={focused ? "cart" : "cart-outline"} size={24} color={color} />
              {cart.length > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{cart.length}</Text>
                </View>
              )}
            </View>
          )
        }} 
      />
      
      {/* 5. Profile Screen */}
      <Tabs.Screen 
        name="profile" 
        options={{ 
          title: 'Profile', 
          tabBarIcon: ({ color, focused }) => <Ionicons name={focused ? "person" : "person-outline"} size={22} color={color} /> 
        }} 
      />

      {/* අමතර පේජ් Tab bar එකෙන් සැඟවීම */}
      <Tabs.Screen name="settings" options={{ href: null }} />
      <Tabs.Screen name="personal-info" options={{ href: null }} />
      <Tabs.Screen name="shipping-address" options={{ href: null }} />
      <Tabs.Screen name="payment-methods" options={{ href: null }} />
      <Tabs.Screen name="notifications-settings" options={{ href: null }} />
      <Tabs.Screen name="register" options={{ href: null }} />
      
    </Tabs>
  );
}

const styles = StyleSheet.create({
  badge: { 
    position: 'absolute', 
    right: -6, 
    top: -3, 
    backgroundColor: '#5209e3', 
    borderRadius: 9, 
    minWidth: 16, 
    height: 16, 
    justifyContent: 'center', 
    alignItems: 'center', 
    borderWidth: 1.5, 
    borderColor: '#ffffff',
    zIndex: 100, 
  },
  badgeText: { 
    color: '#ffffff', 
    fontSize: 8, 
    fontWeight: '900',
    textAlign: 'center'
  }
});