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
  View,
} from 'react-native';
import { api } from '../../src/lib/api';
import { Card } from '../../src/components/ui/Card';
import { Button } from '../../src/components/ui/Button';

interface DesinfecaoRecord {
  id: string;
  data: string;
  generosAlimenticios: string;
  nomeDesinfetante: string;
  dose: string;
  quantidadeAgua: string;
  tempoAtuacao: string;
  observacoes?: string;
  operator: { name: string };
}

function today() {
  return new Date().toISOString().split('T')[0];
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export default function DesinfecaoScreen() {
  const [records, setRecords] = useState<DesinfecaoRecord[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [generos, setGeneros] = useState('');
  const [desinfetante, setDesinfetante] = useState('');
  const [dose, setDose] = useState('');
  const [quantidade, setQuantidade] = useState('');
  const [tempo, setTempo] = useState('');
  const [obs, setObs] = useState('');

  const fetchData = useCallback(async () => {
    try {
      const start = new Date();
      start.setDate(start.getDate() - 30);
      const { data } = await api.get<DesinfecaoRecord[]>(
        `/registos/desinfecao?startDate=${start.toISOString().split('T')[0]}&endDate=${today()}`
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
    setGeneros(''); setDesinfetante(''); setDose(''); setQuantidade(''); setTempo(''); setObs('');
  }

  async function submit() {
    if (!generos.trim() || !desinfetante.trim() || !dose.trim() || !quantidade.trim() || !tempo.trim()) {
      Alert.alert('Campos obrigatórios', 'Preenche todos os campos marcados com *.');
      return;
    }
    setSubmitting(true);
    try {
      await api.post('/registos/desinfecao', {
        data: today(),
        generosAlimenticios: generos.trim(),
        nomeDesinfetante: desinfetante.trim(),
        dose: dose.trim(),
        quantidadeAgua: quantidade.trim(),
        tempoAtuacao: tempo.trim(),
        observacoes: obs.trim() || undefined,
      });
      Alert.alert('Guardado!', 'Registo de desinfeção guardado.');
      setModalVisible(false);
      resetForm();
      fetchData();
    } catch (e: any) {
      Alert.alert('Erro', e?.response?.data?.message ?? 'Não foi possível guardar.');
    } finally { setSubmitting(false); }
  }

  return (
    <>
      <FlatList
        style={styles.container}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#7c3aed" />}
        ListHeaderComponent={
          <View>
            <View style={styles.summaryBox}>
              <Text style={styles.summaryTitle}>🧪 Registo de Desinfeção</Text>
              <Text style={styles.summaryText}>
                {records.length === 0 ? 'Sem registos nos últimos 30 dias' : `${records.length} registo${records.length !== 1 ? 's' : ''} nos últimos 30 dias`}
              </Text>
            </View>
            <Button label="+ Novo Registo" onPress={() => setModalVisible(true)} style={styles.newBtn} />
          </View>
        }
        data={records}
        keyExtractor={r => r.id}
        renderItem={({ item: r }) => (
          <Card style={styles.card}>
            <Text style={styles.cardTitle}>{r.generosAlimenticios}</Text>
            <Text style={styles.cardSub}>{r.nomeDesinfetante} · {r.dose} · {r.quantidadeAgua}</Text>
            <Text style={styles.cardSub}>Tempo: {r.tempoAtuacao}</Text>
            <Text style={styles.cardMeta}>{formatDate(r.data)} · {r.operator.name}</Text>
          </Card>
        )}
        ListEmptyComponent={
          !loading ? (
            <Card style={styles.emptyCard}><Text style={styles.emptyText}>Sem registos nos últimos 30 dias</Text></Card>
          ) : null
        }
      />

      <Modal visible={modalVisible} animationType="slide" transparent onRequestClose={() => { setModalVisible(false); resetForm(); }}>
        <View style={styles.overlay}>
          <ScrollView style={styles.modal} contentContainerStyle={styles.modalContent} keyboardShouldPersistTaps="handled">
            <Text style={styles.modalTitle}>Novo Registo de Desinfeção</Text>
            <Text style={styles.modalSub}>Data: {new Date().toLocaleDateString('pt-PT')}</Text>

            <Text style={styles.label}>Géneros Alimentícios a Desinfetar *</Text>
            <TextInput style={styles.input} placeholder="ex: Alface, Tomate, Pepino" placeholderTextColor="#9ca3af"
              value={generos} onChangeText={setGeneros} />

            <Text style={styles.label}>Nome do Desinfetante *</Text>
            <TextInput style={styles.input} placeholder="ex: Hipoclorito de Sódio" placeholderTextColor="#9ca3af"
              value={desinfetante} onChangeText={setDesinfetante} />

            <Text style={styles.label}>Dose Aplicada *</Text>
            <TextInput style={styles.input} placeholder="ex: 50 mg/L" placeholderTextColor="#9ca3af"
              value={dose} onChangeText={setDose} />

            <Text style={styles.label}>Quantidade de Água *</Text>
            <TextInput style={styles.input} placeholder="ex: 5 L" placeholderTextColor="#9ca3af"
              value={quantidade} onChangeText={setQuantidade} />

            <Text style={styles.label}>Tempo de Atuação *</Text>
            <TextInput style={styles.input} placeholder="ex: 5 minutos" placeholderTextColor="#9ca3af"
              value={tempo} onChangeText={setTempo} />

            <Text style={styles.label}>Observações</Text>
            <TextInput style={styles.textArea} placeholder="Opcional" placeholderTextColor="#9ca3af"
              value={obs} onChangeText={setObs} multiline numberOfLines={2} textAlignVertical="top" />

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
  summaryBox: { backgroundColor: '#7c3aed', borderRadius: 12, padding: 16, marginBottom: 12 },
  summaryTitle: { color: '#fff', fontSize: 15, fontWeight: '700' },
  summaryText: { color: '#ede9fe', fontSize: 12, marginTop: 4 },
  newBtn: { marginBottom: 16 },
  card: { marginBottom: 10 },
  cardTitle: { fontSize: 15, fontWeight: '700', color: '#111827', marginBottom: 4 },
  cardSub: { fontSize: 12, color: '#6b7280', marginTop: 1 },
  cardMeta: { fontSize: 11, color: '#9ca3af', marginTop: 6 },
  emptyCard: { alignItems: 'center', paddingVertical: 32 },
  emptyText: { color: '#9ca3af', fontSize: 14 },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modal: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '90%' },
  modalContent: { padding: 24, paddingBottom: 48 },
  modalTitle: { fontSize: 18, fontWeight: '800', color: '#111827' },
  modalSub: { fontSize: 13, color: '#6b7280', marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '600', color: '#374151', marginTop: 14, marginBottom: 6 },
  input: { borderWidth: 1.5, borderColor: '#d1d5db', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: '#111827' },
  textArea: { borderWidth: 1.5, borderColor: '#d1d5db', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: '#111827', minHeight: 60 },
  actions: { flexDirection: 'row', gap: 12, marginTop: 24 },
  btn: { flex: 1 },
});
