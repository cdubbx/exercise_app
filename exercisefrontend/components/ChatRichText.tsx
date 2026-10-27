import React from 'react';
import {StyleSheet, Text, View} from 'react-native';

type InlinePart = {text: string; bold?: boolean; italic?: boolean; code?: boolean};
type Block = {type: 'paragraph' | 'heading' | 'bullet' | 'numbered' | 'quote'; text: string; level?: number; marker?: string};

export function parseInlineMarkdown(text: string): InlinePart[] {
  const parts: InlinePart[] = [];
  const pattern = /(\*\*[^*]+\*\*|__[^_]+__|\*[^*]+\*|_[^_]+_|`[^`]+`)/g;
  let cursor = 0;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(text)) !== null) {
    if (match.index > cursor) { parts.push({text: text.slice(cursor, match.index)}); }
    const token = match[0];
    if (token.startsWith('**') || token.startsWith('__')) {
      parts.push({text: token.slice(2, -2), bold: true});
    } else if (token.startsWith('`')) {
      parts.push({text: token.slice(1, -1), code: true});
    } else {
      parts.push({text: token.slice(1, -1), italic: true});
    }
    cursor = match.index + token.length;
  }
  if (cursor < text.length) { parts.push({text: text.slice(cursor)}); }
  return parts.length ? parts : [{text}];
}

export function parseChatMarkdown(markdown: string): Block[] {
  const blocks: Block[] = [];
  let paragraph: string[] = [];
  const flushParagraph = () => {
    if (paragraph.length) {
      blocks.push({type: 'paragraph', text: paragraph.join(' ')});
      paragraph = [];
    }
  };

  for (const sourceLine of markdown.split(/\r?\n/)) {
    const line = sourceLine.trim();
    if (!line) { flushParagraph(); continue; }
    const heading = line.match(/^(#{1,3})\s+(.+)$/);
    const bullet = line.match(/^[-*•]\s+(.+)$/);
    const numbered = line.match(/^(\d{1,2})[.)]\s+(.+)$/);
    const quote = line.match(/^>\s?(.+)$/);
    if (heading) {
      flushParagraph(); blocks.push({type: 'heading', text: heading[2], level: heading[1].length});
    } else if (bullet) {
      flushParagraph(); blocks.push({type: 'bullet', text: bullet[1], marker: '•'});
    } else if (numbered) {
      flushParagraph(); blocks.push({type: 'numbered', text: numbered[2], marker: `${numbered[1]}.`});
    } else if (quote) {
      flushParagraph(); blocks.push({type: 'quote', text: quote[1]});
    } else if (/^```/.test(line) || /^\s*[-*_]{3,}\s*$/.test(line)) {
      flushParagraph();
    } else {
      paragraph.push(line);
    }
  }
  flushParagraph();
  return blocks;
}

const ChatRichText: React.FC<{content: string}> = ({content}) => (
  <View style={styles.content}>
    {parseChatMarkdown(content).map((block, index) => {
      const children = parseInlineMarkdown(block.text).map((part, partIndex) => (
        <Text key={`${index}-${partIndex}`} style={[
          part.bold && styles.bold,
          part.italic && styles.italic,
          part.code && styles.code,
        ]}>{part.text}</Text>
      ));
      if (block.type === 'bullet' || block.type === 'numbered') {
        return <View key={index} style={styles.listRow}>
          <Text style={styles.marker}>{block.marker}</Text>
          <Text selectable style={styles.body}>{children}</Text>
        </View>;
      }
      if (block.type === 'quote') {
        return <View key={index} style={styles.quote}>
          <Text selectable style={[styles.body, styles.quoteText]}>{children}</Text>
        </View>;
      }
      return <Text key={index} selectable style={[
        styles.body,
        block.type === 'heading' && (block.level === 1 ? styles.heading1 : styles.heading),
      ]}>{children}</Text>;
    })}
  </View>
);

const styles = StyleSheet.create({
  content: {gap: 9},
  body: {fontSize: 15, color: 'black', lineHeight: 22, flexShrink: 1},
  heading: {fontSize: 16, lineHeight: 22, fontWeight: '700'},
  heading1: {fontSize: 18, lineHeight: 24, fontWeight: '700'},
  bold: {fontWeight: '700'},
  italic: {fontStyle: 'italic'},
  code: {fontFamily: 'monospace', backgroundColor: '#f2f2f2'},
  listRow: {flexDirection: 'row', alignItems: 'flex-start', gap: 8},
  marker: {minWidth: 20, fontSize: 15, lineHeight: 22, color: 'black'},
  quote: {borderLeftWidth: 2, borderLeftColor: '#999', paddingLeft: 10},
  quoteText: {color: '#444', fontStyle: 'italic'},
});

export default ChatRichText;
