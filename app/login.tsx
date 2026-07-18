import React, { useState } from 'react';
import { 
  View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, 
  SafeAreaView, ActivityIndicator, StatusBar, KeyboardAvoidingView, Platform 
} from 'react-native';
import { supabase } from '../supabaseConfig';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function LoginScreen() {
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async () => {
    if (!fullName || !password) {
      Alert.alert("Error", "Please enter both Username and Password.");
      return;
    }
    setLoading(true);
    try {
      // 1. Username එක හරහා Profile එක ගන්නවා
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('email, role')
        .eq('full_name', fullName.trim())
        .single();

      if (profileError || !profile) {
        throw new Error("User not found in database.");
      }

      // 2. Auth Login එක කරනවා
      const { error } = await supabase.auth.signInWithPassword({ 
        email: profile.email, 
        password: password 
      });
      
      if (error) throw error;

      // 3. Role එක අනුව Page එකට යවනවා
      if (profile.role === 'admin') {
        router.replace('/admin-dashboard');
      } else {
        router.replace('/(tabs)');
      }

    } catch (error: any) {
      Alert.alert("Login Failed", "Username හෝ Password වැරදියි.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        style={styles.content}
      >
        <View style={styles.headerBox}>
          <Text style={styles.title}>Welcome Back 👋</Text>
          <Text style={styles.subtitle}>Sign in to your account</Text>
        </View>

        <View style={styles.form}>
          {/* Username Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Username</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="person-outline" size={20} color="#636e72" style={styles.icon} />
              <TextInput 
                style={styles.input} 
                placeholder="Enter your username" 
                value={fullName} 
                onChangeText={setFullName} 
                autoCapitalize="none"
              />
            </View>
          </View>

          {/* Password Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Password</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="lock-closed-outline" size={20} color="#636e72" style={styles.icon} />
              <TextInput 
                style={styles.input} 
                placeholder="Enter your password" 
                value={password} 
                onChangeText={setPassword} 
                secureTextEntry 
              />
            </View>
          </View>

          {/* Login Button */}
          <TouchableOpacity 
            style={styles.button} 
            onPress={handleLogin} 
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Sign In</Text>
            )}
          </TouchableOpacity>

          {/* Register Link */}
          <TouchableOpacity 
            onPress={() => router.push('/register')} 
            style={styles.registerLink}
          >
            <Text style={styles.linkText}>
              Don't have an account? <Text style={styles.linkBlue}>Register</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff' },
  content: { flex: 1, padding: 30, justifyContent: 'center' },
  headerBox: { marginBottom: 40 },
  title: { fontSize: 32, fontWeight: '800', color: '#1a1a1a', textAlign: 'left' },
  subtitle: { fontSize: 16, color: '#636e72', marginTop: 5, textAlign: 'left' },
  form: { gap: 20 },
  inputGroup: { gap: 8 },
  label: { fontSize: 14, fontWeight: '600', color: '#2d3436', marginLeft: 4 },
  inputWrapper: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#f8f9fa', 
    padding: 16, 
    borderRadius: 16, 
    borderWidth: 1, 
    borderColor: '#edf2f7' 
  },
  icon: { marginRight: 12 },
  input: { flex: 1, fontSize: 16, color: '#2d3436' },
  button: { 
    backgroundColor: '#1a1a1a', 
    padding: 18, 
    borderRadius: 16, 
    alignItems: 'center', 
    marginTop: 10,
    // Shadow for modern look
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  registerLink: { marginTop: 20 },
  linkText: { textAlign: 'center', color: '#636e72', fontSize: 14 },
  linkBlue: { color: '#007AFF', fontWeight: '800' }
});