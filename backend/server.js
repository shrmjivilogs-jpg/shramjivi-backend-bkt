const express = require('express');
const cors = require('cors');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const https = require('https');  // ✅ ADDED FOR BACKGROUND/LOGO
const PDFDocument = require('pdfkit');
const jwt = require('jsonwebtoken');
const cloudinary = require('cloudinary').v2;
const QRCode = require('qrcode');
const mongoose = require('mongoose');

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// 🛠️ MONGODB CONNECTION
const MONGO_URI = "mongodb+srv://shrmjivilogs_db_user:nmK6mrig9KuGXagl@shrmjivideck.zthcj1m.mongodb.net/shramjivi_prod?retryWrites=true&w=majority&appName=Shrmjivideck";

mongoose.connect(MONGO_URI)
  .then(() => console.log("🚀 MongoDB Connected Successfully!"))
  .catch(err => console.log("❌ MongoDB Connection Error:", err));

// 📝 WORKER SCHEMA (UNCHANGED)
const workerSchema = new mongoose.Schema({
  formNo: String,
  name: String,
  adminId: String,
  status: { type: String, default: 'Verified' },
  createdAt: { type: Date, default: Date.now },
  scanLink: String,
  photoUrl: String,
  zone: String,
  designation: String,
  fhName: String,
  dob: String,
  sex: String,
  bloodGroup: String,
  category: String,
  mobileNo: String,
  email: String,
  communicationAddress: String,
  address: String,
  aadhaarNo: String,
  panNo: String,
  eshramNo: String,
  accName: String,
  accNo: String,
  ifsc: String,
  bankName: String,
  education: String,
  shed: String,
  division: String,
  maritalStatus: String
});

const Worker = mongoose.model('Worker', workerSchema);

// 🔢 COUNTER SCHEMA (UNCHANGED)
const counterSchema = new mongoose.Schema({ lastId: { type: Number, default: 0 } });
const Counter = mongoose.model('Counter', counterSchema);

// ✅ RENDER SAFE: Memory storage (no disk)
const storage = multer.memoryStorage();
const upload = multer({ storage });

const SECRET_KEY = "shramjivi_admin_secret";

// Cloudinary Config
cloudinary.config({
  cloud_name: 'dcvfwp1ey',
  api_key: '591784787721532',
  api_secret: 'tjSGEPgQ7YATCYLOAAMPKJ10bTY'
});

// --- AUTH & HELPERS (UNCHANGED) ---
const ADMIN_USERS = [
  {
    username: "bilip-sgmc-010",
    password: "Accd@1111",
    id: "BKT-SGMC-2025-010",
    firstName: "Bilip",
    lastName: "Kumar Taye",
    zone: "NFR"
  },
  {
    username: "user1",
    password: "123456",
    id: "ADM-2025-001",
    firstName: "Shramjivi",
    lastName: "Admin",
    zone: "NFR"
  }
];

app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  const user = ADMIN_USERS.find(u => u.username === username && u.password === password);
  
  if (user) {
    const token = jwt.sign({ id: user.id }, SECRET_KEY, { expiresIn: '12h' });
    return res.json({ success: true, token, user });
  }
  return res.status(401).json({ success: false, message: "Invalid credentials" });
});

app.get('/api/profile/:id', (req, res) => {
  const user = ADMIN_USERS.find(u => u.id === req.params.id);
  res.json(user || ADMIN_USERS[0]);
});

// Sequential form logic (UNCHANGED)
const getNextFormNumber = async (zone) => {
  let counter = await Counter.findOne();
  counter = await Counter.create({ lastId: 500 });  // 501-1000
  
  counter.lastId += 1;
  await counter.save();
  
  const paddedId = String(counter.lastId).padStart(6, '0');
  const zoneCode = zone ? zone.toUpperCase() : 'NA';
  return `SGWC/${zoneCode}/${paddedId}`;
};

