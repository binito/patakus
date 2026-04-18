import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Alert,
  Image,
  TouchableOpacity,
  Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { api } from '../../src/lib/api';
import { useAuthStore } from '../../src/store/auth.store';
import { Button } from '../../src/components/ui/Button';
import { Input } from '../../src/components/ui/Input';
import { Card } from '../../src/components/ui/Card';

const SEVERITIES = [
  { value: 'low', label: 'Baixa' },
  { value: 'medium', label: 'Média' },
  { value: 'high', label: 'Alta' },
  { value: 'critical', label: 'Crítica' },
];

const MAX_PHOTOS = 3;

export default function ReportarScreen() {
  const user = useAuthStore((s) => s.user);
  const [areas, setAreas] = useState<{ id: string; name: string }[]>([]);
  const [selectedArea, setSelectedArea] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [severity, setSeverity] = useState('medium');
  const [photos, setPhotos] = useState<{ uri: string; name: string; type: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    async function fetchAreas() {
      try {
        const { data } = await api.get<{ id: string; name: string }[]>(
          `/clients/${user?.clientId}/areas`,
        );
        setAreas(data);
      } catch {
        // Not critical; area field degrades to text input
      }
    }
    fetchAreas();
  }, [user?.clientId]);

  async function pickPhoto() {
    if (photos.length >= MAX_PHOTOS) {
      Alert.alert('Limite atingido', `Máximo de ${MAX_PHOTOS} fotos por anomalia.`);
      return;
    }

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permissão negada', 'É necessário acesso à galeria para adicionar fotos.');
      return;
    }

    Alert.alert('Adicionar foto', 'Escolher origem:', [
      {
        text: 'Câmara',
        onPress: async () => {
          const camStatus = await ImagePicker.requestCameraPermissionsAsync();
          if (camStatus.status !== 'granted') return;
          const result = await ImagePicker.launchCameraAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            quality: 0.7,
            allowsEditing: false,
          });
          if (!result.canceled && result.assets[0]) {
            addPhoto(result.assets[0]);
          }
        },
      },
      {
        text: 'Galeria',
        onPress: async () => {
          const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            quality: 0.7,
            allowsEditing: false,
          });
          if (!result.canceled && result.assets[0]) {
            addPhoto(result.assets[0]);
          }
        },
      },
      { text: 'Cancelar', style: 'cancel' },
    ]);
  }

  function addPhoto(asset: ImagePicker.ImagePickerAsset) {
    const ext = asset.uri.split('.').pop() ?? 'jpg';
    const name = `anomaly_${Date.now()}.${ext}`;
    const type = asset.mimeType ?? `image/${ext}`;
    setPhotos((prev) => [...prev, { uri: asset.uri, name, type }]);
  }

  function removePhoto(index: number) {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  }

  function validate(): boolean {
    const e: Record<string, string> = {};
    if (!title.trim()) e.title = 'Título é obrigatório';
    if (!description.trim()) e.description = 'Descrição é obrigatória';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit() {
    if (!validate()) return;
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('clientId', user?.clientId ?? '');
      formData.append('operatorId', user?.id ?? '');
      formData.append('title', title.trim());
      formData.append('description', description.trim());
      formData.append('severity', severity);
      if (selectedArea) formData.append('area', selectedArea);

      photos.forEach((photo) => {
        formData.append('photos', {
          uri: Platform.OS === 'android' ? photo.uri : photo.uri.replace('file://', ''),
          name: photo.name,
          type: photo.type,
        } as unknown as Blob);
      });

      await api.post('/reports/anomalies', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      Alert.alert('Enviado', 'Anomalia reportada com sucesso!', [
        { text: 'OK', onPress: () => router.back() },
      ]);

      setTitle('');
      setDescription('');
      setSeverity('medium');
      setSelectedArea('');
      setPhotos([]);
    } catch {
      Alert.alert('Erro', 'Não foi possível enviar a anomalia. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <Card style={styles.section}>
        <Text style={styles.sectionTitle}>Detalhes da Anomalia</Text>

        <Input
          label="Título *"
          placeholder="Ex: Fuga de água no WC"
          value={title}
          onChangeText={(t) => { setTitle(t); setErrors((e) => ({ ...e, title: undefined as unknown as string })); }}
          error={errors.title}
        />

        <Input
          label="Descrição *"
          placeholder="Descreva o problema em detalhe..."
          value={description}
          onChangeText={(t) => { setDescription(t); setErrors((e) => ({ ...e, description: undefined as unknown as string })); }}
          error={errors.description}
          multiline
          numberOfLines={4}
          style={styles.textArea}
          textAlignVertical="top"
        />
      </Card>

      <Card style={styles.section}>
        <Text style={styles.sectionTitle}>Severidade</Text>
        <View style={styles.severityRow}>
          {SEVERITIES.map((s) => (
            <TouchableOpacity
              key={s.value}
              style={[styles.severityBtn, severity === s.value && styles.severityBtnActive]}
              onPress={() => setSeverity(s.value)}
            >
              <Text style={[styles.severityLabel, severity === s.value && styles.severityLabelActive]}>
                {s.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </Card>

      {areas.length > 0 && (
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Área</Text>
          <View style={styles.areaGrid}>
            {areas.map((area) => (
              <TouchableOpacity
                key={area.id}
                style={[styles.areaBtn, selectedArea === area.name && styles.areaBtnActive]}
                onPress={() => setSelectedArea(selectedArea === area.name ? '' : area.name)}
              >
                <Text style={[styles.areaLabel, selectedArea === area.name && styles.areaLabelActive]}>
                  {area.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Card>
      )}

      <Card style={styles.section}>
        <View style={styles.photoHeader}>
          <Text style={styles.sectionTitle}>Fotos ({photos.length}/{MAX_PHOTOS})</Text>
          {photos.length < MAX_PHOTOS && (
            <TouchableOpacity style={styles.addPhotoBtn} onPress={pickPhoto}>
              <Text style={styles.addPhotoBtnText}>+ Adicionar</Text>
            </TouchableOpacity>
          )}
        </View>
        {photos.length > 0 ? (
          <View style={styles.photoRow}>
            {photos.map((photo, index) => (
              <View key={index} style={styles.photoThumbWrap}>
                <Image source={{ uri: photo.uri }} style={styles.photoThumb} />
                <TouchableOpacity style={styles.removePhotoBtn} onPress={() => removePhoto(index)}>
                  <Text style={styles.removePhotoText}>✕</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        ) : (
          <TouchableOpacity style={styles.photoPlaceholder} onPress={pickPhoto}>
            <Text style={styles.photoPlaceholderText}>📷 Toque para adicionar foto</Text>
          </TouchableOpacity>
        )}
      </Card>

      <Button
        label="Enviar Anomalia"
        onPress={handleSubmit}
        loading={loading}
        style={styles.submitBtn}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f4f6' },
  content: { padding: 16, paddingBottom: 40 },
  section: { marginBottom: 16 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#374151', marginBottom: 12 },
  textArea: { minHeight: 96 },
  severityRow: { flexDirection: 'row', gap: 8 },
  severityBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#d1d5db',
    alignItems: 'center',
  },
  severityBtnActive: { borderColor: '#2563eb', backgroundColor: '#eff6ff' },
  severityLabel: { fontSize: 13, fontWeight: '600', color: '#6b7280' },
  severityLabelActive: { color: '#2563eb' },
  areaGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  areaBtn: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#d1d5db',
    backgroundColor: '#f9fafb',
  },
  areaBtnActive: { borderColor: '#2563eb', backgroundColor: '#eff6ff' },
  areaLabel: { fontSize: 13, color: '#374151', fontWeight: '500' },
  areaLabelActive: { color: '#2563eb' },
  photoHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  addPhotoBtn: { paddingVertical: 6, paddingHorizontal: 12, backgroundColor: '#eff6ff', borderRadius: 8 },
  addPhotoBtnText: { color: '#2563eb', fontWeight: '600', fontSize: 13 },
  photoRow: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
  photoThumbWrap: { position: 'relative' },
  photoThumb: { width: 90, height: 90, borderRadius: 8, backgroundColor: '#e5e7eb' },
  removePhotoBtn: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: '#dc2626',
    borderRadius: 10,
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removePhotoText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  photoPlaceholder: {
    height: 100,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#d1d5db',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f9fafb',
  },
  photoPlaceholderText: { color: '#9ca3af', fontSize: 14 },
  submitBtn: { marginTop: 8 },
});
