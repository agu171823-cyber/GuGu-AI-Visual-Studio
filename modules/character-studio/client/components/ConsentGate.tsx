type Props = {
  adultConsent: boolean;
  rightsConsent: boolean;
  onChange(value: { adultConsent: boolean; rightsConsent: boolean }): void;
};

export function ConsentGate({ adultConsent, rightsConsent, onChange }: Props) {
  return (
    <fieldset className="consent-gate">
      <legend>授权确认</legend>
      <label>
        <input
          type="checkbox"
          checked={adultConsent}
          onChange={(event) => onChange({ adultConsent: event.target.checked, rightsConsent })}
        />
        <span>人物为成年人</span>
      </label>
      <label>
        <input
          type="checkbox"
          checked={rightsConsent}
          onChange={(event) => onChange({ adultConsent, rightsConsent: event.target.checked })}
        />
        <span>我拥有照片或角色设计使用权</span>
      </label>
    </fieldset>
  );
}
