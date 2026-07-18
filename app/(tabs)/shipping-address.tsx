import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  Alert,
  ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { supabase } from '../../supabaseConfig';

export default function ShippingAddressScreen() {
  const router = useRouter();
  
  // States
  const [address, setAddress] = useState(''); // DB එකෙන් එන ප්‍රධාන ඇඩ්‍රස් එක
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  
  // UI Control States
  const [isEditing, setIsEditing] = useState(false); // Edit Mode එක On/Off කිරීමට
  const [isAddingNew, setIsAddingNew] = useState(false); // New Address Mode එක On/Off කිරීමට
  const [newAddress, setNewAddress] = useState(''); // අලුතින්ම දාන ඇඩ්‍රස් එක

  useEffect(() => {
    fetchAddress();
  }, []);

  // 📥 Supabase Profiles එකෙන් රෙජිස්ටර් වෙද්දී දීපු Address එක ලෝඩ් කිරීම
  const fetchAddress = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        let { data, error } = await supabase
          .from('profiles')
          .select('address') 
          .eq('id', user.id)
          .single();

        if (!error && data && data.address) {
          setAddress(data.address);
        }
      }
    } catch (err) {
      console.log("Error loading address:", err);
    } finally {
      setLoading(false);
    }
  };

  // 💾 1. පවතින Address එක වෙනස් කර (Edit) DB එකට සේව් කිරීම
  const handleUpdateAddress = async () => {
    if (!address.trim()) {
      Alert.alert("Required Field", "Address cannot be empty.");
      return;
    }

    try {
      setUpdating(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('profiles')
        .update({ address: address.trim() })
        .eq('id', user.id);

      if (error) throw error;
      
      Alert.alert("Updated 🎉", "Shipping address updated successfully!");
      setIsEditing(false); // Edit මොඩ් එක ඕෆ් කිරීම
    } catch (err: any) {
      Alert.alert("Error", err.message || "Could not update address.");
    } finally {
      setUpdating(false);
    }
  };

  // 💾 2. අලුත්ම Address එකක් Add කර සේව් කිරීම
  const handleAddNewAddress = async () => {
    if (!newAddress.trim()) {
      Alert.alert("Required Field", "Please enter the new address.");
      return;
    }

    try {
      setUpdating(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // 💡 මෙතනදී අපි ප්‍රධාන ඇඩ්‍රස් එක වෙනුවට අලුත් එකක් දාන නිසා, දැනට Profiles එකේම ඇඩ්‍රස් එක අප්ඩේට් කරනවා. 
      // (ඔයාට වෙනම 'addresses' කියලා ටේබල් එකක් තියේ නම් එතනට Insert කරන්නත් පුළුවන්)
      const { error } = await supabase
        .from('profiles')
        .update({ address: newAddress.trim() })
        .eq('id', user.id);

      if (error) throw error;
      
      setAddress(newAddress.trim()); // පේජ් එකේ පේන ඇඩ්‍රස් එක අලුත් එකට මාරු කිරීම
      Alert.alert("Added 🎉", "New shipping address added successfully!");
      setNewAddress('');
      setIsAddingNew(false);
    } catch (err: any) {
      Alert.alert("Error", err.message || "Could not add new address.");
    } finally {
      setUpdating(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={24} color="#1E293B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Shipping Address</Text>
        <View style={{ width: 38 }} />
      </View>

      {loading ? (
        <View style={styles.center}><ActivityIndicator size="small" color="#5F1BE9" /></View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          
          {/* 🌟 MAIN REGISTRATION ADDRESS CARD */}
          {!isEditing && (
            <View style={styles.addressCard}>
              <View style={styles.cardHeaderRow}>
                <View style={styles.tagHome}>
                  <Text style={styles.tagHomeText}>Default Address</Text>
                </View>
                {/* 📝 EDIT BUTTON */}
                <TouchableOpacity onPress={() => setIsEditing(true)} style={styles.editIconBtn}>
                  <Ionicons name="create-outline" size={18} color="#5F1BE9" />
                  <Text style={styles.editText}>Edit</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.addressDisplayBox}>
                <Ionicons name="location-sharp" size={18} color="#64748B" style={{ marginTop: 2 }} />
                <Text style={styles.addressText}>
                  {address ? address : "No address registered yet. Click edit to add."}
                </Text>
              </View>
            </View>
          )}

          {/* 📝 EDIT ADDRESS MODE INPUT (මතු වෙන්නේ Edit ඔබපු විට පමණි) */}
          {isEditing && (
            <View style={styles.editFormCard}>
              <Text style={styles.sectionSubTitle}>Modify Default Address</Text>
              <TextInput
                style={styles.roundedTextArea}
                placeholder="Edit your delivery address..."
                placeholderTextColor="#94A3B8"
                multiline={true}
                numberOfLines={3}
                value={address}
                onChangeText={setAddress}
                textAlignVertical="top"
              />
              <View style={styles.actionRowInline}>
                <TouchableOpacity style={styles.cancelBtn} onPress={() => { setIsEditing(false); fetchAddress(); }}>
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.saveInlineBtn} onPress={handleUpdateAddress} disabled={updating}>
                  {updating ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.saveInlineText}>Save Changes</Text>}
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* ➕ ADD NEW ADDRESS INPUT BOX (මතු වෙන්නේ Add New Address ඔබපු විට පමණි) */}
          {isAddingNew && (
            <View style={styles.editFormCard}>
              <Text style={styles.sectionSubTitle}>Add New Shipping Address</Text>
              <TextInput
                style={styles.roundedTextArea}
                placeholder="Enter your new home or office address..."
                placeholderTextColor="#94A3B8"
                multiline={true}
                numberOfLines={3}
                value={newAddress}
                onChangeText={setNewAddress}
                textAlignVertical="top"
              />
              <View style={styles.actionRowInline}>
                <TouchableOpacity style={styles.cancelBtn} onPress={() => setIsAddingNew(false)}>
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.saveInlineBtn} onPress={handleAddNewAddress} disabled={updating}>
                  {updating ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.saveInlineText}>Add Address</Text>}
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* ➕ ADD NEW ADDRESS TRIGGER BUTTON (ප්‍රධාන බටන් එක) */}
          {!isAddingNew && !isEditing && (
            <TouchableOpacity 
              style={styles.addNewBtn} 
              onPress={() => setIsAddingNew(true)}
              activeOpacity={0.8}
            >
              <Ionicons name="add" size={20} color="#5F1BE9" />
              <Text style={styles.addNewBtnText}>Add New Address</Text>
            </TouchableOpacity>
          )}

        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderColor: '#F1F5F9' },
  backBtn: { width: 38, height: 38, borderRadius: 12, backgroundColor: '#F8FAFC', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#E2E8F0' },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#0F172A' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scrollContent: { padding: 16 },
  
  // Display Card Design
  addressCard: { 
    backgroundColor: '#FFFFFF', 
    borderRadius: 24, 
    padding: 20, 
    borderWidth: 1, 
    borderColor: '#F1F5F9',
    marginBottom: 16,
    elevation: 3,
    shadowColor: '#0F172A',
    shadowOpacity: 0.02,
    shadowRadius: 8
  },
  cardHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  tagHome: { backgroundColor: '#F3E8FF', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 8 },
  tagHomeText: { color: '#5F1BE9', fontSize: 11, fontWeight: '700' },
  
  editIconBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#F8FAFC', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10, borderWidth: 1, borderColor: '#E2E8F0' },
  editText: { fontSize: 12, color: '#5F1BE9', fontWeight: '700' },
  
  addressDisplayBox: { flexDirection: 'row', gap: 10, paddingRight: 10 },
  addressText: { fontSize: 14, color: '#334155', fontWeight: '500', lineHeight: 22, flex: 1 },

  // Form Card Layouts (Edit / Add Mode)
  editFormCard: { backgroundColor: '#FFFFFF', borderRadius: 24, padding: 20, borderWidth: 1, borderColor: '#F1F5F9', marginBottom: 16 },
  sectionSubTitle: { fontSize: 14, fontWeight: '800', color: '#0F172A', marginBottom: 12 },
  roundedTextArea: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    padding: 14,
    fontSize: 14,
    color: '#1E293B',
    fontWeight: '500',
    height: 90,
  },
  actionRowInline: { flexDirection: 'row', justifyContent: 'space-between', gap: 10, marginTop: 14 },
  cancelBtn: { flex: 1, height: 44, borderRadius: 12, backgroundColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center' },
  cancelBtnText: { color: '#64748B', fontSize: 13, fontWeight: '700' },
  saveInlineBtn: { flex: 1.8, height: 44, borderRadius: 12, backgroundColor: '#5F1BE9', justifyContent: 'center', alignItems: 'center' },
  saveInlineText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },

  // Premium Add New Dashed Button
  addNewBtn: {
    flexDirection: 'row',
    height: 52,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#CBD5E1',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    marginTop: 20
  },
  addNewBtnText: { color: '#5F1BE9', fontSize: 14, fontWeight: '800' }
});