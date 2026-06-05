import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, SafeAreaView } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { styles } from '../../src/styles/globalStyles'; // Import your shared styles

const FurnaceDirectoryScreen = ({ furnaceLogs, maxFurnaceTemp, onBack }) => {
  return (
    <SafeAreaProvider>
      <View style={styles.container}>
        <SafeAreaView style={{ flex: 1 }}>
          <Text style={styles.title}>Furnace Logs</Text>
          <Text style={styles.subtitle}>Historical Thermal Melt Run Registry</Text>

          <ScrollView style={{ flex: 1, width: '100%', marginBottom: 15 }} showsVerticalScrollIndicator={false}>
            {furnaceLogs.length === 0 ? (
              <Text style={{ color: '#fff', textAlign: 'center', marginTop: 20 }}>No furnace cycles registered yet.</Text>
            ) : (
              furnaceLogs.map((item) => {
                const safetyThreshold = maxFurnaceTemp ? parseFloat(maxFurnaceTemp) : null;
                const isOverheated = safetyThreshold !== null ? item.temperature > safetyThreshold : false;

                return (
                  <View 
                    key={item.id} 
                    style={[
                      styles.roleBox, 
                      { 
                        marginTop: 0, 
                        marginBottom: 10, 
                        padding: 15,
                        borderLeftWidth: 4,
                        borderLeftColor: safetyThreshold === null ? '#f1c40f' : (isOverheated ? '#c0392b' : '#27ae60') 
                      }
                    ]}
                  >
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                      <Text style={{ color: '#fff', fontSize: 16, fontWeight: 'bold' }}>
                        Batch: {item.sampleId || item.meltId || "Unknown Batch"}
                      </Text>
                      <Text style={{ color: safetyThreshold === null ? '#f1c40f' : (isOverheated ? '#c0392b' : '#27ae60'), fontSize: 13, fontWeight: 'bold' }}>
                        {safetyThreshold === null ? "⚠️ PROFILE UNSET" : (isOverheated ? "💥 OVERHEAT" : "✅ OPERATIONAL")}
                      </Text>
                    </View>
                    
                    <Text style={{ color: '#fff', fontSize: 14, marginTop: 6, fontWeight: '500' }}>
                      🌡️ Temp: {item.temperature}°C {safetyThreshold && <Text style={{ fontSize: 11, color: '#888' }}>(Max: {safetyThreshold}°C)</Text>}
                    </Text>
                    <Text style={{ color: '#c8d4e6', fontSize: 13, marginTop: 2 }}>
                      ⏱️ Cycle Duration: {item.durationMinutes || item.cycleDurationTime} mins
                    </Text>
                   
                   <View style={{ backgroundColor: '#1a1d24', padding: 8, borderRadius: 6, marginTop: 8, marginBottom: 4 }}>
                      <Text style={{ color: '#c8d4e6', fontSize: 12 }}>
                        📦 Ore Matrix: {item.oreType || 'N/A'} | ⚖️ Intake Mass: {item.initialWeight || 0} kg
                      </Text>
                      <Text style={{ color: '#c8d4e6', fontSize: 12, marginTop: 4 }}>
                        💧 Moisture: {item.moistureTestResult != null ? `${item.moistureTestResult}%` : 'Not tested'} | 🧪 Flotation: {item.flotationPrepResult != null ? `${item.flotationPrepResult} g/cm³` : 'Not tested'}
                      </Text>
                      
                    </View>
                  </View>
                );
              })
            )}
          </ScrollView>

          <TouchableOpacity style={styles.button} onPress={onBack}>
            <Text style={styles.buttonText}>Back to Dashboard</Text>
          </TouchableOpacity>
        </SafeAreaView>
      </View>
    </SafeAreaProvider>
  );
};

export default FurnaceDirectoryScreen;