import UIKit
import Capacitor

/**
 * The application delegate for the iOS version of CleanShare Pro.  This
 * class is responsible for configuring the Capacitor bridge and
 * performing any additional setup required before the app’s
 * WebView loads.  The majority of your logic should reside in the
 * JavaScript layer; this file is intentionally lightweight.
 */
@UIApplicationMain
class AppDelegate: UIResponder, UIApplicationDelegate {
  var window: UIWindow?

  func application(_ application: UIApplication,
                   didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
    // Initialize the Capacitor runtime.  This call sets up the
    // Capacitor bridge and registers any plugins specified in
    // capacitor.config.ts.  If you implement your own native
    // plugins, ensure they are registered here or annotated with
    // @objc(CAPPlugin) in their Swift classes.
    return true
  }
}