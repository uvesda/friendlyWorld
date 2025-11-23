import { Text } from "react-native";

export const H1 = ({ children }) => (
  <Text style={{ fontSize: 28, fontWeight: "700" }}>{children}</Text>
);

export const P = ({ children }) => (
  <Text style={{ fontSize: 18 }}>{children}</Text>
);