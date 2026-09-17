import React, { useState, useCallback } from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

interface SearchBarProps {
  placeholder?: string;
  onSearch: (query: string) => void;
  loading?: boolean;
  value?: string;
  onChangeText?: (text: string) => void;
}

const SearchBar: React.FC<SearchBarProps> = ({
  placeholder = 'Buscar...',
  onSearch,
  loading = false,
  value: externalValue,
  onChangeText: externalOnChangeText,
}) => {
  const [internalValue, setInternalValue] = useState('');
  const value = externalValue !== undefined ? externalValue : internalValue;
  const onChangeText = externalOnChangeText || setInternalValue;

  const handleSubmit = useCallback(() => {
    if (value.trim()) {
      onSearch(value.trim());
    }
  }, [value, onSearch]);

  const handleClear = useCallback(() => {
    onChangeText('');
  }, [onChangeText]);

  return (
    <View style={styles.container}>
      <View style={styles.inputContainer}>
        <Icon name="search" size={20} color="#535353" />
        <TextInput
          style={styles.input}
          placeholder={placeholder}
          placeholderTextColor="#535353"
          value={value}
          onChangeText={onChangeText}
          onSubmitEditing={handleSubmit}
          returnKeyType="search"
          autoCorrect={false}
          autoCapitalize="none"
        />
        {value.length > 0 && (
          <TouchableOpacity onPress={handleClear} style={styles.clearButton}>
            <Icon name="close-circle" size={18} color="#535353" />
          </TouchableOpacity>
        )}
      </View>

      {loading ? (
        <ActivityIndicator size="small" color="#1DB954" style={styles.loadingIndicator} />
      ) : (
        <TouchableOpacity
          style={[styles.searchButton, !value.trim() && styles.searchButtonDisabled]}
          onPress={handleSubmit}
          disabled={!value.trim()}>
          <Icon name="arrow-forward" size={20} color="#fff" />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  inputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#282828',
    borderRadius: 10,
    paddingHorizontal: 15,
    height: 50,
  },
  input: {
    flex: 1,
    color: '#fff',
    fontSize: 16,
    marginLeft: 10,
  },
  clearButton: {
    padding: 5,
  },
  searchButton: {
    backgroundColor: '#1DB954',
    width: 50,
    height: 50,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchButtonDisabled: {
    backgroundColor: '#282828',
  },
  loadingIndicator: {
    width: 50,
    height: 50,
  },
});

export default SearchBar;
