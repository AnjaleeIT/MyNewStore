import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  Switch, 
  Alert,
  TextInput,
  Modal,
  ActivityIndicator,
  SafeAreaView 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { supabase } from '../supabaseConfig'; 

export default function SecurityScreen() {
  const router = useRouter();
  const [userEmail, setUserEmail] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  
  // ⚙️ Toggles
  const [biometricAuth, setBiometricAuth] = useState(false);
  const [marketingPrefs, setMarketingPrefs] = useState(true);

  // 🔑 Change Password States
  const [passwordModalVisible, setPasswordModalVisible] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // ⚠️ Delete Account States
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');

  useEffect(() => {
    async function getUser() {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.email) {
        setUserEmail(session.user.email);
      }
    }
    getUser();
  }, []);

  // ==========================================
  // 🔥 REAL DATA: CHANGE PASSWORD LOGIC
  // ==========================================
  const handleUpdatePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert("Error", "Please fill in all fields.");
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert("Error", "New passwords do not match.");
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert("Error", "Password must be at least 6 characters long.");
      return;
    }

    setLoading(true);
    try {
      // Step 1: Verify current password by signing in
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: userEmail,
        password: currentPassword,
      });

      if (signInError) {
        Alert.alert("Error", "The current password you entered is incorrect.");
        setLoading(false);
        return;
      }

      // Step 2: Update password if verification is successful
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (updateError) throw updateError;

      Alert.alert("Success 🎉", "Your password has been updated successfully.");
      setPasswordModalVisible(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');

    } catch (error: any) {
      Alert.alert("Error", error.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // 🔥 REAL DATA: DELETE ACCOUNT LOGIC
  // ==========================================
  const handleRealDeleteAccount = async () => {
    if (!deletePassword) {
      Alert.alert("Error", "Please enter your password to confirm.");
      return;
    }

    setLoading(true);
    try {
      // Step 1: Verify user password
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: userEmail,
        password: deletePassword,
      });

      if (authError) {
        Alert.alert("Error", "Incorrect password. Cannot delete account.");
        setLoading(false);
        return;
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;

      // Step 2: Delete user profile data from public table
      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', session.user.id);

      if (profileError) throw profileError;

      // Step 3: Sign out user
      await supabase.auth.signOut();
      setDeleteModalVisible(false);
      
      Alert.alert(
        "Account Deleted", 
        "Your LeeStyle account has been successfully removed.",
        [{ text: "OK", onPress: () => router.replace('/login') }]
      );

    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to delete account.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color="black" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Privacy & Security</Text>
      </View>

      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        
        {/* Security Status Card */}
        <View style={styles.statusCard}>
          <View style={styles.statusIconBox}>
            <Ionicons name="shield-checkmark" size={28} color="#5A31F4" />
          </View>
          <View style={styles.statusTextBox}>
            <Text style={styles.statusTitle}>Your Account is Secure</Text>
            <Text style={styles.statusDesc}>LeeStyleStore ensures your data and privacy are fully protected at all times.</Text>
          </View>
        </View>

        {/* Login Security Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Login Security</Text>

          <View style={styles.infoRow}>
            <View style={styles.rowLeft}>
              <Ionicons name="mail-outline" size={20} color="#666" />
              <Text style={styles.rowLabel}>Registered Email</Text>
            </View>
            <Text style={styles.rowValue}>{userEmail || 'Loading...'}</Text>
          </View>

          <TouchableOpacity style={styles.actionRow} onPress={() => setPasswordModalVisible(true)}>
            <View style={styles.rowLeft}>
              <Ionicons name="lock-closed-outline" size={20} color="#666" />
              <Text style={styles.actionLabel}>Change Password</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#CCC" />
          </TouchableOpacity>

          <View style={styles.toggleRow}>
            <View style={styles.rowLeft}>
              <Ionicons name="finger-print-outline" size={20} color="#666" />
              <Text style={styles.rowLabel}>Biometric Login (Face ID / Fingerprint)</Text>
            </View>
            <Switch 
              value={biometricAuth} 
              onValueChange={setBiometricAuth}
              trackColor={{ false: "#E0E0E0", true: "#EAE6FF" }}
              thumbColor={biometricAuth ? "#5A31F4" : "#FFF"}
            />
          </View>
        </View>

        {/* Data Privacy Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data Privacy Preferences</Text>
          <View style={styles.toggleRow}>
            <View style={styles.rowLeft}>
              <Ionicons name="git-network-outline" size={20} color="#666" />
              <View style={{ flex: 1, paddingRight: 10 }}>
                <Text style={styles.rowLabel}>Personalized Recommendations</Text>
                <Text style={styles.rowSubLabel}>Enable personalized item preview based on your browsing history.</Text>
              </View>
            </View>
            <Switch 
              value={marketingPrefs} 
              onValueChange={setMarketingPrefs}
              trackColor={{ false: "#E0E0E0", true: "#EAE6FF" }}
              thumbColor={marketingPrefs ? "#5A31F4" : "#FFF"}
            />
          </View>
        </View>

        {/* Danger Zone */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: '#FF3B30' }]}>Danger Zone</Text>
          <TouchableOpacity style={styles.actionRow} onPress={() => setDeleteModalVisible(true)}>
            <View style={styles.rowLeft}>
              <Ionicons name="trash-outline" size={20} color="#FF3B30" />
              <Text style={[styles.actionLabel, { color: '#FF3B30' }]}>Delete LeeStyle Account</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#CCC" />
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* =============================================================
          📱 MODAL 1: CHANGE PASSWORD POP-UP
          ============================================================= */}
      <Modal visible={passwordModalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalHeading}>Update Password</Text>
            
            <Text style={styles.inputLabel}>Current Password</Text>
            <TextInput 
              secureTextEntry 
              style={styles.input} 
              placeholder="Enter current password"
              value={currentPassword}
              onChangeText={setCurrentPassword}
              placeholderTextColor="#AAA"
            />

            <Text style={styles.inputLabel}>New Password</Text>
            <TextInput 
              secureTextEntry 
              style={styles.input} 
              placeholder="Enter new password"
              value={newPassword}
              onChangeText={setNewPassword}
              placeholderTextColor="#AAA"
            />

            <Text style={styles.inputLabel}>Confirm New Password</Text>
            <TextInput 
              secureTextEntry 
              style={styles.input} 
              placeholder="Confirm new password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholderTextColor="#AAA"
            />

            <View style={styles.modalBtnRow}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setPasswordModalVisible(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleUpdatePassword} disabled={loading}>
                {loading ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.saveBtnText}>Update</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* =============================================================
          📱 MODAL 2: DELETE ACCOUNT POP-UP
          ============================================================= */}
      <Modal visible={deleteModalVisible} animationType="fade" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={[styles.modalHeading, { color: '#FF3B30' }]}>Confirm Account Deletion</Text>
            <Text style={styles.deleteWarningText}>To securely delete your account, please enter your current password below to confirm this action.</Text>
            
            <TextInput 
              secureTextEntry 
              style={styles.input} 
              placeholder="Enter your password"
              value={deletePassword}
              onChangeText={setDeletePassword}
              placeholderTextColor="#AAA"
            />

            <View style={styles.modalBtnRow}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setDeleteModalVisible(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.saveBtn, { backgroundColor: '#FF3B30' }]} onPress={handleRealDeleteAccount} disabled={loading}>
                {loading ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.saveBtnText}>Delete Forever</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F8F9FB' },
  container: { flex: 1, paddingHorizontal: 20 },
  header: { paddingTop: 60, paddingHorizontal: 20, paddingBottom: 15, backgroundColor: '#fff', flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  backBtn: { width: 40, height: 40, backgroundColor: '#F5F5F5', borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#1A1A1A' },
  statusCard: { flexDirection: 'row', backgroundColor: '#FFF', padding: 16, borderRadius: 20, marginTop: 20, marginBottom: 10, borderWidth: 1, borderColor: '#EAE6FF', alignItems: 'center' },
  statusIconBox: { width: 48, height: 48, borderRadius: 14, backgroundColor: '#EAE6FF', justifyContent: 'center', alignItems: 'center' },
  statusTextBox: { flex: 1, marginLeft: 15 },
  statusTitle: { fontSize: 16, fontWeight: '700', color: '#1A1A1A' },
  statusDesc: { fontSize: 12, color: '#666', marginTop: 3, lineHeight: 18 },
  section: { backgroundColor: '#fff', padding: 20, borderRadius: 20, marginTop: 15, borderWidth: 1, borderColor: '#F0F0F0' },
  sectionTitle: { fontSize: 11, fontWeight: 'bold', color: '#B2BEC3', marginBottom: 15, textTransform: 'uppercase', letterSpacing: 0.5 },
  rowLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  rowLabel: { fontSize: 14, color: '#333', fontWeight: '500', marginLeft: 12 },
  rowSubLabel: { fontSize: 11, color: '#888', marginLeft: 12, marginTop: 2, lineHeight: 16 },
  rowValue: { fontSize: 14, color: '#888', fontWeight: '500' },
  actionLabel: { fontSize: 14, color: '#333', fontWeight: '600', marginLeft: 12 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 0.5, borderBottomColor: '#F1F2F6' },
  actionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 15, borderBottomWidth: 0.5, borderBottomColor: '#F1F2F6' },
  toggleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: '#FFF', padding: 25, borderRadius: 24, elevation: 5 },
  modalHeading: { fontSize: 20, fontWeight: 'bold', marginBottom: 15, color: '#1A1A1A' },
  inputLabel: { fontSize: 12, color: '#666', marginTop: 10, marginBottom: 5, fontWeight: '600' },
  input: { backgroundColor: '#F5F6FA', padding: 14, borderRadius: 12, fontSize: 15, borderWidth: 1, borderColor: '#EAEAEA', color: '#333' },
  modalBtnRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 25 },
  cancelBtn: { flex: 1, padding: 15, alignItems: 'center', borderRadius: 12, backgroundColor: '#F5F5F5', marginRight: 10 },
  cancelBtnText: { color: '#333', fontWeight: '600' },
  saveBtn: { flex: 1, padding: 15, alignItems: 'center', borderRadius: 12, backgroundColor: '#5A31F4' },
  saveBtnText: { color: '#FFF', fontWeight: '600' },
  deleteWarningText: { fontSize: 13, color: '#666', lineHeight: 18, marginBottom: 15 }
});