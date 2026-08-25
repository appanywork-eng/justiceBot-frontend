const issues = [
  ["▦", "Banks & finance", "banking-and-financial-complaints"],
  ["⌁", "Telecoms", "telecom-airtime-data-and-network-complaints"],
  ["ϟ", "Power & electricity", "electricity-billing-and-meter-complaints"],
  ["✈", "Aviation", "flight-delay-cancellation-and-refund-complaints"],
  ["+", "Health & public insurance", "hospital-hmo-and-health-insurance-complaints"],
  ["◉", "Insurance", "insurance-policy-and-claim-complaints"],
  ["◷", "Pensions", "pension-and-retirement-benefit-complaints"],
  ["◆", "Education", "school-university-and-examination-complaints"],
  ["◈", "Police & security", "police-security-and-detention-complaints"],
  ["⌂", "Landlord & civil", "tenancy-landlord-and-civil-disputes"],
  ["⚖", "Anti-corruption", "corruption-and-public-procurement-complaints"],
  ["▧", "Public administration", "public-service-and-administrative-complaints"],
  ["§", "Judiciary", "judicial-conduct-and-court-service-complaints"],
  ["◎", "Diaspora & consular", "diaspora-embassy-and-consular-complaints"],
  ["↗", "International escalation", "international-human-rights-escalation"],
  ["▤", "Urban planning", "land-planning-and-building-control-complaints"],
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
            slug,
          ]) => (
            <a
              className="pd-issue-chip"
              href={`/guides/${slug}/`}
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
            </a>
          )
        )}
      </div>
    </section>
  );
}
