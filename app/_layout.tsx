import { useEffect } from 'react';
import { Stack, useRouter } from 'expo-router';
import { ThemeProvider } from './context/ThemeContext';
import { CartProvider } from './context/CartContext';
import { supabase } from '../supabaseConfig'; // පරණ code එකේ තිබූ පරිදි

export default function RootLayout() {
  const router = useRouter();

  useEffect(() => {
    // Session එක පරීක්ෂා කිරීම
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.replace('/login');
      }
    };

    checkUser();

    // Auth තත්ත්වය වෙනස් වන විට (Login/Logout) ක්‍රියාත්මක වේ
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        router.replace('/login');
      } else {
        router.replace('/(tabs)');
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  return (
    <ThemeProvider>
      <CartProvider>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="product-details" options={{ presentation: 'modal' }} />
          <Stack.Screen name="checkout" options={{ presentation: 'card' }} />
          <Stack.Screen name="login" options={{ headerShown: false }} />
          <Stack.Screen name="register" options={{ headerShown: false }} />
        </Stack>
      </CartProvider>
    </ThemeProvider>
  );
}
