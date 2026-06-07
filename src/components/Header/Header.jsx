import { NavLink, useNavigate } from '@/lib/router'
import { useState, useRef, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { useAuth } from '../../context/AuthContext.jsx'
import { checkIsUserPsychologist } from '@/lib/api'
import AuthModal from '../AuthModal/AuthModal.jsx'
import DeleteAccountModal from '../DeleteAccountModal/DeleteAccountModal.jsx'
import NotificationBell from './NotificationBell.jsx'
import styles from './Header.module.css'

export default function Header() {
  const { user, logout, deleteAccount } = useAuth()
  const navigate = useNavigate()
  const tNav = useTranslations('Nav')
  const t = useTranslations('Header')
  const [authModal, setAuthModal] = useState(null) // 'login' | 'register' | null
  const [menuOpen, setMenuOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [isPsychologist, setIsPsychologist] = useState(false)
  const userMenuRef = useRef(null)

  // Close user dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setUserMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleLogout = async () => {
    await logout()
    setMenuOpen(false)
    setUserMenuOpen(false)
    navigate('/')
  }

  const closeMenu = () => setMenuOpen(false)

  const handleDeleteClick = async () => {
    setUserMenuOpen(false)
    const isDoc = await checkIsUserPsychologist(user.email)
    setIsPsychologist(isDoc)
    setDeleteModalOpen(true)
  }

  return (
    <>
      <header className={styles.header}>
        <div className={`container ${styles.inner}`}>
          <NavLink to="/" className={styles.logo} onClick={closeMenu}>
            psychologists<span className={styles.logoDot}>.</span>services
          </NavLink>

          {/* Desktop nav */}
          <nav className={styles.nav}>
            <NavLink
              to="/"
              end
              className={({ isActive }) =>
                `${styles.navLink} ${isActive ? styles.active : ''}`
              }
            >
              {tNav('home')}
            </NavLink>
            <NavLink
              to="/psychologists"
              className={({ isActive }) =>
                `${styles.navLink} ${isActive ? styles.active : ''}`
              }
            >
              {tNav('psychologists')}
            </NavLink>
            {user && (
              <NavLink
                to="/favorites"
                className={({ isActive }) =>
                  `${styles.navLink} ${isActive ? styles.active : ''}`
                }
              >
                {tNav('favorites')}
              </NavLink>
            )}
            {user?.isAdmin && (
              <NavLink
                to="/admin"
                className={({ isActive }) =>
                  `${styles.navLink} ${isActive ? styles.active : ''}`
                }
              >
                {tNav('admin')}
              </NavLink>
            )}
          </nav>

          {/* Desktop actions */}
          <div className={styles.actions}>
            {user ? (
              <>
                <NotificationBell />
                {/* Avatar + dropdown (delete account only) */}
                <div className={styles.userMenu} ref={userMenuRef}>
                  <button
                    className={styles.avatarBtn}
                    onClick={() => setUserMenuOpen((v) => !v)}
                    aria-label={t('userMenu')}
                    aria-expanded={userMenuOpen}
                  >
                    <div className={styles.avatar}>
                      {user.displayName ? user.displayName[0].toUpperCase() : '?'}
                    </div>
                    <span className={styles.userName}>{user.displayName}</span>
                    <span className={styles.chevron}>{userMenuOpen ? '▴' : '▾'}</span>
                  </button>

                  {userMenuOpen && (
                    <div className={styles.dropdown}>
                      <button
                        className={`${styles.dropdownItem} ${styles.dropdownDanger}`}
                        onClick={handleDeleteClick}
                      >
                        {t('deleteAccount')}
                      </button>
                    </div>
                  )}
                </div>
                <button className="btn btn-ghost" onClick={handleLogout}>
                  {t('logout')}
                </button>
              </>
            ) : (
              <>
                <button className="btn btn-ghost" onClick={() => setAuthModal('login')}>
                  {t('login')}
                </button>
                <button className="btn btn-primary" onClick={() => setAuthModal('register')}>
                  {t('register')}
                </button>
              </>
            )}
          </div>

          {/* Mobile: bell (logged in) + hamburger */}
          <div className={styles.mobileRight}>
            {user && <NotificationBell />}
            <button
              className={styles.hamburger}
              onClick={() => setMenuOpen((v) => !v)}
              aria-label={menuOpen ? t('closeMenu') : t('openMenu')}
              aria-expanded={menuOpen}
            >
              <span className={`${styles.bar} ${menuOpen ? styles.barOpen1 : ''}`} />
              <span className={`${styles.bar} ${menuOpen ? styles.barOpen2 : ''}`} />
              <span className={`${styles.bar} ${menuOpen ? styles.barOpen3 : ''}`} />
            </button>
          </div>
        </div>

        {/* Mobile menu drawer */}
        {menuOpen && (
          <div className={styles.mobileMenu}>
            <nav className={styles.mobileNav}>
              <NavLink
                to="/"
                end
                className={({ isActive }) =>
                  `${styles.mobileNavLink} ${isActive ? styles.active : ''}`
                }
                onClick={closeMenu}
              >
                {tNav('home')}
              </NavLink>
              <NavLink
                to="/psychologists"
                className={({ isActive }) =>
                  `${styles.mobileNavLink} ${isActive ? styles.active : ''}`
                }
                onClick={closeMenu}
              >
                {tNav('psychologists')}
              </NavLink>
              {user && (
                <NavLink
                  to="/favorites"
                  className={({ isActive }) =>
                    `${styles.mobileNavLink} ${isActive ? styles.active : ''}`
                  }
                  onClick={closeMenu}
                >
                  {tNav('favorites')}
                </NavLink>
              )}
              {user?.isAdmin && (
                <NavLink
                  to="/admin"
                  className={({ isActive }) =>
                    `${styles.mobileNavLink} ${isActive ? styles.active : ''}`
                  }
                  onClick={closeMenu}
                >
                  {tNav('admin')}
                </NavLink>
              )}
            </nav>

            <div className={styles.mobileActions}>
              {user ? (
                <>
                  <div className={styles.btnWrap}>
                    <div className={styles.mobileUser}>
                      <div className={styles.avatar}>
                        {user.displayName ? user.displayName[0].toUpperCase() : '?'}
                      </div>
                      <span className={styles.userName}>{user.displayName}</span>
                    </div>
                    <button className="btn btn-ghost" onClick={handleLogout}>
                      {t('logout')}
                    </button>
                  </div>
                  <button
                    className={styles.mobileDeleteBtn}
                    onClick={() => { closeMenu(); handleDeleteClick() }}
                  >
                    {t('deleteAccount')}
                  </button>
                </>
              ) : (
                <div className={styles.btnWrap}>
                  <button
                    className="btn btn-ghost"
                    onClick={() => { setAuthModal('login'); closeMenu() }}
                  >
                    {t('login')}
                  </button>
                  <button
                    className="btn btn-primary"
                    style={{ marginRight: 0 }}
                    onClick={() => { setAuthModal('register'); closeMenu() }}
                  >
                    {t('register')}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </header>

      {authModal && (
        <AuthModal
          mode={authModal}
          onClose={() => setAuthModal(null)}
          onSwitchMode={(m) => setAuthModal(m)}
        />
      )}
      {deleteModalOpen && (
        <DeleteAccountModal
          onClose={() => setDeleteModalOpen(false)}
          isPsychologist={isPsychologist}
          onConfirm={async () => {
            await deleteAccount()
            setDeleteModalOpen(false)
            navigate('/')
          }}
        />
      )}
    </>
  )
}
