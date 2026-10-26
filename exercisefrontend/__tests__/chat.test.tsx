import {afterEach, beforeEach, expect, jest, test} from '@jest/globals';
import React from 'react';
import renderer, {act} from 'react-test-renderer';
import {ChatProvider, useChat} from '../context/ChatContext';

const mockFetch = jest.fn<(...args: any[]) => Promise<any>>();
const mockRead = jest.fn<(...args: any[]) => Promise<any>>();
let mockUserId = 'first';
jest.mock('../hooks/auth', () => ({useUserContext: () => ({user: {id: mockUserId}})}));
jest.mock('../services/api', () => ({API_URL: 'http://localhost/api', apiFetch: (...args: any[]) => mockFetch(...args), readResponse: (...args: any[]) => mockRead(...args)}));
let chat: ReturnType<typeof useChat>;
function Probe() { chat = useChat(); return null; }
let tree: renderer.ReactTestRenderer;
beforeEach(() => {
  jest.clearAllMocks(); mockUserId = 'first';
  mockFetch.mockResolvedValue({status: 200}); mockRead.mockResolvedValue({gpt_response: 'A reply', exercises: []});
  act(() => { tree = renderer.create(<ChatProvider><Probe /></ChatProvider>); });
});
afterEach(() => { act(() => tree.unmount()); });

test('blank and simultaneous sends cannot create duplicate requests', async () => {
  let resolve!: (data: any) => void;
  mockFetch.mockImplementationOnce(() => new Promise(done => { resolve = done; }));
  let request!: Promise<void>;
  act(() => { request = chat.sendMessage('  My workout  '); chat.sendMessage('duplicate'); chat.sendMessage('  '); });
  expect(mockFetch).toHaveBeenCalledTimes(1);
  await act(async () => { resolve({status: 200}); await request; });
  expect(chat.messages.map(message => message.content)).toEqual(['My workout', 'A reply']);
  expect(new Set(chat.messages.map(message => message.id)).size).toBe(2);
});
test('failed messages can be retried without duplicating the question', async () => {
  mockFetch.mockRejectedValueOnce(new Error('Offline'));
  await act(async () => { await chat.sendMessage('Help with reps'); });
  expect(chat.messages).toHaveLength(1); expect(chat.error?.message).toBe('Offline');
  await act(async () => { await chat.retryMessage(); });
  expect(chat.messages.map(message => message.role)).toEqual(['user', 'assistant']);
  expect(chat.error).toBeNull();
});
test('unavailable service produces an explicit state rather than an assistant answer', async () => {
  mockFetch.mockResolvedValueOnce({status: 503}); mockRead.mockRejectedValueOnce(new Error('Recommendations are not available yet.'));
  await act(async () => { await chat.sendMessage('Plan a workout'); });
  expect(chat.error?.unavailable).toBe(true); expect(chat.messages).toHaveLength(1); expect(chat.loading).toBe(false);
});
test('clearing or changing accounts discards late replies', async () => {
  let resolve!: (data: any) => void;
  mockFetch.mockImplementationOnce(() => new Promise(done => { resolve = done; }));
  let request!: Promise<void>;
  act(() => { request = chat.sendMessage('Old question'); chat.clearConversation(); });
  await act(async () => { resolve({status: 200}); await request; });
  expect(chat.messages).toEqual([]);
  mockFetch.mockImplementationOnce(() => new Promise(done => { resolve = done; }));
  act(() => { request = chat.sendMessage('New question'); });
  mockUserId = 'second';
  act(() => tree.update(<ChatProvider><Probe /></ChatProvider>));
  await act(async () => { resolve({status: 200}); await request; });
  expect(chat.messages).toEqual([]); expect(chat.error).toBeNull();
});
test('a missing assistant response remains recoverable instead of a fabricated answer', async () => {
  mockRead.mockResolvedValueOnce({exercises: []});
  await act(async () => { await chat.sendMessage('Any ideas?'); });
  expect(chat.messages).toHaveLength(1); expect(chat.error?.message).toContain('No reply');
});