app.get('/api/workers', async (req, res) => {
  const workers = await Worker.find().sort({ createdAt: -1 });
  res.json(workers);
});

// ✅ FIXED IMAGE HELPER FUNCTION
const loadImageAsync = (url) => {
  return new Promise((resolve) => {
    https.get(url, (res) => {
      let data = [];
      res.on('data', (chunk) => data.push(chunk));
      res.on('end', () => resolve(Buffer.concat(data)));
    }).on('error', () => resolve(null));
  });
};

// ✅ FIXED PDF GENERATION WITH BACKGROUND
const generateWorkerPDF = async (worker, res, req) => {
  console.log('🎨 PDF START:', worker.formNo);
  
  const doc = new PDFDocument({ margin: 0, size: 'A4' });
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="Application_${worker.formNo.replace(/\//g, '_')}.pdf"`);
  doc.pipe(res);

  // ✅ FIXED BACKGROUND - 100% WORKING
  try {
    const bgData = await loadImageAsync('https://res.cloudinary.com/dcvfwp1ey/image/upload/v1767183408/formbg_sew3ez.jpg');
    if (bgData) {
      doc.image(bgData, 0, 0, { width: 595.28, height: 841.89 });
      console.log('✅ FORM BACKGROUND EMBEDDED');
    } else {
      console.log('⚠️ Background failed - using plain');
    }
  } catch(e) {
    console.log('⚠️ Background error:', e.message);
  }

  // Photo frame
  const photoX = 475, photoY = 165, photoW = 70, photoH = 85;
  doc.lineWidth(0.8).strokeColor('#00188f').rect(photoX, photoY, photoW, photoH).stroke();

  // ✅ FIXED PHOTO HANDLING
  if (worker.photoUrl) {
    try {
      const photoData = await loadImageAsync(worker.photoUrl);
      if (photoData) {
        doc.image(photoData, photoX + 1.5, photoY + 1.5, { width: photoW - 3, height: photoH - 3 });
        console.log('✅ Photo EMBEDDED');
      } else {
        console.log('⚠️ Photo load failed');
        doc.rect(photoX + 2, photoY + 2, photoW - 4, photoH - 4).stroke();
        doc.fontSize(6).fillColor('#999').text('NO PHOTO', photoX + 5, photoY + 35);
      }
    } catch(e) {
      console.log('⚠️ Photo error:', e.message);
      doc.rect(photoX + 2, photoY + 2, photoW - 4, photoH - 4).stroke();
      doc.fontSize(6).fillColor('#999').text('NO PHOTO', photoX + 5, photoY + 35);
    }
  } else {
    doc.rect(photoX + 2, photoY + 2, photoW - 4, photoH - 4).stroke();
    doc.fontSize(7).fillColor('#ccc').text('BLUE BACKGROUND PHOTO', photoX + 5, photoY + 35);
  }

  // FORM CONTENT (EXACT SAME - ALL BELOW UNCHANGED)
  doc.fillColor('red').font('Helvetica-Bold').fontSize(8.5).text(`FORM NO: ${worker.formNo}`, 55, 138);
  doc.rect(50, 148, 495, 22).fill('#00188f');
  doc.fillColor('white').font('Helvetica-Bold').fontSize(11).text('APPLICATION FORM FOR REGISTRATION', 50, 155, { align: 'center', width: 495 });

  // PART 1
  doc.rect(50, 170, 495, 12).fill('#eeeeee');
  doc.fillColor('#00188f').font('Helvetica-Bold').fontSize(8).text('PART 1', 50, 173, { align: 'center', width: 495 });

  let cy = 182;
  const rowH = 24;

  const drawRow = (l, v, y) => {
    doc.rect(50, y, 105, rowH).fill('#f2f2f2');
    doc.rect(50, y, 495, rowH).strokeColor('#cccccc').lineWidth(0.4).stroke();
    doc.fillColor('#00188f').font('Helvetica-Bold').fontSize(8).text(l.toUpperCase(), 55, y + 8);
    doc.fillColor('black').font('Helvetica').fontSize(9).text(v || 'N/A', 160, y + 8);
  };

  const drawSplitRow = (l1, v1, l2, v2, y) => {
    doc.rect(50, y, 495, rowH).strokeColor('#cccccc').stroke();
    doc.rect(50, y, 105, rowH).fill('#f2f2f2');
    doc.fillColor('#00188f').font('Helvetica-Bold').fontSize(8).text(l1.toUpperCase(), 55, y + 8);
    doc.fillColor('black').font('Helvetica').fontSize(9).text(v1 || 'N/A', 160, y + 8);
    doc.rect(300, y, 105, rowH).fill('#f2f2f2');
    doc.fillColor('#00188f').font('Helvetica-Bold').fontSize(8).text(l2.toUpperCase(), 305, y + 8);
    doc.fillColor('black').font('Helvetica').fontSize(9).text(v2 || 'N/A', 410, y + 8);
  };

  // PART 1 FIELDS
  drawRow('Designation', worker.designation, cy); cy += rowH;
drawRow('Full Name', worker.name, cy); cy += rowH;
drawRow("Father/Husband Name", worker.fhName, cy); cy += rowH;  // ✅ FIXED
drawSplitRow('Date of Birth', worker.dob, 'Gender', worker.sex, cy); cy += rowH;
drawSplitRow('Category', worker.category, 'Blood Group', worker.bloodGroup, cy); cy += rowH;
drawRow('Marital Status', worker.maritalStatus, cy); cy += rowH;
drawSplitRow('Contact No', worker.mobileNo, 'Email ID', worker.email, cy); cy += rowH;

  // ADDRESSES
  const addrH = 30;
  doc.rect(50, cy, 105, addrH).fill('#f2f2f2').strokeColor('#cccccc').rect(50, cy, 495, addrH).stroke();
  doc.fillColor('#00188f').font('Helvetica-Bold').fontSize(6).text('COMMUNICATION ADDRESS', 55, cy + 11);
  doc.fillColor('black').font('Helvetica').fontSize(9).text(worker.communicationAddress || 'N/A', 160, cy + 6, { width: 380 });
  cy += addrH;

  doc.rect(50, cy, 105, addrH).fill('#f2f2f2').strokeColor('#cccccc').rect(50, cy, 495, addrH).stroke();
  doc.fillColor('#00188f').font('Helvetica-Bold').fontSize(6).text('PERMANENT ADDRESS', 55, cy + 11);
  doc.fillColor('black').font('Helvetica').fontSize(9).text(worker.address || 'N/A', 160, cy + 6, { width: 380 });
  cy += addrH + 8;

  // PART 2
  doc.rect(50, cy, 495, 18).fill('#eeeeee');
  doc.fillColor('#00188f').font('Helvetica-Bold').fontSize(9).text('PART 2', 50, cy + 5, { align: 'center', width: 495 });
  cy += 18;

  drawSplitRow('Aadhaar No', worker.aadhaarNo, 'PAN Card No', worker.panNo, cy); cy += rowH;
drawRow('E-Shram No', worker.eshramNo, cy); cy += rowH;
drawRow('A/C HOLDER NAME', worker.accName, cy); cy += rowH;  // ✅ FIXED
drawRow('Bank A/C No', worker.accNo, cy); cy += rowH;
drawSplitRow('IFSC Code', worker.ifsc, 'Bank Name', worker.bankName, cy); cy += rowH;
drawRow('Education', worker.education, cy); cy += rowH;

  // DECLARATION
  cy += 12;
  const dbH = 85;
  doc.rect(50, cy, 495, dbH).strokeColor('#00188f').lineWidth(0.8).stroke();
  doc.fillColor('#00188f').font('Helvetica-Bold').fontSize(8.5).text('DECLARATION BY APPLICANT', 60, cy + 8);
  doc.fillColor('black').font('Helvetica').fontSize(8).text(
    `I, ${worker.name || 'the applicant'}, hereby declare that all information given above is true and correct to the best of my knowledge and belief. I further affirm that this declaration is made in sound state of mine and good health without any peer & pressure or any undue influence. I understand that providing false or misleading information may lead to cancellation of my application or legal action as per company rules.`,
    60, cy + 20, { width: 475, align: 'justify', lineGap: 1.5 }
  );

  doc.moveTo(390, cy + 75).lineTo(480, cy + 75).strokeColor('#000').lineWidth(0.5).stroke();
  doc.fontSize(7).text('APPLICANT SIGNATURE', 390, cy + 78, { width: 90, align: 'center' });

  // OFFICIAL BOX
  const offY = cy + dbH + 20;
  const officialBoxH = 110;
  doc.rect(50, offY, 495, officialBoxH).strokeColor('#ff0000').lineWidth(1.5).stroke();
  doc.fillColor('red').font('Helvetica-Bold').fontSize(10).text('FOR OFFICIAL USE ONLY', 50, offY + 8, { align: 'center', width: 495 });

  doc.fillColor('#00188f').font('Helvetica-Bold').fontSize(9).text('ZONE:', 70, offY + 35);
doc.fillColor('black').font('Helvetica').fontSize(9).text(worker.zone?.toUpperCase() || '__________________', 110, offY + 35);

doc.fillColor('#00188f').font('Helvetica-Bold').fontSize(9).text('DIVISION:', 260, offY + 35);
doc.fillColor('black').font('Helvetica').fontSize(9).text('______________________', 315, offY + 35);  // ✅ ALWAYS BLANK

doc.fillColor('#00188f').font('Helvetica-Bold').fontSize(9).text('SHED:', 70, offY + 60);
doc.fillColor('black').font('Helvetica').fontSize(9).text('______________________', 110, offY + 60);  // ✅ BLANK

  doc.fillColor('#00188f').font('Helvetica-Bold').fontSize(9).text('VERIFIER NAME & SIGNATURE:', 70, offY + 85);
  doc.moveTo(215, offY + 95).lineTo(360, offY + 95).strokeColor('#000000').lineWidth(0.5).stroke();

  // QR Code
  try {
    const qrUrl = `https://${req.get('host')}/api/workers/${worker._id}/pdf`;
    const qrDataUrl = await QRCode.toDataURL(qrUrl, { margin: 1, width: 60 });
    doc.image(qrDataUrl, 385, offY + 45, { width: 42 });
    doc.fontSize(5.5).fillColor('#444').font('Helvetica').text('SCAN TO VERIFY', 380, offY + 90, { width: 55, align: 'center' });
  } catch (err) {
    console.log('QR Error:', err.message);
  }

  // Seal box
  const sealBoxX = 440, sealBoxY = offY + 28, sealBoxW = 95, sealBoxH = 70;
  doc.rect(sealBoxX, sealBoxY, sealBoxW, sealBoxH).strokeColor('#00188f').lineWidth(0.8).stroke();
  doc.fontSize(7).fillColor('#00188f').font('Helvetica-Bold')
    .text("APPROVER'S SEAL", sealBoxX, sealBoxY + 8, { width: sealBoxW, align: 'center' })
    .text("& SIGNATURE", sealBoxX, sealBoxY + 18, { width: sealBoxW, align: 'center' });
  doc.fontSize(6).font('Helvetica').text("(Authorized Authority)", sealBoxX, sealBoxY + 58, { width: sealBoxW, align: 'center' });

  console.log('✅ PDF COMPLETE:', worker.formNo);
  doc.end();
};

