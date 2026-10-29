import {
  Animated,
  Modal,
  PanResponder,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import React, {useEffect, useRef} from 'react';
import {
  useFloatingButtonActions,
  useFloatingButtonState,
} from '../context/FloatingButtonContext';
import {navigationRef, openChat} from '../services/navigation';
import {useUserContext} from '../hooks/auth';
import Svg, {Path} from 'react-native-svg';
import SpotifyPlayer from './SpotifyPlayer';

const FloatingButton = () => {
  const pan = useRef(new Animated.ValueXY()).current;
  const {moveToBottomRight} = useFloatingButtonActions();
  const state = useFloatingButtonState();
  const {isAuthenticated} = useUserContext();
  const [routeName, setRouteName] = React.useState<string | undefined>();
  const [showActions, setShowActions] = React.useState(false);
  const [showMusic, setShowMusic] = React.useState(false);
  useEffect(() => {
    const updateRoute = () => setRouteName(navigationRef.getCurrentRoute()?.name);
    updateRoute();
    const unsubscribe = navigationRef.addListener('state', updateRoute);
    return unsubscribe;
  }, []);

  useEffect(() => {
    moveToBottomRight();
    // Set the starting position once so later renders do not reset drag movement.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const panResponder = React.useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_evt, gestureState) => Math.abs(gestureState.dx) + Math.abs(gestureState.dy) > 8,
      onPanResponderMove: Animated.event([null, {dx: pan.x, dy: pan.y}], {useNativeDriver: false}),
      onPanResponderRelease: () => {
        pan.extractOffset();
      },
    }),
  ).current;
  if (!isAuthenticated || routeName === 'BotScreen' || routeName === 'SavedExercises' || routeName === 'ExerciseCard' || routeName === 'AddWorkoutScreen') {
    return null;
  }
  return (
    <Animated.View
      style={[
        styles.floating,
        {
          left: state?.x,
          top: state?.y,
          transform: [{translateX: pan.x}, {translateY: pan.y}],
        },
      ]}
      {...panResponder.panHandlers}>
      <TouchableOpacity
        style={styles.floatingButtonContainer}
        accessibilityRole="button"
        accessibilityLabel="Open Exercise Plus actions"
        onPress={() => setShowActions(true)}>
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
      <Modal visible={showActions} transparent animationType="fade" onRequestClose={() => setShowActions(false)}>
        <Pressable style={styles.scrim} onPress={() => setShowActions(false)}>
          <Pressable style={styles.actionSheet} onPress={event => event.stopPropagation()}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Exercise Plus</Text>
              <TouchableOpacity accessibilityRole="button" accessibilityLabel="Close actions" onPress={() => setShowActions(false)}><Text style={styles.close}>Close</Text></TouchableOpacity>
            </View>
            <TouchableOpacity accessibilityRole="button" style={styles.action} onPress={() => { setShowActions(false); openChat(); }}>
              <Text style={styles.actionTitle}>Exercise Bot</Text><Text style={styles.actionDescription}>Ask questions and plan a workout</Text>
            </TouchableOpacity>
            <TouchableOpacity accessibilityRole="button" style={styles.action} onPress={() => { setShowActions(false); setShowMusic(true); }}>
              <Text style={styles.actionTitle}>Music player</Text><Text style={styles.actionDescription}>Connect Spotify or control playback</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
      <Modal visible={showMusic} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowMusic(false)}>
        <SafeAreaView style={styles.musicSheet}>
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>Music player</Text>
            <TouchableOpacity accessibilityRole="button" onPress={() => setShowMusic(false)}><Text style={styles.close}>Close</Text></TouchableOpacity>
          </View>
          <SpotifyPlayer modal />
        </SafeAreaView>
      </Modal>
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
  scrim: {flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.35)'},
  actionSheet: {backgroundColor: '#f2f2f2', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: 34, gap: 12},
  musicSheet: {flex: 1, backgroundColor: '#f2f2f2', paddingHorizontal: 20, paddingTop: 12},
  sheetHeader: {minHeight: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12},
  sheetTitle: {fontSize: 19, fontWeight: '600', color: 'black'},
  close: {fontSize: 15, color: '#555'},
  action: {backgroundColor: 'white', borderRadius: 14, padding: 16, gap: 5},
  actionTitle: {fontSize: 16, fontWeight: '600', color: 'black'},
  actionDescription: {fontSize: 13, color: '#555'},
});
