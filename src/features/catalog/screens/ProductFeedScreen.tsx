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

import {
  SEARCH_DEBOUNCE_MS,
  useDebouncedValue,
} from '../../../shared/hooks/useDebouncedValue';
import { useGetProductsQuery, useSearchProductsQuery } from '../api/catalogApi';
import { ProductCard } from '../components/ProductCard';
import { SearchBar } from '../components/SearchBar';
import { PRODUCT_PAGE_SIZE, type Product } from '../model/types';

function keyExtractor(product: Product) {
  return String(product.id);
}

export function ProductFeedScreen() {
  const isDarkMode = useColorScheme() === 'dark';
  const [searchText, setSearchText] = useState('');
  const debouncedSearch = useDebouncedValue(searchText, SEARCH_DEBOUNCE_MS);
  const trimmedSearch = debouncedSearch.trim();
  const isSearching = trimmedSearch.length > 0;
  const [skip, setSkip] = useState(0);
  const [appliedSearch, setAppliedSearch] = useState(trimmedSearch);

  if (appliedSearch !== trimmedSearch) {
    setAppliedSearch(trimmedSearch);
    setSkip(0);
  }

  const listQuery = useGetProductsQuery(
    { limit: PRODUCT_PAGE_SIZE, skip },
    { skip: isSearching },
  );
  const searchQuery = useSearchProductsQuery(
    { q: trimmedSearch, limit: PRODUCT_PAGE_SIZE, skip },
    { skip: !isSearching },
  );
  const { data, isLoading, isFetching, isError, refetch } = isSearching
    ? searchQuery
    : listQuery;
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

  let body = (
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
  );

  if (isLoading && products.length === 0) {
    body = (
      <View style={styles.centered}>
        <ActivityIndicator />
      </View>
    );
  } else if (isError && products.length === 0) {
    body = (
      <View style={styles.centered}>
        <Text style={[styles.message, isDarkMode ? styles.messageDark : null]}>
          Products could not be loaded.
        </Text>
        <Pressable onPress={() => refetch()} style={styles.retry}>
          <Text style={styles.retryLabel}>Try again</Text>
        </Pressable>
      </View>
    );
  } else if (!isFetching && products.length === 0) {
    body = (
      <View style={styles.centered}>
        <Text style={[styles.message, isDarkMode ? styles.messageDark : null]}>
          No products found.
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.screen, isDarkMode ? styles.screenDark : null]}>
      <SearchBar value={searchText} onChangeText={setSearchText} />
      {body}
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
