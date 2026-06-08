// screens/Auth/ProfileScreen.js

import React from 'react';
import { View, Text } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { styles } from '../../src/styles/globalStyles';
import HoverButton, { HoverInput } from '../../src/styles/HoverButton';

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

              
              <HoverInput
                placeholder="Current Password"
                value={currentPassword}
                onChangeText={setCurrentPassword}
                secureTextEntry={true}
                placeholderTextColor="#888"
              />

              <HoverInput
                placeholder="New Password"
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry={true}
                placeholderTextColor="#888"
              />

              <HoverInput
                placeholder="Confirm New Password"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={true}
                placeholderTextColor="#888"
              />

              
              <HoverButton
                type="login"
                onPress={() => handleInternalPasswordChange(currentPassword, newPassword)}
                label="Save New Password"
              />

              <HoverButton
                type="cancel"
                onPress={() => setIsChangingPassword(false)}
                label="Cancel"
              />

            </View>
          ) : (
            <HoverButton
              type="role"
              onPress={() => setIsChangingPassword(true)}
              label="Change Password"
              customStyle={{ backgroundColor: '#3498db', marginTop: 10 }}
            />
          )}

          <HoverButton
            type="button"
            onPress={onBack}
            label="Back to Dashboard"
          />

        </SafeAreaView>
      </View>
    </SafeAreaProvider>
  );
};

export default ProfileScreen;