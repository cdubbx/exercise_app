import {useBottomTabBarHeight} from '@react-navigation/bottom-tabs';
import {Dimensions} from 'react-native';

type DeviceCategory = 'small' | 'regular' | 'max';

export class FloatingLayoutService {
  constructor(tabBarHeight: number) {
    this._tabBarHeight = tabBarHeight;
  }
  static getDeviceCategory(): DeviceCategory {
    const {height} = Dimensions.get('window');
    if (height >= 900) return 'max';
    if (height >= 780) return 'regular';
    return 'small';
  }
  public _tabBarHeight: number = 0;
  public set tabBarHeight(tabBarHeight: number) {
    this._tabBarHeight = tabBarHeight;
  }
  public get tabBarHeight(): number {
    return this._tabBarHeight;
  }

  static getBottomRightPosition(buttonSize = 38, margin = 26) {
    const { width, height } = Dimensions.get('window');
    const extraForTabs = 72; // this is your extra gap above the bottom tabs

    return {
      x: width - buttonSize - margin,
      y: height - buttonSize - margin - extraForTabs,
    };
  }

  static getBottomRightAdjusted(
    buttonSize = 38,
    margin = 26,
  ) {
    const {width, height} = Dimensions.get('window');
    const cat = this.getDeviceCategory();
    const extraForTabs = 72;
    let verticalOffset = margin;
    if (cat === 'max') verticalOffset = (margin) * 2;
    if (cat === 'small') verticalOffset = (margin) / 2;

    return {
      x: width - buttonSize - margin,
      y: height - buttonSize - extraForTabs - verticalOffset,
    };
  }
}
