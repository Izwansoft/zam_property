import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { ForgotPasswordScreen } from '../features/auth/screens/ForgotPasswordScreen';
import { LoginScreen } from '../features/auth/screens/LoginScreen';
import { RegisterScreen } from '../features/auth/screens/RegisterScreen';
import { WelcomeScreen } from '../features/auth/screens/WelcomeScreen';
import { ModuleHostScreen } from '../modules/host/screens/ModuleHostScreen';
import { ModuleSelectorScreen } from '../modules/selector/screens/ModuleSelectorScreen';
import type { RootStackParamList } from './types';
import { useAuthStore } from '../store/auth-store';
import { useModuleStore } from '../store/module-store';

const RootStack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const selectedModule = useModuleStore((state) => state.selectedModule);

  return (
    <NavigationContainer>
      <RootStack.Navigator
        initialRouteName={accessToken ? (selectedModule ? 'ModuleHost' : 'ModuleSelector') : 'Welcome'}
      >
        {accessToken ? (
          <>
            <RootStack.Screen
              component={ModuleSelectorScreen}
              name="ModuleSelector"
              options={{ headerShown: false }}
            />
            <RootStack.Screen
              component={ModuleHostScreen}
              name="ModuleHost"
              options={{ headerShown: false }}
              initialParams={selectedModule ? { moduleKey: selectedModule } : undefined}
            />
          </>
        ) : (
          <>
            <RootStack.Screen
              component={WelcomeScreen}
              name="Welcome"
              options={{ headerShown: false }}
            />
            <RootStack.Screen component={LoginScreen} name="Login" options={{ headerShown: false }} />
            <RootStack.Screen
              component={RegisterScreen}
              name="Register"
              options={{ headerShown: false }}
            />
            <RootStack.Screen
              component={ForgotPasswordScreen}
              name="ForgotPassword"
              options={{ headerShown: false }}
            />
          </>
        )}
      </RootStack.Navigator>
    </NavigationContainer>
  );
}
