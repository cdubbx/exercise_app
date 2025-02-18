#!/bin/bash

echo "Cleaning existing installations..."
rm -rf node_modules package-lock.json

echo "Initializing dependency installation..."

# Downgrade React to 18.3.1 and ensure compatibility
npm install react@18.3.1 react-dom@18.3.1 --legacy-peer-deps

# Install dependencies
npm install --legacy-peer-deps \
  @react-native-async-storage/async-storage \
  @react-native-material/core \
  @react-native-picker/picker \
  @react-navigation/bottom-tabs \
  @react-navigation/native \
  @react-navigation/native-stack \
  @react-navigation/stack \
  react-native \
  react-native-calendars \
  react-native-linear-gradient \
  react-native-otp-textinput \
  react-native-picker-select \
  react-native-safe-area-context \
  react-native-screens \
  react-native-vector-icons

# Install devDependencies
npm install --save-dev --legacy-peer-deps \
  @babel/core \
  @babel/preset-env \
  @babel/runtime \
  @react-native/babel-preset \
  @react-native/eslint-config \
  @react-native/metro-config \
  @react-native/typescript-config \
  @types/react \
  @types/react-native-vector-icons \
  @types/react-test-renderer \
  babel-jest \
  eslint \
  jest \
  prettier \
  react-test-renderer \
  typescript

echo "All dependencies have been installed successfully!"
