import { useCallback, useLayoutEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from 'react-native';
import { FlashList, type FlashListRef } from '@shopify/flash-list';

import {
  SEARCH_DEBOUNCE_MS,
  useDebouncedValue,
} from '../../../shared/hooks/useDebouncedValue';
import {
  useGetCategoriesQuery,
  useGetProductsQuery,
  useSearchProductsQuery,
} from '../api/catalogApi';
import { FilterChips } from '../components/FilterChips';
import { ProductCard } from '../components/ProductCard';
import { SearchBar } from '../components/SearchBar';
import {
  PRODUCT_PAGE_SIZE,
  toSortQuery,
  type Product,
  type ProductSort,
} from '../model/types';

function keyExtractor(product: Product) {
  return String(product.id);
}

export function ProductFeedScreen() {
  const isDarkMode = useColorScheme() === 'dark';
  const [searchText, setSearchText] = useState('');
  const debouncedSearch = useDebouncedValue(searchText, SEARCH_DEBOUNCE_MS);
  const trimmedSearch = debouncedSearch.trim();
  const isSearching = trimmedSearch.length > 0;
  const [category, setCategory] = useState('');
  const [sort, setSort] = useState<ProductSort | ''>('');
  const [skip, setSkip] = useState(0);
  const filterToken = `${trimmedSearch}|${category}|${sort}`;
  const [appliedFilter, setAppliedFilter] = useState(filterToken);
  const filtersChanged = appliedFilter !== filterToken;
  const { data: categories = [] } = useGetCategoriesQuery();
  const listRef = useRef<FlashListRef<Product>>(null);
  const scrolledFilter = useRef(filterToken);

  if (filtersChanged) {
    setAppliedFilter(filterToken);
    setSkip(0);
  }

  const query = {
    limit: PRODUCT_PAGE_SIZE,
    skip: filtersChanged ? 0 : skip,
    category: category || undefined,
    ...toSortQuery(sort),
  };
  const listQuery = useGetProductsQuery(query, { skip: isSearching });
  const searchQuery = useSearchProductsQuery(
    { ...query, q: trimmedSearch },
    { skip: !isSearching },
  );
  const { data, isLoading, isFetching, isError, refetch } = isSearching
    ? searchQuery
    : listQuery;
  const products = data?.products ?? [];

  useLayoutEffect(() => {
    const list = listRef.current;

    if (scrolledFilter.current === filterToken || !list) {
      return;
    }

    scrolledFilter.current = filterToken;
    list.scrollToTop({ animated: false });
    const frame = requestAnimationFrame(() => {
      list.scrollToTop({ animated: false });
    });

    return () => cancelAnimationFrame(frame);
  }, [filterToken, data]);

  const renderItem = useCallback(
    ({ item }: { item: Product }) => <ProductCard product={item} />,
    [],
  );

  const loadMore = useCallback(() => {
    if (!data || isFetching || data.skip + data.limit >= data.total) {
      return;
    }

    setSkip(data.skip + data.limit);
  }, [data, isFetching]);

  let body = (
    <FlashList
      key={filterToken}
      ref={listRef}
      style={styles.list}
      data={products}
      maintainVisibleContentPosition={{ disabled: true }}
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
  } else if (
    !isFetching &&
    products.length === 0 &&
    data &&
    data.skip + data.limit < data.total
  ) {
    body = (
      <View style={styles.centered}>
        <Text style={[styles.message, isDarkMode ? styles.messageDark : null]}>
          No matches on this page.
        </Text>
        <Pressable onPress={loadMore} style={styles.retry}>
          <Text style={styles.retryLabel}>Load more</Text>
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

  const categoryChips = [
    { id: '', label: 'All' },
    ...categories.map(item => ({ id: item.slug, label: item.name })),
  ];
  const sortChips = [
    { id: '', label: 'Default' },
    { id: 'price-desc', label: 'Price ↑' },
    { id: 'price-asc', label: 'Price ↓' },
    { id: 'rating-desc', label: 'Top rated' },
  ];

  return (
    <View style={[styles.screen, isDarkMode ? styles.screenDark : null]}>
      <SearchBar value={searchText} onChangeText={setSearchText} />
      <View style={styles.filters}>
        <Text style={[styles.heading, isDarkMode ? styles.headingDark : null]}>
          Categories
        </Text>
        <FilterChips
          chips={categoryChips}
          selectedId={category}
          onSelect={setCategory}
        />
        <Text
          style={[
            styles.heading,
            styles.headingSpaced,
            isDarkMode ? styles.headingDark : null,
          ]}
        >
          Filters
        </Text>
        <FilterChips
          chips={sortChips}
          selectedId={sort}
          onSelect={id => setSort(id as ProductSort | '')}
        />
      </View>
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
  list: {
    flex: 1,
  },
  filters: {
    paddingBottom: 12,
  },
  heading: {
    marginTop: 4,
    marginBottom: 8,
    marginHorizontal: 16,
    fontSize: 15,
    fontWeight: '600',
    color: '#1c1c1e',
  },
  headingSpaced: {
    marginTop: 16,
  },
  headingDark: {
    color: '#f2f2f7',
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
