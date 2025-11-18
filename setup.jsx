// =================================================================
// 1. GLOBAL FUNCTIONS & VARIABLES
// =================================================================

// --- ទាញ (Destructure) Firebase & React functions ពី 'window' ---
const {
  initializeApp,
  getAuth,
  signInAnonymously,
  onAuthStateChanged,
  getDatabase,
  ref,
  onValue,
  set,
  push,
  update,
  query: rtdbQuery, 
  orderByChild,
  equalTo,
  remove,
  get,
  runTransaction
} = window.firebase;

const { useState, useEffect } = React;

// =================================================================
// 2. CONSTANTS & CONFIGS
// =================================================================

const firebaseConfigRead = {
  apiKey: "AIzaSyAc2g-t9A7du3K_nI2fJnw_OGxhmLfpP6s",
  authDomain: "dilistname.firebaseapp.com",
  databaseURL: "https://dilistname-default-rtdb.firebaseio.com",
  projectId: "dilistname",
  storageBucket: "dilistname.firebasestorage.app",
  messagingSenderId: "897983357871",
  appId: "1:897983357871:web:42a046bc9fb3e0543dc55a",
  measurementId: "G-NQ798D9J6K"
};

const firebaseConfigWrite = {
  apiKey: "AIzaSyA1YBg1h5PAxu3vB7yKkpcirHRmLVl_VMI",
  authDomain: "brakelist-5f07f.firebaseapp.com",
  databaseURL: "https://brakelist-5f07f-default-rtdb.firebaseio.com",
  projectId: "brakelist-5f07f",
  storageBucket: "brakelist-5f07f.firebasestorage.app",
  messagingSenderId: "1032751366057",
  appId: "1:1032751366057:web:b23f1e7f3a093a496a4eb8",
  measurementId: "G-51RMC51XZW"
};


// =================================================================
// 3. HELPER FUNCTIONS
// =================================================================
const today = new Date();
const todayString = today.toISOString().split('T')[0]; // 'YYYY-MM-DD'
const displayDate = today.toLocaleString('km-KH', {
  weekday: 'long',
  day: '2-digit',
  month: 'long',
  year: 'numeric',
});

const getTodayLocalDateString = () => {
  const date = new Date();
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().split('T')[0];
};

const getTodayLocalMonthString = () => {
  const date = new Date();
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().substring(0, 7); // 'YYYY-MM'
};

const calculateDuration = (startTimeIso, endTimeIso) => {
  if (!startTimeIso || !endTimeIso) {
    return 0;
  }
  try {
    const start = new Date(startTimeIso);
    const end = new Date(endTimeIso);
    const diffMs = end.getTime() - start.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    return diffMins;
  } catch (e) {
    console.error("Error calculating duration:", e);
    return 0;
  }
};

// =================================================================
// 4. ICON COMPONENTS
// =================================================================

