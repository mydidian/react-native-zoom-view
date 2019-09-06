
import * as React from 'react'
import {SafeAreaView, View} from 'react-native'

import ZoomView from './zoom-view'

export default class TestingZoomView extends React.Component<TestingZoomViewProps> {
  render() {
    return (
      <SafeAreaView style={{flex:1, backgroundColor:'white'}}>
        <View style={{flex:1, padding:24}}>
          <View style={{flex:1, backgroundColor:'blue'}}>
            <ZoomView width={2000}>
              <View style={{height:2000, width:2000, backgroundColor:'red'}}>
                <View style={{height:100, width:100, backgroundColor:'yellow'}}/>
              </View>
            </ZoomView>
          </View>
        </View>
      </SafeAreaView>
    )
  }
}
interface TestingZoomViewProps extends React.Props<View> {}