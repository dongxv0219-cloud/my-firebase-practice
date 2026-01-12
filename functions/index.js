const functions = require("firebase-functions");
const admin = require("firebase-admin");
const cors = require('cors')({ origin: true }); // 누구나 접속 허용

admin.initializeApp();
const db = admin.firestore();

// ===============================================================
// [Project 1] 대나무 숲 API
// ===============================================================

// 1. 글 쓰기 (createPost)
// 요청: { "title": "제목", "content": "내용" }
exports.createPost = functions.https.onRequest((req, res) => {
    cors(req, res, async () => {
        try {
            const { title, content } = req.body;

            // 'bamboo'라는 컬렉션에 저장합니다.
            const result = await db.collection("bamboo").add({
                title: title,
                content: content,
                createdAt: new Date().toISOString() // 작성 시간
            });

            res.status(200).json({
                message: "✅ 대나무 숲에 외쳤습니다!",
                postId: result.id
            });
        } catch (error) {
            res.status(500).send("❌ 에러: " + error.message);
        }
    });
});

// 2. 글 목록 보기 (getPostList)
// 요청: 없음 (그냥 부르면 줌)
exports.getPostList = functions.https.onRequest((req, res) => {
    cors(req, res, async () => {
        try {
            // 최신글이 위로 오게 정렬 (orderBy desc)
            const snapshot = await db.collection("bamboo").orderBy("createdAt", "desc").get();

            let posts = [];
            snapshot.forEach(doc => {
                posts.push({ id: doc.id, ...doc.data() });
            });

            res.status(200).json(posts);
        } catch (error) {
            res.status(500).send("❌ 에러: " + error.message);
        }
    });
});
// ... (위에는 대나무 숲 코드가 있습니다)

// ===============================================================
// [Project 2] 전자 명함 API
// ===============================================================

// 1. 명함 만들기 (Create - 내 ID로 저장)
// 요청: { "uid": "dongwook", "name": "이동욱", "job": "CEO", "phone": "010-1234-5678" }
exports.createCard = functions.https.onRequest((req, res) => {
    cors(req, res, async () => {
        try {
            const { uid, name, job, phone } = req.body;

            // ★ 핵심: .add() 대신 .doc(uid).set()을 씁니다.
            // "cards"라는 컬렉션에 "uid"라는 이름표를 붙여서 저장해라!
            await db.collection("cards").doc(uid).set({
                name: name,
                job: job,
                phone: phone,
                updatedAt: new Date().toISOString()
            });

            res.status(200).json({ message: "✅ 명함 생성 완료!" });
        } catch (error) {
            res.status(500).send("❌ 에러: " + error.message);
        }
    });
});

// 2. 내 명함 가져오기 (Read - 특정 ID 조회)
// 요청: 주소 뒤에 ?uid=dongwook 처럼 붙여서 보냄
exports.getCard = functions.https.onRequest((req, res) => {
    cors(req, res, async () => {
        try {
            const uid = req.query.uid; // 주소창에 붙은 uid 가져오기

            const doc = await db.collection("cards").doc(uid).get();

            if (!doc.exists) {
                return res.status(404).json({ message: "그런 명함은 없는데요?" });
            }

            res.status(200).json(doc.data());
        } catch (error) {
            res.status(500).send("❌ 에러: " + error.message);
        }
    });
});

// 3. 명함 수정하기 (Update - 특정 필드만 변경)
// 요청: { "uid": "dongwook", "job": "CTO" } -> 직업만 바꿈
exports.updateCard = functions.https.onRequest((req, res) => {
    cors(req, res, async () => {
        try {
            const { uid, job, phone } = req.body;

            // ★ 핵심: .update()는 적어준 내용만 바꿉니다. (이름은 그대로 유지됨)
            await db.collection("cards").doc(uid).update({
                job: job,        // 직업 변경
                // phone: phone, // (만약 전화번호도 보냈으면 바뀜)
                updatedAt: new Date().toISOString()
            });

            res.status(200).json({ message: "✅ 명함 정보 수정 완료!" });
        } catch (error) {
            res.status(500).send("❌ 에러: " + error.message);
        }
    });
});
// ... (위에는 Project 1, 2 코드가 있습니다)

// ===============================================================
// [Project 3] 쇼핑몰 장바구니 API
// ===============================================================

// 1. 장바구니 담기 (Create)
// 요청: { "name": "사과", "price": 3000 }
exports.addToCart = functions.https.onRequest((req, res) => {
    cors(req, res, async () => {
        try {
            const { name, price } = req.body;

            // 가격(price)은 반드시 숫자(Number)로 저장해야 정렬이 잘 됩니다!
            await db.collection("cart").add({
                name: name,
                price: Number(price), // 숫자로 변환해서 저장
                createdAt: new Date().toISOString()
            });

            res.status(200).json({ message: "✅ 장바구니에 담았습니다!" });
        } catch (error) {
            res.status(500).send("❌ 에러: " + error.message);
        }
    });
});

// 2. 장바구니 조회 (Read - 가격 낮은 순 정렬)
// 요청: 그냥 부름
exports.getCartItems = functions.https.onRequest((req, res) => {
    cors(req, res, async () => {
        try {
            // ★ 핵심: .orderBy("price", "asc") -> 가격 오름차순(싼거 먼저) 정렬
            const snapshot = await db.collection("cart").orderBy("price", "asc").get();

            let items = [];
            snapshot.forEach(doc => {
                items.push({ id: doc.id, ...doc.data() });
            });

            res.status(200).json(items);
        } catch (error) {
            res.status(500).send("❌ 에러: " + error.message);
        }
    });
});

// 3. 물건 빼기 (Delete)
// 요청: { "docId": "문서ID" }
exports.deleteItem = functions.https.onRequest((req, res) => {
    cors(req, res, async () => {
        try {
            const { docId } = req.body;

            // 해당 ID를 가진 문서를 삭제
            await db.collection("cart").doc(docId).delete();

            res.status(200).json({ message: "🗑️ 물건을 뺐습니다!" });
        } catch (error) {
            res.status(500).send("❌ 에러: " + error.message);
        }
    });
});