import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
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
  Platform
} from 'react-native';
import { useCart } from '../context/CartContext';

const { width } = Dimensions.get('window');

export default function CartScreen() {
  const { cart, removeFromCart, updateQuantity, totalPrice } = useCart();
  const router = useRouter();

  const deliveryFee = 450;
  const grandTotal = totalPrice + deliveryFee;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {/* Elegant Minimal Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color="#1A1A1A" />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>My Cart</Text>
          <Text style={styles.headerSubtitle}>{cart.length} items</Text>
        </View>
        <TouchableOpacity style={styles.moreBtn}>
          <Ionicons name="ellipsis-horizontal" size={22} color="#1A1A1A" />
        </TouchableOpacity>
      </View>

      {cart.length > 0 ? (
        <>
          <ScrollView 
            showsVerticalScrollIndicator={false} 
            contentContainerStyle={styles.scrollContent}
          >
            <View style={styles.itemsWrapper}>
              {cart.map((item) => (
                <View key={item.id} style={styles.cartCard}>
                  {/* Image with subtle border */}
                  <View style={styles.imageBox}>
                    <Image source={{ uri: item.img }} style={styles.itemImage} />
                  </View>

                  <View style={styles.itemMeta}>
                    <View style={styles.metaTop}>
                      <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
                      <TouchableOpacity 
                        onPress={() => removeFromCart(item.id)} 
                        hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}
                      >
                        <Ionicons name="close-circle-outline" size={22} color="#B2BEC3" />
                      </TouchableOpacity>
                    </View>

                    <Text style={styles.itemCategory}>Premium Collection</Text>
                    <Text style={styles.itemPrice}>Rs. {item.price.toLocaleString()}</Text>

                    <View style={styles.metaBottom}>
                      {/* Modern Quantity Selector */}
                      <View style={styles.qtyContainer}>
                        <TouchableOpacity 
                          onPress={() => updateQuantity(item.id, item.quantity - 1)} 
                          style={[styles.qtyAction, item.quantity <= 1 && { opacity: 0.3 }]}
                          disabled={item.quantity <= 1}
                        >
                          <Ionicons name="remove" size={18} color="#1A1A1A" />
                        </TouchableOpacity>
                        
                        <Text style={styles.qtyVal}>{item.quantity}</Text>

                        <TouchableOpacity 
                          onPress={() => updateQuantity(item.id, item.quantity + 1)} 
                          style={styles.qtyAction}
                        >
                          <Ionicons name="add" size={18} color="#1A1A1A" />
                        </TouchableOpacity>
                      </View>
                      
                      <Text style={styles.itemSubtotal}>Rs. {(item.price * item.quantity).toLocaleString()}</Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>

            {/* Premium Checkout Summary Card */}
            <View style={styles.summaryCard}>
              <Text style={styles.summaryHeading}>Order Summary</Text>
              
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Subtotal</Text>
                <Text style={styles.summaryValue}>Rs. {totalPrice.toLocaleString()}</Text>
              </View>

              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Delivery Charges</Text>
                <Text style={[styles.summaryValue, {color: '#00CE97'}]}>+ Rs. {deliveryFee.toLocaleString()}</Text>
              </View>

              <View style={styles.divider} />

              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Grand Total</Text>
                <Text style={styles.totalValue}>Rs. {grandTotal.toLocaleString()}</Text>
              </View>
            </View>
          </ScrollView>

          {/* Fixed Floating Bottom Bar */}
          <View style={styles.bottomBar}>
            <View style={styles.totalContainer}>
              <Text style={styles.footerLabel}>Total Amount</Text>
              <Text style={styles.footerPrice}>Rs. {grandTotal.toLocaleString()}</Text>
            </View>
            <TouchableOpacity 
              activeOpacity={0.8}
              style={styles.checkoutBtn} 
              onPress={() => router.push('/checkout')}
            >
              <Text style={styles.checkoutBtnText}>Checkout Now</Text>
              <Ionicons name="arrow-forward" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        </>
      ) : (
        /* Enhanced Empty Bag UI */
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconCircle}>
            <Ionicons name="cart-outline" size={60} color="#5209e3" />
          </View>
          <Text style={styles.emptyTitle}>Your cart is empty</Text>
          <Text style={styles.emptySubtitle}>Looks like you haven't added anything to your cart yet.</Text>
          <TouchableOpacity style={styles.shopNowBtn} onPress={() => router.push('/')}>
            <Text style={styles.shopNowText}>Start Shopping</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FDFDFD' },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingHorizontal: 22, 
    paddingVertical: 18, 
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#F8F9FD'
  },
  headerTitleContainer: { alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '900', color: '#1A1A1A' },
  headerSubtitle: { fontSize: 12, color: '#B2BEC3', fontWeight: '600' },
  backBtn: { width: 44, height: 44, borderRadius: 14, backgroundColor: '#F8F9FD', justifyContent: 'center', alignItems: 'center' },
  moreBtn: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center' },

  scrollContent: { paddingBottom: 130 },
  itemsWrapper: { padding: 22 },
  
  cartCard: { 
    flexDirection: 'row', 
    backgroundColor: '#fff', 
    borderRadius: 28, 
    padding: 14, 
    marginBottom: 18, 
    elevation: 8,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 15,
    borderWidth: 1,
    borderColor: '#F8F9FD'
  },
  imageBox: { 
    width: 95, 
    height: 95, 
    borderRadius: 20, 
    backgroundColor: '#F8F9FD', 
    overflow: 'hidden' 
  },
  itemImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  
  itemMeta: { flex: 1, marginLeft: 16, justifyContent: 'space-between' },
  metaTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  itemName: { fontSize: 15, fontWeight: '800', color: '#1A1A1A', flex: 1 },
  itemCategory: { fontSize: 11, color: '#B2BEC3', fontWeight: '600', marginTop: -2 },
  itemPrice: { fontSize: 14, color: '#5209e3', fontWeight: '800', marginTop: 4 },
  
  metaBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 },
  qtyContainer: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#F8F9FD', 
    borderRadius: 12, 
    padding: 4,
    borderWidth: 1,
    borderColor: '#F1F4F9'
  },
  qtyAction: { 
    width: 28, 
    height: 28, 
    backgroundColor: '#fff', 
    borderRadius: 9, 
    justifyContent: 'center', 
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 5
  },
  qtyVal: { paddingHorizontal: 12, fontWeight: '900', fontSize: 14, color: '#1A1A1A' },
  itemSubtotal: { fontSize: 16, fontWeight: '900', color: '#1A1A1A' },

  summaryCard: { margin: 22, padding: 25, backgroundColor: '#fff', borderRadius: 30, elevation: 4, shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 20, borderWidth: 1, borderColor: '#F8F9FD' },
  summaryHeading: { fontSize: 17, fontWeight: '900', color: '#1A1A1A', marginBottom: 20 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
  summaryLabel: { color: '#B2BEC3', fontWeight: '700', fontSize: 14 },
  summaryValue: { color: '#1A1A1A', fontWeight: '800', fontSize: 14 },
  divider: { height: 1.5, backgroundColor: '#F8F9FD', marginVertical: 12 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  totalLabel: { fontSize: 17, fontWeight: '900', color: '#1A1A1A' },
  totalValue: { fontSize: 22, fontWeight: '900', color: '#5209e3' },

  bottomBar: { 
    position: 'absolute', 
    bottom: 0, 
    width: width, 
    backgroundColor: '#fff', 
    padding: 22, 
    paddingBottom: Platform.OS === 'ios' ? 40 : 22, 
    flexDirection: 'row', 
    alignItems: 'center', 
    borderTopWidth: 1, 
    borderTopColor: '#F8F9FD',
    elevation: 20,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 15
  },
  totalContainer: { flex: 0.8 },
  footerLabel: { fontSize: 11, color: '#B2BEC3', fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 },
  footerPrice: { fontSize: 22, fontWeight: '900', color: '#1A1A1A' },
  checkoutBtn: { 
    flex: 1.2, 
    height: 62, 
    backgroundColor: '#5209e3', 
    borderRadius: 20, 
    flexDirection: 'row', 
    justifyContent: 'center', 
    alignItems: 'center', 
    gap: 12,
    elevation: 10,
    shadowColor: '#5209e3',
    shadowOpacity: 0.3,
    shadowRadius: 12
  },
  checkoutBtnText: { color: '#fff', fontSize: 16, fontWeight: '900' },

  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  emptyIconCircle: { width: 120, height: 120, borderRadius: 60, backgroundColor: '#F8F9FD', justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  emptyTitle: { fontSize: 22, fontWeight: '900', color: '#1A1A1A' },
  emptySubtitle: { fontSize: 14, color: '#B2BEC3', textAlign: 'center', marginTop: 10, lineHeight: 22 },
  shopNowBtn: { marginTop: 30, backgroundColor: '#1A1A1A', paddingHorizontal: 35, paddingVertical: 18, borderRadius: 18 },
  shopNowText: { color: '#fff', fontWeight: '800', fontSize: 15 }
});