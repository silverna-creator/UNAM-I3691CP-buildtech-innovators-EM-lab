// src/styles/HoverButton.js

import React, { useState } from 'react';
import { TouchableOpacity, Text } from 'react-native';
import { styles } from './globalStyles';

const HoverButton = ({ type = 'button', onPress, label, customStyle, customTextStyle }) => {
  const [isHovered, setIsHovered] = useState(false);

  // Map button type to its style and hover color
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

export default HoverButton;