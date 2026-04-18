import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';

type BadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'neutral';

const VARIANT_STYLES: Record<BadgeVariant, { bg: string; text: string }> = {
  success: { bg: '#dcfce7', text: '#16a34a' },
  warning: { bg: '#fef9c3', text: '#ca8a04' },
  danger:  { bg: '#fee2e2', text: '#dc2626' },
  info:    { bg: '#dbeafe', text: '#2563eb' },
  neutral: { bg: '#f3f4f6', text: '#6b7280' },
};

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  style?: ViewStyle;
}

export function Badge({ label, variant = 'neutral', style }: BadgeProps) {
  const { bg, text } = VARIANT_STYLES[variant];
  return (
    <View style={[styles.badge, { backgroundColor: bg }, style]}>
      <Text style={[styles.label, { color: text }]}>{label}</Text>
    </View>
  );
}

export function severityVariant(severity: string): BadgeVariant {
  switch (severity?.toLowerCase()) {
    case 'critical':
    case 'critica':
      return 'danger';
    case 'high':
    case 'alta':
      return 'warning';
    case 'medium':
    case 'media':
      return 'info';
    default:
      return 'neutral';
  }
}

export function statusVariant(status: string): BadgeVariant {
  switch (status?.toLowerCase()) {
    case 'completed':
    case 'concluido':
    case 'concluída':
      return 'success';
    case 'pending':
    case 'pendente':
      return 'warning';
    case 'open':
    case 'aberto':
      return 'danger';
    case 'resolved':
    case 'resolvido':
      return 'success';
    default:
      return 'neutral';
  }
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
  },
});
