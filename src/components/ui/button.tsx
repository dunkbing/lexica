import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  StyleProp,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useAppStore } from '@/store';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
type ButtonSize = 'small' | 'medium' | 'large';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  style,
  textStyle,
  icon,
  iconPosition = 'left',
}: ButtonProps) {
  const hapticsEnabled = useAppStore((state) => state.hapticsEnabled);
  const tintColor = useThemeColor({}, 'tint');
  const textColor = useThemeColor({}, 'text');

  const handlePress = () => {
    if (hapticsEnabled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onPress();
  };

  const getBackgroundColor = () => {
    if (disabled) return '#9E9E9E';
    switch (variant) {
      case 'primary':
        return tintColor;
      case 'secondary':
        return '#6B7280';
      case 'outline':
      case 'ghost':
        return 'transparent';
      case 'danger':
        return '#EF4444';
      default:
        return tintColor;
    }
  };

  const getTextColor = () => {
    if (disabled) return '#FFFFFF';
    switch (variant) {
      case 'primary':
      case 'secondary':
      case 'danger':
        return '#FFFFFF';
      case 'outline':
        return tintColor;
      case 'ghost':
        return textColor;
      default:
        return '#FFFFFF';
    }
  };

  const getBorderColor = () => {
    if (variant === 'outline') {
      return disabled ? '#9E9E9E' : tintColor;
    }
    return 'transparent';
  };

  const sizeStyles = {
    small: { paddingVertical: 8, paddingHorizontal: 12 },
    medium: { paddingVertical: 12, paddingHorizontal: 20 },
    large: { paddingVertical: 16, paddingHorizontal: 28 },
  };

  const fontSizes = {
    small: 14,
    medium: 16,
    large: 18,
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      disabled={disabled || loading}
      activeOpacity={0.7}
      style={[
        styles.button,
        sizeStyles[size],
        {
          backgroundColor: getBackgroundColor(),
          borderColor: getBorderColor(),
          borderWidth: variant === 'outline' ? 2 : 0,
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={getTextColor()} size="small" />
      ) : (
        <>
          {icon && iconPosition === 'left' && icon}
          <Text
            style={[
              styles.text,
              { color: getTextColor(), fontSize: fontSizes[size] },
              icon && iconPosition === 'left' ? { marginLeft: 8 } : undefined,
              icon && iconPosition === 'right' ? { marginRight: 8 } : undefined,
              textStyle,
            ]}
          >
            {title}
          </Text>
          {icon && iconPosition === 'right' && icon}
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  text: {
    fontWeight: '600',
  },
});
