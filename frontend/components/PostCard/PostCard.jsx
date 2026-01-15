import React from 'react'
import { View, StyleSheet, Image, TouchableOpacity } from 'react-native'
import { colors } from '@assets/index'
import { AppText } from '@components/AppText/AppText'

const MAX_DESCRIPTION_LENGTH = 100

const PostCard = ({
  post,
  authorAvatar,
  photo,
  isFavorite = false,
  onPress,
  onContactPress,
  onCommentsPress,
  onBookmarkPress,
}) => {
  const formatDate = (dateString) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    const months = [
      'января',
      'февраля',
      'марта',
      'апреля',
      'мая',
      'июня',
      'июля',
      'августа',
      'сентября',
      'октября',
      'ноября',
      'декабря',
    ]

    const day = date.getDate()
    const month = months[date.getMonth()]
    const year = date.getFullYear()
    const hours = date.getHours().toString().padStart(2, '0')
    const minutes = date.getMinutes().toString().padStart(2, '0')

    return `${day} ${month} ${year} г. ${hours}:${minutes}`
  }

  const getPhotoUri = (photoPath) => {
    if (!photoPath) return null
    const baseURL = process.env.EXPO_PUBLIC_IP_CONFIG || 'http://localhost:3000'
    if (typeof photoPath === 'string' && photoPath.startsWith('http'))
      return photoPath
    if (typeof photoPath === 'string') return `${baseURL}${photoPath}`
    return photoPath
  }

  const truncateDescription = (text) => {
    if (!text) return ''
    if (text.length <= MAX_DESCRIPTION_LENGTH) return text
    return text.substring(0, MAX_DESCRIPTION_LENGTH) + '...'
  }

  const photoUri = photo
    ? getPhotoUri(typeof photo === 'object' ? photo.path : photo)
    : null

  return (
    <TouchableOpacity style={styles.card} activeOpacity={0.9} onPress={onPress}>
      {/* Изображение поста */}
      {photoUri && (
        <Image
          source={typeof photoUri === 'string' ? { uri: photoUri } : photoUri}
          style={styles.image}
          resizeMode="cover"
        />
      )}

      {/* Контент поста */}
      <View style={styles.content}>
        {/* Информация о пользователе и дате */}
        <View style={styles.userInfoRow}>
          <View style={styles.userInfo}>
            {authorAvatar ? (
              <Image
                source={
                  typeof authorAvatar === 'string'
                    ? { uri: authorAvatar }
                    : authorAvatar
                }
                style={styles.avatar}
              />
            ) : (
              <Image
                source={require('@assets/avatar.png')}
                style={styles.avatar}
              />
            )}
            <AppText style={styles.authorName}>{post?.author_name}</AppText>
          </View>
          <AppText style={styles.date}>{formatDate(post?.event_date)}</AppText>
        </View>
        <View style={styles.postInfoRow}>
          {/* Адрес */}
          {post?.address && (
            <AppText style={styles.address}>{post.address}</AppText>
          )}

          {/* Текст поста */}
          {post?.description && (
            <AppText style={styles.postText}>
              {truncateDescription(post.description)}
            </AppText>
          )}

          {/* Действия */}
          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.contactButton}
              onPress={(e) => {
                e.stopPropagation()
                onContactPress?.()
              }}
            >
              <AppText style={styles.contactButtonText}>Связаться</AppText>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.commentsLink}
              onPress={(e) => {
                e.stopPropagation()
                onCommentsPress?.()
              }}
            >
              <AppText style={styles.commentsText}>
                Комментарии({post?.comments_count || 0})
              </AppText>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.bookmarkButton}
              onPress={(e) => {
                e.stopPropagation()
                onBookmarkPress?.()
              }}
            >
              <Image
                source={
                  isFavorite
                    ? require('@assets/bookmark.png')
                    : require('@assets/bookmark-empty.png')
                }
                style={styles.bookmarkIcon}
              />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: 20,
    marginVertical: 8,
    marginHorizontal: 16,
    overflow: 'hidden',
    shadowColor: colors.fullBlack,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  image: {
    width: '100%',
    height: 200,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  content: {
    padding: 16,
  },
  postInfoRow: {
    paddingHorizontal: 24,
  },
  userInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 14,
    height: 14,
    borderRadius: 12,
    marginRight: 8,
  },
  authorName: {
    fontSize: 14,
    color: colors.fullBlack,
    fontFamily: 'Cruinn-Regular',
  },
  date: {
    fontSize: 14,
    color: colors.fullBlack,
    fontFamily: 'Cruinn-Regular',
  },
  address: {
    fontSize: 14,
    color: colors.yellowGreen,
    marginBottom: 12,
    fontFamily: 'Cruinn-Bold',
  },
  postText: {
    fontSize: 14,
    color: colors.fullBlack,
    marginBottom: 16,
    lineHeight: 20,
    fontFamily: 'Cruinn-Regular',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  contactButton: {
    backgroundColor: colors.orange,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 24,
    flex: 1,
    marginRight: 12,
  },
  contactButtonText: {
    color: colors.white,
    fontSize: 12,
    textAlign: 'center',
    fontFamily: 'Unbounded-Regular',
  },
  commentsLink: {
    marginRight: 12,
  },
  commentsText: {
    fontSize: 14,
    color: colors.orange,
    fontFamily: 'Cruinn-Regular',
  },
  bookmarkButton: {
    padding: 4,
  },
  bookmarkIcon: {
    width: 24,
    height: 24,
  },
})

export default PostCard
