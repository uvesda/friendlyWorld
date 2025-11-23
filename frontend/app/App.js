import { AuthProvider } from "./contexts/AuthContext";
import RootNavigator from "./routers/RootNavigator";

export default function App() {
  return (
    <AuthProvider>
      <RootNavigator />
    </AuthProvider>
  );
}