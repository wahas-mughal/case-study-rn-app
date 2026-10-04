import { useLayoutEffect } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import type { RootStackParamList } from '../../../app/navigation/types';
import { useAddToCartMutation } from '../../cart';
import { useGetProductQuery } from '../api/productDetailApi';

type ProductDetailProps = NativeStackScreenProps<
  RootStackParamList,
  'ProductDetail'
>;

export function ProductDetailScreen({ route, navigation }: ProductDetailProps) {
  const isDarkMode = useColorScheme() === 'dark';
  const { productId } = route.params;
  const {
    data: product,
    isLoading,
    isError,
    refetch,
  } = useGetProductQuery(productId);
  const [addToCart, { isLoading: isAdding, isSuccess, isError: isAddError }] =
    useAddToCartMutation();

  useLayoutEffect(() => {
    if (product?.title) {
      navigation.setOptions({ title: product.title });
    }
  }, [navigation, product?.title]);

  if (isLoading && !product) {
    return (
      <View style={[styles.centered, isDarkMode ? styles.screenDark : null]}>
        <ActivityIndicator />
      </View>
    );
  }

  if (isError && !product) {
    return (
      <View style={[styles.centered, isDarkMode ? styles.screenDark : null]}>
        <Text style={[styles.message, isDarkMode ? styles.messageDark : null]}>
          Product could not be loaded.
        </Text>
        <Pressable onPress={() => refetch()} style={styles.retry}>
          <Text style={styles.retryLabel}>Try again</Text>
        </Pressable>
      </View>
    );
  }

  if (!product) {
    return (
      <View style={[styles.centered, isDarkMode ? styles.screenDark : null]}>
        <Text style={[styles.message, isDarkMode ? styles.messageDark : null]}>
          Product could not be loaded.
        </Text>
      </View>
    );
  }

  const imageUri = product.images[0] ?? product.thumbnail;

  return (
    <View style={[styles.screen, isDarkMode ? styles.screenDark : null]}>
      <ScrollView contentContainerStyle={styles.content}>
        <Image source={{ uri: imageUri }} style={styles.image} />
        <Text style={[styles.title, isDarkMode ? styles.titleDark : null]}>
          {product.title}
        </Text>
        <Text style={styles.price}>${product.price.toFixed(2)}</Text>
        <Text style={styles.meta}>
          Rating {product.rating.toFixed(1)} · {product.category}
        </Text>
        {product.brand ? (
          <Text style={styles.meta}>{product.brand}</Text>
        ) : null}
        <Text style={styles.meta}>
          {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
        </Text>
        <Text
          style={[styles.description, isDarkMode ? styles.messageDark : null]}
        >
          {product.description}
        </Text>
      </ScrollView>
      <View style={[styles.footer, isDarkMode ? styles.footerDark : null]}>
        <Pressable
          accessibilityRole="button"
          disabled={isAdding}
          onPress={() => addToCart({ productId: product.id })}
          style={[styles.button, isAdding ? styles.buttonDisabled : null]}
        >
          <Text style={styles.buttonLabel}>
            {isAdding ? 'Adding…' : isSuccess ? 'Added to cart' : 'Add to cart'}
          </Text>
        </Pressable>
        {isAddError ? (
          <Text style={styles.error}>
            Could not add this product to the cart.
          </Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  screenDark: {
    backgroundColor: '#1c1c1e',
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    padding: 24,
  },
  content: {
    paddingBottom: 24,
  },
  image: {
    width: '100%',
    height: 280,
    backgroundColor: '#f2f2f7',
    resizeMode: 'contain',
  },
  title: {
    marginTop: 16,
    marginHorizontal: 16,
    fontSize: 22,
    fontWeight: '700',
    color: '#1c1c1e',
  },
  titleDark: {
    color: '#f2f2f7',
  },
  price: {
    marginTop: 8,
    marginHorizontal: 16,
    fontSize: 20,
    fontWeight: '600',
    color: '#007aff',
  },
  meta: {
    marginTop: 4,
    marginHorizontal: 16,
    fontSize: 15,
    color: '#636366',
  },
  description: {
    marginTop: 16,
    marginHorizontal: 16,
    fontSize: 16,
    lineHeight: 22,
    color: '#1c1c1e',
  },
  message: {
    fontSize: 16,
    color: '#1c1c1e',
    textAlign: 'center',
  },
  messageDark: {
    color: '#f2f2f7',
  },
  retry: {
    marginTop: 16,
  },
  retryLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007aff',
  },
  footer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#d1d1d6',
    backgroundColor: '#ffffff',
  },
  footerDark: {
    borderTopColor: '#3a3a3c',
    backgroundColor: '#1c1c1e',
  },
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
    borderRadius: 12,
    backgroundColor: '#007aff',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonLabel: {
    fontSize: 17,
    fontWeight: '600',
    color: '#ffffff',
  },
  error: {
    marginTop: 8,
    fontSize: 14,
    textAlign: 'center',
    color: '#ff3b30',
  },
});
