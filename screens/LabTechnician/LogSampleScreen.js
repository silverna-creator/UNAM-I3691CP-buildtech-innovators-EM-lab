import React from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, SafeAreaView, StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Picker } from '@react-native-picker/picker';
import { styles } from '../../src/styles/globalStyles';
import { ORE_DATABASE } from '../../src/utils/constants';

const LogSampleScreen = ({ 
  sampleId, setSampleId, 
  initialWeight, setInitialWeight, 
  selectedGroup, setSelectedGroup, 
  selectedOre, setSelectedOre, 
  moistureValue, setMoistureValue, 
  flotationValue, setFlotationValue,
    sampleSource, setSampleSource,
  receivedAt, setReceivedAt,
  onLogSample, onBack 
}) => {

  return (
    <SafeAreaProvider>
      <View style={{ flex: 1, backgroundColor: '#1A1A2E' }}>
        <SafeAreaView style={styles.container}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
            <ScrollView contentContainerStyle={styles.scrollContainer}>
              <Text style={styles.title}>EM-Lab</Text>
              <Text style={styles.subtitle}>Log New Mineral Sample</Text>

              <TextInput style={styles.input} placeholder="Sample ID / Batch Code" value={sampleId} onChangeText={setSampleId} placeholderTextColor="#888" />
              <TextInput style={styles.input} placeholder="Initial Weight (kg)" value={initialWeight} onChangeText={setInitialWeight} keyboardType="numeric" placeholderTextColor="#888" />

              <Text style={styles.label}>Select Ore Group:</Text>
              <Picker
                selectedValue={selectedGroup}
                onValueChange={(itemValue) => {
                  setSelectedGroup(itemValue);
                  setSelectedOre(ORE_DATABASE[itemValue][0]);
                }}
                style={styles.picker}
              >
                {Object.keys(ORE_DATABASE).map((group) => (
                  <Picker.Item key={group} label={group} value={group} />
                ))}
              </Picker>

              <Text style={styles.label}>Select Specific Ore:</Text>
              <Picker
                selectedValue={selectedOre}
                onValueChange={(itemValue) => setSelectedOre(itemValue)}
                style={styles.picker}
              >
                {ORE_DATABASE[selectedGroup].map((ore, index) => (
                  <Picker.Item key={index} label={ore} value={ore} />
                ))}
              </Picker>

              <Text style={styles.label}>Moisture Content Test (%):</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. 4.5"
                value={moistureValue}
                onChangeText={setMoistureValue}
                keyboardType="numeric"
                placeholderTextColor="#888"
              />

              <Text style={styles.label}>Flotation Prep Result (g/cm³):</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. 2.85"
                value={flotationValue}
                onChangeText={setFlotationValue}
                keyboardType="numeric"
                placeholderTextColor="#888"
              />

               <Text style={styles.label}>Sample Source (Where received from):</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Mine Site A, Supplier XYZ"
                value={sampleSource}
                onChangeText={setSampleSource}
                placeholderTextColor="#888"
              />

              <Text style={styles.label}>Date Received:</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. 07 June 2026"
                value={receivedAt}
                onChangeText={setReceivedAt}
                placeholderTextColor="#888"
              />

              <Text style={{ color: '#888', fontSize: 12, marginBottom: 12, textAlign: 'center' }}>
                * At least one test result is required to commit.
              </Text>


              <TouchableOpacity style={styles.loginButton} onPress={onLogSample}>
                <Text style={styles.loginButtonText}>Commit Sample</Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={onBack}>
                <Text style={styles.switchText}>Back to Dashboard</Text>
              </TouchableOpacity>
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </View>
    </SafeAreaProvider>
  );
};

export default LogSampleScreen;