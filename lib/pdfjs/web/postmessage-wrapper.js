(function() {
  'use strict';
  
  // Diagnostic logging function
  function log(message, level = 'info') {
    if (window.parent && window.parent.diagnosticLogs) {
      const prefix = '🔍 Ng2PdfJsViewer:';
      switch (level) {
        case 'error':
          console.error(prefix, message);
          break;
        case 'warn':
          console.warn(prefix, message);
          break;
        default:
          console.log(prefix, message);
      }
    }
  }
  
  log('PostMessage wrapper script loaded');
  
  // Wait for PDF.js viewer to be ready
  function waitForViewer() {
    const maxAttempts = 100; // 10 seconds max wait time
    let attempts = 0;
    
    function checkViewer() {
      attempts++;
      
      if (typeof PDFViewerApplication !== 'undefined' && PDFViewerApplication.initialized) {
        initializePostMessageAPI();
      } else if (attempts < maxAttempts) {
        setTimeout(checkViewer, 100);
      } else {
        log('Timeout waiting for PDFViewerApplication to initialize', 'error');
        // Still try to initialize in case the viewer is partially ready
        if (typeof PDFViewerApplication !== 'undefined') {
          log('Attempting to initialize with partially ready viewer', 'warn');
          initializePostMessageAPI();
        }
      }
    }
    
    checkViewer();
  }

  function initializePostMessageAPI() {
    // Add message listener
    window.addEventListener('message', handleControlMessage);
    
    // Expose API for external access
    window.Ng2PdfJsViewerAPI = {
      updateControl: updateControl,
      getState: getState,
      isReady: () => true
    };
    
    log('PostMessage API initialized');
    
    // Notify parent that PostMessage API is ready
    window.parent.postMessage({
      type: 'postmessage-ready',
      timestamp: Date.now()
    }, '*');
  }

  function handleControlMessage(event) {
    const { type, action, payload, id } = event.data;
    
    if (type === 'control-update') {
      try {
        log(`Processing control update: ${action} = ${payload}`);
        updateControl(action, payload);
        sendResponse(id, { success: true, action, payload });
      } catch (error) {
        log(`Error updating control ${action}: ${error.message}`, 'error');
        sendResponse(id, { success: false, error: error.message });
      }
    }
  }

  function updateControl(action, payload) {
    const app = PDFViewerApplication;
    
    // Validate that PDFViewerApplication is available
    if (!app) {
      log('PDFViewerApplication not available', 'error');
      return;
    }
    
    // Validate that the viewer is initialized for actions that require it
    const requiresInitialization = [
      'set-zoom', 'set-cursor', 'set-scroll', 'set-spread', 
      'set-page', 'set-rotation', 'go-to-last-page', 'go-to-named-dest',
      'update-page-mode', 'trigger-download', 'trigger-print', 
      'trigger-rotate-cw', 'trigger-rotate-ccw'
    ];
    
    if (requiresInitialization.includes(action) && !app.initialized) {
      log(`PDFViewerApplication not initialized for action: ${action}`, 'warn');
      return;
    }
    
    try {
      switch (action) {
        // Button visibility controls
        case 'show-download':
          updateDownloadButton(payload);
          break;
        case 'show-print':
          updatePrintButton(payload);
          break;
        case 'show-fullscreen':
          updateFullScreenButton(payload);
          break;
        case 'show-find':
          updateFindButton(payload);
          break;
        case 'show-bookmark':
          updateBookmarkButton(payload);
          break;
        case 'show-openfile':
          updateOpenFileButton(payload);
          break;
        
        // Mode controls
        case 'set-zoom':
          updateZoom(payload);
          break;
        case 'set-cursor':
          updateCursor(payload);
          break;
        case 'set-scroll':
          updateScroll(payload);
          break;
        case 'set-spread':
          updateSpread(payload);
          break;
        
        // Navigation controls
        case 'set-page':
          updatePage(payload);
          break;
        case 'set-rotation':
          updateRotation(payload);
          break;
        case 'go-to-last-page':
          if (payload === true) {
            goToLastPage();
          }
          break;
        case 'go-to-named-dest':
          goToNamedDestination(payload);
          break;
        case 'update-page-mode':
          updatePageMode(payload);
          break;
        
        // Auto actions
        case 'trigger-download':
          if (payload === true) {
            triggerDownload();
          }
          break;
        case 'trigger-print':
          console.log('🔍 Ng2PdfJsViewer: trigger-print action received with payload:', payload);
          if (payload === true) {
            triggerPrint();
          }
          break;
        case 'trigger-rotate-cw':
          if (payload === true) {
            triggerRotateCW();
          }
          break;
        case 'trigger-rotate-ccw':
          if (payload === true) {
            triggerRotateCCW();
          }
          break;
        
        default:
          log(`Unknown action: ${action}`, 'warn');
          throw new Error(`Unknown action: ${action}`);
      }
    } catch (error) {
      log(`Error in updateControl: ${error.message}`, 'error');
      throw error;
    }
  }

  // Button visibility functions
  function updateDownloadButton(visible) {
    const button = document.getElementById('downloadButton');
    const secondaryButton = document.getElementById('secondaryDownload');
    if (button) {
      if (visible) {
        button.classList.remove('hidden');
      } else {
        button.classList.add('hidden');
      }
      log(`Download button visibility set to ${visible}`);
    }
    if (secondaryButton) {
      if (visible) {
        secondaryButton.classList.remove('hidden');
      } else {
        secondaryButton.classList.add('hidden');
      }
      log(`Secondary download button visibility set to ${visible}`);
    }
  }

  function updatePrintButton(visible) {
    const button = document.getElementById('printButton');
    const secondaryButton = document.getElementById('secondaryPrint');
    if (button) {
      if (visible) {
        button.classList.remove('hidden');
      } else {
        button.classList.add('hidden');
      }
      log(`Print button visibility set to ${visible}`);
    }
    if (secondaryButton) {
      if (visible) {
        secondaryButton.classList.remove('hidden');
      } else {
        secondaryButton.classList.add('hidden');
      }
      log(`Secondary print button visibility set to ${visible}`);
    }
  }

  function updateFullScreenButton(visible) {
    const button = document.getElementById('presentationMode');
    if (button) {
      if (visible) {
        button.classList.remove('hidden');
      } else {
        button.classList.add('hidden');
      }
      log(`FullScreen button visibility set to ${visible}`);
    }
  }

  function updateFindButton(visible) {
    const button = document.getElementById('viewFindButton');
    if (button) {
      if (visible) {
        button.classList.remove('hidden');
      } else {
        button.classList.add('hidden');
      }
      log(`Find button visibility set to ${visible}`);
    }
  }

  function updateBookmarkButton(visible) {
    const button = document.getElementById('viewBookmark');
    if (button) {
      if (visible) {
        button.classList.remove('hidden');
      } else {
        button.classList.add('hidden');
      }
      log(`Bookmark button visibility set to ${visible}`);
    }
  }

  function updateOpenFileButton(visible) {
    const button = document.getElementById('secondaryOpenFile');
    if (button) {
      if (visible) {
        button.classList.remove('hidden');
      } else {
        button.classList.add('hidden');
      }
      log(`Open file button visibility set to ${visible}`);
    }
  }

  // Mode control functions
  function updateZoom(zoom) {
    const app = PDFViewerApplication;
    if (app && app.pdfViewer) {
      let scale = 1.0;
      
      // Handle string-based zoom values
      if (typeof zoom === 'string') {
        switch (zoom.toLowerCase()) {
          case 'page-fit':
          case 'page-fit':
            scale = 0; // Auto-fit
            break;
          case 'page-width':
          case 'page-width':
            scale = -1; // Page width
            break;
          case 'page-height':
          case 'page-height':
            scale = -2; // Page height
            break;
          case 'auto':
            scale = 0; // Auto
            break;
          default:
            // Try to parse as percentage
            const percentage = parseFloat(zoom);
            if (!isNaN(percentage)) {
              scale = percentage / 100;
            } else {
              console.warn('🔍 Ng2PdfJsViewer: Invalid zoom value:', zoom);
              return;
            }
        }
      } else if (typeof zoom === 'number') {
        scale = zoom;
      } else {
        console.warn('🔍 Ng2PdfJsViewer: Invalid zoom type:', typeof zoom);
        return;
      }
      
      // Validate scale value
      if (scale < 0.1 || scale > 10) {
        console.warn('🔍 Ng2PdfJsViewer: Zoom scale out of range:', scale, '(valid range: 0.1-10)');
        return;
      }
      
      app.pdfViewer.currentScale = scale;
      log(`Zoom set to ${zoom} (scale: ${scale})`);
    } else {
      log('PDFViewerApplication not ready for zoom update', 'warn');
    }
  }

  function updateCursor(cursor) {
    const app = PDFViewerApplication;
    if (app && app.pdfViewer) {
      const cursorType = cursor.toUpperCase();
      if (cursorType === 'HAND' || cursorType === 'H') {
        app.pdfViewer.cursorTool = 1; // HAND
      } else if (cursorType === 'SELECT' || cursorType === 'S') {
        app.pdfViewer.cursorTool = 0; // SELECT
      } else if (cursorType === 'ZOOM' || cursorType === 'Z') {
        app.pdfViewer.cursorTool = 2; // ZOOM
      }
      log(`Cursor set to ${cursor} (tool: ${app.pdfViewer.cursorTool})`);
    } else {
      log('PDFViewerApplication not ready for cursor update', 'warn');
    }
  }

  function updateScroll(scroll) {
    const app = PDFViewerApplication;
    if (app && app.pdfViewer) {
      const scrollType = scroll.toUpperCase();
      if (scrollType === 'VERTICAL' || scrollType === 'V') {
        app.pdfViewer.scrollMode = 0; // VERTICAL
      } else if (scrollType === 'HORIZONTAL' || scrollType === 'H') {
        app.pdfViewer.scrollMode = 1; // HORIZONTAL
      } else if (scrollType === 'WRAPPED' || scrollType === 'W') {
        app.pdfViewer.scrollMode = 2; // WRAPPED
      }
      log(`Scroll mode set to ${scroll} (mode: ${app.pdfViewer.scrollMode})`);
    } else {
      log('PDFViewerApplication not ready for scroll update', 'warn');
    }
  }

  function updateSpread(spread) {
    const app = PDFViewerApplication;
    if (app && app.pdfViewer) {
      const spreadType = spread.toUpperCase();
      if (spreadType === 'ODD' || spreadType === 'O') {
        app.pdfViewer.spreadMode = 1; // ODD
      } else if (spreadType === 'EVEN' || spreadType === 'E') {
        app.pdfViewer.spreadMode = 2; // EVEN
      } else if (spreadType === 'NONE' || spreadType === 'N') {
        app.pdfViewer.spreadMode = 0; // NONE
      }
      log(`Spread mode set to ${spread} (mode: ${app.pdfViewer.spreadMode})`);
    } else {
      log('PDFViewerApplication not ready for spread update', 'warn');
    }
  }

  // Navigation control functions
  function updatePage(page) {
    const app = PDFViewerApplication;
    if (app && app.pdfViewer) {
      const pageNum = parseInt(page);
      if (pageNum >= 1 && pageNum <= app.pagesCount) {
        app.pdfViewer.currentPageNumber = pageNum;
        log(`Page set to ${pageNum}`);
      } else {
        log(`Invalid page number ${pageNum} (valid range: 1-${app.pagesCount})`, 'warn');
      }
    } else {
      log('PDFViewerApplication not ready for page update', 'warn');
    }
  }

  function updateRotation(rotation) {
    const app = PDFViewerApplication;
    if (app && app.pdfViewer) {
      const rotationValue = parseInt(rotation);
      if (rotationValue % 90 === 0) {
        app.pdfViewer.pagesRotation = rotationValue;
        log(`Rotation set to ${rotationValue}`);
      } else {
        log(`Invalid rotation value ${rotationValue} (must be multiple of 90)`, 'warn');
      }
    } else {
      log('PDFViewerApplication not ready for rotation update', 'warn');
    }
  }

  function goToLastPage() {
    const app = PDFViewerApplication;
    if (app && app.pdfViewer) {
      const lastPage = app.pagesCount;
      app.pdfViewer.currentPageNumber = lastPage;
      log(`Navigated to last page ${lastPage}`);
    } else {
      log('PDFViewerApplication not ready for last page navigation', 'warn');
    }
  }

  function goToNamedDestination(destination) {
    const app = PDFViewerApplication;
          if (app && app.pdfLinkService) {
        try {
          app.pdfLinkService.goToDestination(destination);
          log(`Navigated to named destination ${destination}`);
        } catch (error) {
          log(`Error navigating to destination ${destination}: ${error.message}`, 'error');
        }
      } else {
        log('PDFViewerApplication not ready for named destination navigation', 'warn');
      }
  }

  // Sidebar mode control
  function updatePageMode(mode) {
    const app = PDFViewerApplication;
    if (app && app.pdfSidebar) {
      const modeType = mode.toLowerCase();
      switch (modeType) {
        case 'none':
          app.pdfSidebar.close();
          break;
        case 'thumbs':
          app.pdfSidebar.open('thumbs');
          break;
        case 'bookmarks':
          app.pdfSidebar.open('outline');
          break;
        case 'attachments':
          app.pdfSidebar.open('attachments');
          break;
        default:
          log(`Unknown page mode ${mode}`, 'warn');
      }
      log(`Page mode set to ${mode}`);
    } else {
      log('PDFViewerApplication not ready for page mode update', 'warn');
    }
  }

  // Auto action functions
  function triggerDownload() {
    const app = PDFViewerApplication;
    if (app && app.downloadManager) {
      try {
        // Use the downloadManager to trigger download
        const filename = app._docFilename || 'document.pdf';
        const url = app._downloadUrl || app.baseUrl;
        
        if (url) {
          app.downloadManager.openOrDownloadData(url, filename);
          log('Download triggered via downloadManager');
        } else {
          log('No download URL available', 'warn');
        }
      } catch (error) {
        log(`Error triggering download: ${error.message}`, 'error');
      }
    } else {
      log('PDFViewerApplication or downloadManager not available for download', 'warn');
    }
  }

  function triggerPrint() {
    const app = PDFViewerApplication;
    log('triggerPrint called');
    if (app) {
      try {
        // In PDF.js v4.x, print is implemented via window.print()
        if (typeof window.print === 'function') {
          log('Calling window.print()');
          window.print();
          log('Print triggered via window.print()');
        } else {
          log('Print method not available', 'warn');
        }
      } catch (error) {
        log(`Error triggering print: ${error.message}`, 'error');
        throw error; // Re-throw to be caught by the message handler
      }
    } else {
      log('PDFViewerApplication not available for print', 'warn');
    }
  }

  function triggerRotateCW() {
    const app = PDFViewerApplication;
    if (app && app.pdfViewer) {
      const currentRotation = app.pdfViewer.pagesRotation;
      app.pdfViewer.pagesRotation = (currentRotation + 90) % 360;
      log('Rotated clockwise');
    }
  }

  function triggerRotateCCW() {
    const app = PDFViewerApplication;
    if (app && app.pdfViewer) {
      const currentRotation = app.pdfViewer.pagesRotation;
      app.pdfViewer.pagesRotation = (currentRotation - 90 + 360) % 360;
      log('Rotated counter-clockwise');
    }
  }

  // Response handling
  function sendResponse(id, response) {
    if (id) {
      window.parent.postMessage({
        type: 'control-response',
        id,
        ...response
      }, '*');
    }
  }

  // State synchronization
  function getState() {
    const app = PDFViewerApplication;
    if (app && app.pdfViewer) {
      return {
        currentPage: app.pdfViewer.currentPageNumber,
        totalPages: app.pagesCount,
        currentScale: app.pdfViewer.currentScale,
        currentRotation: app.pdfViewer.pagesRotation,
        scrollMode: app.pdfViewer.scrollMode,
        spreadMode: app.pdfViewer.spreadMode
      };
    }
    return null;
  }

  // Start the wrapper
  waitForViewer();
})(); 