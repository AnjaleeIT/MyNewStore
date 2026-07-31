import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  TextInput, 
  Alert,
  Linking,
  ActivityIndicator,
  SafeAreaView 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { supabase } from '../supabaseConfig'; 

export default function HelpSupportScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);

 
  useEffect(() => {
    async function checkUser() {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) {
        console.error("Session fetch error:", error);
      }
      if (session?.user) {
        setCurrentUser(session.user);
        console.log("Logged in user email:", session.user.email);
      } else {
        console.log("No active user session found!");
      }
    }
    checkUser();
  }, []);

  const toggleFaq = (index: number) => {
    setActiveFaq(activeFaq === index ? null : index);
  };

  const handleCallSupport = () => {
    Linking.openURL('tel:+94771234567');
  };

  const handleWhatsAppSupport = () => {
    const whatsappUrl = 'https://wa.me/94771234567?text=Hello LeeStyle Support, I need help.';
    Linking.openURL(whatsappUrl).catch(() => {
      Alert.alert("Error", "WhatsApp is not installed.");
    });
  };

  const handleSubmitInquiry = async () => {
    if (!subject.trim() || !message.trim()) {
      Alert.alert("Validation Error", "Please fill in both subject and message fields.");
      return;
    }

    setLoading(true);
    try {
     
      const userId = currentUser?.id || null;
      const userEmail = currentUser?.email || 'anonymous@leestyle.com';

      const { data, error } = await supabase
        .from('support_tickets') 
        .insert([
          { 
            user_id: userId, 
            email: userEmail,
            subject: subject.trim(), 
            message: message.trim(),
            status: 'pending'
          }
        ])
        .select();

      if (error) {
       
        Alert.alert("Supabase Database Error", `Code: ${error.code}\nMessage: ${error.message}`);
        console.error("Database Error:", error);
        setLoading(false);
        return;
      }

      Alert.alert("Success ", "Your ticket has been submitted successfully!");
      setSubject('');
      setMessage('');

    } catch (err: any) {
      Alert.alert("Catch Error", err.message || "An unexpected error occurred.");
      console.error("Catch Error Details:", err);
    } finally {
      setLoading(false);
    }
  };

  const faqData = [
    {
      q: "How long does the delivery take?",
      a: "Standard delivery within Colombo takes 1-2 business days. Outstation deliveries usually take 3-5 business days."
    },
    {
      q: "What is your return & exchange policy?",
      a: "You can exchange any item within 7 days of delivery, provided it is unworn, unwashed, and has all original tags attached."
    },
    {
      q: "Can I pay using Cash on Delivery (COD)?",
      a: "Yes, we support Cash on Delivery island-wide, as well as secure online card payments."
    }
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color="black" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Help & Support</Text>
      </View>

      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        
        <Text style={styles.sectionTitle}>Contact Us Directly</Text>
        <View style={styles.connectGrid}>
          <TouchableOpacity style={styles.connectCard} onPress={handleWhatsAppSupport}>
            <View style={[styles.iconCircle, { backgroundColor: '#E8F5E9' }]}>
              <Ionicons name="logo-whatsapp" size={26} color="#4CAF50" />
            </View>
            <Text style={styles.connectLabel}>WhatsApp</Text>
            <Text style={styles.connectSub}>Chat live now</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.connectCard} onPress={handleCallSupport}>
            <View style={[styles.iconCircle, { backgroundColor: '#EAE6FF' }]}>
              <Ionicons name="call-outline" size={26} color="#5A31F4" />
            </View>
            <Text style={styles.connectLabel}>Call Hotline</Text>
            <Text style={styles.connectSub}>24/7 Support</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
        <View style={styles.faqContainer}>
          {faqData.map((item, index) => (
            <TouchableOpacity 
              key={index} 
              style={styles.faqRow} 
              activeOpacity={0.7} 
              onPress={() => toggleFaq(index)}
            >
              <View style={styles.faqHeader}>
                <Text style={styles.faqQuestion}>{item.q}</Text>
                <Ionicons 
                  name={activeFaq === index ? "chevron-up" : "chevron-down"} 
                  size={18} 
                  color="#666" 
                />
              </View>
              {activeFaq === index && (
                <Text style={styles.faqAnswer}>{item.a}</Text>
              )}
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.sectionTitle}>Send Us a Message</Text>
        <View style={styles.formContainer}>
          <Text style={styles.inputLabel}>Subject</Text>
          <TextInput 
            style={styles.input} 
            placeholder="e.g., Delivery Delay, Size Issue"
            value={subject}
            onChangeText={setSubject}
            placeholderTextColor="#AAA"
          />

          <Text style={styles.inputLabel}>Message</Text>
          <TextInput 
            style={[styles.input, styles.textArea]} 
            placeholder="Describe your issue in detail..."
            multiline
            numberOfLines={4}
            value={message}
            onChangeText={setMessage}
            placeholderTextColor="#AAA"
            textAlignVertical="top"
          />

          <TouchableOpacity style={styles.submitBtn} onPress={handleSubmitInquiry} disabled={loading}>
            {loading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <Text style={styles.submitBtnText}>Submit Ticket</Text>
                <Ionicons name="paper-plane-outline" size={18} color="#FFF" style={{ marginLeft: 8 }} />
              </>
            )}
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F8F9FB' },
  container: { flex: 1, paddingHorizontal: 20 },
  header: { paddingTop: 60, paddingHorizontal: 20, paddingBottom: 15, backgroundColor: '#fff', flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  backBtn: { width: 40, height: 40, backgroundColor: '#F5F5F5', borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#1A1A1A' },
  sectionTitle: { fontSize: 12, fontWeight: 'bold', color: '#B2BEC3', marginTop: 25, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 },
  connectGrid: { flexDirection: 'row', justifyContent: 'space-between' },
  connectCard: { flex: 0.48, backgroundColor: '#FFF', padding: 16, borderRadius: 20, alignItems: 'center', borderWidth: 1, borderColor: '#F0F0F0' },
  iconCircle: { width: 52, height: 52, borderRadius: 26, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  connectLabel: { fontSize: 14, fontWeight: '700', color: '#1A1A1A' },
  connectSub: { fontSize: 11, color: '#888', marginTop: 2 },
  faqContainer: { backgroundColor: '#FFF', borderRadius: 20, paddingHorizontal: 16, borderWidth: 1, borderColor: '#F0F0F0' },
  faqRow: { paddingVertical: 16, borderBottomWidth: 0.5, borderBottomColor: '#F1F2F6' },
  faqHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  faqQuestion: { fontSize: 14, fontWeight: '600', color: '#333', flex: 0.95 },
  faqAnswer: { fontSize: 13, color: '#666', marginTop: 10, lineHeight: 18 },
  formContainer: { backgroundColor: '#FFF', padding: 20, borderRadius: 20, borderWidth: 1, borderColor: '#F0F0F0' },
  inputLabel: { fontSize: 12, color: '#666', marginBottom: 6, fontWeight: '600' },
  input: { backgroundColor: '#F5F6FA', padding: 14, borderRadius: 12, fontSize: 14, borderWidth: 1, borderColor: '#EAEAEA', color: '#333', marginBottom: 15 },
  textArea: { height: 100 },
  submitBtn: { backgroundColor: '#5A31F4', padding: 15, borderRadius: 12, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 5 },
  submitBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 15 }
});
