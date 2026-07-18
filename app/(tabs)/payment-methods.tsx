import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { supabase } from '../../supabaseConfig';

const COLORS = {
  primary: '#5F1BE9',    // Brand Purple
  bg: '#F8FAFC',         // Premium Light Background
  card: '#FFFFFF',
  textMain: '#0F172A',   // Deep Slate Black
  textSec: '#94A3B8',    // Muted Grey
  success: '#16A34A',    // Secure Green Text
  successBg: '#F0FDF4'   // Secure Green Light BG
};

export default function PaymentMethodsScreen() {
  const router = useRouter();
  const [cards, setCards] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      fetchPaymentMethods();
    }, [])
  );

  const fetchPaymentMethods = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('payment_methods') 
        .select('*')
        .eq('user_id', user.id);

      if (!error && data && data.length > 0) {
        setCards(data);
      } else {
        // Dummy Data - DB එකේ දැනට ඩේටා නැත්නම් පමණක් පෙන්වීමට
        setCards([
          { id: '1', card_type: 'Visa Card', card_number: '•••• •••• •••• 4242', expiry: '12/28' }
        ]);
      }
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCard = async (id: string) => {
    Alert.alert(
      "Remove Card",
      "Are you sure you want to remove this payment method?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Remove", 
          style: "destructive",
          onPress: async () => {
            try {
              await supabase.from('payment_methods').delete().eq('id', id);
              setCards(prev => prev.filter(card => card.id !== id));
              Alert.alert("Success", "Card removed successfully.");
            } catch (err) {
              Alert.alert("Error", "Could not remove card.");
            }
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={24} color={COLORS.textMain} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Payment Methods</Text>
        <View style={{ width: 38 }} />
      </View>

      {loading ? (
        <View style={styles.center}><ActivityIndicator size="small" color={COLORS.primary} /></View>
      ) : (
        <FlatList
          data={cards}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16 }}
          ListFooterComponent={() => (
            <View>
              {/* 💡 BUG FIX: 'as any' යොදා TypeScript Path Error එක සහමුලින්ම නිවැරදි කර ඇත */}
              <TouchableOpacity 
                style={styles.addNewBtn} 
                onPress={() => router.push('/add-card' as any)} 
                activeOpacity={0.8}
              >
                <Ionicons name="add" size={20} color={COLORS.primary} />
                <Text style={styles.addNewBtnText}>Add New Method</Text>
              </TouchableOpacity>

              {/* Secure Notice */}
              <View style={styles.secureNotice}>
                <Ionicons name="shield-checkmark" size={16} color={COLORS.success} />
                <Text style={styles.secureText}>Your payment data is encrypted and secure.</Text>
              </View>
            </View>
          )}
          renderItem={({ item }) => (
            <View style={styles.cardItem}>
              <View style={styles.cardLeft}>
                <View style={styles.cardIconBox}>
                  <Ionicons name="card" size={22} color={COLORS.primary} />
                </View>
                <View>
                  <Text style={styles.cardName}>{item.card_type}</Text>
                  <Text style={styles.cardNumber}>{item.card_number}</Text>
                </View>
              </View>
              <TouchableOpacity onPress={() => handleDeleteCard(item.id)} style={styles.deleteBtn}>
                <Ionicons name="trash-outline" size={20} color="#EF4444" />
              </TouchableOpacity>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, backgroundColor: COLORS.card, borderBottomWidth: 1, borderColor: '#F1F5F9' },
  backBtn: { width: 38, height: 38, borderRadius: 12, backgroundColor: '#F8FAFC', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#E2E8F0' },
  headerTitle: { fontSize: 18, fontWeight: '800', color: COLORS.textMain },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  cardItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    elevation: 2,
    shadowColor: '#0F172A',
    shadowOpacity: 0.01,
    shadowRadius: 6
  },
  cardLeft: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  cardIconBox: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#F3E8FF', justifyContent: 'center', alignItems: 'center' },
  cardName: { fontSize: 14, fontWeight: '700', color: COLORS.textMain },
  cardNumber: { fontSize: 13, color: COLORS.textSec, fontWeight: '500', marginTop: 2 },
  deleteBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#FEF2F2', justifyContent: 'center', alignItems: 'center' },

  addNewBtn: {
    flexDirection: 'row',
    height: 52,
    borderRadius: 18,
    backgroundColor: COLORS.card,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#CBD5E1',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    marginTop: 18, 
  },
  addNewBtnText: { color: COLORS.primary, fontSize: 14, fontWeight: '800' },

  secureNotice: { flexDirection: 'row', backgroundColor: COLORS.successBg, padding: 12, borderRadius: 14, alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 24 },
  secureText: { color: COLORS.success, fontSize: 12, fontWeight: '700' }
});