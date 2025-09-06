## Vision Plugin

This plugin wraps native machine learning capabilities provided by Apple Vision on iOS and Google ML Kit on Android.  It exposes a unified JavaScript interface for performing text recognition, face detection, and barcode scanning.

### API design

The plugin should expose asynchronous functions such as:

```ts
interface VisionPlugin {
  recognizeText(options: { uri: string; }): Promise<{ words: { text: string; bbox: { x: number; y: number; width: number; height: number; } }[] }>;
  detectFaces(options: { uri: string; }): Promise<{ faces: { bbox: { x: number; y: number; width: number; height: number; } }[] }>;
  detectBarcodes(options: { uri: string; }): Promise<{ barcodes: { type: string; data: string; bbox: { x: number; y: number; width: number; height: number; } }[] }>;
}
```

These functions take a file URI (pointing to an image stored in the app’s sandbox) and return arrays of bounding boxes in image coordinates.  The UI can then normalise these coordinates and feed them into the detection pipeline.

### Implementation notes

* **iOS (Swift)**: Use `VNRecognizeTextRequest` for OCR and `VNDetectFaceRectanglesRequest` for face detection.  For barcodes, use `VNDetectBarcodesRequest`.  Convert the resulting bounding boxes to the image’s coordinate space and return them via the Capacitor plugin.
* **Android (Kotlin)**: Use ML Kit’s `TextRecognizer`, `FaceDetection`, and `BarcodeScanning` APIs.  Remember to handle runtime permissions and to release recognisers when finished.

Refer to the Apple Vision and Google ML Kit documentation for details.
