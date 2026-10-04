import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { ProductFeedScreen } from '../../features/catalog';
import { NetworkBanner } from '../../features/network';
import { ProductDetailScreen } from '../../features/productDetail';

import type { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

function ScreenFrame({ children }: { children: ReactNode }) {
  return (
    <View style={styles.frame}>
      <NetworkBanner />
      <View style={styles.content}>{children}</View>
    </View>
  );
}

function screenLayout({ children }: { children: ReactNode }) {
  return <ScreenFrame>{children}</ScreenFrame>;
}

export function RootNavigator() {
  return (
    <Stack.Navigator screenLayout={screenLayout}>
      <Stack.Screen
        name="ProductFeed"
        component={ProductFeedScreen}
        options={{ title: 'Products' }}
      />
      <Stack.Screen
        name="ProductDetail"
        component={ProductDetailScreen}
        options={{ title: 'Product' }}
      />
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  frame: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
});
