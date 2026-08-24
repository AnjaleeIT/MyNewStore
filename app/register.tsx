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
  }, [fadeAnim, slideAnim]);

  const handleLogin = async () => {
    if (!fullName.trim() || !password) {
      Alert.alert("Error", "Please enter both Username and Password.");
      return;
    }
    setLoading(true);

    try {
      // Step 1: Query the user profile by full_name to get their linked email
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('email, role')
        .eq('full_name', fullName.trim())
        .maybeSingle();

      if (profileError || !profile) {
        throw new Error("Invalid username or password.");
      }

      // Step 2: Authenticate using the retrieved email and user's password
      const { error: authError } = await supabase.auth.signInWithPassword({ 
        email: profile.email, 
        password: password 
      });
      
      if (authError) throw authError;

      // Step 3: Route depending on user role
      if (profile.role === 'admin') {
        router.replace('/admin-dashboard');
      } else {
        router.replace('/(tabs)');
      }

    } catch (err: any) {
      Alert.alert("Login Failed", err.message || "Username or Password is incorrect.");
    } finally {
      setLoading(false);
    }
  };

  const animatedInputStyle: StyleProp<ViewStyle> = {
    opacity: fadeAnim,
    transform: [{ translateY: slideAnim }]
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Top Gradient Background */}
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
          
          {/* Brand Header */}
          <View style={styles.brandHeader}>
            <Text style={styles.brandName}>LeeStyle</Text>
            <View style={styles.brandBadge}>
              <Text style={styles.brandBadgeText}>PREMIUM STORE</Text>
            </View>
          </View>

          {/* Title Section */}
          <View style={styles.titleSection}>
            <Text style={styles.loginTitle}>Welcome Back</Text>
            <Text style={styles.loginSubtitle}>Sign in to continue shopping</Text>
          </View>

          {/* Input Card */}
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
                  autoCorrect={false}
                />
              </View>

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
                  autoCapitalize="none"
                />
              </View>
            </View>

            {/* Circular Submit Button inside layout */}
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

          {/* Links Section */}
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

      {/* Bottom Wave Background */}
      <LinearGradient
        colors={['#0ea5e9', '#2563eb']}
        style={styles.bottomShape}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  content: { flex: 1, paddingHorizontal: 24, justifyContent: 'center', zIndex: 10 },
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
    marginTop: -40, 
    marginBottom: 40 
  },
  brandName: { 
    fontSize: 48, 
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

  titleSection: { marginBottom: 20, paddingLeft: 6 },
  loginTitle: { fontSize: 26, fontWeight: '800', color: '#1e293b' },
  loginSubtitle: { fontSize: 14, color: '#64748b', marginTop: 4 },

  inputCard: {
    width: '100%', backgroundColor: '#ffffff', flexDirection: 'row', alignItems: 'center',
    borderRadius: 24, paddingLeft: 16, paddingRight: 12, paddingVertical: 10,
    shadowColor: '#0f172a', shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.08, shadowRadius: 20, elevation: 6,
    borderWidth: 1, borderColor: '#f1f5f9'
  },
  inputsSection: { flex: 1, marginRight: 12 }, 
  inputRow: { flexDirection: 'row', alignItems: 'center', height: 50 },
  icon: { marginRight: 10 },
  input: { flex: 1, fontSize: 16, color: '#0f172a', fontWeight: '500' },
  separator: { height: 1, backgroundColor: '#f1f5f9', width: '100%' },

  submitCircle: {
    width: 52, height: 52, borderRadius: 26,
    shadowColor: '#06b6d4', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 4
  },
  circleGradient: { flex: 1, borderRadius: 26, justifyContent: 'center', alignItems: 'center' },

  linksRow: { 
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', 
    marginTop: 25, paddingHorizontal: 10 
  },
  forgotText: { color: '#94a3b8', fontSize: 14, fontWeight: '500' },
  registerText: { color: '#0284c7', fontSize: 15, fontWeight: '700' }
});