// =================================================================
// 5. SETTINGS PAGE COMPONENT
// =================================================================

// --- Component សម្រាប់ Page "Settings" ទាំងមូល ---
const SettingsPage = ({ 
  t, language, setLanguage, background, setBackground,
  checkInMode, onEditCheckInMode, onEditPassword,
  passesInUse, totalPasses, onEditTotalPasses,
  overtimeLimit, onEditOvertimeLimit, // !! ថ្មី !!
  passPrefix, onEditPassPrefix, passStartNumber, onEditPassStartNumber, // !! ថ្មី !!
  appBranch // !! ថ្មី !!
}) => {
  
  // ទាញ Icons ពី Global Scope
  const { 
    IconLanguage, IconPalette, IconLock, IconTicket, IconSettings,
    backgroundStyles, IconTimer // !! ថ្មី !!: បន្ថែម IconTimer
  } = window.appSetup;

  return (
    <div key="settings-page" className="pb-10 text-white">
      <h2 className="text-3xl font-bold text-center mb-6">{t.settingsTitle}</h2>

      {/* --- 1. គ្រប់គ្រងកាត --- */}
      <SettingCard title={t.passCardManagement} icon={<IconTicket />}>
        <PassesInfoSetting
          t={t}
          passesInUse={passesInUse}
          totalPasses={totalPasses}
          onEditTotal={onEditTotalPasses}
          passPrefix={passPrefix} // !! ថ្មី !!
          onEditPassPrefix={onEditPassPrefix} // !! ថ្មី !!
          passStartNumber={passStartNumber} // !! ថ្មី !!
          onEditPassStartNumber={onEditPassStartNumber} // !! ថ្មី !!
          appBranch={appBranch} // !! ថ្មី !!
        />
      </SettingCard>

      {/* --- !! ថ្មី !!: 2. ការកំណត់លើសម៉ោង --- */}
      <SettingCard title={t.overtimeSettings} icon={<IconTimer />}>
        <OvertimeLimitSetting
          t={t}
          overtimeLimit={overtimeLimit}
          onEditOvertimeLimit={onEditOvertimeLimit}
        />
      </SettingCard>

      {/* --- 3. សុវត្ថិភាព --- */}
      <SettingCard title={t.security} icon={<IconLock />}>
        <button
          onClick={onEditPassword}
          className="w-full px-4 py-3 text-left text-lg font-semibold text-gray-800 bg-gray-100 hover:bg-gray-200 rounded-lg"
        >
          {t.changePassword}
        </button>
        
        <CheckInModeSetting
          t={t}
          checkInMode={checkInMode}
          onEditCheckInMode={onEditCheckInMode}
        />
      </SettingCard>

      {/* --- 4. ភាសា --- */}
      <SettingCard title={t.language} icon={<IconLanguage />}>
        <div className="flex space-x-2">
          <button
            onClick={() => setLanguage('km')}
            className={`w-1/2 py-3 rounded-lg font-bold ${language === 'km' ? 'bg-white text-blue-800' : 'bg-white/20 text-white'}`}
          >
            ខ្មែរ (KM)
          </button>
          <button
            onClick={() => setLanguage('en')}
            className={`w-1/2 py-3 rounded-lg font-bold ${language === 'en' ? 'bg-white text-blue-800' : 'bg-white/20 text-white'}`}
          >
            English (EN)
          </button>
        </div>
      </SettingCard>
      
      {/* --- 5. ផ្ទៃខាងក្រោយ --- */}
      <SettingCard title={t.background} icon={<IconPalette />}>
        <div className="grid grid-cols-2 gap-4">
          {Object.keys(backgroundStyles).map(key => (
            <button
              key={key}
              onClick={() => setBackground(key)}
              className={`h-20 rounded-lg ${backgroundStyles[key]} ${background === key ? 'ring-4 ring-white' : 'opacity-70'}`}
            >
              <span className="bg-black/20 px-2 py-1 rounded-full text-xs">{key}</span>
            </button>
          ))}
        </div>
      </SettingCard>

    </div>
  );
};

// --- Component តូចៗ សម្រាប់ Settings ---
const SettingCard = ({ title, icon, children }) => (
  <div className="w-full max-w-md mx-auto bg-white/10 backdrop-blur-lg rounded-3xl shadow-xl p-6 mb-6">
    <div className="flex items-center mb-4">
      <div className="p-2 bg-white/20 rounded-full">
        {icon}
      </div>
      <h3 className="text-xl font-bold ml-4">{title}</h3>
    </div>
    <div className="space-y-4">
      {children}
    </div>
  </div>
);

