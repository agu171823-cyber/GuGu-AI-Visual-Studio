import { useEffect, useState } from "react";
import type { PreviewImage } from "./ImagePreviewDialog";

type Props = {
  file: File;
  alt: string;
  onOpen(image: PreviewImage): void;
};

export function ReferenceThumbnail({ file, alt, onOpen }: Props) {
  const [src, setSrc] = useState("");

  useEffect(() => {
    const objectUrl = URL.createObjectURL(file);
    setSrc(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [file]);

  if (!src) {
    return <span className="reference-thumbnail reference-thumbnail-loading" aria-hidden="true" />;
  }

  return (
    <button
      className="reference-thumbnail"
      type="button"
      aria-label={`放大查看${alt}`}
      onClick={() => onOpen({ src, alt })}
    >
      <img src={src} alt={alt} />
    </button>
  );
}
