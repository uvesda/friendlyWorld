import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
  Dimensions,
  Alert,
} from 'react-native'
import BottomSheet, {
  BottomSheetScrollView,
  BottomSheetBackdrop,
} from '@gorhom/bottom-sheet'
import { colors } from '@assets/index'
import { AppText } from '@components/AppText/AppText'
import { postApi } from '@entities/postApi/postApi'
import { getServerErrorMessage } from '@utils/getServerErrorMessage'
import ImageViewer from '@components/ImageViewer/ImageViewer'

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window')

const PostBottomSheet = ({
  post,
  isFavorite,
  onClose,
  onFavoriteToggle,
  onContactPress,
  scrollToComments = false,
}) => {
  const [photos, setPhotos] = useState([])
  const [comments, setComments] = useState([])
  const [loading, setLoading] = useState(false)
  const [commentText, setCommentText] = useState('')
  const [sendingComment, setSendingComment] = useState(false)
  const [selectedImageIndex, setSelectedImageIndex] = useState(null)
  const [isImageViewerVisible, setIsImageViewerVisible] = useState(false)
  const [sheetIndex, setSheetIndex] = useState(-1)
  const bottomSheetRef = useRef(null)
  const scrollViewRef = useRef(null)
  const commentsRef = useRef(null)

  const snapPoints = useMemo(() => [SCREEN_HEIGHT * 0.9], [])

  const loadPostData = useCallback(async () => {
    if (!post?.id) return

    setLoading(true)
    try {
      const [photosRes, commentsRes] = await Promise.all([
        postApi.getPhotos(post.id),
        postApi.getComments(post.id),
      ])

      setPhotos(photosRes.data || [])
      setComments(commentsRes.data || [])
    } catch (e) {
      console.error('Ошибка загрузки данных поста', e)
    } finally {
      setLoading(false)
    }
  }, [post?.id])

  useEffect(() => {
    if (post?.id) {
      loadPostData()
      setTimeout(() => {
        if (bottomSheetRef.current) {
          bottomSheetRef.current.snapToIndex(0)
        }
      }, 100)
    } else {
      if (bottomSheetRef.current) {
        bottomSheetRef.current.close()
      }
    }
  }, [post?.id, loadPostData])

  useEffect(() => {
    if (
      post &&
      scrollToComments &&
      !loading &&
      commentsRef.current &&
      scrollViewRef.current
    ) {
      const timer = setTimeout(() => {
        if (commentsRef.current && scrollViewRef.current) {
          commentsRef.current.measureLayout(
            scrollViewRef.current,
            (x, y) => {
              if (scrollViewRef.current) {
                scrollViewRef.current.scrollTo({
                  y: Math.max(0, y - 100),
                  animated: true,
                })
              }
            },
            () => {
              setTimeout(() => {
                scrollViewRef.current?.scrollToEnd({ animated: true })
              }, 200)
            }
          )
        }
      }, 800)
      return () => clearTimeout(timer)
    }
  }, [post, scrollToComments, comments.length, loading])

  const handleSheetChanges = useCallback(
    (index) => {
      setSheetIndex(index)
      if (index === -1) {
        onClose?.()
      }
    },
    [onClose]
  )

  const renderBackdrop = useCallback(
    (props) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.5}
        enableTouchThrough={false}
      />
    ),
    []
  )

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
    if (photoPath.startsWith('http')) return photoPath
    return `${baseURL}${photoPath}`
  }

  const handleImagePress = (index) => {
    setSelectedImageIndex(index)
    setIsImageViewerVisible(true)
  }

  const handleSendComment = async () => {
    if (!commentText.trim() || !post?.id) return

    setSendingComment(true)
    try {
      await postApi.createComment(post.id, commentText.trim())
      setCommentText('')
      loadPostData()
    } catch (e) {
      Alert.alert('Ошибка', getServerErrorMessage(e))
    } finally {
      setSendingComment(false)
    }
  }

  const handleFavoriteToggle = async () => {
    if (!post?.id) return

    try {
      if (isFavorite) {
        await postApi.removeFavorite(post.id)
      } else {
        await postApi.addFavorite(post.id)
      }
      onFavoriteToggle?.()
    } catch (e) {
      Alert.alert('Ошибка', getServerErrorMessage(e))
    }
  }

  if (!post) return null

  const imageUrls = photos
    .map((photo) => getPhotoUri(photo.path))
    .filter(Boolean)

  return (
    <>
      <BottomSheet
        ref={bottomSheetRef}
        index={-1}
        snapPoints={snapPoints}
        onChange={handleSheetChanges}
        enablePanDownToClose
        backgroundStyle={styles.bottomSheetBackground}
        handleIndicatorStyle={styles.handleIndicator}
        backdropComponent={renderBackdrop}
        style={styles.bottomSheet}
      >
        <BottomSheetScrollView
          ref={scrollViewRef}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Фотографии */}
          {photos.length > 0 && (
            <ScrollView
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              style={styles.photosContainer}
            >
              {photos.map((photo, index) => {
                const uri = getPhotoUri(photo.path)
                return uri ? (
                  <TouchableOpacity
                    key={photo.id}
                    activeOpacity={0.9}
                    onPress={() => handleImagePress(index)}
                  >
                    <Image
                      source={{ uri }}
                      style={styles.photo}
                      resizeMode="cover"
                    />
                  </TouchableOpacity>
                ) : null
              })}
            </ScrollView>
          )}

          {/* Информация о посте */}
          <View style={styles.content}>
            <View style={styles.userInfoRow}>
              <View style={styles.userInfo}>
                <Image
                  source={require('@assets/avatar.png')}
                  style={styles.avatar}
                />
                <AppText style={styles.authorName}>{post.author_name}</AppText>
              </View>
              <AppText style={styles.date}>
                {formatDate(post.event_date)}
              </AppText>
            </View>

            {post.address && (
              <AppText style={styles.address}>{post.address}</AppText>
            )}

            {post.description && (
              <AppText style={styles.description}>{post.description}</AppText>
            )}

            {/* Хештег */}
            {post.hashtag && (
              <View style={styles.hashtagContainer}>
                <View style={styles.hashtagBorder}>
                  <AppText style={styles.hashtagText}>#{post.hashtag}</AppText>
                </View>
              </View>
            )}

            {/* Действия */}
            <View style={styles.actions}>
              <TouchableOpacity
                style={styles.contactButton}
                onPress={onContactPress}
              >
                <AppText style={styles.contactButtonText}>Связаться</AppText>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.favoriteButton}
                onPress={handleFavoriteToggle}
              >
                <Image
                  source={
                    isFavorite
                      ? require('@assets/bookmark.png')
                      : require('@assets/bookmark-empty.png')
                  }
                  style={styles.favoriteIcon}
                />
              </TouchableOpacity>
            </View>

            {/* Комментарии */}
            <View ref={commentsRef} style={styles.commentsSection}>
              <AppText style={styles.commentsTitle}>
                Комментарии ({comments.length})
              </AppText>

              {/* Список комментариев */}
              {comments.map((comment) => (
                <View key={comment.id} style={styles.comment}>
                  <AppText style={styles.commentAuthor}>
                    {comment.author_name}
                  </AppText>
                  <AppText style={styles.commentText}>{comment.text}</AppText>
                  <AppText style={styles.commentDate}>
                    {formatDate(comment.created_at)}
                  </AppText>
                </View>
              ))}

              {/* Форма добавления комментария */}
              <View style={styles.commentInputContainer}>
                <TextInput
                  style={styles.commentInput}
                  placeholder="Написать комментарий..."
                  placeholderTextColor={colors.gray}
                  value={commentText}
                  onChangeText={setCommentText}
                  multiline
                />
                <TouchableOpacity
                  style={[
                    styles.sendButton,
                    (!commentText.trim() || sendingComment) &&
                      styles.sendButtonDisabled,
                  ]}
                  onPress={handleSendComment}
                  disabled={!commentText.trim() || sendingComment}
                >
                  <AppText style={styles.sendButtonText}>Отправить</AppText>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </BottomSheetScrollView>
      </BottomSheet>

      <ImageViewer
        visible={isImageViewerVisible}
        images={imageUrls}
        initialIndex={selectedImageIndex}
        onClose={() => setIsImageViewerVisible(false)}
      />
    </>
  )
}

