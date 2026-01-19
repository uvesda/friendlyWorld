import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
} from 'react-native'
import {
  BottomSheetModal,
  BottomSheetBackdrop,
} from '@gorhom/bottom-sheet'
import { colors } from '@assets/index'
import { AppText } from '@components/AppText/AppText'

const CustomDatePicker = ({
  visible,
  value,
  onConfirm,
  onCancel,
  minimumDate,
  maximumDate,
  useModal = false, // Если true, использует BottomSheetModal (для использования внутри других BottomSheet)
}) => {
  const [selectedDate, setSelectedDate] = useState(() => {
    const initialValue = value instanceof Date ? new Date(value) : (value ? new Date(value) : new Date())
    return initialValue
  })
  const bottomSheetModalRef = useRef(null)
  const yearScrollRef = useRef(null)
  const monthScrollRef = useRef(null)
  const dayScrollRef = useRef(null)
  const hourScrollRef = useRef(null)
  const minuteScrollRef = useRef(null)
  const isInitializedRef = useRef(false)

  const snapPoints = useMemo(() => ['60%'], [])

  // Функция для ограничения даты текущей датой
  const clampToCurrentDate = useCallback((date) => {
    const now = new Date()
    if (date > now) {
      return new Date(now)
    }
    return date
  }, [])

  // Инициализируем дату только при открытии пикера
  useEffect(() => {
    if (visible && !isInitializedRef.current) {
      const newDate = value instanceof Date ? new Date(value) : (value ? new Date(value) : new Date())
      const clampedDate = clampToCurrentDate(newDate)
      setSelectedDate(clampedDate)
      isInitializedRef.current = true
    } else if (!visible) {
      isInitializedRef.current = false
      hasScrolledRef.current = false
    }
  }, [visible, value, clampToCurrentDate])

  // Открываем/закрываем BottomSheet
  useEffect(() => {
    if (visible) {
      const timeoutId = setTimeout(() => {
        const ref = bottomSheetModalRef.current
        if (ref && typeof ref.present === 'function') {
          try {
            ref.present()
          } catch (error) {
            console.error('Error presenting date picker:', error)
          }
        }
      }, useModal ? 300 : 100)
      return () => clearTimeout(timeoutId)
    } else {
      const ref = bottomSheetModalRef.current
      if (ref && typeof ref.dismiss === 'function') {
        try {
          ref.dismiss()
        } catch (error) {
          // Игнорируем ошибки при закрытии
        }
      }
    }
  }, [visible, useModal])

  const handleSheetChanges = useCallback((index) => {
    if (index === -1) {
      setSelectedDate(value || new Date())
      onCancel()
    }
  }, [onCancel, value])

  // Получаем текущую дату/время
  const now = useMemo(() => new Date(), [])
  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth() + 1 // 1-12
  const currentDay = now.getDate()
  const currentHour = now.getHours()
  const currentMinute = now.getMinutes()

  // Фильтруем годы - только до текущего года включительно
  const years = useMemo(() => {
    return Array.from({ length: 51 }, (_, i) => currentYear - 50 + i)
      .filter(year => year <= currentYear)
  }, [currentYear])

  // Фильтруем месяцы - если выбран текущий год, показываем только до текущего месяца
  const months = useMemo(() => {
    const selectedYear = selectedDate.getFullYear()
    if (selectedYear === currentYear) {
      return Array.from({ length: currentMonth }, (_, i) => i + 1)
    }
    return Array.from({ length: 12 }, (_, i) => i + 1)
  }, [selectedDate.getFullYear(), currentYear, currentMonth])
  
  const daysInMonth = useMemo(() => {
    return new Date(
      selectedDate.getFullYear(),
      selectedDate.getMonth() + 1,
      0
    ).getDate()
  }, [selectedDate.getFullYear(), selectedDate.getMonth()])
  
  // Фильтруем дни - если выбран текущий год и месяц, показываем только до текущего дня
  const days = useMemo(() => {
    const selectedYear = selectedDate.getFullYear()
    const selectedMonth = selectedDate.getMonth() + 1
    const maxDays = daysInMonth
    
    if (selectedYear === currentYear && selectedMonth === currentMonth) {
      return Array.from({ length: currentDay }, (_, i) => i + 1)
    }
    return Array.from({ length: maxDays }, (_, i) => i + 1)
  }, [selectedDate.getFullYear(), selectedDate.getMonth(), daysInMonth, currentYear, currentMonth, currentDay])
  
  // Фильтруем часы - если выбрана текущая дата, показываем только до текущего часа
  const hours = useMemo(() => {
    const selectedYear = selectedDate.getFullYear()
    const selectedMonth = selectedDate.getMonth() + 1
    const selectedDay = selectedDate.getDate()
    
    if (
      selectedYear === currentYear &&
      selectedMonth === currentMonth &&
      selectedDay === currentDay
    ) {
      return Array.from({ length: currentHour + 1 }, (_, i) => i)
    }
    return Array.from({ length: 24 }, (_, i) => i)
  }, [selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate(), currentYear, currentMonth, currentDay, currentHour])
  
  // Фильтруем минуты - если выбрана текущая дата и час, показываем только до текущих минут
  const minutes = useMemo(() => {
    const selectedYear = selectedDate.getFullYear()
    const selectedMonth = selectedDate.getMonth() + 1
    const selectedDay = selectedDate.getDate()
    const selectedHour = selectedDate.getHours()
    
    if (
      selectedYear === currentYear &&
      selectedMonth === currentMonth &&
      selectedDay === currentDay &&
      selectedHour === currentHour
    ) {
      return Array.from({ length: currentMinute + 1 }, (_, i) => i)
    }
    return Array.from({ length: 60 }, (_, i) => i)
  }, [selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate(), selectedDate.getHours(), currentYear, currentMonth, currentDay, currentHour, currentMinute])

  const getItemHeight = 40
  const getScrollOffset = (index) => index * getItemHeight

  const scrollToIndex = (scrollViewRef, index, items) => {
    if (scrollViewRef.current && index >= 0 && index < items.length) {
      scrollViewRef.current.scrollTo({
        y: getScrollOffset(index),
        animated: true,
      })
    }
  }

  // Прокручиваем к начальной позиции только один раз при открытии
  const hasScrolledRef = useRef(false)
  useEffect(() => {
    if (visible && isInitializedRef.current && !hasScrolledRef.current) {
      // Прокручиваем к текущим значениям только при первом открытии
      hasScrolledRef.current = true
      setTimeout(() => {
        const yearIndex = years.indexOf(selectedDate.getFullYear())
        const monthIndex = months.indexOf(selectedDate.getMonth() + 1) !== -1 
          ? months.indexOf(selectedDate.getMonth() + 1) 
          : months.length - 1
        const dayIndex = Math.min(selectedDate.getDate() - 1, days.length - 1)
        const hourIndex = Math.min(selectedDate.getHours(), hours.length - 1)
        const minuteIndex = Math.min(selectedDate.getMinutes(), minutes.length - 1)

        if (yearIndex >= 0) scrollToIndex(yearScrollRef, yearIndex, years)
        if (monthIndex >= 0) scrollToIndex(monthScrollRef, monthIndex, months)
        if (dayIndex >= 0) scrollToIndex(dayScrollRef, dayIndex, days)
        if (hourIndex >= 0) scrollToIndex(hourScrollRef, hourIndex, hours)
        if (minuteIndex >= 0) scrollToIndex(minuteScrollRef, minuteIndex, minutes)
      }, 300)
    } else if (!visible) {
      hasScrolledRef.current = false
    }
  }, [visible, years, months, days, hours, minutes])

  const handleScroll = useCallback((type, index, items) => {
    const newDate = new Date(selectedDate)
    
    switch (type) {
      case 'year':
        newDate.setFullYear(items[index])
        // Проверяем, что день валиден для нового месяца
        const maxDay = new Date(items[index], newDate.getMonth() + 1, 0).getDate()
        if (newDate.getDate() > maxDay) {
          newDate.setDate(maxDay)
        }
        // Если выбран текущий год, ограничиваем месяц
        if (items[index] === currentYear && newDate.getMonth() + 1 > currentMonth) {
          newDate.setMonth(currentMonth - 1)
        }
        // Если выбран текущий год и месяц, ограничиваем день
        if (items[index] === currentYear && newDate.getMonth() + 1 === currentMonth && newDate.getDate() > currentDay) {
          newDate.setDate(currentDay)
        }
        // Если выбран текущий год, месяц и день, ограничиваем час
        if (
          items[index] === currentYear &&
          newDate.getMonth() + 1 === currentMonth &&
          newDate.getDate() === currentDay &&
          newDate.getHours() > currentHour
        ) {
          newDate.setHours(currentHour)
        }
        // Если выбран текущий год, месяц, день и час, ограничиваем минуты
        if (
          items[index] === currentYear &&
          newDate.getMonth() + 1 === currentMonth &&
          newDate.getDate() === currentDay &&
          newDate.getHours() === currentHour &&
          newDate.getMinutes() > currentMinute
        ) {
          newDate.setMinutes(currentMinute)
        }
        break
      case 'month':
        // items содержит значения 1-12, а setMonth принимает 0-11
        const monthValue = items[index]
        newDate.setMonth(monthValue - 1)
        // Проверяем, что день валиден для нового месяца
        const maxDayInMonth = new Date(newDate.getFullYear(), monthValue, 0).getDate()
        if (newDate.getDate() > maxDayInMonth) {
          newDate.setDate(maxDayInMonth)
        }
        // Если выбран текущий год и месяц, ограничиваем день
        if (newDate.getFullYear() === currentYear && monthValue === currentMonth && newDate.getDate() > currentDay) {
          newDate.setDate(currentDay)
        }
        // Если выбран текущий год, месяц и день, ограничиваем час
        if (
          newDate.getFullYear() === currentYear &&
          monthValue === currentMonth &&
          newDate.getDate() === currentDay &&
          newDate.getHours() > currentHour
        ) {
          newDate.setHours(currentHour)
        }
        // Если выбран текущий год, месяц, день и час, ограничиваем минуты
        if (
          newDate.getFullYear() === currentYear &&
          monthValue === currentMonth &&
          newDate.getDate() === currentDay &&
          newDate.getHours() === currentHour &&
          newDate.getMinutes() > currentMinute
        ) {
          newDate.setMinutes(currentMinute)
        }
        break
      case 'day':
        newDate.setDate(index + 1)
        // Если выбран текущий год, месяц и день, ограничиваем час
        if (
          newDate.getFullYear() === currentYear &&
          newDate.getMonth() + 1 === currentMonth &&
          index + 1 === currentDay &&
          newDate.getHours() > currentHour
        ) {
          newDate.setHours(currentHour)
        }
        // Если выбран текущий год, месяц, день и час, ограничиваем минуты
        if (
          newDate.getFullYear() === currentYear &&
          newDate.getMonth() + 1 === currentMonth &&
          index + 1 === currentDay &&
          newDate.getHours() === currentHour &&
          newDate.getMinutes() > currentMinute
        ) {
          newDate.setMinutes(currentMinute)
        }
        break
      case 'hour':
        newDate.setHours(index)
        // Если выбран текущий год, месяц, день и час, ограничиваем минуты
        if (
          newDate.getFullYear() === currentYear &&
          newDate.getMonth() + 1 === currentMonth &&
          newDate.getDate() === currentDay &&
          index === currentHour &&
          newDate.getMinutes() > currentMinute
        ) {
          newDate.setMinutes(currentMinute)
        }
        break
      case 'minute':
        newDate.setMinutes(index)
        break
    }
    
    // Финальная проверка - ограничиваем дату текущей датой
    const clampedDate = clampToCurrentDate(newDate)
    // Обновляем только если дата действительно изменилась
    if (clampedDate.getTime() !== selectedDate.getTime()) {
      setSelectedDate(clampedDate)
    }
  }, [selectedDate, currentYear, currentMonth, currentDay, currentHour, currentMinute, clampToCurrentDate])

  const handleConfirm = () => {
    const ref = bottomSheetModalRef.current
    if (ref && typeof ref.dismiss === 'function') {
      try {
        ref.dismiss()
      } catch (error) {
        // Игнорируем ошибки
      }
    }
    // Убеждаемся, что выбранная дата не в будущем
    const finalDate = clampToCurrentDate(selectedDate)
    onConfirm(finalDate)
  }

  const handleCancel = () => {
    setSelectedDate(value || new Date())
    const ref = bottomSheetModalRef.current
    if (ref && typeof ref.dismiss === 'function') {
      try {
        ref.dismiss()
      } catch (error) {
        // Игнорируем ошибки
      }
    }
    onCancel()
  }

  const handleDismiss = useCallback(() => {
    setSelectedDate(value || new Date())
    onCancel()
  }, [onCancel, value])

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

  const renderPickerColumn = (
    items,
    selectedIndex,
    type,
    scrollRef,
    formatItem = (item) => String(item).padStart(2, '0')
  ) => {
    return (
      <View style={styles.pickerColumn}>
        {/* Визуальные индикаторы выбранного элемента */}
        <View style={styles.selectionIndicator} pointerEvents="none">
          <View style={styles.selectionLine} />
        </View>
        <ScrollView
          ref={scrollRef}
          style={styles.pickerScrollView}
          contentContainerStyle={styles.pickerScrollContent}
          showsVerticalScrollIndicator={false}
          snapToInterval={getItemHeight}
          decelerationRate="fast"
          nestedScrollEnabled={true}
          scrollEnabled={true}
          bounces={false}
          scrollEventThrottle={16}
          onScrollBeginDrag={() => {}}
          onScrollEndDrag={(event) => {
            const offsetY = event.nativeEvent.contentOffset.y
            const index = Math.round(offsetY / getItemHeight)
            const clampedIndex = Math.max(0, Math.min(index, items.length - 1))
            scrollToIndex(scrollRef, clampedIndex, items)
          }}
          onMomentumScrollEnd={(event) => {
            const offsetY = event.nativeEvent.contentOffset.y
            const index = Math.round(offsetY / getItemHeight)
            const clampedIndex = Math.max(0, Math.min(index, items.length - 1))
            handleScroll(type, clampedIndex, items)
            scrollToIndex(scrollRef, clampedIndex, items)
          }}
        >
          {items.map((item, index) => {
            const isSelected = index === selectedIndex
            return (
              <View
                key={`${type}-${index}`}
                style={[
                  styles.pickerItem,
                  { height: getItemHeight },
                ]}
              >
                <AppText
                  style={[
                    styles.pickerItemText,
                    isSelected && styles.pickerItemTextSelected,
                  ]}
                >
                  {formatItem(item)}
                </AppText>
              </View>
            )
          })}
        </ScrollView>
      </View>
    )
  }

  const selectedYearIndex = years.indexOf(selectedDate.getFullYear())
  const selectedMonthIndex = months.indexOf(selectedDate.getMonth() + 1) !== -1 
    ? months.indexOf(selectedDate.getMonth() + 1) 
    : Math.max(0, months.length - 1)
  const selectedDayIndex = Math.min(selectedDate.getDate() - 1, days.length - 1)
  const selectedHourIndex = Math.min(selectedDate.getHours(), hours.length - 1)
  const selectedMinuteIndex = Math.min(selectedDate.getMinutes(), minutes.length - 1)

  const content = (
    <View style={styles.contentContainer}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleCancel} style={styles.cancelButton}>
          <AppText style={styles.cancelButtonText}>Отмена</AppText>
        </TouchableOpacity>
        <AppText style={styles.headerTitle}>Выберите дату и время</AppText>
        <TouchableOpacity onPress={handleConfirm} style={styles.confirmButton}>
          <AppText style={styles.confirmButtonText}>Готово</AppText>
        </TouchableOpacity>
      </View>

      <View style={styles.pickerContainer}>
        {renderPickerColumn(
          years,
          selectedYearIndex,
          'year',
          yearScrollRef,
          (year) => String(year)
        )}
        {renderPickerColumn(
          months,
          selectedMonthIndex,
          'month',
          monthScrollRef
        )}
        {renderPickerColumn(
          days,
          selectedDayIndex,
          'day',
          dayScrollRef
        )}
        <View style={styles.separator} />
        {renderPickerColumn(
          hours,
          selectedHourIndex,
          'hour',
          hourScrollRef
        )}
        <AppText style={styles.separatorText}>:</AppText>
        {renderPickerColumn(
          minutes,
          selectedMinuteIndex,
          'minute',
          minuteScrollRef
        )}
      </View>
    </View>
  )

  return (
    <BottomSheetModal
      ref={bottomSheetModalRef}
      index={0}
      snapPoints={snapPoints}
      onChange={handleSheetChanges}
      onDismiss={handleDismiss}
      enablePanDownToClose={true}
      enableDynamicSizing={false}
      topInset={0}
      backgroundStyle={styles.bottomSheetBackground}
      handleIndicatorStyle={styles.handleIndicator}
      backdropComponent={renderBackdrop}
      keyboardBehavior={Platform.OS === 'ios' ? 'fillParent' : 'interactive'}
      keyboardBlurBehavior="restore"
      android_keyboardInputMode="adjustResize"
      enableBlurKeyboardOnGesture={true}
      enableContentPanningGesture={false}
      enableHandlePanningGesture={true}
      animateOnMount={true}
    >
      {content}
    </BottomSheetModal>
  )
}

