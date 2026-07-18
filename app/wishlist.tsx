import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, Image, StyleSheet, TouchableOpacity, ActivityIndicator, SafeAreaView } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { supabase } from '../supabaseConfig';

interface Product {
  id: string;
  name: string;
  price: number;
  img: string;
  category: string;
}

export default function WishlistScreen() {
  const [wishlistItems, setWishlistItems] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useFocusEffect(
    useCallback(() => {
      fetchWishlist();
    }, [])
  );

  const fetchWishlist = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // 1. 'wishlist' ටේබල් එකෙන් මේ යූසර් ඇඩ් කරපු product_ids ටික ගන්නවා
      const { data: wishlistData, error: wishlistError } = await supabase
        .from('wishlist')
        .select('product_id')
        .eq('user_id', user.id);

      if (wishlistError) throw wishlistError;

      if (wishlistData && wishlistData.length > 0) {
        const productIds = wishlistData.map(item => item.product_id);

        // 2. ඒ IDs වලට අදාළ සම්පූර්ණ දත්ත 'products' ටේබල් එකෙන් බාගන්නවා
        const { data: productData, error: productError } = await supabase
          .from('products')
          .select('*')
          .in('id', productIds);

        if (productError) throw productError;
        if (productData) setWishlistItems(productData as Product[]);
      } else {
        setWishlistItems([]); 
      }
    } catch (err) {
      console.error("Error fetching wishlist:", err);
    } finally {
      setLoading(false);
    }
  };

  const removeFromWishlist = async (productId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('wishlist')
        .delete()
        .eq('user_id', user.id)
        .eq('product_id', productId);

      if (!error) {
        setWishlistItems(prev => prev.filter(item => item.id !== productId));
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color="#1E293B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Wishlist</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* List Content */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="small" color="#5F1BE9" />
        </View>
      ) : (
        <FlatList
          data={wishlistItems}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16 }}
          ListEmptyComponent={() => (
            <View style={styles.emptyContainer}>
              <Ionicons name="heart-dislike-outline" size={50} color="#94A3B8" />
              <Text style={styles.emptyText}>Your wishlist is empty</Text>
            </View>
          )}
          renderItem={({ item }) => (
            <View style={styles.itemCard}>
              <Image source={{ uri: item.img }} style={styles.itemImg} />
              <View style={styles.itemDetails}>
                <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
                <Text style={styles.itemCat}>{item.category}</Text>
                <Text style={styles.itemPrice}>Rs. {item.price.toLocaleString()}</Text>
              </View>
              <TouchableOpacity onPress={() => removeFromWishlist(item.id)} style={styles.deleteBtn}>
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
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, backgroundColor: '#FFF', borderBottomWidth: 1, borderColor: '#F1F5F9' },
  backBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8FAFC', borderRadius: 12 },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#0F172A' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyContainer: { alignItems: 'center', marginTop: 150, gap: 10 },
  emptyText: { color: '#94A3B8', fontSize: 14, fontWeight: '600' },
  itemCard: { flexDirection: 'row', backgroundColor: '#FFF', borderRadius: 16, padding: 12, marginBottom: 12, alignItems: 'center', borderWidth: 1, borderColor: '#F1F5F9' },
  itemImg: { width: 70, height: 70, borderRadius: 12, backgroundColor: '#F8FAFC' },
  itemDetails: { flex: 1, marginLeft: 14, justifyContent: 'center' },
  itemName: { fontSize: 14, fontWeight: '700', color: '#1E293B' },
  itemCat: { fontSize: 11, color: '#94A3B8', marginTop: 2, fontWeight: '600' },
  itemPrice: { fontSize: 14, fontWeight: '800', color: '#0F172A', marginTop: 6 },
  deleteBtn: { padding: 10, backgroundColor: '#FEF2F2', borderRadius: 12 }
});