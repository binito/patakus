import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { api } from '../../src/lib/api';
import { Card } from '../../src/components/ui/Card';
import { Button } from '../../src/components/ui/Button';

interface OleoRecord {
  id: string;
  data: string;
  fritadeira: string;
  temperatura: number;
  resultado: number;
  acoes?: string;
  responsavel: { name: string };
}

const RESULTADO_OPTIONS = [
  { value: 1, label: '1 – Bom (<5%)', color: '#15803d', bg: '#dcfce7' },
  { value: 2, label: '2 – Aceitável (5–10%)', color: '#0369a1', bg: '#dbeafe' },
  { value: 3, label: '3 – Atenção (11–17%)', color: '#b45309', bg: '#fef3c7' },
  { value: 4, label: '4 – Mau (18–24%)', color: '#c2410c', bg: '#ffedd5' },
  { value: 5, label: '5 – Substituir (>24%)', color: '#dc2626', bg: '#fee2e2' },
];

function getResultadoOption(v: number) {
  return RESULTADO_OPTIONS.find(o => o.value === v) ?? RESULTADO_OPTIONS[0];
}

function today() {
  return new Date().toISOString().split('T')[0];
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export default function OleosScreen() {
  const [records, setRecords] = useState<OleoRecord[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [fritadeira, setFritadeira] = useState('');
  const [temperatura, setTemperatura] = useState('');
  const [resultado, setResultado] = useState(1);
  const [acoes, setAcoes] = useState('');

  const fetchData = useCallback(async () => {
    try {
      const start = new Date();
      start.setDate(start.getDate() - 30);
      const { data } = await api.get<OleoRecord[]>(
        `/registos/oleos?startDate=${start.toISOString().split('T')[0]}&endDate=${today()}`
      );
      setRecords(data);
    } catch { } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }, [fetchData]);

  function resetForm() {
    setFritadeira(''); setTemperatura(''); setResultado(1); setAcoes('');
  }

  async function submit() {
    if (!fritadeira.trim() || !temperatura.trim()) {
      Alert.alert('Campos obrigatórios', 'Fritadeira e temperatura são obrigatórios.');
      return;
    }
    const temp = parseFloat(temperatura.replace(',', '.'));
    if (isNaN(temp)) {
      Alert.alert('Temperatura inválida', 'Introduz um valor numérico para a temperatura.');
      return;
    }
    setSubmitting(true);
    try {
      await api.post('/registos/oleos', {
        data: today(),
        fritadeira: fritadeira.trim(),
        temperatura: temp,
        resultado,
        acoes: acoes.trim() || undefined,
      });
      const msg = resultado >= 4
        ? 'Atenção: resultado indica necessidade de ação imediata!'
        : 'Registo guardado com sucesso.';
      Alert.alert('Guardado!', msg);
      setModalVisible(false);
      resetForm();
      fetchData();
    } catch (e: any) {
      Alert.alert('Erro', e?.response?.data?.message ?? 'Não foi possível guardar.');
    } finally { setSubmitting(false); }
  }

  const alertCount = records.filter(r => r.resultado >= 4).length;

  return (
    <>
      <FlatList
        style={styles.container}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#b45309" />}
        ListHeaderComponent={
          <View>
            <View style={[styles.summaryBox, alertCount > 0 && styles.summaryBoxAlert]}>
              <Text style={styles.summaryTitle}>🍳 Controlo do Óleo da Fritura</Text>
              <Text style={styles.summaryText}>
                {records.length === 0
                  ? 'Sem registos nos últimos 30 dias'
                  : alertCount > 0
                    ? `${records.length} registo${records.length !== 1 ? 's' : ''} · ${alertCount} alerta${alertCount !== 1 ? 's' : ''} ⚠`
                    : `${records.length} registo${records.length !== 1 ? 's' : ''} nos últimos 30 dias`}
              </Text>
            </View>
            <Button label="+ Novo Registo" onPress={() => setModalVisible(true)} style={styles.newBtn} />
          </View>
        }
        data={records}
        keyExtractor={r => r.id}
        renderItem={({ item: r }) => {
          const opt = getResultadoOption(r.resultado);
          return (
            <Card style={[styles.card, r.resultado >= 4 && styles.cardAlert]}>
              <View style={styles.cardRow}>
                <View style={styles.cardMain}>
                  <Text style={styles.cardTitle}>{r.fritadeira}</Text>
                  <Text style={styles.cardSub}>{r.temperatura}°C</Text>
                  <Text style={styles.cardMeta}>{formatDate(r.data)} · {r.responsavel.name}</Text>
                  {r.acoes ? <Text style={styles.cardAcoes}>{r.acoes}</Text> : null}
                </View>
                <View style={[styles.badge, { backgroundColor: opt.bg }]}>
                  <Text style={[styles.badgeText, { color: opt.color }]}>{opt.value}</Text>
                  <Text style={[styles.badgeLabel, { color: opt.color }]}>
                    {opt.value === 1 ? 'BOM' : opt.value === 2 ? 'OK' : opt.value === 3 ? 'ATEN.' : opt.value === 4 ? 'MAU' : 'SUBST.'}
                  </Text>
                </View>
              </View>
            </Card>
          );
        }}
        ListEmptyComponent={
          !loading ? (
            <Card style={styles.emptyCard}><Text style={styles.emptyText}>Sem registos nos últimos 30 dias</Text></Card>
          ) : null
        }
      />

      <Modal visible={modalVisible} animationType="slide" transparent onRequestClose={() => { setModalVisible(false); resetForm(); }}>
        <View style={styles.overlay}>
          <ScrollView style={styles.modal} contentContainerStyle={styles.modalContent} keyboardShouldPersistTaps="handled">
            <Text style={styles.modalTitle}>Novo Registo de Óleos</Text>
            <Text style={styles.modalSub}>Data: {new Date().toLocaleDateString('pt-PT')}</Text>

            <Text style={styles.label}>Fritadeira *</Text>
            <TextInput style={styles.input} placeholder="ex: Fritadeira 1" placeholderTextColor="#9ca3af"
              value={fritadeira} onChangeText={setFritadeira} />

            <Text style={styles.label}>Temperatura (°C) *</Text>
            <TextInput style={styles.input} placeholder="ex: 180" placeholderTextColor="#9ca3af"
              value={temperatura} onChangeText={setTemperatura} keyboardType="decimal-pad" />

            <Text style={styles.label}>Resultado (Compostos Polares) *</Text>
            <View style={styles.resultadoGrid}>
              {RESULTADO_OPTIONS.map(opt => (
                <TouchableOpacity
                  key={opt.value}
                  style={[
                    styles.resultadoBtn,
                    { borderColor: opt.color, backgroundColor: resultado === opt.value ? opt.color : '#fff' },
                  ]}
                  onPress={() => setResultado(opt.value)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.resultadoBtnText, { color: resultado === opt.value ? '#fff' : opt.color }]}>
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {resultado >= 4 && (
              <View style={styles.alertBox}>
                <Text style={styles.alertText}>⚠ Resultado crítico — regista as ações tomadas.</Text>
              </View>
            )}

            <Text style={styles.label}>Ações Tomadas</Text>
            <TextInput style={styles.textArea} placeholder="ex: Óleo substituído" placeholderTextColor="#9ca3af"
              value={acoes} onChangeText={setAcoes} multiline numberOfLines={2} textAlignVertical="top" />

            <View style={styles.actions}>
              <Button label="Cancelar" variant="secondary" onPress={() => { setModalVisible(false); resetForm(); }} style={styles.btn} />
              <Button label="Guardar" onPress={submit} loading={submitting} style={styles.btn} />
            </View>
          </ScrollView>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f4f6' },
  content: { padding: 16, paddingBottom: 32 },
  summaryBox: { backgroundColor: '#b45309', borderRadius: 12, padding: 16, marginBottom: 12 },
  summaryBoxAlert: { backgroundColor: '#c2410c' },
  summaryTitle: { color: '#fff', fontSize: 15, fontWeight: '700' },
  summaryText: { color: '#fef3c7', fontSize: 12, marginTop: 4 },
  newBtn: { marginBottom: 16 },
  card: { marginBottom: 10 },
  cardAlert: { borderLeftWidth: 3, borderLeftColor: '#dc2626', backgroundColor: '#fff5f5' },
  cardRow: { flexDirection: 'row', alignItems: 'flex-start' },
  cardMain: { flex: 1 },
  cardTitle: { fontSize: 15, fontWeight: '700', color: '#111827', marginBottom: 2 },
  cardSub: { fontSize: 12, color: '#6b7280' },
  cardMeta: { fontSize: 11, color: '#9ca3af', marginTop: 4 },
  cardAcoes: { fontSize: 12, color: '#374151', marginTop: 4, fontStyle: 'italic' },
  badge: { alignItems: 'center', justifyContent: 'center', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 6, minWidth: 54 },
  badgeText: { fontSize: 20, fontWeight: '800' },
  badgeLabel: { fontSize: 10, fontWeight: '700', marginTop: 1 },
  emptyCard: { alignItems: 'center', paddingVertical: 32 },
  emptyText: { color: '#9ca3af', fontSize: 14 },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modal: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '92%' },
  modalContent: { padding: 24, paddingBottom: 48 },
  modalTitle: { fontSize: 18, fontWeight: '800', color: '#111827' },
  modalSub: { fontSize: 13, color: '#6b7280', marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '600', color: '#374151', marginTop: 14, marginBottom: 6 },
  input: { borderWidth: 1.5, borderColor: '#d1d5db', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: '#111827' },
  textArea: { borderWidth: 1.5, borderColor: '#d1d5db', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: '#111827', minHeight: 60 },
  resultadoGrid: { gap: 8 },
  resultadoBtn: { borderWidth: 1.5, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10 },
  resultadoBtnText: { fontSize: 13, fontWeight: '600' },
  alertBox: { backgroundColor: '#ffedd5', borderRadius: 8, padding: 10, marginTop: 10 },
  alertText: { color: '#c2410c', fontSize: 13, fontWeight: '600' },
  actions: { flexDirection: 'row', gap: 12, marginTop: 24 },
  btn: { flex: 1 },
});
