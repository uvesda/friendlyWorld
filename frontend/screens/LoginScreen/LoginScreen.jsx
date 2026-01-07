import React, { useState, useContext, useEffect } from 'react'
import {
  View,
  Text,
  TextInput,
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

const LoginScreen = () => {
  const [ready, setReady] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const { setAuthState } = useContext(AuthContext)

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

  const handleLogin = () => {
    // Временная логика для демонстрации позже заменить на запрос из API
    if (email && password) {
      setAuthState({ isLoggedIn: true, loading: false })
    } else {
      Alert.alert('Ошибка', 'Пожалуйста, заполните все поля')
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
            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor="#999"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
            />

            <TextInput
              style={styles.input}
              placeholder="Пароль"
              placeholderTextColor="#999"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
            />

            <View style={styles.forgotPasswordContainer}>
              <Text style={styles.forgotPasswordText}>Забыли пароль? </Text>
              <TouchableOpacity onPress={handleForgotPassword}>
                <Text style={styles.forgotPasswordLink}>Нажмите сюда</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
              <Text style={styles.loginButtonText}>Войти</Text>
            </TouchableOpacity>

            <View style={styles.dividerContainer}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>или</Text>
              <View style={styles.dividerLine} />
            </View>

            <TouchableOpacity
              style={styles.createAccountButton}
              onPress={handleCreateAccount}
            >
              <Text style={styles.createAccountText}>Создать аккаунт</Text>
            </TouchableOpacity>
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
  input: {
    borderWidth: 1,
    borderColor: '#FFCA92',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    marginBottom: 16,
    backgroundColor: '#FFFFFF',
    color: '#333',
  },
  forgotPasswordContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 24,
    fontFamily: 'Inter-Regular',
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
  loginButton: {
    backgroundColor: colors.green,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Unbounded-Regular',
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
    color: '#000000',
    fontSize: 14,
    fontFamily: 'Inter-Regular',
  },
  createAccountButton: {
    borderWidth: 0,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    backgroundColor: colors.green,
  },
  createAccountText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Unbounded-Regular',
  },
})

export default LoginScreen
