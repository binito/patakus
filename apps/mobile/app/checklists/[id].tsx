import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, router, useNavigation } from 'expo-router';
import { api } from '../../src/lib/api';
import { useAuthStore } from '../../src/store/auth.store';
import { Card } from '../../src/components/ui/Card';
import { Button } from '../../src/components/ui/Button';
import { Badge } from '../../src/components/ui/Badge';

interface ChecklistTask {
  id: string;
  description: string;
  required: boolean;
  order: number;
  completed: boolean;
  note?: string;
}

interface ChecklistDetail {
  id: string;
  name: string;
  description?: string;
  status: string;
  area?: string;
  tasks: ChecklistTask[];
  dueTime?: string;
  completedAt?: string;
}

export default function ChecklistDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const user = useAuthStore((s) => s.user);
  const navigation = useNavigation();
  const [checklist, setChecklist] = useState<ChecklistDetail | null>(null);
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function fetch() {
      try {
        const { data } = await api.get<ChecklistDetail>(`/checklists/${id}`);
        setChecklist(data);
        // Pre-fill already-completed tasks
        const done = new Set(data.tasks.filter((t) => t.completed).map((t) => t.id));
        setChecked(done);
        navigation.setOptions({ title: data.name });
      } catch {
        Alert.alert('Erro', 'Não foi possível carregar a checklist.', [
          { text: 'OK', onPress: () => router.back() },
        ]);
      } finally {
        setLoading(false);
      }
    }
    fetch();
  }, [id]);

  function toggleTask(taskId: string) {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(taskId)) next.delete(taskId);
      else next.add(taskId);
      return next;
    });
  }

  async function handleSubmit() {
    if (!checklist) return;

    const required = checklist.tasks.filter((t) => t.required);
    const missingRequired = required.filter((t) => !checked.has(t.id));

    if (missingRequired.length > 0) {
      Alert.alert(
        'Tarefas obrigatórias',
        `Por favor complete as ${missingRequired.length} tarefa(s) obrigatória(s) assinaladas com *.`,
      );
      return;
    }

    Alert.alert('Submeter Checklist', 'Tem a certeza que pretende submeter esta checklist?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Submeter',
        onPress: async () => {
          setSubmitting(true);
          try {
            await api.post(`/checklists/submit`, {
              checklistId: checklist.id,
              operatorId: user?.id,
              clientId: user?.clientId,
              completedTasks: Array.from(checked),
            });
            Alert.alert('Concluído', 'Checklist submetida com sucesso!', [
              { text: 'OK', onPress: () => router.back() },
            ]);
          } catch {
            Alert.alert('Erro', 'Não foi possível submeter. Tente novamente.');
          } finally {
            setSubmitting(false);
          }
        },
      },
    ]);
  }

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  if (!checklist) return null;

  const isCompleted = checklist.status === 'completed' || checklist.status === 'concluido';
  const progress = checklist.tasks.length > 0
    ? Math.round((checked.size / checklist.tasks.length) * 100)
    : 0;

  return (
    <FlatList
      style={styles.container}
      contentContainerStyle={styles.content}
      ListHeaderComponent={
        <>
          <Card style={styles.headerCard}>
            <View style={styles.headerRow}>
              <Text style={styles.headerName}>{checklist.name}</Text>
              <Badge
                label={isCompleted ? 'Concluída' : 'Pendente'}
                variant={isCompleted ? 'success' : 'warning'}
              />
            </View>
            {checklist.area ? <Text style={styles.area}>{checklist.area}</Text> : null}
            {checklist.description ? (
              <Text style={styles.desc}>{checklist.description}</Text>
            ) : null}
            {checklist.dueTime ? (
              <Text style={styles.due}>Prazo: {checklist.dueTime}</Text>
            ) : null}

            <View style={styles.progressRow}>
              <View style={styles.progressBg}>
                <View style={[styles.progressFill, { width: `${progress}%` as `${number}%` }]} />
              </View>
              <Text style={styles.progressPct}>{progress}%</Text>
            </View>
            <Text style={styles.progressSub}>{checked.size} de {checklist.tasks.length} tarefas</Text>
          </Card>

          <Text style={styles.taskListTitle}>Tarefas</Text>
        </>
      }
      data={checklist.tasks.sort((a, b) => a.order - b.order)}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => {
        const isDone = checked.has(item.id);
        return (
          <TouchableOpacity
            onPress={() => !isCompleted && toggleTask(item.id)}
            disabled={isCompleted}
            activeOpacity={0.7}
          >
            <Card style={[styles.taskCard, isDone && styles.taskCardDone]}>
              <View style={styles.taskRow}>
                <View style={[styles.checkbox, isDone && styles.checkboxDone]}>
                  {isDone && <Text style={styles.checkmark}>✓</Text>}
                </View>
                <View style={styles.taskTextWrap}>
                  <Text style={[styles.taskDesc, isDone && styles.taskDescDone]}>
                    {item.description}
                    {item.required ? <Text style={styles.required}> *</Text> : null}
                  </Text>
                </View>
              </View>
            </Card>
          </TouchableOpacity>
        );
      }}
      ListFooterComponent={
        !isCompleted ? (
          <View style={styles.footer}>
            <Text style={styles.requiredNote}>* Tarefas obrigatórias</Text>
            <Button
              label="Submeter Checklist"
              onPress={handleSubmit}
              loading={submitting}
              disabled={checked.size === 0}
            />
          </View>
        ) : (
          <Card style={styles.completedBanner}>
            <Text style={styles.completedText}>
              ✓ Checklist concluída
              {checklist.completedAt
                ? ` em ${new Date(checklist.completedAt).toLocaleString('pt-PT')}`
                : ''}
            </Text>
          </Card>
        )
      }
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f4f6' },
  content: { padding: 16, paddingBottom: 40 },
  loader: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  headerCard: { marginBottom: 16 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 },
  headerName: { flex: 1, fontSize: 18, fontWeight: '700', color: '#111827', marginRight: 8 },
  area: { fontSize: 12, color: '#2563eb', fontWeight: '600', marginBottom: 4 },
  desc: { fontSize: 14, color: '#6b7280', marginBottom: 8 },
  due: { fontSize: 13, color: '#9ca3af', marginBottom: 10 },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 4 },
  progressBg: { flex: 1, height: 8, backgroundColor: '#e5e7eb', borderRadius: 999, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: '#2563eb', borderRadius: 999 },
  progressPct: { fontSize: 13, fontWeight: '700', color: '#2563eb', minWidth: 36 },
  progressSub: { fontSize: 12, color: '#9ca3af' },
  taskListTitle: { fontSize: 15, fontWeight: '700', color: '#374151', marginBottom: 10 },
  taskCard: { marginBottom: 8 },
  taskCardDone: { backgroundColor: '#f0fdf4' },
  taskRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#d1d5db',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
    flexShrink: 0,
  },
  checkboxDone: { backgroundColor: '#2563eb', borderColor: '#2563eb' },
  checkmark: { color: '#ffffff', fontSize: 14, fontWeight: '700' },
  taskTextWrap: { flex: 1 },
  taskDesc: { fontSize: 15, color: '#374151', lineHeight: 22 },
  taskDescDone: { color: '#9ca3af', textDecorationLine: 'line-through' },
  required: { color: '#dc2626', fontWeight: '700' },
  footer: { marginTop: 16 },
  requiredNote: { fontSize: 12, color: '#9ca3af', marginBottom: 12 },
  completedBanner: {
    marginTop: 16,
    backgroundColor: '#f0fdf4',
    alignItems: 'center',
    padding: 20,
  },
  completedText: { color: '#16a34a', fontWeight: '600', fontSize: 15 },
});
