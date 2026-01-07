import { AuthProvider } from './contexts/AuthContext'
import RootNavigator from './routers/RootNavigator'
import { useFonts } from 'expo-font'

export default function App() {
  const [fontsLoaded] = useFonts({
    'Unbounded-Regular': require('@assets/fonts/Unbounded-Regular.ttf'),
    'Optima-bold': require('@assets/fonts/optima_bold.ttf'),
  })

  if (!fontsLoaded) {
    return null
  }

  return (
    <AuthProvider>
      <RootNavigator />
    </AuthProvider>
  )
}
