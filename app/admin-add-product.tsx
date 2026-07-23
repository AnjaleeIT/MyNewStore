import React, { useState } from 'react';
import { 
  View, Text, TextInput, TouchableOpacity, StyleSheet, 
  Alert, ScrollView, SafeAreaView, ActivityIndicator, StatusBar, 
  KeyboardAvoidingView, Platform 
} from 'react-native';
import { supabase } from '../supabaseConfig';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const THEME = {
  primary: '#5209e3',
  dark: '#1C1C1E',
  background: '#F2F2F7',
  white: '#FFFFFF',
  border: '#E5E5EA',
  secondaryText: '#8E8E93',
  inputBg: '#F9F9FB',
  success: '#34C759'
};

export default function AdminAddProduct() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const [form, setForm] = useState({
    name: '',
    price: '',
    old_price: '',
    category: '',
    description: '',
    img: ''
  });

  const handleGoBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/admin-dashboard'); 
    }
  };

  const handleSave = async () => {
    // Validation
    if (!form.name.trim() || !form.price.trim() || !form.img.trim()) {
      Alert.alert("Missing Information", "Please enter name, price and a valid image URL.");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('products')
        .insert([{ 
          name: form.name.trim(), 
          price: parseFloat(form.price), 
          old_price: form.old_price ? parseFloat(form.old_price) : null,
          img: form.img.trim(),
          description: form.description.trim() || null,
          category: form.category.trim() || 'General',
          created_at: new Date()
        }]);

      if (error) throw error;

      // Succsess (Notification)
      Alert.alert(
        "Success ✅", 
        "Item is Successfully Added ti stor", 
        [
          { 
            text: "great", 
            onPress: () => {
              // Form reset 
              setForm({ name: '', price: '', old_price: '', category: '', description: '', img: '' });
              // redirect to dashboard
              router.replace('/admin-dashboard');
            } 
          }
        ]
      );

    } catch (error: any) {
      Alert.alert("Error ❌", error.message || "Error.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={handleGoBack} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={28} color={THEME.dark} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>New Product</Text>
        <View style={{ width: 40 }} /> 
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{flex: 1}}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>PRODUCT INFO</Text>
            
            <Text style={styles.fieldLabel}>Name *</Text>
            <TextInput 
              style={styles.input} 
              value={form.name} 
              onChangeText={(v) => setForm({...form, name: v})} 
              placeholder="e.g. Premium Cotton Shirt" 
            />

            <View style={styles.row}>
              <View style={{ flex: 1, marginRight: 10 }}>
                <Text style={styles.fieldLabel}>Price (LKR) *</Text>
                <TextInput 
                  style={styles.input} 
                  value={form.price} 
                  onChangeText={(v) => setForm({...form, price: v})} 
                  keyboardType="numeric" 
                  placeholder="2500" 
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.fieldLabel}>Old Price</Text>
                <TextInput 
                  style={styles.input} 
                  value={form.old_price} 
                  onChangeText={(v) => setForm({...form, old_price: v})} 
                  keyboardType="numeric" 
                  placeholder="3000" 
                />
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionLabel}>CATEGORIZATION</Text>
            <Text style={styles.fieldLabel}>Category</Text>
            <TextInput 
              style={styles.input} 
              value={form.category} 
              onChangeText={(v) => setForm({...form, category: v})} 
              placeholder="Fashion / Electronics / Grocery" 
            />

            <Text style={styles.fieldLabel}>Full Description</Text>
            <TextInput 
              style={[styles.input, { height: 100, textAlignVertical: 'top' }]} 
              value={form.description} 
              onChangeText={(v) => setForm({...form, description: v})} 
              multiline 
              placeholder="Tell customers about this item..." 
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionLabel}>VISUALS</Text>
            <Text style={styles.fieldLabel}>Image URL *</Text>
            <TextInput 
              style={styles.input} 
              value={form.img} 
              onChangeText={(v) => setForm({...form, img: v})} 
              autoCapitalize="none" 
              placeholder="https://images.unsplash.com/..." 
            />
          </View>

          <TouchableOpacity 
            style={[styles.mainBtn, loading && { opacity: 0.7 }]} 
            onPress={handleSave} 
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <>
                <Text style={styles.mainBtnText}>Publish to Store</Text>
                <Ionicons name="cloud-upload-outline" size={20} color="#FFF" style={{marginLeft: 10}} />
              </>
            )}
          </TouchableOpacity>

          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: THEME.background },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    paddingHorizontal: 15, 
    paddingVertical: 12, 
    backgroundColor: THEME.white,
    borderBottomWidth: 1,
    borderBottomColor: THEME.border
  },
  headerTitle: { fontSize: 18, fontWeight: '800', color: THEME.dark, letterSpacing: -0.5 },
  backBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  scroll: { padding: 20 },
  section: { 
    backgroundColor: THEME.white, 
    borderRadius: 24, 
    padding: 20, 
    marginBottom: 20, 
    borderWidth: 1, 
    borderColor: THEME.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2
  },
  sectionLabel: { fontSize: 11, fontWeight: '900', color: THEME.secondaryText, letterSpacing: 1.2, marginBottom: 15 },
  fieldLabel: { fontSize: 13, fontWeight: '700', color: THEME.dark, marginBottom: 8, marginTop: 10 },
  input: { 
    backgroundColor: THEME.inputBg, 
    padding: 15, 
    borderRadius: 15, 
    fontSize: 14, 
    borderWidth: 1, 
    borderColor: '#EFEFEF',
    color: THEME.dark
  },
  row: { flexDirection: 'row' },
  mainBtn: { 
    backgroundColor: THEME.dark, 
    padding: 20, 
    borderRadius: 20, 
    flexDirection: 'row',
    justifyContent: 'center', 
    alignItems: 'center', 
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8
  },
  mainBtnText: { color: '#FFF', fontWeight: '800', fontSize: 16 }
});
