import { backgrounds, colors } from '@assets/index'
import { AppText } from '@components/AppText/AppText'
import { Alert, Image, StyleSheet, TouchableOpacity, View } from 'react-native'
import AppLayout from '@components/Layout/AppLayout'
import { useContext, useEffect, useState } from 'react'
import { Audio } from 'expo-av'
import { userApi } from '@entities/userApi/userApi'
import { getServerErrorMessage } from '@utils/getServerErrorMessage'
import { AuthContext } from '@app/contexts/AuthContext'

const ProfileScreen = () => {
  const [userNameHeight, setUserNameHeight] = useState(40)
  const [isExiting, setIsExiting] = useState(false)
  const [profile, setProfile] = useState(null)
  const { logout } = useContext(AuthContext)

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const data = await userApi.getProfile()
        setProfile(data)
      } catch (e) {
        console.error('Ошибка загрузки профиля', e)
        Alert.alert('Ошибка', getServerErrorMessage(e))
      }
    }

    loadProfile()
  }, [])

  const handleTextLayout = (event) => {
    const { height } = event.nativeEvent.layout
    const totalHeight = height + 22 + 8
    setUserNameHeight(Math.max(40, totalHeight))
  }

  const handleExit = async () => {
    setIsExiting(true)

    const sounds = [
      require('@assets/exit-sound-1.mp3'),
      require('@assets/exit-sound-2.mp3'),
    ]
    const randomSound = sounds[Math.floor(Math.random() * sounds.length)]
    const { sound } = await Audio.Sound.createAsync(randomSound)

    sound.setOnPlaybackStatusUpdate(async (status) => {
      if (status.didJustFinish) {
        console.log('Выход из приложения')
        sound.unloadAsync()
        await logout()
      }
    })

    await sound.playAsync()
  }

  return (
    <AppLayout background={backgrounds.hourglassProfile} scroll={false}>
      <View style={styles.content}>
        <View style={styles.userCard}>
          <Image source={require('@assets/avatar.png')} />

          <View style={styles.userInfo}>
            <View
              style={[styles.userNameContainer, { height: userNameHeight }]}
            >
              <View
                style={[styles.userNameBorder, { height: userNameHeight }]}
              />

              <AppText
                style={styles.userName}
                numberOfLines={3}
                ellipsizeMode="tail"
                onLayout={handleTextLayout}
              >
                {profile?.data?.user?.name}
              </AppText>

              <View style={styles.userNameLabelContainer}>
                <AppText style={styles.userNameLabel}>Имя пользователя</AppText>
              </View>
            </View>
            <View style={styles.editInfo}>
              <TouchableOpacity style={styles.editButton}>
                <Image source={require('@assets/write.png')} />
              </TouchableOpacity>

              <View style={styles.badges}>
                <Image
                  source={require('@assets/baiduOrange.png')}
                  style={styles.badgeOrange}
                />
                <Image
                  source={require('@assets/baiduGreen.png')}
                  style={styles.badgeGreen}
                />
              </View>
            </View>
          </View>
        </View>

        <View style={styles.additionalInfo}>
          <View style={styles.additionalContent}>
            <TouchableOpacity style={styles.actionButton}>
              <AppText fontFamily="Unbounded-Regular" style={styles.actionText}>
                Сохраненные посты
              </AppText>

              <Image
                source={require('@assets/bookmark.png')}
                style={styles.actionIcon}
              />
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionButton}>
              <AppText fontFamily="Unbounded-Regular" style={styles.actionText}>
                Мои объявления
              </AppText>

              <Image
                source={require('@assets/log.png')}
                style={styles.actionIcon}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleExit}
              disabled={isExiting}
            >
              <AppText fontFamily="Unbounded-Regular" style={styles.actionText}>
                Выйти
              </AppText>

              <Image
                source={
                  isExiting
                    ? require('@assets/dogActive.png')
                    : require('@assets/dogInactive.png')
                }
                style={styles.actionIcon}
              />
            </TouchableOpacity>

            {/* <View style={styles.petsRow}>
              <TouchableOpacity>
                <Image source={require('@assets/dogInactive.png')} />
              </TouchableOpacity>

              <Image source={require('@assets/dogActive.png')} />
            </View> */}
          </View>
        </View>
      </View>
    </AppLayout>
  )
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    alignItems: 'center',
  },

  userCard: {
    width: '90%',
    backgroundColor: colors.white,
    borderRadius: 20,
    marginTop: 20,
    flexDirection: 'row',
    paddingVertical: 15,
    paddingHorizontal: 20,
  },

  userInfo: {
    marginLeft: 0,
    flex: 1,
    flexDirection: 'column',
  },

  userNameContainer: {
    position: 'relative',
    marginBottom: 6,
  },

  userNameBorder: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: 180,
    borderRadius: 12,
    borderWidth: 3,
    borderColor: colors.green,
  },

  userName: {
    position: 'absolute',
    left: 21,
    top: 15,
    fontSize: 16,
    color: colors.fullBlack,
    flexShrink: 1,
    flexWrap: 'wrap',
    width: 140,
  },

  userNameLabelContainer: {
    position: 'absolute',
    bottom: -7,
    right: 15,
    backgroundColor: colors.white,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },

  userNameLabel: {
    fontSize: 10,
    color: colors.fullBlack,
  },

  editInfo: {
    alignSelf: 'flex-end',
    marginTop: 0,
    alignItems: 'flex-end',
  },

  editButton: {
    top: 5,
    marginBottom: 6,
    marginRight: 10,
  },

  badges: {
    flexDirection: 'row',
    marginTop: 6,
    gap: 6,
    top: 10,
    left: 10,
  },

  badgeOrange: {
    bottom: 15,
  },

  badgeGreen: {
    top: 10,
  },

  additionalInfo: {
    width: '90%',
    flex: 1,
    backgroundColor: colors.white,
    marginTop: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },

  additionalContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    gap: 20,
  },

  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 40,
    paddingVertical: 11,
    paddingLeft: 20,
    paddingRight: 12,
    backgroundColor: colors.white,

    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },

    elevation: 3,
  },

  actionText: {
    paddingRight: 12,
  },

  actionIcon: {
    marginLeft: 12,
    width: 24,
    height: 24,
  },

  petsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
})

export default ProfileScreen
