import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

/**
 * PDF Generator Utility
 * Handles screenshot capture and PDF generation for selected analytics cards
 */

/**
 * Capture screenshot of a specific element
 * @param {string} elementId - ID of the element to capture
 * @param {Object} options - Screenshot options
 * @returns {Promise<HTMLCanvasElement>} Canvas element with screenshot
 */
export const captureElementScreenshot = async (elementId, options = {}) => {
  // Wait longer for the element to be ready
  await new Promise(resolve => setTimeout(resolve, 300));
  
  const element = document.getElementById(elementId);
  if (!element) {
    throw new Error(`Element with ID "${elementId}" not found`);
  }

  // Check if element has content
  if (element.offsetWidth === 0 || element.offsetHeight === 0) {
    throw new Error(`Element "${elementId}" has no visible content (width: ${element.offsetWidth}, height: ${element.offsetHeight})`);
  }

  // Use only Strategy 1: High-quality capture with advanced options
  
  const captureOptions = {
    scale: 2, // High quality
    useCORS: true,
    allowTaint: true,
    backgroundColor: '#ffffff',
    logging: true, // Enable logging for debugging
    width: element.offsetWidth,
    height: element.offsetHeight,
    scrollX: 0,
    scrollY: 0,
    windowWidth: element.offsetWidth,
    windowHeight: element.offsetHeight,
    foreignObjectRendering: true,
    removeContainer: true,
    imageTimeout: 15000, // 15 seconds timeout for images
    onclone: (clonedDoc) => {
      // Ensure all styles and content are preserved
      const clonedElement = clonedDoc.getElementById(elementId);
      if (clonedElement) {
        // Force visibility and proper styling
        clonedElement.style.fontFamily = 'system-ui, -apple-system, sans-serif';
        clonedElement.style.visibility = 'visible';
        clonedElement.style.display = 'block';
        clonedElement.style.position = 'static';
        clonedElement.style.transform = 'none';
        
        // Ensure all child elements are visible
        const allElements = clonedElement.querySelectorAll('*');
        allElements.forEach(el => {
          el.style.visibility = 'visible';
          el.style.display = el.style.display || 'block';
        });
        
        // Force chart rendering
        const charts = clonedElement.querySelectorAll('[class*="chart"], [class*="Chart"], canvas, svg');
        charts.forEach(chart => {
          chart.style.visibility = 'visible';
          chart.style.display = 'block';
        });
        
        // Force table rendering
        const tables = clonedElement.querySelectorAll('table');
        tables.forEach(table => {
          table.style.visibility = 'visible';
          table.style.display = 'table';
        });
      }
    }
  };

  try {
    const canvas = await html2canvas(element, { ...captureOptions, ...options });
    
    // Verify the canvas has content
    if (canvas.width > 0 && canvas.height > 0) {
      // Successfully captured with high-quality strategy
      return canvas;
    } else {
      throw new Error('Canvas has no content');
    }
  } catch (error) {
    // High-quality capture failed
    throw new Error(`High-quality capture failed for "${elementId}": ${error.message}`);
  }
};

/**
 * Generate PDF from selected card screenshots
 * @param {Array} selectedCards - Array of card IDs to include
 * @param {Object} options - PDF generation options
 * @returns {Promise<void>}
 */
