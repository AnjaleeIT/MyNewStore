import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  ActivityIndicator, 
  Alert, 
  Image, 
  ScrollView, 
  SafeAreaView,
  StatusBar 
} from 'react-native';
import { supabase } from '../../supabaseConfig';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

export default function PersonalInfo() {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const router = useRouter();

  useEffect(() => { getProfile(); }, []);

  async function getProfile() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setEmail(user.email || '');
        let { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
        if (data) {
          setName(data.full_name || '');
          setPhone(data.phone_number || '');
          setImage(data.avatar_url || null);
        }
      }
    } catch (e) { 
      console.log("Error loading profile:", e); 
    } finally { 
      setLoading(false); 
    }
  }

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images',
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });
    
    if (!result.canceled && result.assets && result.assets.length > 0) { 
      setImage(result.assets[0].uri); 
    }
  };

  async function uploadImage(uri: string) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const fileExt = uri.split('.').pop() || 'jpg';
      const fileName = `avatar_${user.id}_${Date.now()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      const response = await fetch(uri);
      const blob = await response.blob();

      const { error } = await supabase.storage
        .from('avatars')
        .upload(filePath, blob, {
          contentType: `image/${fileExt === 'png' ? 'png' : 'jpeg'}`,
          cacheControl: '3600',
          upsert: true
        });

      if (error) throw error;
      
      const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(filePath);
      return urlData.publicUrl;
    } catch (error: any) { 
      console.error("Storage Upload Error:", error.message);
      return null; 
    }
  }

  async function updateProfile() {
    if (!name.trim()) {
      Alert.alert("Required Field", "Name cannot be empty.");
      return;
    }

    try {
      setUpdating(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No user found");

      let finalImageUrl = image;
      
      if (image && (image.includes('blob') || image.includes('file') || image.includes('content') || !image.startsWith('http'))) {
        const uploadedUrl = await uploadImage(image);
        if (uploadedUrl) finalImageUrl = uploadedUrl;
      }

      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: name.trim(),
          phone_number: phone ? phone.trim() : null,
          avatar_url: finalImageUrl, 
          updated_at: new Date(),
        })
        .eq('id', user.id);

      if (error) throw error;
      
      Alert.alert("Success 🎉", "Profile updated successfully!");
      router.back();
    } catch (e: any) { 
      console.error("Database Update Error:", e.message);
      Alert.alert("Error", e.message || "Could not save profile details."); 
    } finally { 
      setUpdating(false); 
    }
  }

  if (loading) return <ActivityIndicator style={{ flex: 1, justifyContent: 'center' }} color="#5F1BE9" />;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      {/* Premium Balanced Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={24} color="#1E293B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Profile</Text>
        <TouchableOpacity onPress={updateProfile} disabled={updating} style={styles.saveBtn} activeOpacity={0.7}>
           {updating ? <ActivityIndicator size="small" color="#5F1BE9" /> : <Ionicons name="checkmark" size={24} color="#5F1BE9" />}
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Profile Avatar with Soft Curved Outer Ring */}
        <View style={styles.avatarContainer}>
          <TouchableOpacity onPress={pickImage} style={styles.avatarWrapper} activeOpacity={0.9}>
            <Image 
              source={{ uri: image || 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png' }} 
              style={styles.avatar} 
            />
            <View style={styles.cameraBtn}>
              <Ionicons name="camera" size={16} color="white" />
            </View>
          </TouchableOpacity>
        </View>

        {/* Form Container (💡 Beautiful Rounded Design) */}
        <View style={styles.formCard}>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Full Name</Text>
            <TextInput 
              style={styles.roundedInput} 
              value={name} 
              onChangeText={setName} 
              placeholder="Enter your full name" 
              placeholderTextColor="#94A3B8" 
            />
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email Address (Read Only)</Text>
            <TextInput 
              style={[styles.roundedInput, styles.disabledInput]} 
              value={email} 
              editable={false} 
            />
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Phone Number</Text>
            <TextInput 
              style={styles.roundedInput} 
              value={phone} 
              onChangeText={setPhone} 
              keyboardType="phone-pad" 
              placeholder="e.g. 07XXXXXXXX" 
              placeholderTextColor="#94A3B8" 
              maxLength={10}
            />
          </View>

        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' }, // Light Premium Slate Background
  
  // Luxury Header Styles
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    paddingHorizontal: 16, 
    paddingVertical: 14, 
    backgroundColor: '#FFFFFF',
    alignItems: 'center', 
    borderBottomWidth: 1, 
    borderColor: '#F1F5F9' 
  },
  backBtn: { width: 38, height: 38, borderRadius: 12, backgroundColor: '#F8FAFC', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#E2E8F0' },
  saveBtn: { width: 38, height: 38, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F3E8FF', borderRadius: 12 },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#0F172A' },
  
  scrollContent: { padding: 16, alignItems: 'center' },
  
  // Avatar Section Enhancement
  avatarContainer: { marginVertical: 20, alignItems: 'center', justifyContent: 'center' },
  avatarWrapper: { position: 'relative' },
  avatar: { 
    width: 104, 
    height: 104, 
    borderRadius: 52, 
    backgroundColor: '#F1F5F9',
    borderWidth: 3,
    borderColor: '#F3E8FF' // Soft Purple Outer Glow
  },
  cameraBtn: { 
    position: 'absolute', 
    bottom: 2, 
    right: 2, 
    backgroundColor: '#5F1BE9', // Brand Purple
    width: 32, 
    height: 32, 
    borderRadius: 16, 
    justifyContent: 'center', 
    alignItems: 'center', 
    borderWidth: 3, 
    borderColor: '#FFFFFF',
    elevation: 4,
    shadowColor: '#0F172A',
    shadowOpacity: 0.1,
    shadowRadius: 3
  },
  
  // Modern Card Input Architecture
  formCard: { 
    width: '100%', 
    backgroundColor: '#FFFFFF', 
    borderRadius: 24, 
    padding: 20, 
    borderWidth: 1, 
    borderColor: '#F1F5F9',
    elevation: 2,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 8
  },
  inputGroup: { marginBottom: 16 },
  label: { fontSize: 12, fontWeight: '700', color: '#64748B', marginBottom: 8, letterSpacing: -0.1 },
  roundedInput: { 
    backgroundColor: '#FFFFFF', 
    borderWidth: 1.5, 
    borderColor: '#E2E8F0', 
    borderRadius: 14, 
    height: 48, 
    paddingHorizontal: 14, 
    fontSize: 14, 
    color: '#1E293B', 
    fontWeight: '500' 
  },
  disabledInput: { 
    backgroundColor: '#F1F5F9', 
    borderColor: '#E2E8F0',
    color: '#94A3B8'
  }
});