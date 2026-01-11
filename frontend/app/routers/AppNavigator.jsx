import { createNativeBottomTabNavigator } from '@react-navigation/bottom-tabs/unstable'

import MainScreen from '@screens/MainScreen/MainScreen'
import ProfileScreen from '@screens/ProfileScreen/ProfileScreen'
import { colors } from '@assets/index'

const Tab = createNativeBottomTabNavigator()

export default function AppNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: {
          height: 64,
          paddingBottom: 10,
          paddingTop: 10,
          backgroundColor: colors.black,
          borderTopWidth: 1,
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={MainScreen}
        options={{
          tabBarIcon: ({ focused }) => ({
            type: 'image',
            source: focused
              ? require('@assets/focused_baidu.png')
              : require('@assets/baidu.png'),
            tinted: false,
          }),
          tabBarLabelVisibilityMode: 'unlabeled',
          title: '',
        }}
      />

      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ focused }) => ({
            type: 'image',
            source: focused
              ? require('@assets/focused_home.png')
              : require('@assets/home.png'),
            tinted: false,
          }),
          tabBarLabelVisibilityMode: 'unlabeled',
          title: '',
        }}
      />
    </Tab.Navigator>
  )
}
