import { backgrounds, colors } from '@assets/index'
import { AppText } from '@components/AppText/AppText'
import { Image, StyleSheet, TouchableOpacity, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

const ProfileScreen = () => {
  return (
    <SafeAreaView style={{ flex: 1, alignItems: 'center' }}>
      <Image
        source={backgrounds.hourglass}
        style={StyleSheet.absoluteFill}
        resizeMode="cover"
      />
      {/* Header */}
      <View
        style={{
          width: '100%',
          height: 110,
          backgroundColor: colors.black,
          position: 'absolute',
          top: 0,
          borderBottomLeftRadius: 60,
          borderBottomRightRadius: 60,
        }}
      />
      {/* User window */}
      <View
        style={{
          width: '90%',
          height: 'auto',
          backgroundColor: colors.white,
          borderRadius: 20,
          marginTop: 70,
          flexDirection: 'row',
          paddingVertical: 15,
          paddingHorizontal: 20,
        }}
      >
        <Image source={require('@assets/avatar.png')} />
        <View style={{ flexDirection: 'column' }}>
          <View style={{ flexDirection: 'row' }}>
            <AppText>UserName</AppText>
            <TouchableOpacity>
              <Image source={require('@assets/write.png')} />
            </TouchableOpacity>
          </View>
          <View style={{ flexDirection: 'row' }}>
            <Image source={require('@assets/baiduOrange.png')} />
            <Image source={require('@assets/baiduGreen.png')} />
          </View>
        </View>
      </View>
      {/* User additionally info */}
      <View
        style={{
          width: '90%',
          height: '100%',
          backgroundColor: colors.white,
          marginTop: 20,
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
        }}
      >
        <View style={{ padding: 20, gap: 20 }}>
          <TouchableOpacity
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              boxShadow: '0px 1px 4px 0px rgba(0, 0, 0, 0.25)',
              borderRadius: 40,
              justifyContent: 'space-between',
            }}
          >
            <AppText
              fontFamily={'Unbounded-Regular'}
              style={{ paddingLeft: 20, paddingTop: 11, paddingBottom: 12 }}
            >
              Сохраненные посты
            </AppText>
            <Image
              source={require('@assets/bookmark.png')}
              style={{ marginRight: 12 }}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              boxShadow: '0px 1px 4px 0px rgba(0, 0, 0, 0.25)',
              borderRadius: 40,
              justifyContent: 'space-between',
            }}
          >
            <AppText
              fontFamily={'Unbounded-Regular'}
              style={{ paddingLeft: 20, paddingTop: 11, paddingBottom: 12 }}
            >
              Мои объявления
            </AppText>
            <Image
              source={require('@assets/log.png')}
              style={{ marginRight: 12 }}
            />
          </TouchableOpacity>
          <View
            style={{ flexDirection: 'row', justifyContent: 'space-between' }}
          >
            <TouchableOpacity>
              <Image source={require('@assets/dogInactive.png')} />
            </TouchableOpacity>
            <Image source={require('@assets/dogActive.png')} />
          </View>
        </View>
      </View>
      {/* Footer */}
      <View
        style={{
          width: '100%',
          height: 110,
          backgroundColor: colors.black,
          position: 'absolute',
          bottom: 0,
        }}
      />
    </SafeAreaView>
  )
}

export default ProfileScreen
