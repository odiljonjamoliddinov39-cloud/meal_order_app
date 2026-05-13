import { Outlet, Link, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import {
  getTelegramDisplayName,
  getTelegramUser,
  initTelegramWebApp,
  waitForTelegramUser,
} from '../api/telegramAuth.js';

const STORAGE_LANG_KEY = 'meal_app_lang_v2';
const DEFAULT_LANGUAGE = 'UZB';

const translations = {
  ENG: {
    menu: 'Menu',
    settings: 'Settings',
    account: 'Account',
    cart: 'Cart',
    orders: 'Orders',
    language: 'Language',
    save: 'Save',
    close: 'Close',
    profile: 'Profile',
    telegramName: 'Telegram Name',
    username: 'Username',
    telegramId: 'Telegram ID',
    noUsername: 'No username',
    noPhoto: 'No Photo',
    themeHint: 'Mini app settings',
  },
  RUS: {
    menu: 'Menu',
    settings: 'Settings',
    account: 'Account',
    cart: 'Cart',
    orders: 'Orders',
    language: 'Language',
    save: 'Save',
    close: 'Close',
    profile: 'Profile',
    telegramName: 'Telegram name',
    username: 'Username',
    telegramId: 'Telegram ID',
    noUsername: 'No username',
    noPhoto: 'No photo',
    themeHint: 'Mini app settings',
  },
  UZB: {
    menu: 'Menyu',
    settings: 'Sozlamalar',
    account: 'Akkaunt',
    cart: 'Savat',
    orders: 'Buyurtmalar',
    language: 'Til',
    save: 'Saqlash',
    close: 'Yopish',
    profile: 'Profil',
    telegramName: 'Telegram nomi',
    username: 'Username',
    telegramId: 'Telegram ID',
    noUsername: "Username yo'q",
    noPhoto: "Rasm yo'q",
    themeHint: 'Mini ilova sozlamalari',
  },
};

function readLanguage() {
  try {
    return localStorage.getItem(STORAGE_LANG_KEY) || DEFAULT_LANGUAGE;
  } catch {
    return DEFAULT_LANGUAGE;
  }
}

function writeLanguage(lang) {
  try {
    localStorage.setItem(STORAGE_LANG_KEY, lang);
  } catch {
    // Telegram WebViews can deny storage on some older devices.
  }
}

export default function CustomerLayout() {
  const location = useLocation();

  const [language, setLanguage] = useState(readLanguage());
  const [menuOpen, setMenuOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [user, setUser] = useState(() => getTelegramUser());

  const t = translations[language] || translations[DEFAULT_LANGUAGE];

  useEffect(() => {
    let mounted = true;

    initTelegramWebApp();

    waitForTelegramUser().then((telegramUser) => {
      if (mounted && telegramUser) setUser(telegramUser);
    });

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    writeLanguage(language);
  }, [language]);

  useEffect(() => {
    setMenuOpen(false);
    setSettingsOpen(false);
    setAccountOpen(false);
  }, [location.pathname]);

  function closeAll() {
    setMenuOpen(false);
    setSettingsOpen(false);
    setAccountOpen(false);
  }

  return (
    <div style={styles.shell}>
      <div style={styles.phone}>

        {/* TOP BAR */}
        <div style={styles.topBar}>
          <button style={styles.iconButton} onClick={() => setMenuOpen(v => !v)}>
            ?
          </button>

          <div style={styles.brandBlock}>
            <div style={styles.brandTitle}>BrunchOrder</div>
            <div style={styles.brandSub}>{t.themeHint}</div>
          </div>

          <button style={styles.accountButton} onClick={() => setAccountOpen(true)}>
            {user?.photo_url ? (
              <img src={user.photo_url} alt="profile" style={styles.accountImage} />
            ) : (
              <span style={styles.accountFallback}>??</span>
            )}
          </button>
        </div>

        {/* DROPDOWN MENU */}
        {menuOpen && (
          <div style={styles.dropdown}>
            <Link to="/web" style={styles.dropdownLink}>{t.menu}</Link>
            <Link to="/web/cart" style={styles.dropdownLink}>{t.cart}</Link>
            <Link to="/web/orders" style={styles.dropdownLink}>{t.orders}</Link>

            <button
              style={styles.dropdownAction}
              onClick={() => {
                setMenuOpen(false);
                setSettingsOpen(true);
              }}
            >
              {t.settings}
            </button>
          </div>
        )}

        {/* MAIN */}
        <div style={styles.outletWrap}>
          <Outlet context={{ language, t, user }} />
        </div>

        {/* SETTINGS */}
        {settingsOpen && (
          <div style={styles.modalOverlay} onClick={closeAll}>
            <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
              <div style={styles.modalTitle}>{t.settings}</div>

              <div style={styles.modalLabel}>{t.language}</div>

              <div style={styles.langRow}>
                {['ENG', 'RUS', 'UZB'].map((lang) => (
                  <button
                    key={lang}
                    onClick={() => setLanguage(lang)}
                    style={{
                      ...styles.langChip,
                      ...(language === lang ? styles.langChipActive : {}),
                    }}
                  >
                    {lang}
                  </button>
                ))}
              </div>

              <button style={styles.modalPrimary} onClick={closeAll}>
                {t.save}
              </button>
            </div>
          </div>
        )}

        {/* ACCOUNT */}
        {accountOpen && (
          <div style={styles.modalOverlay} onClick={closeAll}>
            <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
              <div style={styles.modalTitle}>{t.account}</div>

              <div style={styles.profileCard}>
                {user?.photo_url ? (
                  <img src={user.photo_url} style={styles.profileImage} />
                ) : (
                  <div style={styles.profileFallback}>{t.noPhoto}</div>
                )}

                <div style={styles.profileRows}>
                  <div>
                    <span>{t.telegramName}</span>
                    <strong>
                      {getTelegramDisplayName(user) || '-'}
                    </strong>
                  </div>

                  <div>
                    <span>{t.username}</span>
                    <strong>
                      {user?.username ? `@${user.username}` : t.noUsername}
                    </strong>
                  </div>

                  <div>
                    <span>{t.telegramId}</span>
                    <strong>{user?.id || '-'}</strong>
                  </div>
                </div>
              </div>

              <button style={styles.modalPrimary} onClick={closeAll}>
                {t.close}
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

const styles = {
  shell: {
    minHeight: '100vh',
    background: 'linear-gradient(180deg, #8be9ea 0%, #59d9e0 100%)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '12px',
  },

  phone: {
    width: '100%',
    maxWidth: '430px',
    height: '100vh',
    maxHeight: '900px',
    background: 'linear-gradient(180deg, #79e4e8 0%, #57d6df 100%)',
    borderRadius: '34px',
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
    position: 'relative',
  },

  topBar: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '12px',
  },

  iconButton: {
    width: '44px',
    height: '44px',
    borderRadius: '14px',
    border: 'none',
    background: 'rgba(255,255,255,0.6)',
    fontSize: '20px',
    cursor: 'pointer',
  },

  brandBlock: { flex: 1 },
  brandTitle: { fontWeight: 800 },
  brandSub: { fontSize: '12px' },

  accountButton: {
    width: '44px',
    height: '44px',
    borderRadius: '50%',
    background: '#fff',
    overflow: 'hidden',
    border: 'none',
  },

  accountImage: { width: '100%', height: '100%', objectFit: 'cover' },
  accountFallback: { display: 'grid', placeItems: 'center', height: '100%' },

  dropdown: {
    position: 'absolute',
    top: '68px',
    left: '16px',
    background: '#ffffff',
    borderRadius: '18px',
    padding: '8px',
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    minWidth: '180px',
    boxShadow: '0 12px 28px rgba(0,0,0,0.14)',
    zIndex: 50,
  },

  dropdownLink: {
    textDecoration: 'none',
    color: '#145962',
    fontWeight: 700,
    fontSize: '15px',
    padding: '10px 12px',
    borderRadius: '12px',
    background: '#f7fbfc',
    display: 'block',
  },

  dropdownAction: {
    border: 'none',
    background: '#eefbfd',
    color: '#145962',
    fontWeight: 700,
    fontSize: '15px',
    padding: '10px 12px',
    borderRadius: '12px',
    textAlign: 'left',
    cursor: 'pointer',
    width: '100%',
  },

  outletWrap: { flex: 1, display: 'flex', flexDirection: 'column' },

  modalOverlay: {
    position: 'absolute',
    inset: 0,
    background: 'rgba(0,0,0,0.2)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },

  modal: {
    background: '#fff',
    padding: '18px',
    borderRadius: '20px',
    width: '100%',
  },

  modalPrimary: {
    marginTop: '10px',
    width: '100%',
    padding: '12px',
    borderRadius: '12px',
    border: 'none',
    background: '#1a93f1',
    color: '#fff',
    fontWeight: 800,
  },
};