const IconCheckOut = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path>
  </svg>
);
const IconCheckIn = ({ className = "w-6 h-6" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 003 3h1a3 3 0 003-3V7a3 3 0 00-3-3h-1a3 3 0 00-3 3v1"></path>
  </svg>
);
const IconSearch = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
  </svg>
);
const IconClock = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
  </svg>
);
const IconCheckCircle = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
  </svg>
);
const IconTicket = ({ className = "w-6 h-6" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z"></path>
  </svg>
);
const IconClose = () => (
  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
  </svg>
);
const IconTrash = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
  </svg>
);
const IconNoSymbol = () => (
  <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"></path>
  </svg>
);
const IconAlert = () => (
  <svg className="w-12 h-12 text-red-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
  </svg>
);
const IconSpecial = () => (
  <svg className="w-4 h-4 ml-1.5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
  </svg>
);
const IconDotsVertical = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"></path>
  </svg>
);
const IconLock = () => (
  <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
  </svg>
);
const IconQrCode = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4h4v4H4zM4 16h4v4H4zM16 4h4v4h-4zM16 16h4v4h-4zM10 4h4v4h-4zM10 16h4v4h-4zM4 10h4v4H4zM16 10h4v4h-4zM10 10h4v4h-4z"></path>
  </svg>
);
const IconPencil = () => (
  <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.536L16.732 3.732z"></path>
  </svg>
);
const IconInfo = () => (
  <svg className="w-12 h-12 text-blue-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
);
const IconCheckCircleFill = () => (
  <svg className="w-12 h-12 text-green-500 mx-auto mb-4" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path></svg>
);
const IconPencilSquare = () => (
  <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
);
const IconSettings = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
);
const IconLanguage = ({ className = "w-6 h-6" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5h12M9 3v2m4 13h4m-4 1v2m-3-14l-3 6h6m-3 6l6-6M9 21v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6h6z"></path></svg>
);
const IconPalette = ({ className = "w-6 h-6" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"></path></svg>
);

const IconToggleLeft = ({ className = "w-6 h-6" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v12a1 1 0 01-1 1h-3a1 1 0 00-1-1v-1a2 2 0 10-4 0v1a1 1 0 00-1 1H7a1 1 0 01-1-1V6a1 1 0 011-1h3a1 1 0 001-1V4z"></path></svg>
);
const IconToggleRight = ({ className = "w-6 h-6" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v12a1 1 0 01-1 1h-3a1 1 0 00-1-1v-1a2 2 0 10-4 0v1a1 1 0 00-1 1H7a1 1 0 01-1-1V6a1 1 0 011-1h3a1 1 0 001-1V4zM4.5 9.5l.01 0M4.5 14.5l.01 0M19.5 9.5l.01 0M19.5 14.5l.01 0"></path></svg>
);
const IconTimer = ({ className = "w-6 h-6" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 1h6v2H9z"></path></svg>
);

const IconArrowLeft = ({ className = "w-6 h-6" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path></svg>
);
const IconArrowRight = ({ className = "w-6 h-6" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
);

const IconHash = ({ className = "w-6 h-6" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 20l4-16m2 16l4-16M5 9h14M5 15h14"></path></svg>
);
const IconType = ({ className = "w-6 h-6" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6M9 12V6a2 2 0 114 0v6m-2 6v-3m-6-3h12a2 2 0 012 2v3a2 2 0 01-2 2H9a2 2 0 01-2-2v-3a2 2 0 012-2z"></path></svg>
);

const IconCameraRotate = ({ className = "w-6 h-6" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 10h4l-2-2m-2 2l2-2m-2 2v4a2 2 0 01-2 2h-4a2 2 0 01-2-2v-4m0 0l-2 2m2-2l-2 2m2-2H8m8 6h2a2 2 0 002-2v-4a2 2 0 00-2-2h-4a2 2 0 00-2 2v4a2 2 0 002 2h2m-4-4a2 2 0 100-4 2 2 0 000 4z"></path></svg>
Services
const IconFaceId = ({ className = "w-6 h-6" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 11c.88 0 1.6.67 1.71 1.53L13.72 13l-.01.06a1.72 1.72 0 01-3.42 0L10.28 13l.01-.06c.11-.86.83-1.53 1.71-1.53zM7 3a1 1 0 011 1v2a1 1 0 102 0V4a3 3 0 00-3-3 1 1 0 010-2zm10 0a1 1 0 011 1v2a1 1 0 102 0V4a3 3 0 00-3-3 1 1 0 010-2zM7 21a1 1 0 011-1v-2a1 1 0 102 0v2a3 3 0 00-3 3 1 1 0 010 2zm10 0a1 1 0 011-1v-2a1 1 0 102 0v2a3 3 0 00-3 3 1 1 0 010 2z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 10a3 3 0 11-6 0 3 3 0 016 0zm12 0a3 3 0 11-6 0 3 3 0 016 0zm-6 4a5 5 0 00-5 5v1h10v-1a5 5 0 00-5-5z"></path></svg>
);

// !! ថ្មី !!: Icon សម្រាប់ Zoom (Distance Mode)
const IconZoomIn = ({ className = "w-6 h-6" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7"></path></svg>
);


// =================================================================
// 5. BACKGROUND STYLES
// =================================================================
const backgroundStyles = {
  style1: 'bg-gradient-to-br from-blue-900 to-indigo-700', // ដើម
  style2: 'bg-gradient-to-br from-gray-800 to-gray-900', // ងងឹត
  style3: 'bg-gradient-to-br from-green-800 to-teal-700', // បៃតង
  style4: 'bg-gradient-to-br from-purple-800 to-pink-700', // ស្វាយ/ផ្កាឈូក
};

// =================================================================
// 6. TRANSLATIONS (i18n)
// =================================================================
const translations = {
  km: {
    appTitle: 'A-កត់ត្រាម៉ោងសម្រាក', // !! កែសម្រួលនៅទីនេះ 'A-' ឬ 'B-' !!
    searchPlaceholder: 'ស្វែងរកអត្តលេខ/ឈ្មោះ',
    studentNotFound: 'រកមិនឃើញនិស្សិត...',
    photoOf: 'រូបថតរបស់',
    noName: 'គ្មានឈ្មោះ',
    idNumber: 'អត្តលេខ',
    class: 'ថ្នាក់',
    statusNotYet: 'មិនទាន់សម្រាក',
    statusOnBreak: 'កំពុងសម្រាក',
    statusOnBreakShort: 'កំពុងសម្រាក...',
    statusCompleted: 'សម្រាករួច',
    statusPassOut: 'កាតអស់!',
    statusPass: 'កាត',
    checkOut: 'ចេញសម្រាក',
    checkIn: 'ចូលវិញ',
    checkInTooltip: 'ចុចចូលវិញ',
    deleteTooltip: 'លុបទិន្នន័យនេះ',
    minutes: 'នាទី',
    overtime: 'លើស',
    overtimeExclamation: 'លើសម៉ោង!', 
    specialCase: 'ករណីពិសេស',
    specialCaseShort: 'ពិសេស',
    noStudentsOnBreak: 'មិនមាននិស្សិតកំពុងសម្រាកទេ',
    noStudentsCompleted: 'មិនមាននិស្សិតសម្រាករួចទេ',
    historyToday: 'ប្រវត្តិ (ថ្ងៃនេះ)',
    adminTitle: 'មុខងារ Admin',
    multiSelect: 'ជ្រើសរើស (Multi-Select)',
    deleteByDate: 'លុបតាមថ្ងៃ',
    deleteByDateButton: 'លុបប្រចាំថ្ងៃ',
    deleteByMonth: 'លុបតាមខែ',
    deleteByMonthButton: 'លុបប្រចាំខែ',
    deleting: 'កំពុងលុប...',
    cancel: 'បោះបង់',
    delete: 'លុប',
    deleteTitle: 'លុបទិន្នន័យ?',
    deleteConfirmMessage: (name) => `តើអ្នកប្រាកដទេថាចង់លុបទិន្នន័យរបស់ ${name}?`,
    deleteSelectedTitle: (count) => `លុប ${count} ទិន្នន័យ?`,
    deleteByDateTitle: (date) => `លុបទិន្នន័យថ្ងៃទី ${date}?`,
    deleteByMonthTitle: (month) => `លុបទិន្នន័យខែ ${month}?`,
    deleteSuccess: (count) => `លុប ${count} record បានជោគជ័យ!`,
    deleteNotFound: 'រកមិនឃើញទិន្នន័យសម្រាប់លុបទេ។',
    passwordRequired: 'ទាមទារ Password',
    passwordPlaceholder: 'Password...',
    passwordError: 'Password មិនត្រឹមត្រូវ!',
    confirm: 'បញ្ជាក់',
    ok: 'យល់ព្រម',
    scanToComeBack: 'ស្កេនកាតចូលវិញ',
    cameraError: 'មិនអាចបើកកាមេរ៉ាបាន។',
    cameraPermissionDenied: 'សូមអនុញ្ញាតឲ្យប្រើកាមេរ៉ា (Permission Denied)', 
    processing: 'កំពុងដំណើរការ...',
    scanned: 'ស្កេនបាន',
    scanPassNotFound: (pass) => `កាត ${pass} បានចូលវិញហើយ`,
    flipCamera: 'ត្រឡប់កាមេរ៉ា', 
    toggleMirror: 'បិទ/បើក ការបញ្ចាស់', 
    alertErrorTitle: 'មានបញ្ហា',
    alertSuccessTitle: 'បានជោគជ័យ',
    invalidNumber: 'សូមបញ្ចូលតែตัวเลขប៉ុណ្ណោះ។',
    passTotalSuccess: 'ចំនួនកាតសរុបបានកែប្រែ!',
    changePasswordSuccess: 'Password បានកែប្រែដោយជោគជ័យ!',
    checkInModeSuccess: 'របៀប Check-in បានកែប្រែ!',
    footer: 'អភិវឌ្ឍន៍កម្មវិធី : IT SUPPORT',
    // Settings Page
    settingsTitle: 'ការកំណត់',
    generalSettings: 'ការកំណត់ទូទៅ',
    language: 'ភាសា',
    background: 'ផ្ទៃខាងក្រោយ',
    style: 'ស្តាយ',
    adminSettings: 'ការកំណត់ Admin (Public)',
    passCardManagement: 'ការគ្រប់គ្រងកាតសម្រាក',
    passTotal: 'ចំនួនកាតសរុប',
    passesAvailable: 'កាតនៅសល់',
    passesInUse: 'កំពុងប្រើ',
    editPassTotal: 'កែចំនួនកាតសរុប',
    editPassTotalPrompt: 'សូមបញ្ចូលចំនួនកាតសរុបថ្មី:',
    passPrefix: 'បុព្វបទកាត', 
    editPassPrefix: 'កែបុព្វបទកាត', 
    passPrefixPrompt: 'បញ្ចូលបុព្វបទថ្មី (ឧ: DD_)', 
    passPrefixSuccess: 'បុព្វបទកាតបានកែប្រែ!', 
    passStartNumber: 'លេខចាប់ផ្ដើម', 
    editPassStartNumber: 'កែលេខចាប់ផ្ដើម', 
    passStartNumberPrompt: 'បញ្ចូលលេខចាប់ផ្ដើម (ឧ: 1)', 
    passStartNumberSuccess: 'លេខចាប់ផ្ដើមបានកែប្រែ!', 
    settingsForBranch: 'ការកំណត់សម្រាប់សាខា', 
    overtimeSettings: 'ការកំណត់លើសម៉ោង', 
    overtimeLimit: 'កំណត់នាទីលើសម៉ោង', 
    overtimeLimitPrompt: 'បញ្ចូលនាទី (ឧ: 15)', 
    overtimeLimitSuccess: 'ការកំណត់នាទីលើសម៉ោង បានកែប្រែ!', 
    checkInMethod: 'របៀបចូលវិញ',
    checkInMethodScan: 'ស្កេនកាត (Scan)',
    checkInMethodAuto: 'ស្វ័យប្រវត្តិ (Auto)',
    checkInMethodPrompt: 'បញ្ជាក់ដើម្បីប្តូររបៀប Check-in?',
    security: 'សុវត្ថិភាព',
    changePassword: 'ប្ដូរ Password',
    changePasswordPrompt: 'សូមបញ្ចូល Password ថ្មី (យ៉ាងតិច 6 តួ)',
    paginationPage: 'ទំព័រ', 
    // Face Recognition Translations
    faceScan: 'ស្កេនមុខ',
    loadingModels: 'កំពុងផ្ទុកទិន្នន័យមុខ...',
    faceNotMatch: 'មិនស្គាល់មុខនេះទេ',
    faceMatch: 'បានស្គាល់៖',
    noFaceDetected: 'រកមិនឃើញផ្ទៃមុខ',
    faceMultipleDetected: 'មានមុខច្រើនពេក! (សូមยืนម្នាក់ឯង)', 
    faceScanDistance: 'របៀបស្កេនចម្ងាយ (យឺត)', // !! ថ្មី !!
    faceScanNormal: 'របៀបស្កេនជិត (លឿន)', // !! ថ្មី !!
  },
  en: {
    appTitle: 'A-Break Time Tracker', // !! កែសម្រួលនៅទីនេះ 'A-' ឬ 'B-' !!
    searchPlaceholder: 'Search ID/Name',
    studentNotFound: 'Student not found...',
    photoOf: "Photo of",
    noName: 'No Name',
    idNumber: 'ID',
    class: 'Class',
    statusNotYet: 'Not on break',
    statusOnBreak: 'On Break',
    statusOnBreakShort: 'On Break...',
    statusCompleted: 'Completed',
    statusPassOut: 'Passes Full!',
    statusPass: 'Pass',
    checkOut: 'Check Out',
    checkIn: 'Check In',
    checkInTooltip: 'Check In',
    deleteTooltip: 'Delete this record',
    minutes: 'min',
    overtime: 'Overtime',
    overtimeExclamation: 'Overtime!', 
    specialCase: 'Special Case',
    specialCaseShort: 'Special',
    noStudentsOnBreak: 'No students currently on break',
    noStudentsCompleted: 'No students have completed breaks yet',
    historyToday: 'History (Today)',
    adminTitle: 'Admin Functions',
    multiSelect: 'Multi-Select',
    deleteByDate: 'Delete by Date',
    deleteByDateButton: 'Delete Date',
    deleteByMonth: 'Delete by Month',
    deleteByMonthButton: 'Delete Month',
    deleting: 'Deleting...',
    cancel: 'Cancel',
    delete: 'Delete',
    deleteTitle: 'Delete Record?',
    deleteConfirmMessage: (name) => `Are you sure you want to delete ${name}'s record?`,
    deleteSelectedTitle: (count) => `Delete ${count} records?`,
    deleteByDateTitle: (date) => `Delete records for ${date}?`,
    deleteByMonthTitle: (month) => `Delete records for ${month}?`,
    deleteSuccess: (count) => `Successfully deleted ${count} records!`,
    deleteNotFound: 'No matching records found to delete.',
    passwordRequired: 'Password Required',
    passwordPlaceholder: 'Password...',
    passwordError: 'Incorrect Password!',
    confirm: 'Confirm',
    ok: 'OK',
    scanToComeBack: 'Scan Card to Check In',
    cameraError: 'Could not start camera.',
    cameraPermissionDenied: 'Please allow camera permission.', 
    processing: 'Processing...',
    scanned: 'Scanned',
    scanPassNotFound: (pass) => `Pass ${pass} already checked in`,
    flipCamera: 'Flip Camera', 
    toggleMirror: 'Toggle Mirror', 
    alertErrorTitle: 'Error',
    alertSuccessTitle: 'Success',
    invalidNumber: 'Please enter a valid number.',
    passTotalSuccess: 'Total passes updated!',
    changePasswordSuccess: 'Password updated successfully!',
    checkInModeSuccess: 'Check-in mode updated!',
    footer: 'Developed by: IT SUPPORT',
    // Settings Page
    settingsTitle: 'Settings',
    generalSettings: 'General Settings',
    language: 'Language',
    background: 'Background',
    style: 'Style',
    adminSettings: 'Admin Settings (Public)',
    passCardManagement: 'Pass Card Management',
    passTotal: 'Total Passes',
    passesAvailable: 'Available',
    passesInUse: 'In Use',
    editPassTotal: 'Edit Total Passes',
    editPassTotalPrompt: 'Enter new total number of passes:',
    passPrefix: 'Pass Prefix', 
    editPassPrefix: 'Edit Pass Prefix', 
    passPrefixPrompt: 'Enter new prefix (e.g., DD_)', 
    passPrefixSuccess: 'Pass prefix updated!', 
    passStartNumber: 'Start Number', 
    editPassStartNumber: 'Edit Start Number', 
    passStartNumberPrompt: 'Enter start number (e.g., 1)', 
    passStartNumberSuccess: 'Start number updated!', 
    settingsForBranch: 'Settings for Branch', 
    overtimeSettings: 'Overtime Settings', 
    overtimeLimit: 'Overtime Limit (min)', 
    overtimeLimitPrompt: 'Enter limit (e.g., 15)', 
    overtimeLimitSuccess: 'Overtime limit updated!', 
    checkInMethod: 'Check-in Method',
    checkInMethodScan: 'Scan Card',
    checkInMethodAuto: 'Automatic',
    checkInMethodPrompt: 'Confirm to change check-in method?',
    security: 'Security',
    changePassword: 'Change Password',
    changePasswordPrompt: 'Enter new password (min. 6 chars)',
    paginationPage: 'Page', 
    // Face Recognition Translations
    faceScan: 'Face Scan',
    loadingModels: 'Loading face models...',
    faceNotMatch: 'Face not matched',
    faceMatch: 'Matched:',
    noFaceDetected: 'No face detected',
    faceMultipleDetected: 'Too many faces! (Stand alone)', 
    faceScanDistance: 'Distance Scan Mode (Slower)', // !! ថ្មី !!
    faceScanNormal: 'Normal Scan Mode (Faster)', // !! ថ្មី !!
  }
};

// !! ថ្មី !!: កំណត់ APP BRANCH ដោយផ្អែកលើ APP TITLE
const appTitleKm = translations.km.appTitle || '';
let appBranch = 'default'; // Path លំនាំដើម
if (appTitleKm.startsWith('A-')) {
  appBranch = 'A';
} else if (appTitleKm.startsWith('B-')) {
  appBranch = 'B';
}

// !! START: កែសម្រួល Path !!
// បង្កើត Path សម្រាប់ផ្ទុកការកំណត់កាត (ដាច់ដោយឡែក)
// ដោយដាក់វានៅ "ខាងក្នុង" passManagement
const passManagementPath = `passManagement/branch_${appBranch}`;
// !! END: កែសម្រួល Path !!


// =================================================================
// 7. ភ្ជាប់អ្វីៗទាំងអស់ទៅ Global Scope
// =================================================================
window.appSetup = {
  // Functions
  getTodayLocalDateString,
  getTodayLocalMonthString,
  calculateDuration,
  
  // Configs
  firebaseConfigRead,
  firebaseConfigWrite,
  
  // Constants
  todayString,
  displayDate,
  
  // Assets
  translations,
  backgroundStyles,
  passManagementPath,
  appBranch,
  
  // Icons
  IconCheckOut,
  IconCheckIn,
  IconSearch,
  IconClock,
  IconCheckCircle,
  IconTicket,
  IconClose,
  IconTrash,
  IconNoSymbol,
  IconAlert,
  IconSpecial,
  IconDotsVertical,
  IconLock,
  IconQrCode,
  IconPencil,
  IconInfo,
  IconCheckCircleFill,
  IconPencilSquare,
  IconSettings,
  IconLanguage,
  IconPalette,
  IconToggleLeft,
  IconToggleRight,
  IconTimer,
  IconArrowLeft,
  IconArrowRight,
  IconHash,
  IconType,
  IconCameraRotate,
  IconFaceId,
  IconZoomIn, // !! ថ្មី !!
};
