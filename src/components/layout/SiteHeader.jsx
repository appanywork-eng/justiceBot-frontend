import BrandMark from "../brand/BrandMark.jsx";

export default function SiteHeader({
  onLogoActivate,
  adminActive,
}) {
  return (
    <header className="pd-site-header">
      <div className="pd-container pd-site-header__inner">
        <BrandMark
          onActivate={
            onLogoActivate
          }
        />

        <nav
          className="pd-navigation"
          aria-label="Main navigation"
        >
          <a href="#draft-petition">
            Draft
          </a>

          <a href="#how-it-works">
            How it works
          </a>

          <a href="#supported-issues">
            Issues
          </a>

          <a
            href="/contact"
            className="pd-navigation__support"
          >
            Support
          </a>

          {adminActive && (
            <a
              href="/admin/support"
              className="pd-navigation__admin"
            >
              Inbox
            </a>
          )}
        </nav>
      </div>
    </header>
  );
}
