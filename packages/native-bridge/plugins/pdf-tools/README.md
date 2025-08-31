## PDF Tools Plugin

This directory is reserved for a future Capacitor plugin that will perform advanced PDF operations natively.  The MVP uses pdf‑lib in JavaScript to copy pages and draw filled rectangles over sensitive regions.  For high fidelity and performance, especially with large documents, you may implement the following features natively:

* **Vector burn‑in redactions**: Remove or redact content in the PDF object model rather than rasterising pages.  This avoids quality loss and maintains selectable text outside of redactions.
* **Metadata removal**: Strip XMP, IPTC, and custom metadata from the document.
* **Annotation sanitisation**: Remove or flatten hidden annotations, form fields, and JavaScript actions.

When implemented, the plugin might expose a single method such as `sanitizePdf(options: { uri: string; redactions: RedactionAction[] }): Promise<{ uri: string; }>` that takes the file path and redaction definitions and returns a new file path for the sanitised PDF.
