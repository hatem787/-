
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged, signInWithPopup, GoogleAuthProvider } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-auth.js";
import { getFirestore, collection, getDocs, addDoc, doc, updateDoc, getDoc, arrayUnion, arrayRemove } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-storage.js";

// إعدادات Firebase الخاصة بك
const firebaseConfig = {
  apiKey: "AIzaSyBh2VqYx-B8KpHbD3J4GJgU0NN7mJCrWbY",
  authDomain: "tiktok-clone-videos.firebaseapp.com",
  projectId: "tiktok-clone-videos",
  storageBucket: "tiktok-clone-videos.appspot.com",
  messagingSenderId: "307200882949",
  appId: "1:307200882949:web:1e7ccf12cf67116c4d5d45"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// عناصر الواجهة
const authContainer = document.getElementById("auth-container");
const mainApp = document.getElementById("mainApp");
const loginBtn = document.getElementById("loginBtn");
const signupBtn = document.getElementById("signupBtn");
const logoutBtn = document.getElementById("logoutBtn");
const googleLogin = document.getElementById("googleLogin");
const uploadBtn = document.getElementById("uploadBtn");
const videoInput = document.getElementById("videoInput");
const videoContainer = document.getElementById("videoContainer");
const userEmail = document.getElementById("userEmail");
const likedVideosList = document.getElementById("likedVideosList");

// التسجيل بالبريد الإلكتروني
signupBtn.onclick = () => {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  createUserWithEmailAndPassword(auth, email, password)
    .then(userCredential => console.log("تم التسجيل"))
    .catch(error => alert(error.message));
};

// تسجيل الدخول
loginBtn.onclick = () => {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  signInWithEmailAndPassword(auth, email, password)
    .then(userCredential => console.log("تم الدخول"))
    .catch(error => alert(error.message));
};

// تسجيل الدخول بـ Google
googleLogin.onclick = () => {
  const provider = new GoogleAuthProvider();
  signInWithPopup(auth, provider)
    .then(result => console.log("تم الدخول بـ Google"))
    .catch(error => alert(error.message));
};

// تسجيل الخروج
logoutBtn.onclick = () => {
  signOut(auth).then(() => console.log("تم تسجيل الخروج"));
};

// رفع فيديو
uploadBtn.onclick = async () => {
  const file = videoInput.files[0];
  if (!file) return alert("اختر فيديو أولاً");

  const fileRef = ref(storage, `videos/${file.name}`);
  await uploadBytes(fileRef, file);
  const url = await getDownloadURL(fileRef);

  await addDoc(collection(db, "videos"), {
    url,
    likes: [],
    createdAt: Date.now()
  });

  alert("تم رفع الفيديو!");
  loadVideos(); // إعادة تحميل الفيديوهات
};

// تحميل الفيديوهات
async function loadVideos() {
  videoContainer.innerHTML = "";
  const videosSnapshot = await getDocs(collection(db, "videos"));
  const user = auth.currentUser;

  videosSnapshot.forEach(docSnap => {
    const videoData = docSnap.data();
    const videoId = docSnap.id;
    const videoElem = document.createElement("div");
    videoElem.innerHTML = `
      <video src="${videoData.url}" controls muted></video>
      <button class="likeBtn ${videoData.likes.includes(user.uid) ? 'liked' : ''}" data-id="${videoId}">
        ❤️ ${videoData.likes.length}
      </button>
    `;
    videoContainer.appendChild(videoElem);
  });

  // إضافة أحداث الإعجاب
  document.querySelectorAll(".likeBtn").forEach(btn => {
    btn.onclick = async () => {
      const videoId = btn.getAttribute("data-id");
      const videoRef = doc(db, "videos", videoId);
      const videoSnap = await getDoc(videoRef);
      const data = videoSnap.data();

      if (data.likes.includes(user.uid)) {
        await updateDoc(videoRef, { likes: arrayRemove(user.uid) });
      } else {
        await updateDoc(videoRef, { likes: arrayUnion(user.uid) });
      }
      loadVideos();
      loadUserLikes();
    };
  });
}

// تحميل الإعجابات الخاصة بالمستخدم
async function loadUserLikes() {
  const videosSnapshot = await getDocs(collection(db, "videos"));
  const user = auth.currentUser;
  likedVideosList.innerHTML = "";

  videosSnapshot.forEach(docSnap => {
    const videoData = docSnap.data();
    if (videoData.likes.includes(user.uid)) {
      const li = document.createElement("li");
      li.textContent = videoData.url;
      likedVideosList.appendChild(li);
    }
  });
}

// مراقبة حالة الدخول
onAuthStateChanged(auth, user => {
  if (user) {
    authContainer.style.display = "none";
    mainApp.style.display = "block";
    userEmail.textContent = "البريد الإلكتروني: " + user.email;
    loadVideos();
    loadUserLikes();
  } else {
    authContainer.style.display = "block";
    mainApp.style.display = "none";
  }
});
