package com.cleanshare.pdftools;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/**
 * Stub implementation of the PdfTools plugin for Android.  The PDF
 * tools plugin will ultimately provide a native implementation of
 * vector redactions and metadata removal for large documents.  At
 * present this stub rejects any calls to sanitizePdf() with a
 * placeholder message.
 */
@CapacitorPlugin(name = "PdfTools")
public class PdfToolsPlugin extends Plugin {
    @PluginMethod
    public void sanitizePdf(PluginCall call) {
        call.reject("PdfTools plugin sanitizePdf() is not implemented on Android yet");
    }
}