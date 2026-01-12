const functions = require("firebase-functions");
const admin = require("firebase-admin");
const cors = require('cors')({ origin: true }); // 누구나 접속 허용

admin.initializeApp();
const db = admin.firestore();

// 1. 사용자 저장 (Create)
exports.createUser = functions.https.onRequest((req, res) => {
    cors(req, res, async () => {
        try {
            const { uid, name, job } = req.body;
            await db.collection("users").doc(uid).set({
                name,
                job,
                createdAt: new Date().toISOString()
            });
            res.status(200).json({ message: "✅ 저장 완료!" });
        } catch (error) {
            res.status(500).send("❌ 에러: " + error.message);
        }
    });
});

// 2. 사용자 조회 (Read)
exports.getUser = functions.https.onRequest((req, res) => {
    cors(req, res, async () => {
        try {
            // URL 뒤에 ?uid=... 로 보낸 값을 가져옵니다.
            const uid = req.query.uid;
            const doc = await db.collection("users").doc(uid).get();

            if (!doc.exists) {
                return res.status(404).json({ message: "유저가 없습니다." });
            }
            res.status(200).json(doc.data());
        } catch (error) {
            res.status(500).send("❌ 에러: " + error.message);
        }
    });
});