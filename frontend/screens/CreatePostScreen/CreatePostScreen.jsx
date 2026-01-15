import React, { useState } from 'react'
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  Platform,
  KeyboardAvoidingView,
} from 'react-native'
import * as ImagePicker from 'expo-image-picker'
import { useForm, Controller } from 'react-hook-form'
import { backgrounds, colors } from '@assets/index'
import { AppText } from '@components/AppText/AppText'
import { TextInputField } from '@components/TextInputField/TextInputField'
import { ButtonPrimary } from '@components/ButtonPrimary/ButtonPrimary'
import AppLayout from '@components/Layout/AppLayout'
import Header from '@components/Layout/Header'
import { postApi } from '@entities/postApi/postApi'
import { getServerErrorMessage } from '@utils/getServerErrorMessage'

const CreatePostScreen = ({ navigation }) => {
  const [selectedImages, setSelectedImages] = useState([])
  const [uploading, setUploading] = useState(false)

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      status: 'lost',
      description: '',
      event_date: new Date(),
      address: '',
      hashtag: '',
      latitude: '',
      longitude: '',
    },
  })

  const eventDate = watch('event_date')
  const status = watch('status')

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (status !== 'granted') {
      Alert.alert(
        'Необходимо разрешение',
        'Для добавления фотографий необходимо разрешение на доступ к галерее'
      )
      return
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.8,
      selectionLimit: 5,
    })

    if (!result.canceled && result.assets) {
      const newImages = result.assets.map((asset) => ({
        uri: asset.uri,
        type: asset.type || 'image',
        name: asset.fileName || `photo_${Date.now()}.jpg`,
      }))
      setSelectedImages((prev) => [...prev, ...newImages].slice(0, 5))
    }
  }

  const removeImage = (index) => {
    setSelectedImages((prev) => prev.filter((_, i) => i !== index))
  }

  const formatDate = (date) => {
    if (!date) return ''
    const d = new Date(date)
    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    const hours = String(d.getHours()).padStart(2, '0')
    const minutes = String(d.getMinutes()).padStart(2, '0')
    return `${year}-${month}-${day} ${hours}:${minutes}`
  }

  const onSubmit = async (data) => {
    if (selectedImages.length === 0) {
      Alert.alert('Ошибка', 'Добавьте хотя бы одну фотографию')
      return
    }

    setUploading(true)
    try {
      const postData = {
        status: data.status,
        description: data.description || null,
        event_date: formatDate(data.event_date),
        address: data.address,
        latitude: parseFloat(data.latitude) || 0,
        longitude: parseFloat(data.longitude) || 0,
        hashtag: data.hashtag,
      }

      const response = await postApi.create(postData)
      const postId = response.data?.id || response.id

      if (!postId) {
        throw new Error('Не удалось получить ID созданного поста')
      }

      const formData = new FormData()
      selectedImages.forEach((image, index) => {
        formData.append('photos', {
          uri: image.uri,
          type: image.type || 'image/jpeg',
          name: image.name || `photo_${index}.jpg`,
        })
      })

      await postApi.uploadPhotos(postId, formData)

      Alert.alert('Успех', 'Пост успешно создан', [
        {
          text: 'OK',
          onPress: () => {
            navigation.goBack()
          },
        },
      ])
    } catch (e) {
      console.error('Ошибка создания поста', e)
      Alert.alert('Ошибка', getServerErrorMessage(e))
    } finally {
      setUploading(false)
    }
  }

  return (
    <AppLayout
      header={<Header />}
      hasHeader={true}
      background={backgrounds.hourglassProfile}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Статус поста (lost/found) */}
          <View style={styles.statusContainer}>
            <TouchableOpacity
              style={[
                styles.statusButton,
                status === 'lost' && styles.statusButtonActive,
              ]}
              onPress={() => setValue('status', 'lost')}
            >
              <AppText
                style={[
                  styles.statusButtonText,
                  status === 'lost' && styles.statusButtonTextActive,
                ]}
              >
                Потеряно
              </AppText>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.statusButton,
                status === 'found' && styles.statusButtonActive,
              ]}
              onPress={() => setValue('status', 'found')}
            >
              <AppText
                style={[
                  styles.statusButtonText,
                  status === 'found' && styles.statusButtonTextActive,
                ]}
              >
                Найдено
              </AppText>
            </TouchableOpacity>
          </View>

          {/* Описание */}
          <Controller
            control={control}
            name="description"
            rules={{ required: 'Описание обязательно' }}
            render={({ field: { onChange, onBlur, value } }) => (
              <View>
                <TextInputField
                  placeholder="Описание"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  multiline
                  numberOfLines={4}
                  style={styles.descriptionInput}
                />
                {errors.description && (
                  <AppText style={styles.errorText}>
                    {errors.description.message}
                  </AppText>
                )}
              </View>
            )}
          />

          {/* Дата события */}
          <View>
            <Controller
              control={control}
              name="event_date"
              rules={{ required: 'Дата события обязательна' }}
              render={({ field: { onChange, value } }) => (
                <>
                  <TextInputField
                    placeholder="Дата события (ГГГГ-ММ-ДД ЧЧ:ММ) *"
                    value={value ? formatDate(value) : ''}
                    onChangeText={(text) => {
                      // Парсим дату из строки формата "YYYY-MM-DD HH:MM"
                      const dateMatch = text.match(
                        /(\d{4})-(\d{2})-(\d{2})\s+(\d{2}):(\d{2})/
                      )
                      if (dateMatch) {
                        const [, year, month, day, hours, minutes] = dateMatch
                        const date = new Date(
                          parseInt(year),
                          parseInt(month) - 1,
                          parseInt(day),
                          parseInt(hours),
                          parseInt(minutes)
                        )
                        if (!isNaN(date.getTime())) {
                          onChange(date)
                        }
                      }
                    }}
                    keyboardType="numeric"
                  />
                  <AppText style={styles.hintText}>
                    Формат: ГГГГ-ММ-ДД ЧЧ:ММ (например: 2025-10-11 14:30)
                  </AppText>
                </>
              )}
            />
            {errors.event_date && (
              <AppText style={styles.errorText}>
                {errors.event_date.message}
              </AppText>
            )}
          </View>

          {/* Адрес */}
          <Controller
            control={control}
            name="address"
            rules={{ required: 'Адрес обязателен' }}
            render={({ field: { onChange, onBlur, value } }) => (
              <View>
                <TextInputField
                  placeholder="Адрес *"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                />
                {errors.address && (
                  <AppText style={styles.errorText}>
                    {errors.address.message}
                  </AppText>
                )}
              </View>
            )}
          />

          {/* Координаты */}
          <View style={styles.coordinatesRow}>
            <Controller
              control={control}
              name="latitude"
              render={({ field: { onChange, onBlur, value } }) => (
                <View style={styles.coordinateInput}>
                  <TextInputField
                    placeholder="Широта"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    keyboardType="numeric"
                  />
                </View>
              )}
            />
            <Controller
              control={control}
              name="longitude"
              render={({ field: { onChange, onBlur, value } }) => (
                <View style={styles.coordinateInput}>
                  <TextInputField
                    placeholder="Долгота"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    keyboardType="numeric"
                  />
                </View>
              )}
            />
          </View>

          {/* Хештег */}
          <Controller
            control={control}
            name="hashtag"
            rules={{ required: 'Хештег обязателен' }}
            render={({ field: { onChange, onBlur, value } }) => (
              <View>
                <TextInputField
                  placeholder="Хештег *"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                />
                {errors.hashtag && (
                  <AppText style={styles.errorText}>
                    {errors.hashtag.message}
                  </AppText>
                )}
              </View>
            )}
          />

          {/* Фотографии */}
          <View style={styles.photosSection}>
            <AppText style={styles.sectionTitle}>Фотографии</AppText>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.photosContainer}
            >
              {selectedImages.map((image, index) => (
                <View key={index} style={styles.photoItem}>
                  <Image source={{ uri: image.uri }} style={styles.photo} />
                  <TouchableOpacity
                    style={styles.removeButton}
                    onPress={() => removeImage(index)}
                  >
                    <AppText style={styles.removeButtonText}>✕</AppText>
                  </TouchableOpacity>
                </View>
              ))}
              {selectedImages.length < 5 && (
                <TouchableOpacity
                  style={styles.addPhotoButton}
                  onPress={pickImage}
                >
                  <AppText style={styles.addPhotoButtonText}>+</AppText>
                  <AppText style={styles.addPhotoButtonLabel}>Добавить</AppText>
                </TouchableOpacity>
              )}
            </ScrollView>
            {selectedImages.length === 0 && (
              <AppText style={styles.errorText}>
                Добавьте хотя бы одну фотографию
              </AppText>
            )}
          </View>

          {/* Кнопка создания */}
          <ButtonPrimary
            title="Создать пост"
            onPress={handleSubmit(onSubmit)}
            disabled={uploading || isSubmitting}
            loading={uploading || isSubmitting}
            style={styles.submitButton}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </AppLayout>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  statusContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  statusButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.green,
    backgroundColor: colors.white,
    alignItems: 'center',
  },
  statusButtonActive: {
    backgroundColor: colors.green,
  },
  statusButtonText: {
    fontSize: 14,
    color: colors.green,
    fontFamily: 'Unbounded-Regular',
  },
  statusButtonTextActive: {
    color: colors.white,
  },
  descriptionInput: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  dateButton: {
    borderWidth: 1,
    borderColor: colors.lowOrange,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: colors.white,
    marginBottom: 16,
  },
  dateButtonText: {
    fontSize: 16,
    color: colors.fullBlack,
    fontFamily: 'Cruinn-Regular',
  },
  coordinatesRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  coordinateInput: {
    flex: 1,
  },
  photosSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    color: colors.fullBlack,
    fontFamily: 'Unbounded-Regular',
    marginBottom: 12,
  },
  photosContainer: {
    flexDirection: 'row',
  },
  photoItem: {
    marginRight: 12,
    position: 'relative',
  },
  photo: {
    width: 100,
    height: 100,
    borderRadius: 12,
  },
  removeButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.orange,
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeButtonText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: 'bold',
  },
  addPhotoButton: {
    width: 100,
    height: 100,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.lowGreen,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.white,
  },
  addPhotoButtonText: {
    fontSize: 32,
    color: colors.gray,
    marginBottom: 4,
  },
  addPhotoButtonLabel: {
    fontSize: 12,
    color: colors.gray,
    fontFamily: 'Cruinn-Regular',
  },
  submitButton: {
    marginTop: 8,
  },
  errorText: {
    color: colors.orange,
    fontSize: 12,
    marginTop: -12,
    marginBottom: 8,
    marginLeft: 4,
    fontFamily: 'Cruinn-Regular',
  },
  hintText: {
    color: colors.gray,
    fontSize: 12,
    marginTop: -12,
    marginBottom: 16,
    marginLeft: 4,
    fontFamily: 'Cruinn-Regular',
  },
})

export default CreatePostScreen
