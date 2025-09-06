import Foundation
import Capacitor

/**
 * A stub implementation of the Vision plugin for iOS.  Each method
 * currently calls reject() to indicate that the native OCR, face
 * detection, and barcode scanning are not yet implemented.  To
 * implement this plugin you would use the Apple Vision framework to
 * perform these recognitions and return the results to JavaScript.
 */
@objc(VisionPlugin)
public class VisionPlugin: CAPPlugin {
    @objc public func recognizeText(_ call: CAPPluginCall) {
        call.reject("Vision plugin recognizeText() is not implemented on iOS yet")
    }

    @objc public func detectFaces(_ call: CAPPluginCall) {
        call.reject("Vision plugin detectFaces() is not implemented on iOS yet")
    }

    @objc public func detectBarcodes(_ call: CAPPluginCall) {
        call.reject("Vision plugin detectBarcodes() is not implemented on iOS yet")
    }
}