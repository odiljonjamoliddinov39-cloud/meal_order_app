import { Outlet, Link, useLocation } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';

const STORAGE_LANG_KEY = 'meal_app_lang_v2';

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
    menu: 'Меню',
    settings: 'Настройки',
    account: 'Аккаунт',
    cart: 'Корзина',
    orders: 'Заказы',
    language: 'Язык',
    save: 'Сохранить',
    close: 'Закрыть',
    profile: 'Профиль',
    telegramName: 'Имя в Telegram',
    username: 'Имя пользователя',
    telegramId: 'Telegram ID',
    noUsername: 'Нет username',
    noPhoto: 'Нет фото',
    themeHint: 'Настройки мини-приложения',
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
    noUsername: 'Username yo‘q',
    noPhoto: 'Rasm yo‘q',
    themeHint: 'Mini ilova sozlamalari',
  },
};

function getTelegramUser() {
  if (typeof window === 'undefined') return null;
  return window.Telegram?.WebApp?.initDataUnsafe?.user || null;
}

function readLanguage() {
  try {
    return localStorage.getItem(STORAGE_LANG_KEY) || 'ENG';
  } catch {
    return 'ENG';
  }
}

function writeLanguage(lang) {
  localStorage.setItem(STORAGE_LANG_KEY, lang);
}

