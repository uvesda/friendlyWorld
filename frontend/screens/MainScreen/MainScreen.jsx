import { ButtonPrimary } from '@components/ButtonPrimary/ButtonPrimary'
import { auth } from '@utils/auth'
import { View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

export default function MainScreen() {
  return (
    <SafeAreaView
      style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
    >
      <ButtonPrimary title="Выйти" onPress={() => auth.logout()} />
    </SafeAreaView>
  )
}
