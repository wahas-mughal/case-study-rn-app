import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from 'react-native';
import { FlashList } from '@shopify/flash-list';

import { useGetProductsQuery } from '../api/catalogApi';
import { ProductCard } from '../components/ProductCard';
import { PRODUCT_PAGE_SIZE, type Product } from '../model/types';

function keyExtractor(product: Product) {
  return String(product.id);
}

export function ProductFeedScreen() {
  const isDarkMode = useColorScheme() === 'dark';
  const [skip, setSkip] = useState(0);
  const { data, isLoading, isFetching, isError, refetch } = useGetProductsQuery(
    {
      limit: PRODUCT_PAGE_SIZE,
      skip,
    },
  );
  const products = data?.products ?? [];

  const renderItem = useCallback(
    ({ item }: { item: Product }) => <ProductCard product={item} />,
    [],
  );

  const loadMore = useCallback(() => {
    if (!data || isFetching || data.products.length >= data.total) {
      return;
    }

    setSkip(data.skip + data.limit);
  }, [data, isFetching]);

  if (isLoading && products.length === 0) {
    return (
      <View style={[styles.centered, isDarkMode ? styles.screenDark : null]}>
        <ActivityIndicator />
      </View>
    );
  }

  if (isError && products.length === 0) {
    return (
      <View style={[styles.centered, isDarkMode ? styles.screenDark : null]}>
        <Text style={[styles.message, isDarkMode ? styles.messageDark : null]}>
          Products could not be loaded.
        </Text>
        <Pressable onPress={() => refetch()} style={styles.retry}>
          <Text style={styles.retryLabel}>Try again</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={[styles.screen, isDarkMode ? styles.screenDark : null]}>
      <FlashList
        data={products}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={
          isFetching ? (
            <ActivityIndicator style={styles.footer} />
          ) : (
            <View style={styles.footer} />
          )
        }
      />
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
    height: 48,
  },
});
