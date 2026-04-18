import React from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { useAuthStore } from '../../src/store/auth.store';

interface RegistoType {
  emoji: string;
  code: string;
  title: string;
  subtitle: string;
  route: string;
  color: string;
  bg: string;
}

const TIPOS: RegistoType[] = [
  {
    emoji: '📦',
    code: 'R1',
    title: 'Entradas',
    subtitle: 'Controlo de produtos à receção',
    route: '/registos/entradas',
    color: '#1d4ed8',
    bg: '#eff6ff',
  },
  {
    emoji: '🌡️',
    code: 'R2',
    title: 'Temperaturas',
    subtitle: 'Controlo de arcas e frigoríficos',
    route: '/registos/temperaturas',
    color: '#0369a1',
    bg: '#f0f9ff',
  },
  {
    emoji: '🧹',
    code: 'R3',
    title: 'Higienização',
    subtitle: 'Registo de limpeza por zona',
    route: '/registos/higienizacao',
    color: '#15803d',
    bg: '#f0fdf4',
  },
  {
    emoji: '🧪',
    code: 'R4',
    title: 'Desinfeção',
    subtitle: 'Produtos destinados a consumir crus',
    route: '/registos/desinfecao',
    color: '#7c3aed',
    bg: '#faf5ff',
  },
  {
    emoji: '🍳',
    code: 'R6',
    title: 'Óleos de Fritura',
    subtitle: 'Controlo de compostos polares',
    route: '/registos/oleos',
    color: '#b45309',
    bg: '#fffbeb',
  },
];

export default function RegistosScreen() {
  const user = useAuthStore((s) => s.user);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Registos HACCP</Text>
        <Text style={styles.headerSub}>Seleciona o tipo de registo a efetuar</Text>
      </View>

      <View style={styles.grid}>
        {TIPOS.map((tipo) => (
          <TouchableOpacity
            key={tipo.code}
            style={[styles.card, { borderLeftColor: tipo.color, backgroundColor: tipo.bg }]}
            onPress={() => router.push(tipo.route as any)}
            activeOpacity={0.7}
          >
            <View style={styles.cardLeft}>
              <Text style={styles.cardEmoji}>{tipo.emoji}</Text>
              <View style={styles.cardTexts}>
                <View style={styles.cardTitleRow}>
                  <Text style={[styles.cardCode, { color: tipo.color }]}>{tipo.code}</Text>
                  <Text style={[styles.cardTitle, { color: tipo.color }]}>{tipo.title}</Text>
                </View>
                <Text style={styles.cardSub}>{tipo.subtitle}</Text>
              </View>
            </View>
            <Text style={[styles.chevron, { color: tipo.color }]}>›</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.noteBox}>
        <Text style={styles.noteText}>
          📌 Todos os registos ficam associados ao teu utilizador e à data/hora atual.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f4f6' },
  content: { padding: 16, paddingBottom: 32 },
  header: {
    backgroundColor: '#1e3a8a',
    borderRadius: 14,
    padding: 20,
    marginBottom: 20,
  },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#fff' },
  headerSub: { fontSize: 13, color: '#bfdbfe', marginTop: 4 },
  grid: { gap: 12 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07,
    shadowRadius: 4,
    elevation: 2,
  },
  cardLeft: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 14 },
  cardEmoji: { fontSize: 32 },
  cardTexts: { flex: 1 },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 },
  cardCode: { fontSize: 11, fontWeight: '700', opacity: 0.7 },
  cardTitle: { fontSize: 16, fontWeight: '700' },
  cardSub: { fontSize: 12, color: '#6b7280' },
  chevron: { fontSize: 28, fontWeight: '300', marginLeft: 8, opacity: 0.7 },
  noteBox: {
    marginTop: 20,
    backgroundColor: '#fefce8',
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: '#fef08a',
  },
  noteText: { fontSize: 12, color: '#713f12', lineHeight: 18 },
});
