import { NavLink, useNavigate } from 'react-router-dom'
import { useState, useRef, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext.jsx'
import { checkIsUserPsychologist } from '../../strapi/strapi.js'
import AuthModal from '../AuthModal/AuthModal.jsx'
import DeleteAccountModal from '../DeleteAccountModal/DeleteAccountModal.jsx'
import NotificationBell from './NotificationBell.jsx'
import styles from './Header.module.css'

export default function Header() {
  const { user, logout, deleteAccount } = useAuth()
  const navigate = useNavigate()
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
              Home
            </NavLink>
            <NavLink
              to="/psychologists"
              className={({ isActive }) =>
                `${styles.navLink} ${isActive ? styles.active : ''}`
              }
            >
              Psychologists
            </NavLink>
            {user && (
              <NavLink
                to="/favorites"
                className={({ isActive }) =>
                  `${styles.navLink} ${isActive ? styles.active : ''}`
                }
              >
                Favorites
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
                    aria-label="User menu"
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
                        Delete account
                      </button>
                    </div>
                  )}
                </div>
                <button className="btn btn-ghost" onClick={handleLogout}>
                  Log out
                </button>
              </>
            ) : (
              <>
                <button className="btn btn-ghost" onClick={() => setAuthModal('login')}>
                  Log In
                </button>
                <button className="btn btn-primary" onClick={() => setAuthModal('register')}>
                  Registration
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
              aria-label={menuOpen ? 'Close menu' : 'Open menu'}
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
                Home
              </NavLink>
              <NavLink
                to="/psychologists"
                className={({ isActive }) =>
                  `${styles.mobileNavLink} ${isActive ? styles.active : ''}`
                }
                onClick={closeMenu}
              >
                Psychologists
              </NavLink>
              {user && (
                <NavLink
                  to="/favorites"
                  className={({ isActive }) =>
                    `${styles.mobileNavLink} ${isActive ? styles.active : ''}`
                  }
                  onClick={closeMenu}
                >
                  Favorites
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
                      Log out
                    </button>
                  </div>
                  <button
                    className={styles.mobileDeleteBtn}
                    onClick={() => { closeMenu(); handleDeleteClick() }}
                  >
                    Delete account
                  </button>
                </>
              ) : (
                <div className={styles.btnWrap}>
                  <button
                    className="btn btn-ghost"
                    onClick={() => { setAuthModal('login'); closeMenu() }}
                  >
                    Log In
                  </button>
                  <button
                    className="btn btn-primary"
                    style={{ marginRight: 0 }}
                    onClick={() => { setAuthModal('register'); closeMenu() }}
                  >
                    Registration
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
