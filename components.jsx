// =================================================================
// 4. MAIN UI COMPONENTS
// =================================================================

// ទាញអថេរ និង Icons ពី Global Scope
const {
  calculateDuration,
  IconCheckOut, IconCheckIn, IconSearch, IconClock, IconCheckCircle,
  IconTicket, IconClose, IconTrash, IconNoSymbol, IconAlert,
  IconSpecial, IconDotsVertical, IconLock, IconQrCode, IconPencil,
  IconInfo, IconCheckCircleFill, IconPencilSquare,
  IconArrowLeft, IconArrowRight, 
  IconCameraRotate, 
  IconToggleLeft, IconToggleRight,
  IconFaceId
} = window.appSetup;

const { useState, useEffect, useRef } = React;

// !! START: កែសម្រួល StudentCard !!
window.StudentCard = ({ 
  student, pageKey, passesInUse, attendance, now, 
  // handleCheckOut, // !! លុប !!
  onCheckOutClick, // !! ថ្មី !!: ប្រើ Prop នេះជំនួស
  handleCheckIn, 
  handleOpenQrScanner, 
  onDeleteClick, 
  totalPasses, 
  t, 
  checkInMode,
  overtimeLimit, 
  appBranch 
}) => {
  
  const studentBreaks = attendance[student.id] || [];
  const activeBreak = studentBreaks.find(r => r.checkOutTime && !r.checkInTime);
  const completedBreaks = studentBreaks.filter(r => r.checkOutTime && r.checkInTime);
      
  let statusText = t.statusNotYet;
  let statusClass = 'bg-gray-500 text-white'; 
  let canCheckIn = false; 
  let canCheckOut = true;
  let isSpecialCase = false; 
  
  let passesAvailable = totalPasses - passesInUse;
  
  if (activeBreak) {
    const elapsedMins = calculateDuration(activeBreak.checkOutTime, now.toISOString());
    const isOvertime = elapsedMins > overtimeLimit;
    
    const branchDisplay = activeBreak.branch ? ` (${activeBreak.branch})` : ''; 
    const passNumberDisplay = activeBreak.passNumber ? `${t.statusPass}: ${activeBreak.passNumber}` : '';
    statusText = `${t.statusOnBreak} (${passNumberDisplay}${branchDisplay}) (${elapsedMins} ${t.minutes})`; 
    
    statusClass = isOvertime 
      ? 'bg-red-600 text-white animate-pulse' 
      : 'bg-yellow-500 text-white animate-pulse';
    canCheckIn = true; 
    canCheckOut = false; 
    if (activeBreak.breakType === 'special') {
        isSpecialCase = true;
    }
    
  } else if (completedBreaks.length > 0) {
    const lastBreak = completedBreaks[completedBreaks.length - 1]; 
    const duration = calculateDuration(lastBreak.checkOutTime, lastBreak.checkInTime);
    const isCompletedOvertime = duration > overtimeLimit;
    const overtimeMins = isCompletedOvertime ? duration - overtimeLimit : 0;
    
    statusText = isCompletedOvertime
      ? `${t.statusCompleted} (${t.statusOvertime} ${overtimeMins} ${t.minutes})`
      : `${t.statusCompleted} (${duration} ${t.minutes})`; 
    statusClass = isCompletedOvertime
      ? 'bg-red-600 text-white' 
      : 'bg-green-600 text-white';
    canCheckIn = false;
    canCheckOut = true; 
    
    if (studentBreaks.some(r => r.breakType === 'special')) {
      isSpecialCase = true;
    }

  } else {
    statusText = t.statusNotYet;
    statusClass = 'bg-gray-500 text-white';
    canCheckIn = false;
    canCheckOut = true;
  }
  
  if (passesAvailable <= 0 && canCheckOut) {
    canCheckOut = false; 
    statusText = `${t.statusPassOut} (${passesInUse}/${totalPasses})`;
    statusClass = 'bg-red-600 text-white';
  }
  
  const photoUrl =
    student.photoUrl ||
    `https://placehold.co/128x128/EBF4FF/76A9FA?text=${student.name ? student.name.charAt(0) : 'N'}`;

  const checkInAction = checkInMode === 'scan' 
    ? handleOpenQrScanner 
    : () => handleCheckIn(student.id);

  return (
    <div
      key={`${pageKey}-${student.id}`} 
      className="bg-white/10 backdrop-blur-lg rounded-3xl shadow-xl p-6 relative mt-16 max-w-md mx-auto"
    >
      {activeBreak && (
        <button
          onClick={(e) => onDeleteClick(e, student, activeBreak)}
          className="absolute top-4 right-4 text-red-300 bg-red-900/50 p-2 rounded-full transition-all hover:bg-red-500 hover:text-white"
          title={t.delete}
        >
          <IconTrash />
        </button>
      )}
      
      <img
        src={photoUrl}
        alt={`រូបថតរបស់ ${student.name || t.noName}`}
        className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-lg absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2"
        onError={(e) => {
          e.target.src = `https://placehold.co/128x128/EBF4FF/76A9FA?text=${student.name ? student.name.charAt(0) : 'N'}`;
        }}
      />
      
      <div className="pt-16 text-center">
        <p className="text-3xl font-bold text-white">
          {student.name || t.noName}
        </p>
        <p className="text-lg text-blue-200">
          {t.idNumber}: {student.idNumber || 'N/A'}
        </p>
        <p className="text-lg text-blue-200">
          {t.class}: {student.class || 'N/A'}
        </p>
      </div>
      
      {/* --- Case 1: កំពុងសម្រាក (Active Break) --- */}
      {activeBreak && (
        <>
          <div className="my-6 text-center">
            <p className={`inline-flex items-center px-5 py-2 rounded-full text-md font-semibold ${statusClass}`}>
              {statusText}
              {isSpecialCase && <IconSpecial />}
            </p>
          </div>
          <button
            onClick={checkInAction} 
            disabled={!canCheckIn}
            className="flex items-center justify-center w-full px-4 py-4 rounded-full text-lg text-blue-800 font-bold transition-all transform hover:scale-105 shadow-lg bg-white hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100"
          >
            <IconCheckIn />
            {t.checkIn}
          </button>
        </>
      )}

      {/* --- Case 2: មិនទាន់សម្រាក ឬ សម្រាករួច (No Active Break) --- */}
      {!activeBreak && (
        <div className="my-6">
          <div className="flex justify-center items-center space-x-4">
            {/* Status Text */}
            <p className={`inline-flex items-center px-5 py-2 rounded-full text-md font-semibold ${statusClass}`}>
              {statusText}
              {isSpecialCase && <IconSpecial />}
            </p>
            
            {/* !! កែសម្រួល !!: ប្រើ onCheckOutClick */}
            {canCheckOut && (
              <button
                onClick={() => onCheckOutClick(student.id)}
                disabled={!canCheckOut} 
                className="flex items-center justify-center p-4 rounded-full text-lg text-white font-bold transition-all transform hover:scale-105 shadow-lg bg-red-500 hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100"
              >
                <IconCheckOut />
              </button>
            )}
            
            {/* Pass Out Warning (បើអស់កាត) */}
            {!canCheckOut && statusText.startsWith(t.statusPassOut) && (
              <div className="flex items-center justify-center p-4 rounded-full text-lg text-white font-bold bg-red-600/50 opacity-80 cursor-not-allowed">
                <IconNoSymbol />
              </div>
            )}
          </div>
        </div>
      )}
      
    </div>
  );
};
// !! END: កែសម្រួល StudentCard !!

