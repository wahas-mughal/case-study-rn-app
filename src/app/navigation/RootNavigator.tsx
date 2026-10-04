import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { ProductFeedScreen } from '../../features/catalog';
import { ProductDetailScreen } from '../../features/productDetail';

import type { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  return (
    <Stack.Navigator>
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
