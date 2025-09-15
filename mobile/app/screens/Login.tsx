import React from 'react';
import { View, Text, Button } from 'react-native';

export default function Login() {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ fontSize: 24, marginBottom: 12 }}>SpotFoot</Text>
      <Text style={{ marginBottom: 24 }}>MVP: pas d'auth réelle</Text>
      <Button title="Continuer" onPress={() => { /* navigate to slots list */ }} />
    </View>
  );
}
