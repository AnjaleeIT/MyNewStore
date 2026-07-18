import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import React, { useState, useEffect, useCallback } from 'react';
import {
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  StatusBar,
  ActivityIndicator,
  Dimensions,
  Alert
} from 'react-native';
import { supabase } from '../../supabaseConfig';
import { useCart } from '../context/CartContext';

const { width } = Dimensions.get('window');

interface Product {
  id: string;
  name: string;
  price: number;
  old_price?: number;
  img: string;
  category: string;
  tag?: string;
}

const categories = ['All', "Men's Wear", "Ladies' Wear", 'Electronics', 'Shoes', 'Baby Items'];

export default function HomeScreen() {
  const [activeCategory, setActiveCategory] = useState('All');
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [userAvatar, setUserAvatar] = useState<string | null>(null);
  const [favorites, setFavorites] = useState<string[]>([]); 

  const router = useRouter();
  const { cart } = useCart();

  useEffect(() => {
    fetchProducts();
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchUserProfilePic();
      fetchUserWishlist();
    }, [])
  );

  const fetchUserProfilePic = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        let { data } = await supabase.from('profiles').select('avatar_url').eq('id', user.id).single();
        if (data && data.avatar_url) {
          setUserAvatar(data.avatar_url);
        }
      }
    } catch (err) {
      console.log("Error fetching avatar on home:", err);
    }
  };

  const fetchUserWishlist = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user;
      if (!user) return;

      const { data, error } = await supabase
        .from('wishlist')
        .select('product_id')
        .eq('user_id', user.id);

      if (!error && data) {
        const ids = data.map((item: any) => item.product_id);
        setFavorites(ids);
      }
    } catch (err) {
      console.log("Error fetching wishlist IDs:", err);
    }
  };

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from('products').select('*');
      if (error) throw error;
      if (data) setProducts(data as Product[]);
    } catch (err) {
      console.error("Fetch Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const toggleFavorite = async (productId: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user;

      if (!user) {
        Alert.alert("Login Required", "Please login to add items to wishlist.");
        return;
      }

      const isAlreadyFav = favorites.includes(productId);
      if (isAlreadyFav) {
        setFavorites((prev) => prev.filter((id) => id !== productId));
      } else {
        setFavorites((prev) => [...prev, productId]);
      }

      if (isAlreadyFav) {
        await supabase.from('wishlist').delete().eq('user_id', user.id).eq('product_id', productId);
      } else {
        await supabase.from('wishlist').insert([{ user_id: user.id, product_id: productId }]);
      }
    } catch (err) {
      console.error("Wishlist Toggle Error:", err);
    }
  };

  const filteredProducts = products.filter((item) => 
    activeCategory === 'All' || item.category === activeCategory
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Aligned Header Logo Right Accent */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.profileTouch} onPress={() => router.push('/settings')} activeOpacity={0.8}>
          <Image 
            source={{ uri: userAvatar || 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png' }} 
            style={styles.homeAvatar} 
          />
          <View style={styles.welcomeTextColumn}>
            <Text style={styles.welcomeTitle}>Hello Imasha,</Text>
            <Text style={styles.subTitleText}>Explore Collections</Text>
          </View>
        </TouchableOpacity>
        
        <View style={styles.logoRow}>
          <Text style={styles.brandLee}>Lee</Text>
          <Text style={styles.brandStyle}>Style</Text>
          <View style={styles.logoDot} />
        </View>

        <View style={styles.headerRightActions}>
          <TouchableOpacity style={styles.actionBtn} onPress={() => router.push('/wishlist')} activeOpacity={0.7}>
            <Ionicons name="heart-outline" size={22} color="#1E293B" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionBtn} onPress={() => router.push('/cart')} activeOpacity={0.7}>
            <Ionicons name="bag-handle-outline" size={21} color="#1E293B" />
            {cart.length > 0 && (
              <View style={styles.cartBadge}>
                <Text style={styles.cartBadgeText}>{cart.length}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.mainScroll}>
        {/* Premium Banner */}
        <View style={styles.bannerBox}>
          <Image
            source={{ uri: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800' }}
            style={styles.bannerImg}
          />
          <View style={styles.bannerOverlay}>
            <View style={styles.promoTag}><Text style={styles.promoText}>New Collection</Text></View>
            <Text style={styles.bannerTitle}>Elevate Your Everyday Lifestyle</Text>
            <TouchableOpacity style={styles.bannerBtn} activeOpacity={0.9}>
              <Text style={styles.bannerBtnText}>Shop Now</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Categories */}
        <View style={styles.catHeader}>
          <Text style={styles.sectionTitle}>Categories</Text>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.catScroll}>
          {categories.map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[styles.catBtn, activeCategory === cat && styles.catBtnActive]}
              onPress={() => setActiveCategory(cat)}
              activeOpacity={0.8}
            >
              <Text style={[styles.catLabel, activeCategory === cat && styles.catLabelActive]}>{cat}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Product Grid Section */}
        <View style={styles.productContainer}>
          {loading ? (
            <ActivityIndicator size="small" color="#5F1BE9" style={{ marginTop: 40 }} />
          ) : (
            <View style={styles.grid}>
              {filteredProducts.map((item) => {
                const isFavorite = favorites.includes(item.id);

                return (
                  <View key={item.id} style={styles.cardWrapper}>
                    <TouchableOpacity
                      style={styles.card}
                      onPress={() => router.push({ pathname: '/product-details', params: { ...item } as any })}
                      activeOpacity={0.95}
                    >
                      <View style={styles.imgBox}>
                        <Image source={{ uri: item.img }} style={styles.productImg} />
                        
                        <TouchableOpacity 
                          style={styles.favoriteBadge}
                          onPress={() => toggleFavorite(item.id)}
                          activeOpacity={0.7}
                        >
                          <Ionicons 
                            name={isFavorite ? "heart" : "heart-outline"} 
                            size={18} 
                            color={isFavorite ? "#EF4444" : "#64748B"} 
                          />
                        </TouchableOpacity>

                        {item.tag && (
                          <View style={styles.tagBadge}>
                            <Text style={styles.tagText}>{item.tag}</Text>
                          </View>
                        )}
                      </View>

                      <View style={styles.cardData}>
                        <Text style={styles.pName} numberOfLines={1}>{item.name}</Text>
                        <Text style={styles.pCat}>{item.category}</Text>
                        
                        <View style={styles.pFooter}>
                          <Text style={styles.pPrice}>Rs. {item.price.toLocaleString()}</Text>
                          <View style={styles.pAddBtn}>
                            <Ionicons name="add" size={16} color="#fff" />
                          </View>
                        </View>
                      </View>
                    </TouchableOpacity>
                  </View>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' }, 
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingTop: 16, paddingBottom: 16, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderColor: '#F1F5F9' },
  profileTouch: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1.5 },
  homeAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#F1F5F9', borderWidth: 1.5, borderColor: '#E2E8F0' },
  welcomeTextColumn: { flexDirection: 'column' },
  welcomeTitle: { fontSize: 13, color: '#1E293B', fontWeight: '800', letterSpacing: -0.2 },
  subTitleText: { fontSize: 11, color: '#94A3B8', fontWeight: '600', marginTop: 1 },
  logoRow: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'flex-end', flex: 1, marginRight: 12 },
  brandLee: { fontSize: 22, fontWeight: '900', color: '#0F172A', letterSpacing: -0.8 },
  brandStyle: { fontSize: 21, fontWeight: '600', color: '#5F1BE9', letterSpacing: -0.8 },
  logoDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: '#10B981', marginLeft: 2 },
  headerRightActions: { flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'flex-end' },
  actionBtn: { width: 38, height: 38, borderRadius: 12, backgroundColor: '#FFFFFF', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#E2E8F0' },
  cartBadge: { position: 'absolute', top: -4, right: -4, backgroundColor: '#5F1BE9', width: 17, height: 17, borderRadius: 8.5, justifyContent: 'center', alignItems: 'center', borderWidth: 1.5, borderColor: '#FFFFFF' },
  cartBadgeText: { color: '#FFFFFF', fontSize: 9, fontWeight: '900' },
  mainScroll: { paddingBottom: 120 },
  bannerBox: { marginHorizontal: 16, marginTop: 14, height: 170, borderRadius: 24, overflow: 'hidden', backgroundColor: '#0F172A' },
  bannerImg: { width: '100%', height: '100%', position: 'absolute', opacity: 0.85 },
  bannerOverlay: { flex: 1, padding: 20, justifyContent: 'center', backgroundColor: 'rgba(15, 23, 42, 0.3)' },
  promoTag: { backgroundColor: '#5F1BE9', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, alignSelf: 'flex-start' },
  promoText: { color: '#FFFFFF', fontSize: 10, fontWeight: '800', textTransform: 'uppercase' },
  bannerTitle: { color: '#FFFFFF', fontSize: 22, fontWeight: '900', marginTop: 10, width: '75%', lineHeight: 28, letterSpacing: -0.3 },
  bannerBtn: { backgroundColor: '#FFFFFF', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10, marginTop: 14, alignSelf: 'flex-start' },
  bannerBtnText: { color: '#0F172A', fontWeight: '800', fontSize: 12 },
  catHeader: { paddingHorizontal: 16, marginTop: 22 },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: '#0F172A', letterSpacing: -0.3 },
  catScroll: { paddingLeft: 16, paddingVertical: 10 },
  catBtn: { paddingHorizontal: 18, paddingVertical: 10, borderRadius: 14, backgroundColor: '#FFFFFF', marginRight: 8, borderWidth: 1, borderColor: '#E2E8F0' },
  catBtnActive: { backgroundColor: '#0F172A', borderColor: '#0F172A' },
  catLabel: { fontSize: 13, fontWeight: '700', color: '#64748B' },
  catLabelActive: { color: '#FFFFFF' },
  productContainer: { paddingHorizontal: 8, marginTop: 2 },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cardWrapper: { width: '50%', padding: 8 },
  card: { backgroundColor: '#FFFFFF', borderRadius: 20, overflow: 'hidden', borderWidth: 1, borderColor: '#F1F5F9', elevation: 3, shadowColor: '#0F172A', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8 },
  imgBox: { width: '100%', height: 180, backgroundColor: '#F8FAFC', position: 'relative' },
  productImg: { width: '100%', height: '100%', resizeMode: 'cover' },
  favoriteBadge: { position: 'absolute', top: 10, right: 10, backgroundColor: '#FFFFFF', width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center', elevation: 3, shadowColor: '#0F172A', shadowOpacity: 0.08, shadowRadius: 4 },
  tagBadge: { position: 'absolute', top: 10, left: 10, backgroundColor: '#10B981', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  tagText: { color: '#FFFFFF', fontSize: 9, fontWeight: '800', textTransform: 'uppercase' },
  cardData: { paddingHorizontal: 14, paddingVertical: 12 },
  pName: { fontSize: 14, fontWeight: '700', color: '#1E293B', letterSpacing: -0.1 },
  pCat: { fontSize: 11, color: '#94A3B8', fontWeight: '600', marginTop: 3 },
  pFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 },
  pPrice: { fontSize: 15, fontWeight: '800', color: '#5F1BE9' }, 
  pAddBtn: { backgroundColor: '#0F172A', width: 26, height: 26, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
});