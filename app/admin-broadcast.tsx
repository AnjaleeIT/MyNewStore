import React, { useState } from 'react';
import { 
  View, Text, StyleSheet, TextInput, TouchableOpacity, 
  SafeAreaView, StatusBar, KeyboardAvoidingView, Platform, 
  ScrollView, ActivityIndicator, Alert, Dimensions 
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../supabaseConfig'; 

const { width } = Dimensions.get('window');

export default function AdminBroadcast() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  const handleBroadcast = async () => {
    if (!title.trim() || !message.trim()) {
      Alert.alert("Required Fields", "Please fill in both Title and Message fields, Chief!");
      return;
    }

    setSending(true);
    try {
      // 1. Get all user IDs from profiles table to bypass RLS NULL issues
      const { data: users, error: userError } = await supabase
        .from('profiles')
        .select('id');

      if (userError) throw userError;

      if (users && users.length > 0) {
        // 2. Map through each user and prepare a notification record with their unique UUID
        const insertPayload = users.map(u => ({
          title: title.trim(),
          message: message.trim(),
          is_read: false,
          user_id: u.id // Inserts your exact user UUID (Imasha's ID included)
        }));

        // 3. Perform a batch insert into the notifications table
        const { error } = await supabase
          .from('notifications')
          .insert(insertPayload);

        if (error) throw error;
      } else {
        // Fallback to null insert if no profiles exist
        const { error } = await supabase
          .from('notifications')
          .insert([{ title: title.trim(), message: message.trim(), is_read: false, user_id: null }]);
        
        if (error) throw error;
      }

      Alert.alert(
        "Broadcast Success ⚡", 
        "System notification deployed to all active user instances successfully.",
        [{ text: "Acknowledge", onPress: () => {
          setTitle('');
          setMessage('');
          router.back();
        }}]
      );
    } catch (error: any) {
      console.error("Broadcast Error:", error.message);
      Alert.alert("Database Sync Failed", error.message || "Could not push broadcast payload.");
    } finally {
      setSending(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />
      
      {/* Console Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backCircle} onPress={() => router.back()} activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={22} color="#0F172A" />
        </TouchableOpacity>
        <View style={styles.headerTitleWrap}>
          <Text style={styles.headerTitle}>Broadcast Hub</Text>
          <Text style={styles.headerSub}>Deploy System Announcements</Text>
        </View>
        <View style={styles.iconBox}>
          <Ionicons name="radio-sharp" size={18} color="#06B6D4" />
        </View>
      </View>

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.formCard}>
            
            {/* Input 1: Title */}
            <Text style={styles.inputLabel}>ANNOUNCEMENT TITLE</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="megaphone-outline" size={18} color="#94A3B8" style={styles.inputIcon} />
              <TextInput 
                style={styles.input}
                placeholder="e.g., Big Flash Sale Active! 🔥"
                placeholderTextColor="#94A3B8"
                value={title}
                onChangeText={setTitle}
              />
            </View>

            {/* Input 2: Message */}
            <Text style={styles.inputLabel}>DETAILED MESSAGE PAYLOAD</Text>
            <View style={[styles.inputWrapper, styles.textAreaWrapper]}>
              <Ionicons name="document-text-outline" size={18} color="#94A3B8" style={[styles.inputIcon, styles.textAreaIcon]} />
              <TextInput 
                style={[styles.input, styles.textArea]}
                placeholder="Type the announcement specifications for all clients here..."
                placeholderTextColor="#94A3B8"
                multiline
                numberOfLines={6}
                value={message}
                onChangeText={setMessage}
              />
            </View>

            {/* Launch Button */}
            <TouchableOpacity 
              style={[styles.sendButton, sending && styles.disabledButton]} 
              onPress={handleBroadcast}
              disabled={sending}
              activeOpacity={0.8}
            >
              {sending ? (
                <View style={styles.btnLoaderRow}>
                  <ActivityIndicator size="small" color="#fff" />
                  <Text style={styles.sendButtonText}>Deploying Nodes...</Text>
                </View>
              ) : (
                <View style={styles.btnLoaderRow}>
                  <Ionicons name="paper-plane-sharp" size={16} color="#FFF" />
                  <Text style={styles.sendButtonText}>Launch Broadcast</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24, paddingVertical: 20, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  backCircle: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#F8FAFC', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#E2E8F0', marginRight: 16 },
  headerTitleWrap: { flex: 1 },
  headerTitle: { fontSize: 20, fontWeight: '900', color: '#0F172A', letterSpacing: -0.5 },
  headerSub: { fontSize: 11, color: '#64748B', fontWeight: '500', marginTop: 1 },
  iconBox: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#06B6D40F', justifyContent: 'center', alignItems: 'center' },
  scrollContent: { padding: 20 },
  formCard: { backgroundColor: '#FFFFFF', padding: 20, borderRadius: 24, borderWidth: 1, borderColor: '#F1F5F9', shadowColor: '#0F172A', shadowOpacity: 0.01, shadowRadius: 15, elevation: 1 },
  inputLabel: { fontSize: 10, fontWeight: '800', color: '#475569', marginBottom: 8, letterSpacing: 0.8 },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC', borderRadius: 16, borderWidth: 1, borderColor: '#E2E8F0', marginBottom: 20, paddingHorizontal: 16 },
  inputIcon: { marginRight: 12 },
  input: { flex: 1, color: '#0F172A', fontSize: 14, paddingVertical: 14, fontWeight: '600' },
  textAreaWrapper: { alignItems: 'flex-start' },
  textAreaIcon: { marginTop: 16 },
  textArea: { height: 140, paddingTop: 14, textAlignVertical: 'top' },
  sendButton: { backgroundColor: '#06B6D4', paddingVertical: 16, borderRadius: 18, alignItems: 'center', marginTop: 8, shadowColor: '#06B6D4', shadowOpacity: 0.15, shadowRadius: 10, elevation: 2 },
  disabledButton: { backgroundColor: '#94A3B8' },
  btnLoaderRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sendButtonText: { color: '#fff', fontSize: 14, fontWeight: '800', letterSpacing: 0.3 }
});