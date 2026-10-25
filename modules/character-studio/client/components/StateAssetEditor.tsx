type Props = {
  title: string;
  description: string;
  value: string;
  placeholder: string;
  buttonLabel: string;
  generating: boolean;
  onChange(value: string): void;
  onGenerate(): void;
};

export function StateAssetEditor({
  title,
  description,
  value,
  placeholder,
  buttonLabel,
  generating,
  onChange,
  onGenerate,
}: Props) {
  return (
    <section className="state-editor" aria-label={title}>
      <div>
        <p className="kicker">ONE VARIABLE / CHILD STATE</p>
        <h3>{title}</h3>
        <p>{description}</p>
      </div>
      <label>
        <span>本次唯一变化</span>
        <input
          value={value}
          placeholder={placeholder}
          onChange={(event) => onChange(event.target.value)}
        />
      </label>
      <button
        className="primary-action"
        type="button"
        disabled={!value.trim() || generating}
        onClick={onGenerate}
      >
        {generating ? "正在生成…" : buttonLabel}<b aria-hidden="true">↗</b>
      </button>
    </section>
  );
}
