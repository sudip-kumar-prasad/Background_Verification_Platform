import PDFDocument from 'pdfkit';

// Helper to mask identity numbers for report output
const maskAadhaar = (aadhaar: string) => `XXXX-XXXX-${aadhaar.slice(8)}`;
const maskPAN = (pan: string) => `XXXXX${pan.slice(5, 9)}X`;

export const generateReportPDF = (candidate: any, verifiedBy: string): Promise<Buffer> => {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: 'A4',
      margin: 50,
    });

    const buffers: Buffer[] = [];
    doc.on('data', (chunk) => buffers.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(buffers)));
    doc.on('error', (err) => reject(err));

    // Colors
    const primaryDark = '#0f172a'; // slate-900
    const primaryLight = '#334155'; // slate-700
    const accentColor = '#3b82f6'; // blue-500
    const bgHeader = '#f1f5f9'; // slate-100
    const bgSuccess = '#dcfce7'; // green-100
    const textSuccess = '#166534'; // green-800
    const bgFailed = '#fee2e2'; // red-100
    const textFailed = '#991b1b'; // red-800
    const bgPartial = '#fef3c7'; // amber-100
    const textPartial = '#92400e'; // amber-800
    const lightText = '#64748b'; // slate-500

    // Header Branding Banner
    doc.rect(0, 0, 595.28, 120).fill(primaryDark);

    // Title inside banner
    doc
      .fillColor('#ffffff')
      .fontSize(22)
      .font('Helvetica-Bold')
      .text('VERIFYFLOW', 50, 40)
      .fontSize(10)
      .font('Helvetica')
      .text('BACKGROUND VERIFICATION SYSTEM', 50, 68);

    doc
      .fillColor('#94a3b8')
      .fontSize(10)
      .text('CONFIDENTIAL REPORT', 420, 45, { align: 'right', width: 120 })
      .text(`Generated: ${new Date().toLocaleDateString()}`, 420, 60, { align: 'right', width: 120 });

    doc.moveDown(5);

    // Document Title
    doc
      .fillColor(primaryDark)
      .fontSize(18)
      .font('Helvetica-Bold')
      .text('Candidate Verification Audit Report', 50, 150);

    // Decorative Horizontal Line
    doc
      .strokeColor(accentColor)
      .lineWidth(2)
      .moveTo(50, 175)
      .lineTo(545, 175)
      .stroke();

    // Section: Candidate Details
    doc
      .fillColor(primaryLight)
      .fontSize(12)
      .font('Helvetica-Bold')
      .text('1. CANDIDATE PROFILE', 50, 195);

    // Profile Box
    doc
      .roundedRect(50, 215, 495, 140, 6)
      .fillColor('#f8fafc')
      .fill();

    doc.fillColor(primaryDark).font('Helvetica-Bold').fontSize(10);

    // Grid Left Column
    doc.text('Full Name:', 70, 235);
    doc.font('Helvetica').text(candidate.fullName, 160, 235);

    doc.font('Helvetica-Bold').text('Email Address:', 70, 260);
    doc.font('Helvetica').text(candidate.email, 160, 260);

    doc.font('Helvetica-Bold').text('Phone Number:', 70, 285);
    doc.font('Helvetica').text(candidate.phone, 160, 285);

    doc.font('Helvetica-Bold').text('Date of Birth:', 70, 310);
    doc.font('Helvetica').text(new Date(candidate.dob).toLocaleDateString(), 160, 310);

    // Grid Right Column
    doc.font('Helvetica-Bold').text('Aadhaar No:', 320, 235);
    doc.font('Helvetica').text(maskAadhaar(candidate.aadhaarNumber), 400, 235);

    doc.font('Helvetica-Bold').text('PAN Card No:', 320, 260);
    doc.font('Helvetica').text(maskPAN(candidate.panNumber), 400, 260);

    doc.font('Helvetica-Bold').text('Address:', 320, 285);
    doc.font('Helvetica').text(candidate.address, 400, 285, { width: 130, height: 50 });

    // Section: Verification Checks
    doc
      .fillColor(primaryLight)
      .fontSize(12)
      .font('Helvetica-Bold')
      .text('2. IDENTITY VERIFICATION DETAILS', 50, 380);

    // Draw table headers
    doc.rect(50, 400, 495, 25).fill(primaryLight);
    doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(9);
    doc.text('CHECK TYPE', 70, 408);
    doc.text('IDENTITY MASKED KEY', 180, 408);
    doc.text('STATUS', 370, 408);
    doc.text('REMARKS', 450, 408);

    // Identify verification logs
    const aadhaarLog = candidate.verificationLogs.find((l: any) => l.verificationType === 'AADHAAR');
    const panLog = candidate.verificationLogs.find((l: any) => l.verificationType === 'PAN');

    const aadhaarStatus = aadhaarLog?.verificationStatus || 'FAILED';
    const panStatus = panLog?.verificationStatus || 'FAILED';

    const aadhaarMsg = (aadhaarLog?.responsePayload as any)?.message || 'Not verified';
    const panMsg = (panLog?.responsePayload as any)?.message || 'Not verified';

    // Row 1: Aadhaar
    doc.rect(50, 425, 495, 30).fill('#ffffff');
    doc.strokeColor('#e2e8f0').lineWidth(1).rect(50, 425, 495, 30).stroke();
    doc.fillColor(primaryDark).font('Helvetica-Bold').fontSize(9).text('Aadhaar Verification', 70, 436);
    doc.font('Helvetica').text(maskAadhaar(candidate.aadhaarNumber), 180, 436);
    
    // Status Badge for Aadhaar
    if (aadhaarStatus === 'VERIFIED') {
      doc.fillColor(textSuccess).font('Helvetica-Bold').text('SUCCESS', 370, 436);
    } else {
      doc.fillColor(textFailed).font('Helvetica-Bold').text('FAILED', 370, 436);
    }
    doc.fillColor(lightText).font('Helvetica').text(aadhaarMsg, 450, 436, { width: 85 });

    // Row 2: PAN
    doc.rect(50, 455, 495, 30).fill('#f8fafc');
    doc.strokeColor('#e2e8f0').lineWidth(1).rect(50, 455, 495, 30).stroke();
    doc.fillColor(primaryDark).font('Helvetica-Bold').fontSize(9).text('PAN Card Verification', 70, 466);
    doc.font('Helvetica').text(maskPAN(candidate.panNumber), 180, 466);

    // Status Badge for PAN
    if (panStatus === 'VERIFIED') {
      doc.fillColor(textSuccess).font('Helvetica-Bold').text('SUCCESS', 370, 466);
    } else {
      doc.fillColor(textFailed).font('Helvetica-Bold').text('FAILED', 370, 466);
    }
    doc.fillColor(lightText).font('Helvetica').text(panMsg, 450, 466, { width: 85 });

    // Section: Overall Verification Summary
    doc
      .fillColor(primaryLight)
      .fontSize(12)
      .font('Helvetica-Bold')
      .text('3. AUDIT CONCLUSION', 50, 510);

    // Verdict Container
    let verdictBg = bgFailed;
    let verdictTextCol = textFailed;
    let statusLabel = 'FAILED';
    let verdictExplanation = 'Candidate verification failed on both identity checks. The candidate is NOT recommended.';

    if (candidate.status === 'VERIFIED') {
      verdictBg = bgSuccess;
      verdictTextCol = textSuccess;
      statusLabel = 'VERIFIED';
      verdictExplanation = 'Candidate identity records (Aadhaar & PAN) have been successfully authenticated against mock government registries. Identity matches successfully.';
    } else if (candidate.status === 'PARTIAL') {
      verdictBg = bgPartial;
      verdictTextCol = textPartial;
      statusLabel = 'PARTIAL';
      verdictExplanation = 'Candidate verification completed with mixed results. One of the documents failed validation check. Further manual inquiry is suggested.';
    }

    doc
      .roundedRect(50, 530, 495, 80, 6)
      .fillColor(verdictBg)
      .fill();

    doc
      .fillColor(verdictTextCol)
      .font('Helvetica-Bold')
      .fontSize(11)
      .text(`OVERALL STATUS: ${statusLabel}`, 70, 545);

    doc
      .fillColor(primaryDark)
      .font('Helvetica')
      .fontSize(9.5)
      .text(verdictExplanation, 70, 565, { width: 450 });

    // Section: Sign-off block
    doc.fontSize(10).fillColor(primaryDark).font('Helvetica-Bold').text('Verified By:', 50, 645);
    doc.font('Helvetica').text(verifiedBy, 120, 645);

    doc.font('Helvetica-Bold').text('Date of Review:', 50, 665);
    doc.font('Helvetica').text(new Date(candidate.updatedAt).toLocaleDateString(), 140, 665);

    // Digital signature placeholder
    doc.rect(360, 630, 185, 55).strokeColor('#cbd5e1').lineWidth(1).stroke();
    doc
      .fontSize(8)
      .fillColor(lightText)
      .text('VERIFYFLOW SECURITY SEAL', 360, 638, { align: 'center', width: 185 })
      .text('[ DIGITALLY SECURED ]', 360, 665, { align: 'center', width: 185 });

    // Document Footer
    doc
      .fontSize(7.5)
      .fillColor(lightText)
      .text('VerifyFlow Background Verification Platform. This is a computer-generated audit log document.', 50, 750, { align: 'center', width: 495 });

    doc.end();
  });
};
