import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { api } from '../../src/lib/api';
import { useAuthStore } from '../../src/store/auth.store';
import { Card } from '../../src/components/ui/Card';
import { Button } from '../../src/components/ui/Button';

interface EntradaRecord {
  id: string;
  data: string;
  materiaPrima: string;
  fornecedor: string;
  faturaN?: string;
  veiculoOk: boolean;
  embalagemOk: boolean;
  rotulagemOk: boolean;
  produtoOk: boolean;
  temperatura?: number;
  lote?: string;
  operator: { name: string };
}

function today() {
  return new Date().toISOString().split('T')[0];
}

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export default function EntradasScreen() {
  const user = useAuthStore((s) => s.user);
  const [records, setRecords] = useState<EntradaRecord[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [materiaPrima, setMateriaPrima] = useState('');
  const [fornecedor, setFornecedor] = useState('');
  const [faturaN, setFaturaN] = useState('');
  const [veiculoOk, setVeiculoOk] = useState(true);
  const [embalagemOk, setEmbalagemOk] = useState(true);
  const [rotulagemOk, setRotulagemOk] = useState(true);
  const [produtoOk, setProdutoOk] = useState(true);
  const [temperatura, setTemperatura] = useState('');
  const [lote, setLote] = useState('');

  const fetchData = useCallback(async () => {
    try {
      const start = new Date();
      start.setDate(start.getDate() - 30);
      const startDate = start.toISOString().split('T')[0];
      const { data } = await api.get<EntradaRecord[]>(
        `/registos/entradas?startDate=${startDate}&endDate=${today()}`
      );
      setRecords(data);
    } catch {
      // silent
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

  function resetForm() {
    setMateriaPrima(''); setFornecedor(''); setFaturaN('');
    setVeiculoOk(true); setEmbalagemOk(true); setRotulagemOk(true); setProdutoOk(true);
    setTemperatura(''); setLote('');
  }

  async function submit() {
    if (!materiaPrima.trim() || !fornecedor.trim()) {
      Alert.alert('Campos obrigatórios', 'Matéria prima e fornecedor são obrigatórios.');
      return;
    }
    setSubmitting(true);
    try {
      await api.post('/registos/entradas', {
        data: today(),
        materiaPrima: materiaPrima.trim(),
        fornecedor: fornecedor.trim(),
        faturaN: faturaN.trim() || undefined,
        veiculoOk, embalagemOk, rotulagemOk, produtoOk,
        temperatura: temperatura ? parseFloat(temperatura.replace(',', '.')) : undefined,
        lote: lote.trim() || undefined,
      });
      Alert.alert('Guardado!', 'Registo de entrada registado.');
      setModalVisible(false);
      resetForm();
      fetchData();
    } catch (e: any) {
      Alert.alert('Erro', e?.response?.data?.message ?? 'Não foi possível guardar.');
    } finally {
      setSubmitting(false);
    }
  }

  const nonConform = records.filter(r => !r.veiculoOk || !r.embalagemOk || !r.rotulagemOk || !r.produtoOk).length;

  return (
    <>
      <FlatList
        style={styles.container}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#2563eb" />}
        ListHeaderComponent={
          <View>
            <View style={[styles.summaryBox, nonConform === 0 && records.length > 0 && styles.summaryBoxOk]}>
              <Text style={styles.summaryTitle}>📦 Registo de Entradas</Text>
              <Text style={styles.summaryText}>
                {records.length === 0
                  ? 'Sem registos nos últimos 30 dias'
                  : `${records.length} entr${records.length === 1 ? 'ada' : 'adas'} · ${nonConform} não conforme${nonConform !== 1 ? 's' : ''}`}
              </Text>
            </View>
            <Button
              label="+ Nova Entrada"
              onPress={() => setModalVisible(true)}
              style={styles.newBtn}
            />
          </View>
        }
        data={records}
        keyExtractor={(item) => item.id}
        renderItem={({ item: r }) => {
          const allOk = r.veiculoOk && r.embalagemOk && r.rotulagemOk && r.produtoOk;
          return (
            <Card style={[styles.card, !allOk && styles.cardNc]}>
              <View style={styles.cardRow}>
                <View style={styles.cardMain}>
                  <Text style={styles.materia}>{r.materiaPrima}</Text>
                  <Text style={styles.fornecedor}>{r.fornecedor}{r.faturaN ? ` · Fatura ${r.faturaN}` : ''}</Text>
                  <Text style={styles.dataText}>{formatDate(r.data)} · {r.operator.name}</Text>
                </View>
                <View style={styles.cardRight}>
                  <View style={[styles.badge, allOk ? styles.badgeOk : styles.badgeNc]}>
                    <Text style={[styles.badgeText, allOk ? styles.badgeTextOk : styles.badgeTextNc]}>
                      {allOk ? '✓ OK' : '⚠ NC'}
                    </Text>
                  </View>
                  {r.temperatura !== undefined && r.temperatura !== null && (
                    <Text style={styles.temp}>{r.temperatura}°C</Text>
                  )}
                </View>
              </View>
              {!allOk && (
                <View style={styles.ncRow}>
                  {!r.veiculoOk && <Text style={styles.ncTag}>Veículo NC</Text>}
                  {!r.embalagemOk && <Text style={styles.ncTag}>Embalagem NC</Text>}
                  {!r.rotulagemOk && <Text style={styles.ncTag}>Rotulagem NC</Text>}
                  {!r.produtoOk && <Text style={styles.ncTag}>Produto NC</Text>}
                </View>
              )}
            </Card>
          );
        }}
        ListEmptyComponent={
          !loading ? (
            <Card style={styles.emptyCard}>
              <Text style={styles.emptyText}>Sem registos nos últimos 30 dias</Text>
            </Card>
          ) : null
        }
      />

      <Modal visible={modalVisible} animationType="slide" transparent onRequestClose={() => { setModalVisible(false); resetForm(); }}>
        <View style={styles.overlay}>
          <ScrollView style={styles.modal} contentContainerStyle={styles.modalContent} keyboardShouldPersistTaps="handled">
            <Text style={styles.modalTitle}>Nova Entrada</Text>
            <Text style={styles.modalSub}>Data: {new Date().toLocaleDateString('pt-PT')}</Text>

            <Text style={styles.label}>Matéria Prima *</Text>
            <TextInput style={styles.input} placeholder="ex: Alface, Carne de frango" placeholderTextColor="#9ca3af"
              value={materiaPrima} onChangeText={setMateriaPrima} />

            <Text style={styles.label}>Fornecedor *</Text>
            <TextInput style={styles.input} placeholder="Nome do fornecedor" placeholderTextColor="#9ca3af"
              value={fornecedor} onChangeText={setFornecedor} />

            <Text style={styles.label}>Fatura N.º</Text>
            <TextInput style={styles.input} placeholder="Opcional" placeholderTextColor="#9ca3af"
              value={faturaN} onChangeText={setFaturaN} />

            <Text style={styles.sectionTitle}>Nível de Higiene e Segurança</Text>

            {[
              { key: 'veiculoOk', label: 'Veículo Conforme', value: veiculoOk, setter: setVeiculoOk },
              { key: 'embalagemOk', label: 'Embalagem Conforme', value: embalagemOk, setter: setEmbalagemOk },
              { key: 'rotulagemOk', label: 'Rotulagem Conforme', value: rotulagemOk, setter: setRotulagemOk },
              { key: 'produtoOk', label: 'Produto Conforme', value: produtoOk, setter: setProdutoOk },
            ].map(({ key, label, value, setter }) => (
              <View key={key} style={styles.switchRow}>
                <Text style={styles.switchLabel}>{label}</Text>
                <View style={styles.switchRight}>
                  <Text style={[styles.switchStatus, value ? styles.switchOk : styles.switchNc]}>
                    {value ? 'C' : 'NC'}
                  </Text>
                  <Switch
                    value={value}
                    onValueChange={setter}
                    trackColor={{ false: '#fca5a5', true: '#86efac' }}
                    thumbColor={value ? '#16a34a' : '#dc2626'}
                  />
                </View>
              </View>
            ))}

            <Text style={styles.label}>Temperatura (°C)</Text>
            <TextInput style={styles.input} placeholder="ex: 4.5" placeholderTextColor="#9ca3af"
              value={temperatura} onChangeText={setTemperatura} keyboardType="decimal-pad" />

            <Text style={styles.label}>Lote do Produto</Text>
            <TextInput style={styles.input} placeholder="Opcional" placeholderTextColor="#9ca3af"
              value={lote} onChangeText={setLote} />

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
  summaryBox: { backgroundColor: '#1d4ed8', borderRadius: 12, padding: 16, marginBottom: 12 },
  summaryBoxOk: { backgroundColor: '#15803d' },
  summaryTitle: { color: '#fff', fontSize: 15, fontWeight: '700' },
  summaryText: { color: '#bfdbfe', fontSize: 12, marginTop: 4 },
  newBtn: { marginBottom: 16 },
  card: { marginBottom: 10 },
  cardNc: { borderLeftWidth: 3, borderLeftColor: '#dc2626', backgroundColor: '#fff5f5' },
  cardRow: { flexDirection: 'row', alignItems: 'flex-start' },
  cardMain: { flex: 1 },
  materia: { fontSize: 15, fontWeight: '700', color: '#111827' },
  fornecedor: { fontSize: 12, color: '#6b7280', marginTop: 2 },
  dataText: { fontSize: 11, color: '#9ca3af', marginTop: 3 },
  cardRight: { alignItems: 'flex-end', gap: 4 },
  badge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  badgeOk: { backgroundColor: '#dcfce7' },
  badgeNc: { backgroundColor: '#fee2e2' },
  badgeText: { fontSize: 12, fontWeight: '700' },
  badgeTextOk: { color: '#15803d' },
  badgeTextNc: { color: '#dc2626' },
  temp: { fontSize: 12, color: '#374151', fontWeight: '600' },
  ncRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 8 },
  ncTag: { fontSize: 10, backgroundColor: '#fee2e2', color: '#dc2626', borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2, fontWeight: '600' },
  emptyCard: { alignItems: 'center', paddingVertical: 32 },
  emptyText: { color: '#9ca3af', fontSize: 14 },
  // Modal
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modal: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '92%' },
  modalContent: { padding: 24, paddingBottom: 48 },
  modalTitle: { fontSize: 18, fontWeight: '800', color: '#111827' },
  modalSub: { fontSize: 13, color: '#6b7280', marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '600', color: '#374151', marginTop: 14, marginBottom: 6 },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: '#111827', marginTop: 20, marginBottom: 10 },
  input: {
    borderWidth: 1.5, borderColor: '#d1d5db', borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: '#111827',
  },
  switchRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f3f4f6',
  },
  switchLabel: { fontSize: 14, color: '#374151', flex: 1 },
  switchRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  switchStatus: { fontSize: 12, fontWeight: '700', width: 24, textAlign: 'center' },
  switchOk: { color: '#16a34a' },
  switchNc: { color: '#dc2626' },
  actions: { flexDirection: 'row', gap: 12, marginTop: 24 },
  btn: { flex: 1 },
});
