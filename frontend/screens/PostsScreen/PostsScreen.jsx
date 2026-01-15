import { AppText } from '@components/AppText/AppText'
import FeedRoute from '@components/FeedRoute/FeedRoute'
import AnimateHeader from '@components/Layout/AnimateHeader'
import AppLayout from '@components/Layout/AppLayout'
import MapRoute from '@components/MapRoute/MapRoute'
import PostBottomSheet from '@components/PostBottomSheet/PostBottomSheet'
import { useState, useCallback } from 'react'
import { View, useWindowDimensions, Alert } from 'react-native'
import { SceneMap, TabView } from 'react-native-tab-view'
import { postApi } from '@entities/postApi/postApi'
import { getServerErrorMessage } from '@utils/getServerErrorMessage'

const PostsScreen = ({ navigation }) => {
  const layout = useWindowDimensions()
  const [index, setIndex] = useState(0)
  const [routes] = useState([
    { key: 'feed', title: 'Лента' },
    { key: 'map', title: 'Карта' },
  ])

  const [selectedPost, setSelectedPost] = useState(null)
  const [scrollToComments, setScrollToComments] = useState(false)
  const [favoritePostIds, setFavoritePostIds] = useState(new Set())

  const onPostAddPressHandler = () => {
    navigation.navigate('CreatePost')
  }

  const handlePostPress = useCallback((post) => {
    setSelectedPost(post)
    setScrollToComments(false)
  }, [])

  const handleCommentsPress = useCallback((post) => {
    setSelectedPost(post)
    setScrollToComments(true)
  }, [])

  const handleCloseBottomSheet = useCallback(() => {
    setSelectedPost(null)
    setScrollToComments(false)
  }, [])

  const handleFavoriteToggle = useCallback(
    async (post) => {
      if (!post?.id) return

      try {
        const isFavorite = favoritePostIds.has(post.id)
        if (isFavorite) {
          await postApi.removeFavorite(post.id)
          setFavoritePostIds((prev) => {
            const newSet = new Set(prev)
            newSet.delete(post.id)
            return newSet
          })
        } else {
          await postApi.addFavorite(post.id)
          setFavoritePostIds((prev) => new Set([...prev, post.id]))
        }
      } catch (e) {
        Alert.alert('Ошибка', getServerErrorMessage(e))
      }
    },
    [favoritePostIds]
  )

  const handleFavoritePostIdsUpdate = useCallback((ids) => {
    setFavoritePostIds(ids)
  }, [])

  const renderScene = useCallback(
    ({ route }) => {
      switch (route.key) {
        case 'feed':
          return (
            <FeedRoute
              onPostPress={handlePostPress}
              onCommentsPress={handleCommentsPress}
              onFavoritePostIdsUpdate={handleFavoritePostIdsUpdate}
            />
          )
        case 'map':
          return <MapRoute />
        default:
          return null
      }
    },
    [handlePostPress, handleCommentsPress, handleFavoritePostIdsUpdate]
  )

  return (
    <AppLayout header={null} hasHeader={false}>
      <TabView
        navigationState={{ index, routes }}
        renderScene={renderScene}
        onIndexChange={setIndex}
        initialLayout={{ width: layout.width }}
        renderTabBar={(props) => (
          <AnimateHeader
            activeTab={index}
            onTabChange={setIndex}
            position={props.position}
            onPostAddPress={onPostAddPressHandler}
          />
        )}
      />

      {selectedPost && (
        <PostBottomSheet
          post={selectedPost}
          isFavorite={favoritePostIds.has(selectedPost.id)}
          onClose={handleCloseBottomSheet}
          onFavoriteToggle={() => handleFavoriteToggle(selectedPost)}
          onContactPress={() => {
            console.log('Связаться с автором', selectedPost?.id)
          }}
          scrollToComments={scrollToComments}
        />
      )}
    </AppLayout>
  )
}

export default PostsScreen
