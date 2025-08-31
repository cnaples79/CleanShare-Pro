import Foundation
import Capacitor

/**
 * A minimal stub implementation of the ShareIn plugin for iOS.  This
 * class exposes a single method, `getSharedFiles`, which currently
 * returns an empty array.  To implement share-sheet integration you
 * would create a Share Extension target in Xcode and save incoming
 * files to a shared App Group.  The main app can then read the
 * shared files and return them via this plugin.
 */
@objc(ShareInPlugin)
public class ShareInPlugin: CAPPlugin {
    @objc public func getSharedFiles(_ call: CAPPluginCall) {
        call.resolve(["files": []])
    }
}