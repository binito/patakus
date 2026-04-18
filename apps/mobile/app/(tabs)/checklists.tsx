import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { api } from '../../src/lib/api';
import { useAuthStore } from '../../src/store/auth.store';
import { Card } from '../../src/components/ui/Card';
import { Badge, statusVariant } from '../../src/components/ui/Badge';

interface ChecklistTemplate {
  id: string;
  name: string;
  description?: string;
  status: string;
  taskCount: number;
  completedTasks: number;
  dueTime?: string;
  area?: string;
}

export default function ChecklistsScreen() {
  const user = useAuthStore((s) => s.user);
  const [items, setItems] = useState<ChecklistTemplate[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchChecklists = useCallback(async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const { data } = await api.get<ChecklistTemplate[]>(
        `/checklists/today?clientId=${user?.clientId}&date=${today}`,
      );
      setItems(data);
    } catch {
      Alert.alert('Erro', 'Não foi possível carregar as checklists.');
    } finally {
      setLoading(false);
    }
  }, [user?.clientId]);

  useEffect(() => { fetchChecklists(); }, [fetchChecklists]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchChecklists();
    setRefreshing(false);
  }, [fetchChecklists]);

  const today = new Date().toLocaleDateString('pt-PT', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <FlatList
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#2563eb" />}
      ListHeaderComponent={
        <View style={styles.headerBox}>
          <Text style={styles.headerDate}>{today}</Text>
          <Text style={styles.headerSub}>{items.length} checklist{items.length !== 1 ? 's' : ''} para hoje</Text>
        </View>
      }
      data={items}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => {
        const isDone = item.status === 'completed' || item.status === 'concluido';
        const progress = item.taskCount > 0
          ? Math.round((item.completedTasks / item.taskCount) * 100)
          : 0;

        return (
          <TouchableOpacity
            onPress={() => !isDone && router.push(`/checklists/${item.id}`)}
            disabled={isDone}
            activeOpacity={0.8}
          >
            <Card style={[styles.card, isDone && styles.cardDone]}>
              <View style={styles.cardHeader}>
                <View style={styles.cardTitleRow}>
                  <Text style={[styles.cardTitle, isDone && styles.cardTitleDone]} numberOfLines={2}>
                    {item.name}
                  </Text>
                  <Badge
                    label={isDone ? 'Concluída' : 'Pendente'}
                    variant={statusVariant(item.status)}
                  />
                </View>
                {item.area ? <Text style={styles.cardMeta}>{item.area}</Text> : null}
                {item.description ? (
                  <Text style={styles.cardDesc} numberOfLines={2}>{item.description}</Text>
                ) : null}
              </View>

              <View style={styles.progressRow}>
                <View style={styles.progressBarBg}>
                  <View style={[styles.progressBarFill, { width: `${progress}%` as `${number}%` }]} />
                </View>
                <Text style={styles.progressText}>{item.completedTasks}/{item.taskCount}</Text>
              </View>

              {item.dueTime ? (
                <Text style={styles.dueText}>Prazo: {item.dueTime}</Text>
              ) : null}

              {!isDone && (
                <View style={styles.actionHint}>
                  <Text style={styles.actionHintText}>Toque para iniciar →</Text>
                </View>
              )}
            </Card>
          </TouchableOpacity>
        );
      }}
      ListEmptyComponent={
        !loading ? (
          <Card style={styles.emptyCard}>
            <Text style={styles.emptyText}>Sem checklists atribuídas para hoje</Text>
          </Card>
        ) : null
      }
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f4f6' },
  content: { padding: 16, paddingBottom: 32 },
  headerBox: {
    marginBottom: 16,
    padding: 16,
    backgroundColor: '#2563eb',
    borderRadius: 12,
  },
  headerDate: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  headerSub: { color: '#bfdbfe', fontSize: 13, marginTop: 2 },
  card: { marginBottom: 12 },
  cardDone: { opacity: 0.7 },
  cardHeader: { marginBottom: 12 },
  cardTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
  },
  cardTitle: { flex: 1, fontSize: 16, fontWeight: '700', color: '#111827' },
  cardTitleDone: { color: '#6b7280' },
  cardMeta: { fontSize: 12, color: '#2563eb', fontWeight: '600', marginTop: 4 },
  cardDesc: { fontSize: 13, color: '#6b7280', marginTop: 6 },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  progressBarBg: {
    flex: 1,
    height: 6,
    backgroundColor: '#e5e7eb',
    borderRadius: 999,
    overflow: 'hidden',
  },
  progressBarFill: { height: '100%', backgroundColor: '#2563eb', borderRadius: 999 },
  progressText: { fontSize: 12, color: '#6b7280', fontWeight: '600', minWidth: 32 },
  dueText: { fontSize: 12, color: '#9ca3af' },
  actionHint: { marginTop: 10, alignItems: 'flex-end' },
  actionHintText: { fontSize: 13, color: '#2563eb', fontWeight: '600' },
  emptyCard: { alignItems: 'center', paddingVertical: 32 },
  emptyText: { color: '#9ca3af', fontSize: 14 },
});
