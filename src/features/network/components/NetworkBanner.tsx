import { StyleSheet, Text, useColorScheme, View } from 'react-native';
import { useSelector } from 'react-redux';

import { selectBannerMessage, selectNetworkStatus } from '../model/banner';
import type { NetworkStatus } from '../model/networkSlice';

const lightBackground: Record<NetworkStatus, string> = {
  online: '#e7f6ec',
  offline: '#fff4e0',
  syncing: '#e7f1ff',
};

const darkBackground: Record<NetworkStatus, string> = {
  online: '#123524',
  offline: '#3d2e12',
  syncing: '#0c2d4a',
};

const lightText: Record<NetworkStatus, string> = {
  online: '#137333',
  offline: '#8a5a00',
  syncing: '#0057b8',
};

const darkText: Record<NetworkStatus, string> = {
  online: '#b7f0c8',
  offline: '#ffd59a',
  syncing: '#b3d7ff',
};

export function NetworkBanner() {
  const isDarkMode = useColorScheme() === 'dark';
  const status = useSelector(selectNetworkStatus);
  const message = useSelector(selectBannerMessage);

  return (
    <View
      accessibilityLiveRegion="polite"
      style={[
        styles.bar,
        {
          backgroundColor: isDarkMode
            ? darkBackground[status]
            : lightBackground[status],
        },
      ]}
    >
      <Text
        style={[
          styles.label,
          { color: isDarkMode ? darkText[status] : lightText[status] },
        ]}
      >
        {message}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    paddingVertical: 6,
    paddingHorizontal: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
});