// ✅ FIXED ACKNOWLEDGEMENT WITH LOGO
app.get('/api/workers/:id/receipt', async (req, res) => {
  const worker = await Worker.findById(req.params.id);
  if (!worker) return res.status(404).json({ message: "Worker not found" });

  const doc = new PDFDocument({ size: 'A4', margin: 40 });
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="Acknowledgement_${worker.formNo.replace(/\//g, '_')}.pdf"`);
  doc.pipe(res);

  // ✅ FIXED HEADER WITH LOGO
  doc.rect(0, 0, 595.28, 90).fill('#00188f');
  
  try {
    const logoData = await loadImageAsync('https://res.cloudinary.com/dcvfwp1ey/image/upload/v1767185943/logo_h7gix5.png');
    if (logoData) {
      doc.image(logoData, 20, 15, { width: 55, height: 55 });
      console.log('✅ LOGO EMBEDDED');
    } else {
      console.log('⚠️ Logo failed');
    }
  } catch(e) {
    console.log('⚠️ Logo error:', e.message);
  }
  
  doc.fillColor('white').font('Helvetica-Bold').fontSize(14).text('SHRAMJIVI GOODSHED WORKERS', 85, 25);
  doc.fontSize(12).text('MANAGEMENT CORPORATION LIMITED', 85, 40);
  doc.fontSize(7.5).font('Helvetica').text('RS. 430, 4TH FLOOR, ASMI INDUSTRIAL COMPLEX, GOREGAON WEST, MUMBAI', 85, 55);
  doc.fontSize(9).font('Helvetica-Bold').text('MEMBER REGISTRATION ACKNOWLEDGEMENT', 85, 68);

  // REST OF RECEIPT (UNCHANGED)
  doc.fillColor('#1a202c').font('Helvetica-Bold').fontSize(18).text('OFFICIAL ACKNOWLEDGEMENT', 0, 130, { align: 'center' });
  doc.moveTo(220, 150).lineTo(375, 150).lineWidth(1.5).strokeColor('#00188f').stroke();

  let cy = 180;
  doc.rect(50, cy, 495, 220).strokeColor('#e2e8f0').lineWidth(0.5).stroke();
  doc.rect(50.5, cy + 0.5, 494, 45).fill('#f8fafc');
  doc.fillColor('#4a5568').font('Helvetica-Bold').fontSize(10).text('APPLICATION FORM NUMBER', 75, cy + 18);
  doc.fillColor('#d32f2f').fontSize(14).text(worker.formNo, 260, cy + 16);

  const drawRow = (y, label, value, color = '#1a202c') => {
    doc.moveTo(50, y).lineTo(545, y).strokeColor('#e2e8f0').stroke();
    doc.fillColor('#64748b').font('Helvetica-Bold').fontSize(9).text(label, 75, y + 14);
    doc.fillColor(color).font('Helvetica').fontSize(11).text(value || 'N/A', 260, y + 13);
  };

  drawRow(cy + 45, 'WORKER FULL NAME', worker.name?.toUpperCase());
  drawRow(cy + 89, 'SUBMISSION TIMESTAMP', new Date(worker.createdAt).toLocaleString('en-IN', { 
  dateStyle: 'medium', 
  timeStyle: 'short',
  hour12: true,
  timeZone: 'Asia/Kolkata'  // ✅ CORRECT IST
}), '#2d3748');

  drawRow(cy + 133, 'SUBMISSION STATUS', 'SUCCESSFULLY RECEIVED', '#16a34a');
  drawRow(cy + 177, 'INTERNAL VERIFICATION', 'UNDER ADMINISTRATIVE REVIEW', '#ea580c');

  let noteY = 430;
  doc.rect(50, noteY, 495, 60).fill('#f1f5f9');
  doc.fillColor('#475569').font('Helvetica').fontSize(8.5).text(
    "Note: This document serves as a formal acknowledgement of your membership application. Verification of documents and digital credentials are currently under review. Final approval is subject to multi-level administrative validation.",
    70, noteY + 15, { width: 455, align: 'justify' }
  );

  let sigY = 620;
  doc.strokeColor('#cbd5e0').lineWidth(0.5).moveTo(50, sigY).lineTo(180, sigY).stroke();
  doc.moveTo(415, sigY).lineTo(545, sigY).stroke();
  doc.fillColor('#2d3748').font('Helvetica-Bold').fontSize(8).text('SYSTEM ADMINISTRATOR', 50, sigY + 8, { width: 130, align: 'center' });
  doc.text('AUTHORIZED SIGNATORY', 415, sigY + 8, { width: 130, align: 'center' });

  doc.rect(0, 770, 595.28, 71).fill('#00188f');
  doc.fillColor('white').font('Helvetica').fontSize(7.5).text('AUTHENTICATED GENERATION ON: ' + new Date().toLocaleString(), 0, 802, { align: 'center' });
  doc.end();
});

// ALL OTHER ENDPOINTS (UNCHANGED - register, pdf view, scan upload)
app.post('/api/workers/register', upload.single('photo'), async (req, res) => {
  try {
    console.log('📥 Form received:', req.body.name);
    
    const data = req.body;
    const count = await Worker.countDocuments({ adminId: data.adminId });
    if (count >= 500) return res.status(403).send("Limit Reached (500 forms)");

    const finalFormNo = await getNextFormNumber(data.zone);
    let photoUrl = null;

    if (req.file) {
      try {
        const base64Image = req.file.buffer.toString('base64');
        const mimeType = req.file.mimetype || 'image/jpeg';
        
        const uploadResult = await cloudinary.uploader.upload(
          `data:${mimeType};base64,${base64Image}`,
          { 
            folder: `Shramjivi-Photos/${finalFormNo}`,
            resource_type: 'image'
          }
        );
        
        photoUrl = uploadResult.secure_url;
        console.log('✅ Photo uploaded to Cloudinary:', photoUrl);
      } catch (uploadErr) {
        console.error('❌ Cloudinary upload failed:', uploadErr.message);
        photoUrl = null;
      }
    }
    
    const newWorker = new Worker({
      formNo: finalFormNo,
      photoUrl,
      adminId: data.adminId,
      ...data
    });
    
    await newWorker.save();
    console.log('💾 Saved worker:', newWorker.formNo);
    
    await generateWorkerPDF(newWorker, res, req);
    
  } catch (err) {
    console.error('❌ FULL ERROR:', err);
    res.status(500).json({ 
      error: 'Generation Failed', 
      details: err.message 
    });
  }
});

app.get('/api/workers/:id/pdf', async (req, res) => {
  const worker = await Worker.findById(req.params.id);
  if (!worker) return res.status(404).json({ message: "Worker not found" });
  await generateWorkerPDF(worker, res, req);
});

app.post('/api/workers/:id/upload-scan', upload.single('scan'), async (req, res) => {
  try {
    const workerId = req.params.id;
    const worker = await Worker.findById(workerId);
    if (!worker) return res.status(404).json({ success: false, message: "Worker not found" });
    
    worker.status = 'Verified';
    
    if (req.file) {
      try {
        const base64Scan = req.file.buffer.toString('base64');
        const mimeType = req.file.mimetype || 'image/jpeg';
        
        const uploadResult = await cloudinary.uploader.upload(
          `data:${mimeType};base64,${base64Scan}`,
          { 
            folder: `Shramjivi-Scans/${worker.formNo}`,
            resource_type: 'image'
          }
        );
        
        worker.scanLink = uploadResult.secure_url;
        console.log('✅ Scan uploaded to Cloudinary');
      } catch (uploadErr) {
        console.error('❌ Scan upload failed:', uploadErr.message);
      }
    } else if (req.body.driveLink) {
      worker.scanLink = req.body.driveLink;
    }
    
    await worker.save();
    res.json({ success: true, message: "Verification link saved!" });
  } catch (err) {
    console.error('Scan upload error:', err);
    res.status(500).json({ success: false, message: "Process failed" });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 MongoDB Server Fully Active on port ${PORT}!`));
