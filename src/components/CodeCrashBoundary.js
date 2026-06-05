//src/components/CodeCrashBoundary.js

// src/components/CodeCrashBoundary.js
import React from 'react';
import { View, Text } from 'react-native';

class CodeCrashBoundary extends React.Component {
  state = { hasError: false, errorInfo: '' };

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.log("%c 💥 CRASH ENCOUNTERED: ", "background: red; color: white; font-size: 14px;");
    console.error(error, errorInfo);
    this.setState({ errorInfo: error.toString() });
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={{ padding: 20, backgroundColor: '#1A1A2E', flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ color: '#ff4757', fontSize: 18, fontWeight: 'bold', marginBottom: 10 }}>⚠️ Layout Path Crashed</Text>
          <Text style={{ color: '#f1c40f', backgroundColor: '#111', padding: 15, borderRadius: 5, fontSize: 12, width: '90%' }}>
            {this.state.errorInfo}
          </Text>
        </View>
      );
    }
    return this.props.children;
  }
}

export default CodeCrashBoundary;