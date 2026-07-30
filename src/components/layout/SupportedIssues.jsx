const issues = [
  ["▦", "Banks & finance"],
  ["⌁", "Telecoms"],
  ["ϟ", "Power & utilities"],
  ["✈", "Aviation"],
  ["+", "Health & insurance"],
  ["◆", "Education"],
  ["◈", "Police & security"],
  ["⌂", "Landlord & civil"],
  ["⚖", "Anti-corruption"],
  ["◎", "Diaspora & consular"],
];

export default function SupportedIssues() {
  return (
    <section
      id="supported-issues"
      className="pd-section pd-supported"
    >
      <div className="pd-compact-heading">
        <div>
          <span className="pd-eyebrow">
            Supported issues
          </span>

          <h2>
            Find the right route
          </h2>
        </div>

        <p>
          Guidance only. Outcomes are not guaranteed.
        </p>
      </div>

      <div className="pd-issue-grid">
        {issues.map(
          ([
            icon,
            label,
          ]) => (
            <div
              className="pd-issue-chip"
              key={
                label
              }
            >
              <span aria-hidden="true">
                {
                  icon
                }
              </span>

              {
                label
              }
            </div>
          )
        )}
      </div>
    </section>
  );
}
