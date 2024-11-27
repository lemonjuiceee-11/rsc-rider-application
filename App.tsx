import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import LoginScreen from './app/LoginScreen'; // Ensure correct path
import OrderStatus from './app/OrderStatus'; // Ensure correct path

export type RootStackParamList = {
  Login: undefined;
  OrderStatus: undefined;
  CreateAccount: undefined; // Add this line
  ForgotPassword: undefined; // Add this line
};

const Stack = createStackNavigator<RootStackParamList>();

const App: React.FC = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Login">
        <Stack.Screen 
          name="Login" 
          component={LoginScreen} 
          options={{ headerShown: false }} // Hide header for Login screen
        />
        <Stack.Screen 
          name="OrderStatus" 
          component={OrderStatus} 
          options={{ headerShown: false }} // Hide header for OrderStatus screen
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default App;
