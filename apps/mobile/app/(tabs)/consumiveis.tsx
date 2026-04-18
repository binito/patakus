import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
  Modal,
  Alert,
  TextInput,
  ScrollView,
} from 'react-native';
import { api } from '../../src/lib/api';
import { useAuthStore } from '../../src/store/auth.store';
import { Card } from '../../src/components/ui/Card';
import { Badge } from '../../src/components/ui/Badge';
import { Button } from '../../src/components/ui/Button';

interface Consumable {
  id: string;
  name: string;
  unit: string;
  currentStock: number;
  minStock: number;
  category?: string;
}

function stockVariant(current: number, min: number): 'success' | 'warning' | 'danger' {
  if (current <= 0) return 'danger';
  if (current <= min) return 'warning';
  return 'success';
}

function stockLabel(current: number, min: number): string {
  if (current <= 0) return 'Sem stock';
  if (current <= min) return 'Stock baixo';
  return 'OK';
}

export default function ConsumiveisScreen() {
  const user = useAuthStore((s) => s.user);
  const [items, setItems] = useState<Consumable[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Consumable | null>(null);
  const [shortageNote, setShortageNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchConsumables = useCallback(async () => {
    try {
      const { data } = await api.get<Consumable[]>(`/consumables?clientId=${user?.clientId}`);
      setItems(data);
    } catch {
      Alert.alert('Erro', 'Não foi possível carregar os consumíveis.');
    } finally {
      setLoading(false);
    }
  }, [user?.clientId]);

  useEffect(() => { fetchConsumables(); }, [fetchConsumables]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchConsumables();
    setRefreshing(false);
  }, [fetchConsumables]);

  function openShortageModal(item: Consumable) {
    setSelectedItem(item);
    setShortageNote('');
    setModalVisible(true);
  }

  async function submitShortage() {
    if (!selectedItem) return;
    setSubmitting(true);
    try {
      await api.post('/consumables/shortage', {
        clientId: user?.clientId,
        operatorId: user?.id,
        consumableId: selectedItem.id,
        consumableName: selectedItem.name,
        note: shortageNote.trim() || undefined,
      });
      Alert.alert('Enviado', 'Falta reportada com sucesso!');
      setModalVisible(false);
    } catch {
      Alert.alert('Erro', 'Não foi possível enviar o pedido. Tente novamente.');
    } finally {
      setSubmitting(false);
    }
  }

  const lowStockCount = items.filter((i) => i.currentStock <= i.minStock).length;

  return (
    <>
      <FlatList
        style={styles.container}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#2563eb" />}
        ListHeaderComponent={
          <View style={styles.summaryBox}>
            <Text style={styles.summaryTitle}>Consumíveis</Text>
            <Text style={styles.summaryText}>
              {lowStockCount > 0
                ? `${lowStockCount} item${lowStockCount !== 1 ? 's' : ''} com stock baixo ou esgotado`
                : 'Todos os stocks estão adequados'}
            </Text>
          </View>
        }
        data={items}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          const variant = stockVariant(item.currentStock, item.minStock);
          const pct = item.minStock > 0
            ? Math.min(100, Math.round((item.currentStock / (item.minStock * 2)) * 100))
            : 100;

          return (
            <Card style={styles.card}>
              <View style={styles.cardTop}>
                <View style={styles.cardInfo}>
                  {item.category ? (
                    <Text style={styles.category}>{item.category}</Text>
                  ) : null}
                  <Text style={styles.itemName}>{item.name}</Text>
                  <Text style={styles.stockText}>
                    {item.currentStock} {item.unit} disponíveis
                    {item.minStock > 0 ? ` (mín: ${item.minStock})` : ''}
                  </Text>
                </View>
                <Badge label={stockLabel(item.currentStock, item.minStock)} variant={variant} />
              </View>

              <View style={styles.progressRow}>
                <View style={styles.progressBg}>
                  <View
                    style={[
                      styles.progressFill,
                      {
                        width: `${pct}%` as `${number}%`,
                        backgroundColor: variant === 'danger' ? '#dc2626' : variant === 'warning' ? '#ca8a04' : '#16a34a',
                      },
                    ]}
                  />
                </View>
              </View>

              {variant !== 'success' && (
                <TouchableOpacity style={styles.reportBtn} onPress={() => openShortageModal(item)}>
                  <Text style={styles.reportBtnText}>Reportar falta</Text>
                </TouchableOpacity>
              )}
            </Card>
          );
        }}
        ListEmptyComponent={
          !loading ? (
            <Card style={styles.emptyCard}>
              <Text style={styles.emptyText}>Sem consumíveis registados</Text>
            </Card>
          ) : null
        }
      />

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Reportar Falta</Text>
            {selectedItem && (
              <Text style={styles.modalSub}>
                {selectedItem.name} — {selectedItem.currentStock} {selectedItem.unit} em stock
              </Text>
            )}
            <Text style={styles.modalLabel}>Nota (opcional)</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Ex: Já faz 2 dias sem stock..."
              placeholderTextColor="#9ca3af"
              value={shortageNote}
              onChangeText={setShortageNote}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
            <View style={styles.modalActions}>
              <Button
                label="Cancelar"
                onPress={() => setModalVisible(false)}
                variant="secondary"
                style={styles.modalBtn}
              />
              <Button
                label="Enviar"
                onPress={submitShortage}
                loading={submitting}
                style={styles.modalBtn}
              />
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f4f6' },
  content: { padding: 16, paddingBottom: 32 },
  summaryBox: {
    backgroundColor: '#2563eb',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  summaryTitle: { color: '#ffffff', fontSize: 18, fontWeight: '700' },
  summaryText: { color: '#bfdbfe', fontSize: 13, marginTop: 4 },
  card: { marginBottom: 12 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
  cardInfo: { flex: 1, marginRight: 12 },
  category: { fontSize: 11, color: '#2563eb', fontWeight: '600', textTransform: 'uppercase', marginBottom: 2 },
  itemName: { fontSize: 16, fontWeight: '700', color: '#111827' },
  stockText: { fontSize: 13, color: '#6b7280', marginTop: 2 },
  progressRow: { marginBottom: 10 },
  progressBg: { height: 6, backgroundColor: '#e5e7eb', borderRadius: 999, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 999 },
  reportBtn: {
    alignSelf: 'flex-start',
    paddingVertical: 6,
    paddingHorizontal: 14,
    backgroundColor: '#fee2e2',
    borderRadius: 8,
  },
  reportBtnText: { color: '#dc2626', fontWeight: '600', fontSize: 13 },
  emptyCard: { alignItems: 'center', paddingVertical: 32 },
  emptyText: { color: '#9ca3af', fontSize: 14 },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalBox: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    paddingBottom: 40,
  },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#111827', marginBottom: 4 },
  modalSub: { fontSize: 13, color: '#6b7280', marginBottom: 16 },
  modalLabel: { fontSize: 14, fontWeight: '500', color: '#374151', marginBottom: 6 },
  modalInput: {
    borderWidth: 1.5,
    borderColor: '#d1d5db',
    borderRadius: 10,
    padding: 12,
    fontSize: 15,
    color: '#111827',
    minHeight: 80,
    marginBottom: 20,
  },
  modalActions: { flexDirection: 'row', gap: 12 },
  modalBtn: { flex: 1 },
});
