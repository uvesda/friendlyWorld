import { AppText } from '@components/AppText/AppText'
import AnimateHeader from '@components/Layout/AnimateHeader'
import AppLayout from '@components/Layout/AppLayout'
import { useState } from 'react'
import { View, useWindowDimensions } from 'react-native'
import { SceneMap, TabView } from 'react-native-tab-view'

const FeedRoute = () => (
  <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
    <AppText>Лента</AppText>
  </View>
)

const MapRoute = () => (
  <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
    <AppText>Карта</AppText>
  </View>
)

const renderScene = SceneMap({
  feed: FeedRoute,
  map: MapRoute,
})

const PostsScreen = () => {
  const layout = useWindowDimensions()
  const [index, setIndex] = useState(0)
  const [routes] = useState([
    { key: 'feed', title: 'Лента' },
    { key: 'map', title: 'Карта' },
  ])

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
          />
        )}
      />
    </AppLayout>
  )
}

export default PostsScreen
