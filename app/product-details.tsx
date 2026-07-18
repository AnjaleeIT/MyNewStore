import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  StatusBar,
  Dimensions,
  FlatList,
} from 'react-native';
import { useCart } from './context/CartContext';

const { width } = Dimensions.get('window');

export default function ProductDetails() {
  const item = useLocalSearchParams();
  const router = useRouter();
  const { addToCart } = useCart();
  
  const [selectedSize, setSelectedSize] = useState('M');
  const [quantity, setQuantity] = useState(1);
  const [isFavorite, setIsFavorite] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  const extraImages = item.images ? (typeof item.images === 'string' ? JSON.parse(item.images) : item.images) : [];
  const allImages = [item.img as string, ...extraImages].filter(Boolean);

  const price = Number(item.price);

  const handleAddToCart = () => {
    addToCart({
      id: item.id as string,
      name: item.name as string,
      price: price,
      img: item.img as string,
      quantity: quantity,
      size: selectedSize,
    });
    router.push('/cart');
  };

  const handleScroll = (event: any) => {
    const slide = Math.round(event.nativeEvent.contentOffset.x / width);
    if (slide !== activeImageIndex) setActiveImageIndex(slide);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      
      <View style={styles.navHeader}>
        <TouchableOpacity onPress={() => router.back()} style={styles.glassBtn}>
          <Ionicons name="chevron-back" size={24} color="#1A1A1A" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setIsFavorite(!isFavorite)} style={styles.glassBtn}>
          <Ionicons name={isFavorite ? "heart" : "heart-outline"} size={24} color={isFavorite ? "#FF4757" : "#1A1A1A"} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
        <View style={styles.carouselContainer}>
          <FlatList
            data={allImages}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={handleScroll}
            keyExtractor={(_, index) => index.toString()}
            renderItem={({ item: imgUri }) => (
              <Image source={{ uri: imgUri }} style={styles.heroImage} />
            )}
          />
          <View style={styles.dotContainer}>
            {allImages.map((_, index) => (
              <View key={index} style={[styles.dot, activeImageIndex === index ? styles.activeDot : null]} />
            ))}
          </View>
        </View>

        <View style={styles.detailsSheet}>
          <View style={styles.pullTab} />
          
          <Text style={styles.brandTag}>{item.category || 'New Arrival'}</Text>
          <Text style={styles.titleText}>{item.name}</Text>

          <View style={styles.reviewRow}>
             <View style={styles.stars}>
                {[1,2,3,4,5].map(s => <Ionicons key={s} name="star" size={14} color="#FFD700" />)}
             </View>
             <Text style={styles.reviewText}>4.9 (128 Customer Reviews)</Text>
          </View>

          <Text style={styles.priceText}>Rs. {price.toLocaleString()}</Text>
          <View style={styles.line} />

          <Text style={styles.sectionTitle}>Product Details</Text>
          <Text style={styles.bodyText}>{item.description || 'No description available.'}</Text>

          <View style={styles.deliveryCard}>
             <Ionicons name="bus-outline" size={22} color="#5209e3" />
             <View style={{marginLeft: 12}}>
                <Text style={styles.deliveryTitle}>Standard Delivery</Text>
                <Text style={styles.deliverySub}>Estimated: 2-4 business days</Text>
             </View>
          </View>

          <Text style={[styles.sectionTitle, {marginTop: 25}]}>Select Your Size</Text>
          <View style={styles.sizeRow}>
            {['S', 'M', 'L', 'XL'].map(s => (
              <TouchableOpacity key={s} onPress={() => setSelectedSize(s)} style={[styles.sizeBtn, selectedSize === s && styles.sizeBtnActive]}>
                <Text style={[styles.sizeLabel, selectedSize === s && styles.sizeLabelActive]}>{s}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={{height: 50}} /> 
        </View>
      </ScrollView>

      <View style={styles.purchaseBar}>
        <View style={styles.qtyBox}>
           <TouchableOpacity onPress={() => quantity > 1 && setQuantity(q => q-1)} style={styles.qtyAction}><Ionicons name="remove" size={20} /></TouchableOpacity>
           <Text style={styles.qtyVal}>{quantity}</Text>
           <TouchableOpacity onPress={() => setQuantity(q => q+1)} style={styles.qtyAction}><Ionicons name="add" size={20} /></TouchableOpacity>
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={handleAddToCart}>
          <Text style={styles.addBtnText}>Add to Cart • Rs. {(price * quantity).toLocaleString()}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  navHeader: { position: 'absolute', top: 50, left: 20, right: 20, zIndex: 10, flexDirection: 'row', justifyContent: 'space-between' },
  glassBtn: { width: 45, height: 45, borderRadius: 15, backgroundColor: 'rgba(255,255,255,0.9)', justifyContent: 'center', alignItems: 'center', elevation: 3 },
  carouselContainer: { width: width, height: width * 1.2 },
  heroImage: { width: width, height: width * 1.2, resizeMode: 'cover' },
  dotContainer: { flexDirection: 'row', position: 'absolute', bottom: 50, alignSelf: 'center', gap: 6 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.4)' },
  activeDot: { width: 18, backgroundColor: '#FFF' },
  detailsSheet: { backgroundColor: '#fff', borderTopLeftRadius: 35, borderTopRightRadius: 35, marginTop: -35, padding: 25, paddingBottom: 100 },
  pullTab: { width: 40, height: 5, backgroundColor: '#eee', borderRadius: 10, alignSelf: 'center', marginBottom: 20 },
  brandTag: { color: '#5209e3', fontWeight: 'bold', fontSize: 12, textTransform: 'uppercase', letterSpacing: 1 },
  titleText: { fontSize: 26, fontWeight: '900', color: '#1A1A1A', marginTop: 5 },
  reviewRow: { flexDirection: 'row', alignItems: 'center', marginTop: 10 },
  stars: { flexDirection: 'row', gap: 2 },
  reviewText: { fontSize: 12, color: '#888', marginLeft: 8, fontWeight: '600' },
  priceText: { fontSize: 24, fontWeight: '900', color: '#1A1A1A', marginTop: 15 },
  line: { height: 1, backgroundColor: '#F1F4F9', marginVertical: 20 },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: '#1A1A1A', marginBottom: 12 },
  bodyText: { fontSize: 14, color: '#636E72', lineHeight: 22 },
  deliveryCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8F9FD', padding: 15, borderRadius: 20, marginTop: 20, borderWidth: 1, borderColor: '#F1F4F9' },
  deliveryTitle: { fontSize: 14, fontWeight: '700', color: '#1A1A1A' },
  deliverySub: { fontSize: 12, color: '#888' },
  sizeRow: { flexDirection: 'row', gap: 10, marginTop: 5 },
  sizeBtn: { flex: 1, height: 50, borderRadius: 12, borderWidth: 1, borderColor: '#F1F4F9', justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8F9FD' },
  sizeBtnActive: { backgroundColor: '#1A1A1A', borderColor: '#1A1A1A' },
  sizeLabel: { fontWeight: 'bold', color: '#1A1A1A' },
  sizeLabelActive: { color: '#fff' },
  purchaseBar: { position: 'absolute', bottom: 0, width: width, backgroundColor: '#fff', padding: 20, paddingBottom: 35, borderTopWidth: 1, borderTopColor: '#F1F4F9', flexDirection: 'row', gap: 15, zIndex: 99 },
  qtyBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F1F4F9', borderRadius: 15, padding: 5 },
  qtyAction: { width: 35, height: 35, backgroundColor: '#fff', borderRadius: 10, justifyContent: 'center', alignItems: 'center', elevation: 2 },
  qtyVal: { paddingHorizontal: 15, fontWeight: '900', fontSize: 16 },
  addBtn: { flex: 1, backgroundColor: '#5209e3', borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  addBtnText: { color: '#fff', fontWeight: '900', fontSize: 14 }
});