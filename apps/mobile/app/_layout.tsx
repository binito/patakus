import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useAuthStore } from '../src/store/auth.store';
import { getToken, decodeJwtPayload } from '../src/lib/auth';

export default function RootLayout() {
  const { login, setLoading } = useAuthStore();

  useEffect(() => {
    async function bootstrap() {
      try {
        const token = await getToken();
        if (token) {
          const payload = decodeJwtPayload(token);
          const exp = payload?.exp as number | undefined;
          // Discard expired tokens
          if (!exp || exp * 1000 > Date.now()) {
            await login(token);
            return;
          }
        }
      } catch {
        // Ignore secure-store errors on first launch
      } finally {
        setLoading(false);
      }
    }
    bootstrap();
  }, []);

  return (
    <>
      <StatusBar style="auto" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="checklists/[id]"
          options={{
            headerShown: true,
            title: 'Checklist',
            headerTintColor: '#2563eb',
            headerBackTitle: 'Voltar',
          }}
        />
        <Stack.Screen
          name="anomalies/[id]"
          options={{
            headerShown: true,
            title: 'Anomalia',
            headerTintColor: '#2563eb',
            headerBackTitle: 'Voltar',
          }}
        />
        <Stack.Screen
          name="registos/entradas"
          options={{
            headerShown: true,
            title: 'Entradas',
            headerStyle: { backgroundColor: '#1d4ed8' },
            headerTintColor: '#ffffff',
            headerBackTitle: 'Registos',
          }}
        />
        <Stack.Screen
          name="registos/temperaturas"
          options={{
            headerShown: true,
            title: 'Temperaturas',
            headerStyle: { backgroundColor: '#0369a1' },
            headerTintColor: '#ffffff',
            headerBackTitle: 'Registos',
          }}
        />
        <Stack.Screen
          name="registos/higienizacao"
          options={{
            headerShown: true,
            title: 'Higienização',
            headerStyle: { backgroundColor: '#15803d' },
            headerTintColor: '#ffffff',
            headerBackTitle: 'Registos',
          }}
        />
        <Stack.Screen
          name="registos/desinfecao"
          options={{
            headerShown: true,
            title: 'Desinfeção',
            headerStyle: { backgroundColor: '#7c3aed' },
            headerTintColor: '#ffffff',
            headerBackTitle: 'Registos',
          }}
        />
        <Stack.Screen
          name="registos/oleos"
          options={{
            headerShown: true,
            title: 'Óleos de Fritura',
            headerStyle: { backgroundColor: '#b45309' },
            headerTintColor: '#ffffff',
            headerBackTitle: 'Registos',
          }}
        />
      </Stack>
    </>
  );
}
