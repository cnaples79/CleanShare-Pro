package com.cleanshare.vision;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/**
 * A stub implementation of the Vision plugin for Android.  It exposes
 * methods for text recognition, face detection, and barcode
 * detection, but currently rejects the call to indicate that the
 * native functionality has not been implemented.  You can extend
 * this class using Google ML Kit to return recogniser results.
 */
@CapacitorPlugin(name = "Vision")
public class VisionPlugin extends Plugin {
    @PluginMethod
    public void recognizeText(PluginCall call) {
        call.reject("Vision plugin recognizeText() is not implemented on Android yet");
    }

    @PluginMethod
    public void detectFaces(PluginCall call) {
        call.reject("Vision plugin detectFaces() is not implemented on Android yet");
    }

    @PluginMethod
    public void detectBarcodes(PluginCall call) {
        call.reject("Vision plugin detectBarcodes() is not implemented on Android yet");
    }
}