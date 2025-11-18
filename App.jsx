// =================================================================
// 5. APP LOGIC & RENDER
// =================================================================
function App() {
  
  // ទាញអថេរ និង Functions ពី Global Scope
  const {
    getTodayLocalDateString,
    getTodayLocalMonthString,
    calculateDuration,
    firebaseConfigRead,
    firebaseConfigWrite,
    translations,
    backgroundStyles,
    passManagementPath,
    appBranch,
    IconSearch, IconClock, IconCheckCircle, IconQrCode, IconSettings, IconTicket,
    IconClose, IconFaceId 
  } = window.appSetup;

  // ទាញ Components ពី Global Scope
  const { 
    StudentCard, OnBreakStudentListCard, CompletedStudentListCard, 
    CompletedListHeader, LoadingSpinner, DeleteConfirmationModal,
    PasswordConfirmationModal, AdminActionModal, QrScannerModal,
    InfoAlertModal, InputPromptModal,
    PaginationControls,
    FaceScannerModal
  } = window; 
  
  const { SettingsPage } = window; 

  // --- States ---
  const [dbRead, setDbRead] = useState(null); 
  const [dbWrite, setDbWrite] = useState(null); 
  const [userId, setUserId] = useState(null); 
  const [students, setStudents] = useState([]); 
  const [attendance, setAttendance] = useState({}); 
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStudentId, setSelectedStudentId] = useState(""); 
  const [currentPage, setCurrentPage] = useState('search'); 
  const [authError, setAuthError] = useState(null); 
  const [modalStudent, setModalStudent] = useState(null);
  const [now, setNow] = useState(new Date());
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [passwordPrompt, setPasswordPrompt] = useState({ isOpen: false });
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedRecords, setSelectedRecords] = useState([]);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [bulkDeleteMode, setBulkDeleteMode] = useState(null);
  const [bulkDeleteDate, setBulkDeleteDate] = useState(getTodayLocalDateString());
  const [bulkDeleteMonth, setBulkDeleteMonth] = useState(getTodayLocalMonthString());
  const [isBulkLoading, setIsBulkLoading] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState(null);
  const [totalPasses, setTotalPasses] = useState(0); 
  const [showQrScanner, setShowQrScanner] = useState(false);
  const [isScannerBusy, setIsScannerBusy] = useState(false); 
  const [lastScannedInfo, setLastScannedInfo] = useState(null); 
  const [scannerTriggeredCheckIn, setScannerTriggeredCheckIn] = useState(null); 
  const [infoAlert, setInfoAlert] = useState({ isOpen: false, message: '', type: 'info' });
  const [inputPrompt, setInputPrompt] = useState({ isOpen: false });
  const [language, setLanguage] = useState(localStorage.getItem('break_lang') || 'km');
  const [background, setBackground] = useState(localStorage.getItem('break_bg') || 'style1');
  const [adminPassword, setAdminPassword] = useState(null); 
  const [checkInMode, setCheckInMode] = useState('scan'); 
  const [overtimeLimit, setOvertimeLimit] = useState(15); 
  const [completedPage, setCompletedPage] = useState(0); 
  const [passPrefix, setPassPrefix] = useState(null); 
  const [passStartNumber, setPassStartNumber] = useState(null);

  const [showFaceScanner, setShowFaceScanner] = useState(false);
  const [faceMatcher, setFaceMatcher] = useState(null);
  const [isModelsLoaded, setIsModelsLoaded] = useState(false);
  const [processingFaces, setProcessingFaces] = useState(false);
  const [faceLoadProgress, setFaceLoadProgress] = useState(0);
  
  // State សម្រាប់ Face Scan Kiosk Mode
  const [faceScanFeedback, setFaceScanFeedback] = useState({ message: '', type: 'info' });
  const [faceScanMode, setFaceScanMode] = useState('checkout'); // 'checkout' or 'checkin'

  // --- Refs សម្រាប់ Stale State ---
  const t = translations[language] || translations['km'];
  const tRef = React.useRef(t); 
  const attendanceRef = React.useRef(attendance); 
  const touchStartXRef = React.useRef(null);

  const { runTransaction, get, update, ref, push, remove, onValue, orderByChild, equalTo } = window.firebase;

  // --- មុខងារ TTS ---
  // !! កែសម្រួល !!: ធ្វើឲ្យ 'speak' អាចផ្អាកបានដោយប្រើ '...'
  const speak = React.useCallback((text) => {
    try {
      if (!window.speechSynthesis) { return; }
      window.speechSynthesis.cancel();
      
      // បំបែកពាក្យដោយ '...' ដើម្បីបង្កើតជាជួរ (Queue)
      const parts = text.split('...').filter(p => p.trim().length > 0); 
      
      parts.forEach((part) => {
          const utterance = new SpeechSynthesisUtterance(part.trim());
          utterance.lang = 'km-KH'; 
          utterance.rate = 0.9; 
          window.speechSynthesis.speak(utterance);
      });
      
    } catch (e) { console.error(e); }
  }, []);

  // --- Effects ---
  useEffect(() => {
    const timer = setInterval(() => { setNow(new Date()); }, 1000); 
    return () => clearInterval(timer);
  }, []); 

  useEffect(() => {
    localStorage.setItem('break_lang', language);
    tRef.current = translations[language] || translations['km']; 
  }, [language, translations]);

  useEffect(() => { localStorage.setItem('break_bg', background); }, [background]);
  useEffect(() => { attendanceRef.current = attendance; }, [attendance]);

  // 1. Load Face API Models (Tiny + SsdMobilenetv1)
  useEffect(() => {
    const loadModels = async () => {
      const MODEL_URL = 'https://justadudewhohacks.github.io/face-api.js/models';
      try {
        console.log("Starting to load Face API models...");
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL), 
          faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL), // សម្រាប់ Zoom
          faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
          faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
        ]);
        console.log("Face API Models Loaded Successfully");
        setIsModelsLoaded(true);
      } catch (e) {
        console.error("Error loading face models:", e);
      }
    };
    loadModels();
  }, []);

  // 2. បង្កើត Face Matcher (ប្រើ LocalStorage Cache)
  useEffect(() => {
    if (!isModelsLoaded || students.length === 0) return;
    
    // ប្រើ Key ថ្មី v2 ដើម្បីជៀសវាង Cache ចាស់ដែលខូច
    const FACE_CACHE_KEY = `faceApiDescriptors_v2_${students.length}`; 

    const loadFaceMatcher = async () => {
      setProcessingFaces(true);
      setFaceLoadProgress(0);

      try {
        const cachedData = localStorage.getItem(FACE_CACHE_KEY);
        if (cachedData) {
          console.log("Loading face descriptors from cache...");
          const descriptors = JSON.parse(cachedData);
          
          // អានទម្រង់ Array ត្រឡប់មកវិញ
          const labeledDescriptors = descriptors.map(d => 
            new faceapi.LabeledFaceDescriptors(
              d.label, 
              [new Float32Array(d.descriptors)] // បំប្លែង Array ទៅ Float32Array
            )
          );
          
          if (labeledDescriptors.length > 0) {
             setFaceMatcher(new faceapi.FaceMatcher(labeledDescriptors, 0.4)); // Threshold 0.4
             console.log("Face Matcher created from cache (Threshold: 0.4).");
             setProcessingFaces(false);
             setFaceLoadProgress(100);
             return; 
          }
        }
      } catch (e) {
         console.warn("Failed to parse face cache. Re-building.", e);
         // លុប Cache ដែលខូចចោល
         localStorage.removeItem(FACE_CACHE_KEY); 
      }

      console.log("No cache found. Building new face descriptors...");
      const descriptorsToCache = [];
      const detectionOptions = new faceapi.TinyFaceDetectorOptions();

      for (let i = 0; i < students.length; i++) {
        const student = students[i];
        if (i % 5 === 0) {
           setFaceLoadProgress(Math.round(((i + 1) / students.length) * 100));
           await new Promise(resolve => setTimeout(resolve, 0));
        }
        if (!student.photoUrl) continue;

        try {
            const img = document.createElement('img');
            img.src = student.photoUrl;
            img.crossOrigin = 'anonymous'; 
            await new Promise((resolve, reject) => { img.onload = resolve; img.onerror = reject; });
            const detection = await faceapi.detectSingleFace(img, detectionOptions).withFaceLandmarks().withFaceDescriptor();
            
            if (detection) {
                // បំប្លែង Float32Array ទៅជា Array ធម្មតា មុនពេលរក្សាទុក
                descriptorsToCache.push({
                   label: student.id,
                   descriptors: Array.from(detection.descriptor) // [0.1, -0.2, ...]
                });
            }
        } catch (err) { /* រំលងរូបថតដែល Error */ }
      }

      if (descriptorsToCache.length > 0) {
        try {
          // លុប Cache ចាស់ៗទាំងអស់
          Object.keys(localStorage).forEach(key => {
            if (key.startsWith('faceApiDescriptors_')) {
              localStorage.removeItem(key);
            }
          });
          // រក្សាទុក Cache ថ្មី
          localStorage.setItem(FACE_CACHE_KEY, JSON.stringify(descriptorsToCache));
          console.log(`Saved ${descriptorsToCache.length} descriptors to cache.`);
          
          // បង្កើត FaceMatcher ពីទិន្នន័យដដែល (មិនបាច់ទាញពី Cache ម្ដងទៀត)
          const labeledDescriptors = descriptorsToCache.map(d => 
             new faceapi.LabeledFaceDescriptors(d.label, [new Float32Array(d.descriptors)])
          );
          setFaceMatcher(new faceapi.FaceMatcher(labeledDescriptors, 0.4)); // Threshold 0.4
          console.log("Face Matcher created from new build (Threshold: 0.4).");

        } catch (e) {
          console.error("Failed to save to localStorage (quota exceeded?)", e);
        }
      }
      
      setProcessingFaces(false);
      setFaceLoadProgress(100);
    };

    const timer = setTimeout(loadFaceMatcher, 1000);
    return () => clearTimeout(timer);

  }, [students, isModelsLoaded]);


  // ជំហានទី 1: ដំណើរការ Firebase
  useEffect(() => {
    const initFirebase = async () => {
      try {
        const readApp = initializeApp(firebaseConfigRead, 'readApp');
        const authInstanceRead = getAuth(readApp);
        const dbInstanceRead = getDatabase(readApp);
        
        const writeApp = initializeApp(firebaseConfigWrite, 'writeApp');
        const authInstanceWrite = getAuth(writeApp);
        const dbInstanceWrite = getDatabase(writeApp);

        try {
          await signInAnonymously(authInstanceRead);
          console.log("Read App Signed in.");
          setDbRead(dbInstanceRead); 
        } catch (error) {
          setAuthError(`Read Auth Error: ${error.message}`);
        }
        
        onAuthStateChanged(authInstanceWrite, async (user) => {
          if (user) {
            console.log("Write App Signed in.");
            setUserId(user.uid);
            setDbWrite(dbInstanceWrite); 
          } else {
            try { await signInAnonymously(authInstanceWrite); } 
            catch (authError) { setAuthError(`Write Auth Error: ${authError.message}`); }
          }
        });
        
      } catch (error) {
        setAuthError(`Firebase Init Error: ${error.message}`);
      }
    };
    initFirebase();
  }, [initializeApp, signInAnonymously, getAuth, getDatabase, firebaseConfigRead, firebaseConfigWrite]);
  
  // ជំហានទី 2: ទាញទិន្នន័យ
  useEffect(() => {
    if (dbRead && dbWrite) {
      
      const studentsRef = ref(dbRead, 'students');
      const unsubscribeStudents = onValue(studentsRef, (snapshot) => {
          const studentsData = snapshot.val();
          const studentList = [];
          if (studentsData) {
            Object.keys(studentsData).forEach((key) => {
              const student = studentsData[key];
              studentList.push({
                id: key, ...student,
                name: student.name || student.ឈ្មោះ,
                idNumber: student.idNumber || student.អត្តលេខ,
                photoUrl: student.photoUrl || student.រូបថត,
                class: student.class || student.ថា្នក់,
              });
            });
          }
          studentList.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
          setStudents(studentList);
          setLoading(false); 
      }, (error) => {
          setAuthError(`Student Fetch Error: ${error.message}`);
          setLoading(false);
      });

      const settingRef = ref(dbWrite, 'passManagement');
      const branchSettingsRef = ref(dbWrite, passManagementPath);

      const unsubSettings = onValue(settingRef, (snapshot) => {
        const settings = snapshot.val() || {};
        setAdminPassword(settings.adminPassword || '4545ak0');
        setCheckInMode(settings.checkInMode || 'scan');
        setOvertimeLimit(parseInt(settings.overtimeLimit) || 15);
      });

      let unsubAttendance = () => {}; 

      const unsubBranchSettings = onValue(branchSettingsRef, (snapshot) => {
        const branchSettings = snapshot.val() || {};
        const newTotal = branchSettings.totalPasses || 0;
        const newPrefix = branchSettings.passPrefix || 'DD_';
        const newStartNum = branchSettings.passStartNumber || 1;

        setTotalPasses(newTotal);
        setPassPrefix(newPrefix);
        setPassStartNumber(newStartNum);
        
        unsubAttendance(); 

        const attendanceRefDb = ref(dbWrite, 'attendance');
        const attendanceQuery = rtdbQuery(attendanceRefDb, orderByChild('date'), equalTo(appSetup.todayString));

        unsubAttendance = onValue(attendanceQuery, (attSnapshot) => {
            const attMap = {};
            const attData = attSnapshot.val();
            if (attData) {
              Object.keys(attData).forEach((key) => {
                const data = attData[key];
                if (data.branch === appBranch) { 
                  if (!attMap[data.studentId]) { attMap[data.studentId] = []; }
                  attMap[data.studentId].push({ id: key, ...data });
                }
              });
            }
            for (const studentId in attMap) {
              attMap[studentId].sort((a, b) => new Date(a.checkOutTime) - new Date(b.checkOutTime));
            }
            setAttendance(attMap); 
        });
      });
      
      return () => {
        unsubscribeStudents();
        unsubSettings();
        unsubBranchSettings();
        unsubAttendance(); 
      };
    }
  }, [dbRead, dbWrite, appSetup.todayString, ref, onValue, orderByChild, equalTo, passManagementPath, appBranch]); 

  // --- Data Preparation ---
  const sortedStudentsOnBreak = React.useMemo(() => {
    if (passPrefix === null) return []; 
    return students
      .map(student => {
        const breaks = attendance[student.id] || [];
        const activeBreak = breaks.find(r => r.checkOutTime && !r.checkInTime);
        if (!activeBreak) return null; 
        const elapsedMins = calculateDuration(activeBreak.checkOutTime, now.toISOString()); 
        const isOvertime = elapsedMins > overtimeLimit; 
        return { student, record: activeBreak, elapsedMins, isOvertime };
      })
      .filter(Boolean) 
      .sort((a, b) => {
        const getPassNum = (passStr) => {
            if (!passStr) return 0;
            const numPart = passStr.replace(passPrefix, ''); 
            return parseInt(numPart) || 0;
        };
        return getPassNum(b.record.passNumber) - getPassNum(a.record.passNumber);
      });
  }, [students, attendance, now, calculateDuration, overtimeLimit, passPrefix]); 

  const allCompletedBreaks = React.useMemo(() => {
    const breaks = [];
    students.forEach(student => {
      const studentBreaks = attendance[student.id] || [];
      studentBreaks.forEach(record => {
        if (record.checkInTime && record.checkOutTime) {
          breaks.push({ student, record });
        }
      });
    });
    breaks.sort((a, b) => new Date(b.record.checkInTime) - new Date(a.record.checkInTime));
    return breaks;
  }, [students, attendance]);

  const filteredCompletedBreaks = React.useMemo(() => allCompletedBreaks, [allCompletedBreaks]);
  const CARDS_PER_PAGE = 12;
  const totalCompletedPages = Math.ceil(filteredCompletedBreaks.length / CARDS_PER_PAGE);
  const paginatedCompletedBreaks = React.useMemo(() => {
    return filteredCompletedBreaks.slice(completedPage * CARDS_PER_PAGE, (completedPage + 1) * CARDS_PER_PAGE);
  }, [filteredCompletedBreaks, completedPage]); 
  const selectedStudent = React.useMemo(() => students.find(s => s.id === selectedStudentId), [students, selectedStudentId]);
  const studentsOnBreakCount = sortedStudentsOnBreak.length;
  
  const searchResults = React.useMemo(() => {
    const normalizedSearch = String(searchTerm).replace(/\s+/g, '').toLowerCase();
    if (normalizedSearch === "" || !isSearchFocused) return []; 
    
    const currentAttendance = attendance; 
    const currentT = t;
    const matches = students.filter(student => 
      (student.name && student.name.replace(/\s+/g, '').toLowerCase().includes(normalizedSearch)) ||
      (student.idNumber && String(student.idNumber).replace(/\s+/g, '').includes(normalizedSearch))
    ).slice(0, 10); 
    
    return matches.map(student => {
      const studentBreaks = currentAttendance[student.id] || []; 
      const activeBreak = studentBreaks.find(r => r.checkOutTime && !r.checkInTime);
      const completedBreaks = studentBreaks.filter(r => r.checkOutTime && r.checkInTime);
      let statusText = currentT.statusNotYet; 
      let passNumber = null;
      let statusColor = 'text-gray-500';
      if (activeBreak) {
        statusText = currentT.statusOnBreak; 
        passNumber = activeBreak.passNumber || null;
        statusColor = 'text-yellow-600';
      } else if (completedBreaks.length > 0) {
        statusText = currentT.statusCompleted; 
        statusColor = 'text-green-600';
      }
      return { ...student, statusText, passNumber, statusColor };
    });
  }, [searchTerm, students, attendance, t, isSearchFocused]); 

  useEffect(() => {
    if (scannerTriggeredCheckIn) {
      const newStudentsOnBreak = students.map(student => {
          const breaks = attendance[student.id] || [];
          return breaks.find(r => r.checkOutTime && !r.checkInTime);
      }).filter(Boolean);
      
      if (newStudentsOnBreak.length === 0) {
        setShowQrScanner(false);
        setCurrentPage('completed'); 
        setIsScannerBusy(false); 
        setScannerTriggeredCheckIn(null); 
      } else {
        setIsScannerBusy(false); 
        setScannerTriggeredCheckIn(null); 
      }
    }
  }, [attendance, scannerTriggeredCheckIn, students]);

  // --- Action Handlers ---
  const showAlert = React.useCallback((message, type = 'info') => { setInfoAlert({ isOpen: true, message, type }); }, []);
  
  // !! កែសម្រួល !!: handleCheckOut (Return ID Number)
  const handleCheckOut = React.useCallback(async (studentId) => {
    const student = students.find(s => s.id === studentId);
    
    if (!student || !dbWrite || passPrefix === null || passStartNumber === null) {
      const errorMsg = "សូមរង់ចាំ... កំពុងទាញការកំណត់ Prefix។";
      setAuthError(errorMsg);
      return { success: false, error: errorMsg };
    }
    
    const attendanceRefDb = ref(dbWrite, 'attendance');
    let assignedPassNumber = null; 

    try {
      const { committed, snapshot } = await runTransaction(attendanceRefDb, (currentAttendanceData) => {
        const attData = currentAttendanceData || {};
        const allBreaks = Object.values(attData);
        
        const existingActiveBreak = allBreaks.find(r => 
            r.studentId === studentId && 
            r.checkOutTime && 
            !r.checkInTime
        );
        if (existingActiveBreak) {
            return; // Abort
        }

        const usedPassNumbers = allBreaks
          .filter(r => r.date === appSetup.todayString && r.checkOutTime && !r.checkInTime && r.branch === appBranch)
          .map(r => r.passNumber);
        
        const passesInUseCount = usedPassNumbers.length;
        if (passesInUseCount >= totalPasses) {
          return; // Abort (កាតពេញ)
        }

        let nextPassNumber = null;
        const loopStart = passStartNumber;
        const loopEnd = loopStart + totalPasses;
        for (let i = loopStart; i < loopEnd; i++) {
          const passNum = passPrefix + String(i).padStart(2, '0'); 
          if (!usedPassNumbers.includes(passNum)) {
            nextPassNumber = passNum;
            break;
          }
        }
        if (!nextPassNumber) return; // Abort (រកកាតទំនេរមិនឃើញ)

        assignedPassNumber = nextPassNumber;
        const studentBreaks = allBreaks.filter(r => r.studentId === studentId);
        const completedBreaks = studentBreaks.filter(r => r.checkInTime && r.checkOutTime);
        const newBreakType = (completedBreaks.length >= 2) ? "special" : "normal";
        const newRecord = {
          studentId: studentId,
          studentName: student.name || null,
          studentPhotoUrl: student.photoUrl || null,
          date: appSetup.todayString,
          checkInTime: null,
          checkOutTime: new Date().toISOString(),
          breakType: newBreakType,
          passNumber: assignedPassNumber,
          branch: appBranch 
        };
        const newKey = push(attendanceRefDb).key;
        attData[newKey] = newRecord;
        return attData; 
      });

      if (committed && assignedPassNumber) {
        return { 
          success: true, 
          studentName: student.name || tRef.current.noName, 
          passNumber: assignedPassNumber,
          studentIdNumber: student.idNumber || 'N/A' // !! ថ្មី !!: បញ្ជូន ID Number
        };
      } else {
        const studentBreaks = attendanceRef.current[studentId] || [];
        const activeBreak = studentBreaks.find(r => r.checkOutTime && !r.checkInTime);
        let errorMsg;
        if (activeBreak) {
          errorMsg = `${student.name} ${tRef.current.statusOnBreak} រួចហើយ។`;
        } else {
          const currentPassesInUse = sortedStudentsOnBreak.length;
          errorMsg = `${tRef.current.statusPassOut} (${currentPassesInUse}/${totalPasses})`;
        }
        setAuthError(errorMsg);
        return { success: false, error: errorMsg };
      }

    } catch (error) {
      console.error('Check-out Transaction Error:', error);
      const errorMsg = `Check-out Error: ${error.message}`;
      setAuthError(errorMsg);
      return { success: false, error: errorMsg };
    }
  }, [dbWrite, students, totalPasses, ref, push, runTransaction, appSetup.todayString, tRef, passPrefix, passStartNumber, sortedStudentsOnBreak.length, attendanceRef]);
  
  // !! កែសម្រួល !!: handleCheckIn (Return ID Number)
  const handleCheckIn = React.useCallback(async (studentId) => {
    const student = students.find(s => s.id === studentId);
    if (!student || !dbWrite) {
        return { success: false, error: "Student or DB not found." };
    }
    
    const studentBreaks = attendanceRef.current[student.id] || [];
    const activeBreak = studentBreaks.find(r => r.checkOutTime && !r.checkInTime);
    
    if (!activeBreak) {
       console.error("Check-in Error: No active break found.");
       return { success: false, error: tRef.current.faceCheckInError };
    }
    
    const nowISO = new Date().toISOString();
    try {
      await update(ref(dbWrite, `attendance/${activeBreak.id}`), { checkInTime: nowISO }); 
      
      setTimeout(() => { setSearchTerm(''); setSelectedStudentId(''); setIsSearchFocused(false); }, 3000); 
      
      return { 
        success: true, 
        studentName: student.name || tRef.current.noName,
        studentIdNumber: student.idNumber || 'N/A' // !! ថ្មី !!: បញ្ជូន ID Number
      };

    } catch (error) {
      console.error('Check-in Error (dbWrite):', error);
      setAuthError(`Check-in Error: ${error.message}`);
      setIsScannerBusy(false); 
      return { success: false, error: error.message };
    }
  }, [dbWrite, students, ref, update, attendanceRef, tRef]); 
  
  const handleOpenPasswordModal = React.useCallback((message, onConfirmCallback) => {
    setPasswordPrompt({ isOpen: true, message: message, onConfirm: onConfirmCallback, error: null });
  }, []);
  
  const handleOpenDeleteModal_Simple = React.useCallback((e, student, record) => { e.stopPropagation(); setRecordToDelete({ student, record }); }, []);
  
  const handlePasswordSubmit = React.useCallback((password) => {
    if (!adminPassword) { setPasswordPrompt(prev => ({ ...prev, error: "សូមរង់ចាំ... Password កំពុង Load" })); return; }
    if (password === adminPassword) { passwordPrompt.onConfirm(); setPasswordPrompt({ isOpen: false }); } 
    else { setPasswordPrompt(prev => ({ ...prev, error: tRef.current.passwordError })); }
  }, [adminPassword, passwordPrompt]);
  
  const handleConfirmDelete_Single = React.useCallback(async (recordId) => {
    if (!dbWrite) return;
    try { await remove(ref(dbWrite, `attendance/${recordId}`)); } 
    catch (error) { setAuthError(`Delete Error: ${error.message}`); }
  }, [dbWrite, ref, remove]); 
  
  const handleToggleSelectionMode = React.useCallback(() => { setIsSelectionMode(prev => !prev); setSelectedRecords([]); setShowAdminModal(false); }, []);
  
  const handleRecordSelect = React.useCallback((recordId) => {
    setSelectedRecords(prev => prev.includes(recordId) ? prev.filter(id => id !== recordId) : [...prev, recordId]);
  }, []);
  
  const handleOpenDeleteSelected = React.useCallback(() => {
    if (selectedRecords.length === 0) return;
    handleOpenPasswordModal(tRef.current.deleteSelectedTitle(selectedRecords.length), () => handleConfirmDelete_Multi());
  }, [selectedRecords.length, tRef, handleOpenPasswordModal]);

  const handleConfirmDelete_Multi = React.useCallback(async () => {
    if (!dbWrite || selectedRecords.length === 0) return;
    setIsBulkLoading(true);
    const updates = {};
    selectedRecords.forEach(recordId => { updates[`attendance/${recordId}`] = null; });
    try {
      await update(ref(dbWrite), updates);
      showAlert(tRef.current.deleteSuccess(selectedRecords.length), 'success');
      handleToggleSelectionMode();
    } catch (error) { setAuthError(`Multi-Delete Error: ${error.message}`); } 
    finally { setIsBulkLoading(false); }
  }, [dbWrite, selectedRecords, ref, update, handleToggleSelectionMode, showAlert, tRef]); 
  
  const handleOpenBulkDelete = React.useCallback((mode) => {
    setBulkDeleteMode(mode);
    setShowAdminModal(false);
    setTimeout(() => {
      handleOpenPasswordModal(mode === 'day' ? tRef.current.deleteByDateTitle(bulkDeleteDate) : tRef.current.deleteByMonthTitle(bulkDeleteMonth), () => handleConfirmBulkDelete(mode));
    }, 100);
  }, [bulkDeleteDate, bulkDeleteMonth, tRef, handleOpenPasswordModal]);
  
  const handleConfirmBulkDelete = React.useCallback(async (mode) => {
    if (!dbWrite) return;
    setIsBulkLoading(true);
    try {
      const allDataSnapshot = await get(ref(dbWrite, 'attendance'));
      if (!allDataSnapshot.exists()) { showAlert(tRef.current.deleteNotFound, 'error'); setIsBulkLoading(false); return; }
      const allData = allDataSnapshot.val();
      const updates = {};
      let count = 0;
      const filterDate = mode === 'day' ? bulkDeleteDate : bulkDeleteMonth;
      Object.keys(allData).forEach(recordId => {
        const record = allData[recordId];
        if (record && record.date) {
          const match = (mode === 'day' && record.date === filterDate) || (mode === 'month' && record.date.startsWith(filterDate));
          if (match) { updates[`attendance/${recordId}`] = null; count++; }
        }
      });
      if (count > 0) { await update(ref(dbWrite), updates); showAlert(tRef.current.deleteSuccess(count), 'success'); } 
      else { showAlert(tRef.current.deleteNotFound, 'error'); }
    } catch (error) { setAuthError(`Bulk Delete Error: ${error.message}`); } 
    finally { setIsBulkLoading(false); setBulkDeleteMode(null); }
  }, [dbWrite, bulkDeleteDate, bulkDeleteMonth, tRef, showAlert, ref, get, update]);
  
  const handleEditTotalPasses = React.useCallback(() => { handleOpenPasswordModal(tRef.current.passwordRequired, () => { setInputPrompt({ isOpen: true, title: tRef.current.editPassTotal, message: tRef.current.editPassTotalPrompt, defaultValue: totalPasses, type: 'number', onSubmit: (val) => { const num = parseInt(val); if (val && !isNaN(num) && num >= 0) { set(ref(dbWrite, `${passManagementPath}/totalPasses`), num).then(() => showAlert(tRef.current.passTotalSuccess, 'success')).catch(err => setAuthError(err.message)); } else if (val) { showAlert(tRef.current.invalidNumber, 'error'); } setInputPrompt({ isOpen: false }); }, onCancel: () => setInputPrompt({ isOpen: false }) }); }); }, [handleOpenPasswordModal, tRef, totalPasses, dbWrite, ref, set, showAlert, passManagementPath]);
  const handleEditOvertimeLimit = React.useCallback(() => { handleOpenPasswordModal(tRef.current.passwordRequired, () => { setInputPrompt({ isOpen: true, title: tRef.current.overtimeLimit, message: tRef.current.overtimeLimitPrompt, defaultValue: overtimeLimit, type: 'number', onSubmit: (val) => { const num = parseInt(val); if (val && !isNaN(num) && num > 0) { set(ref(dbWrite, 'passManagement/overtimeLimit'), num).then(() => showAlert(tRef.current.overtimeLimitSuccess, 'success')).catch(err => setAuthError(err.message)); } else if (val) { showAlert(tRef.current.invalidNumber, 'error'); } setInputPrompt({ isOpen: false }); }, onCancel: () => setInputPrompt({ isOpen: false }) }); }); }, [handleOpenPasswordModal, tRef, overtimeLimit, dbWrite, ref, set, showAlert]);
  const handleEditPassPrefix = React.useCallback(() => { handleOpenPasswordModal(tRef.current.passwordRequired, () => { setInputPrompt({ isOpen: true, title: tRef.current.editPassPrefix, message: tRef.current.passPrefixPrompt, defaultValue: passPrefix, type: 'text', onSubmit: (val) => { if (val && val.trim().length > 0) { set(ref(dbWrite, `${passManagementPath}/passPrefix`), val.trim()).then(() => showAlert(tRef.current.passPrefixSuccess, 'success')).catch(err => setAuthError(err.message)); } setInputPrompt({ isOpen: false }); }, onCancel: () => setInputPrompt({ isOpen: false }) }); }); }, [handleOpenPasswordModal, tRef, passPrefix, dbWrite, ref, set, showAlert, passManagementPath]);
  const handleEditPassStartNumber = React.useCallback(() => { handleOpenPasswordModal(tRef.current.passwordRequired, () => { setInputPrompt({ isOpen: true, title: tRef.current.editPassStartNumber, message: tRef.current.passStartNumberPrompt, defaultValue: passStartNumber, type: 'number', onSubmit: (val) => { const num = parseInt(val); if (val && !isNaN(num) && num > 0) { set(ref(dbWrite, `${passManagementPath}/passStartNumber`), num).then(() => showAlert(tRef.current.passStartNumberSuccess, 'success')).catch(err => setAuthError(err.message)); } else if (val) { showAlert(tRef.current.invalidNumber, 'error'); } setInputPrompt({ isOpen: false }); }, onCancel: () => setInputPrompt({ isOpen: false }) }); }); }, [handleOpenPasswordModal, tRef, passStartNumber, dbWrite, ref, set, showAlert, passManagementPath]);
  const handleEditPassword = React.useCallback(() => { handleOpenPasswordModal(tRef.current.passwordRequired, () => { setInputPrompt({ isOpen: true, title: tRef.current.changePassword, message: tRef.current.changePasswordPrompt, defaultValue: '', type: 'text', onSubmit: (val) => { if (val && val.length >= 6) { set(ref(dbWrite, 'passManagement/adminPassword'), val).then(() => showAlert(tRef.current.changePasswordSuccess, 'success')).catch(err => setAuthError(err.message)); } else if (val) { showAlert("Password ត្រូវមានយ៉ាងតិច 6 តួអក្សរ", 'error'); } setInputPrompt({ isOpen: false }); }, onCancel: () => setInputPrompt({ isOpen: false }) }); }); }, [handleOpenPasswordModal, tRef, dbWrite, ref, set, showAlert]);
  const handleEditCheckInMode = React.useCallback(() => { handleOpenPasswordModal(tRef.current.checkInMethodPrompt, () => { const newMode = checkInMode === 'scan' ? 'auto' : 'scan'; set(ref(dbWrite, 'passManagement/checkInMode'), newMode).then(() => showAlert(tRef.current.checkInModeSuccess, 'success')).catch(err => setAuthError(err.message)); }); }, [handleOpenPasswordModal, tRef, checkInMode, dbWrite, ref, set, showAlert]);
  
  const handleCheckInByPassNumber = React.useCallback((passNumber) => {
    if (!passNumber || isScannerBusy) return;
    const activeBreakData = sortedStudentsOnBreak.find(b => b.record.passNumber === passNumber);
    if (activeBreakData) {
        setIsScannerBusy(true); 
        setScannerTriggeredCheckIn(activeBreakData.student.id); 
        setLastScannedInfo({ status: 'success', name: activeBreakData.student.name || tRef.current.noName });
        handleCheckIn(activeBreakData.student.id);
    } else {
      setLastScannedInfo({ status: 'fail', message: tRef.current.scanPassNotFound(passNumber) });
    }
  }, [isScannerBusy, sortedStudentsOnBreak, tRef, handleCheckIn]); 
  
  const handleOpenQrScanner = React.useCallback(() => { setLastScannedInfo(null); setScannerTriggeredCheckIn(null); setIsScannerBusy(false); setShowQrScanner(true); }, []);
  const handleNextPage = React.useCallback(() => { setCompletedPage(p => Math.min(p + 1, totalCompletedPages - 1)); }, [totalCompletedPages]);
  const handlePrevPage = React.useCallback(() => { setCompletedPage(p => Math.max(p - 1, 0)); }, []);
  const handleTouchStart = React.useCallback((e) => { if (currentPage !== 'completed' || totalCompletedPages <= 1) return; touchStartXRef.current = e.touches[0].clientX; }, [currentPage, totalCompletedPages]);
  const handleTouchEnd = React.useCallback((e) => { if (currentPage !== 'completed' || touchStartXRef.current === null || totalCompletedPages <= 1) return; const deltaX = e.changedTouches[0].clientX - touchStartXRef.current; touchStartXRef.current = null; if (deltaX > 75) handlePrevPage(); else if (deltaX < -75) handleNextPage(); }, [currentPage, handlePrevPage, handleNextPage, totalCompletedPages]);

  const handleSearchChange = React.useCallback((e) => { setSearchTerm(e.target.value); setSelectedStudentId(""); }, []); 
  const handleSelectStudentFromList = React.useCallback((student) => { setSearchTerm(student.name || String(student.idNumber)); setSelectedStudentId(student.id); setIsSearchFocused(false); }, []);

  // --- Face Scan Handlers ---
  const clearFeedback = React.useCallback(() => {
    setFaceScanFeedback({ message: '', type: 'info' });
  }, []); 

  // !! កែសម្រួល !!: ហៅ Speak ជាមួយ ID Number និងពាក្យថ្មី
  const onFaceMatchFound_CheckOut = React.useCallback(async (matchedId) => {
    const result = await handleCheckOut(matchedId);
    if (result.success) {
      const message = `${result.studentName} (${tRef.current.statusPass}: ${result.passNumber})`;
      setFaceScanFeedback({ message: message, type: 'success' });
      // ហៅ Speak ជាមួយ ID និងពាក្យថ្មី + ចន្លោះផ្អាក '...'
      speak(`${tRef.current.idNumber} ${result.studentIdNumber} ... ${tRef.current.faceSpeakCheckOut}`);
    } else {
      setFaceScanFeedback({ message: result.error, type: 'error' });
      speak(result.error);
    }
  }, [handleCheckOut, speak, tRef]);

  // !! កែសម្រួល !!: ហៅ Speak ជាមួយ ID Number និងពាក្យថ្មី
  const onFaceMatchFound_CheckIn = React.useCallback(async (matchedId) => {
    const result = await handleCheckIn(matchedId);
    if (result.success) {
      const message = `${result.studentName} (${tRef.current.faceCheckInSuccess})`;
      setFaceScanFeedback({ message: message, type: 'success' });
      // ហៅ Speak ជាមួយ ID និងពាក្យថ្មី + ចន្លោះផ្អាក '...'
      speak(`${tRef.current.idNumber} ${result.studentIdNumber} ... ${tRef.current.faceSpeakCheckIn}`);
    } else {
      setFaceScanFeedback({ message: result.error, type: 'error' });
      speak(result.error);
    }
  }, [handleCheckIn, speak, tRef]);
  
  const onFaceMatchFound_Main = React.useCallback((matchedId) => {
      if (faceScanMode === 'checkout') {
        onFaceMatchFound_CheckOut(matchedId);
      } else {
        onFaceMatchFound_CheckIn(matchedId);
      }
  }, [faceScanMode, onFaceMatchFound_CheckOut, onFaceMatchFound_CheckIn]);
  

  // --- Main Render ---
  return (
    <React.Fragment>
      <div className={`min-h-screen ${backgroundStyles[background] || backgroundStyles['style1']} font-kantumruy p-4 transition-all duration-500`}>
        <div className="container mx-auto max-w-lg relative">
          
          <div className={`transition-all duration-300 ease-in-out ${isSearchFocused ? '-translate-y-24' : 'translate-y-0'}`}>
            <h1 className="text-4xl font-bold text-center mb-2 text-white">{t.appTitle}</h1>
            <p className="text-xl text-center text-blue-200 mb-6">{appSetup.displayDate}</p>
          </div>

          {/* --- TABS --- */}
          <div className={`w-full max-w-md mx-auto bg-white/10 backdrop-blur-sm rounded-full p-1 flex space-x-1 mb-6 transition-all duration-300 ease-in-out ${isSearchFocused ? '-translate-y-24' : 'translate-y-0'}`}>
            <button onClick={() => { setCurrentPage('search'); setCompletedPage(0); }} className={`w-1/5 px-2 py-3 rounded-full flex items-center justify-center transition-colors relative ${currentPage === 'search' ? 'bg-white text-blue-800 shadow-lg' : 'text-white'}`}><span className="relative z-10 flex items-center"><IconSearch /></span></button>
            <button onClick={() => { setCurrentPage('onBreak'); setCompletedPage(0); }} className={`w-1/5 px-2 py-3 rounded-full flex items-center justify-center transition-colors relative ${currentPage === 'onBreak' ? 'bg-white text-blue-800 shadow-lg' : 'text-white'}`}><span className="relative z-10 flex items-center"><IconClock />{studentsOnBreakCount > 0 && (<span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">{studentsOnBreakCount}</span>)}</span></button>
            <button onClick={() => { setCurrentPage('completed'); setCompletedPage(0); }} className={`w-1/5 px-2 py-3 rounded-full flex items-center justify-center transition-colors relative ${currentPage === 'completed' ? 'bg-white text-blue-800 shadow-lg' : 'text-white'}`}><span className="relative z-10 flex items-center"><IconCheckCircle />{filteredCompletedBreaks.length > 0 && (<span className="absolute -top-1 -right-1 w-5 h-5 bg-green-600 text-white text-xs font-bold rounded-full flex items-center justify-center">{filteredCompletedBreaks.length}</span>)}</span></button>
            <button onClick={handleOpenQrScanner} className={`w-1/5 px-2 py-3 rounded-full flex items-center justify-center transition-colors relative text-white`}><span className="relative z-10 flex items-center"><IconQrCode /></span></button>
            <button onClick={() => { setCurrentPage('settings'); setCompletedPage(0); }} className={`w-1/5 px-2 py-3 rounded-full flex items-center justify-center transition-colors relative ${currentPage === 'settings' ? 'bg-white text-blue-800 shadow-lg' : 'text-white'}`}><span className="relative z-10 flex items-center"><IconSettings /></span></button>
          </div>

          {/* --- CONTENT --- */}
          {loading && <LoadingSpinner />}
          {authError && (<div className="mt-4 mb-4 text-center bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg relative max-w-md mx-auto" role="alert"><strong className="font-bold">បញ្ហា!</strong><span className="block sm:inline ml-2">{authError}</span><button onClick={() => setAuthError(null)} className="absolute top-0 bottom-0 right-0 px-4 py-3 text-red-700">✕</button></div>)}
            
          {/* --- PAGE 1: ស្វែងរក --- */}
          {!loading && currentPage === 'search' && (
            <div key="search-page" className="relative">
              <div className={`w-full max-w-md mx-auto transition-all duration-300 ease-in-out ${isSearchFocused ? '-translate-y-24' : 'mb-8'}`}>
                {students.length > 0 ? (
                  <div className="relative">
                    <div className="flex items-center space-x-2">
                        <input
                          type="text"
                          id="student-search"
                          value={searchTerm}
                          onChange={handleSearchChange}
                          onFocus={() => { setIsSearchFocused(true); setAuthError(null); }}
                          onBlur={() => { setTimeout(() => { if (!document.activeElement.classList.contains('search-result-button')) { setIsSearchFocused(false); } }, 200); }} 
                          onKeyDown={(e) => { if (e.key === 'Enter') { e.target.blur(); setIsSearchFocused(false); } }}
                          placeholder={t.searchPlaceholder} 
                          className="block w-full px-6 py-4 bg-white/20 border border-white/30 rounded-full text-white text-lg placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-white shadow-inner"
                        />

                        <button
                            onClick={() => setShowFaceScanner(true)}
                            disabled={!faceMatcher || processingFaces}
                            className={`p-4 rounded-full shadow-lg transition-all flex-shrink-0 relative overflow-hidden ${
                                !faceMatcher || processingFaces 
                                ? 'bg-gray-500/50 cursor-not-allowed' 
                                : 'bg-white text-blue-800 hover:bg-blue-100'
                            }`}
                            title={processingFaces ? `${t.loadingModels} ${faceLoadProgress}%` : t.faceScan}
                        >
                            {processingFaces ? (
                                <div className="flex items-center justify-center w-6 h-6">
                                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 24 24">
                                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" fill="none" className="text-gray-300" />
                                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" fill="none" className="text-blue-600" 
                                            strokeDasharray="62.8" 
                                            strokeDashoffset={62.8 - (62.8 * faceLoadProgress) / 100} 
                                        />
                                    </svg>
                                    <span className="absolute text-[8px] font-bold text-white">{faceLoadProgress}</span>
                                </div>
                            ) : (
                                <IconFaceId />
                            )}
                        </button>
                    </div>
                    
                    {searchResults.length > 0 && (
                      <div className="absolute z-10 w-full max-w-md mt-2 bg-white/90 backdrop-blur-lg rounded-2xl shadow-lg max-h-80 overflow-y-auto">
                        {searchResults.map(student => ( 
                          <button key={student.id} className="search-result-button flex items-center w-full p-3 space-x-3 text-left text-gray-800 hover:bg-blue-100 first:rounded-t-2xl last:rounded-b-2xl" onMouseDown={() => handleSelectStudentFromList(student)}>
                            <img src={student.photoUrl || `https://placehold.co/40x40/EBF4FF/76A9FA?text=${student.name ? student.name.charAt(0) : 'N'}`} className="w-10 h-10 rounded-full object-cover" />
                            <div className="flex-1"><p className="font-bold">{student.name}</p><p className="text-sm text-gray-600">{student.idNumber}</p></div>
                            <div className="text-right"><p className={`text-sm font-semibold ${student.statusColor}`}>{student.statusText}</p>{student.passNumber && (<p className="text-xs text-blue-600 font-bold">{t.statusPass}: {student.passNumber}</p>)}</div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ) : ( !authError && <p className="text-gray-300 text-lg text-center">{t.studentNotFound}</p> )}
              </div>
              
              {selectedStudent && (
                <StudentCard 
                  student={selectedStudent} 
                  pageKey="search"
                  passesInUse={studentsOnBreakCount}
                  attendance={attendance}
                  now={now}
                  onCheckOutClick={async (studentId) => { 
                     const result = await handleCheckOut(studentId);
                     if (result.success) {
                       speak(`${tRef.current.idNumber} ${result.studentIdNumber} ... ${tRef.current.faceSpeakCheckOut}`); // !! កែសម្រួល !!
                       setTimeout(() => {
                         setSearchTerm('');
                         setSelectedStudentId('');
                         setIsSearchFocused(false);
                       }, 3000);
                     } else {
                       speak(result.error);
                     }
                  }}
                  handleCheckIn={async (studentId) => { 
                      const result = await handleCheckIn(studentId);
                      if (result.success) {
                          speak(`${tRef.current.idNumber} ${result.studentIdNumber} ... ${tRef.current.faceSpeakCheckIn}`); // !! កែសម្រួល !!
                      } else {
                          speak(result.error);
                      }
                  }}
                  handleOpenQrScanner={handleOpenQrScanner}
                  onDeleteClick={handleOpenDeleteModal_Simple}
                  totalPasses={totalPasses}
                  t={t}
                  checkInMode={checkInMode}
                  overtimeLimit={overtimeLimit} 
                  appBranch={appBranch} 
                />
              )}
              {!selectedStudent && searchTerm !== "" && searchResults.length === 0 && isSearchFocused && (<p className="text-center text-white/70 text-lg mt-10">{t.studentNotFound}</p>)}
            </div>
          )}

          {/* --- PAGE 2: កំពុងសម្រាក --- */}
          {!loading && currentPage === 'onBreak' && (
            <div key="on-break-page" className="pb-10">
              {sortedStudentsOnBreak.length > 0 ? (
                sortedStudentsOnBreak.map(({ student, record, elapsedMins, isOvertime }) => (
                  <OnBreakStudentListCard key={record.id} student={student} record={record} elapsedMins={elapsedMins} isOvertime={isOvertime} 
                    onCheckIn={async () => { 
                         const result = await handleCheckIn(student.id);
                         if (result.success) {
                             speak(`${tRef.current.idNumber} ${result.studentIdNumber} ... ${tRef.current.faceSpeakCheckIn}`); // !! កែសម្រួល !!
                         } else {
                             speak(result.error);
                         }
                    }} 
                    handleOpenQrScanner={handleOpenQrScanner} 
                    onDeleteClick={(e) => handleOpenDeleteModal_Simple(e, student, record)} 
                    t={t} checkInMode={checkInMode} 
                  />
                ))
              ) : (<div className="mt-16 text-center"><p className="text-white text-2xl font-semibold">{t.noStudentsOnBreak}</p></div>)}
            </div>
          )}
          
          {/* --- PAGE 3: បានចូល --- */}
          {!loading && currentPage === 'completed' && (
            <div key="completed-page" className="pb-10" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
              <CompletedListHeader onAdminClick={() => setShowAdminModal(true)} onMultiDeleteClick={handleOpenDeleteSelected} onCancelMultiSelect={handleToggleSelectionMode} selectionCount={selectedRecords.length} isSelectionMode={isSelectionMode} t={t} />
              {filteredCompletedBreaks.length > 0 ? (
                paginatedCompletedBreaks.map(({ student, record }) => (
                  <CompletedStudentListCard key={record.id} student={student} record={record} onClick={() => !isSelectionMode && null} isSelected={selectedRecords.includes(record.id)} onSelect={() => handleRecordSelect(record.id)} onDeleteClick={(e) => handleOpenPasswordModal(t.deleteConfirmMessage(student.name), () => handleConfirmDelete_Single(record.id))} isSelectionMode={isSelectionMode} t={t} overtimeLimit={overtimeLimit} />
                ))
              ) : (<div className="mt-16 text-center"><p className="text-white text-2xl font-semibold">{t.noStudentsCompleted}</p></div>)}
              <PaginationControls currentPage={completedPage + 1} totalPages={totalCompletedPages} onNext={handleNextPage} onPrev={handlePrevPage} t={t} />
            </div>
          )}
          
          {/* --- PAGE 5: Settings --- */}
          {!loading && currentPage === 'settings' && (
            <SettingsPage t={t} language={language} setLanguage={setLanguage} background={background} setBackground={setBackground} checkInMode={checkInMode} onEditCheckInMode={handleEditCheckInMode} onEditPassword={handleEditPassword} passesInUse={studentsOnBreakCount} totalPasses={totalPasses} onEditTotalPasses={handleEditTotalPasses} overtimeLimit={overtimeLimit} onEditOvertimeLimit={handleEditOvertimeLimit} passPrefix={passPrefix} onEditPassPrefix={handleEditPassPrefix} passStartNumber={passStartNumber} onEditPassStartNumber={handleEditPassStartNumber} appBranch={appBranch} />
          )}
          
          {!loading && (<p className="text-center text-xs text-blue-300 opacity-70 mt-8">{t.footer}</p>)}
        </div>
        
        {/* --- MODALS --- */}
        {modalStudent && (<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md" onClick={() => setModalStudent(null)}><div className="w-full max-w-lg" onClick={(e) => e.stopPropagation()}><StudentCard student={modalStudent} pageKey="modal" passesInUse={studentsOnBreakCount} attendance={attendance} now={now} 
        onCheckOutClick={async (studentId) => {
           const result = await handleCheckOut(studentId);
           if (result.success) {
             speak(`${tRef.current.idNumber} ${result.studentIdNumber} ... ${tRef.current.faceSpeakCheckOut}`); // !! កែសម្រួល !!
             setTimeout(() => setModalStudent(null), 3000);
           } else {
             speak(result.error);
           }
        }}
        handleCheckIn={async (studentId) => {
             const result = await handleCheckIn(studentId);
             if (result.success) {
                 speak(`${tRef.current.idNumber} ${result.studentIdNumber} ... ${tRef.current.faceSpeakCheckIn}`); // !! កែសម្រួល !!
             } else {
                 speak(result.error);
             }
        }} 
        handleOpenQrScanner={handleOpenQrScanner} onDeleteClick={handleOpenDeleteModal_Simple} totalPasses={totalPasses} t={t} checkInMode={checkInMode} overtimeLimit={overtimeLimit} appBranch={appBranch} /><button onClick={() => setModalStudent(null)} className="absolute top-4 right-4 text-white bg-white/10 p-2 rounded-full transition-all hover:bg-white/30"><IconClose /></button></div></div>)}
        <DeleteConfirmationModal recordToDelete={recordToDelete} onCancel={() => setRecordToDelete(null)} onConfirm={() => { handleConfirmDelete_Single(recordToDelete.record.id); setRecordToDelete(null); }} t={t} />
        <PasswordConfirmationModal prompt={passwordPrompt} onCancel={() => setPasswordPrompt({ isOpen: false })} onSubmit={handlePasswordSubmit} t={t} />
        <AdminActionModal isOpen={showAdminModal} onClose={() => setShowAdminModal(false)} onSelectClick={handleToggleSelectionMode} onBulkClick={(mode) => handleOpenBulkDelete(mode)} isBulkLoading={isBulkLoading} bulkDeleteDate={bulkDeleteDate} setBulkDeleteDate={setBulkDeleteDate} bulkDeleteMonth={bulkDeleteMonth} setBulkDeleteMonth={setBulkDeleteMonth} t={t} />
        <QrScannerModal isOpen={showQrScanner} onClose={() => setShowQrScanner(false)} onScanSuccess={handleCheckInByPassNumber} lastScannedInfo={lastScannedInfo} isScannerBusy={isScannerBusy} t={t} />
        
        <FaceScannerModal 
          isOpen={showFaceScanner} 
          onClose={() => setShowFaceScanner(false)} 
          onMatchFound={onFaceMatchFound_Main} 
          faceMatcher={faceMatcher} 
          t={t}
          feedback={faceScanFeedback}
          clearFeedback={clearFeedback} 
          faceScanMode={faceScanMode}
          setFaceScanMode={setFaceScanMode}
        />
        
        <InfoAlertModal alertInfo={infoAlert} onClose={() => setInfoAlert({ isOpen: false })} t={t} />
        <InputPromptModal promptInfo={inputPrompt} onCancel={inputPrompt.onCancel} onSubmit={inputPrompt.onSubmit} t={t} />
        
      </div>
    </React.Fragment>
  );
}

// =================================================================
// 6. START APP
// =================================================================
const container = document.getElementById('root');
const root = ReactDOM.createRoot(container);
root.render(<App />);
