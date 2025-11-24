#import "AppDelegate.h"
#import <React/RCTBundleURLProvider.h>
#import <React/RCTLinkingManager.h> // Required for deep linking
// Spotify Remote SDK (optional)
#if __has_include(<RNSpotifyRemote/RNSpotifyRemote.h>)
#import <RNSpotifyRemote/RNSpotifyRemote.h>
#elif __has_include(<RNSpotifyRemote.h>)
#import <RNSpotifyRemote.h>
#endif

@implementation AppDelegate

- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions
{
  self.moduleName = @"exercisefrontend";
  self.initialProps = @{};
  return [super application:application didFinishLaunchingWithOptions:launchOptions];
}

// ✅ Single openURL method handling both React Native Linking & Spotify Authentication
- (BOOL)application:(UIApplication *)application
            openURL:(NSURL *)url
            options:(NSDictionary<UIApplicationOpenURLOptionsKey,id> *)options
{
#if __has_include(<RNSpotifyRemote/RNSpotifyRemote.h>) || __has_include(<RNSpotifyRemote.h>)
  if ([[RNSpotifyRemoteAuth sharedInstance] application:application openURL:url options:options]) {
    return YES; // If Spotify handled it, return YES
  }
#endif
  return [RCTLinkingManager application:application openURL:url options:options]; // Handle other deep links
}

// ✅ Required for Universal Links (iOS 9+)
- (BOOL)application:(UIApplication *)application
            continueUserActivity:(NSUserActivity *)userActivity
            restorationHandler:(void (^)(NSArray<id<UIUserActivityRestoring>> * _Nullable))restorationHandler
{
  return [RCTLinkingManager application:application continueUserActivity:userActivity restorationHandler:restorationHandler];
}

- (NSURL *)sourceURLForBridge:(RCTBridge *)bridge
{
  return [self bundleURL];
}

- (NSURL *)bundleURL
{
#if DEBUG
  return [[RCTBundleURLProvider sharedSettings] jsBundleURLForBundleRoot:@"index"];
#else
  return [[NSBundle mainBundle] URLForResource:@"main" withExtension:@"jsbundle"];
#endif
}

@end
