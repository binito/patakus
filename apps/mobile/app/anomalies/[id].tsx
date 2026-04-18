import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Image,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  Alert,
  Dimensions,
} from 'react-native';
import { useLocalSearchParams, router, useNavigation } from 'expo-router';
import { api } from '../../src/lib/api';
import { Card } from '../../src/components/ui/Card';
import { Badge, severityVariant, statusVariant } from '../../src/components/ui/Badge';

const { width: SCREEN_W } = Dimensions.get('window');

interface AnomalyDetail {
  id: string;
  title: string;
  description: string;
  severity: string;
  status: string;
  area?: string;
  photos: string[]; // array of URLs
  createdAt: string;
  resolvedAt?: string;
  operatorName?: string;
  clientName?: string;
}

const SEVERITY_LABELS: Record<string, string> = {
  low: 'Baixa',
  medium: 'Média',
  high: 'Alta',
  critical: 'Crítica',
};

const STATUS_LABELS: Record<string, string> = {
  open: 'Aberto',
  in_progress: 'Em progresso',
  resolved: 'Resolvido',
  closed: 'Fechado',
};

export default function AnomalyDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const navigation = useNavigation();
  const [anomaly, setAnomaly] = useState<AnomalyDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [lightboxUri, setLightboxUri] = useState<string | null>(null);

  useEffect(() => {
    async function fetchAnomaly() {
      try {
        const { data } = await api.get<AnomalyDetail>(`/reports/anomalies/${id}`);
        setAnomaly(data);
        navigation.setOptions({ title: data.title });
      } catch {
        Alert.alert('Erro', 'Não foi possível carregar a anomalia.', [
          { text: 'OK', onPress: () => router.back() },
        ]);
      } finally {
        setLoading(false);
      }
    }
    fetchAnomaly();
  }, [id]);

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  if (!anomaly) return null;

  const severityLabel = SEVERITY_LABELS[anomaly.severity] ?? anomaly.severity;
  const statusLabel = STATUS_LABELS[anomaly.status] ?? anomaly.status;

  return (
    <>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {/* Header */}
        <Card style={styles.headerCard}>
          <Text style={styles.title}>{anomaly.title}</Text>
          <View style={styles.badgeRow}>
            <Badge label={severityLabel} variant={severityVariant(anomaly.severity)} />
            <Badge label={statusLabel} variant={statusVariant(anomaly.status)} style={{ marginLeft: 8 }} />
          </View>
          {anomaly.area ? <Text style={styles.area}>{anomaly.area}</Text> : null}
        </Card>

        {/* Meta */}
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Informações</Text>
          <Row label="Reportado em" value={new Date(anomaly.createdAt).toLocaleString('pt-PT')} />
          {anomaly.operatorName ? <Row label="Operador" value={anomaly.operatorName} /> : null}
          {anomaly.clientName ? <Row label="Cliente" value={anomaly.clientName} /> : null}
          {anomaly.resolvedAt ? (
            <Row label="Resolvido em" value={new Date(anomaly.resolvedAt).toLocaleString('pt-PT')} />
          ) : null}
        </Card>

        {/* Description */}
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Descrição</Text>
          <Text style={styles.description}>{anomaly.description}</Text>
        </Card>

        {/* Photos */}
        {anomaly.photos.length > 0 && (
          <Card style={styles.section}>
            <Text style={styles.sectionTitle}>Fotos ({anomaly.photos.length})</Text>
            <View style={styles.photoGrid}>
              {anomaly.photos.map((uri, index) => (
                <TouchableOpacity
                  key={index}
                  onPress={() => setLightboxUri(uri)}
                  activeOpacity={0.85}
                >
                  <Image
                    source={{ uri }}
                    style={styles.photoThumb}
                    resizeMode="cover"
                  />
                </TouchableOpacity>
              ))}
            </View>
          </Card>
        )}
      </ScrollView>

      {/* Lightbox */}
      <Modal
        visible={lightboxUri !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setLightboxUri(null)}
      >
        <TouchableOpacity
          style={styles.lightboxOverlay}
          activeOpacity={1}
          onPress={() => setLightboxUri(null)}
        >
          {lightboxUri && (
            <Image
              source={{ uri: lightboxUri }}
              style={styles.lightboxImage}
              resizeMode="contain"
            />
          )}
          <Text style={styles.lightboxHint}>Toque para fechar</Text>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={rowStyles.row}>
      <Text style={rowStyles.label}>{label}</Text>
      <Text style={rowStyles.value}>{value}</Text>
    </View>
  );
}

const rowStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  label: { fontSize: 13, color: '#6b7280', fontWeight: '500' },
  value: { fontSize: 13, color: '#111827', fontWeight: '600', flex: 1, textAlign: 'right' },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f4f6' },
  content: { padding: 16, paddingBottom: 40 },
  loader: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  headerCard: { marginBottom: 12 },
  title: { fontSize: 20, fontWeight: '700', color: '#111827', marginBottom: 10 },
  badgeRow: { flexDirection: 'row', marginBottom: 8 },
  area: { fontSize: 13, color: '#2563eb', fontWeight: '600' },
  section: { marginBottom: 12 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#374151', marginBottom: 10 },
  description: { fontSize: 15, color: '#374151', lineHeight: 22 },
  photoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  photoThumb: {
    width: (SCREEN_W - 32 - 32 - 20) / 3,
    height: (SCREEN_W - 32 - 32 - 20) / 3,
    borderRadius: 8,
    backgroundColor: '#e5e7eb',
  },
  lightboxOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  lightboxImage: {
    width: SCREEN_W,
    height: SCREEN_W * 1.3,
  },
  lightboxHint: { color: 'rgba(255,255,255,0.5)', marginTop: 16, fontSize: 13 },
});
