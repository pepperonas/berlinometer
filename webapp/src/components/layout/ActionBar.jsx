import './ActionBar.css'

/**
 * ActionBar Component
 * Sticky top navigation bar with hamburger menu and branding
 *
 * @param {Function} onMenuClick - Callback when hamburger menu is clicked
 * @param {boolean} showLoginButton - Whether to show login button (for logged-out users)
 * @param {boolean} showMenuButton - Whether to show hamburger menu button (for logged-in users)
 * @param {Function} onLoginClick - Callback when login button is clicked
 */
function ActionBar({ onMenuClick, showLoginButton = false, showMenuButton = false, onLoginClick }) {
  return (
    <header className="action-bar">
      <div className="action-bar__container">
        {/* Left: Hamburger Menu (only for logged-in users) */}
        {showMenuButton ? (
          <button
            className="action-bar__menu-button"
            onClick={onMenuClick}
            aria-label="Menü öffnen"
            type="button"
          >
            <span className="action-bar__hamburger">
              <span></span>
              <span></span>
              <span></span>
            </span>
          </button>
        ) : (
          <div className="action-bar__spacer"></div>
        )}

        {/* Center: Logo/Title */}
        <div className="action-bar__brand">
          <span className="action-bar__logo">🍷</span>
          <h1 className="action-bar__title">Berlinometer</h1>
        </div>

        {/* Right: Login Button (only if not logged in) */}
        {showLoginButton && (
          <button
            className="action-bar__login-button btn btn-primary"
            onClick={onLoginClick}
            type="button"
          >
            <span className="action-bar__login-text">Login</span>
          </button>
        )}

        {/* Spacer when no login button to keep brand centered */}
        {!showLoginButton && <div className="action-bar__spacer"></div>}
      </div>
    </header>
  )
}

export default ActionBar
