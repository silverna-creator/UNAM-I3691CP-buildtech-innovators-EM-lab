//src/globaltyless//globalStyle.jss

import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  // Main Layouts
  container: { flex: 1, backgroundColor: '#1A1A2E', justifyContent: 'center', padding: 20 },
  scrollContainer: { flexGrow: 1, paddingVertical: 40, justifyContent: 'center' },
  
  // Typography
  title: { fontSize: 42, fontWeight: 'bold', textAlign: 'center', color: '#ffffff', marginBottom: 10 },
  subtitle: { fontSize: 16, textAlign: 'center', color: '#c8d4e6', marginBottom: 40 },
  buttonText: { color: '#ffffff', fontSize: 16, fontWeight: '600' },
  loginButtonText: { color: '#ffffff', fontSize: 18, fontWeight: 'bold' },
  
  // Inputs
  input: { backgroundColor: '#ffffff', borderRadius: 12, padding: 15, marginBottom: 15, fontSize: 16, color: '#000' },
  
  // Buttons
  loginButton: { backgroundColor: '#0047AB', borderRadius: 12, padding: 15, alignItems: 'center', marginTop: 10 },
  button: { backgroundColor: '#2c5f8a', borderRadius: 12, padding: 15, alignItems: 'center', marginTop: 20 },
  
  // Role/Dashboard Elements
  roleBox: { backgroundColor: '#2c3e50', padding: 20, borderRadius: 15, marginVertical: 20, borderWidth: 1, borderColor: '#3498db' },
  roleTitle: { color: '#3498db', fontSize: 20, fontWeight: 'bold', marginBottom: 15, textAlign: 'center' },
  roleButton: { backgroundColor: '#34495e', padding: 12, borderRadius: 8, marginVertical: 5, alignItems: 'center' },
  
  // Utils
  switchText: { color: '#c8d4e6', textAlign: 'center', marginTop: 20 },
  signUpText: { color: '#3498db', fontWeight: 'bold' },

  // Add these to globalStyles.js
label: { color: '#c8d4e6', marginBottom: 5, fontSize: 13, marginLeft: '5%' },
picker: { backgroundColor: '#232931', color: '#fff', marginBottom: 15 },
});