const styles = StyleSheet.create({
  bottomSheet: {
    zIndex: 100,
    elevation: 100,
  },
  bottomSheetBackground: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  handleIndicator: {
    backgroundColor: colors.gray,
    width: 40,
    height: 4,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  photosContainer: {
    height: 300,
  },
  photo: {
    width: SCREEN_WIDTH,
    height: 300,
  },
  content: {
    padding: 16,
  },
  userInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: 8,
  },
  authorName: {
    fontSize: 14,
    color: colors.fullBlack,
    fontFamily: 'Cruinn-Regular',
  },
  date: {
    fontSize: 12,
    color: colors.gray,
    fontFamily: 'Cruinn-Regular',
  },
  address: {
    fontSize: 14,
    color: colors.yellowGreen,
    marginBottom: 12,
    fontFamily: 'Cruinn-Bold',
  },
  hashtagContainer: {
    marginBottom: 12,
  },
  hashtagBorder: {
    borderRadius: 12,
    backgroundColor: colors.green,
    alignSelf: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  hashtagText: {
    fontSize: 12,
    color: colors.fullBlack,
    fontFamily: 'Cruinn-Regular',
  },
  description: {
    fontSize: 14,
    color: colors.fullBlack,
    marginBottom: 16,
    lineHeight: 20,
    fontFamily: 'Cruinn-Regular',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    gap: 12,
  },
  contactButton: {
    backgroundColor: colors.orange,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 24,
    flex: 1,
  },
  contactButtonText: {
    color: colors.white,
    fontSize: 14,
    textAlign: 'center',
    fontFamily: 'Unbounded-Regular',
  },
  favoriteButton: {
    padding: 8,
  },
  favoriteIcon: {
    width: 24,
    height: 24,
  },
  commentsSection: {
    marginTop: 8,
  },
  commentsTitle: {
    fontSize: 16,
    color: colors.fullBlack,
    marginBottom: 16,
    fontFamily: 'Unbounded-Regular',
  },
  comment: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.lowGreen,
  },
  commentAuthor: {
    fontSize: 14,
    color: colors.fullBlack,
    fontWeight: 'bold',
    marginBottom: 4,
    fontFamily: 'Cruinn-Regular',
  },
  commentText: {
    fontSize: 14,
    color: colors.fullBlack,
    marginBottom: 4,
    fontFamily: 'Cruinn-Regular',
  },
  commentDate: {
    fontSize: 12,
    color: colors.gray,
    fontFamily: 'Cruinn-Regular',
  },
  commentInputContainer: {
    marginTop: 16,
  },
  commentInput: {
    borderWidth: 1,
    borderColor: colors.lowGreen,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    color: colors.fullBlack,
    fontFamily: 'Cruinn-Regular',
    minHeight: 50,
    marginBottom: 12,
    textAlignVertical: 'top',
  },
  sendButton: {
    backgroundColor: colors.orange,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: colors.gray,
    opacity: 0.5,
  },
  sendButtonText: {
    color: colors.white,
    fontSize: 14,
    fontFamily: 'Unbounded-Regular',
  },
})

export default PostBottomSheet
