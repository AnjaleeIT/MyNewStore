import React, { useState, useEffect, useRef } from 'react';
import { 
  View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, 
  SafeAreaView, ActivityIndicator, StatusBar, KeyboardAvoidingView, Platform,
  Animated, StyleProp, ViewStyle 
} from 'react-native';
import { supabase } from '../supabaseConfig';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

export default function LoginScreen() {
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 800, useNativeDriver: true })
    ]).start();
  }, []);

  const handleLogin = async () => {
    if (!fullName || !password) {
      Alert.alert("Error", "Please enter both Username and Password.");
      return;
    }
    setLoading(true);
    try {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('email, role')
        .eq('full_name', fullName.trim())
        .single();

      if (profileError || !profile) {
        throw new Error("User not found in database.");
      }

      const { error } = await supabase.auth.signInWithPassword({ 
        email: profile.email, 
        password: password 
      });
      
      if (error) throw error;

      if (profile.role === 'admin') {
        router.replace('/admin-dashboard');
      } else {
        router.replace('/(tabs)');
      }

    } catch (err: any) { // 👈 catch (error: any) වෙනුවට standard type casting එක හැදුවා
      Alert.alert("Login Failed", "Username හෝ Password වැරදියි.");
    } finally {
      setLoading(false);
    }
  };

  // 🪄 Animated styles ටික වෙනම variable එකකට ගත්තා TypeScript crash වෙන්නේ නැති වෙන්න
  const animatedInputStyle: StyleProp<ViewStyle> = {
    opacity: fadeAnim,
    transform: [{ translateY: slideAnim }]
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* 🌌 Top Premium Dark Shape */}
      <LinearGradient
        colors={['#0f172a', '#1e3a8a']}
        style={styles.topShape}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        style={styles.content}
      >
        <Animated.View style={[styles.animatedContainer, animatedInputStyle]}>
          
          {/* 🌟 Highly Highlighted Brand Header */}
          <View style={styles.brandHeader}>
            <Text style={styles.brandName}>LeeStyle</Text>
            <View style={styles.brandBadge}>
              <Text style={styles.brandBadgeText}>PREMIUM STORE</Text>
            </View>
          </View>

          {/* 🏷️ Sign In Text Section */}
          <View style={styles.titleSection}>
            <Text style={styles.loginTitle}>Welcome Back</Text>
            <Text style={styles.loginSubtitle}>Sign in to continue shopping</Text>
          </View>

          {/* 🗂️ Input Card */}
          <View style={styles.inputCard}>
            <View style={styles.inputsSection}>
              {/* Username Input */}
              <View style={styles.inputRow}>
                <Ionicons name="person-outline" size={20} color="#94a3b8" style={styles.icon} />
                <TextInput 
                  style={styles.input} 
                  placeholder="Username" 
                  placeholderTextColor="#94a3b8"
                  value={fullName} 
                  onChangeText={setFullName} 
                  autoCapitalize="none"
                />
              </View>

              {/* Minimal Separator */}
              <View style={styles.separator} />

              {/* Password Input */}
              <View style={styles.inputRow}>
                <Ionicons name="lock-closed-outline" size={20} color="#94a3b8" style={styles.icon} />
                <TextInput 
                  style={styles.input} 
                  placeholder="Password" 
                  placeholderTextColor="#94a3b8"
                  value={password} 
                  onChangeText={setPassword} 
                  secureTextEntry 
                />
              </View>
            </View>

            {/* 🟢 Circular Submit Button */}
            <TouchableOpacity 
              style={styles.submitCircle} 
              onPress={handleLogin} 
              disabled={loading}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['#06b6d4', '#0284c7']}
                style={styles.circleGradient}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Ionicons name="arrow-forward" size={24} color="#ffffff" />
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* 🔗 Links Section */}
          <View style={styles.linksRow}>
            <TouchableOpacity onPress={() => router.push('/register')}>
              <Text style={styles.registerText}>Create Account</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => Alert.alert("Reset", "Password reset service...")}>
              <Text style={styles.forgotText}>Forgot Password?</Text>
            </TouchableOpacity>
          </View>

        </Animated.View>
      </KeyboardAvoidingView>

      {/* 🌊 Bottom Wave */}
      <LinearGradient
        colors={['#0ea5e9', '#2563eb']}
        style={styles.bottomShape}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc', position: 'relative' },
  content: { flex: 1, paddingHorizontal: 30, justifyContent: 'center', zIndex: 10 },
  animatedContainer: { width: '100%' },
  
  topShape: {
    position: 'absolute', top: -70, left: -40, right: -40, height: 380,
    borderBottomLeftRadius: 200, borderBottomRightRadius: 160, transform: [{ rotate: '-6deg' }]
  },
  bottomShape: {
    position: 'absolute', bottom: -140, left: -50, right: -50, height: 260,
    borderTopLeftRadius: 200, borderTopRightRadius: 250, transform: [{ rotate: '4deg' }]
  },

  brandHeader: { 
    alignItems: 'center', 
    marginTop: -80, 
    marginBottom: 60 
  },
  brandName: { 
    fontSize: 52, 
    fontWeight: '900', 
    color: '#ffffff', 
    letterSpacing: 2,
    textShadowColor: 'rgba(6, 182, 212, 0.4)',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 10
  },
  brandBadge: {
    backgroundColor: 'rgba(56, 189, 248, 0.15)', 
    paddingHorizontal: 14,
    paddingVertical: 4,
    borderRadius: 20,
    marginTop: 5,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)'
  },
  brandBadgeText: { 
    fontSize: 11, 
    fontWeight: '800', 
    color: '#38bdf8', 
    letterSpacing: 4 
  },

  titleSection: { marginBottom: 25, paddingLeft: 6 },
  loginTitle: { fontSize: 26, fontWeight: '800', color: '#1e293b' },
  loginSubtitle: { fontSize: 14, color: '#64748b', marginTop: 4 },

  inputCard: {
    width: '100%', backgroundColor: '#ffffff', flexDirection: 'row', alignItems: 'center',
    borderRadius: 24, paddingLeft: 22, paddingRight: 10, paddingVertical: 12,
    shadowColor: '#0f172a', shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.06, shadowRadius: 20, elevation: 6,
    position: 'relative',
    borderWidth: 1, borderColor: '#f1f5f9'
  },
  inputsSection: { flex: 1, paddingRight: 45 }, 
  inputRow: { flexDirection: 'row', alignItems: 'center', height: 58 },
  icon: { marginRight: 14 },
  input: { flex: 1, fontSize: 16, color: '#0f172a', fontWeight: '500' },
  separator: { height: 1, backgroundColor: '#f1f5f9', width: '100%' },

  submitCircle: {
    position: 'absolute', right: -16, width: 60, height: 60, borderRadius: 30,
    shadowColor: '#06b6d4', shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3, shadowRadius: 10, elevation: 5
  },
  circleGradient: { flex: 1, borderRadius: 30, justifyContent: 'center', alignItems: 'center' },

  linksRow: { 
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', 
    marginTop: 25, paddingHorizontal: 10 
  },
  forgotText: { color: '#94a3b8', fontSize: 14, fontWeight: '500' },
  registerText: { color: '#0284c7', fontSize: 15, fontWeight: '700' }
});