import { StyleSheet, TextInput, useColorScheme, View } from 'react-native';

type SearchBarProps = {
  value: string;
  onChangeText: (value: string) => void;
};

export function SearchBar({ value, onChangeText }: SearchBarProps) {
  const isDarkMode = useColorScheme() === 'dark';

  return (
    <View style={[styles.bar, isDarkMode ? styles.barDark : null]}>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder="Search products"
        placeholderTextColor={isDarkMode ? '#8e8e93' : '#8e8e93'}
        autoCapitalize="none"
        autoCorrect={false}
        clearButtonMode="while-editing"
        style={[styles.input, isDarkMode ? styles.inputDark : null]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#ffffff',
  },
  barDark: {
    backgroundColor: '#1c1c1e',
  },
  input: {
    height: 40,
    borderRadius: 10,
    paddingHorizontal: 12,
    backgroundColor: '#f2f2f7',
    color: '#1c1c1e',
    fontSize: 16,
  },
  inputDark: {
    backgroundColor: '#2c2c2e',
    color: '#f2f2f7',
  },
});
