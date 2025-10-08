import React from 'react';
import { View, Text, ScrollView, Alert, Modal, TextInput, TouchableOpacity } from 'react-native';
import { Calendar } from 'react-native-calendars';
import { colors, spacing, radius, shadows } from '../theme';
import PrimaryButton from '../components/PrimaryButton';
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

export default function CalendarAdminScreen() {
  const { user, isAdmin } = useUser();
  const [selectedDate, setSelectedDate] = React.useState(new Date().toISOString().split('T')[0]);
  const [slots, setSlots] = React.useState<Slot[]>([]);
  const [terrains, setTerrains] = React.useState<Terrain[]>([]);
  const [loading, setLoading] = React.useState<string | null>(null);
  
  // Modal states
  const [showCreateModal, setShowCreateModal] = React.useState(false);
  const [showTerrainModal, setShowTerrainModal] = React.useState(false);
  const [showTemplateModal, setShowTemplateModal] = React.useState(false);
  
  // Form states
  const [selectedTerrain, setSelectedTerrain] = React.useState<string>('');
  const [selectedTime, setSelectedTime] = React.useState('18:00');
  const [newTerrainName, setNewTerrainName] = React.useState('');
  const [newTerrainAddress, setNewTerrainAddress] = React.useState('');

  const refreshData = async () => {
    try {
      // Fetch terrains
      const terrainsRes = await apiClient.get('/admin/terrains');
      if (terrainsRes.data) {
        setTerrains(Array.isArray(terrainsRes.data) ? terrainsRes.data : []);
      }

      // Fetch slots
      const slotsRes = await apiClient.get('/slots');
      if (slotsRes.data) {
        setSlots(Array.isArray(slotsRes.data) ? slotsRes.data : []);
      }
    } catch (e) {
      console.warn('Error refreshing data:', e);
    }
  };

  React.useEffect(() => {
    refreshData();
  }, []);

  // Prepare calendar marking
  const markedDates = React.useMemo(() => {
    const marked: any = {};
    
    // Mark selected date
    marked[selectedDate] = {
      selected: true,
      selectedColor: colors.primary,
    };

    // Mark dates with slots
    slots.forEach(slot => {
      const date = slot.startAt.split('T')[0];
      if (!marked[date]) {
        marked[date] = { dots: [] };
      } else if (!marked[date].dots) {
        marked[date].dots = [];
      }
      marked[date].dots.push({
        color: slot.status === 'OPEN' ? colors.success : colors.warning,
      });
      marked[date].markingType = 'multi-dot';
    });

    return marked;
  }, [selectedDate, slots]);

  // Get slots for selected date
  const slotsForDate = slots.filter(slot => 
    slot.startAt.split('T')[0] === selectedDate
  ).sort((a, b) => a.startAt.localeCompare(b.startAt));

  const createSlot = async () => {
    if (!selectedTerrain || !selectedTime) {
      Alert.alert('Erreur', 'Sélectionnez un terrain et une heure');
      return;
    }

    setLoading('create-slot');
    try {
      // Créer une date locale puis la convertir en UTC
      const localDateTime = new Date(`${selectedDate}T${selectedTime}:00`);
      const startAt = localDateTime.toISOString();
      
      const response = await apiClient.post('/admin/slots', {
        terrainId: selectedTerrain,
        startAt,
        durationMin: 60,
        capacity: 10,
      });

      if (response.error) {
        throw new Error(response.error);
      }
      
      Alert.alert('Succès', 'Créneau créé avec succès');
      setShowCreateModal(false);
      refreshData();
    } catch (e: any) {
      Alert.alert('Erreur', e.message || 'Erreur réseau');
    } finally {
      setLoading(null);
    }
  };

  const createTerrain = async () => {
    if (!newTerrainName.trim()) {
      Alert.alert('Erreur', 'Le nom du terrain est requis');
      return;
    }

    setLoading('create-terrain');
    try {
      const response = await apiClient.post('/admin/terrains', {
        name: newTerrainName.trim(),
        address: newTerrainAddress.trim() || undefined,
      });

      if (response.error) {
        throw new Error(response.error);
      }
      
      Alert.alert('Succès', 'Terrain créé avec succès');
      setNewTerrainName('');
      setNewTerrainAddress('');
      setSelectedTerrain(response.data._id);
      setShowTerrainModal(false);
      refreshData();
    } catch (e: any) {
      Alert.alert('Erreur', e.message || 'Erreur réseau');
    } finally {
      setLoading(null);
    }
  };

  const deleteSlot = async (slotId: string) => {
    console.log('deleteSlot called with:', slotId);
    
    // Utiliser confirm() natif du navigateur au lieu de Alert.alert
    const confirmed = window.confirm('Supprimer ce créneau ?');
    
    if (!confirmed) {
      console.log('Delete cancelled by user');
      return;
    }

    try {
      setLoading('delete-slot');
      console.log('Starting delete for slot:', slotId);
      
      const url = `http://localhost:3001/admin/slots/${slotId}`;
      console.log('DELETE URL:', url);
      console.log('Token:', user.accessToken?.substring(0, 20) + '...');
      
      const response = await fetch(url, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${user.accessToken}`,
          'Content-Type': 'application/json',
        },
      });
      
      console.log('Delete response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Delete failed:', errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }
      
      const result = await response.json();
      console.log('Delete success:', result);
      
      window.alert('Créneau supprimé avec succès !');
      await refreshData();
    } catch (e: any) {
      console.error('Delete error:', e);
      window.alert('Erreur: ' + (e.message || 'Impossible de supprimer le créneau'));
    } finally {
      setLoading(null);
    }
  };

  const createWeekTemplate = async () => {
    if (!selectedTerrain) {
      Alert.alert('Erreur', 'Sélectionnez un terrain');
      return;
    }

    setLoading('template');
    try {
      const startDate = new Date(selectedDate);
      const promises = [];

      // Créer des créneaux pour la semaine (Lundi à Vendredi, 18h-20h)
      for (let i = 0; i < 7; i++) {
        const date = new Date(startDate);
        date.setDate(startDate.getDate() + i);
        
        // Skip weekends for this template
        if (date.getDay() === 0 || date.getDay() === 6) continue;

        // Créer une date locale à 18h puis la convertir en UTC
        const localDateTime = new Date(`${date.toISOString().split('T')[0]}T18:00:00`);
        const startAt = localDateTime.toISOString();
        
        promises.push(
          apiClient.post('/admin/slots', {
            terrainId: selectedTerrain,
            startAt,
            durationMin: 120, // 2h
            capacity: 10,
          })
        );
      }

      await Promise.all(promises);
      Alert.alert('Succès', 'Template de semaine créé (Lun-Ven 18h-20h)');
      setShowTemplateModal(false);
      refreshData();
    } catch (e: any) {
      Alert.alert('Erreur', e.message || 'Erreur lors de la création du template');
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
    <ScrollView style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Header avec style moderne */}
      <View style={{ 
        padding: spacing.xl,
        backgroundColor: colors.primary,
        borderBottomLeftRadius: radius.xl,
        borderBottomRightRadius: radius.xl,
        ...shadows.lg,
      }}>
        <Text style={{ fontSize: 28, fontWeight: '800', color: 'white', marginBottom: spacing.sm }}>
          📅 Calendrier Admin
        </Text>
        <Text style={{ color: 'rgba(255,255,255,0.9)', fontSize: 15 }}>
          Gérez vos créneaux visuellement
        </Text>

        {/* Action buttons avec ombres */}
        <View style={{ flexDirection: 'row', gap: spacing.md, marginTop: spacing.lg }}>
          <TouchableOpacity
            style={{
              flex: 1,
              backgroundColor: 'white',
              padding: spacing.md,
              borderRadius: radius.lg,
              alignItems: 'center',
              ...shadows.md,
            }}
            onPress={() => setShowCreateModal(true)}
          >
            <Text style={{ color: colors.primary, fontWeight: '700', fontSize: 15 }}>➕ Nouveau</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={{
              backgroundColor: 'white',
              padding: spacing.md,
              borderRadius: radius.lg,
              alignItems: 'center',
              minWidth: 60,
              ...shadows.md,
            }}
            onPress={() => setShowTerrainModal(true)}
          >
            <Text style={{ fontSize: 20 }}>🏟️</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={{
              backgroundColor: 'white',
              padding: spacing.md,
              borderRadius: radius.lg,
              alignItems: 'center',
              minWidth: 60,
              ...shadows.md,
            }}
            onPress={() => setShowTemplateModal(true)}
          >
            <Text style={{ fontSize: 20 }}>📋</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Calendar avec ombre */}
      <View style={{ marginHorizontal: spacing.lg, marginTop: spacing.lg, ...shadows.md, borderRadius: radius.lg, overflow: 'hidden' }}>
        <Calendar
          current={selectedDate}
          onDayPress={(day) => setSelectedDate(day.dateString)}
          markedDates={markedDates}
          theme={{
            backgroundColor: colors.background,
            calendarBackground: colors.card,
            textSectionTitleColor: colors.text,
            selectedDayBackgroundColor: colors.primary,
            selectedDayTextColor: 'white',
            todayTextColor: colors.primary,
            dayTextColor: colors.text,
            textDisabledColor: colors.textMuted,
            arrowColor: colors.primary,
            monthTextColor: colors.text,
            textMonthFontWeight: '700',
            textDayFontSize: 15,
            textMonthFontSize: 18,
          }}
        />
      </View>

      {/* Slots for selected date */}
      <View style={{ padding: spacing.lg }}>
        <View style={{ 
          flexDirection: 'row', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          marginBottom: spacing.md,
          paddingBottom: spacing.sm,
          borderBottomWidth: 2,
          borderBottomColor: colors.primary,
        }}>
          <Text style={{ fontSize: 20, fontWeight: '700', color: colors.text }}>
            📆 {new Date(selectedDate + 'T00:00:00').toLocaleDateString('fr-FR', { 
              weekday: 'long', 
              day: 'numeric', 
              month: 'long' 
            })}
          </Text>
          <View style={{ 
            backgroundColor: colors.primarySoft, 
            paddingHorizontal: spacing.md, 
            paddingVertical: spacing.xs, 
            borderRadius: radius.pill 
          }}>
            <Text style={{ color: colors.primary, fontWeight: '700', fontSize: 14 }}>
              {slotsForDate.length} créneau{slotsForDate.length > 1 ? 'x' : ''}
            </Text>
          </View>
        </View>

        {slotsForDate.length === 0 ? (
          <View style={{
            padding: spacing.xxl,
            backgroundColor: colors.card,
            borderRadius: radius.lg,
            alignItems: 'center',
            ...shadows.sm,
          }}>
            <Text style={{ fontSize: 48, marginBottom: spacing.md }}>📭</Text>
            <Text style={{ color: colors.text, fontWeight: '600', fontSize: 16, marginBottom: spacing.xs }}>
              Aucun créneau
            </Text>
            <Text style={{ color: colors.textMuted, marginBottom: spacing.lg, textAlign: 'center' }}>
              Créez votre premier créneau pour cette date
            </Text>
            <TouchableOpacity
              style={{
                backgroundColor: colors.primary,
                paddingHorizontal: spacing.xl,
                paddingVertical: spacing.md,
                borderRadius: radius.lg,
                ...shadows.md,
              }}
              onPress={() => setShowCreateModal(true)}
            >
              <Text style={{ color: 'white', fontWeight: '700', fontSize: 15 }}>➕ Créer un créneau</Text>
            </TouchableOpacity>
          </View>
        ) : (
          slotsForDate.map((slot) => {
            const terrain = terrains.find(t => t._id === slot.terrainId);
            const time = new Date(slot.startAt).toLocaleTimeString('fr-FR', { 
              hour: '2-digit', 
              minute: '2-digit',
              timeZone: 'Europe/Paris'
            });
            
            return (
              <View
                key={slot._id}
                style={{
                  backgroundColor: colors.card,
                  padding: spacing.lg,
                  borderRadius: radius.lg,
                  marginBottom: spacing.md,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  borderLeftWidth: 4,
                  borderLeftColor: slot.status === 'OPEN' ? colors.success : colors.warning,
                  ...shadows.md,
                }}
              >
                <View style={{ flex: 1 }}>
                  <Text style={{ color: colors.text, fontWeight: '700', fontSize: 17, marginBottom: spacing.xs }}>
                    🕐 {time}
                  </Text>
                  <Text style={{ color: colors.text, fontWeight: '600', fontSize: 15, marginBottom: spacing.xs }}>
                    {terrain?.name || 'Terrain inconnu'}
                  </Text>
                  <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xs }}>
                    <View style={{ backgroundColor: colors.primarySoft, paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: radius.sm }}>
                      <Text style={{ color: colors.primary, fontSize: 12, fontWeight: '600' }}>
                        {slot.durationMin}min
                      </Text>
                    </View>
                    <View style={{ backgroundColor: colors.primarySoft, paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: radius.sm }}>
                      <Text style={{ color: colors.primary, fontSize: 12, fontWeight: '600' }}>
                        {slot.capacity} places
                      </Text>
                    </View>
                    <View style={{ backgroundColor: slot.status === 'OPEN' ? colors.primarySoft : '#FEF3C7', paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: radius.sm }}>
                      <Text style={{ color: slot.status === 'OPEN' ? colors.success : colors.warning, fontSize: 12, fontWeight: '600' }}>
                        {slot.status}
                      </Text>
                    </View>
                  </View>
                  {terrain?.address && (
                    <Text style={{ color: colors.textMuted, fontSize: 12, marginTop: spacing.xs }}>
                      📍 {terrain.address}
                    </Text>
                  )}
                </View>
                
                <TouchableOpacity
                  style={{
                    backgroundColor: loading === 'delete-slot' ? colors.textMuted : colors.danger,
                    paddingHorizontal: spacing.md,
                    paddingVertical: spacing.md,
                    borderRadius: radius.md,
                    ...shadows.sm,
                  }}
                  onPress={() => deleteSlot(slot._id)}
                  disabled={loading === 'delete-slot'}
                >
                  <Text style={{ fontSize: 18 }}>
                    {loading === 'delete-slot' ? '⏳' : '🗑️'}
                  </Text>
                </TouchableOpacity>
              </View>
            );
          })
        )}
      </View>

      {/* Create Slot Modal */}
      <Modal visible={showCreateModal} animationType="slide" transparent>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: spacing.lg }}>
          <View style={{ backgroundColor: colors.card, borderRadius: radius.lg, padding: spacing.lg }}>
            <Text style={{ fontSize: 18, fontWeight: '600', color: colors.text, marginBottom: spacing.lg }}>
              Nouveau Créneau - {new Date(selectedDate + 'T00:00:00').toLocaleDateString('fr-FR')}
            </Text>

            <Text style={{ color: colors.text, marginBottom: spacing.xs }}>Terrain</Text>
            <View style={{ marginBottom: spacing.md }}>
              {terrains.map(terrain => (
                <TouchableOpacity
                  key={terrain._id}
                  style={{
                    padding: spacing.md,
                    backgroundColor: selectedTerrain === terrain._id ? colors.primary + '20' : colors.background,
                    borderRadius: radius.md,
                    marginBottom: spacing.xs,
                    borderWidth: selectedTerrain === terrain._id ? 2 : 1,
                    borderColor: selectedTerrain === terrain._id ? colors.primary : colors.border,
                  }}
                  onPress={() => setSelectedTerrain(terrain._id)}
                >
                  <Text style={{ color: colors.text, fontWeight: selectedTerrain === terrain._id ? '600' : '400' }}>
                    {terrain.name}
                  </Text>
                  {terrain.address && (
                    <Text style={{ color: colors.textMuted, fontSize: 12 }}>📍 {terrain.address}</Text>
                  )}
                </TouchableOpacity>
              ))}
            </View>

            <Text style={{ color: colors.text, marginBottom: spacing.xs }}>Heure</Text>
            <TextInput
              value={selectedTime}
              onChangeText={setSelectedTime}
              placeholder="18:00"
              style={{
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: radius.md,
                padding: spacing.md,
                marginBottom: spacing.lg,
                backgroundColor: colors.background,
                color: colors.text,
              }}
            />

            <View style={{ flexDirection: 'row', gap: spacing.sm }}>
              <TouchableOpacity
                style={{
                  flex: 1,
                  backgroundColor: colors.textMuted,
                  padding: spacing.md,
                  borderRadius: radius.md,
                  alignItems: 'center',
                }}
                onPress={() => setShowCreateModal(false)}
              >
                <Text style={{ color: 'white', fontWeight: '600' }}>Annuler</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={{
                  flex: 1,
                  backgroundColor: colors.primary,
                  padding: spacing.md,
                  borderRadius: radius.md,
                  alignItems: 'center',
                }}
                onPress={createSlot}
                disabled={loading === 'create-slot'}
              >
                <Text style={{ color: 'white', fontWeight: '600' }}>
                  {loading === 'create-slot' ? 'Création...' : 'Créer'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Create Terrain Modal */}
      <Modal visible={showTerrainModal} animationType="slide" transparent>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: spacing.lg }}>
          <View style={{ backgroundColor: colors.card, borderRadius: radius.lg, padding: spacing.lg }}>
            <Text style={{ fontSize: 18, fontWeight: '600', color: colors.text, marginBottom: spacing.lg }}>
              Nouveau Terrain
            </Text>

            <Text style={{ color: colors.text, marginBottom: spacing.xs }}>Nom du terrain</Text>
            <TextInput
              value={newTerrainName}
              onChangeText={setNewTerrainName}
              placeholder="City Park"
              style={{
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: radius.md,
                padding: spacing.md,
                marginBottom: spacing.md,
                backgroundColor: colors.background,
                color: colors.text,
              }}
            />

            <Text style={{ color: colors.text, marginBottom: spacing.xs }}>Adresse (optionnelle)</Text>
            <TextInput
              value={newTerrainAddress}
              onChangeText={setNewTerrainAddress}
              placeholder="Rue du Stade, 75000 Paris"
              style={{
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: radius.md,
                padding: spacing.md,
                marginBottom: spacing.lg,
                backgroundColor: colors.background,
                color: colors.text,
              }}
            />

            <View style={{ flexDirection: 'row', gap: spacing.sm }}>
              <TouchableOpacity
                style={{
                  flex: 1,
                  backgroundColor: colors.textMuted,
                  padding: spacing.md,
                  borderRadius: radius.md,
                  alignItems: 'center',
                }}
                onPress={() => setShowTerrainModal(false)}
              >
                <Text style={{ color: 'white', fontWeight: '600' }}>Annuler</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={{
                  flex: 1,
                  backgroundColor: colors.primary,
                  padding: spacing.md,
                  borderRadius: radius.md,
                  alignItems: 'center',
                }}
                onPress={createTerrain}
                disabled={loading === 'create-terrain'}
              >
                <Text style={{ color: 'white', fontWeight: '600' }}>
                  {loading === 'create-terrain' ? 'Création...' : 'Créer'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Templates Modal */}
      <Modal visible={showTemplateModal} animationType="slide" transparent>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: spacing.lg }}>
          <View style={{ backgroundColor: colors.card, borderRadius: radius.lg, padding: spacing.lg }}>
            <Text style={{ fontSize: 18, fontWeight: '600', color: colors.text, marginBottom: spacing.lg }}>
              Templates de Créneaux
            </Text>

            <Text style={{ color: colors.text, marginBottom: spacing.xs }}>Terrain pour le template</Text>
            <View style={{ marginBottom: spacing.lg }}>
              {terrains.map(terrain => (
                <TouchableOpacity
                  key={terrain._id}
                  style={{
                    padding: spacing.md,
                    backgroundColor: selectedTerrain === terrain._id ? colors.primary + '20' : colors.background,
                    borderRadius: radius.md,
                    marginBottom: spacing.xs,
                    borderWidth: selectedTerrain === terrain._id ? 2 : 1,
                    borderColor: selectedTerrain === terrain._id ? colors.primary : colors.border,
                  }}
                  onPress={() => setSelectedTerrain(terrain._id)}
                >
                  <Text style={{ color: colors.text, fontWeight: selectedTerrain === terrain._id ? '600' : '400' }}>
                    {terrain.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              style={{
                backgroundColor: colors.success,
                padding: spacing.lg,
                borderRadius: radius.md,
                alignItems: 'center',
                marginBottom: spacing.md,
              }}
              onPress={createWeekTemplate}
              disabled={loading === 'template'}
            >
              <Text style={{ color: 'white', fontWeight: '600', fontSize: 16 }}>
                📅 Semaine Type (Lun-Ven 18h-20h)
              </Text>
              <Text style={{ color: 'white', fontSize: 12, marginTop: spacing.xs }}>
                Crée 5 créneaux de 2h à partir du {new Date(selectedDate + 'T00:00:00').toLocaleDateString('fr-FR')}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={{
                backgroundColor: colors.textMuted,
                padding: spacing.md,
                borderRadius: radius.md,
                alignItems: 'center',
              }}
              onPress={() => setShowTemplateModal(false)}
            >
              <Text style={{ color: 'white', fontWeight: '600' }}>Fermer</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}
