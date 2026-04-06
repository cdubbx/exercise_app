import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {StepConfig, WalkthroughApi} from '../interfaces/types';
import Tooltip from 'react-native-walkthrough-tooltip';
import {WalkThroughContainer} from '../components/WalkThroughContainer';
import TourStep from '../components/TourStep';
import {
  markTutorialCompleted,
  setTutorialOverride,
  shouldShowTutorial,
} from '../utils/tutorialStorage';

export const WalkthroughContext = createContext<WalkthroughApi | null>(null);
interface WalkthroughContextProps {
  children: React.ReactNode;
}

export const WalkthroughProvider: React.FC<WalkthroughContextProps> = ({
  children,
}) => {
  const stepsRef = useRef<Map<string, StepConfig>>(new Map());
  const boundIdsRef = useRef<Set<string>>(new Set()); // boundIds are the steps that have a child in the tool tip
  const activatedIdsRef = useRef<Set<string>>(new Set()); // activatedIds are the steps are added without being bound with a child
  const [orderIds, setOrderIds] = useState<string[]>([]);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [index, setIndex] = useState<number>(0);
  const [tutorialEnabled, setTutorialEnabled] = useState<boolean | null>(null);

  const refreshTutorialEnabled = useCallback(async () => {
    try {
      const shouldShow = await shouldShowTutorial();
      setTutorialEnabled(shouldShow);
    } catch {
      setTutorialEnabled(true);
    }
  }, []);

  const setTutorialDebugOverrideApi = useCallback(
    async (override: boolean | null) => {
      await setTutorialOverride(override);
      await refreshTutorialEnabled();
    },
    [refreshTutorialEnabled],
  );

  const stop = useCallback(() => {
    setIsRunning(false);
    setIndex(0);
    activatedIdsRef.current.clear();
  }, []);

  const complete = useCallback(async () => {
    try {
      await markTutorialCompleted();
    } finally {
      stop();
      setTutorialEnabled(false);
    }
  }, [stop]);

  useEffect(() => {
    refreshTutorialEnabled();
  }, [refreshTutorialEnabled]);

  const activeStepId = isRunning ? (orderIds[index] ?? null) : null;
  const register = useCallback((step: StepConfig, isPartial?: boolean) => {
    if (tutorialEnabled === false) return;
    const existing = stepsRef.current.get(step.id);
    stepsRef.current.set(step.id, {...existing, ...step});

    if (isPartial !== true) boundIdsRef.current.add(step.id); // These are the steps that have a React.ReactNode bound to the step config

    setOrderIds(prev => {
      if (prev.includes(step.id)) return prev; // if it already has the step then we just want to return the prev list of ids.

      const order = stepsRef.current.get(step.id)?.order;
      if (order == null) return [...prev, step.id]; // if it doesn't have an order than just add the step at the end of the array/list

      const insertAt = prev.findIndex(existingId => { // this like the map function so we're iterating through the list and an getting the insertAt
        const existingOrder = stepsRef.current.get(existingId)?.order;
        return (existingOrder ?? Number.POSITIVE_INFINITY) > order;
      });

      if (insertAt === -1) return [...prev, step.id];
      return [...prev.slice(0, insertAt), step.id, ...prev.slice(insertAt)];
    });
  }, [tutorialEnabled]);

  const start = useCallback(() => {
    if (tutorialEnabled === false) return;
    if (tutorialEnabled == null) {
      shouldShowTutorial()
        .then(shouldShow => {
          setTutorialEnabled(shouldShow);
          if (!shouldShow) return;
          setIsRunning(true);
          setIndex(0);
          activatedIdsRef.current.clear();
        })
        .catch(() => {
          setTutorialEnabled(true);
          setIsRunning(true);
          setIndex(0);
          activatedIdsRef.current.clear();
        });
      return;
    }

    setIsRunning(true);
    setIndex(0);
    activatedIdsRef.current.clear();
  }, [tutorialEnabled]);

  const next = useCallback(() => {
    setIndex(i => {
      if (orderIds.length === 0) return i;
      return Math.min(i + 1, orderIds.length - 1);
    });
  }, [orderIds.length]);

  const back = useCallback(() => {
    setIndex(i => Math.max(i - 1, 0));
  }, [orderIds.length]);

  const skip = useCallback(() => stop(), [stop]);

  useEffect(() => {
    if (tutorialEnabled === false) return;
    if (!isRunning || !activeStepId) return;
    if (boundIdsRef.current.has(activeStepId)) return;

    const step = stepsRef.current.get(activeStepId);
    if (!step?.onActivate) return;
    if (activatedIdsRef.current.has(activeStepId)) return; //prevents the double-call is this

    activatedIdsRef.current.add(activeStepId); // Added it the reference so we know if it's activatedIdsRef we know now to call onACtivate again
    step.onActivate();
  }, [activeStepId, isRunning, tutorialEnabled]);

  const wrap = useCallback(
    (id: string, node: React.ReactElement, config: Omit<StepConfig, 'id'>) => {
      if (tutorialEnabled === false) return node;
      return (
        <TourStep id={id} config={config}>
          {node}
        </TourStep>
      );
    },
    [tutorialEnabled],
  );

  const api = useMemo(
    () => ({
      start,
      stop,
      next,
      back,
      skip,
      isRunning,
      activeStepId,
      wrap,
      register,
      index,
      orderIds,
      setTutorialDebugOverride: setTutorialDebugOverrideApi,
      setTutorialOverride: setTutorialDebugOverrideApi,
      refreshTutorialEnabled,
      complete,
    }),
    [
      activeStepId,
      back,
      isRunning,
      next,
      skip,
      start,
      stop,
      wrap,
      register,
      index,
      orderIds,
      setTutorialDebugOverrideApi,
      refreshTutorialEnabled,
      complete,
    ],
  );


  
  return (
    <WalkthroughContext.Provider value={api}>
      {children}
    </WalkthroughContext.Provider>
  );
};
