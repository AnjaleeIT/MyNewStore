import React, { useEffect, useState } from 'react';
import { 
  View, Text, StyleSheet, FlatList, Image, TouchableOpacity, 
  Alert, ActivityIndicator, SafeAreaView, TextInput, StatusBar, RefreshControl 
} from 'react-native';
import { supabase } from '../supabaseConfig';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const THEME = {
  primary: '#5209e3',
  dark: '#1C1C1E',
  background: '#F2F2F7',
  white: '#FFFFFF',
  border: '#E5E5EA',
  secondaryText: '#8E8E93',
  danger: '#FF3B30',
  edit: '#FF9500'
};

export default function AdminInventory() {
  const [products, setProducts] = useState<any[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const router = useRouter();

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    const filtered = products.filter(p => 
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      (p.category && p.category.toLowerCase().includes(searchQuery.toLowerCase()))
    );
    setFilteredProducts(filtered);
  }, [searchQuery, products]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProducts(data || []);
      setFilteredProducts(data || []);
    } catch (error: any) {
      console.log("Fetch Error:", error.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleDelete = (productId: string, name: string) => {
    Alert.alert(
      "Confirm Removal",
      `Are you sure you want to delete "${name}"?`,
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive", 
          onPress: async () => {
            try {
              
              const { error } = await supabase
                .from('products')
                .delete()
                .eq('id', String(productId)); 

              if (error) throw error;

              setProducts(prev => prev.filter(p => p.id !== productId));
              Alert.alert("Success ✅", "Item deleted!");
              
            } catch (error: any) {
              Alert.alert("Error", error.message);
            }
          } 
        }
      ]
    );
  };

  const renderProduct = ({ item }: any) => (
    <View style={styles.productCard}>
      <Image source={{ uri: item.img }} style={styles.productImg} />
      <View style={styles.productInfo}>
        <Text style={styles.productName} numberOfLines={1}>{item.name}</Text>
        <Text style={styles.productCategory}>{item.category || 'General'}</Text>
        <Text style={styles.productPrice}>Rs. {item.price.toLocaleString()}</Text>
      </View>
      
      <View style={styles.actionContainer}>
        <TouchableOpacity 
          style={[styles.actionBtn, { backgroundColor: '#FFF9F0' }]} 
          onPress={() => router.push({ pathname: '/admin-edit-product', params: { id: item.id } })}
        >
          <Ionicons name="create-outline" size={18} color={THEME.edit} />
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.actionBtn, { backgroundColor: '#FFF1F0' }]} 
          onPress={() => handleDelete(item.id, item.name)}
        >
          <Ionicons name="trash-outline" size={18} color={THEME.danger} />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={26} color={THEME.dark} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Inventory List</Text>
        <TouchableOpacity onPress={() => router.push('/admin-add-product')}>
          <Ionicons name="add-circle" size={28} color={THEME.primary} />
        </TouchableOpacity>
      </View>

      <View style={styles.searchSection}>
        <View style={styles.searchBox}>
          <Ionicons name="search" size={20} color={THEME.secondaryText} />
          <TextInput 
            style={styles.searchInput}
            placeholder="Search items..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      <FlatList
        data={filteredProducts}
        keyExtractor={(item) => item.id} 
        renderItem={renderProduct}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={fetchProducts} />}
        ListEmptyComponent={!loading ? <Text style={styles.empty}>No products found.</Text> : null}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: THEME.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', padding: 18, backgroundColor: THEME.white, alignItems: 'center', borderBottomWidth: 1, borderBottomColor: THEME.border },
  headerTitle: { fontSize: 17, fontWeight: '800' },
  searchSection: { padding: 15, backgroundColor: THEME.white },
  searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: THEME.background, padding: 10, borderRadius: 14, borderWidth: 1, borderColor: THEME.border },
  searchInput: { flex: 1, marginLeft: 10, fontSize: 15 },
  listContent: { padding: 15 },
  productCard: { flexDirection: 'row', backgroundColor: THEME.white, borderRadius: 22, padding: 12, marginBottom: 12, alignItems: 'center', borderBottomWidth: 1, borderBottomColor: THEME.border },
  productImg: { width: 65, height: 65, borderRadius: 14, backgroundColor: THEME.background },
  productInfo: { flex: 1, marginLeft: 15 },
  productName: { fontSize: 15, fontWeight: '700' },
  productCategory: { fontSize: 12, color: THEME.secondaryText, marginTop: 2 },
  productPrice: { fontSize: 14, fontWeight: '800', color: THEME.primary, marginTop: 4 },
  actionContainer: { flexDirection: 'row', gap: 10 },
  actionBtn: { width: 40, height: 40, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  empty: { textAlign: 'center', marginTop: 50, color: THEME.secondaryText }
});
