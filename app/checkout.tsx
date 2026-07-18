import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import React, { useState, useCallback } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  TextInput,
  StatusBar,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useCart } from './context/CartContext'; 
import { supabase } from '../supabaseConfig'; 

export default function CheckoutScreen() {
  const router = useRouter();
  const { cart, clearCart, totalPrice } = useCart();
  
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('card');
  
  // 💡 NEW: කාඩ් විස්තර සඳහා නව States
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCVV, setCardCVV] = useState('');

  const [loadingProfile, setLoadingProfile] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const deliveryFee = 450;
  const finalAmount = totalPrice + deliveryFee;

  useFocusEffect(
    useCallback(() => {
      fetchUserProfileData();
    }, [])
  );

  const fetchUserProfileData = async () => {
    try {
      setLoadingProfile(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        let { data, error } = await supabase
          .from('profiles')
          .select('full_name, phone_number')
          .eq('id', user.id)
          .single();

        if (!error && data) {
          if (data.full_name) setName(data.full_name);
          if (data.phone_number) setPhone(data.phone_number);
        }
      }
    } catch (err) {
      console.log("Error loading profile details on checkout:", err);
    } finally {
      setLoadingProfile(false);
    }
  };

  const handlePlaceOrder = async () => {
    if (!name.trim() || !phone.trim() || !address.trim()) {
      Alert.alert("Missing Details", "Please fill in all delivery information.");
      return;
    }

    // 💡 Card එක තෝරාගෙන කාඩ් විස්තර හිස්ව තිබේ නම් Validation එකක් දීම
    if (paymentMethod === 'card') {
      if (!cardNumber.trim() || !cardExpiry.trim() || !cardCVV.trim()) {
        Alert.alert("Card Details Required", "Please fill in all your credit/debit card information.");
        return;
      }
    }

    setIsSubmitting(true);

    try {
      const orderData = {
        customer_name: name.trim(),
        phone: phone.trim(),
        address: address.trim(),
        items: JSON.stringify(cart), 
        total_amount: Number(finalAmount),
        payment_method: paymentMethod,
        status: 'Pending',
        payment_status: paymentMethod === 'card' ? 'Paid' : 'COD'
      };

      const { data, error } = await supabase
        .from('orders')
        .insert([orderData])
        .select();

      if (error) {
        console.error("Supabase Error:", error);
        throw error;
      }

      clearCart();
      router.replace({
        pathname: '/success',
        params: { name, amount: finalAmount.toLocaleString(), method: paymentMethod }
      });
    } catch (err: any) {
      Alert.alert("Order Failed", err.message || "Something went wrong.");
    } finally {
      setIsSubmitting(false);
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
        <Text style={styles.headerTitle}>Review & Pay</Text>
        <View style={{ width: 42 }} /> 
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* Delivery Details Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Delivery Details</Text>
          {loadingProfile ? (
            <ActivityIndicator size="small" color="#5F1BE9" style={{ marginVertical: 20 }} />
          ) : (
            <View style={styles.formGroup}>
              <Text style={styles.inputLabel}>Full Name *</Text>
              <TextInput placeholder="Enter your full name" style={styles.roundedInput} value={name} onChangeText={setName} placeholderTextColor="#94A3B8" />

              <Text style={styles.inputLabel}>Phone Number *</Text>
              <TextInput placeholder="e.g. 07XXXXXXXX" style={styles.roundedInput} keyboardType="phone-pad" maxLength={10} value={phone} onChangeText={setPhone} placeholderTextColor="#94A3B8" />

              <Text style={styles.inputLabel}>Shipping Address *</Text>
              <TextInput placeholder="Enter your delivery address" style={[styles.roundedInput, styles.textAreaInput]} multiline numberOfLines={3} value={address} onChangeText={setAddress} placeholderTextColor="#94A3B8" textAlignVertical="top" />
            </View>
          )}
        </View>

        {/* Payment Method Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment Method</Text>
          <View style={styles.paymentCard}>
            <TouchableOpacity style={styles.methodRow} onPress={() => setPaymentMethod('card')} activeOpacity={0.8}>
              <Ionicons name={paymentMethod === 'card' ? "radio-button-on" : "radio-button-off"} size={22} color="#5F1BE9" />
              <Text style={[styles.methodText, paymentMethod === 'card' && styles.activeMethodText]}>Credit / Debit Card</Text>
            </TouchableOpacity>
            
            {/* 💡 NEW: Card එක තෝරාගත් විට පමණක් පෙන්වන පට්ට Clean Card Inputs ටික */}
            {paymentMethod === 'card' && (
              <View style={styles.cardDetailsContainer}>
                <Text style={styles.inputLabel}>Card Number</Text>
                <TextInput 
                  placeholder="0000 0000 0000 0000" 
                  style={styles.roundedInput} 
                  keyboardType="numeric" 
                  maxLength={16}
                  value={cardNumber}
                  onChangeText={setCardNumber}
                  placeholderTextColor="#CBD5E1"
                />
                
                <View style={styles.cardRowInline}>
                  <View style={{ flex: 1, marginRight: 10 }}>
                    <Text style={styles.inputLabel}>Expiry Date</Text>
                    <TextInput 
                      placeholder="MM/YY" 
                      style={styles.roundedInput} 
                      keyboardType="numeric" 
                      maxLength={5}
                      value={cardExpiry}
                      onChangeText={setCardExpiry}
                      placeholderTextColor="#CBD5E1"
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.inputLabel}>CVV / CVC</Text>
                    <TextInput 
                      placeholder="123" 
                      style={styles.roundedInput} 
                      keyboardType="numeric" 
                      secureTextEntry={true}
                      maxLength={3}
                      value={cardCVV}
                      onChangeText={setCardCVV}
                      placeholderTextColor="#CBD5E1"
                    />
                  </View>
                </View>
              </View>
            )}

            <TouchableOpacity style={[styles.methodRow, { borderBottomWidth: 0 }]} onPress={() => setPaymentMethod('cash')} activeOpacity={0.8}>
              <Ionicons name={paymentMethod === 'cash' ? "radio-button-on" : "radio-button-off"} size={22} color="#5F1BE9" />
              <Text style={[styles.methodText, paymentMethod === 'cash' && styles.activeMethodText]}>Cash on Delivery</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Order Summary Dark Card */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryCardTitle}>Order Summary</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal</Text>
            <Text style={styles.summaryValue}>Rs. {totalPrice.toLocaleString()}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Delivery Charge</Text>
            <Text style={styles.summaryValue}>Rs. {deliveryFee.toLocaleString()}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.summaryRow}>
            <Text style={styles.totalLabel}>Total Amount</Text>
            <Text style={styles.totalPrice}>Rs. {finalAmount.toLocaleString()}</Text>
          </View>
        </View>
      </ScrollView>

      {/* Confirm Button */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.confirmBtn} onPress={handlePlaceOrder} disabled={isSubmitting} activeOpacity={0.9}>
          {isSubmitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Text style={styles.confirmBtnText}>Confirm Order</Text>
              <Ionicons name="arrow-forward" size={18} color="#fff" style={{ marginLeft: 8 }} />
            </>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' }, 
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderColor: '#F1F5F9' },
  backBtn: { width: 38, height: 38, borderRadius: 12, backgroundColor: '#F8FAFC', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#E2E8F0' },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#0F172A' },
  scrollContent: { padding: 16, paddingBottom: 30 },
  section: { marginBottom: 22 },
  sectionTitle: { fontSize: 15, fontWeight: '800', color: '#0F172A', marginBottom: 12, letterSpacing: -0.2 },
  formGroup: { backgroundColor: '#FFFFFF', borderRadius: 24, padding: 18, borderWidth: 1, borderColor: '#F1F5F9' },
  inputLabel: { fontSize: 12, fontWeight: '700', color: '#64748B', marginBottom: 6, marginTop: 10 },
  roundedInput: { backgroundColor: '#FFFFFF', borderWidth: 1.5, borderColor: '#E2E8F0', borderRadius: 14, height: 46, paddingHorizontal: 14, fontSize: 14, color: '#1E293B', fontWeight: '500', marginBottom: 4 },
  textAreaInput: { height: 75, paddingTop: 10, paddingBottom: 10 },
  
  // Payment Method Layout
  paymentCard: { backgroundColor: '#FFFFFF', borderRadius: 24, paddingHorizontal: 6, borderWidth: 1, borderColor: '#F1F5F9' },
  methodRow: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  methodText: { marginLeft: 12, fontWeight: '600', color: '#64748B', fontSize: 14 },
  activeMethodText: { color: '#0F172A', fontWeight: '700' },
  
  // 💡 NEW: CARD DETAILS CONTAINER STYLES
  cardDetailsContainer: { backgroundColor: '#F8FAFC', padding: 14, borderRadius: 18, marginHorizontal: 10, marginBottom: 10, borderWidth: 1, borderColor: '#E2E8F0' },
  cardRowInline: { flexDirection: 'row', justifyContent: 'space-between' },

  summaryCard: { backgroundColor: '#0F172A', borderRadius: 24, padding: 22 },
  summaryCardTitle: { color: '#FFFFFF', fontSize: 14, fontWeight: '800', marginBottom: 14 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginVertical: 5 },
  summaryLabel: { color: '#94A3B8', fontSize: 13, fontWeight: '600' },
  summaryValue: { color: '#FFFFFF', fontWeight: '700', fontSize: 14 },
  divider: { height: 1, backgroundColor: '#334155', marginVertical: 12 },
  totalLabel: { color: '#FFFFFF', fontSize: 15, fontWeight: '800' },
  totalPrice: { color: '#FFFFFF', fontSize: 18, fontWeight: '900' },
  footer: { paddingHorizontal: 16, paddingVertical: 16, backgroundColor: '#FFFFFF', borderTopLeftRadius: 28, borderTopRightRadius: 28, borderWidth: 1, borderColor: '#F1F5F9', elevation: 10, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 10 },
  confirmBtn: { backgroundColor: '#5F1BE9', flexDirection: 'row', height: 54, borderRadius: 16, justifyContent: 'center', alignItems: 'center', shadowColor: '#5F1BE9', shadowOpacity: 0.15, shadowRadius: 8, elevation: 2 },
  confirmBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '800' }
});