// --- Component សម្រាប់ បង្ហាញព័ត៌មានកាត ---
// !! ថ្មី !!: បន្ថែម Props សម្រាប់ Prefix និង Start Number
const PassesInfoSetting = ({ 
  t, passesInUse, totalPasses, onEditTotal,
  passPrefix, onEditPassPrefix, passStartNumber, onEditPassStartNumber,
  appBranch // !! ថ្មី !!
}) => {
  const { IconPencil, IconType, IconHash } = window.appSetup;
  const passesAvailable = totalPasses - passesInUse;

  return (
    <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-lg p-6">
      
      {/* !! ថ្មី !!: បង្ហាញ App Branch */}
      <div className="text-center mb-4">
        <span className="bg-blue-800 text-white text-sm font-bold px-3 py-1 rounded-full">
          {t.settingsForBranch} "{appBranch}"
        </span>
      </div>

      <div className="flex justify-around text-white text-center">
        <div className="text-center">
          <p className="text-4xl font-bold text-red-300">{passesInUse}</p>
          <p className="text-lg text-blue-200">{t.passesInUse}</p>
        </div>
        <div className="text-center">
          <p className="text-4xl font-bold text-green-300">{passesAvailable}</p>
          <p className="text-lg text-blue-200">{t.passesAvailable}</p>
        </div>
        <div className="text-center">
          <p className="text-4xl font-bold">{totalPasses}</p>
          <p className="text-lg text-blue-200">{t.passTotal}</p>
        </div>
      </div>
      
      {/* !! ថ្មី !!: បង្ហាញ Prefix និង Start Number */}
      <div className="flex justify-around text-white text-center mt-6 pt-4 border-t border-white/20">
        <div className="text-center">
          <p className="text-3xl font-bold">{passPrefix}</p>
          <p className="text-sm text-blue-200">{t.passPrefix}</p>
        </div>
        <div className="text-center">
          <p className="text-3xl font-bold">{passStartNumber}</p>
          <p className="text-sm text-blue-200">{t.passStartNumber}</p>
        </div>
      </div>

      <div className="mt-6 border-t border-white/20 pt-4 space-y-3">
        <button
          onClick={onEditTotal}
          className="flex items-center justify-center w-full px-4 py-3 rounded-full text-lg text-white font-bold transition-all shadow-lg bg-blue-500 hover:bg-blue-600"
        >
          <IconPencil />
          {t.editPassTotal}
        </button>
        
        {/* !! ថ្មី !!: ប៊ូតុងកែសម្រួល Prefix */}
        <button
          onClick={onEditPassPrefix}
          className="flex items-center justify-center w-full px-4 py-3 rounded-full text-lg text-white font-bold transition-all shadow-lg bg-blue-500 hover:bg-blue-600"
        >
          <IconType className="w-5 h-5 ml-2" />
          {t.editPassPrefix}
        </button>

        {/* !! ថ្មី !!: ប៊ូតុងកែសម្រួល Start Number */}
        <button
          onClick={onEditPassStartNumber}
          className="flex items-center justify-center w-full px-4 py-3 rounded-full text-lg text-white font-bold transition-all shadow-lg bg-blue-500 hover:bg-blue-600"
        >
          <IconHash className="w-5 h-5 ml-2" />
          {t.editPassStartNumber}
        </button>
      </div>
    </div>
  );
};

// --- !! ថ្មី !!: Component សម្រាប់ កំណត់នាទីលើសម៉ោង ---
const OvertimeLimitSetting = ({ t, overtimeLimit, onEditOvertimeLimit }) => {
  const { IconPencil } = window.appSetup;

  return (
    <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-lg p-6 text-center">
      <p className="text-lg text-blue-200 mb-2">{t.overtimeLimit}</p>
      <p className="text-6xl font-bold text-white mb-4">
        {overtimeLimit} 
        <span className="text-3xl ml-2">{t.minutes}</span>
      </p>
      <button
        onClick={onEditOvertimeLimit}
        className="flex items-center justify-center w-full px-4 py-3 rounded-full text-lg text-white font-bold transition-all shadow-lg bg-blue-500 hover:bg-blue-600"
      >
        <IconPencil />
        {t.overtimeLimit}
      </button>
    </div>
  );
};


// --- Component សម្រាប់ ប្ដូររបៀប Check-in ---
const CheckInModeSetting = ({ t, checkInMode, onEditCheckInMode }) => {
  const { IconCheckIn, IconCheckOut } = window.appSetup;
  
  return (
    <div className="mt-4">
      <p className="text-sm text-blue-200 mb-2">{t.checkInMethod}</p>
      {checkInMode === 'scan' ? (
        <button 
          onClick={onEditCheckInMode}
          className="flex items-center justify-center w-full px-4 py-3 rounded-full text-lg text-white font-bold transition-all shadow-lg bg-blue-500 hover:bg-blue-600"
        >
          <IconCheckIn className="w-6 h-6 mr-2" />
          {t.checkInMethodScan}
        </button>
      ) : (
        <button 
          onClick={onEditCheckInMode}
          className="flex items-center justify-center w-full px-4 py-3 rounded-full text-lg text-white font-bold transition-all shadow-lg bg-green-500 hover:bg-green-600"
        >
          <IconCheckOut className="w-6 h-6 mr-2" />
          {t.checkInMethodAuto}
        </button>
      )}
    </div>
  );
};


// ភ្ជាប់ទៅ Global Scope
window.SettingsPage = SettingsPage;
