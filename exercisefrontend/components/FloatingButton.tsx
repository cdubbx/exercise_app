import {
  Animated,
  PanResponder,
  StyleSheet,
  Text,
  Touchable,
  TouchableOpacity,
  View,
} from 'react-native';
import React, {useEffect, useRef} from 'react';
import {
  useFloatingButtonActions,
  useFloatingButtonState,
} from '../context/FloatingButtonContext';
import {
  NavigationProp,
  useNavigation,
  useNavigationState,
} from '@react-navigation/native';
import Svg, {Path} from 'react-native-svg';

function getActiveRouteName(state: any): string | undefined {
  if (!state || !state.routes || typeof state.index !== 'number') {
    return undefined;
  }

  let route = state.routes[state.index];

  // Walk down into nested navigators
  while (
    route?.state &&
    route.state.routes &&
    typeof route.state.index === 'number'
  ) {
    const nestedState = route.state;
    route = nestedState.routes[nestedState.index];
  }

  return route?.name;
}

const FloatingButton = () => {
  const pan = useRef(new Animated.ValueXY()).current;
  const {moveToBottomRight} = useFloatingButtonActions();
  const state = useFloatingButtonState();
  const navigation = useNavigation();
  const routeState = useNavigationState(s => s);
  const routeName = getActiveRouteName(routeState);

  useEffect(() => {
    moveToBottomRight();
  }, []);
  const panResponder = React.useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (evt, gestureState) => true,
      onPanResponderMove: Animated.event([null, {dx: pan.x, dy: pan.y}]),
      onPanResponderRelease: () => {
        pan.extractOffset();
      },
    }),
  ).current;
  return (
    <Animated.View
      style={[
        styles.floating,
        {
          left: state?.x,
          top: state?.y,
          opacity: routeName == 'BotScreen' ? 0 : 1,
          transform: [{translateX: pan.x}, {translateY: pan.y}],
        },
      ]}
      {...panResponder.panHandlers}>
      <TouchableOpacity
        style={styles.floatingButtonContainer}
        onPress={() => navigation.navigate('BotScreen')}>
        <Svg width={32} height={32} viewBox="0 0 98 92">
          <Path
            d="M23.1035 43.4394L30.8046 20.3359H40.7658L48.4669 43.4394L71.5704 51.1405V61.1017L48.4669 68.8029L40.7658 91.9063H30.8046L23.1035 68.8029L0 61.1017V51.1405L23.1035 43.4394Z"
            fill="#FFFFFF"
          />
          <Path
            d="M70.7012 12.2871L74.7968 0H80.7736L84.8692 12.2871L97.1563 16.3828V22.3595L84.8692 26.4552L80.7736 38.7422H74.7968L70.7012 26.4552L58.4141 22.3595V16.3828L70.7012 12.2871Z"
            fill="#FFFFFF"
          />
        </Svg>
      </TouchableOpacity>
    </Animated.View>
  );
};

export default FloatingButton;

const styles = StyleSheet.create({
  floatingButtonContainer: {
    borderRadius: 28,
    borderWidth: 1,
    borderColor: '#f0f1f3ff',
    tintColor: '#cacaceff',
    padding: 5,
    backgroundColor: '#c9c9d6ff', // <-- button color
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 6,
    shadowOffset: {width: 0, height: 4},
    elevation: 6,
  },
  floating: {
    position: 'absolute',
    zIndex: 999, // optional but helps ensure it’s on top
  },
});
