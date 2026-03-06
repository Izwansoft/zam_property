import { StatusBar } from 'expo-status-bar';
import { Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold, useFonts as useInterFonts } from '@expo-google-fonts/inter';
import { Roboto_500Medium, useFonts as useRobotoFonts } from '@expo-google-fonts/roboto';

import { RootNavigator } from './src/navigation/RootNavigator';
import { AppProvider } from './src/providers/AppProvider';

export default function App() {
  const [interLoaded] = useInterFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  const [robotoLoaded] = useRobotoFonts({
    Roboto_500Medium,
  });

  if (!interLoaded || !robotoLoaded) {
    return null;
  }

  return (
    <AppProvider>
      <RootNavigator />
      <StatusBar style="auto" />
    </AppProvider>
  );
}