const styles = StyleSheet.create({
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
  contentContainer: {
    paddingBottom: 40,
  },
  pickerScrollView: {
    flex: 1,
  },
  pickerScrollContent: {
    paddingVertical: 80,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray + '20',
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: 'Unbounded-Regular',
    color: colors.fullBlack,
    flex: 1,
    textAlign: 'center',
  },
  cancelButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  cancelButtonText: {
    fontSize: 16,
    color: colors.gray,
    fontFamily: 'Cruinn-Regular',
  },
  confirmButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  confirmButtonText: {
    fontSize: 16,
    color: colors.lowOrange,
    fontFamily: 'Cruinn-Regular',
    fontWeight: 'bold',
  },
  pickerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    paddingHorizontal: 10,
  },
  pickerColumn: {
    height: 200,
    marginHorizontal: 4,
    position: 'relative',
  },
  selectionIndicator: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    pointerEvents: 'none',
    zIndex: 1,
  },
  selectionLine: {
    width: '100%',
    height: 40,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.lowOrange + '40',
    backgroundColor: colors.lowOrange + '10',
  },
  pickerItem: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  pickerItemText: {
    fontSize: 18,
    color: colors.gray,
    fontFamily: 'Cruinn-Regular',
  },
  pickerItemTextSelected: {
    fontSize: 20,
    color: colors.lowOrange,
    fontFamily: 'Cruinn-Regular',
    fontWeight: 'bold',
  },
  separator: {
    width: 1,
    height: 200,
    backgroundColor: colors.gray + '40',
    marginHorizontal: 8,
  },
  separatorText: {
    fontSize: 24,
    color: colors.fullBlack,
    fontFamily: 'Cruinn-Regular',
    marginHorizontal: 4,
  },
})

export default CustomDatePicker
