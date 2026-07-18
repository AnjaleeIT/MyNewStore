import React, { useState, useEffect } from 'react';
import { 
  View, Text, TextInput, TouchableOpacity, StyleSheet, 
  Alert, ScrollView, SafeAreaView, ActivityIndicator, StatusBar,
  KeyboardAvoidingView, Platform 
} from 'react-native';
import { supabase } from '../supabaseConfig';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const THEME = {
  primary: '#6366f1',
  success: '#22c55e',
  danger: '#ef4444',
  dark: '#0f172a',
  background: '#f8fafc',
  white: '#ffffff',
  muted: '#94a3b8',
  inputBg: '#f1f5f9'
};

export default function AdminEditProduct() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  const [form, setForm] = useState({
    name: '', price: '', old_price: '', category: '', description: '', img: ''
  });

  useEffect(() => {
    if (id) fetchProduct();
  }, [id]);

  const fetchProduct = async () => {
    try {
      const { data, error } = await supabase.from('products').select('*').eq('id', id).single();
      if (data) {
        setForm({
          name: data.name || '',
          price: data.price?.toString() || '',
          old_price: data.old_price?.toString() || '',
          category: data.category || '',
          description: data.description || '',
          img: data.img || ''
        });
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handleUpdate = async () => {
    if (!form.name || !form.price) {
      Alert.alert("Validation Error", "Name and Price are required fields.");
      return;
    }

    setUpdating(true);
    try {
      const { error } = await supabase
        .from('products')
        .update({
          name: form.name.trim(),
          price: parseFloat(form.price),
          old_price: form.old_price ? parseFloat(form.old_price) : null,
          img: form.img.trim(),
          description: form.description.trim(),
          category: form.category.trim()
        })
        .match({ id: String(id) });

      if (error) throw error;

      // Success Notification
      Alert.alert(
        "Update Successful",
        "The product information has been updated in the database.",
        [{ text: "OK", onPress: () => router.replace('/admin-inventory') }]
      );
    } catch (error: any) {
      Alert.alert("Update Failed", error.message);
    } finally { setUpdating(false); }
  };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color={THEME.primary} /></View>;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
          <Ionicons name="arrow-back" size={22} color={THEME.dark} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Product</Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{flex: 1}}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          
          <View style={styles.card}>
            <Text style={styles.label}>Product Name</Text>
            <TextInput style={styles.input} value={form.name} onChangeText={(v) => setForm({...form, name: v})} placeholder="Enter product name" />

            <View style={styles.row}>
              <View style={{flex: 1, marginRight: 10}}>
                <Text style={styles.label}>Price (LKR)</Text>
                <TextInput style={styles.input} value={form.price} onChangeText={(v) => setForm({...form, price: v})} keyboardType="numeric" />
              </View>
              <View style={{flex: 1}}>
                <Text style={styles.label}>Old Price</Text>
                <TextInput style={styles.input} value={form.old_price} onChangeText={(v) => setForm({...form, old_price: v})} keyboardType="numeric" />
              </View>
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.label}>Image URL</Text>
            <TextInput style={styles.input} value={form.img} onChangeText={(v) => setForm({...form, img: v})} autoCapitalize="none" />
            
            <Text style={styles.label}>Category</Text>
            <TextInput style={styles.input} value={form.category} onChangeText={(v) => setForm({...form, category: v})} />

            <Text style={styles.label}>Description</Text>
            <TextInput style={[styles.input, {height: 100, textAlignVertical: 'top'}]} value={form.description} onChangeText={(v) => setForm({...form, description: v})} multiline />
          </View>

          <TouchableOpacity style={[styles.submitBtn, updating && {opacity: 0.7}]} onPress={handleUpdate} disabled={updating}>
            {updating ? <ActivityIndicator color="#FFF" /> : <Text style={styles.submitBtnText}>Save Changes</Text>}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: THEME.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', padding: 20, backgroundColor: THEME.white, alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  headerTitle: { fontSize: 18, fontWeight: '800', color: THEME.dark },
  iconBtn: { padding: 8, backgroundColor: THEME.background, borderRadius: 12 },
  scroll: { padding: 20 },
  card: { backgroundColor: THEME.white, borderRadius: 24, padding: 20, marginBottom: 20, shadowColor: '#000', shadowOpacity: 0.02, shadowRadius: 10, elevation: 2 },
  label: { fontSize: 13, fontWeight: '700', color: THEME.muted, marginBottom: 8, marginLeft: 4 },
  input: { backgroundColor: THEME.inputBg, padding: 16, borderRadius: 16, fontSize: 15, marginBottom: 15, color: THEME.dark },
  row: { flexDirection: 'row' },
  submitBtn: { backgroundColor: THEME.dark, padding: 20, borderRadius: 20, alignItems: 'center', shadowColor: THEME.dark, shadowOpacity: 0.3, shadowRadius: 10, elevation: 8 },
  submitBtnText: { color: THEME.white, fontSize: 16, fontWeight: '800' }
});