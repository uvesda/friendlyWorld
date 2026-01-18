import { useEffect, useState, useCallback } from 'react'
import {
  View,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  Alert,
  StyleSheet,
  TouchableOpacity,
  Image,
  StatusBar,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { chatApi } from '@entities/chatApi/chatApi'
import { colors } from '@assets'
import { AppText } from '@components/AppText/AppText'
import { getServerErrorMessage } from '@utils/getServerErrorMessage'
import AppLayout from '@components/Layout/AppLayout'
import ChatListItem from '@components/ChatListItem/ChatListItem'
import ChatActionBottomSheet from '@components/ChatActionBottomSheet/ChatActionBottomSheet'
import { useNavigation, useFocusEffect } from '@react-navigation/native'
import { TextInputField } from '@components/TextInputField/TextInputField'

const ChatListScreen = () => {
  const [chats, setChats] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [searchUsername, setSearchUsername] = useState('')
  const [selectedChat, setSelectedChat] = useState(null)
  const [isActionSheetVisible, setIsActionSheetVisible] = useState(false)
  const navigation = useNavigation()

  const loadChats = useCallback(async () => {
    try {
      const response = await chatApi.getUserChats()
      let userChats = response.data || response || []

      if (searchUsername?.trim()) {
        const usernameLower = searchUsername.trim().toLowerCase()
        userChats = userChats.filter(
          (chat) =>
            chat.other_user_name?.toLowerCase().includes(usernameLower)
        )
      }

      setChats(userChats)
    } catch (e) {
      Alert.alert('Ошибка', getServerErrorMessage(e))
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [searchUsername])

  useEffect(() => {
    loadChats()
  }, [loadChats])

  // Reload chats when screen comes into focus (e.g., returning from chat)
  useFocusEffect(
    useCallback(() => {
      loadChats()
    }, [loadChats])
  )

  const onRefresh = useCallback(() => {
    setRefreshing(true)
    loadChats()
  }, [loadChats])

  const handleChatPress = useCallback(
    (chat) => {
      navigation.navigate('Chat', {
        screen: 'ChatDetail',
        params: {
          chatId: chat.id,
          otherUser: {
            other_user_name: chat.other_user_name,
            other_user_avatar: chat.other_user_avatar,
          },
        },
      })
    },
    [navigation]
  )

  const handleLongPress = useCallback((chat) => {
    setSelectedChat(chat)
    setIsActionSheetVisible(true)
  }, [])

  const handleChatDeleted = useCallback(() => {
    setIsActionSheetVisible(false)
    setSelectedChat(null)
    setRefreshing(true)
    loadChats()
  }, [loadChats])

  if (loading) {
    return (
      <AppLayout header={null} hasHeader={false}>
        <ChatListHeader
          searchValue={searchUsername}
          onSearchChange={setSearchUsername}
          isBottomSheetOpen={false}
        />
        <View style={{ flex: 1, justifyContent: 'center' }}>
          <ActivityIndicator size="large" color={colors.green} />
        </View>
      </AppLayout>
    )
  }

  return (
    <AppLayout header={null} hasHeader={false}>
      <ChatListHeader
        searchValue={searchUsername}
        onSearchChange={setSearchUsername}
        isBottomSheetOpen={isActionSheetVisible}
      />
      <View style={styles.chatsContainer}>
        <FlatList
          data={chats}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => (
            <ChatListItem
              chat={item}
              onPress={() => handleChatPress(item)}
              onLongPress={() => handleLongPress(item)}
            />
          )}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.green}
            />
          }
          contentContainerStyle={{
            paddingTop: 12,
            paddingBottom: 120,
          }}
          ListEmptyComponent={
            <View style={{ alignItems: 'center', marginTop: 40 }}>
              <AppText>Чатов пока нет</AppText>
            </View>
          }
          showsVerticalScrollIndicator={false}
        />
      </View>

      <ChatActionBottomSheet
        chat={selectedChat}
        visible={isActionSheetVisible}
        onClose={() => {
          setIsActionSheetVisible(false)
          setSelectedChat(null)
        }}
        onDeleted={handleChatDeleted}
      />
    </AppLayout>
  )
}

// ChatListHeader component (similar to SavedPostsHeader but only with search)
const ChatListHeader = ({ searchValue, onSearchChange, isBottomSheetOpen }) => {
  const [isSearchVisible, setIsSearchVisible] = useState(false)
  const insets = useSafeAreaInsets()

  const handleSearchPress = () => {
    if (isSearchVisible) {
      onSearchChange?.('')
    }
    setIsSearchVisible(!isSearchVisible)
  }

  return (
    <>
      <StatusBar barStyle="light-content" />
      <View
        style={[
          styles.container,
          {
            paddingTop: insets.top + 10,
            zIndex: isBottomSheetOpen ? undefined : 10,
          },
        ]}
      >
        {isSearchVisible && (
          <View style={styles.searchRow}>
            <TextInputField
              placeholder="Поиск по имени пользователя..."
              placeholderTextColor={colors.gray}
              value={searchValue}
              onChangeText={onSearchChange}
              style={styles.searchInput}
              autoFocus
            />
          </View>
        )}

        <View
          style={[
            styles.actionRow,
            isSearchVisible && { marginTop: 12, top: 0 },
          ]}
        >
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleSearchPress}
          >
            <Image source={require('@assets/search.png')} />
          </TouchableOpacity>
        </View>
      </View>
    </>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.black,
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomLeftRadius: 60,
    borderBottomRightRadius: 60,
    position: 'relative',
  },
  chatsContainer: {
    width: '90%',
    alignSelf: 'center',
    backgroundColor: colors.white,
    borderRadius: 20,
    marginTop: 12,
    flex: 1,
    overflow: 'hidden',
  },
  searchRow: {
    marginTop: 16,
    paddingHorizontal: 60,
  },
  searchInput: {
    marginBottom: 0,
    borderColor: colors.green,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 40,
    paddingHorizontal: 60,
    top: 40,
  },
  actionButton: {},
})

export default ChatListScreen
