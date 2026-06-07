/**
 * WhatsApp utility functions for sharing PDFs and other content
 */

export interface WhatsAppShareOptions {
  phoneNumber: string;
  message: string;
  fileName: string;
  fileBlob: Blob;
  fileType?: string;
}

/**
 * Normalizes phone number for WhatsApp
 */
export function normalizePhoneForWhatsApp(phone: string): string {
  if (!phone) return '';
  
  // Remove any non-digit characters except +
  const cleaned = phone.replace(/[^\d+]/g, '');
  
  // Handle different phone number formats
  if (cleaned.startsWith("0") && cleaned.length === 11) {
    return cleaned.replace("0", "+92");
  } else if (cleaned.startsWith("+92")) {
    return cleaned;
  } else if (cleaned.startsWith("92") && cleaned.length === 12) {
    return `+${cleaned}`;
  } else if (cleaned.length === 10) {
    return `+92${cleaned}`;
  }
  
  return cleaned;
}

/**
 * Shares a PDF file via WhatsApp
 */
export async function sharePDFViaWhatsApp(options: WhatsAppShareOptions): Promise<void> {
  const { phoneNumber, message, fileName, fileBlob, fileType = 'application/pdf' } = options;
  
  const normalizedPhone = normalizePhoneForWhatsApp(phoneNumber);
  
  if (!normalizedPhone) {
    throw new Error('Invalid phone number provided');
  }
  
  // Create a File object from the blob
  const file = new File([fileBlob], fileName, { type: fileType });
  
  // Try Web Share API first (mobile browsers)
  if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({
        title: fileName,
        text: message,
        files: [file]
      });
      return;
    } catch {
      console.log('Web Share API failed, falling back to WhatsApp web');
    }
  }
  
  // Fallback: Download file and open WhatsApp Web
  const fileUrl = URL.createObjectURL(fileBlob);
  const link = document.createElement('a');
  link.href = fileUrl;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  // Clean up the file URL
  URL.revokeObjectURL(fileUrl);
  
  // Open WhatsApp Web with message
  const whatsappUrl = `https://wa.me/${normalizedPhone}?text=${encodeURIComponent(message)}`;
  
  // Open WhatsApp after a short delay to ensure download starts
  setTimeout(() => {
    window.open(whatsappUrl, '_blank');
  }, 500);
}

/**
 * Generates a PDF blob from HTML content using html2canvas and jsPDF
 */
export async function generatePDFFromHTML(htmlContent: string, options: {
  fileName: string;
  width?: number;
  height?: number;
  backgroundColor?: string;
}): Promise<Blob> {
  const { width = 800, backgroundColor = '#ffffff' } = options;
  
  // Create a temporary container
  const tempContainer = document.createElement('div');
  tempContainer.innerHTML = htmlContent;
  tempContainer.style.position = 'absolute';
  tempContainer.style.left = '-9999px';
  tempContainer.style.top = '-9999px';
  tempContainer.style.width = `${width}px`;
  tempContainer.style.backgroundColor = backgroundColor;
  // Don't set height - let it be dynamic based on content
  document.body.appendChild(tempContainer);
  
  try {
    // Import both html2canvas and jsPDF dynamically
    const [html2canvas, jsPDF] = await Promise.all([
      import('html2canvas'),
      import('jspdf')
    ]);
    
    // Capture the content as canvas with dynamic height
    const canvas = await html2canvas.default(tempContainer, {
      backgroundColor,
      width,
      // Remove height constraint to let it capture full content
      scale: 1.8, // Increased for better text clarity and pixel density
      useCORS: true,
      allowTaint: true,
      scrollX: 0,
      scrollY: 0,
      windowWidth: width,
      windowHeight: tempContainer.scrollHeight,
      // Additional optimizations for smaller file size
      logging: false,
      removeContainer: true,
      foreignObjectRendering: false,
      // Additional compression optimizations
      imageTimeout: 0,
      onclone: (clonedDoc: Document) => {
        // Remove any heavy styling that might increase file size
        const style = clonedDoc.createElement('style');
        style.textContent = `
          * { 
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
            text-rendering: optimizeLegibility;
            font-feature-settings: "kern" 1;
            font-kerning: normal;
          }
        `;
        clonedDoc.head.appendChild(style);
      }
    } as Record<string, unknown>);
    
    // Create PDF from canvas with optimized compression
    const imgData = canvas.toDataURL('image/jpeg', 0.75); // Increased quality for better text clarity
    const pdf = new jsPDF.default({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true // Enable PDF compression
    });
    
    // Calculate dimensions to fit the image in A4
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const imgWidth = canvas.width;
    const imgHeight = canvas.height;
    
    // Calculate ratio to fit width properly
    const ratio = pdfWidth / imgWidth;
    const finalWidth = imgWidth * ratio;
    const finalHeight = imgHeight * ratio;
    
    // If the content is taller than one page, we need to split it
    if (finalHeight > pdfHeight) {
      const pageHeight = pdfHeight;
      const totalPages = Math.ceil(finalHeight / pageHeight);
      
      for (let i = 0; i < totalPages; i++) {
        if (i > 0) {
          pdf.addPage();
        }
        
        const yOffset = -(i * pageHeight);
        
        pdf.addImage(
          imgData, 
          'JPEG', 
          0, 
          yOffset, 
          finalWidth, 
          finalHeight
        );
      }
    } else {
      // Content fits on one page
      const x = (pdfWidth - finalWidth) / 2;
      const y = (pdfHeight - finalHeight) / 2;
      pdf.addImage(imgData, 'JPEG', x, y, finalWidth, finalHeight);
    }
    
    // Convert PDF to blob
    return new Promise((resolve, reject) => {
      try {
        const pdfBlob = pdf.output('blob');
        resolve(pdfBlob);
      } catch {
        reject(new Error('Failed to generate PDF blob'));
      }
    });
  } finally {
    // Clean up
    document.body.removeChild(tempContainer);
  }
}

/**
 * Simple WhatsApp message sharing (without file)
 */
export function shareMessageViaWhatsApp(phoneNumber: string, message: string): void {
  const normalizedPhone = normalizePhoneForWhatsApp(phoneNumber);
  
  if (!normalizedPhone) {
    throw new Error('Invalid phone number provided');
  }
  
  const whatsappUrl = `https://wa.me/${normalizedPhone}?text=${encodeURIComponent(message)}`;
  window.open(whatsappUrl, '_blank');
}
