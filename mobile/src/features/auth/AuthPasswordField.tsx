import { useState, type ComponentProps } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { authChromeStyles as chrome } from './authChrome.js';

type AuthPasswordFieldProps = {
  label?: string;
  value: string;
  onChangeText: (value: string) => void;
  error?: string;
  editable?: boolean;
  accessibilityLabel?: string;
  placeholder?: string;
  textContentType?: ComponentProps<typeof TextInput>['textContentType'];
  autoComplete?: ComponentProps<typeof TextInput>['autoComplete'];
  onSubmitEditing?: () => void;
  returnKeyType?: 'done' | 'go' | 'next' | 'send';
};

export default function AuthPasswordField({
  label = 'Lozinka',
  value,
  onChangeText,
  error,
  editable = true,
  accessibilityLabel = 'Lozinka',
  placeholder = '••••••••',
  textContentType = 'password',
  autoComplete = 'password',
  onSubmitEditing,
  returnKeyType = 'done',
}: AuthPasswordFieldProps) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <View style={chrome.field}>
      <Text style={chrome.label}>{label}</Text>
      <View style={styles.passwordRow}>
        <TextInput
          style={[
            chrome.input,
            styles.passwordInput,
            error ? chrome.inputInvalid : null,
          ]}
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={!showPassword}
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete={autoComplete}
          textContentType={textContentType}
          placeholder={placeholder}
          placeholderTextColor="rgba(232, 242, 239, 0.28)"
          editable={editable}
          accessibilityLabel={accessibilityLabel}
          onSubmitEditing={onSubmitEditing}
          returnKeyType={returnKeyType}
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={showPassword ? 'Sakrij lozinku' : 'Prikaži lozinku'}
          onPress={() => setShowPassword((prev) => !prev)}
          style={({ pressed }) => [styles.eyeBtn, pressed && chrome.pressed]}
          hitSlop={8}
        >
          <Ionicons
            name={showPassword ? 'eye-off-outline' : 'eye-outline'}
            size={20}
            color="rgba(232, 242, 239, 0.55)"
          />
        </Pressable>
      </View>
      {error ? <Text style={chrome.fieldError}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  passwordRow: {
    position: 'relative',
    justifyContent: 'center',
  },
  passwordInput: {
    paddingRight: 48,
  },
  eyeBtn: {
    position: 'absolute',
    right: 6,
    top: 0,
    bottom: 0,
    width: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
