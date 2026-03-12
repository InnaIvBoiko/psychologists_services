import { NavLink, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { useAuth } from '../../context/AuthContext.jsx'
import AuthModal from '../AuthModal/AuthModal.jsx'
import NotificationBell from './NotificationBell.jsx'
import styles from './Header.module.css'

export default function Header() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [authModal, setAuthModal] = useState(null) // 'login' | 'register' | null

  const handleLogout = async () => {
    await logout()
    navigate('/')
  }

  return (
    <>
      <header className={styles.header}>
        <div className={`container ${styles.inner}`}>
          <NavLink to="/" className={styles.logo}>
            psychologists<span className={styles.logoDot}>.</span>services
          </NavLink>

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

          <div className={styles.actions}>
            {user ? (
              <>
                <NotificationBell />
                <div className={styles.userInfo}>
                  <div className={styles.avatar}>
                    {user.displayName ? user.displayName[0].toUpperCase() : '?'}
                  </div>
                  <span className={styles.userName}>{user.displayName}</span>
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
        </div>
      </header>

      {authModal && (
        <AuthModal
          mode={authModal}
          onClose={() => setAuthModal(null)}
          onSwitchMode={(m) => setAuthModal(m)}
        />
      )}
    </>
  )
}
