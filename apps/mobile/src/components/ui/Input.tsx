import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TextInputProps,
  TouchableOpacity,
} from 'react-native';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  secureToggle?: boolean;
}

export function Input({ label, error, secureToggle, secureTextEntry, style, ...props }: InputProps) {
  const [hidden, setHidden] = useState(secureTextEntry ?? false);

  return (
    <View style={styles.container}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View style={styles.inputWrapper}>
        <TextInput
          style={[styles.input, error ? styles.inputError : null, style]}
          placeholderTextColor="#9ca3af"
          secureTextEntry={hidden}
          autoCapitalize="none"
          {...props}
        />
        {secureToggle ? (
          <TouchableOpacity style={styles.toggle} onPress={() => setHidden((h) => !h)}>
            <Text style={styles.toggleText}>{hidden ? 'Mostrar' : 'Ocultar'}</Text>
          </TouchableOpacity>
        ) : null}
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 6,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#d1d5db',
    borderRadius: 10,
    backgroundColor: '#ffffff',
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  inputError: {
    borderColor: '#dc2626',
  },
  toggle: {
    paddingHorizontal: 14,
  },
  toggleText: {
    fontSize: 13,
    color: '#2563eb',
    fontWeight: '500',
  },
  error: {
    marginTop: 4,
    fontSize: 13,
    color: '#dc2626',
  },
});
