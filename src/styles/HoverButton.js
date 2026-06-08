// src/styles/HoverButton.js

import React, { useState } from 'react';
import { TouchableOpacity, Text, TextInput } from 'react-native';
import { styles } from './globalStyles';

// HOVER BUTTON
export const HoverButton = ({ type = 'button', onPress, label, customStyle, customTextStyle }) => {
  const [isHovered, setIsHovered] = useState(false);

  const buttonConfig = {
    login: {
      style: styles.loginButton,
      textStyle: styles.loginButtonText,
      hoverColor: '#003580',
    },
    button: {
      style: styles.button,
      textStyle: styles.buttonText,
      hoverColor: '#003580',
    },
    role: {
      style: styles.roleButton,
      textStyle: styles.buttonText,
      hoverColor: '#2c3e50',
    },
    cancel: {
      style: styles.cancelButton,
      textStyle: styles.cancelButtonText,
      hoverColor: '#1A1A3A',
    },
    labAction: {
      style: styles.roleButton,
      textStyle: styles.buttonText,
      hoverColor: '#1a252f',
    },
    labSecondary: {
      style: [styles.roleButton, { backgroundColor: '#2e4053', marginTop: 10 }],
      textStyle: styles.buttonText,
      hoverColor: '#1a2b38',
    },
    profile: {
      style: styles.roleButton,
      textStyle: styles.buttonText,
      hoverColor: '#2c3e50',
    },
    logout: {
      style: [styles.roleButton, { backgroundColor: '#c0392b', marginTop: 10 }],
      textStyle: styles.buttonText,
      hoverColor: '#922b21',
    },
    settings: {
      style: [styles.roleButton, { backgroundColor: '#e67e22', marginTop: 10 }],
      textStyle: styles.buttonText,
      hoverColor: '#ca6f1e',
    },
  };

  const config = buttonConfig[type] || buttonConfig['button'];

  return (
    <TouchableOpacity
      style={[
        config.style,
        customStyle,
        isHovered && { 
          backgroundColor: config.hoverColor, 
          opacity: 0.9,
          transform: [{ scale: 1.02 }]
        }
      ]}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onPress={onPress}
    >
      <Text style={[config.textStyle, customTextStyle]}>{label}</Text>
    </TouchableOpacity>
  );
};

// HOVER INPUT
export const HoverInput = ({ 
  placeholder, 
  value, 
  onChangeText, 
  secureTextEntry = false, 
  keyboardType = 'default',
  autoCapitalize = 'none',
  placeholderTextColor = '#888',
  customStyle,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  return (
    <TextInput
      style={[
        styles.input,
        customStyle,
        isHovered && !isFocused && { 
          borderColor: '#3498db', 
          borderWidth: 2.5,
          backgroundColor: '#f0f4ff',
        },
        isFocused && { 
          borderColor: '#00BFFF', 
          borderWidth: 3,
          backgroundColor: '#ffffff',
        }
      ]}
      placeholder={placeholder}
      value={value}
      onChangeText={onChangeText}
      secureTextEntry={secureTextEntry}
      keyboardType={keyboardType}
      autoCapitalize={autoCapitalize}
      placeholderTextColor={placeholderTextColor}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onFocus={() => setIsFocused(true)}
      onBlur={() => setIsFocused(false)}
    />
  );
};

export default HoverButton;