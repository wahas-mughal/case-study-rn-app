import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { ProductFeedScreen } from '../../features/catalog';

export type RootStackParamList = {
  ProductFeed: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="ProductFeed"
        component={ProductFeedScreen}
        options={{ title: 'Products' }}
      />
    </Stack.Navigator>
  );
}