export default function CustomerLayout() {
  const location = useLocation();
  const [language, setLanguage] = useState(readLanguage());
  const [menuOpen, setMenuOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);

  const user = useMemo(() => getTelegramUser(), []);
  const t = translations[language] || translations.ENG;

  useEffect(() => {
    if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
      window.Telegram.WebApp.ready();
      window.Telegram.WebApp.expand();
    }
  }, []);

  useEffect(() => {
    writeLanguage(language);
    window.dispatchEvent(new CustomEvent('meal-language-changed', { detail: language }));
  }, [language]);

  useEffect(() => {
    setMenuOpen(false);
    setSettingsOpen(false);
    setAccountOpen(false);
  }, [location.pathname]);

  return (
    <div style={styles.shell}>
      <div style={styles.phone}>
        <div style={styles.topBar}>
          <button style={styles.iconButton} onClick={() => setMenuOpen((v) => !v)}>
            ☰
          </button>

          <div style={styles.brandBlock}>
            <div style={styles.brandTitle}>BrunchOrder</div>
            <div style={styles.brandSub}>{t.themeHint}</div>
          </div>

          <button style={styles.accountButton} onClick={() => setAccountOpen(true)}>
            {user?.photo_url ? (
              <img src={user.photo_url} alt="profile" style={styles.accountImage} />
            ) : (
              <span style={styles.accountFallback}>👤</span>
            )}
          </button>
        </div>

        {menuOpen ? (
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
        ) : null}

        <div style={styles.outletWrap}>
          <Outlet context={{ language, t, user }} />
        </div>

        {settingsOpen ? (
          <div style={styles.modalOverlay} onClick={() => setSettingsOpen(false)}>
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

              <div style={styles.modalActions}>
                <button style={styles.modalPrimary} onClick={() => setSettingsOpen(false)}>
                  {t.save}
                </button>
                <button style={styles.modalSecondary} onClick={() => setSettingsOpen(false)}>
                  {t.close}
                </button>
              </div>
            </div>
          </div>
        ) : null}

        {accountOpen ? (
          <div style={styles.modalOverlay} onClick={() => setAccountOpen(false)}>
            <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
              <div style={styles.modalTitle}>{t.account}</div>

              <div style={styles.profileCard}>
                {user?.photo_url ? (
                  <img src={user.photo_url} alt="profile" style={styles.profileImage} />
                ) : (
                  <div style={styles.profileFallback}>{t.noPhoto}</div>
                )}

                <div style={styles.profileRows}>
                  <div style={styles.profileRow}>
                    <span style={styles.profileKey}>{t.telegramName}</span>
                    <strong style={styles.profileVal}>
                      {[user?.first_name, user?.last_name].filter(Boolean).join(' ') || 'Demo Customer'}
                    </strong>
                  </div>

                  <div style={styles.profileRow}>
                    <span style={styles.profileKey}>{t.username}</span>
                    <strong style={styles.profileVal}>
                      {user?.username ? `@${user.username}` : t.noUsername}
                    </strong>
                  </div>

                  <div style={styles.profileRow}>
                    <span style={styles.profileKey}>{t.telegramId}</span>
                    <strong style={styles.profileVal}>{user?.id || '123456789'}</strong>
                  </div>
                </div>
              </div>

              <div style={styles.modalActions}>
                <button style={styles.modalPrimary} onClick={() => setAccountOpen(false)}>
                  {t.close}
                </button>
              </div>
            </div>
          </div>
        ) : null}
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
    fontFamily: 'Inter, system-ui, sans-serif',
  },
  phone: {
    width: '100%',
    maxWidth: '430px',
    height: '100vh',
    maxHeight: '900px',
    background: 'linear-gradient(180deg, #79e4e8 0%, #57d6df 100%)',
    borderRadius: '34px',
    boxShadow: '0 24px 60px rgba(0,0,0,0.18)',
    padding: '16px 16px 14px',
    position: 'relative',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
  },
  topBar: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '12px',
    position: 'relative',
    zIndex: 5,
  },
  iconButton: {
    width: '44px',
    height: '44px',
    borderRadius: '14px',
    border: 'none',
    background: 'rgba(255,255,255,0.6)',
    fontSize: '20px',
    fontWeight: 800,
    color: '#0f5a65',
    cursor: 'pointer',
  },
  brandBlock: {
    flex: 1,
    minWidth: 0,
  },
  brandTitle: {
    fontWeight: 800,
    color: '#0f5a65',
    fontSize: '18px',
  },
  brandSub: {
    color: '#2a7a84',
    fontWeight: 600,
    fontSize: '12px',
  },
  accountButton: {
    width: '44px',
    height: '44px',
    borderRadius: '50%',
    border: 'none',
    background: '#ffffff',
    overflow: 'hidden',
    padding: 0,
    cursor: 'pointer',
    boxShadow: '0 8px 18px rgba(0,0,0,0.10)',
  },
  accountImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  accountFallback: {
    display: 'grid',
    placeItems: 'center',
    width: '100%',
    height: '100%',
    fontSize: '20px',
  },
  dropdown: {
    position: 'absolute',
    top: '68px',
    left: '16px',
    width: '180px',
    background: '#ffffff',
    borderRadius: '18px',
    boxShadow: '0 16px 28px rgba(0,0,0,0.14)',
    padding: '8px',
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    zIndex: 20,
  },
  dropdownLink: {
    textDecoration: 'none',
    color: '#125963',
    fontWeight: 700,
    padding: '12px 14px',
    borderRadius: '12px',
    background: '#f6fdfe',
  },
  dropdownAction: {
    border: 'none',
    background: '#eefbfd',
    color: '#125963',
    fontWeight: 700,
    padding: '12px 14px',
    borderRadius: '12px',
    textAlign: 'left',
    cursor: 'pointer',
  },
  outletWrap: {
    flex: 1,
    minHeight: 0,
    display: 'flex',
    flexDirection: 'column',
  },
  modalOverlay: {
    position: 'absolute',
    inset: 0,
    background: 'rgba(0,0,0,0.22)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '18px',
    zIndex: 40,
  },
  modal: {
    width: '100%',
    background: '#ffffff',
    borderRadius: '24px',
    padding: '18px',
    boxShadow: '0 18px 40px rgba(0,0,0,0.18)',
  },
  modalTitle: {
    fontWeight: 800,
    color: '#105760',
    fontSize: '20px',
    marginBottom: '14px',
  },
  modalLabel: {
    color: '#4f7f87',
    fontWeight: 700,
    fontSize: '13px',
    marginBottom: '10px',
  },
  langRow: {
    display: 'flex',
    gap: '8px',
    marginBottom: '18px',
  },
  langChip: {
    flex: 1,
    border: 'none',
    borderRadius: '14px',
    padding: '12px 10px',
    background: '#eefbfd',
    color: '#145962',
    fontWeight: 800,
    cursor: 'pointer',
  },
  langChipActive: {
    background: '#1a93f1',
    color: '#ffffff',
  },
  modalActions: {
    display: 'flex',
    gap: '10px',
  },
  modalPrimary: {
    flex: 1,
    border: 'none',
    borderRadius: '16px',
    padding: '13px',
    background: '#1a93f1',
    color: '#fff',
    fontWeight: 800,
    cursor: 'pointer',
  },
  modalSecondary: {
    flex: 1,
    border: 'none',
    borderRadius: '16px',
    padding: '13px',
    background: '#eefbfd',
    color: '#145962',
    fontWeight: 800,
    cursor: 'pointer',
  },
  profileCard: {
    display: 'flex',
    gap: '14px',
    alignItems: 'flex-start',
    background: '#f8feff',
    borderRadius: '18px',
    padding: '14px',
    marginBottom: '16px',
  },
  profileImage: {
    width: '72px',
    height: '72px',
    borderRadius: '18px',
    objectFit: 'cover',
    flexShrink: 0,
  },
  profileFallback: {
    width: '72px',
    height: '72px',
    borderRadius: '18px',
    background: '#eefbfd',
    display: 'grid',
    placeItems: 'center',
    textAlign: 'center',
    color: '#4f7f87',
    fontWeight: 700,
    fontSize: '12px',
    padding: '6px',
    flexShrink: 0,
  },
  profileRows: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    minWidth: 0,
  },
  profileRow: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  profileKey: {
    color: '#6b9097',
    fontSize: '12px',
    fontWeight: 700,
  },
  profileVal: {
    color: '#105760',
    fontSize: '14px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
};