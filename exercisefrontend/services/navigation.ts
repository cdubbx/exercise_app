import {createNavigationContainerRef, StackActions} from '@react-navigation/native';
import {RootStackParamList} from '../interfaces/screentypes';
export const navigationRef = createNavigationContainerRef<RootStackParamList>();
export function openChat() {
  if (navigationRef.isReady() && navigationRef.getCurrentRoute()?.name !== 'BotScreen') navigationRef.navigate('BotScreen');
}

export function openTab(tab: 'Home1' | 'Calendar' | 'Profile1', params?: {screen?: string; params?: object}) {
  if (!navigationRef.isReady()) return;
  const tabs = navigationRef.getRootState()?.routes.find(route => route.name === 'BottomTabs')?.state;
  const stack = tabs?.routes.find(route => route.name === tab)?.state;
  // React Navigation 7 does not automatically pop an existing nested stack.
  if (params?.screen && stack?.key) {
    navigationRef.dispatch({...StackActions.popTo(params.screen, params.params), target: stack.key});
  }
  navigationRef.dispatch(StackActions.popTo('BottomTabs', {screen: tab, ...(stack ? {} : {params})}));
}
