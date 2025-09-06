import Foundation
import Capacitor

/**
 * Stub implementation of the PdfTools plugin for iOS.  Once
 * implemented this plugin would allow you to perform vector redaction
 * and metadata removal on PDF documents.  For now it simply
 * rejects any calls with an informative error message.
 */
@objc(PdfToolsPlugin)
public class PdfToolsPlugin: CAPPlugin {
    @objc public func sanitizePdf(_ call: CAPPluginCall) {
        call.reject("PdfTools plugin sanitizePdf() is not implemented on iOS yet")
    }
}