import {View, Text} from 'react-native';
import React, {useEffect} from 'react';
import {StepConfig} from '../interfaces/types';
import {useWalkThrough} from '../utils/TutorialSystemService';
import Tooltip from 'react-native-walkthrough-tooltip';
import {WalkThroughContainer} from './WalkThroughContainer';

const TourStep = ({
  id,
  config,
  children,
}: {
  id: string;
  config: Omit<StepConfig, 'id'>;
  children: React.ReactElement;
}) => {
  const tour = useWalkThrough();

  useEffect(() => {
    tour.register({id, ...config});
  }, [id]);

  useEffect(() => {
    if (!__DEV__) return;
    console.log('[TourStep]', {
      id,
      isRunning: tour.isRunning,
      activeStepId: tour.activeStepId,
      index: tour.index,
      total: tour.orderIds?.length ?? 0,
    });
  }, [id, tour.activeStepId, tour.index, tour.isRunning, tour.orderIds]);

  const isActive = tour.isRunning && tour.activeStepId === id; // let's add logic to check if visibility is set to true first
  const isLast =
    (tour?.index ?? -1) === (tour?.orderIds?.length ?? 0) - 1;

  const handleClose = () => {
    if (isLast && tour.complete) {
      void tour.complete();
      config?.onClose?.();
      return;
    }

    (config?.onClose ?? tour.stop)();
  };
  return (
    <Tooltip
      isVisible={isActive}
      placement={config.placement ?? 'top'}
      showChildInTooltip={config.showChildInTooltip ?? false}
      closeOnChildInteraction={config.closeOnChildInteraction ?? false}
      allowChildInteraction= {false}
      displayInsets={{top: 24, bottom: 24, left: 12, right: 12}}
      content={
        <WalkThroughContainer
          content={config.content}
          index={tour?.index ?? 0}
          total={tour?.orderIds?.length ?? 0}
          onBack={tour.back}
          onClose={handleClose}
          onNext={tour.next}
          onSkip={tour.skip}
          isLast={isLast}
        />
      }>
      {children}
    </Tooltip>
  );
};

export default TourStep;
