import * as React from 'react'
import {Animated, Easing, StyleSheet, LayoutChangeEvent} from 'react-native'
import {PanGestureHandler, PinchGestureHandler, State} from 'react-native-gesture-handler'

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
  },
  container: {
    flex: 1,
    overflow: 'hidden'
  },
  content: {
    overflow: 'visible'
  }
})
export default class ZoomView extends React.Component<ZoomViewProps, ZoomViewState> {
  panRef = React.createRef<PanGestureHandler>()
  pinchRef = React.createRef<PinchGestureHandler>()

  _baseScale = new Animated.Value(1)
  _pinchScale = new Animated.Value(1)
  _scale = Animated.multiply(this._baseScale, this._pinchScale).interpolate({
    inputRange: [0.25, 1.5],
    outputRange: [0.25, 1.5],
    extrapolate: 'clamp'
  })
  _nonNativeBaseScale = new Animated.Value(1)
  _nonNativePinchScale = new Animated.Value(1)
  _nonNativeScale = Animated.multiply(this._nonNativeBaseScale, this._nonNativePinchScale).interpolate({
    inputRange: [0.25, 1.5],
    outputRange: [0.25, 1.5],
    extrapolate: 'clamp'
  })
  _pinchFocal = {x:new Animated.Value(0), y:new Animated.Value(0)}

  _basePosition = {x:new Animated.Value(0), y:new Animated.Value(0)}
  _translatePosition = {x:new Animated.Value(0), y:new Animated.Value(0)}
  _position = {
    x: Animated.add(this._basePosition.x, Animated.divide(this._translatePosition.x, this._scale)),
    y: Animated.add(this._basePosition.y, Animated.divide(this._translatePosition.y, this._scale))
  }
  _nonNativeBasePosition = {x:new Animated.Value(0), y:new Animated.Value(0)}
  _nonNativeTranslatePosition = {x:new Animated.Value(0), y:new Animated.Value(0)}
  _nonNativePosition = {
    x: Animated.add(this._nonNativeBasePosition.x, Animated.divide(this._nonNativeTranslatePosition.x, this._nonNativeScale)),
    y: Animated.add(this._nonNativeBasePosition.y, Animated.divide(this._nonNativeTranslatePosition.y, this._nonNativeScale))
  }

