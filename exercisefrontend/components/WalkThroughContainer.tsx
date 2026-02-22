import {StyleSheet, Text, TouchableOpacity, View, useWindowDimensions} from 'react-native';
import React from 'react';

interface WalkThroughContainerProps {
  content: React.ReactNode;
  index: number;
  total: number;
  onNext: () => void;
  onBack: () => void;
  onSkip: () => void;
  onClose: () => void;
  isLast: boolean;
}

export const WalkThroughContainer = (props: WalkThroughContainerProps) => {
  const {content, index, total, onNext, onBack, onSkip, onClose, isLast} = props;
  const {width} = useWindowDimensions();
  const cardWidth = Math.min(340, Math.max(260, width - 32));
  const canGoBack = index > 0;

  return (
    <View style={[styles.containerStyle, {width: cardWidth}]}>
      <View style={styles.contentContainer}>
        {typeof content === 'string' ? (
          <Text style={styles.contentText}>{content}</Text>
        ) : (
          content
        )}
      </View>
      <Text style={styles.paginatorText}>
        {index + 1} / {total}
      </Text>
      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={styles.secondaryButton}
          disabled={!canGoBack}
          onPress={onBack}>
          <Text style={[styles.secondaryButtonText, !canGoBack && styles.disabledText]}>
            Back
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.secondaryButton} onPress={onSkip}>
          <Text style={styles.secondaryButtonText}>Skip</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.primaryButton}
          onPress={isLast ? onClose : onNext}>
          <Text style={styles.primaryButtonText}>{isLast ? 'Done' : 'Next'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  containerStyle: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 14,
    shadowColor: '#0F172A',
    shadowOffset: {width: 0, height: 6},
    shadowOpacity: 0.18,
    shadowRadius: 14,
    elevation: 8,
  },
  contentContainer: {
    marginBottom: 14,
  },
  contentText: {
    fontSize: 19,
    lineHeight: 27,
    color: '#0F172A',
  },
  paginatorText: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 14,
    fontWeight: '600',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  secondaryButton: {
    minHeight: 36,
    paddingHorizontal: 10,
    justifyContent: 'center',
  },
  secondaryButtonText: {
    color: '#1E293B',
    fontSize: 18,
    fontWeight: '500',
  },
  disabledText: {
    color: '#94A3B8',
  },
  primaryButton: {
    minHeight: 38,
    borderRadius: 999,
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#101011',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
