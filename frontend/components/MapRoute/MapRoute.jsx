import { useEffect, useState, useCallback } from 'react'
import { View, StyleSheet, ActivityIndicator, Alert, TouchableOpacity } from 'react-native'
import { useFocusEffect } from '@react-navigation/native'
import { postApi } from '@entities/postApi/postApi'
import { colors } from '@assets'
import { AppText } from '@components/AppText/AppText'
import { getServerErrorMessage } from '@utils/getServerErrorMessage'

const MapRoute = ({ onPostPress, searchHashtag, statusFilter }) => {
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)

  const loadPosts = useCallback(async () => {
    try {
      const filters = {}
      if (searchHashtag?.trim()) {
        filters.hashtag = searchHashtag.trim().toLowerCase()
      }
      if (statusFilter) {
        filters.status = statusFilter
      }
      const response = await postApi.getAll(filters)
      const postsData = response.data || []

      const validPosts = postsData.filter(
        (post) =>
          post.latitude != null &&
          post.longitude != null &&
          !isNaN(Number(post.latitude)) &&
          !isNaN(Number(post.longitude))
      )

      setPosts(validPosts)
    } catch (e) {
      Alert.alert('Ошибка', getServerErrorMessage(e))
    } finally {
      setLoading(false)
    }
  }, [searchHashtag, statusFilter])

  useEffect(() => {
    loadPosts()
  }, [loadPosts])

  useFocusEffect(
    useCallback(() => {
      loadPosts()
    }, [loadPosts])
  )

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.green} />
      </View>
    )
  }

  if (posts.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <AppText style={styles.emptyText}>Постов с координатами пока нет</AppText>
        <TouchableOpacity
          style={styles.refreshButton}
          onPress={() => {
            setLoading(true)
            loadPosts()
          }}
          disabled={loading}
        >
          <AppText style={styles.refreshButtonText}>
            {loading ? 'Загрузка...' : 'Обновить'}
          </AppText>
        </TouchableOpacity>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <View style={styles.placeholderContainer}>
        <AppText style={styles.placeholderText}>Пока что не доступно</AppText>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    borderTopLeftRadius: 60,
    borderTopRightRadius: 60,
    overflow: 'hidden',
  },
  placeholderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.white,
  },
  placeholderText: {
    fontSize: 18,
    color: colors.fullBlack,
    textAlign: 'center',
    fontFamily: 'Cruinn-Regular',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    color: colors.fullBlack,
    marginBottom: 20,
    textAlign: 'center',
    fontFamily: 'Cruinn-Regular',
  },
  refreshButton: {
    backgroundColor: colors.orange,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 24,
    minWidth: 120,
  },
  refreshButtonText: {
    color: colors.white,
    fontSize: 14,
    textAlign: 'center',
    fontFamily: 'Unbounded-Regular',
  },
})

export default MapRoute
