import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  SafeAreaView, 
  Alert, 
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { supabase } from '../supabaseConfig'; 
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function AddProductScreen() {
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [category, setCategory] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const handleAddProduct = async () => {
    if (!name.trim() || !price.trim() || !imageUrl.trim()) {
      alert("Please fill in the Product Name, Price, and Image URL.");
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from('products')
        .insert([
          {
            name: name,
            price: parseFloat(price),
            description: description,
            image_url: imageUrl,
            category: category,
          }
        ]);

      if (error) throw error;

      alert("Success 🎉! Product added to the store.");
      router.back(); 

    } catch (error: any) {
      alert("Error: " + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{flex: 1}}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="close" size={24} color="#2d3436" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>New Product</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView contentContainerStyle={styles.form} showsVerticalScrollIndicator={false}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Product Name</Text>
            <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="e.g. Branded Hoodie" />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Price (LKR)</Text>
            <TextInput style={styles.input} value={price} onChangeText={setPrice} keyboardType="numeric" placeholder="e.g. 2500" />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Image Direct Link</Text>
            <TextInput style={styles.input} value={imageUrl} onChangeText={setImageUrl} placeholder="https://example.com/image.jpg" />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Category</Text>
            <TextInput style={styles.input} value={category} onChangeText={setCategory} placeholder="e.g. Mens Wear" />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Description</Text>
            <TextInput 
              style={[styles.input, { height: 120, textAlignVertical: 'top' }]} 
              value={description} 
              onChangeText={setDescription} 
              multiline 
              placeholder="Enter product details here..." 
            />
          </View>

          <TouchableOpacity 
            style={[styles.submitBtn, isSubmitting && { opacity: 0.7 }]} 
            onPress={handleAddProduct} 
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitBtnText}>Publish Product</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { flexDirection: 'row', justifyContent: 'space-between', padding: 20, alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#f1f2f6' },
  backBtn: { padding: 8, backgroundColor: '#f1f2f6', borderRadius: 12 },
  headerTitle: { fontSize: 20, fontWeight: '900', color: '#2d3436' },
  form: { padding: 25 },
  inputGroup: { marginBottom: 20 },
  label: { fontSize: 15, fontWeight: '700', color: '#2d3436', marginBottom: 10 },
  input: { backgroundColor: '#F8F9FB', padding: 18, borderRadius: 18, fontSize: 16, borderWidth: 1, borderColor: '#f1f2f6' },
  submitBtn: { backgroundColor: '#6C5CE7', padding: 20, borderRadius: 20, alignItems: 'center', marginTop: 15, elevation: 5 },
  submitBtnText: { color: '#fff', fontSize: 18, fontWeight: '800' }
});