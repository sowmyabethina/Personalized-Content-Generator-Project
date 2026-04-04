/**
 * PDF Controller
 * Handles PDF route logic (req/res handling)
 * 
 * MUST be thin - ONLY receives req/res, calls services, returns response
 */

const PDFDocument = require('pdfkit');
const { generateFromPdf } = require('../services/aiService');
const { processResumePdf, extractGitHubUrls, readPdfFromGithub } = require('../services/pdfService');
const { handleError } = require('../utils/errorHandler');
const { log } = require('../utils/logger');

/**
 * Read PDF from GitHub URL - handles /pdf/read-pdf
 * Expects: { github_url }
 */
async function readPdf(req, res) {
  try {
    const { github_url } = req.body;
    
    if (!github_url) {
      return res.status(400).json({ error: 'github_url required' });
    }

    const result = await readPdfFromGithub(github_url);
    
    // Extract GitHub URLs from the extracted text
    const githubUrls = extractGitHubUrls(result.text);
    
    log(`PDF extracted: ${result.characterCount} characters, ${githubUrls.length} URLs`);
    
    return res.json({ 
      text: result.text,
      metadata: {
        githubUrls: githubUrls,
        characterCount: result.characterCount
      }
    });

  } catch (err) {
    const errorResponse = handleError(err, '/pdf/read-pdf');
    return res.status(500).json({ error: 'PDF extraction failed', details: errorResponse.message });
  }
}

/**
 * Read resume PDF - handles /pdf/read-resume-pdf
 * Expects: multipart form with 'pdf' file
 */
async function readResumePdf(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No PDF file uploaded' });
    }

    const result = await processResumePdf(req.file.path);

    // Extract GitHub URLs from the extracted text
    const githubUrls = extractGitHubUrls(result.text);

    log(`Resume processed: ${result.text.length} characters, ${githubUrls.length} URLs`);

    return res.json({ 
      text: result.text,
      metadata: {
        githubUrls: githubUrls,
        characterCount: result.text.length
      }
    });

  } catch (err) {
    const errorResponse = handleError(err, '/pdf/read-resume-pdf');
    return res.status(500).json({ error: 'Resume PDF extraction failed', details: errorResponse.message });
  }
}

/**
 * Generate from PDF - handles /pdf/generate-from-pdf
 * Expects: { userProfile, topic? }
 */
async function generateFromPdfHandler(req, res) {
  try {
    const { userProfile, topic } = req.body;
    if (!userProfile) return res.status(400).json({ error: 'Missing user profile' });

    const questions = await generateFromPdf(userProfile, topic);
    return res.json(questions);

  } catch (err) {
    const errorResponse = handleError(err, '/pdf/generate-from-pdf');
    return res.status(500).json({ error: errorResponse.message });
  }
}

/**
 * Download PDF - handles /learning/download-pdf
 * Expects: { content, filename? }
 */
async function downloadPdf(req, res) {
  try {
    const { content, filename } = req.body;

    if (!content) {
      return res.status(400).json({ error: 'Content is required' });
    }

    const safeFilename = (filename || 'learning-material').replace(/[^a-z0-9-]/gi, '-').toLowerCase();
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${safeFilename}.pdf"; filename*=UTF-8''${encodeURIComponent(safeFilename)}.pdf`);
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.removeHeader('X-Powered-By');

    const doc = new PDFDocument({
      size: 'A4',
      margins: { top: 50, bottom: 50, left: 50, right: 50 }
    });

    doc.pipe(res);

    doc.fontSize(20).font('Helvetica-Bold').text('Learning Material', { align: 'center' });
    doc.moveDown();

    const lines = content.split('\n');

    for (const line of lines) {
      if (line.match(/^={30,}$/) || line.match(/^-{30,}$/)) continue;
      if (line.match(/^[A-Z\s]+:$/)) {
        doc.fontSize(14).font('Helvetica-Bold').text(line, { continued: false });
        doc.moveDown(0.3);
      } else if (line.match(/^\d+\.\s+/) && !line.includes('.')) {
        doc.fontSize(14).font('Helvetica-Bold').text(line, { continued: false });
        doc.moveDown(0.3);
      } else if (line.trim().startsWith('•') || line.trim().startsWith('- ')) {
        doc.fontSize(11).font('Helvetica').text(line, { continued: false });
      } else if (!line.trim()) {
        doc.moveDown(0.5);
      } else {
        doc.fontSize(11).font('Helvetica').text(line, { continued: false, lineBreak: true });
      }
    }

    doc.end();
    log('PDF generated successfully');

  } catch (err) {
    if (!res.headersSent) {
      const errorResponse = handleError(err, '/learning/download-pdf');
      return res.status(500).json({ error: 'PDF generation failed', details: errorResponse.message });
    }
  }
}

module.exports = {
  readPdf,
  readResumePdf,
  generateFromPdfHandler,
  downloadPdf
};