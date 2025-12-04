// Dynamic import for pdf.js to avoid SSR issues
let pdfjsLib: any = null;
let workerInitialized = false;

const getPdfJs = async () => {
  if (typeof window === 'undefined') {
    throw new Error('PDF processing requires browser environment');
  }
  
  if (!pdfjsLib) {
    try {
      // Import pdfjs-dist - try build/pdf first (more stable in Next.js)
      // Fall back to standard import if that fails
      let pdfjsModule: any;
      try {
        pdfjsModule = await import('pdfjs-dist/build/pdf');
      } catch {
        pdfjsModule = await import('pdfjs-dist');
      }
      
      // Validate module structure
      if (!pdfjsModule || typeof pdfjsModule !== 'object') {
        throw new Error('PDF.js module import failed - not an object');
      }
      
      // pdfjs-dist 5.x: exports are typically at the top level
      // Try to find getDocument in the module
      let lib: any = null;
      
      // First, try direct access (namespace export)
      if (pdfjsModule.getDocument && typeof pdfjsModule.getDocument === 'function') {
        lib = pdfjsModule;
      } 
      // Then try default export
      else if (pdfjsModule.default) {
        const def = pdfjsModule.default;
        if (def && typeof def === 'object' && def.getDocument && typeof def.getDocument === 'function') {
          lib = def;
        } else if (def && typeof def === 'object') {
          lib = def;
        }
      }
      
      // Fallback to module itself
      if (!lib) {
        lib = pdfjsModule;
      }
      
      // Final validation
      if (!lib || typeof lib !== 'object' || lib === null) {
        throw new Error('PDF.js library is not a valid object');
      }
      
      if (typeof lib.getDocument !== 'function') {
        throw new Error('PDF.js getDocument function not found');
      }
      
      pdfjsLib = lib;
      
      // Initialize worker BEFORE any PDF operations
      // This must be done after we have a valid pdfjsLib object
      if (!workerInitialized && pdfjsLib.GlobalWorkerOptions) {
        try {
          // Ensure GlobalWorkerOptions is a proper object
          if (typeof pdfjsLib.GlobalWorkerOptions === 'object' && pdfjsLib.GlobalWorkerOptions !== null) {
            // Use direct property assignment (safer than defineProperty)
            pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/5.4.449/pdf.worker.min.js`;
          }
        } catch (workerError) {
          console.warn('Failed to set worker source:', workerError);
          // Continue anyway - PDF.js might work without explicit worker
        }
        workerInitialized = true;
      }
    } catch (error) {
      console.error('Error loading pdf.js:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to load PDF.js library: ${errorMessage}`);
    }
  }
  
  return pdfjsLib;
};

export interface ProcessedFile {
  type: 'image' | 'text' | 'pdf';
  name: string;
  content: string; // base64 for images/PDFs, text for text files
  mimeType?: string;
}

/**
 * Convert PDF file to images (one per page)
 */
export async function processPDF(file: File): Promise<string[]> {
  if (typeof window === 'undefined') {
    throw new Error('PDF processing is only available in the browser');
  }

  const pdfjs = await getPdfJs();
  
  // Get getDocument function - it should be directly on pdfjsLib
  const getDocument = pdfjs.getDocument;
  
  if (!getDocument || typeof getDocument !== 'function') {
    throw new Error('Failed to load PDF.js getDocument function');
  }

  const arrayBuffer = await file.arrayBuffer();
  
  // Load the PDF document
  const loadingTask = getDocument({ 
    data: arrayBuffer,
    useSystemFonts: true,
    verbosity: 0
  });
  
  const pdf = await loadingTask.promise;
  const images: string[] = [];

  // Process each page
  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const viewport = page.getViewport({ scale: 2.0 }); // Higher scale for better quality

    // Create canvas
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    if (!context) {
      console.warn(`Failed to get 2d context for page ${pageNum}`);
      continue;
    }

    canvas.height = viewport.height;
    canvas.width = viewport.width;

    // Render PDF page to canvas
    const renderContext = {
      canvasContext: context,
      viewport: viewport,
    };
    
    await page.render(renderContext).promise;

    // Convert canvas to base64 image
    const imageData = canvas.toDataURL('image/png');
    images.push(imageData);
  }

  return images;
}

/**
 * Read text file content
 */
export async function processTextFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      resolve(e.target?.result as string);
    };
    reader.onerror = reject;
    reader.readAsText(file);
  });
}

/**
 * Process any file type and return appropriate format
 */
export async function processFile(file: File): Promise<ProcessedFile[]> {
  if (typeof window === 'undefined') {
    throw new Error('File processing is only available in the browser');
  }

  const fileType = file.type;
  const fileName = file.name;

  // Handle PDFs
  if (fileType === 'application/pdf' || fileName.toLowerCase().endsWith('.pdf')) {
    try {
      const images = await processPDF(file);
      return images.map((image, index) => ({
        type: 'pdf' as const,
        name: `${fileName} (page ${index + 1})`,
        content: image,
        mimeType: 'image/png',
      }));
    } catch (error) {
      console.error('Error processing PDF:', error);
      throw new Error(`Failed to process PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Handle text files
  if (
    fileType.startsWith('text/') ||
    fileName.toLowerCase().endsWith('.txt') ||
    fileName.toLowerCase().endsWith('.md') ||
    fileName.toLowerCase().endsWith('.json') ||
    fileName.toLowerCase().endsWith('.csv')
  ) {
    const text = await processTextFile(file);
    return [{
      type: 'text' as const,
      name: fileName,
      content: text,
    }];
  }

  // Handle images (already supported)
  if (fileType.startsWith('image/')) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        resolve([{
          type: 'image' as const,
          name: fileName,
          content: e.target?.result as string,
          mimeType: fileType,
        }]);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  // For other file types, try to read as text
  try {
    const text = await processTextFile(file);
    return [{
      type: 'text' as const,
      name: fileName,
      content: text,
    }];
  } catch (error) {
    throw new Error(`Unsupported file type: ${fileType}`);
  }
}

/**
 * Get file icon based on file type
 */
export function getFileIcon(fileName: string, fileType?: string): string {
  const ext = fileName.toLowerCase().split('.').pop();
  
  if (fileType?.startsWith('image/') || ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext || '')) {
    return '🖼️';
  }
  if (ext === 'pdf') {
    return '📄';
  }
  if (['txt', 'md', 'text'].includes(ext || '')) {
    return '📝';
  }
  if (['doc', 'docx'].includes(ext || '')) {
    return '📘';
  }
  if (['xls', 'xlsx'].includes(ext || '')) {
    return '📊';
  }
  return '📎';
}

