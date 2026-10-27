module.exports = {
    assets: ['./assets/fonts/Roboto'],
    dependencies: {
      'react-native-events': {
        platforms: {
          // Required only by the unused legacy Spotify Remote native module.
          android: null,
        },
      },
      'react-native-spotify-remote': {
        platforms:{
          // The app uses the authenticated backend Spotify API instead of this legacy SDK.
          android:null,
          ios:null
        }
      }
    }
  };
