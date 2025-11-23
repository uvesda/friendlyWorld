import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useContext } from "react";
import { AuthContext } from "@app/contexts/AuthContext";

import MainScreen from "@screens/MainScreen/MainScreen";
import PuppiesScreen from "@screens/PuppiesScreen/PuppiesScreen";
import { Loader } from "@components/Loader/Loader";

const Stack = createNativeStackNavigator();

export default function RootNavigator() {
  const { isLoggedIn, loading } = useContext(AuthContext);

  if (loading) return <Loader />;

  return (
    <NavigationContainer>
      <Stack.Navigator>
        {isLoggedIn ? (
          <>
            <Stack.Screen name="Main" component={MainScreen} />
            <Stack.Screen name="Puppies" component={PuppiesScreen} />
          </>
        ) : (
          <Stack.Screen
            name="Loading"
            component={() => null}
            options={{ headerShown: false }}
          />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}