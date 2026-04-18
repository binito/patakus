import React, { useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { api } from '../../src/lib/api';
import { Button } from '../../src/components/ui/Button';

type Zona = 'COZINHA' | 'PRODUCAO' | 'ARMAZEM' | 'SERVICO';

const ZONAS: { value: Zona; label: string; emoji: string }[] = [
  { value: 'COZINHA', label: 'Cozinha', emoji: '🍳' },
  { value: 'PRODUCAO', label: 'Zona de Produção', emoji: '🏭' },
  { value: 'ARMAZEM', label: 'Armazém', emoji: '🏪' },
  { value: 'SERVICO', label: 'Serviço / Sala Refeições', emoji: '🍽️' },
];

type Period = 'D' | 'S' | 'T';
const PERIOD_COLORS: Record<Period, { bg: string; text: string }> = {
  D: { bg: '#dcfce7', text: '#15803d' },
  S: { bg: '#dbeafe', text: '#1d4ed8' },
  T: { bg: '#ede9fe', text: '#7c3aed' },
};
const PERIOD_LABELS: Record<Period, string> = { D: 'D', S: 'S', T: 'T' };

const ITENS_ZONA: Record<Zona, { key: string; label: string; period: Period }[]> = {
  COZINHA: [
    { key: 'fogao', label: 'Fogão', period: 'D' },
    { key: 'forno', label: 'Forno', period: 'D' },
    { key: 'fritadeira', label: 'Fritadeira', period: 'D' },
    { key: 'grelhador', label: 'Grelhador', period: 'D' },
    { key: 'exaustor', label: 'Exaustor', period: 'S' },
    { key: 'equipamentos', label: 'Equipamentos', period: 'S' },
    { key: 'maqLavarLoica', label: 'Máq. lavar loiça', period: 'S' },
    { key: 'lavatorios', label: 'Lavatórios', period: 'D' },
    { key: 'utensilios', label: 'Utensílios', period: 'D' },
    { key: 'caixotesLixo', label: 'Caixotes do Lixo', period: 'D' },
    { key: 'armarios', label: 'Armários', period: 'S' },
    { key: 'prateleiras', label: 'Prateleiras', period: 'S' },
    { key: 'gavetas', label: 'Gavetas', period: 'S' },
    { key: 'paredes', label: 'Paredes', period: 'T' },
    { key: 'teto', label: 'Teto', period: 'T' },
    { key: 'portasPuxadores', label: 'Portas/Puxadores', period: 'S' },
    { key: 'janelasVidros', label: 'Janelas/Vidros', period: 'S' },
    { key: 'superficies', label: 'Superfícies', period: 'S' },
    { key: 'bancadas', label: 'Bancadas', period: 'D' },
    { key: 'armariosProdLimpeza', label: 'Armários prod. limpeza', period: 'D' },
    { key: 'eq9', label: 'Eq. 9', period: 'S' },
    { key: 'eq10', label: 'Eq. 10', period: 'S' },
    { key: 'eq11', label: 'Eq. 11', period: 'S' },
    { key: 'eq12', label: 'Eq. 12', period: 'S' },
  ],
  PRODUCAO: [
    { key: 'pavimento', label: 'Pavimento', period: 'D' },
    { key: 'equipamentos', label: 'Equipamentos', period: 'S' },
    { key: 'utensilios', label: 'Utensílios', period: 'S' },
    { key: 'lavatorios', label: 'Lavatórios', period: 'D' },
    { key: 'bancadas', label: 'Bancadas', period: 'D' },
    { key: 'superficies', label: 'Superfícies', period: 'S' },
    { key: 'paredesTeto', label: 'Paredes/Teto', period: 'S' },
    { key: 'forno', label: 'Forno', period: 'D' },
    { key: 'janelasVidros', label: 'Janelas/Vidros', period: 'S' },
    { key: 'estantes', label: 'Estantes/Prateleiras', period: 'S' },
    { key: 'gavetas', label: 'Gavetas', period: 'S' },
    { key: 'armarios', label: 'Armários', period: 'S' },
    { key: 'caixotesLixo', label: 'Caixotes do Lixo', period: 'D' },
    { key: 'eq1', label: 'Eq. 1', period: 'S' },
    { key: 'eq2', label: 'Eq. 2', period: 'S' },
    { key: 'eq3', label: 'Eq. 3', period: 'S' },
    { key: 'zonaLavagemSuperficies', label: 'Lavagem - Superfícies', period: 'D' },
    { key: 'zonaLavagemTeto', label: 'Lavagem - Teto', period: 'S' },
    { key: 'zonaLavagemParedes', label: 'Lavagem - Paredes', period: 'S' },
    { key: 'zonaLavagemBancadas', label: 'Lavagem - Bancadas', period: 'D' },
    { key: 'eq4', label: 'Eq. 4', period: 'S' },
  ],
  ARMAZEM: [
    { key: 'pavimentoArmazem', label: 'Pavimento (Armazém)', period: 'D' },
    { key: 'equipamentosArmazem', label: 'Equipamentos', period: 'S' },
    { key: 'utensiliosArmazem', label: 'Utensílios', period: 'S' },
    { key: 'superficiesArmazem', label: 'Superfícies', period: 'D' },
    { key: 'bancadasArmazem', label: 'Bancadas', period: 'D' },
    { key: 'lavatoriosArmazem', label: 'Lavatórios', period: 'D' },
    { key: 'paredesArmazem', label: 'Paredes', period: 'S' },
    { key: 'caixotesLixoArmazem', label: 'Caixotes do Lixo', period: 'D' },
    { key: 'janelasArmazem', label: 'Janelas', period: 'S' },
    { key: 'prateleirasArmazem', label: 'Prateleiras/Estantes', period: 'S' },
    { key: 'eq19', label: 'Eq. 19', period: 'S' },
    { key: 'eq20', label: 'Eq. 20', period: 'S' },
    { key: 'eq21', label: 'Eq. 21', period: 'S' },
    { key: 'eq22', label: 'Eq. 22', period: 'S' },
    { key: 'eq23', label: 'Eq. 23', period: 'S' },
    { key: 'pavimentoBalneiros', label: 'Balneários - Pavimento', period: 'D' },
    { key: 'loucasBalneiros', label: 'Balneários - Louças', period: 'D' },
    { key: 'sanitariosBalneiros', label: 'Inst. Sanitárias', period: 'D' },
    { key: 'espelhos', label: 'Espelhos', period: 'S' },
  ],
  SERVICO: [
    { key: 'pavimentoServico', label: 'Pavimentos', period: 'D' },
    { key: 'superficiesServico', label: 'Superfícies', period: 'D' },
    { key: 'bancadasServico', label: 'Bancadas', period: 'D' },
    { key: 'mesasCadeiras', label: 'Mesas/Cadeiras', period: 'D' },
    { key: 'equipamentosServico', label: 'Equipamentos', period: 'S' },
    { key: 'utensiliosServico', label: 'Utensílios', period: 'D' },
    { key: 'maqLavarLoicaServico', label: 'Máq. lavar loiça', period: 'S' },
    { key: 'lavatoriosServico', label: 'Lavatórios', period: 'D' },
    { key: 'caixotesLixoServico', label: 'Caixotes do Lixo', period: 'D' },
    { key: 'eq5', label: 'Eq. 5', period: 'S' },
    { key: 'eq6', label: 'Eq. 6', period: 'S' },
    { key: 'eq7', label: 'Eq. 7', period: 'S' },
    { key: 'eq8', label: 'Eq. 8', period: 'S' },
    { key: 'mesasSalaRefeicoes', label: 'Sala - Mesas', period: 'D' },
    { key: 'cadeirasEstantesSala', label: 'Sala - Cadeiras/Estantes', period: 'S' },
    { key: 'paredesTeto', label: 'Sala - Paredes/Teto', period: 'S' },
    { key: 'vidrosJanelas', label: 'Sala - Vidros/Janelas', period: 'S' },
    { key: 'portasPuxadoresSala', label: 'Sala - Portas/Puxadores', period: 'S' },
    { key: 'pavimentoSan', label: 'San. - Pavimento', period: 'D' },
    { key: 'loucasSan', label: 'San. - Louças', period: 'D' },
    { key: 'paredesSan', label: 'San. - Paredes', period: 'S' },
    { key: 'espelhosSan', label: 'San. - Espelhos', period: 'S' },
  ],
};

function today() {
  return new Date().toISOString().split('T')[0];
}

function buildDefaultItens(zona: Zona): Record<string, boolean> {
  const r: Record<string, boolean> = {};
  ITENS_ZONA[zona].forEach(i => { r[i.key] = false; });
  return r;
}

export default function HigienizacaoScreen() {
  const [zona, setZona] = useState<Zona>('COZINHA');
  const [itens, setItens] = useState<Record<string, boolean>>(buildDefaultItens('COZINHA'));
  const [observacoes, setObservacoes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  function changeZona(z: Zona) {
    setZona(z);
    setItens(buildDefaultItens(z));
  }

  function toggleItem(key: string) {
    setItens(prev => ({ ...prev, [key]: !prev[key] }));
  }

  function toggleAll() {
    const allChecked = ITENS_ZONA[zona].every(i => itens[i.key]);
    const next: Record<string, boolean> = {};
    ITENS_ZONA[zona].forEach(i => { next[i.key] = !allChecked; });
    setItens(next);
  }

  const checkedCount = ITENS_ZONA[zona].filter(i => itens[i.key]).length;
  const totalCount = ITENS_ZONA[zona].length;

  async function submit() {
    if (checkedCount === 0) {
      Alert.alert('Nenhum item', 'Seleciona pelo menos um item higienizado.');
      return;
    }
    setSubmitting(true);
    try {
      await api.post('/registos/higienizacao', {
        zona,
        dia: today(),
        itens,
        observacoes: observacoes.trim() || undefined,
      });
      setSubmitted(true);
      Alert.alert('Guardado!', `Registo de higienização guardado (${checkedCount} itens).`, [
        { text: 'OK', onPress: () => { setSubmitted(false); setItens(buildDefaultItens(zona)); setObservacoes(''); } }
      ]);
    } catch (e: any) {
      Alert.alert('Erro', e?.response?.data?.message ?? 'Não foi possível guardar.');
    } finally {
      setSubmitting(false);
    }
  }

  const zonaInfo = ZONAS.find(z => z.value === zona)!;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      {/* Seletor de zona */}
      <View style={styles.zonaSection}>
        <Text style={styles.sectionTitle}>Zona</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.zonaScroll}>
          {ZONAS.map(z => (
            <TouchableOpacity
              key={z.value}
              style={[styles.zonaBtn, zona === z.value && styles.zonaBtnActive]}
              onPress={() => changeZona(z.value)}
            >
              <Text style={styles.zonaEmoji}>{z.emoji}</Text>
              <Text style={[styles.zonaLabel, zona === z.value && styles.zonaLabelActive]}>{z.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Progresso */}
      <View style={styles.progressBox}>
        <View style={styles.progressHeader}>
          <Text style={styles.progressTitle}>{zonaInfo.emoji} {zonaInfo.label}</Text>
          <Text style={styles.progressCount}>{checkedCount}/{totalCount}</Text>
        </View>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${totalCount > 0 ? (checkedCount / totalCount) * 100 : 0}%` as any }]} />
        </View>
        <TouchableOpacity onPress={toggleAll} style={styles.toggleAllBtn}>
          <Text style={styles.toggleAllText}>
            {ITENS_ZONA[zona].every(i => itens[i.key]) ? 'Desmarcar todos' : 'Marcar todos'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Legenda */}
      <View style={styles.legend}>
        {Object.entries(PERIOD_LABELS).map(([k, v]) => (
          <View key={k} style={[styles.legendBadge, { backgroundColor: PERIOD_COLORS[k as Period].bg }]}>
            <Text style={[styles.legendText, { color: PERIOD_COLORS[k as Period].text }]}>
              {v} — {k === 'D' ? 'Diário' : k === 'S' ? 'Semanal' : 'Trimestral'}
            </Text>
          </View>
        ))}
      </View>

      {/* Lista de itens */}
      <View style={styles.itensList}>
        {ITENS_ZONA[zona].map(item => {
          const checked = itens[item.key] ?? false;
          const pColor = PERIOD_COLORS[item.period];
          return (
            <TouchableOpacity
              key={item.key}
              style={[styles.itemRow, checked && styles.itemRowChecked]}
              onPress={() => toggleItem(item.key)}
              activeOpacity={0.7}
            >
              <View style={[styles.checkbox, checked && styles.checkboxChecked]}>
                {checked && <Text style={styles.checkmark}>✓</Text>}
              </View>
              <Text style={[styles.itemLabel, checked && styles.itemLabelChecked]}>{item.label}</Text>
              <View style={[styles.periodBadge, { backgroundColor: pColor.bg }]}>
                <Text style={[styles.periodText, { color: pColor.text }]}>{item.period}</Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      <Text style={styles.label}>Observações</Text>
      <TextInput
        style={styles.textArea}
        placeholder="Opcional"
        placeholderTextColor="#9ca3af"
        value={observacoes}
        onChangeText={setObservacoes}
        multiline
        numberOfLines={3}
        textAlignVertical="top"
      />

      <Button
        label={`Guardar Registo (${checkedCount} itens)`}
        onPress={submit}
        loading={submitting}
        style={styles.submitBtn}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f4f6' },
  content: { padding: 16, paddingBottom: 40 },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: '#374151', marginBottom: 8 },
  zonaSection: { marginBottom: 16 },
  zonaScroll: { flexDirection: 'row' },
  zonaBtn: {
    alignItems: 'center', paddingHorizontal: 14, paddingVertical: 10,
    borderRadius: 12, borderWidth: 1.5, borderColor: '#e5e7eb',
    backgroundColor: '#fff', marginRight: 8,
  },
  zonaBtnActive: { borderColor: '#2563eb', backgroundColor: '#eff6ff' },
  zonaEmoji: { fontSize: 20, marginBottom: 2 },
  zonaLabel: { fontSize: 11, color: '#6b7280', fontWeight: '600', textAlign: 'center' },
  zonaLabelActive: { color: '#2563eb' },
  progressBox: { backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, elevation: 1 },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  progressTitle: { fontSize: 14, fontWeight: '700', color: '#111827' },
  progressCount: { fontSize: 14, fontWeight: '700', color: '#2563eb' },
  progressBar: { height: 6, backgroundColor: '#e5e7eb', borderRadius: 3, marginBottom: 10 },
  progressFill: { height: 6, backgroundColor: '#2563eb', borderRadius: 3 },
  toggleAllBtn: { alignSelf: 'flex-end' },
  toggleAllText: { fontSize: 12, color: '#2563eb', fontWeight: '600' },
  legend: { flexDirection: 'row', gap: 6, marginBottom: 12, flexWrap: 'wrap' },
  legendBadge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  legendText: { fontSize: 11, fontWeight: '600' },
  itensList: { gap: 2, marginBottom: 20 },
  itemRow: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
    borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12,
    borderWidth: 1, borderColor: '#f3f4f6',
  },
  itemRowChecked: { backgroundColor: '#f0fdf4', borderColor: '#bbf7d0' },
  checkbox: {
    width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: '#d1d5db',
    alignItems: 'center', justifyContent: 'center', marginRight: 12, backgroundColor: '#f9fafb',
  },
  checkboxChecked: { backgroundColor: '#16a34a', borderColor: '#16a34a' },
  checkmark: { color: '#fff', fontSize: 13, fontWeight: '800' },
  itemLabel: { flex: 1, fontSize: 14, color: '#374151' },
  itemLabelChecked: { color: '#15803d', fontWeight: '600' },
  periodBadge: { borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 },
  periodText: { fontSize: 10, fontWeight: '700' },
  label: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 6 },
  textArea: {
    borderWidth: 1.5, borderColor: '#d1d5db', borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: '#111827',
    minHeight: 70, marginBottom: 16,
  },
  submitBtn: { marginTop: 4 },
});
