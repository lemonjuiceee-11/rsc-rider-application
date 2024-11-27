import React, { useState } from 'react';
import { View, TextInput, Text, StyleSheet, TouchableOpacity, Image} from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../App';

type LoginScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Login'>;

type Props = {
  navigation: LoginScreenNavigationProp;
};

const LoginScreen: React.FC<Props> = ({ navigation }) => {
  const [identifier, setIdentifier] = useState<string>(''); // Changed from email
  const [password, setPassword] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isPasswordVisible, setPasswordVisible] = useState<boolean>(false);

  const handleLogin = async () => {
    try {
      const response = await axios.post('https://deserving-action-5569f72002.strapiapp.com/api/auth/local', {
        identifier: identifier, // Use identifier for both email and username
        password: password,
      });

      const { jwt } = response.data;
      await AsyncStorage.setItem('token', jwt); // Store the JWT token
      navigation.navigate('OrderStatus'); // Navigate to OrderStatus screen
    } catch (error) {
      setErrorMessage('Invalid username or email or password');
    }
  };

  return (
    <View style={styles.container}>
       <Image 
        source={require('./4.png')} // Replace with your actual file path
         style={styles.logo}
        />
      <Text style={styles.title}>Login</Text>

      <TextInput
        style={styles.input}
        placeholder="Username or Email" // Updated placeholder text
        value={identifier} // Bind to identifier instead of email
        onChangeText={setIdentifier}
        keyboardType="email-address" // This can remain, or be changed to 'default'
        autoCapitalize="none"
        placeholderTextColor="#888"
      />

      <View style={styles.passwordContainer}>
        <TextInput
          style={styles.passwordInput}
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry={!isPasswordVisible}
          placeholderTextColor="#888"
        />
        <TouchableOpacity
          style={styles.showPasswordButton}
          onPress={() => setPasswordVisible(!isPasswordVisible)}
        >
          <Text style={styles.showPasswordText}>
            {isPasswordVisible ? 'Hide' : 'Show'}
          </Text>
        </TouchableOpacity>
      </View>

      {errorMessage ? <Text style={styles.error}>{errorMessage}</Text> : null}

      <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
        <Text style={styles.loginButtonText}>Login</Text>
      </TouchableOpacity>

    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',    
    alignItems: 'center',       
    padding: 24,
    backgroundColor: '#f0f0f0',
  },
  logo: {
    width: 200,  
    height: 200, 
    marginBottom:30
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#333',
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 14,
    marginBottom: 12,
    borderRadius: 8,
    width: '100%',               
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    marginBottom: 12,
    width: '100%',               
  },
  passwordInput: {
    flex: 1,
    padding: 14,
  },
  showPasswordButton: {
    paddingHorizontal: 16,
  },
  showPasswordText: {
    color: '#199c23',
    fontWeight: 'bold',
  },
  error: {
    color: 'red',
    marginBottom: 10,
    textAlign: 'center',
  },
  loginButton: {
    backgroundColor: '#199c23',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
    width: '100%',               
  },
  loginButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  forgotPassword: {
    color: '#199c23',
    marginTop: 20,
    textAlign: 'center',
    fontWeight: '500',
  },
});

export default LoginScreen;
