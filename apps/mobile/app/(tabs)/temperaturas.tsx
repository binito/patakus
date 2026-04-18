import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  Modal,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { api } from '../../src/lib/api';
import { useAuthStore } from '../../src/store/auth.store';
import { Card } from '../../src/components/ui/Card';
import { Button } from '../../src/components/ui/Button';

interface TodayRecord {
  temperature: number;
  recordedAt: string;
}

interface Equipment {
  id: string;
  name: string;
  type: 'FRIDGE' | 'FREEZER';
  location?: string;
  minTemp?: number;
  maxTemp?: number;
  today: {
    morning: TodayRecord | null;
    evening: TodayRecord | null;
  };
}

function currentSession(): 'MORNING' | 'EVENING' {
  return new Date().getHours() < 13 ? 'MORNING' : 'EVENING';
}

function tempStatus(temp: number, min?: number, max?: number): 'ok' | 'low' | 'high' {
  if (min !== undefined && temp < min) return 'low';
  if (max !== undefined && temp > max) return 'high';
  return 'ok';
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' });
}

export default function TemperaturasScreen() {
  const user = useAuthStore((s) => s.user);
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  // Modal de registo
  const [modalVisible, setModalVisible] = useState(false);
  const [selected, setSelected] = useState<Equipment | null>(null);
  const [session, setSession] = useState<'MORNING' | 'EVENING'>(currentSession());
  const [tempInput, setTempInput] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const { data } = await api.get<Equipment[]>('/temperature/today');
      setEquipment(data);
    } catch {
      Alert.alert('Erro', 'Não foi possível carregar os equipamentos.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }, [fetchData]);

  function openRecord(eq: Equipment, forSession?: 'MORNING' | 'EVENING') {
    setSelected(eq);
    setSession(forSession ?? currentSession());
    setTempInput('');
    setNotes('');
    setModalVisible(true);
  }

  async function submitRecord() {
    if (!selected) return;
    const temp = parseFloat(tempInput.replace(',', '.'));
    if (isNaN(temp)) {
      Alert.alert('Temperatura inválida', 'Introduz um número válido.');
      return;
    }
    setSubmitting(true);
    try {
      await api.post('/temperature/records', {
        equipmentId: selected.id,
        temperature: temp,
        session,
        notes: notes.trim() || undefined,
      });
      Alert.alert('Registado!', `Temperatura de ${temp}°C guardada.`);
      setModalVisible(false);
      fetchData();
    } catch (e: any) {
      Alert.alert('Erro', e?.response?.data?.message ?? 'Não foi possível guardar o registo.');
    } finally {
      setSubmitting(false);
    }
  }

  const pendingCount = equipment.filter(
    e => !e.today.morning || !e.today.evening
  ).length;

  return (
    <>
      <FlatList
        style={styles.container}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#2563eb" />}
        ListHeaderComponent={
          <View style={[styles.summaryBox, pendingCount === 0 && styles.summaryBoxOk]}>
            <Text style={styles.summaryTitle}>🌡️ Controlo de Temperatura</Text>
            <Text style={styles.summaryText}>
              {pendingCount > 0
                ? `${pendingCount} equipamento${pendingCount !== 1 ? 's' : ''} com registos em falta hoje`
                : 'Todos os registos de hoje estão completos ✓'}
            </Text>
          </View>
        }
        data={equipment}
        keyExtractor={(item) => item.id}
        renderItem={({ item: eq }) => {
          const morningDone = !!eq.today.morning;
          const eveningDone = !!eq.today.evening;
          return (
            <Card style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.cardTitleRow}>
                  <Text style={styles.eqType}>
                    {eq.type === 'FREEZER' ? '🧊 Arca' : '❄️ Frigorífico'}
                  </Text>
                  <Text style={styles.eqName}>{eq.name}</Text>
                  {eq.location ? <Text style={styles.eqLocation}>{eq.location}</Text> : null}
                </View>
                {(eq.minTemp !== undefined || eq.maxTemp !== undefined) && (
                  <Text style={styles.eqRange}>
                    {eq.minTemp ?? '—'}°C a {eq.maxTemp ?? '—'}°C
                  </Text>
                )}
              </View>

              <View style={styles.sessions}>
                {/* Manhã */}
                <TouchableOpacity
                  style={[styles.sessionBtn, morningDone && styles.sessionDone]}
                  onPress={() => openRecord(eq, 'MORNING')}
                >
                  <Text style={styles.sessionLabel}>Manhã</Text>
                  {morningDone ? (
                    <Text style={[styles.sessionTemp, tempStatus(eq.today.morning!.temperature, eq.minTemp, eq.maxTemp) !== 'ok' && styles.sessionTempWarn]}>
                      {eq.today.morning!.temperature}°C
                    </Text>
                  ) : (
                    <Text style={styles.sessionPending}>Registar</Text>
                  )}
                  {morningDone && (
                    <Text style={styles.sessionTime}>{formatTime(eq.today.morning!.recordedAt)}</Text>
                  )}
                </TouchableOpacity>

                {/* Tarde */}
                <TouchableOpacity
                  style={[styles.sessionBtn, eveningDone && styles.sessionDone]}
                  onPress={() => openRecord(eq, 'EVENING')}
                >
                  <Text style={styles.sessionLabel}>Tarde</Text>
                  {eveningDone ? (
                    <Text style={[styles.sessionTemp, tempStatus(eq.today.evening!.temperature, eq.minTemp, eq.maxTemp) !== 'ok' && styles.sessionTempWarn]}>
                      {eq.today.evening!.temperature}°C
                    </Text>
                  ) : (
                    <Text style={styles.sessionPending}>Registar</Text>
                  )}
                  {eveningDone && (
                    <Text style={styles.sessionTime}>{formatTime(eq.today.evening!.recordedAt)}</Text>
                  )}
                </TouchableOpacity>
              </View>
            </Card>
          );
        }}
        ListEmptyComponent={
          !loading ? (
            <Card style={styles.emptyCard}>
              <Text style={styles.emptyText}>Sem equipamentos registados</Text>
            </Card>
          ) : null
        }
      />

      <Modal visible={modalVisible} animationType="slide" transparent onRequestClose={() => setModalVisible(false)}>
        <View style={styles.overlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Registar Temperatura</Text>
            {selected && (
              <Text style={styles.modalSub}>{selected.name}</Text>
            )}

            {/* Selector sessão */}
            <Text style={styles.modalLabel}>Sessão</Text>
            <View style={styles.sessionSelector}>
              {(['MORNING', 'EVENING'] as const).map(s => (
                <TouchableOpacity
                  key={s}
                  style={[styles.sessionOption, session === s && styles.sessionOptionActive]}
                  onPress={() => setSession(s)}
                >
                  <Text style={[styles.sessionOptionText, session === s && styles.sessionOptionTextActive]}>
                    {s === 'MORNING' ? '🌅 Manhã' : '🌙 Tarde'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.modalLabel}>Temperatura (°C) *</Text>
            <TextInput
              style={styles.tempInput}
              placeholder="ex: 4.5"
              placeholderTextColor="#9ca3af"
              keyboardType="decimal-pad"
              value={tempInput}
              onChangeText={setTempInput}
            />

            {selected && (selected.minTemp !== undefined || selected.maxTemp !== undefined) && (
              <Text style={styles.rangeHint}>
                Intervalo aceitável: {selected.minTemp ?? '—'}°C a {selected.maxTemp ?? '—'}°C
              </Text>
            )}

            <Text style={styles.modalLabel}>Observações (opcional)</Text>
            <TextInput
              style={styles.notesInput}
              placeholder="ex: Porta aberta brevemente"
              placeholderTextColor="#9ca3af"
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={2}
              textAlignVertical="top"
            />

            <View style={styles.modalActions}>
              <Button label="Cancelar" onPress={() => setModalVisible(false)} variant="secondary" style={styles.modalBtn} />
              <Button label="Guardar" onPress={submitRecord} loading={submitting} style={styles.modalBtn} />
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
  summaryBoxOk: { backgroundColor: '#16a34a' },
  summaryTitle: { color: '#fff', fontSize: 16, fontWeight: '700' },
  summaryText: { color: '#bfdbfe', fontSize: 13, marginTop: 4 },
  card: { marginBottom: 12 },
  cardHeader: { marginBottom: 12 },
  cardTitleRow: { marginBottom: 2 },
  eqType: { fontSize: 11, color: '#6b7280', textTransform: 'uppercase', fontWeight: '600' },
  eqName: { fontSize: 16, fontWeight: '700', color: '#111827' },
  eqLocation: { fontSize: 12, color: '#9ca3af', marginTop: 1 },
  eqRange: { fontSize: 11, color: '#6b7280', marginTop: 4 },
  sessions: { flexDirection: 'row', gap: 10 },
  sessionBtn: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    borderRadius: 10, borderWidth: 1.5, borderColor: '#e5e7eb',
    paddingVertical: 12, backgroundColor: '#f9fafb',
  },
  sessionDone: { borderColor: '#bbf7d0', backgroundColor: '#f0fdf4' },
  sessionLabel: { fontSize: 11, color: '#6b7280', fontWeight: '600', textTransform: 'uppercase' },
  sessionTemp: { fontSize: 20, fontWeight: '800', color: '#16a34a', marginTop: 2 },
  sessionTempWarn: { color: '#dc2626' },
  sessionPending: { fontSize: 13, color: '#9ca3af', marginTop: 4, fontStyle: 'italic' },
  sessionTime: { fontSize: 11, color: '#9ca3af', marginTop: 2 },
  emptyCard: { alignItems: 'center', paddingVertical: 32 },
  emptyText: { color: '#9ca3af', fontSize: 14 },
  // Modal
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modal: {
    backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20,
    padding: 24, paddingBottom: 40,
  },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#111827', marginBottom: 2 },
  modalSub: { fontSize: 13, color: '#6b7280', marginBottom: 16 },
  modalLabel: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 6, marginTop: 12 },
  sessionSelector: { flexDirection: 'row', gap: 10 },
  sessionOption: {
    flex: 1, paddingVertical: 10, borderRadius: 8,
    borderWidth: 1.5, borderColor: '#e5e7eb', alignItems: 'center',
  },
  sessionOptionActive: { borderColor: '#2563eb', backgroundColor: '#eff6ff' },
  sessionOptionText: { fontSize: 14, color: '#6b7280', fontWeight: '600' },
  sessionOptionTextActive: { color: '#2563eb' },
  tempInput: {
    borderWidth: 1.5, borderColor: '#d1d5db', borderRadius: 10,
    padding: 14, fontSize: 28, fontWeight: '700', color: '#111827',
    textAlign: 'center',
  },
  rangeHint: { fontSize: 12, color: '#6b7280', textAlign: 'center', marginTop: 6 },
  notesInput: {
    borderWidth: 1.5, borderColor: '#d1d5db', borderRadius: 10,
    padding: 12, fontSize: 14, color: '#111827', minHeight: 60,
  },
  modalActions: { flexDirection: 'row', gap: 12, marginTop: 20 },
  modalBtn: { flex: 1 },
});