export const generateAnalyticsPDF = async (selectedCards = [], options = {}) => {
  const {
    filename = `analytics_export_${new Date().toISOString().split('T')[0]}.pdf`,
    title = 'Analytics Report',
    includeTitle = true,
    cardSpacing = 20
  } = options;

  try {
    // Wait for all elements to be fully rendered
    // Waiting for elements to be ready
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Verify all selected cards exist
    const missingCards = selectedCards.filter(cardId => !document.getElementById(cardId));
    if (missingCards.length > 0) {
      throw new Error(`Missing cards: ${missingCards.join(', ')}`);
    }
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 20;
    const contentWidth = pageWidth - (margin * 2);
    let currentY = margin;

    // Add title if requested
    if (includeTitle) {
      pdf.setFontSize(20);
      pdf.setFont('helvetica', 'bold');
      pdf.text(title, margin, currentY);
      currentY += 15;
      
      // Add generation date
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Generated: ${new Date().toLocaleString()}`, margin, currentY);
      currentY += 20;
    }

    // Process each selected card
    for (let i = 0; i < selectedCards.length; i++) {
      const cardId = selectedCards[i];
      
      try {
        // Processing card
        
        // Check if element exists before trying to capture
        const element = document.getElementById(cardId);
        if (!element) {
          throw new Error(`Element with ID "${cardId}" not found in DOM`);
        }
        
        // Verify card content
        const tables = element.querySelectorAll('table');
        const charts = element.querySelectorAll('[class*="chart"], [class*="Chart"], canvas, svg');
        
        // Wait a bit more for charts to render
        await new Promise(resolve => setTimeout(resolve, 200));
        
        // Capture screenshot of the card
        const canvas = await captureElementScreenshot(cardId);
        const imgData = canvas.toDataURL('image/png');
        
        // Successfully captured card
        
        // Calculate dimensions to fit on page
        const imgWidth = canvas.width;
        const imgHeight = canvas.height;
        const maxWidth = contentWidth;
        const maxHeight = pageHeight - currentY - margin;
        
        let displayWidth = imgWidth;
        let displayHeight = imgHeight;
        
        // Scale down if too large
        if (imgWidth > maxWidth) {
          displayWidth = maxWidth;
          displayHeight = (imgHeight * maxWidth) / imgWidth;
        }
        
        if (displayHeight > maxHeight) {
          displayHeight = maxHeight;
          displayWidth = (imgWidth * maxHeight) / imgHeight;
        }

        // Check if we need a new page
        if (currentY + displayHeight > pageHeight - margin) {
          pdf.addPage();
          currentY = margin;
        }

        // Add card title
        const cardTitle = document.getElementById(cardId)?.querySelector('.card-title')?.textContent || `Card ${i + 1}`;
        pdf.setFontSize(16);
        pdf.setFont('helvetica', 'bold');
        pdf.text(cardTitle, margin, currentY);
        currentY += 12;

        // Add the image
        pdf.addImage(imgData, 'PNG', margin, currentY, displayWidth, displayHeight);
        currentY += displayHeight + cardSpacing;

        // Add new page if we have more cards and not enough space
        if (i < selectedCards.length - 1 && currentY + 100 > pageHeight - margin) {
          pdf.addPage();
          currentY = margin;
        }

        // Successfully added card to PDF

      } catch (error) {
        // Failed to capture card
        
        // Add error message to PDF
        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'bold');
        pdf.text(`Error capturing card: ${cardId}`, margin, currentY);
        currentY += 8;
        
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(255, 0, 0);
        pdf.text(`Error: ${error.message}`, margin, currentY);
        currentY += 15;
        pdf.setTextColor(0, 0, 0);
      }
    }

    // Save the PDF
    pdf.save(filename);
    
  } catch (error) {
    // PDF generation failed
    throw new Error(`Failed to generate PDF: ${error.message}`);
  }
};

/**
 * Generate CSV from selected card data
 * @param {Array} selectedCards - Array of card IDs to include
 * @param {Object} analyticsData - Analytics data object
 * @param {Object} options - CSV generation options
 * @returns {string} CSV content
 */
export const generateAnalyticsCSV = (selectedCards = [], analyticsData = {}, options = {}) => {
  const {
    filename = `analytics_export_${new Date().toISOString().split('T')[0]}.csv`,
    includeMetadata = true
  } = options;

  const rows = [];
  
  // Add document header
  if (includeMetadata) {
    rows.push(['📊 ANALYTICS EXPORT REPORT']);
    rows.push(['Generated At', new Date().toLocaleString()]);
    rows.push(['Selected Cards', selectedCards.length]);
    rows.push(['']); // Empty row
  }

  // Process each selected card
  selectedCards.forEach((cardId, index) => {
    const cardElement = document.getElementById(cardId);
    if (!cardElement) return;

    const cardTitle = cardElement.querySelector('.card-title')?.textContent || `Card ${index + 1}`;
    
    // Add card section header
    rows.push([`📋 ${cardTitle.toUpperCase()}`]);
    rows.push(['']);

    // Extract table data from the card
    const tables = cardElement.querySelectorAll('table');
    tables.forEach((table, tableIndex) => {
      const tableTitle = table.querySelector('th')?.textContent || `Table ${tableIndex + 1}`;
      rows.push([`📊 ${tableTitle}`]);
      rows.push(['']);

      // Extract headers
      const headers = Array.from(table.querySelectorAll('thead th, tbody th')).map(th => th.textContent.trim());
      if (headers.length > 0) {
        rows.push(headers);
      }

      // Extract rows
      const tableRows = Array.from(table.querySelectorAll('tbody tr'));
      tableRows.forEach(row => {
        const cells = Array.from(row.querySelectorAll('td')).map(td => td.textContent.trim());
        if (cells.length > 0) {
          rows.push(cells);
        }
      });

      rows.push(['']); // Empty row after each table
    });

    // Add chart data if available (basic text representation)
    const charts = cardElement.querySelectorAll('[class*="chart"], [class*="Chart"]');
    if (charts.length > 0) {
      rows.push(['📈 CHART DATA']);
      rows.push(['Note', 'Chart data is not directly exportable to CSV format']);
      rows.push(['Recommendation', 'Use PDF export to capture visual chart data']);
      rows.push(['']);
    }

    rows.push(['']); // Empty row after each card
  });

  // Add footer
  rows.push(['']);
  rows.push(['📄 End of Report']);
  rows.push(['Generated by Task Tracker Analytics']);

  // Convert to CSV format with proper escaping
  return rows.map(row => 
    row.map(cell => {
      const cellValue = cell === null || cell === undefined ? '' : String(cell);
      // Escape commas, quotes, and newlines
      if (cellValue.includes(',') || cellValue.includes('"') || cellValue.includes('\n') || cellValue.includes('\r')) {
        return `"${cellValue.replace(/"/g, '""')}"`;
      }
      return cellValue;
    }).join(',')
  ).join('\n');
};

/**
 * Download CSV file
 * @param {string} csvContent - CSV content string
 * @param {string} filename - Filename for download
 */
export const downloadCSV = (csvContent, filename) => {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
