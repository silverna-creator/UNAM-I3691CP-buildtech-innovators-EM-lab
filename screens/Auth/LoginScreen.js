import React from 'react';
import { View, Text, TextInput, TouchableOpacity, SafeAreaView } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { styles } from '../../src/styles/globalStyles';
import Logo from '../../src/styles/Logo';  

const LoginScreen = ({ 
  email, setEmail, 
  password, setPassword, 
  handleLogin, handleForgotPassword, setScreen 
}) => {
  return (
    <SafeAreaProvider>
      <View style={{ flex: 1, backgroundColor: '#1A1A2E' }}>
        <SafeAreaView style={styles.container}>

          < Logo />

          <Text style={styles.title}>EM-Lab</Text>
          <Text style={styles.subtitle}>Electronics & Metallurgy Lab</Text>

          <TextInput 
            style={styles.input} 
            placeholder="Email" 
            value={email} 
            onChangeText={setEmail} 
            autoCapitalize="none" 
            placeholderTextColor="#888" 
            keyboardType="email-address"
          />
          
          <TextInput 
            style={styles.input} 
            placeholder="Password" 
            value={password} 
            onChangeText={setPassword} 
            secureTextEntry={true} 
            placeholderTextColor="#888" 
          />
          
          <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
            <Text style={styles.loginButtonText}>Login</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={handleForgotPassword} style={{ marginTop: 15 }}>
            <Text style={[styles.switchText, { textDecorationLine: 'underline' }]}>Forgot Password?</Text>
          </TouchableOpacity>

          <View style={{ marginTop: 20 }}>
            <Text style={styles.switchText}>Staff: Contact your Manager for access.</Text>
            <TouchableOpacity onPress={() => setScreen('signup')}>
              <Text style={[styles.switchText, { marginTop: 10 }]}>
                Are you a Lab Manager? <Text style={styles.signUpText}>Register your Company</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>
    </SafeAreaProvider>
  );
};

export default LoginScreen;