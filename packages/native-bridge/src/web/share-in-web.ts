import { WebPlugin } from '@capacitor/core';
import { ShareInPlugin, SharedFile } from '../index';

export class ShareInWeb extends WebPlugin implements ShareInPlugin {
  async getSharedFiles(): Promise<{ files: SharedFile[] }> {
    // Web fallback: Return empty files array
    // In a real implementation, you might check URL parameters
    // or implement a different file selection mechanism
    
    const urlParams = new URLSearchParams(window.location.search);
    const sharedFileParam = urlParams.get('shared_file');
    
    if (sharedFileParam) {
      try {
        const fileData = JSON.parse(decodeURIComponent(sharedFileParam));
        return { files: [fileData] };
      } catch (e) {
        console.warn('Failed to parse shared file parameter:', e);
      }
    }
    
    // Check for Web Share Target API (if implemented)
    if ('serviceWorker' in navigator) {
      try {
        // This would require a service worker to handle shared files
        // For now, we'll just return empty
        return { files: [] };
      } catch (e) {
        console.warn('Service worker not available for file sharing');
      }
    }
    
    return { files: [] };
  }

  /**
   * Web-specific method to trigger file picker as alternative to native sharing
   */
  async pickFiles(): Promise<{ files: SharedFile[] }> {
    return new Promise((resolve, reject) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.multiple = true;
      input.accept = 'image/*,.pdf';
      
      input.onchange = async (event) => {
        const target = event.target as HTMLInputElement;
        const files = Array.from(target.files || []);
        
        const sharedFiles: SharedFile[] = [];
        
        for (const file of files) {
          // Create object URL for the file
          const uri = URL.createObjectURL(file);
          
          // Determine file type
          let type: 'image' | 'pdf';
          if (file.type.startsWith('image/')) {
            type = 'image';
          } else if (file.type === 'application/pdf') {
            type = 'pdf';
          } else {
            continue; // Skip unsupported files
          }
          
          sharedFiles.push({
            name: file.name,
            uri,
            type
          });
        }
        
        resolve({ files: sharedFiles });
      };
      
      input.onerror = () => {
        reject(new Error('File selection cancelled or failed'));
      };
      
      // Trigger file picker
      input.click();
    });
  }
}