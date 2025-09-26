import { Platform } from 'react-native';

// URL de base de l'API SpotFoot
// - Émulateur Android : utiliser 10.0.2.2 pour joindre la machine hôte
// - Simulateur iOS : localhost fonctionne
// - Web : localhost fonctionne
export const BASE_URL = Platform.select({
  android: 'http://10.0.2.2:3001',
  default: 'http://localhost:3001',
});