  constructor(props:ZoomViewProps) {
    super(props)
    this.state = {
      container: {height:undefined, width:undefined},
      content: {height:undefined, width:undefined}
    }
    if(props.setScale) {
      props.setScale(this._scale)
    }
    if(props.setNonNativeScale) {
      props.setNonNativeScale(this._nonNativeScale)
    }
    this._baseScale.addListener(Animated.event([{value:this._nonNativeBaseScale}], {useNativeDriver:false}))
    this._pinchScale.addListener(Animated.event([{value:this._nonNativePinchScale}], {useNativeDriver:false}))
    this._basePosition.x.addListener(Animated.event([{value:this._nonNativeBasePosition.x}], {useNativeDriver:false}))
    this._basePosition.y.addListener(Animated.event([{value:this._nonNativeBasePosition.y}], {useNativeDriver:false}))
    this._translatePosition.x.addListener(Animated.event([{value:this._nonNativeTranslatePosition.x}], {useNativeDriver:false}))
    this._translatePosition.y.addListener(Animated.event([{value:this._nonNativeTranslatePosition.y}], {useNativeDriver:false}))
  }
  componentDidUpdate(prevProps:ZoomViewProps, prevState:ZoomViewState) {
    const {setScale, setNonNativeScale, setPosition, setNonNativePosition} = this.props
    const {container, content} = this.state
    if(setScale && setScale !== prevProps.setScale) {
      setScale(this._scale)
    }
    if(setNonNativeScale && setNonNativeScale !== prevProps.setNonNativeScale) {
      setNonNativeScale(this._nonNativeScale)
    }
    if(setPosition && (setPosition !== prevProps.setPosition || container !== prevState.container || content !== prevState.content)) {
      this.setPosition()
    }
    if(setNonNativePosition && (setNonNativePosition !== prevProps.setNonNativePosition || container !== prevState.container || content !== prevState.content)) {
      this.setNonNativePosition()
    }
  }
  getPosition = (position:{x:Animated.AnimatedInterpolation, y:Animated.AnimatedInterpolation}, scale:Animated.AnimatedInterpolation) => {
    const {container} = this.state
    const translateX = (container.width || 0) / 2
    const translateY = (container.height || 0) / 2
    return {
      x: Animated.add(translateX, Animated.multiply(Animated.subtract(position.x, translateX), scale)),
      y: Animated.add(translateY, Animated.multiply(Animated.subtract(position.y, translateY), scale))
    }
  }
  setPosition = () => {
    this.props.setPosition(this.getPosition(this._position, this._scale))
  }
  setNonNativePosition = () => {
    this.props.setNonNativePosition(this.getPosition(this._nonNativePosition, this._nonNativeScale))
  }
  setContainerDimension = (event:LayoutChangeEvent) => {
    let {height, width} = event.nativeEvent.layout
    this.setState({container:{height, width}})
  }
  setContentDimension = (event:LayoutChangeEvent) => {
    let {height, width} = event.nativeEvent.layout
    this.setState({content:{height, width}})
  }
  onPinchGestureEvent = Animated.event(
    [{nativeEvent:{scale:this._pinchScale, focalX:this._pinchFocal.x, focalY:this._pinchFocal.y}}],
    {useNativeDriver:true}
  )
  onPinchHandlerStateChange = event => {
    if(event.nativeEvent.oldState === State.ACTIVE) {
      const lastScale = Math.min(Math.max((this._baseScale as any).__getAnimatedValue() * event.nativeEvent.scale, 0.25), 1.5)
      this._baseScale.setValue(lastScale)
      this._pinchScale.setValue(1)
      
      this.reboundPosition()
    }
  }
  onTranslateGestureEvent = Animated.event(
    [{nativeEvent:{translationX:this._translatePosition.x, translationY:this._translatePosition.y}}],
    {useNativeDriver:true}
  )
  onTranslateGestureStateChange = event => {
    if(event.nativeEvent.oldState === State.ACTIVE) {
      const scale = (this._scale as any).__getAnimatedValue()

      const lastPositionY = (this._basePosition.y as any).__getAnimatedValue() + event.nativeEvent.translationY / scale
      this._basePosition.y.setValue(lastPositionY)
      this._translatePosition.y.setValue(0)

      const lastPositionX = (this._basePosition.x as any).__getAnimatedValue() + event.nativeEvent.translationX / scale
      this._basePosition.x.setValue(lastPositionX)
      this._translatePosition.x.setValue(0)
      
      this.reboundPosition()
    }
  }
  reboundPosition = () => {
    const {container, content} = this.state
    const scale = (this._scale as any).__getAnimatedValue()
    const translateY = ((container.height || 0) - (content.height || 0)) / 2
    const yScaleDiff = ((content.height || 0) / 2 + translateY) * (1 - scale)
    const yMax = -yScaleDiff
    const yMin = (container.height || 0) - (content.height || 0) + yScaleDiff
    const translateX = ((container.width || 0) - (content.width || 0)) / 2
    const xScaleDiff = ((content.width || 0) / 2 + translateX) * (1 - scale)
    const xMax = -xScaleDiff
    const xMin = (container.width || 0) - (content.width || 0) + xScaleDiff
    console.log({
      container: container.width,
      content: content.width,
      translateX,
      scale,
      position: (this._basePosition.x as any).__getAnimatedValue()
    })

    const rebound = (value:Animated.Value, boundary:number[]) => {
      const number = (value as any).__getAnimatedValue()
      if(number < boundary[0]) {
        return Animated.timing(value, {
          toValue: boundary[0],
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true
        })
      } else if(number > boundary[1]) {
        return Animated.timing(value, {
          toValue: boundary[1],
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true
        })
      } else {
        return undefined
      }
    }
    const animations = [
      rebound(this._basePosition.y, yMin > yMax? [(yMax + yMin) / 2, (yMax + yMin) / 2]:[yMin, yMax]),
      rebound(this._basePosition.x, xMin > xMax? [(xMax + xMin) / 2, (xMax + xMin) / 2]:[xMin, xMax])
    ].filter(rebound => !!rebound)
    Animated.parallel(animations).start()
  }
  render() {
    const {children, width} = this.props
    const {container, content} = this.state
    const positionX = this._position.x
    const positionY = this._position.y
    const translateY = ((container.height || 0) - (content.height || 0)) / 2
    const translateX = ((container.width || 0) - (content.width || 0)) / 2
    return (
      <PanGestureHandler
        ref={this.panRef}
        simultaneousHandlers={this.pinchRef}
        onGestureEvent={this.onTranslateGestureEvent}
        onHandlerStateChange={this.onTranslateGestureStateChange}
        avgTouches
      >
        <Animated.View style={styles.wrapper}>
          <PinchGestureHandler
            ref={this.pinchRef}
            simultaneousHandlers={this.panRef}
            onGestureEvent={this.onPinchGestureEvent}
            onHandlerStateChange={this.onPinchHandlerStateChange}
          >
            <Animated.View onLayout={this.setContainerDimension} style={styles.container} collapsable={false}>
              <Animated.View onLayout={this.setContentDimension} style={[styles.content, {width}, {transform: [
                {translateY},
                {translateX},
                {scale:this._scale},
                {translateY:-translateY},
                {translateX:-translateX},
                {translateY:positionY},
                {translateX:positionX}
              ]}]}>
                {children}
              </Animated.View>
            </Animated.View>
          </PinchGestureHandler>
        </Animated.View>
      </PanGestureHandler>
    )
  }
}
interface ZoomViewProps {
  setScale?: (scale:Animated.Animated) => void
  setNonNativeScale?: (scale:Animated.Animated) => void
  setPosition?: (position:{x:Animated.Animated, y:Animated.Animated}) => void
  setNonNativePosition?: (position:{x:Animated.Animated, y:Animated.Animated}) => void
  width?: number
}
interface ZoomViewState {
  container: {
    height: number
    width: number
  }
  content: {
    height: number
    width: number
  }
}