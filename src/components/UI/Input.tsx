// Reusable Input component for forms

import React, { useState } from 'react';
import {
  TextInput,
  View,
  Text,
  StyleSheet,
  TextInputProps,
  ViewStyle,
  TextStyle,
  TouchableOpacity,
} from 'react-native';
import { lightTheme } from '../../theme';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  containerStyle?: ViewStyle;
  inputStyle?: TextStyle;
  labelStyle?: TextStyle;
  required?: boolean;
  type?: 'text' | 'email' | 'password' | 'phone';
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  helperText,
  leftIcon,
  rightIcon,
  containerStyle,
  inputStyle,
  labelStyle,
  required = false,
  type = 'text',
  secureTextEntry,
  ...props
}) => {
  const theme = lightTheme;
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const isPassword = type === 'password';
  const shouldSecureText = isPassword ? !isPasswordVisible : secureTextEntry;

  const getKeyboardType = () => {
    switch (type) {
      case 'email':
        return 'email-address';
      case 'phone':
        return 'phone-pad';
      default:
        return 'default';
    }
  };

  const getAutoCompleteType = () => {
    switch (type) {
      case 'email':
        return 'email';
      case 'password':
        return 'password';
      case 'phone':
        return 'tel';
      default:
        return 'off';
    }
  };

  const containerStyles: ViewStyle = {
    marginBottom: theme.spacing.md,
  };

  const labelStyles: TextStyle = {
    fontSize: theme.typography.fontSize.sm,
    fontFamily: theme.typography.fontFamily.medium,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  };

  const inputContainerStyles: ViewStyle = {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: error 
      ? theme.colors.error 
      : isFocused 
        ? theme.colors.primary 
        : theme.colors.border,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.background,
    paddingHorizontal: theme.spacing.md,
    minHeight: 48,
  };

  const textInputStyles: TextStyle = {
    flex: 1,
    fontSize: theme.typography.fontSize.base,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.text,
    paddingVertical: theme.spacing.sm,
  };

  const errorTextStyles: TextStyle = {
    fontSize: theme.typography.fontSize.xs,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.error,
    marginTop: theme.spacing.xs,
  };

  const helperTextStyles: TextStyle = {
    fontSize: theme.typography.fontSize.xs,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.xs,
  };

  const iconStyles = {
    marginHorizontal: theme.spacing.xs,
  };

  const renderPasswordToggle = () => (
    <TouchableOpacity
      onPress={() => setIsPasswordVisible(!isPasswordVisible)}
      style={iconStyles}
    >
      <Text style={{ color: theme.colors.textSecondary, fontSize: 16 }}>
        {isPasswordVisible ? '🙈' : '👁️'}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={[containerStyles, containerStyle]}>
      {label && (
        <Text style={[labelStyles, labelStyle]}>
          {label}
          {required && <Text style={{ color: theme.colors.error }}> *</Text>}
        </Text>
      )}
      
      <View style={inputContainerStyles}>
        {leftIcon && <View style={iconStyles}>{leftIcon}</View>}
        
        <TextInput
          style={[textInputStyles, inputStyle]}
          placeholderTextColor={theme.colors.textDisabled}
          secureTextEntry={shouldSecureText}
          keyboardType={getKeyboardType()}
          autoComplete={getAutoCompleteType()}
          autoCapitalize={type === 'email' ? 'none' : 'sentences'}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          {...props}
        />
        
        {isPassword && renderPasswordToggle()}
        {rightIcon && !isPassword && <View style={iconStyles}>{rightIcon}</View>}
      </View>
      
      {error && <Text style={errorTextStyles}>{error}</Text>}
      {helperText && !error && <Text style={helperTextStyles}>{helperText}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  // Additional styles can be added here if needed
});

export default Input;
