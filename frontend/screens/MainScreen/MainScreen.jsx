import { ButtonPrimary } from '@components/ButtonPrimary/ButtonPrimary'
import { auth } from '@utils/auth'
import { View } from 'react-native'

export default function MainScreen() {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <ButtonPrimary title="Выйти" onPress={() => auth.logout()} />
    </View>
  )
}
