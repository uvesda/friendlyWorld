import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { Image } from 'react-native'

import ProfileScreen from '@screens/ProfileScreen/ProfileScreen'
import { colors } from '@assets'
import PostsScreen from '@screens/PostsScreen/PostsScreen'

const Tab = createBottomTabNavigator()

export default function AppNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: {
          paddingTop: 20,
          backgroundColor: colors.black,
        },
        tabBarHideOnKeyboard: true,
      }}
    >
      <Tab.Screen
        name="Posts"
        component={PostsScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <Image
              source={
                focused
                  ? require('@assets/focused_baidu.png')
                  : require('@assets/baidu.png')
              }
            />
          ),
        }}
      />

      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <Image
              source={
                focused
                  ? require('@assets/focused_home.png')
                  : require('@assets/home.png')
              }
            />
          ),
        }}
      />
    </Tab.Navigator>
  )
}
