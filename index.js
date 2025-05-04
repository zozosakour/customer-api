const express = require('express');
const axios = require('axios');
const app = express();

// إعدادات
const COLLECTION = "users";
const PROJECT_ID = "uber-6ecfc";
const API_KEY = "AIzaSyClDyfXBDdkBiplSMlOWID4jKDklg44E4Y";
const VALID_USERNAME = "AselCompanyAPI";
const VALID_PASSWORD = "A$el2025@Secure!";

// middleware لتحليل JSON
app.use(express.json());

// Basic Auth middleware
function basicAuth(req, res, next) {
  const authHeader = req.headers.authorization || '';
  if (!authHeader.startsWith('Basic ')) {
    return unauthorizedResponse(res);
  }

  const base64Credentials = authHeader.split(' ')[1];
  const credentials = Buffer.from(base64Credentials, 'base64').toString('utf8');
  const [username, password] = credentials.split(':');

  if (username !== VALID_USERNAME || password !== VALID_PASSWORD) {
    return unauthorizedResponse(res);
  }

  next();
}

// نقطة النهاية للتحقق من العميل
app.post('/check-customer', basicAuth, async (req, res) => {
  try {
    const { MobileNo, CustomerZone } = req.body;

    if (!MobileNo || !CustomerZone) {
      return invalidResponse(res);
    }

    const queryPayload = {
      structuredQuery: {
        from: [{ collectionId: COLLECTION }],
        where: {
          fieldFilter: {
            field: { fieldPath: "phone" },
            op: "EQUAL",
            value: { stringValue: MobileNo }
          }
        },
        limit: 1
      }
    };

    const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents:runQuery?key=${API_KEY}`;

    const response = await axios.post(url, queryPayload, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    const result = response.data;
    const found = result.find(entry => entry.document);

    if (found) {
      const documentPath = found.document.name;
      const documentId = documentPath.split('/').pop();

      return res.json({
        Code: "1",
        SCustID: documentId,
        DescriptionAr: "تم التحقق من تفاصيل العميل بنجاح",
        DescriptionEn: "Customer details verified successfully"
      });
    } else {
      return invalidResponse(res);
    }

  } catch (err) {
    console.error("Server error:", err);
    return res.json({
      Code: "2",
      SCustID: null,
      DescriptionAr: "خطأ في الخادم",
      DescriptionEn: "Server error"
    });
  }
});

// ردود المساعدة
function unauthorizedResponse(res) {
  return res.status(401).json({
    Code: "2",
    SCustID: null,
    DescriptionAr: "طلب غير مصرح",
    DescriptionEn: "Unauthorized request"
  });
}

function invalidResponse(res) {
  return res.status(400).json({
    Code: "2",
    SCustID: null,
    DescriptionAr: "تفاصيل العميل غير صالحة",
    DescriptionEn: "Invalid customer details"
  });
}

// تشغيل السيرفر
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ API running on http://localhost:${PORT}`);
});
