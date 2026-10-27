import {afterEach, beforeEach, expect, jest, test} from '@jest/globals';
import React from 'react';
import renderer, {act} from 'react-test-renderer';
import {Alert, Text, TextInput, TouchableOpacity} from 'react-native';
import ResetPassword from '../screens/ResetPassword';
import {ToastProvider} from '../context/ToastContext';

const mockReset = jest.fn<(...args: any[]) => Promise<string>>();
const mockNavigate = jest.fn();
jest.mock('../hooks/auth', () => ({useResetPassword: () => ({resetPassword: mockReset})}));
let tree: renderer.ReactTestRenderer;
beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  act(() => { tree = renderer.create(<ToastProvider><ResetPassword
    route={{params: {token: 'reset-token', email: 'first@example.com'}} as any}
    navigation={{navigate: mockNavigate} as any}
  /></ToastProvider>); });
});
afterEach(() => { act(() => tree.unmount()); });
function fill(password: string, confirm: string) {
  act(() => {
    tree.root.findAllByType(TextInput)[0].props.onChangeText(password);
    tree.root.findAllByType(TextInput)[1].props.onChangeText(confirm);
  });
}
async function submit() {
  await act(async () => { await tree.root.findByType(TouchableOpacity).props.onPress(); });
}
test('requires a matching confirmation before sending the reset token', async () => {
  fill('New-password-2026!', 'different'); await submit();
  expect(mockReset).not.toHaveBeenCalled(); expect(mockNavigate).not.toHaveBeenCalled();
  expect(Alert.alert).toHaveBeenCalledWith('Passwords do not match', expect.any(String));
});
test('success sends the link credentials and keeps a toast visible after returning to login', async () => {
  mockReset.mockResolvedValue('Password changed successfully.');
  fill('New-password-2026!', 'New-password-2026!'); await submit();
  expect(mockReset).toHaveBeenCalledWith({email: 'first@example.com', token: 'reset-token', new_password: 'New-password-2026!'});
  expect(mockNavigate).toHaveBeenCalledWith('Login');
  act(() => tree.update(<ToastProvider><Text>Login</Text></ToastProvider>));
  expect(tree.root.findAllByType(Text).some(node => node.props.children === 'Password changed successfully.')).toBe(true);
});
test('failed reset retains the form and does not report success', async () => {
  mockReset.mockRejectedValue(new Error('Invalid or expired reset link.'));
  fill('New-password-2026!', 'New-password-2026!'); await submit();
  expect(mockNavigate).not.toHaveBeenCalled();
  expect(Alert.alert).toHaveBeenCalledWith('Could not reset password', expect.stringContaining('expired'));
  expect(tree.root.findAllByType(TextInput)[0].props.value).toBe('New-password-2026!');
});
