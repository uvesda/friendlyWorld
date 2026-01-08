import React, { useState, useContext, useEffect } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  Image,
} from 'react-native'
import { Asset } from 'expo-asset'
import { AuthContext } from '@app/contexts/AuthContext'
import { backgrounds, colors } from '@assets/index'
import { Loader } from '@components/Loader/Loader'
import { TextInputField } from '@components/TextInputField/TextInputField'
import { ButtonPrimary } from '@components/ButtonPrimary/ButtonPrimary'
import { AppText } from '@components/AppText/AppText'

const LoginScreen = () => {
  const [ready, setReady] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const { login } = useContext(AuthContext)

  useEffect(() => {
    Asset.fromModule(backgrounds.hourglass)
      .downloadAsync()
      .then(() => {
        setReady(true)
      })
  }, [])

  if (!ready) {
    return <Loader />
  }

  const handleLogin = async () => {
    try {
      await login(email, password)
    } catch (e) {
      Alert.alert('Ошибка', 'Неверный email или пароль')
    }
  }

  const handleForgotPassword = () => {
    Alert.alert(
      'Восстановление пароля',
      'Функция восстановления пароля будет добавлена позже'
    )
  }

  const handleCreateAccount = () => {
    Alert.alert(
      'Создание аккаунта',
      'Функция создания аккаунта будет добавлена позже'
    )
  }

  return (
    <View style={styles.container}>
      <Image
        source={backgrounds.hourglass}
        style={StyleSheet.absoluteFill}
        resizeMode="cover"
      />

      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <View style={styles.content}>
            <TextInputField
              placeholder="Email"
              placeholderTextColor={colors.gray}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
            />

            <TextInputField
              placeholder="Пароль"
              placeholderTextColor={colors.gray}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
            />

            <View style={styles.forgotPasswordContainer}>
              <AppText style={styles.forgotPasswordText}>
                Забыли пароль?{' '}
              </AppText>
              <TouchableOpacity onPress={handleForgotPassword}>
                <AppText style={styles.forgotPasswordLink}>
                  Нажмите сюда
                </AppText>
              </TouchableOpacity>
            </View>

            <ButtonPrimary title="Войти" onPress={handleLogin} />

            <View style={styles.dividerContainer}>
              <View style={styles.dividerLine} />
              <AppText style={styles.dividerText}>или</AppText>
              <View style={styles.dividerLine} />
            </View>

            <ButtonPrimary
              title="Создать аккаунт"
              onPress={handleCreateAccount}
              style={{ backgroundColor: colors.green }}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  content: {
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  forgotPasswordContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 24,
  },
  forgotPasswordText: {
    color: '#000000',
    fontSize: 14,
  },
  forgotPasswordLink: {
    color: colors.green,
    fontSize: 14,
    fontWeight: '600',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  dividerText: {
    paddingHorizontal: 16,
    color: colors.fullBlack,
    fontSize: 14,
  },
})

export default LoginScreen
