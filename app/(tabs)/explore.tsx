import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  TextInput,
  StatusBar,
  Image,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { supabase } from '../../supabaseConfig';

const { width } = Dimensions.get('window');

const CARD_WIDTH = (width - 48) / 2; 

interface Product {
  id: string;
  name: string;
  price: number;
  img: string;
  category: string;
  tag?: string;
}

const categories = ['All', "Men's Wear", "Ladies' Wear", 'Electronics', 'Shoes', 'Baby Items'];

export default function ExploreScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchExploreProducts();
  }, []);

  const fetchExploreProducts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.from('products').select('*');
      if (!error && data) {
        setProducts(data as Product[]);
      }
    } catch (err) {
      console.log("Error loading explore products:", err);
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter((item) => {
    const matchesCategory = activeCategory === 'All' || item.category === activeCategory;
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

 
  const leftColumnProducts = filteredProducts.filter((_, index) => index % 2 === 0);
  const rightColumnProducts = filteredProducts.filter((_, index) => index % 2 !== 0);

  const renderProductCard = (item: Product) => (
    <TouchableOpacity
      key={item.id}
      style={styles.modernCard}
      onPress={() => router.push({ pathname: '/product-details', params: { ...item } as any })}
      activeOpacity={0.95}
    >
      <View style={styles.imgWrapper}>
        <Image source={{ uri: item.img }} style={styles.productImg} />
        {item.tag && (
          <View style={styles.premiumTag}>
            <Text style={styles.tagText}>{item.tag}</Text>
          </View>
        )}
      </View>

      <View style={styles.cardDetails}>
        <Text style={styles.pName} numberOfLines={1}>{item.name}</Text>
        <Text style={styles.pCat}>{item.category}</Text>
        <View style={styles.cardFooter}>
          <Text style={styles.pPrice}>Rs. {item.price.toLocaleString()}</Text>
          <View style={styles.arrowCircle}>
            <Ionicons name="arrow-forward" size={11} color="#FFFFFF" />
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Explore</Text>
        <Text style={styles.headerSubtitle}>Find your premium style match</Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBarBox}>
          <Ionicons name="search-outline" size={18} color="#94A3B8" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search products, brands, trends..."
            placeholderTextColor="#94A3B8"
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
          />
          <TouchableOpacity style={styles.filterInlineBtn} activeOpacity={0.7}>
            <Ionicons name="options-outline" size={18} color="#5F1BE9" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* Categories */}
        <View style={styles.catSection}>
          <Text style={styles.sectionTitle}>Shop by Category</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.catScroll}>
            {categories.map((cat) => {
              const isActive = activeCategory === cat;
              return (
                <TouchableOpacity
                  key={cat}
                  style={[styles.catPill, isActive && styles.catPillActive]}
                  onPress={() => setActiveCategory(cat)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.catLabel, isActive && styles.catLabelActive]}>{cat}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Product Grid Section */}
        <View style={styles.gridSection}>
          <Text style={styles.sectionTitle}>Trending Discoveries</Text>
          
          {loading ? (
            <ActivityIndicator size="small" color="#5F1BE9" style={{ marginTop: 40 }} />
          ) : (
           
            <View style={styles.gridColumnsContainer}>
              {/* Left Side Column */}
              <View style={styles.gridColumn}>
                {leftColumnProducts.map(renderProductCard)}
              </View>
              
              {/* Right Side Column */}
              <View style={styles.gridColumn}>
                {rightColumnProducts.map(renderProductCard)}
              </View>
            </View>
          )}

          {/* Empty Fallback */}
          {!loading && filteredProducts.length === 0 && (
            <View style={styles.noResultsBox}>
              <Ionicons name="cube-outline" size={36} color="#CBD5E1" />
              <Text style={styles.noResultsText}>No discoveries match your search</Text>
            </View>
          )}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  header: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 },
  headerTitle: { fontSize: 24, fontWeight: '900', color: '#0F172A', letterSpacing: -0.5 },
  headerSubtitle: { fontSize: 13, color: '#94A3B8', fontWeight: '500', marginTop: 2 },
  
  searchContainer: { paddingHorizontal: 20, marginTop: 12, marginBottom: 8 },
  searchBarBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC', paddingHorizontal: 14, height: 46, borderRadius: 16, borderWidth: 1, borderColor: '#F1F5F9' },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, fontSize: 14, color: '#1E293B', fontWeight: '500', paddingVertical: 0 },
  filterInlineBtn: { backgroundColor: '#FFFFFF', width: 32, height: 32, borderRadius: 10, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#E2E8F0', marginLeft: 6 },

  scrollContent: { paddingBottom: 100 },

  catSection: { marginTop: 14 },
  sectionTitle: { fontSize: 15, fontWeight: '800', color: '#0F172A', paddingHorizontal: 20, marginBottom: 12, letterSpacing: -0.2 },
  catScroll: { paddingLeft: 20, paddingRight: 10 },
  catPill: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 30, backgroundColor: '#F1F5F9', marginRight: 8, borderWidth: 1, borderColor: '#E2E8F0' },
  catPillActive: { backgroundColor: '#0F172A', borderColor: '#0F172A' },
  catLabel: { fontSize: 12, fontWeight: '700', color: '#64748B' },
  catLabelActive: { color: '#FFFFFF' },

 
  gridSection: { marginTop: 20, paddingHorizontal: 12 },
  gridColumnsContainer: { flexDirection: 'row', justifyContent: 'space-between', width: '100%' },
  gridColumn: { flexDirection: 'column', width: '50%', paddingHorizontal: 4 },
  
  modernCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    marginBottom: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#F1F5F9',
    elevation: 3,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.03,
    shadowRadius: 8
  },
  imgWrapper: { width: '100%', height: 160, backgroundColor: '#F8FAFC', position: 'relative' },
  productImg: { width: '100%', height: '100%', resizeMode: 'cover' },
  premiumTag: { position: 'absolute', top: 10, left: 10, backgroundColor: '#5F1BE9', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  tagText: { color: '#FFFFFF', fontSize: 9, fontWeight: '800', textTransform: 'uppercase' },

  cardDetails: { padding: 10 },
  pName: { fontSize: 13, fontWeight: '700', color: '#1E293B', letterSpacing: -0.1 },
  pCat: { fontSize: 11, color: '#94A3B8', fontWeight: '600', marginTop: 1 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
  pPrice: { fontSize: 13, fontWeight: '800', color: '#0F172A' },
  arrowCircle: { backgroundColor: '#0F172A', width: 20, height: 20, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },

  noResultsBox: { width: '100%', alignItems: 'center', justifyContent: 'center', paddingVertical: 80, gap: 10 },
  noResultsText: { color: '#94A3B8', fontSize: 13, fontWeight: '600' }
});
