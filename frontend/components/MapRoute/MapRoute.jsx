import { useEffect, useState, useCallback } from 'react'
import { View, StyleSheet, ActivityIndicator, Alert, Image, TouchableOpacity } from 'react-native'
import { useFocusEffect } from '@react-navigation/native'
import MapView, { Marker } from 'react-native-maps'
import { postApi } from '@entities/postApi/postApi'
import { colors } from '@assets'
import { AppText } from '@components/AppText/AppText'
import { getServerErrorMessage } from '@utils/getServerErrorMessage'

const MapRoute = ({ onPostPress, searchHashtag, statusFilter }) => {
  const [posts, setPosts] = useState([])
  const [postsWithPhotos, setPostsWithPhotos] = useState({})
  const [loading, setLoading] = useState(true)
  const [region, setRegion] = useState({
    latitude: 55.7558, // Москва по умолчанию
    longitude: 37.6173,
    latitudeDelta: 0.1,
    longitudeDelta: 0.1,
  })

  const loadFirstPhotos = useCallback(async (postsList) => {
    const photosMap = {}

    const photoPromises = postsList.map(async (post) => {
      try {
        const photosRes = await postApi.getPhotos(post.id)
        const photos = Array.isArray(photosRes)
          ? photosRes
          : photosRes?.data || []
        if (photos.length > 0) {
          photosMap[post.id] = photos[0]
        }
      } catch {
      }
    })

    await Promise.all(photoPromises)
    setPostsWithPhotos(photosMap)
  }, [])

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

      if (validPosts.length > 0) {
        const latitudes = validPosts.map((p) => Number(p.latitude))
        const longitudes = validPosts.map((p) => Number(p.longitude))

        const minLat = Math.min(...latitudes)
        const maxLat = Math.max(...latitudes)
        const minLng = Math.min(...longitudes)
        const maxLng = Math.max(...longitudes)

        const centerLat = (minLat + maxLat) / 2
        const centerLng = (minLng + maxLng) / 2

        const latDelta = Math.max(maxLat - minLat, 0.05) * 1.5
        const lngDelta = Math.max(maxLng - minLng, 0.05) * 1.5

        setRegion({
          latitude: centerLat,
          longitude: centerLng,
          latitudeDelta: latDelta,
          longitudeDelta: lngDelta,
        })
      }

      loadFirstPhotos(validPosts)
    } catch (e) {
      Alert.alert('Ошибка', getServerErrorMessage(e))
    } finally {
      setLoading(false)
    }
  }, [searchHashtag, statusFilter, loadFirstPhotos])

  useEffect(() => {
    loadPosts()
  }, [loadPosts])

  useFocusEffect(
    useCallback(() => {
      loadPosts()
    }, [loadPosts])
  )

  const getPhotoUri = (photoPath) => {
    if (!photoPath) return null
    const baseURL = process.env.EXPO_PUBLIC_IP_CONFIG || 'http://localhost:3000'
    if (photoPath.startsWith('http')) return photoPath
    return `${baseURL}${photoPath}`
  }

  const handleMarkerPress = useCallback(
    (post) => {
      onPostPress?.(post)
    },
    [onPostPress]
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
      <MapView
        style={styles.map}
        region={region}
        onRegionChangeComplete={setRegion}
        showsUserLocation={true}
        showsMyLocationButton={true}
      >
        {posts.map((post) => {
          const latitude = Number(post.latitude)
          const longitude = Number(post.longitude)
          const firstPhoto = postsWithPhotos[post.id]
          const photoUri = firstPhoto ? getPhotoUri(firstPhoto.path) : null

          const borderColor =
            post.status === 'lost' ? colors.lowOrange : colors.green

          return (
            <Marker
              key={post.id}
              coordinate={{ latitude, longitude }}
              onPress={() => handleMarkerPress(post)}
              anchor={{ x: 0.5, y: 0.5 }}
              centerOffset={{ x: 0, y: -5 }}
            >
              <View style={[styles.customMarker, { borderColor: borderColor }]}>
                {photoUri ? (
                  <Image
                    source={{ uri: photoUri }}
                    style={styles.markerImage}
                  />
                ) : (
                  <View
                    style={[
                      styles.markerPlaceholder,
                      { backgroundColor: borderColor },
                    ]}
                  >
                    <View style={styles.markerInnerCircle} />
                  </View>
                )}
              </View>
            </Marker>
          )
        })}
      </MapView>
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
  map: {
    flex: 1,
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
  customMarker: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 3,
    backgroundColor: colors.white,
    shadowColor: colors.fullBlack,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 6,
  },
  markerImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  markerPlaceholder: {
    width: '100%',
    height: '100%',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  markerInnerCircle: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.black,
  },
})

export default MapRoute
