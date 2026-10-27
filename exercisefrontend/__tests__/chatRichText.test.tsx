import {expect, test} from '@jest/globals';
import {parseChatMarkdown, parseInlineMarkdown} from '../components/ChatRichText';

test('formats markdown paragraphs, headings, quotes, and lists into mobile-friendly blocks', () => {
  expect(parseChatMarkdown('## Workout plan\n\nBegin with **three sets**.\n- Keep the movement controlled\n1. Rest between sets\n> Stop if you feel pain.')).toEqual([
    {type: 'heading', text: 'Workout plan', level: 2},
    {type: 'paragraph', text: 'Begin with **three sets**.'},
    {type: 'bullet', text: 'Keep the movement controlled', marker: '•'},
    {type: 'numbered', text: 'Rest between sets', marker: '1.'},
    {type: 'quote', text: 'Stop if you feel pain.'},
  ]);
});

test('renders inline emphasis and code markers as distinct text styles', () => {
  expect(parseInlineMarkdown('Use **slow reps**, *steady form*, and `light weights`.')).toEqual([
    {text: 'Use '},
    {text: 'slow reps', bold: true},
    {text: ', '},
    {text: 'steady form', italic: true},
    {text: ', and '},
    {text: 'light weights', code: true},
    {text: '.'},
  ]);
});
