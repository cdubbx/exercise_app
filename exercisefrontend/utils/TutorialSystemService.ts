import {useContext} from 'react';
import {WalkthroughContext} from '../context/WalkthroughContext';
import {getTutorialToken, shouldShowTutorial} from './tutorialStorage';

export {getTutorialToken, shouldShowTutorial};

export const useWalkThrough = () => {
  const ctx = useContext(WalkthroughContext);
  if (!ctx) {
    throw new Error('useWalkThrough must be used inside WalkthroughProvider');
  }
  return ctx;
};
