import React from 'react';
import { View, Text, Alert, TextInput, TouchableOpacity, ActivityIndicator, ScrollView } from 'react-native';
import { BASE_URL } from '../config';
import { useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { RootStackParamList } from '../navigation/types';
import { colors, spacing, radius, shadows } from '../theme';
import PrimaryButton from '../components/PrimaryButton';
import { useNavigation } from '@react-navigation/native';
import { useUser } from '../state/UserContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { databaseService } from '../services/database';
import { syncService } from '../services/syncService';

type SlotData = {
  _id: string;
  terrainId: string;
  startAt: string;
  durationMin: number;
  capacity: number;
  status: string;
};

export default function SlotDetail() {
  const route = useRoute<RouteProp<RootStackParamList, 'SlotDetail'>>();
  const slotId = route.params?.slotId;
  const { user } = useUser();
  const navigation = useNavigation<any>();
  
  const [email, setEmail] = React.useState(user.email ?? '');
  const [slot, setSlot] = React.useState<SlotData | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [reserving, setReserving] = React.useState(false);
  const [offlineMode, setOfflineMode] = React.useState(false);

  // Charger les données du créneau
  React.useEffect(() => {
    const loadSlot = async () => {
      if (!slotId) return;
      try {
        const r = await fetch(`${BASE_URL}/slots/${slotId}`);
        if (r.ok) {
          const data = await r.json();
          setSlot(data);
        }
      } catch (e) {
        console.error('Error loading slot:', e);
      } finally {
        setLoading(false);
      }
    };
    loadSlot();
  }, [slotId]);
  React.useEffect(() => {
    if (user.email) setEmail(user.email);
  }, [user.email]);

  // Synchronisation automatique au retour en ligne
  React.useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      if (state.isConnected && offlineMode) {
        console.log('🌐 Connexion rétablie, tentative de synchronisation...');
        syncPendingReservations();
      }
    });
    return () => unsubscribe();
  }, [offlineMode]);

  // Fonction pour synchroniser les réservations en attente
  const syncPendingReservations = async () => {
    try {
      const pendingRaw = await AsyncStorage.getItem('pending_reservations');
      if (!pendingRaw) return;
      
      const pending = JSON.parse(pendingRaw);
      if (pending.length === 0) return;

      console.log('📤 Synchronisation de', pending.length, 'réservation(s) en attente...');
      
      // Vérifier si ces créneaux ne sont pas déjà réservés
      const existingRaw = await AsyncStorage.getItem('reservations');
      const existingReservations = existingRaw ? JSON.parse(existingRaw) : [];
      const existingSlotIds = new Set(existingReservations.map((r: any) => r.slotId));
      
      // Filtrer les réservations en attente qui ne sont pas déjà confirmées
      const toSync = pending.filter((p: any) => !existingSlotIds.has(p.slotId));
      
      if (toSync.length === 0) {
        console.log('✅ Toutes les réservations en attente sont déjà confirmées');
        await AsyncStorage.removeItem('pending_reservations');
        setOfflineMode(false);
        return;
      }
      
      console.log('📤 Réservations à synchroniser:', toSync.length);
      
      const results = {
        success: [] as any[],
        failed: [] as any[],
      };
      
      // Essayer de synchroniser chaque réservation
      for (const reservation of toSync) {
        try {
          const response = await fetch(`${BASE_URL}/reservations`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              slotId: reservation.slotId, 
              organizerEmail: reservation.email 
            }),
          });
          
          if (response.ok) {
            const data = await response.json();
            console.log('✅ Réservation synchronisée:', reservation.slotId);
            
            // Sauvegarder dans AsyncStorage
            const m = String(data.inviteUrl).match(/\/i\/(.+)$/) || String(data.inviteUrl).match(/invitations\/(.+)$/) || String(data.inviteUrl).match(/invite\/(.+)$/);
            const token = m?.[1];
            
            const existingRaw = await AsyncStorage.getItem('reservations');
            const existing = existingRaw ? JSON.parse(existingRaw) : [];
            existing.unshift({ 
              slotId: reservation.slotId, 
              inviteUrl: data.inviteUrl, 
              token, 
              createdAt: Date.now() 
            });
            await AsyncStorage.setItem('reservations', JSON.stringify(existing));
            
            results.success.push(reservation);
          } else {
            // Erreur HTTP (404, 409, etc.)
            const errorText = await response.text();
            console.error('❌ Échec sync réservation:', response.status, errorText);
            
            let errorMessage = 'Erreur inconnue';
            if (response.status === 404) {
              errorMessage = 'Créneau introuvable (supprimé)';
            } else if (response.status === 409 || errorText.includes('not open')) {
              errorMessage = 'Créneau complet ou déjà réservé';
            } else {
              errorMessage = errorText || `Erreur ${response.status}`;
            }
            
            results.failed.push({ ...reservation, error: errorMessage });
          }
        } catch (err: any) {
          console.error('❌ Erreur réseau sync réservation:', err);
          results.failed.push({ ...reservation, error: 'Erreur réseau' });
        }
      }
      
      // Vider la liste des réservations en attente
      await AsyncStorage.removeItem('pending_reservations');
      setOfflineMode(false);
      
      // Afficher le résultat SEULEMENT si au moins une réservation a réussi
      if (results.success.length > 0) {
        window.alert(`✅ Synchronisation terminée !\n\n${results.success.length} réservation(s) envoyée(s) au serveur.`);
        
        // Rediriger vers Réservations
        setTimeout(() => {
          try { 
            navigation.getParent()?.navigate('Réservations'); 
          } catch {
            navigation.navigate('Réservations');
          }
        }, 500);
      }
      // Si tout a échoué, on ne fait rien (pas de message d'erreur)
      
    } catch (error) {
      console.error('❌ Erreur synchronisation:', error);
      window.alert('❌ Erreur lors de la synchronisation\n\nVeuillez réessayer plus tard.');
    }
  };

  const reserve = async () => {
    if (!slotId) return window.alert('❌ Erreur: slotId manquant');
    if (!email.trim()) {
      window.alert('Veuillez saisir votre email');
      return;
    }
    setReserving(true);
    console.log('🔄 Début réservation:', { slotId, email });
    
    try {
      console.log('📞 Appel API direct...');
      const r = await fetch(`${BASE_URL}/reservations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slotId, organizerEmail: email }),
      });
      
      if (r.ok) {
        const data = await r.json();
        console.log('✅ Réponse API:', data);
        
        // Sauvegarder dans AsyncStorage
        try {
          await databaseService.init();
          const m = String(data.inviteUrl).match(/\/i\/(.+)$/) || String(data.inviteUrl).match(/invitations\/(.+)$/) || String(data.inviteUrl).match(/invite\/(.+)$/);
          const token = m?.[1];
          
          const reservationId = await databaseService.addReservation({
            slotId,
            inviteUrl: data.inviteUrl,
            token,
            createdAt: Date.now(),
            syncStatus: 'synced',
          });
          console.log('✅ Réservation sauvegardée dans AsyncStorage avec ID:', reservationId);
        } catch (e) {
          console.error('❌ Erreur sauvegarde AsyncStorage:', e);
        }
        
        window.alert('✅ Réservation confirmée !');
        
        setTimeout(() => {
          try { 
            navigation.getParent()?.navigate('Réservations'); 
          } catch {
            navigation.navigate('Réservations');
          }
        }, 500);
      } else {
        const msg = await r.text();
        throw new Error(msg || 'Réservation impossible');
      }
      
    } catch (e: any) {
      console.error('❌ Erreur réservation:', e);
      
      // Détecter si c'est une erreur réseau (mode hors ligne)
      const isOffline = e?.message?.includes('Failed to fetch') || 
                        e?.message?.includes('Network request failed') ||
                        e?.message?.includes('ERR_INTERNET_DISCONNECTED');
      
      if (isOffline) {
        // Mode hors ligne : sauvegarder localement
        console.log('═══════════════════════════════════════');
        console.log('📴 MODE HORS CONNEXION DÉTECTÉ');
        console.log('🔌 Pas de connexion internet disponible');
        console.log('💾 Sauvegarde locale en cours...');
        try {
          const pendingReservation = {
            slotId,
            email,
            createdAt: Date.now(),
            status: 'pending',
          };
          
          console.log('📝 Création réservation en attente:', pendingReservation);
          
          const pendingRaw = await AsyncStorage.getItem('pending_reservations');
          const pending = pendingRaw ? JSON.parse(pendingRaw) : [];
          pending.push(pendingReservation);
          
          console.log('💾 Écriture dans AsyncStorage (clé: "pending_reservations")');
          await AsyncStorage.setItem('pending_reservations', JSON.stringify(pending));
          
          console.log('✅ Réservation sauvegardée en BDD locale (mode hors ligne)');
          console.log('📊 Total réservations en attente:', pending.length);
          console.log('⚡ Synchronisation automatique dès reconnexion');
          console.log('═══════════════════════════════════════');
          
          setOfflineMode(true);
          window.alert('📴 Mode hors ligne détecté\n\n✅ Votre réservation a été sauvegardée localement dans AsyncStorage.\n\nElle sera automatiquement envoyée au serveur dès que vous serez de nouveau en ligne.\n\n⚠️ Reconnectez-vous à internet puis cliquez sur "Réessayer".');
        } catch (saveError) {
          console.error('❌ Erreur sauvegarde hors ligne:', saveError);
          window.alert('❌ Impossible de sauvegarder la réservation hors ligne');
        }
      } else {
        // Autre erreur
        window.alert('❌ Erreur: ' + (e?.message || 'Impossible de contacter le serveur'));
      }
      
    } finally {
      console.log('🏁 Fin réservation, setReserving(false)');
      setReserving(false);
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ color: colors.textMuted, marginTop: spacing.md }}>Chargement...</Text>
      </View>
    );
  }

  if (!slot) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, padding: spacing.xl, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ fontSize: 48, marginBottom: spacing.md }}>❌</Text>
        <Text style={{ color: colors.text, fontWeight: '600', fontSize: 16 }}>Créneau introuvable</Text>
      </View>
    );
  }

  const dateObj = new Date(slot.startAt);
  const dateStr = dateObj.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const timeStr = dateObj.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Paris' });

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Header */}
      <View style={{ 
        backgroundColor: colors.primary, 
        paddingTop: spacing.xl,
        paddingBottom: spacing.xl,
        paddingHorizontal: spacing.xl,
        borderBottomLeftRadius: radius.xl,
        borderBottomRightRadius: radius.xl,
        ...shadows.lg,
      }}>
        <Text style={{ fontSize: 28, fontWeight: '800', color: 'white', marginBottom: spacing.xs }}>
          ⚽ Réserver un créneau
        </Text>
        <Text style={{ fontSize: 15, color: 'rgba(255,255,255,0.9)' }}>
          Confirmez votre réservation
        </Text>
      </View>

      <View style={{ padding: spacing.xl }}>
        {/* Carte du créneau */}
        <View
          style={{
            backgroundColor: colors.card,
            borderRadius: radius.xl,
            padding: spacing.xl,
            marginBottom: spacing.lg,
            borderLeftWidth: 4,
            borderLeftColor: colors.success,
            ...shadows.md,
          }}
        >
          <Text style={{ fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: spacing.lg }}>
            📅 Détails du créneau
          </Text>

          <View style={{ marginBottom: spacing.md }}>
            <Text style={{ color: colors.textMuted, fontSize: 12, fontWeight: '600', marginBottom: spacing.xs }}>
              Date
            </Text>
            <Text style={{ color: colors.text, fontWeight: '600', fontSize: 16 }}>
              {dateStr}
            </Text>
          </View>

          <View style={{ marginBottom: spacing.md }}>
            <Text style={{ color: colors.textMuted, fontSize: 12, fontWeight: '600', marginBottom: spacing.xs }}>
              Heure
            </Text>
            <Text style={{ color: colors.text, fontWeight: '700', fontSize: 20 }}>
              🕐 {timeStr}
            </Text>
          </View>

          <View style={{ flexDirection: 'row', gap: spacing.md }}>
            <View style={{ flex: 1, backgroundColor: colors.primarySoft, padding: spacing.md, borderRadius: radius.md }}>
              <Text style={{ color: colors.textMuted, fontSize: 11, fontWeight: '600', marginBottom: spacing.xs }}>
                Durée
              </Text>
              <Text style={{ color: colors.primary, fontWeight: '700', fontSize: 15 }}>
                {slot.durationMin} min
              </Text>
            </View>
            <View style={{ flex: 1, backgroundColor: colors.primarySoft, padding: spacing.md, borderRadius: radius.md }}>
              <Text style={{ color: colors.textMuted, fontSize: 11, fontWeight: '600', marginBottom: spacing.xs }}>
                Capacité
              </Text>
              <Text style={{ color: colors.primary, fontWeight: '700', fontSize: 15 }}>
                {slot.capacity} places
              </Text>
            </View>
            <View style={{ flex: 1, backgroundColor: colors.primarySoft, padding: spacing.md, borderRadius: radius.md }}>
              <Text style={{ color: colors.textMuted, fontSize: 11, fontWeight: '600', marginBottom: spacing.xs }}>
                Statut
              </Text>
              <Text style={{ color: colors.success, fontWeight: '700', fontSize: 15 }}>
                {slot.status}
              </Text>
            </View>
          </View>
        </View>

        {/* Formulaire email */}
        <View
          style={{
            backgroundColor: colors.card,
            borderRadius: radius.xl,
            padding: spacing.xl,
            marginBottom: spacing.lg,
            ...shadows.md,
          }}
        >
          <Text style={{ fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: spacing.md }}>
            📧 Votre email
          </Text>
          <Text style={{ color: colors.textMuted, fontSize: 14, marginBottom: spacing.md, lineHeight: 20 }}>
            Entrez votre adresse email pour recevoir le lien d'invitation
          </Text>
          <TextInput
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            placeholder="votre@email.com"
            style={{
              borderWidth: 2,
              borderRadius: radius.lg,
              padding: spacing.md,
              borderColor: colors.border,
              backgroundColor: colors.background,
              fontSize: 15,
              fontWeight: '600',
            }}
          />
        </View>

        {/* Bouton de confirmation */}
        <TouchableOpacity
          style={{
            backgroundColor: reserving ? colors.textMuted : offlineMode ? colors.warning : colors.primary,
            padding: spacing.lg,
            borderRadius: radius.xl,
            alignItems: 'center',
            ...shadows.md,
          }}
          onPress={reserve}
          disabled={reserving}
        >
          <Text style={{ color: 'white', fontWeight: '700', fontSize: 16 }}>
            {reserving ? '⏳ Réservation en cours...' : offlineMode ? '🔄 Réessayer (reconnectez-vous)' : '✅ Confirmer la réservation'}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
