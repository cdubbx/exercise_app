import React from 'react';
import {afterEach, beforeEach, expect, jest, test} from '@jest/globals';
import renderer, {act} from 'react-test-renderer';
import {useFilePicker, useS3Uploader} from '../hooks/social';
const mockPicker = jest.fn<(...args: any[]) => Promise<any>>();
const mockFetch = jest.fn<(...args: any[]) => Promise<any>>();
jest.mock('react-native-image-picker', () => ({launchImageLibrary: (...args: any[]) => mockPicker(...args)}));
jest.mock('../services/api', () => ({API_URL: 'http://localhost/api', apiFetch: (...args: any[]) => mockFetch(...args), readResponse: async (response: any) => response.payload}));
jest.mock('../hooks/auth', () => ({}));
let picker: ReturnType<typeof useFilePicker>; let uploader: ReturnType<typeof useS3Uploader>;
function Probe() { picker = useFilePicker(); uploader = useS3Uploader(); return null; }
let tree: renderer.ReactTestRenderer;
beforeEach(() => { jest.clearAllMocks(); act(() => { tree = renderer.create(<Probe />); }); });
afterEach(() => { act(() => tree.unmount()); });
test('photo selection asks for bounded compatible images and cancellation is quiet', async () => {
  mockPicker.mockResolvedValue({didCancel: true});
  await act(async () => { expect(await picker.pickFile()).toBeNull(); });
  expect(picker.error).toBeNull();
  expect(mockPicker.mock.calls[0][0]).toMatchObject({assetRepresentationMode: 'compatible', selectionLimit: 1, maxWidth: 2048});
});
test('oversized photos are rejected before making an upload', async () => {
  mockPicker.mockResolvedValue({assets: [{uri: 'file://large.jpg', fileSize: 6 * 1024 * 1024}]});
  await act(async () => { expect(await picker.pickFile()).toBeNull(); });
  expect(picker.error).toContain('5 MB'); expect(mockFetch).not.toHaveBeenCalled();
});
test('authenticated multipart upload returns the display URL and failures stay retryable', async () => {
  const photo = {uri: 'file://photo.jpg', name: 'photo.jpg', type: 'image/jpeg'};
  mockFetch.mockRejectedValueOnce(new Error('Storage unavailable'));
  await act(async () => { await expect(uploader.uploadToS3(photo, 'profile')).rejects.toThrow('Storage unavailable'); });
  expect(uploader.uploadProgess).toBe(0); expect(uploader.error).toBe('Storage unavailable');
  mockFetch.mockResolvedValueOnce({payload: {url: 'https://images.example/signed'}});
  await act(async () => { expect(await uploader.uploadToS3(photo, 'profile')).toBe('https://images.example/signed'); });
  expect(mockFetch.mock.calls[1][0]).toBe('http://localhost/api/uploads/');
  expect(mockFetch.mock.calls[1][1].body).toBeInstanceOf(FormData);
  expect(uploader.uploadProgess).toBe(100); expect(uploader.error).toBeNull();
});
