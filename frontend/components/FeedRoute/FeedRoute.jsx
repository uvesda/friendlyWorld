import { useEffect, useState, useCallback } from 'react'
import {
  View,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native'
import PostCard from '@components/PostCard/PostCard'
import { postApi } from '@entities/postApi/postApi'
import { colors } from '@assets'
import { AppText } from '@components/AppText/AppText'
import { getServerErrorMessage } from '@utils/getServerErrorMessage'

const FeedRoute = ({
  onPostPress,
  onCommentsPress,
  onFavoritePostIdsUpdate,
}) => {
  const [posts, setPosts] = useState([])
  const [favoritePostIds, setFavoritePostIds] = useState(new Set())
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const loadPosts = async () => {
    try {
      const response = await postApi.getAll()
      setPosts(response.data || [])
    } catch (e) {
      console.error('Ошибка загрузки постов', e)
      Alert.alert('Ошибка', getServerErrorMessage(e))
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const loadFavorites = async () => {
    try {
      const response = await postApi.getFavorites()
      const favoritePosts = response.data || []
      const ids = new Set(favoritePosts.map((post) => post.id))
      setFavoritePostIds(ids)
      // Обновляем состояние в родительском компоненте
      onFavoritePostIdsUpdate?.(ids)
    } catch (e) {
      // Если пользователь не авторизован, просто игнорируем ошибку
      console.log('Не удалось загрузить избранные')
    }
  }

  useEffect(() => {
    loadPosts()
    loadFavorites()
  }, [])

  const onRefresh = useCallback(() => {
    setRefreshing(true)
    loadPosts()
    loadFavorites()
  }, [])

  const handleFavoriteToggle = async (post) => {
    if (!post?.id) return

    try {
      const isFavorite = favoritePostIds.has(post.id)
      if (isFavorite) {
        await postApi.removeFavorite(post.id)
        const newSet = new Set(favoritePostIds)
        newSet.delete(post.id)
        setFavoritePostIds(newSet)
        onFavoritePostIdsUpdate?.(newSet)
      } else {
        await postApi.addFavorite(post.id)
        const newSet = new Set([...favoritePostIds, post.id])
        setFavoritePostIds(newSet)
        onFavoritePostIdsUpdate?.(newSet)
      }
    } catch (e) {
      Alert.alert('Ошибка', getServerErrorMessage(e))
    }
  }

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center' }}>
        <ActivityIndicator size="large" color={colors.green} />
      </View>
    )
  }

  const getPostPhoto = (post) => {
    // Если есть фото в посте, возвращаем первое
    // В противном случае можно вернуть null или placeholder
    return post.photos?.[0] || null
  }

  return (
    <>
      <FlatList
        data={posts}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => (
          <PostCard
            post={item}
            authorAvatar={item.author?.avatar}
            photo={getPostPhoto(item)}
            isFavorite={favoritePostIds.has(item.id)}
            onPress={() => onPostPress?.(item)}
            onContactPress={() => {
              onPostPress?.(item)
              // В bottom sheet будет кнопка связаться
            }}
            onCommentsPress={() => onCommentsPress?.(item)}
            onBookmarkPress={() => handleFavoriteToggle(item)}
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
            <AppText>Постов пока нет</AppText>
          </View>
        }
        showsVerticalScrollIndicator={false}
      />
    </>
  )
}

export default FeedRoute
