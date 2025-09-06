package com.cleanshare.sharein;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.PluginMethod;

/**
 * A minimal stub implementation of the ShareIn plugin for Android.  The
 * purpose of this class is to expose a JavaScript API while
 * development of the native share-sheet integration is underway.  The
 * getSharedFiles() method currently resolves with an empty array but
 * demonstrates how to construct return objects.  You can extend
 * this class to implement receiving ACTION_SEND intents and
 * forwarding URIs into the app’s sandbox.
 */
@CapacitorPlugin(name = "ShareIn")
public class ShareInPlugin extends Plugin {
    @PluginMethod
    public void getSharedFiles(PluginCall call) {
        JSArray files = new JSArray();
        JSObject ret = new JSObject();
        ret.put("files", files);
        call.resolve(ret);
    }
}