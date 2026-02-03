// Reusable Card component for consistent layouts

import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { lightTheme } from '../../theme';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  shadow?: 'none' | 'sm' | 'md' | 'lg';
  radius?: 'sm' | 'md' | 'lg' | 'xl';
}

export const Card: React.FC<CardProps> = ({
  children,
  style,
  padding = 'md',
  shadow = 'sm',
  radius = 'md',
}) => {
  const theme = lightTheme;

  const getCardStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.border,
    };

    // Padding styles
    const paddingStyles: Record<string, ViewStyle> = {
      none: {},
      sm: { padding: theme.spacing.sm },
      md: { padding: theme.spacing.md },
      lg: { padding: theme.spacing.lg },
    };

    // Border radius styles
    const radiusStyles: Record<string, ViewStyle> = {
      sm: { borderRadius: theme.borderRadius.sm },
      md: { borderRadius: theme.borderRadius.md },
      lg: { borderRadius: theme.borderRadius.lg },
      xl: { borderRadius: theme.borderRadius.xl },
    };

    // Shadow styles
    const shadowStyles: Record<string, ViewStyle> = {
      none: {},
      sm: theme.shadows.sm,
      md: theme.shadows.md,
      lg: theme.shadows.lg,
    };

    return {
      ...baseStyle,
      ...paddingStyles[padding],
      ...radiusStyles[radius],
      ...shadowStyles[shadow],
    };
  };

  return (
    <View style={[getCardStyle(), style]}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  // Additional styles can be added here if needed
});

export default Card;