window.CompletedStudentListCard = ({ student, record, onClick, isSelected, onSelect, onDeleteClick, isSelectionMode, t, overtimeLimit }) => {
  
  const formatTime = (isoString) => {
    if (!isoString) return 'N/A';
    return new Date(isoString).toLocaleTimeString('km-KH', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const duration = calculateDuration(record?.checkOutTime, record?.checkInTime);
  
  const isOvertime = duration > overtimeLimit;
  const overtimeMins = isOvertime ? duration - overtimeLimit : 0;
  const cardColor = isOvertime 
    ? 'bg-red-800/30 backdrop-blur-lg border border-red-500/30' 
    : 'bg-white/10 backdrop-blur-lg'; 
  const durationColor = isOvertime ? 'text-red-300' : 'text-green-300';

  const photoUrl =
    student.photoUrl ||
    `https://placehold.co/64x64/EBF4FF/76A9FA?text=${student.name ? student.name.charAt(0) : 'N'}`;

  const branchDisplay = record.branch ? ` (${record.branch})` : '';

  return (
    <div
      className={`w-full max-w-md mx-auto rounded-2xl shadow-lg p-4 mb-3 flex items-center space-x-4 transition-all ${cardColor} ${isSelectionMode ? 'cursor-pointer' : ''} ${isSelected ? 'ring-2 ring-blue-400' : ''}`}
      onClick={() => isSelectionMode ? onSelect() : (onClick ? onClick() : null)}
    >
      {isSelectionMode && (
        <input 
          type="checkbox"
          checked={isSelected}
          onChange={onSelect}
          className="form-checkbox h-6 w-6 text-blue-600 bg-gray-700 border-gray-500 rounded focus:ring-blue-500"
          onClick={(e) => e.stopPropagation()} 
        />
      )}
      <img
        src={photoUrl}
        alt={`រូបថតរបស់ ${student.name || t.noName}`}
        className="w-16 h-16 rounded-full object-cover border-2 border-white shadow-md"
        onError={(e) => {
          e.target.src = `https://placehold.co/64x64/EBF4FF/76A9FA?text=${student.name ? student.name.charAt(0) : 'N'}`;
        }}
      />
      <div className="flex-1 text-left">
        <p className="text-xl font-bold text-white">
          {student.name || t.noName}
        </p>
        <p className="text-sm text-blue-200">
          {t.checkOut}: {formatTime(record?.checkOutTime)} | {t.checkIn}: {formatTime(record?.checkInTime)}
        </p>
        
        {record.passNumber && (
          <p className="text-sm font-semibold text-cyan-300">
            ({t.statusPass}: {record.passNumber}{branchDisplay})
          </p>
        )}
        
        {isOvertime && (
          <p className="text-sm font-semibold text-red-300">
            ({t.statusOvertime} {overtimeMins} {t.minutes})
          </p>
        )}
        {record.breakType === 'special' && (
           <p className="text-sm font-semibold text-purple-300">
           ({t.specialCase})
           </p>
        )}
      </div>
      
      <div className="text-center px-2">
        <p className={`text-2xl font-bold ${durationColor}`}>{duration}</p>
        <p className="text-xs text-blue-200">{t.minutes}</p>
      </div>
      
      {!isSelectionMode && (
        <button
          onClick={(e) => onDeleteClick(e)}
          className="p-3 rounded-full text-red-300 bg-white/10 transition-colors hover:bg-red-500 hover:text-white"
          title={t.delete}
        >
          <IconTrash />
        </button>
      )}
    </div>
  );
};

window.OnBreakStudentListCard = ({ 
  student, record, elapsedMins, isOvertime, 
  onCheckIn, 
  handleOpenQrScanner, 
  onDeleteClick, 
  t, 
  checkInMode
}) => {
  
  const cardColor = isOvertime 
    ? 'bg-red-800/30 backdrop-blur-lg border border-red-500/30' 
    : 'bg-yellow-500/20 backdrop-blur-lg border border-yellow-500/30'; 
  
  const textColor = isOvertime ? 'text-red-300' : 'text-yellow-300';

  const photoUrl =
    student.photoUrl ||
    `https://placehold.co/64x64/EBF4FF/76A9FA?text=${student.name ? student.name.charAt(0) : 'N'}`;
    
  const checkInAction = checkInMode === 'scan' 
    ? handleOpenQrScanner 
    : () => onCheckIn();

  const branchDisplay = record.branch ? ` (${record.branch})` : '';

  return (
    <div className={`w-full max-w-md mx-auto rounded-2xl shadow-lg p-4 mb-3 flex items-center space-x-3 ${cardColor}`}>
      <img
        src={photoUrl}
        alt={`រូបថតរបស់ ${student.name || t.noName}`}
        className="w-16 h-16 rounded-full object-cover border-2 border-white/50 shadow-md"
        onError={(e) => { e.target.src = `https://placehold.co/64x64/EBF4FF/76A9FA?text=${student.name ? student.name.charAt(0) : 'N'}`; }}
      />
      <div className="flex-1 text-left">
        <p className="text-xl font-bold text-white">
          {student.name || t.noName}
        </p>
        <p className={`text-sm font-semibold ${textColor} inline-flex items-center`}>
          {isOvertime ? t.overtimeExclamation : t.statusOnBreak}
          {record.breakType === 'special' && (
            <span className="ml-2 px-2 py-0.5 text-xs text-purple-800 bg-purple-300 rounded-full">
              {t.specialCase}
            </span>
          )}
        </p>
        <p className="text-sm text-blue-200">
          ({t.statusPass}: {record.passNumber || '???'}{branchDisplay})
        </p>
      </div>
      
      <div className="text-center px-2">
        <p className={`text-2xl font-bold ${textColor}`}>{elapsedMins}</p>
        <p className="text-xs text-blue-200">{t.minutes}</p>
      </div>
      
      <div className="flex flex-col space-y-2">
        <button
          onClick={checkInAction} 
          className="p-3 rounded-full text-blue-800 bg-white transition-colors hover:bg-gray-200"
          title={t.checkIn}
        >
          <IconCheckIn />
        </button>
        
        <button
          onClick={(e) => onDeleteClick(e)}
          className="p-3 rounded-full text-red-300 bg-white/10 transition-colors hover:bg-red-500 hover:text-white"
          title={t.delete}
        >
          <IconTrash />
        </button>
      </div>
    </div>
  );
};

window.PasswordConfirmationModal = ({ prompt, onSubmit, onCancel, t }) => {
  if (!prompt.isOpen) return null;
  
  const [password, setPassword] = useState("");
  
  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(password);
  };
  
  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md"
      onClick={onCancel} 
    >
      <div
        className="w-full max-w-sm bg-white rounded-2xl shadow-lg p-6 text-center"
        onClick={(e) => e.stopPropagation()} 
      >
        <IconLock />
        <h3 className="text-2xl font-bold text-gray-900 mb-2">
          {t.passwordRequired}
        </h3>
        <p className="text-gray-600 mb-4">
          {prompt.message}
        </p>
        <form onSubmit={handleSubmit}>
          <input 
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg text-center text-lg"
            placeholder={t.passwordPlaceholder}
            autoFocus
          />
          {prompt.error && (
            <p className="text-red-500 text-sm mt-2">{prompt.error}</p>
          )}
          <div className="flex justify-center space-x-4 mt-6">
            <button
              type="button"
              onClick={onCancel}
              className="px-6 py-3 rounded-full text-gray-700 bg-gray-200 hover:bg-gray-300 font-bold"
            >
              {t.cancel}
            </button>
            <button
              type="submit"
              className="px-6 py-3 rounded-full text-white bg-blue-500 hover:bg-blue-600 font-bold"
            >
              {t.confirm}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

window.AdminActionModal = ({ isOpen, onClose, onSelectClick, onBulkClick, isBulkLoading, bulkDeleteDate, setBulkDeleteDate, bulkDeleteMonth, setBulkDeleteMonth, t }) => {
  if (!isOpen) return null;
  
  return (
    <div 
      className="fixed inset-0 z-50 flex items-end justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={onClose} 
    >
      <div
        className="w-full max-w-md bg-white rounded-t-2xl shadow-lg p-4"
        onClick={(e) => e.stopPropagation()} 
      >
        <div className="w-16 h-1.5 bg-gray-300 rounded-full mx-auto mb-4"></div>
        
        <h3 className="text-xl font-bold text-gray-900 mb-4 text-center">
          {t.adminTitle}
        </h3>
        
        <div className="space-y-3">
          <button
            onClick={onSelectClick}
            className="w-full px-4 py-3 text-left text-lg font-semibold text-gray-800 bg-gray-100 hover:bg-gray-200 rounded-lg"
          >
            {t.multiSelect}
          </button>
          
          <div className="p-4 bg-gray-100 rounded-lg">
            <label className="block text-lg font-semibold text-gray-800 mb-2">{t.deleteByDate}</label>
            <input 
              type="date"
              value={bulkDeleteDate}
              onChange={(e) => setBulkDeleteDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-lg"
            />
            <button
              onClick={() => onBulkClick('day')}
              className="w-full mt-2 px-4 py-3 text-lg font-bold text-white bg-red-500 hover:bg-red-600 rounded-lg disabled:opacity-50"
              disabled={isBulkLoading}
            >
              {isBulkLoading ? t.deleting : t.deleteByDateButton}
            </button>
          </div>
          
          <div className="p-4 bg-gray-100 rounded-lg">
            <label className="block text-lg font-semibold text-gray-800 mb-2">{t.deleteByMonth}</label>
            <input 
              type="month"
              value={bulkDeleteMonth}
              onChange={(e) => setBulkDeleteMonth(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-lg"
            />
            <button
              onClick={() => onBulkClick('month')}
              className="w-full mt-2 px-4 py-3 text-lg font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg disabled:opacity-50"
              disabled={isBulkLoading}
            >
              {isBulkLoading ? t.deleting : t.deleteByMonthButton}
            </button>
          </div>
          
        </div>
      </div>
    </div>
  );
};

window.CompletedListHeader = ({ onAdminClick, onMultiDeleteClick, onCancelMultiSelect, selectionCount, isSelectionMode, t }) => {
  return (
    <div className="w-full max-w-md mx-auto mb-4 flex justify-between items-center">
      {!isSelectionMode ? (
        <>
          <h2 className="text-2xl font-bold text-white">
            {t.historyToday}
          </h2>
          <button
            onClick={onAdminClick}
            className="p-3 rounded-full text-white bg-white/10 transition-colors hover:bg-white/30"
            title={t.adminTitle}
          >
            <IconDotsVertical />
          </button>
        </>
      ) : (
        <>
          <button
            onClick={onCancelMultiSelect}
            className="px-4 py-2 text-white font-semibold bg-gray-600/50 rounded-full hover:bg-gray-500/50"
          >
            {t.cancel}
          </button>
          <button
            onClick={onMultiDeleteClick}
            disabled={selectionCount === 0}
            className="px-4 py-2 text-white font-bold bg-red-500 rounded-full hover:bg-red-600 disabled:opacity-50"
          >
            {t.delete} ({selectionCount})
          </button>
        </>
      )}
    </div>
  );
};

window.LoadingSpinner = () => (
  <div className="flex justify-center items-center mt-10">
    <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
  </div>
);

window.DeleteConfirmationModal = ({ recordToDelete, onCancel, onConfirm, t }) => {
    if (!recordToDelete) return null;
    
    const { student } = recordToDelete;
    
    return (
      <div 
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md"
        onClick={onCancel} 
      >
        <div
          className="w-full max-w-sm bg-white rounded-2xl shadow-lg p-6 text-center"
          onClick={(e) => e.stopPropagation()} 
        >
          <IconAlert />
          <h3 className="text-2xl font-bold text-gray-900 mb-2">
            {t.deleteTitle}
          </h3>
          <p className="text-gray-600 mb-6">
            {t.deleteConfirmMessage(student.name)}
          </p>
          <div className="flex justify-center space-x-4">
            <button
              onClick={onCancel}
              className="px-6 py-3 rounded-full text-gray-700 bg-gray-200 hover:bg-gray-300 font-bold"
            >
              {t.cancel}
            </button>
            <button
              onClick={onConfirm}
              className="px-6 py-3 rounded-full text-white bg-red-500 hover:bg-red-600 font-bold"
            >
              {t.delete}
            </button>
          </div>
        </div>
      </div>
    );
  };


window.QrScannerModal = ({ isOpen, onClose, onScanSuccess, lastScannedInfo, isScannerBusy, t }) => { 
  const [errorMessage, setErrorMessage] = useState(null);
  const [facingMode, setFacingMode] = useState("environment"); 
  const [isMirrored, setIsMirrored] = useState(false); 
  
  const html5QrCodeRef = React.useRef(null);
  const scannerId = "qr-reader"; 

  const stopScanner = () => {
    if (html5QrCodeRef.current) {
      try {
        html5QrCodeRef.current.stop()
          .then(() => {
            console.log("QR Scanner stopped.");
          })
          .catch(err => {
            console.warn("QR Scanner stop error (probably already stopped).", err);
          });
        html5QrCodeRef.current = null;
      } catch (e) {
        console.warn("Error stopping scanner:", e);
      }
    }
  };

  const startScanner = (mode) => {
    setErrorMessage(null);
    const element = document.getElementById(scannerId);
    if (element) {
      const html5QrCode = new Html5Qrcode(scannerId);
      html5QrCodeRef.current = html5QrCode;
      
      const qrCodeSuccessCallback = (decodedText, decodedResult) => {
        onScanSuccess(decodedText);
      };
      
      const config = { fps: 10, qrbox: { width: 250, height: 250 } };

      html5QrCode.start({ facingMode: mode }, config, qrCodeSuccessCallback)
        .catch(err => {
          console.error(`Unable to start ${mode} camera`, err);
          if (err.name === 'NotAllowedError' || err.name === 'PermissionDismissedError') {
            setErrorMessage(t.cameraPermissionDenied);
          } else {
            setErrorMessage(t.cameraError);
          }
        });
    }
  };

  useEffect(() => {
    if (isOpen) {
      if (!isScannerBusy) {
        startScanner(facingMode);
      } else {
        stopScanner();
      }
    } else {
      stopScanner();
    }
    
    return () => {
      stopScanner();
    };
  }, [isOpen, isScannerBusy, facingMode]); 

  useEffect(() => {
    if (!isOpen || isScannerBusy) return;

    const timeoutId = setTimeout(() => {
      try {
        const videoElement = document.querySelector(`#${scannerId} video`);
        if (videoElement) {
          if (facingMode === 'user') {
            videoElement.style.setProperty('transform', isMirrored ? 'scaleX(-1)' : 'scaleX(1)', 'important');
            console.log(`Front camera mirror set to: ${isMirrored}`);
          } else {
            videoElement.style.setProperty('transform', 'scaleX(1)', 'important');
            console.log('Back camera forced to non-mirror.');
          }
        }
      } catch (e) {
        console.error("Error applying mirror style:", e);
      }
    }, 200); 

    return () => clearTimeout(timeoutId);

  }, [isOpen, isScannerBusy, facingMode, isMirrored]);

  const handleFlipCamera = () => {
    if (isScannerBusy) return;
    setFacingMode(prevMode => (prevMode === "user" ? "environment" : "user"));
    setIsMirrored(false); 
  };

  const handleToggleMirror = () => {
    setIsMirrored(prev => !prev);
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md"
      onClick={onClose} 
    >
      <div 
        className="w-full max-w-md bg-white rounded-2xl shadow-lg p-6 relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 text-gray-800 bg-gray-200 p-2 rounded-full z-10"
        >
          <IconClose />
        </button>
        
        <button
          onClick={handleFlipCamera}
          className="absolute top-4 left-4 text-gray-800 bg-gray-200 p-2 rounded-full z-10"
          title={t.flipCamera}
        >
          <IconCameraRotate className="w-6 h-6" />
        </button>

        {facingMode === 'user' && (
          <button
            onClick={handleToggleMirror}
            className="absolute top-16 left-4 text-gray-800 bg-gray-200 p-2 rounded-full z-10"
            title={t.toggleMirror}
          >
            {isMirrored ? <IconToggleRight className="w-6 h-6" /> : <IconToggleLeft className="w-6 h-6" />}
          </button>
        )}
        
        <h3 className="text-2xl font-bold text-gray-900 mb-4 text-center">
          {t.scanToComeBack}
        </h3>
        
        <div id={scannerId} className="w-full"></div> 
        
        <div className="mt-4 text-center h-12">
          {isScannerBusy && (
             <div className="flex justify-center items-center">
                <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-blue-600 text-xl font-bold ml-3">{t.processing}</p>
             </div>
          )}
          
          {!isScannerBusy && errorMessage && (
            <p className="text-red-500 text-lg font-bold">{errorMessage}</p>
          )}
          
          {!isScannerBusy && lastScannedInfo && lastScannedInfo.status === 'success' && (
            <p className="text-green-600 text-xl font-bold animate-pulse">
              ✔ {t.scanned}: {lastScannedInfo.name}
            </p>
          )}
          
          {!isScannerBusy && lastScannedInfo && lastScannedInfo.status === 'fail' && (
            <p className="text-red-600 text-xl font-bold">
              ✖ {lastScannedInfo.message}
            </p>
          )}
        </div>
        
      </div>
    </div>
  );
};

// !! START: កែសម្រួល FaceScannerModal (Kiosk Mode) !!
window.FaceScannerModal = ({ 
    isOpen, onClose, onMatchFound, faceMatcher, t,
    feedback, // !! ថ្មី !!
    clearFeedback // !! ថ្មី !!
}) => {
  const videoRef = useRef();
  const canvasRef = useRef();
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [detectionStatus, setDetectionStatus] = useState(t.loadingModels);
  const intervalRef = useRef(null); 
  const [isBusy, setIsBusy] = useState(false); // State សម្រាប់ការពារការស្កេនជាន់គ្នា

  // Function សម្រាប់ចាប់ផ្ដើមស្កេន
  const startScanInterval = () => {
    if (intervalRef.current) clearInterval(intervalRef.current); // សម្អាត interval ចាស់
    if (!videoRef.current || !canvasRef.current || !faceMatcher) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    // !! ជួសជុល !!: ប្រើ videoWidth/videoHeight ធានាថា Video បើកហើយ
    const displaySize = { width: video.videoWidth, height: video.videoHeight };
    if (displaySize.width === 0 || displaySize.height === 0) return;

    faceapi.matchDimensions(canvas, displaySize);

    intervalRef.current = setInterval(async () => {
      // !! ជួសជុល !!: បន្ថែម !isBusy ក្នុង Check នេះ
      if (!video || !canvas || video.paused || video.ended || isBusy) return;

      const detections = await faceapi.detectAllFaces(video, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceDescriptors();

      const resizedDetections = faceapi.resizeResults(detections, displaySize);
      
      const context = canvas.getContext('2d');
      context.clearRect(0, 0, canvas.width, canvas.height);
      
      if (detections.length > 0) {
        detections.forEach(detection => {
          const match = faceMatcher.findBestMatch(detection.descriptor);
          const label = match.toString();
          const drawBox = new faceapi.draw.DrawBox(detection.detection.box, { label: label });
          drawBox.draw(canvas);

          if (match.label !== 'unknown' && !isBusy) {
             setIsBusy(true); // !! ចាក់សោ !!
             if (intervalRef.current) clearInterval(intervalRef.current);
             onMatchFound(match.label); // ហៅ App.jsx handleCheckOut
          }
        });
      } else {
          // !! កែសម្រួល !!: បង្ហាញតែពេល Feedback ទំនេរ
          if (!feedback.message) {
            setDetectionStatus(t.noFaceDetected); 
          }
      }

    }, 300); // ស្កេនរៀងរាល់ 300ms
  };

  // Effect ទី 1: បើក/បិទ កាមេរ៉ា
  useEffect(() => {
    let stream = null;
    const startVideo = async () => {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        try {
          stream = await navigator.mediaDevices.getUserMedia({ video: {} });
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            // (មិនបាច់ setDetectionStatus(t.processing) ទៀតទេ)
          }
        } catch (err) {
          console.error("Error accessing camera:", err);
          if (err.name === 'NotAllowedError' || err.name === 'PermissionDismissedError') {
            setDetectionStatus(t.cameraPermissionDenied);
          } else {
            setDetectionStatus(t.cameraError);
          }
        }
      }
    };
    const stopVideo = () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      if (videoRef.current && videoRef.current.srcObject) {
        videoRef.current.srcObject = null;
      }
      setIsVideoPlaying(false);
      setDetectionStatus(t.loadingModels); 
      clearFeedback(); 
      setIsBusy(false); // !! ថ្មី !!: Reset Busy ពេលបិទ Modal
    };

    if (isOpen) {
      startVideo();
    } else {
      stopVideo();
    }
    return () => { stopVideo(); };
  }, [isOpen, t, clearFeedback]);

  // Effect ទី 2: ចាប់ផ្ដើម Interval ពេល Video Play និង faceMatcher រួចរាល់
  useEffect(() => {
    // !! ជួសជុល !!: ពិនិត្យ !isBusy មុនពេលចាប់ផ្ដើម
    if (isOpen && isVideoPlaying && faceMatcher && !isBusy) {
      setDetectionStatus(t.processing); // ចាប់ផ្ដើមស្កេន
      startScanInterval(); 
    } else if (isOpen && isVideoPlaying && !faceMatcher) {
      setDetectionStatus(t.loadingModels);
    }
    
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isOpen, isVideoPlaying, faceMatcher, isBusy]); // អាស្រ័យលើ isBusy ដែរ

  // Effect ទី 3: គ្រប់គ្រង Feedback
  useEffect(() => {
    if (feedback.message) {
      // 1. បញ្ឈប់ការស្កេន (isBusy = true)
      setIsBusy(true);
      if (intervalRef.current) clearInterval(intervalRef.current);
      
      // 2. រង់ចាំ 3 វិនាទី
      const timer = setTimeout(() => {
        // 3. សម្អាត Feedback
        clearFeedback();
        // 4. ដោះ Busy (អនុញ្ញាតឲ្យ Effect 2 រត់វិញ)
        setIsBusy(false);
      }, 3000); // បង្ហាញ Feedback រយៈពេល 3 វិនាទី

      return () => clearTimeout(timer);
    }
  }, [feedback, clearFeedback]);


  const handleVideoPlay = () => {
    setIsVideoPlaying(true); 
  };

  if (!isOpen) return null;

  const feedbackColor = feedback.type === 'success' ? 'text-green-600 animate-pulse' : 'text-red-600';
  // !! កែសម្រួល !!: ផ្ដល់អាទិភាពឲ្យ Feedback មុន
  const currentStatus = feedback.message ? feedback.message : detectionStatus;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md" onClick={onClose}>
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-lg p-4 relative" onClick={e => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-600 bg-gray-200 p-2 rounded-full z-20 hover:bg-gray-300">
          <window.appSetup.IconClose />
        </button>
        
        <div className="relative flex justify-center bg-black rounded-xl overflow-hidden mt-10 mb-4">
            <video 
                ref={videoRef} 
                autoPlay 
                muted 
                playsInline 
                onPlay={handleVideoPlay}
                className="w-full h-auto object-cover"
                style={{ transform: 'scaleX(-1)' }} 
            />
            <canvas ref={canvasRef} className="absolute top-0 left-0 w-full h-full" style={{ transform: 'scaleX(-1)' }} />
        </div>

        <div className="text-center h-12">
            <h3 className="text-xl font-bold mb-2">{t.faceScan}</h3>
            <p className={`text-lg font-semibold ${feedback.message ? feedbackColor : 'text-gray-500'}`}>
                {currentStatus}
            </p>
        </div>
      </div>
    </div>
  );
};
// !! END: កែសម្រួល FaceScannerModal !!

window.InfoAlertModal = ({ alertInfo, onClose, t }) => {
  if (!alertInfo.isOpen) return null;
  
  const isError = alertInfo.type === 'error';
  
  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md"
      onClick={onClose} 
    >
      <div
        className="w-full max-w-sm bg-white rounded-2xl shadow-lg p-6 text-center"
        onClick={(e) => e.stopPropagation()} 
      >
        {isError ? <IconAlert /> : <IconCheckCircleFill />}
        
        <h3 className="text-2xl font-bold text-gray-900 mb-2">
          {isError ? t.alertErrorTitle : t.alertSuccessTitle}
        </h3>
        
        <p className="text-gray-600 mb-6" style={{ whiteSpace: 'pre-line' }}>
          {alertInfo.message}
        </p>
        
        <button
          onClick={onClose}
          className="w-full px-8 py-3 rounded-full text-white bg-blue-500 hover:bg-blue-600 font-bold"
        >
          {t.ok}
        </button>
      </div>
    </div>
  );
};

window.InputPromptModal = ({ promptInfo, onSubmit, onCancel, t }) => {
  if (!promptInfo.isOpen) return null;
  
  const [value, setValue] = useState(promptInfo.defaultValue || "");
  
  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(value);
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-sm bg-white rounded-2xl shadow-lg p-6 text-center"
        onClick={(e) => e.stopPropagation()}
      >
        <IconPencilSquare />
        <h3 className="text-2xl font-bold text-gray-900 mb-2">
          {promptInfo.title}
        </h3>
        <p className="text-gray-600 mb-4">{promptInfo.message}</p>
        
        <form onSubmit={handleSubmit}>
          <input 
            type={promptInfo.type || "text"}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg text-center text-lg"
            autoFocus
          />
          <div className="flex justify-center space-x-4 mt-6">
            <button
              type="button"
              onClick={onCancel}
              className="px-6 py-3 rounded-full text-gray-700 bg-gray-200 hover:bg-gray-300 font-bold"
            >
              {t.cancel}
            </button>
            <button
              type="submit"
              className="px-6 py-3 rounded-full text-white bg-blue-500 hover:bg-blue-600 font-bold"
            >
              {t.ok}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

window.PaginationControls = ({ currentPage, totalPages, onNext, onPrev, t }) => {
  if (totalPages <= 1) {
    return null; 
  }

  return (
    <div className="w-full max-w-md mx-auto mt-4 flex justify-between items-center">
      <button
        onClick={onPrev}
        disabled={currentPage === 1}
        className="p-3 rounded-full text-white bg-white/10 transition-colors hover:bg-white/30 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <IconArrowLeft />
      </button>

      <span className="text-lg font-bold text-white">
        {t.paginationPage} {currentPage} / {totalPages}
      </span>

      <button
        onClick={onNext}
        disabled={currentPage === totalPages}
        className="p-3 rounded-full text-white bg-white/10 transition-colors hover:bg-white/30 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <IconArrowRight />
      </button>
    </div>
  );
};
