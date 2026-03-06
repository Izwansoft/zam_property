import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import { Ionicons } from '@expo/vector-icons';

import { RealEstateListingsScreen } from '../../../features/real-estate/screens/RealEstateListingsScreen';
import { RealEstateAccountScreen } from '../screens/RealEstateAccountScreen';
import { RealEstateActivityScreen } from '../screens/RealEstateActivityScreen';
import { RealEstateHomeScreen } from '../screens/RealEstateHomeScreen';
import { RealEstateSavedScreen } from '../screens/RealEstateSavedScreen';

type RealEstateTabParamList = {
  Home: undefined;
  Explore: undefined;
  Saved: undefined;
  Activity: undefined;
  Account: undefined;
};

const RealEstateTabs = createBottomTabNavigator<RealEstateTabParamList>();

export function RealEstateModuleShell() {
  return (
    <RealEstateTabs.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: {
          height: 80,
          borderRadius: 111,
          marginHorizontal: 4,
          marginBottom: 8,
          backgroundColor: 'rgba(63, 63, 63, 0.97)',
          borderTopWidth: 0,
          position: 'absolute',
          shadowColor: '#1F2A37',
          shadowOpacity: 0.12,
          shadowRadius: 3,
          shadowOffset: { width: 0, height: -1 },
          elevation: 6,
        },
        tabBarItemStyle: {
          paddingVertical: 12,
        },
        tabBarIcon: ({ color, focused }) => {
          const iconNameMap: Record<keyof RealEstateTabParamList, keyof typeof Ionicons.glyphMap> = {
            Home: 'home-outline',
            Explore: 'compass-outline',
            Saved: 'heart-outline',
            Activity: 'document-text-outline',
            Account: 'person-outline',
          };

          if (route.name === 'Home' && focused) {
            return (
              <Ionicons
                color="#ffffff"
                name="home"
                size={20}
                style={{ backgroundColor: '#6941C6', borderRadius: 35, padding: 9 }}
              />
            );
          }

          return <Ionicons color={color} name={iconNameMap[route.name]} size={20} />;
        },
        tabBarActiveTintColor: '#ffffff',
        tabBarInactiveTintColor: '#9DA4AE',
      })}
    >
      <RealEstateTabs.Screen component={RealEstateHomeScreen} name="Home" />
      <RealEstateTabs.Screen
        component={RealEstateListingsScreen}
        name="Explore"
      />
      <RealEstateTabs.Screen component={RealEstateSavedScreen} name="Saved" />
      <RealEstateTabs.Screen component={RealEstateActivityScreen} name="Activity" />
      <RealEstateTabs.Screen
        component={RealEstateAccountScreen}
        name="Account"
      />
    </RealEstateTabs.Navigator>
  );
}
