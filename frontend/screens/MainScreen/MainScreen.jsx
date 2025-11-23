import { View, Button } from "react-native";
import { H1, P } from "@components/Typography/Typography";

export default function MainScreen({ navigation }) {
  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
      <H1>Главная страница</H1>
      <P>Добро пожаловать!</P>

      <Button
        title="Перейти к Puppies"
        onPress={() => navigation.navigate("Puppies")}
      />
    </View>
  );
}