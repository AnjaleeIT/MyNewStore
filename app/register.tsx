import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, SafeAreaView, ActivityIndicator, KeyboardAvoidingView, Platform, StatusBar } from 'react-native';
import { supabase } from '../supabaseConfig';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function RegisterScreen() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleRegister = async () => {
    if (!fullName || !email || !password) {
      Alert.alert("Input Error", "Please fill in all fields.");
      return;
    }
    setLoading(true);

    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) { Alert.alert("Registration Failed", error.message); setLoading(false); return; }

    if (data.user) {
      const userRole = fullName.toLowerCase().includes('admin') ? 'admin' : 'user';
      const { error: profileError } = await supabase
        .from('profiles')
        .insert([{ 
          id: data.user.id, 
          full_name: fullName.trim(), 
          email: email.trim().toLowerCase(), 
          role: userRole 
        }]);

      if (profileError) {
        Alert.alert("Profile Error", profileError.message);
      } else {
        Alert.alert("Success", "Account created successfully!");
        router.replace('/login');
      }
    }
    setLoading(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.content}>
        <View style={styles.headerBox}><Text style={styles.title}>Join LeeStyle </Text></View>
        <View style={styles.form}>
          <View style={styles.inputWrapper}><Ionicons name="person-outline" size={20} color="#7f8c8d" style={styles.icon} /><TextInput style={styles.input} placeholder="Username" value={fullName} onChangeText={setFullName} /></View>
          <View style={styles.inputWrapper}><Ionicons name="mail-outline" size={20} color="#7f8c8d" style={styles.icon} /><TextInput style={styles.input} placeholder="Email" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" /></View>
          <View style={styles.inputWrapper}><Ionicons name="lock-closed-outline" size={20} color="#7f8c8d" style={styles.icon} /><TextInput style={styles.input} placeholder="Password" value={password} onChangeText={setPassword} secureTextEntry /></View>
          <TouchableOpacity style={styles.button} onPress={handleRegister} disabled={loading}>{loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Register</Text>}</TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f6fa' },
  content: { flex: 1, padding: 25, justifyContent: 'center' },
  headerBox: { marginBottom: 30 },
  title: { fontSize: 28, fontWeight: '800', color: '#2d3436', textAlign: 'center' },
  form: { gap: 15 },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 15, borderRadius: 12, borderWidth: 1, borderColor: '#dcdde1' },
  icon: { marginRight: 10 },
  input: { flex: 1, fontSize: 16, color: '#2d3436' },
  button: { backgroundColor: '#0984e3', padding: 18, borderRadius: 12, alignItems: 'center', marginTop: 10 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '700' }
});

