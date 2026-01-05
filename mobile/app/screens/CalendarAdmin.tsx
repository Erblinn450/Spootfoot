import React from 'react';
import { View, Text, ScrollView, Alert, Modal, TouchableOpacity, Animated } from 'react-native';
import { Calendar } from 'react-native-calendars';
import { colors, spacing, radius, font, shadow } from '../theme';
import { Header, Card, Badge, Button, Input, EmptyState, AnimatedEntry } from '../components/UI';
import { useUser } from '../state/UserContext';
import { apiClient } from '../utils/apiClient';

interface Slot {
  _id: string;
  terrainId: string;
  startAt: string;
  durationMin: number;
  capacity: number;
  status: string;
}

interface Terrain {
  _id: string;
  name: string;
  address?: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// SLOT CARD
// ═══════════════════════════════════════════════════════════════════════════

function SlotCard({ slot, terrain, index, onDelete, loading }: { 
  slot: Slot; terrain?: Terrain; index: number; onDelete: () => void; loading: boolean;
}) {
  const opacity = React.useRef(new Animated.Value(0)).current;
  const translateX = React.useRef(new Animated.Value(-20)).current;
  
  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 300, delay: index * 60, useNativeDriver: true }),
      Animated.spring(translateX, { toValue: 0, delay: index * 60, friction: 8, useNativeDriver: true }),
    ]).start();
  }, [index, opacity, translateX]);

  const time = new Date(slot.startAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Paris' });
  const isOpen = slot.status === 'OPEN';

  return (
    <Animated.View style={{ opacity, transform: [{ translateX }], marginBottom: spacing['3'] }}>
      <Card noPadding>
        <View style={{ flexDirection: 'row' }}>
          {/* Time */}
          <View style={{
            width: 80, backgroundColor: isOpen ? colors.brandMuted : colors.warningMuted,
            alignItems: 'center', justifyContent: 'center', padding: spacing['3'],
          }}>
            <Text style={{ color: isOpen ? colors.brand : colors.warning, fontSize: font.xl, fontWeight: font.black }}>
              {time}
            </Text>
            <Text style={{ color: colors.textMuted, fontSize: font.xs, fontWeight: font.semibold, marginTop: spacing['1'] }}>
              {slot.durationMin}min
            </Text>
          </View>

          {/* Content */}
          <View style={{ flex: 1, padding: spacing['3'] }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <View style={{ flex: 1 }}>
                <Text style={{ color: colors.textPrimary, fontWeight: font.bold, fontSize: font.base, marginBottom: spacing['1'] }}>
                  {terrain?.name || 'Terrain inconnu'}
                </Text>
                {terrain?.address && (
                  <Text style={{ color: colors.textMuted, fontSize: font.xs }}>
                    📍 {terrain.address}
                  </Text>
                )}
              </View>
              
              <TouchableOpacity
                onPress={onDelete}
                disabled={loading}
                style={{
                  backgroundColor: colors.errorMuted, paddingHorizontal: spacing['3'],
                  paddingVertical: spacing['2'], borderRadius: radius.md,
                }}
              >
                <Text style={{ fontSize: 14 }}>{loading ? '⏳' : '🗑️'}</Text>
              </TouchableOpacity>
            </View>
            
            <View style={{ flexDirection: 'row', gap: spacing['2'], marginTop: spacing['2'] }}>
              <Badge variant="default">👥 {slot.capacity}</Badge>
              <Badge variant={isOpen ? 'lime' : 'warning'} icon={isOpen ? '✓' : '⏳'}>
                {isOpen ? 'Libre' : 'Réservé'}
              </Badge>
            </View>
          </View>
        </View>
      </Card>
    </Animated.View>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// MODAL BOTTOM SHEET
// ═══════════════════════════════════════════════════════════════════════════

function BottomSheet({ visible, onClose, title, children }: {
  visible: boolean; onClose: () => void; title: string; children: React.ReactNode;
}) {
  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={{ flex: 1, backgroundColor: colors.overlay, justifyContent: 'flex-end' }}>
        <View style={{ 
          backgroundColor: colors.bgCard, borderTopLeftRadius: radius['2xl'], borderTopRightRadius: radius['2xl'],
          padding: spacing['5'], paddingBottom: spacing['10'],
        }}>
          <View style={{ 
            width: 40, height: 4, backgroundColor: colors.gray700, borderRadius: 2,
            alignSelf: 'center', marginBottom: spacing['5'],
          }} />
          <Text style={{ color: colors.textPrimary, fontSize: font['2xl'], fontWeight: font.black, marginBottom: spacing['5'] }}>
            {title}
          </Text>
          {children}
        </View>
      </View>
    </Modal>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN SCREEN
// ═══════════════════════════════════════════════════════════════════════════

export default function CalendarAdminScreen() {
  const { isAdmin } = useUser();
  const [selectedDate, setSelectedDate] = React.useState(new Date().toISOString().split('T')[0]);
  const [slots, setSlots] = React.useState<Slot[]>([]);
  const [terrains, setTerrains] = React.useState<Terrain[]>([]);
  const [loading, setLoading] = React.useState<string | null>(null);
  
  const [showCreateModal, setShowCreateModal] = React.useState(false);
  const [showTerrainModal, setShowTerrainModal] = React.useState(false);
  const [showTemplateModal, setShowTemplateModal] = React.useState(false);
  
  const [selectedTerrain, setSelectedTerrain] = React.useState<string>('');
  const [selectedTime, setSelectedTime] = React.useState('18:00');
  const [newTerrainName, setNewTerrainName] = React.useState('');
  const [newTerrainAddress, setNewTerrainAddress] = React.useState('');

  const refreshData = async () => {
    try {
      const [terrainsRes, slotsRes] = await Promise.all([
        apiClient.get('/admin/terrains'),
        apiClient.get('/slots'),
      ]);
      if (terrainsRes.data) setTerrains(Array.isArray(terrainsRes.data) ? terrainsRes.data : []);
      if (slotsRes.data) setSlots(Array.isArray(slotsRes.data) ? slotsRes.data : []);
    } catch (e) {
      console.warn('Error refreshing:', e);
    }
  };

  React.useEffect(() => { refreshData(); }, []);

  const markedDates = React.useMemo(() => {
    const marked: Record<string, any> = {};
    marked[selectedDate] = { selected: true, selectedColor: colors.brand };
    slots.forEach(slot => {
      const date = slot.startAt.split('T')[0];
      if (!marked[date]) marked[date] = { dots: [] };
      else if (!marked[date].dots) marked[date].dots = [];
      marked[date].dots.push({ color: slot.status === 'OPEN' ? colors.lime : colors.warning });
      marked[date].markingType = 'multi-dot';
    });
    return marked;
  }, [selectedDate, slots]);

  const slotsForDate = slots.filter(s => s.startAt.split('T')[0] === selectedDate).sort((a, b) => a.startAt.localeCompare(b.startAt));

  const createSlot = async () => {
    if (!selectedTerrain || !selectedTime) return Alert.alert('Erreur', 'Sélectionnez terrain et heure');
    setLoading('create-slot');
    try {
      const res = await apiClient.post('/admin/slots', {
        terrainId: selectedTerrain,
        startAt: new Date(`${selectedDate}T${selectedTime}:00`).toISOString(),
        durationMin: 60, capacity: 10,
      });
      if (res.error) throw new Error(res.error);
      Alert.alert('✅ Succès', 'Créneau créé');
      setShowCreateModal(false);
      refreshData();
    } catch (e: any) {
      Alert.alert('❌ Erreur', e.message);
    } finally {
      setLoading(null);
    }
  };

  const createTerrain = async () => {
    if (!newTerrainName.trim()) return Alert.alert('Erreur', 'Nom requis');
    setLoading('create-terrain');
    try {
      const res = await apiClient.post('/admin/terrains', { name: newTerrainName.trim(), address: newTerrainAddress.trim() || undefined });
      if (res.error) throw new Error(res.error);
      Alert.alert('✅ Succès', 'Terrain créé');
      setNewTerrainName(''); setNewTerrainAddress('');
      setSelectedTerrain(res.data._id);
      setShowTerrainModal(false);
      refreshData();
    } catch (e: any) {
      Alert.alert('❌ Erreur', e.message);
    } finally {
      setLoading(null);
    }
  };

  const deleteSlot = async (slotId: string) => {
    if (!window.confirm('Supprimer ce créneau ?')) return;
    try {
      setLoading('delete');
      const res = await apiClient.delete(`/admin/slots/${slotId}`);
      if (res.error) throw new Error(res.error);
      window.alert('✅ Créneau supprimé');
      await refreshData();
    } catch (e: any) {
      window.alert('❌ ' + (e.message || 'Erreur'));
    } finally {
      setLoading(null);
    }
  };

  const createWeekTemplate = async () => {
    if (!selectedTerrain) return Alert.alert('Erreur', 'Sélectionnez un terrain');
    setLoading('template');
    try {
      const startDate = new Date(selectedDate);
      const promises = [];
      for (let i = 0; i < 7; i++) {
        const date = new Date(startDate);
        date.setDate(startDate.getDate() + i);
        if (date.getDay() === 0 || date.getDay() === 6) continue;
        promises.push(apiClient.post('/admin/slots', {
          terrainId: selectedTerrain,
          startAt: new Date(`${date.toISOString().split('T')[0]}T18:00:00`).toISOString(),
          durationMin: 120, capacity: 10,
        }));
      }
      await Promise.all(promises);
      Alert.alert('✅ Succès', 'Template créé');
      setShowTemplateModal(false);
      refreshData();
    } catch (e: any) {
      Alert.alert('❌ Erreur', e.message);
    } finally {
      setLoading(null);
    }
  };

  if (!isAdmin) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, justifyContent: 'center', alignItems: 'center', padding: spacing['6'] }}>
        <View style={{
          width: 80, height: 80, borderRadius: radius['2xl'], backgroundColor: colors.errorMuted,
          alignItems: 'center', justifyContent: 'center', marginBottom: spacing['5'],
        }}>
          <Text style={{ fontSize: 36 }}>🔒</Text>
        </View>
        <Text style={{ color: colors.textPrimary, fontSize: font.xl, fontWeight: font.bold, marginBottom: spacing['2'] }}>
          Accès refusé
        </Text>
        <Text style={{ color: colors.textMuted, textAlign: 'center' }}>
          Vous devez être administrateur.
        </Text>
      </View>
    );
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.bg }}>
      {/* Gradient */}
      <View style={{
        position: 'absolute', top: -50, right: -100, width: 300, height: 300,
        borderRadius: 150, backgroundColor: colors.limeGlow, opacity: 0.15,
      }} />

      <Header 
        title="Admin" 
        subtitle="Gestion des créneaux"
        icon="📅"
        rightElement={
          <View style={{ flexDirection: 'row', gap: spacing['2'] }}>
            <TouchableOpacity
              onPress={() => setShowTerrainModal(true)}
              style={{ backgroundColor: colors.bgCard, padding: spacing['3'], borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border }}
            >
              <Text style={{ fontSize: 18 }}>🏟️</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setShowTemplateModal(true)}
              style={{ backgroundColor: colors.bgCard, padding: spacing['3'], borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border }}
            >
              <Text style={{ fontSize: 18 }}>📋</Text>
            </TouchableOpacity>
          </View>
        }
      />

      {/* Calendar */}
      <View style={{ marginHorizontal: spacing['4'], marginBottom: spacing['5'] }}>
        <Card noPadding>
          <Calendar
            current={selectedDate}
            onDayPress={(day) => setSelectedDate(day.dateString)}
            markedDates={markedDates}
            theme={{
              backgroundColor: colors.bgCard,
              calendarBackground: colors.bgCard,
              textSectionTitleColor: colors.textMuted,
              selectedDayBackgroundColor: colors.brand,
              selectedDayTextColor: colors.gray950,
              todayTextColor: colors.brand,
              dayTextColor: colors.textPrimary,
              textDisabledColor: colors.textDisabled,
              arrowColor: colors.brand,
              monthTextColor: colors.textPrimary,
              textMonthFontWeight: '700',
              textDayFontSize: font.base,
              textMonthFontSize: font.lg,
            }}
          />
        </Card>
      </View>

      {/* Slots */}
      <View style={{ paddingHorizontal: spacing['4'] }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing['4'] }}>
          <View>
            <Text style={{ color: colors.textMuted, fontSize: font.xs, fontWeight: font.bold, letterSpacing: 1, textTransform: 'uppercase' }}>
              Créneaux du jour
            </Text>
            <Text style={{ color: colors.textPrimary, fontSize: font.lg, fontWeight: font.bold, marginTop: spacing['1'] }}>
              {new Date(selectedDate + 'T00:00:00').toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
            </Text>
          </View>
          <Badge variant="brand">{slotsForDate.length}</Badge>
        </View>

        {slotsForDate.length === 0 ? (
          <EmptyState
            icon="📭"
            title="Aucun créneau"
            description="Créez votre premier créneau"
            action={{ label: 'Créer un créneau', onPress: () => setShowCreateModal(true) }}
          />
        ) : (
          <>
            {slotsForDate.map((slot, index) => (
              <SlotCard
                key={slot._id}
                slot={slot}
                terrain={terrains.find(t => t._id === slot.terrainId)}
                index={index}
                onDelete={() => deleteSlot(slot._id)}
                loading={loading === 'delete'}
              />
            ))}
            <View style={{ marginTop: spacing['3'] }}>
              <Button onPress={() => setShowCreateModal(true)} icon="➕">
                Nouveau créneau
              </Button>
            </View>
          </>
        )}

        <View style={{ height: spacing['10'] }} />
      </View>

      {/* Create Slot Modal */}
      <BottomSheet visible={showCreateModal} onClose={() => setShowCreateModal(false)} title="Nouveau créneau">
        <Text style={{ color: colors.textMuted, marginBottom: spacing['4'] }}>
          📅 {new Date(selectedDate + 'T00:00:00').toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
        </Text>
        
        <Text style={{ color: colors.textMuted, fontSize: font.xs, fontWeight: font.bold, letterSpacing: 1, marginBottom: spacing['2'] }}>
          TERRAIN
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: spacing['4'] }}>
          <View style={{ flexDirection: 'row', gap: spacing['2'] }}>
            {terrains.map(t => (
              <TouchableOpacity
                key={t._id}
                onPress={() => setSelectedTerrain(t._id)}
                style={{
                  backgroundColor: selectedTerrain === t._id ? colors.brand : colors.bgElevated,
                  padding: spacing['3'], borderRadius: radius.lg, minWidth: 100,
                }}
              >
                <Text style={{ color: selectedTerrain === t._id ? colors.gray950 : colors.textPrimary, fontWeight: font.semibold }}>
                  {t.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        <Input value={selectedTime} onChangeText={setSelectedTime} label="Heure" placeholder="18:00" icon="🕐" />
        
        <View style={{ flexDirection: 'row', gap: spacing['3'] }}>
          <View style={{ flex: 1 }}>
            <Button onPress={() => setShowCreateModal(false)} variant="secondary">Annuler</Button>
          </View>
          <View style={{ flex: 1 }}>
            <Button onPress={createSlot} loading={loading === 'create-slot'} icon="✓">Créer</Button>
          </View>
        </View>
      </BottomSheet>

      {/* Create Terrain Modal */}
      <BottomSheet visible={showTerrainModal} onClose={() => setShowTerrainModal(false)} title="🏟️ Nouveau terrain">
        <Input value={newTerrainName} onChangeText={setNewTerrainName} label="Nom" placeholder="City Park" icon="🏟️" />
        <Input value={newTerrainAddress} onChangeText={setNewTerrainAddress} label="Adresse (optionnelle)" placeholder="Rue du Stade" icon="📍" />
        
        <View style={{ flexDirection: 'row', gap: spacing['3'] }}>
          <View style={{ flex: 1 }}>
            <Button onPress={() => setShowTerrainModal(false)} variant="secondary">Annuler</Button>
          </View>
          <View style={{ flex: 1 }}>
            <Button onPress={createTerrain} loading={loading === 'create-terrain'} icon="✓">Créer</Button>
          </View>
        </View>
      </BottomSheet>

      {/* Template Modal */}
      <BottomSheet visible={showTemplateModal} onClose={() => setShowTemplateModal(false)} title="📋 Templates">
        <Text style={{ color: colors.textMuted, fontSize: font.xs, fontWeight: font.bold, letterSpacing: 1, marginBottom: spacing['2'] }}>
          TERRAIN
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: spacing['5'] }}>
          <View style={{ flexDirection: 'row', gap: spacing['2'] }}>
            {terrains.map(t => (
              <TouchableOpacity
                key={t._id}
                onPress={() => setSelectedTerrain(t._id)}
                style={{
                  backgroundColor: selectedTerrain === t._id ? colors.brand : colors.bgElevated,
                  padding: spacing['3'], borderRadius: radius.lg, minWidth: 100,
                }}
              >
                <Text style={{ color: selectedTerrain === t._id ? colors.gray950 : colors.textPrimary, fontWeight: font.semibold }}>
                  {t.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        <Button onPress={createWeekTemplate} loading={loading === 'template'} variant="lime" icon="📅" size="lg">
          Semaine Type (Lun-Ven 18h-20h)
        </Button>
        <View style={{ marginTop: spacing['3'] }}>
          <Button onPress={() => setShowTemplateModal(false)} variant="secondary">Fermer</Button>
        </View>
      </BottomSheet>
    </ScrollView>
  );
}
