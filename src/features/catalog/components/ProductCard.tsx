import { memo } from 'react';
import { Image, StyleSheet, Text, useColorScheme, View } from 'react-native';

import type { Product } from '../model/types';

type ProductCardProps = {
  product: Product;
};

function ProductCardView({ product }: ProductCardProps) {
  const isDarkMode = useColorScheme() === 'dark';

  return (
    <View style={[styles.card, isDarkMode ? styles.cardDark : null]}>
      <Image source={{ uri: product.thumbnail }} style={styles.image} />
      <View style={styles.copy}>
        <Text
          numberOfLines={2}
          style={[styles.title, isDarkMode ? styles.titleDark : null]}
        >
          {product.title}
        </Text>
        <Text style={styles.meta}>
          ${product.price.toFixed(2)} · {product.rating.toFixed(1)}
        </Text>
      </View>
    </View>
  );
}

export const ProductCard = memo(ProductCardView);

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
  },
  cardDark: {
    backgroundColor: '#1c1c1e',
  },
  image: {
    width: 72,
    height: 72,
    borderRadius: 8,
    backgroundColor: '#e5e5ea',
  },
  copy: {
    flex: 1,
    marginLeft: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1c1c1e',
  },
  titleDark: {
    color: '#f2f2f7',
  },
  meta: {
    marginTop: 4,
    fontSize: 14,
    color: '#636366',
  },
});
