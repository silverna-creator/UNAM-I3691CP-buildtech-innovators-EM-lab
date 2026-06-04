import React from 'react';
import { View, Text, TouchableOpacity, SafeAreaView, TextInput } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { styles } from '../../styles/globalStyles';

const ProfileScreen = ({ 
  fullName, role, companyName, 
  isChangingPassword, setIsChangingPassword,
  currentPassword, setCurrentPassword,
  newPassword, setNewPassword,
  confirmPassword, setConfirmPassword,
  handleInternalPasswordChange, 
  onBack 
}) => {
  return (
    <SafeAreaProvider>
      <View style={{ flex: 1, backgroundColor: '#1A1A2E' }}>
        <SafeAreaView style={styles.container}>
          <Text style={styles.title}>Profile</Text>
          
          <View style={styles.roleBox}>
            <Text style={styles.buttonText}>Name: {fullName}</Text>
            <Text style={styles.buttonText}>Role: {role}</Text>
            <Text style={styles.buttonText}>Company: {companyName}</Text>
          </View>

          {isChangingPassword ? (
            <View style={styles.roleBox}>
              <TextInput style={styles.input} placeholder="Current Password" secureTextEntry value={currentPassword} onChangeText={setCurrentPassword} />
              <TextInput style={styles.input} placeholder="New Password" secureTextEntry value={newPassword} onChangeText={setNewPassword} />
              <TextInput style={styles.input} placeholder="Confirm New Password" secureTextEntry value={confirmPassword} onChangeText={setConfirmPassword} />
              <TouchableOpacity style={styles.loginButton} onPress={() => handleInternalPasswordChange(currentPassword, newPassword)}>
                <Text style={styles.loginButtonText}>Save New Password</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setIsChangingPassword(false)}>
                <Text style={[styles.switchText, { textDecorationLine: 'none', color: '#e74c3c' }]}>Cancel</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity style={[styles.roleButton, {backgroundColor: '#3498db', marginTop: 10}]} onPress={() => setIsChangingPassword(true)}>
              <Text style={styles.buttonText}>Change Password</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity style={styles.button} onPress={onBack}>
            <Text style={styles.buttonText}>Back to Dashboard</Text>
          </TouchableOpacity>
        </SafeAreaView>
      </View>
    </SafeAreaProvider>
  );
};

export default ProfileScreen;