import React from 'react';
import { View, Text, TextInput, Alert, ScrollView, Platform, Pressable } from 'react-native';
// Import conditionnel pour éviter un crash sur Web si le module n'est pas supporté
declare var require: any; // pour TS sur web
let DateTimePickerComp: any = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  DateTimePickerComp = require('@react-native-community/datetimepicker').default;
} catch {}
import { colors, spacing, radius } from '../theme';
import PrimaryButton from '../components/PrimaryButton';
import { useUser } from '../state/UserContext';
import { BASE_URL } from '../config';

export default function AdminScreen() {
  const { user, isAdmin } = useUser();
  // Création de terrain
  const [terrainName, setTerrainName] = React.useState('');
  const [terrainAddress, setTerrainAddress] = React.useState('');
  const [createdTerrainId, setCreatedTerrainId] = React.useState<string | null>(null);
  // Création de slot
  const [terrainId, setTerrainId] = React.useState('');
  // Sélection date/heure via pickers
  const [dateStr, setDateStr] = React.useState(''); // ex: 2025-12-01
  const [timeStr, setTimeStr] = React.useState(''); // ex: 18:00
  const [pickerDate, setPickerDate] = React.useState<Date>(new Date(Date.now() + 60*60*1000));
  const [showDate, setShowDate] = React.useState(false);
  const [showTime, setShowTime] = React.useState(false);
  const [slotId, setSlotId] = React.useState('');
  const [loading, setLoading] = React.useState<string | null>(null);
  const [terrains, setTerrains] = React.useState<Array<{ _id: string; name: string; address?: string }>>([]);
  const [slots, setSlots] = React.useState<Array<{ _id: string; terrainId: string; startAt: string; status: string }>>([]);
  const buildHeaders = (contentType?: boolean) => {
    const h: Record<string, string> = {};
    if (contentType) h['Content-Type'] = 'application/json';
    if (user.accessToken) h['Authorization'] = `Bearer ${user.accessToken}`;
    return h;
  };

  // Helpers
  const buildStartAtIso = () => {
    // Construit un ISO en UTC à partir d'une date locale (YYYY-MM-DD) et heure (HH:mm)
    if (!dateStr || !timeStr) return null;
    const [y, m, d] = dateStr.split('-').map(Number);
    const [hh, mm] = timeStr.split(':').map(Number);
    if (!y || !m || !d || hh === undefined || mm === undefined) return null;
    const dt = new Date(Date.UTC(y, (m - 1), d, hh, mm, 0, 0));
    return dt.toISOString();
  };

  const fmt = (iso: string) => new Date(iso).toLocaleString();
  const fmtDate = (d: Date) => d.toISOString().slice(0,10);
  const fmtTime = (d: Date) => `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;

  const refreshTerrains = async () => {
    try {
      const r = await fetch(`${BASE_URL}/admin/terrains`);
      const txt = await r.text();
      if (!r.ok) throw new Error(txt || 'Erreur');
      const data = JSON.parse(txt);
      setTerrains(Array.isArray(data) ? data : []);
    } catch (e) {
      // ignore pour l'UI
    }
  };

  const refreshSlots = async () => {
    try {
      const r = await fetch(`${BASE_URL}/slots`);
      const txt = await r.text();
      if (!r.ok) throw new Error(txt || 'Erreur');
      const data = JSON.parse(txt);
      setSlots(Array.isArray(data) ? data : []);
    } catch (e) {
      // ignore pour l'UI
    }
  };

  React.useEffect(() => {
    refreshTerrains();
    refreshSlots();
    // init champs date/heure depuis pickerDate
    setDateStr(fmtDate(pickerDate));
    setTimeStr(fmtTime(pickerDate));
  }, []);

  // Handlers pickers
  const onChangeDate = (_: any, selected?: Date) => {
    const current = selected || pickerDate;
    setShowDate(Platform.OS === 'ios');
    setPickerDate(current);
    setDateStr(fmtDate(current));
  };
  const onChangeTime = (_: any, selected?: Date) => {
    const current = selected || pickerDate;
    setShowTime(Platform.OS === 'ios');
    setPickerDate(current);
    setTimeStr(fmtTime(current));
  };

  const createTerrain = async () => {
    if (!terrainName.trim()) {
      Alert.alert('Admin', 'Le nom du terrain est requis');
      return;
    }
    setLoading('create-terrain');
    try {
      const r = await fetch(`${BASE_URL}/admin/terrains`, {
        method: 'POST',
        headers: buildHeaders(true),
        body: JSON.stringify({ name: terrainName.trim(), address: terrainAddress.trim() || undefined }),
      });
      const txt = await r.text();
      if (!r.ok) throw new Error(txt || 'Erreur');
      const data = JSON.parse(txt);
      const id = data?._id || data?.id;
      setCreatedTerrainId(id || null);
      if (id) setTerrainId(id);
      Alert.alert('Terrain', 'Créé avec succès');
    } catch (e: any) {
      Alert.alert('Erreur', e?.message ?? 'Erreur réseau');
    } finally {
      setLoading(null);
    }
  };

  const createSlot = async () => {
    const startAt = buildStartAtIso();
    if (!terrainId || !startAt) {
      Alert.alert('Admin', 'terrainId, date et heure sont requis');
      return;
    }
    // Valider que startAt est dans le futur
    if (Date.parse(startAt) <= Date.now()) {
      Alert.alert('Admin', 'Le créneau doit être dans le futur');
      return;
    }
    setLoading('create');
    try {
      const r = await fetch(`${BASE_URL}/admin/slots`, {
        method: 'POST',
        headers: buildHeaders(true),
        body: JSON.stringify({ terrainId, startAt, durationMin: 60, capacity: 10 }),
      });
      const txt = await r.text();
      if (!r.ok) throw new Error(txt || 'Erreur');
      Alert.alert('Créneaux', 'Créé avec succès');
    } catch (e: any) {
      Alert.alert('Erreur', e?.message ?? 'Erreur réseau');
    } finally {
      setLoading(null);
    }
  };

  const purgeSlots = async () => {
    setLoading('purge');
    try {
      const r = await fetch(`${BASE_URL}/admin/slots`, {
        method: 'DELETE',
        headers: buildHeaders(false),
      });
      const txt = await r.text();
      if (!r.ok) throw new Error(txt || 'Erreur');
      Alert.alert('Purge', 'Tous les slots ont été supprimés');
      await refreshSlots();
    } catch (e: any) {
      Alert.alert('Erreur', e?.message ?? 'Erreur réseau');
    } finally {
      setLoading(null);
    }
  };

  const deleteById = async () => {
    if (!slotId) {
      Alert.alert('Admin', 'slotId requis');
      return;
    }
    setLoading('delete');
    try {
      const r = await fetch(`${BASE_URL}/admin/slots/${slotId}`, {
        method: 'DELETE',
        headers: buildHeaders(false),
      });
      const txt = await r.text();
      if (!r.ok) throw new Error(txt || 'Erreur');
      Alert.alert('Suppression', `Slot ${slotId} supprimé (si existant)`);
      await refreshSlots();
    } catch (e: any) {
      Alert.alert('Erreur', e?.message ?? 'Erreur réseau');
    } finally {
      setLoading(null);
    }
  };

  if (!isAdmin) {
    return (
      <View style={{ flex: 1, padding: spacing.lg, backgroundColor: colors.background }}>
        <Text style={{ color: colors.danger }}>Accès refusé. Vous devez être admin.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={{ flex: 1, padding: spacing.lg, backgroundColor: colors.background }}>
      <Text style={{ fontSize: 22, fontWeight: '700', color: colors.text, marginBottom: spacing.md }}>Admin</Text>
      <Text style={{ color: colors.textMuted, marginBottom: spacing.lg }}>
        Connecté en tant que {user.email || 'inconnu'} {user.roles?.includes('admin') ? '(admin)' : ''}
      </Text>

      {/* Création de terrain */}
      <Text style={{ fontSize: 16, fontWeight: '600', color: colors.text, marginBottom: spacing.sm }}>Créer un terrain</Text>
      <Text style={{ color: colors.text, marginBottom: spacing.xs }}>Nom</Text>
      <TextInput
        value={terrainName}
        onChangeText={setTerrainName}
        placeholder="City Park"
        autoCapitalize="words"
        style={{ borderWidth: 1, borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.sm, borderColor: colors.border, backgroundColor: colors.card }}
      />
      <Text style={{ color: colors.text, marginBottom: spacing.xs }}>Adresse (optionnel)</Text>
      <TextInput
        value={terrainAddress}
        onChangeText={setTerrainAddress}
        placeholder="Rue du Stade, 75000 Paris"
        autoCapitalize="sentences"
        style={{ borderWidth: 1, borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.md, borderColor: colors.border, backgroundColor: colors.card }}
      />
      <PrimaryButton title={loading==='create-terrain' ? '...' : 'Créer un terrain'} onPress={createTerrain} disabled={loading!==null} />
      {createdTerrainId && (
        <Text style={{ color: colors.textMuted, marginTop: spacing.xs, marginBottom: spacing.md }}>Terrain créé: {createdTerrainId}</Text>
      )}

      <View style={{ height: spacing.lg }} />

      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm, justifyContent: 'space-between' }}>
        <Text style={{ color: colors.text, fontWeight: '600' }}>Terrains</Text>
        <PrimaryButton title="Actualiser" onPress={refreshTerrains} />
      </View>
      {terrains.length > 0 ? (
        <View style={{ marginBottom: spacing.md }}>
          {terrains.map((t) => (
            <View key={t._id} style={{
              padding: spacing.sm,
              borderWidth: 1, borderColor: t._id === terrainId ? colors.primary : colors.border,
              backgroundColor: t._id === terrainId ? '#ECFDF5' : colors.card,
              borderRadius: radius.md,
              marginBottom: spacing.xs,
            }}>
              <Text onPress={() => setTerrainId(t._id)} style={{ color: colors.text }}>
                {t.name}{t.address ? ` — ${t.address}` : ''}
              </Text>
            </View>
          ))}
        </View>
      ) : (
        <Text style={{ color: colors.textMuted, marginBottom: spacing.sm }}>Aucun terrain. Crée-en un ci-dessus.</Text>
      )}

      <Text style={{ color: colors.text, marginBottom: spacing.xs }}>terrainId (modifiable)</Text>
      <TextInput
        value={terrainId}
        onChangeText={setTerrainId}
        placeholder="66f1c2a1e8b0f9a9d1234567"
        autoCapitalize="none"
        style={{
          borderWidth: 1, borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.md,
          borderColor: colors.border, backgroundColor: colors.card,
        }}
      />

      <Text style={{ color: colors.text, marginBottom: spacing.xs }}>Date</Text>
      <Pressable onPress={() => setShowDate(true)} style={{
        borderWidth: 1, borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.sm,
        borderColor: colors.border, backgroundColor: colors.card,
      }}>
        <Text style={{ color: colors.text }}>{dateStr || 'Choisir une date'}</Text>
      </Pressable>
      {showDate && DateTimePickerComp && Platform.OS !== 'web' && (
        <DateTimePickerComp value={pickerDate} mode="date" onChange={onChangeDate} display={Platform.OS === 'ios' ? 'spinner' : 'default'} />
      )}

      <Text style={{ color: colors.text, marginBottom: spacing.xs }}>Heure</Text>
      <Pressable onPress={() => setShowTime(true)} style={{
        borderWidth: 1, borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.md,
        borderColor: colors.border, backgroundColor: colors.card,
      }}>
        <Text style={{ color: colors.text }}>{timeStr || 'Choisir une heure'}</Text>
      </Pressable>
      {showTime && DateTimePickerComp && Platform.OS !== 'web' && (
        <DateTimePickerComp value={pickerDate} mode="time" onChange={onChangeTime} display={Platform.OS === 'ios' ? 'spinner' : 'default'} />
      )}

      <PrimaryButton title={loading==='create' ? '...' : 'Créer un créneau'} onPress={createSlot} disabled={loading!==null} />

      <View style={{ height: spacing.lg }} />

      <PrimaryButton title={loading==='purge' ? '...' : 'Purger tous les slots'} onPress={purgeSlots} disabled={loading!==null} />

      <View style={{ height: spacing.lg }} />

      <Text style={{ color: colors.text, marginBottom: spacing.xs }}>slotId</Text>
      <TextInput
        value={slotId}
        onChangeText={setSlotId}
        placeholder="664abc..."
        autoCapitalize="none"
        style={{
          borderWidth: 1, borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.md,
          borderColor: colors.border, backgroundColor: colors.card,
        }}
      />
      <PrimaryButton title={loading==='delete' ? '...' : 'Supprimer par id'} onPress={deleteById} disabled={loading!==null} />

      <View style={{ height: spacing.lg }} />

      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm }}>
        <Text style={{ color: colors.text, fontWeight: '600', marginRight: spacing.sm }}>Créneaux</Text>
        <PrimaryButton title="Actualiser" onPress={refreshSlots} />
      </View>
      {slots.length > 0 ? (
        <View style={{ marginBottom: spacing.xl }}>
          {slots.slice(0, 10).map((s) => (
            <View key={s._id} style={{
              borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card,
              borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.sm,
            }}>
              <Text style={{ color: colors.text }}>{fmt(s.startAt)} — {s.status}</Text>
              <Text style={{ color: colors.textMuted, fontSize: 12 }}>id: {s._id}</Text>
            </View>
          ))}
        </View>
      ) : (
        <Text style={{ color: colors.textMuted, marginBottom: spacing.xl }}>Aucun créneau.</Text>
      )}
    </ScrollView>
  );
}
