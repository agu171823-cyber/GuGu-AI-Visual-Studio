import { useEffect, useRef } from "react";

export type PreviewImage = {
  src: string;
  alt: string;
};

type Props = {
  image: PreviewImage | null;
  onClose(): void;
};

export function ImagePreviewDialog({ image, onClose }: Props) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!image) return undefined;
    const previouslyFocused = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null;
    closeButtonRef.current?.focus();
    function closeOnEscape(event: KeyboardEvent): void {
      if (event.key === "Escape") onCloseRef.current();
    }
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("keydown", closeOnEscape);
      previouslyFocused?.focus();
    };
  }, [image]);

  if (!image) return null;

  return (
    <div
      className="image-preview-backdrop"
      role="dialog"
      aria-modal="true"
      aria-label="图片预览"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="image-preview-panel">
        <button
          ref={closeButtonRef}
          className="image-preview-close"
          type="button"
          aria-label="关闭图片预览"
          onClick={onClose}
        >
          ×
        </button>
        <img src={image.src} alt={`${image.alt} 大图预览`} />
      </div>
    </div>
  );
}
