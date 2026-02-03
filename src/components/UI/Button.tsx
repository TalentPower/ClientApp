// Reusable Button component with consistent styling

import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  ActivityIndicator,
} from 'react-native';
import { lightTheme } from '../../theme';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'success' | 'warning' | 'error' | 'info' | 'add' | 'edit' | 'delete';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  style,
  textStyle,
  fullWidth = false,
}) => {
  const theme = lightTheme;

  const getButtonStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: theme.borderRadius.md,
      flexDirection: 'row',
    };

    // Size styles
    const sizeStyles: Record<string, ViewStyle> = {
      sm: {
        paddingHorizontal: theme.spacing.md,
        paddingVertical: theme.spacing.sm,
        minHeight: 36,
      },
      md: {
        paddingHorizontal: theme.spacing.lg,
        paddingVertical: theme.spacing.md,
        minHeight: 44,
      },
      lg: {
        paddingHorizontal: theme.spacing.xl,
        paddingVertical: theme.spacing.lg,
        minHeight: 52,
      },
    };

    // Variant styles
    const variantStyles: Record<string, ViewStyle> = {
      primary: {
        backgroundColor: disabled ? theme.colors.textDisabled : theme.colors.primary,
        borderWidth: 0,
      },
      secondary: {
        backgroundColor: disabled ? theme.colors.textDisabled : theme.colors.secondary,
        borderWidth: 0,
      },
      success: {
        backgroundColor: disabled ? theme.colors.textDisabled : theme.colors.success,
        borderWidth: 0,
      },
      warning: {
        backgroundColor: disabled ? theme.colors.textDisabled : theme.colors.warning,
        borderWidth: 0,
      },
      error: {
        backgroundColor: disabled ? theme.colors.textDisabled : theme.colors.error,
        borderWidth: 0,
      },
      info: {
        backgroundColor: disabled ? theme.colors.textDisabled : theme.colors.info,
        borderWidth: 0,
      },
      add: {
        backgroundColor: disabled ? theme.colors.textDisabled : theme.colors.add,
        borderWidth: 0,
      },
      edit: {
        backgroundColor: disabled ? theme.colors.textDisabled : theme.colors.edit,
        borderWidth: 0,
      },
      delete: {
        backgroundColor: disabled ? theme.colors.textDisabled : theme.colors.delete,
        borderWidth: 0,
      },
      outline: {
        backgroundColor: theme.colors.transparent,
        borderWidth: 1,
        borderColor: disabled ? theme.colors.textDisabled : theme.colors.primary,
      },
      ghost: {
        backgroundColor: theme.colors.transparent,
        borderWidth: 0,
      },
    };

    const widthStyle: ViewStyle = fullWidth ? { width: '100%' } : {};

    return {
      ...baseStyle,
      ...sizeStyles[size],
      ...variantStyles[variant],
      ...widthStyle,
    };
  };

  const getTextStyle = (): TextStyle => {
    const baseStyle: TextStyle = {
      fontFamily: theme.typography.fontFamily.medium,
      textAlign: 'center',
    };

    // Size styles
    const sizeStyles: Record<string, TextStyle> = {
      sm: {
        fontSize: theme.typography.fontSize.sm,
      },
      md: {
        fontSize: theme.typography.fontSize.base,
      },
      lg: {
        fontSize: theme.typography.fontSize.lg,
      },
    };

    // Variant styles
    const variantStyles: Record<string, TextStyle> = {
      primary: {
        color: theme.colors.textOnPrimary,
      },
      secondary: {
        color: theme.colors.textOnPrimary,
      },
      success: {
        color: theme.colors.textOnPrimary,
      },
      warning: {
        color: theme.colors.text, // Dark text on yellow background
      },
      error: {
        color: theme.colors.textOnPrimary,
      },
      info: {
        color: theme.colors.textOnPrimary,
      },
      add: {
        color: theme.colors.textOnPrimary,
      },
      edit: {
        color: theme.colors.text, // Dark text on yellow background
      },
      delete: {
        color: theme.colors.textOnPrimary,
      },
      outline: {
        color: disabled ? theme.colors.textDisabled : theme.colors.primary,
      },
      ghost: {
        color: disabled ? theme.colors.textDisabled : theme.colors.primary,
      },
    };

    return {
      ...baseStyle,
      ...sizeStyles[size],
      ...variantStyles[variant],
    };
  };

  return (
    <TouchableOpacity
      style={[getButtonStyle(), style]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'outline' || variant === 'ghost' ? theme.colors.primary : theme.colors.white}
        />
      ) : (
        <Text style={[getTextStyle(), textStyle]}>{title}</Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  // Additional custom styles can be added here if needed
});

export default Button;
