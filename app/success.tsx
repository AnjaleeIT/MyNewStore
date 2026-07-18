import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ScrollView, StatusBar, Alert } from 'react-native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

export default function SuccessScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  // --- PDF එක සාදා Download/Share කරන Function එක ---
  const handleDownloadInvoice = async () => {
    const htmlContent = `
      <html>
        <body style="font-family: sans-serif; padding: 50px;">
          <h1 style="text-align: center; color: #5209e3;">LeeStyle Store</h1>
          <h2 style="text-align: center;">Order Receipt</h2>
          <hr />
          <p><strong>Customer:</strong> ${params.name}</p>
          <p><strong>Status:</strong> Confirmed</p>
          <p><strong>Method:</strong> ${params.method === 'card' ? 'Credit Card' : 'Cash on Delivery'}</p>
          <hr />
          <h3 style="text-align: right;">Total Paid: Rs. ${params.amount}</h3>
          <p style="text-align: center; margin-top: 50px; color: #888;">Thank you for your order!</p>
        </body>
      </html>
    `;

    try {
      const { uri } = await Print.printToFileAsync({ html: htmlContent });
      await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
    } catch (error) {
      Alert.alert("Error", "Could not generate invoice.");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <ScrollView contentContainerStyle={styles.content}>
        
        <View style={styles.iconCircle}>
          <Ionicons name="checkmark-done" size={60} color="#fff" />
        </View>
        
        <Text style={styles.successTitle}>Order Successful!</Text>
        <Text style={styles.successDesc}>Thank you, {params.name}! Your order has been placed and a confirmation email will be sent shortly.</Text>

        <View style={styles.invoiceCard}>
          <Text style={styles.invoiceHeader}>Order Receipt</Text>
          <View style={styles.divider} />
          
          <View style={styles.row}>
            <Text style={styles.label}>Order Status</Text>
            <Text style={[styles.value, {color: '#00ce97'}]}>Confirmed</Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.label}>Payment Method</Text>
            <Text style={styles.value}>{params.method === 'card' ? 'Credit Card' : 'Cash on Delivery'}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.row}>
            <Text style={styles.totalLabel}>Total Paid</Text>
            <Text style={styles.totalValue}>Rs. {params.amount}</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.homeBtn} onPress={() => router.replace('/')}>
          <Text style={styles.homeBtnText}>Continue Shopping</Text>
        </TouchableOpacity>
        
        {/* මෙතන handleDownloadInvoice function එක සම්බන්ධ කළා */}
        <TouchableOpacity style={styles.printBtn} onPress={handleDownloadInvoice}>
          <Ionicons name="download-outline" size={20} color="#5209e3" />
          <Text style={styles.printBtnText}>Download Invoice (PDF)</Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FD' },
  content: { alignItems: 'center', padding: 30, paddingTop: 60 },
  iconCircle: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#00ce97', justifyContent: 'center', alignItems: 'center', marginBottom: 25, elevation: 5 },
  successTitle: { fontSize: 26, fontWeight: '900', color: '#1A1A1A' },
  successDesc: { textAlign: 'center', color: '#888', marginTop: 12, lineHeight: 22, paddingHorizontal: 10 },
  invoiceCard: { backgroundColor: '#fff', width: '100%', borderRadius: 30, padding: 25, marginTop: 40, elevation: 3, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 15 },
  invoiceHeader: { fontSize: 18, fontWeight: '800', textAlign: 'center', color: '#1A1A1A', marginBottom: 5 },
  divider: { height: 1, backgroundColor: '#F1F4F9', marginVertical: 20 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
  label: { color: '#888', fontWeight: '600', fontSize: 14 },
  value: { color: '#1A1A1A', fontWeight: '700', fontSize: 14 },
  totalLabel: { fontSize: 17, fontWeight: '800', color: '#1A1A1A' },
  totalValue: { fontSize: 22, fontWeight: '900', color: '#5209e3' },
  homeBtn: { backgroundColor: '#5209e3', width: '100%', height: 60, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginTop: 40, elevation: 5 },
  homeBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  printBtn: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 25 },
  printBtnText: { color: '#5209e3', fontWeight: '700', fontSize: 14 }
});