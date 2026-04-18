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
import { Badge, statusVariant, severityVariant } from '../../src/components/ui/Badge';

interface ChecklistSummary {
  id: string;
  name: string;
  status: string;
  dueTime?: string;
  completedAt?: string;
}

interface AnomalySummary {
  id: string;
  title: string;
  severity: string;
  status: string;
  area?: string;
  createdAt: string;
}

export default function DashboardScreen() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const [checklists, setChecklists] = useState<ChecklistSummary[]>([]);
  const [anomalies, setAnomalies] = useState<AnomalySummary[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const [clRes, anRes] = await Promise.all([
        api.get<ChecklistSummary[]>(`/checklists/today?clientId=${user?.clientId}&date=${today}`),
        api.get<AnomalySummary[]>(`/reports/anomalies?clientId=${user?.clientId}&limit=5`),
      ]);
      setChecklists(clRes.data);
      setAnomalies(anRes.data);
    } catch {
      // silently fail on refresh; show error only on initial load
      if (loading) Alert.alert('Erro', 'Não foi possível carregar os dados.');
    } finally {
      setLoading(false);
    }
  }, [user?.clientId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }, [fetchData]);

  async function handleLogout() {
    Alert.alert('Terminar sessão', 'Tem a certeza?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Sair',
        style: 'destructive',
        onPress: async () => {
          await logout();
          router.replace('/(auth)/login');
        },
      },
    ]);
  }

  const pendingCount = checklists.filter((c) => c.status !== 'completed' && c.status !== 'concluido').length;
  const openAnomalies = anomalies.filter((a) => a.status === 'open' || a.status === 'aberto').length;

  return (
    <FlatList
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#2563eb" />}
      ListHeaderComponent={
        <>
          {/* Greeting */}
          <View style={styles.greetRow}>
            <View>
              <Text style={styles.greeting}>Bom dia{user?.name ? `, ${user.name.split(' ')[0]}` : ''}!</Text>
              <Text style={styles.date}>{new Date().toLocaleDateString('pt-PT', { weekday: 'long', day: 'numeric', month: 'long' })}</Text>
            </View>
            <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
              <Text style={styles.logoutText}>Sair</Text>
            </TouchableOpacity>
          </View>

          {/* Summary cards */}
          <View style={styles.statsRow}>
            <Card style={styles.statCard}>
              <Text style={styles.statNumber}>{pendingCount}</Text>
              <Text style={styles.statLabel}>Checklists{'\n'}pendentes</Text>
            </Card>
            <Card style={styles.statCard}>
              <Text style={[styles.statNumber, openAnomalies > 0 && styles.statDanger]}>{openAnomalies}</Text>
              <Text style={styles.statLabel}>Anomalias{'\n'}em aberto</Text>
            </Card>
            <Card style={styles.statCard}>
              <Text style={[styles.statNumber, styles.statSuccess]}>
                {checklists.filter((c) => c.status === 'completed' || c.status === 'concluido').length}
              </Text>
              <Text style={styles.statLabel}>Checklists{'\n'}concluídas</Text>
            </Card>
          </View>

          <Text style={styles.sectionTitle}>Checklists de hoje</Text>
        </>
      }
      data={checklists}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <TouchableOpacity onPress={() => router.push(`/checklists/${item.id}`)}>
          <Card style={styles.listItem}>
            <View style={styles.listItemRow}>
              <Text style={styles.listItemName} numberOfLines={1}>{item.name}</Text>
              <Badge
                label={item.status === 'completed' || item.status === 'concluido' ? 'Concluída' : 'Pendente'}
                variant={statusVariant(item.status)}
              />
            </View>
            {item.dueTime ? <Text style={styles.listItemSub}>Até às {item.dueTime}</Text> : null}
          </Card>
        </TouchableOpacity>
      )}
      ListEmptyComponent={
        !loading ? (
          <Card style={styles.emptyCard}>
            <Text style={styles.emptyText}>Sem checklists para hoje</Text>
          </Card>
        ) : null
      }
      ListFooterComponent={
        <>
          <Text style={[styles.sectionTitle, { marginTop: 24 }]}>Anomalias recentes</Text>
          {anomalies.length === 0 && !loading ? (
            <Card style={styles.emptyCard}>
              <Text style={styles.emptyText}>Sem anomalias recentes</Text>
            </Card>
          ) : (
            anomalies.map((a) => (
              <TouchableOpacity key={a.id} onPress={() => router.push(`/anomalies/${a.id}`)}>
                <Card style={styles.listItem}>
                  <View style={styles.listItemRow}>
                    <Text style={styles.listItemName} numberOfLines={1}>{a.title}</Text>
                    <Badge label={a.severity} variant={severityVariant(a.severity)} />
                  </View>
                  {a.area ? <Text style={styles.listItemSub}>{a.area}</Text> : null}
                  <Text style={styles.listItemSub}>
                    {new Date(a.createdAt).toLocaleDateString('pt-PT')}
                  </Text>
                </Card>
              </TouchableOpacity>
            ))
          )}
        </>
      }
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f4f6' },
  content: { padding: 16, paddingBottom: 32 },
  greetRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  greeting: { fontSize: 22, fontWeight: '700', color: '#111827' },
  date: { fontSize: 13, color: '#6b7280', marginTop: 2, textTransform: 'capitalize' },
  logoutBtn: { paddingVertical: 6, paddingHorizontal: 12, backgroundColor: '#fee2e2', borderRadius: 8 },
  logoutText: { color: '#dc2626', fontWeight: '600', fontSize: 13 },
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 24 },
  statCard: { flex: 1, alignItems: 'center', padding: 12 },
  statNumber: { fontSize: 28, fontWeight: '800', color: '#2563eb' },
  statDanger: { color: '#dc2626' },
  statSuccess: { color: '#16a34a' },
  statLabel: { fontSize: 11, color: '#6b7280', textAlign: 'center', marginTop: 2 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#374151', marginBottom: 10 },
  listItem: { marginBottom: 10 },
  listItemRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  listItemName: { flex: 1, fontSize: 15, fontWeight: '600', color: '#111827', marginRight: 8 },
  listItemSub: { fontSize: 12, color: '#6b7280', marginTop: 4 },
  emptyCard: { alignItems: 'center', paddingVertical: 24 },
  emptyText: { color: '#9ca3af', fontSize: 14 },
});
