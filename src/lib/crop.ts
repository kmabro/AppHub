export type CropArea = { x: number; y: number; width: number; height: number };

export async function getCroppedFile(
  imageSrc: string,
  area: CropArea,
  fileName: string,
  mime: string
): Promise<File> {
  const image = new Image();
  image.src = imageSrc;
  await new Promise<void>((resolve, reject) => {
    if (image.complete) return resolve();
    image.onload = () => resolve();
    image.onerror = () => reject(new Error("Could not read that image"));
  });

  const scaleX = image.naturalWidth / image.width;
  const scaleY = image.naturalHeight / image.height;
  const sourceWidth = area.width * scaleX;
  const sourceHeight = area.height * scaleY;
  const reduction = Math.min(1, 1600 / Math.max(sourceWidth, sourceHeight));

  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(sourceWidth * reduction));
  canvas.height = Math.max(1, Math.round(sourceHeight * reduction));

  const context = canvas.getContext("2d");
  if (!context) throw new Error("Image editing is not supported in this browser");
  context.drawImage(
    image,
    area.x * scaleX,
    area.y * scaleY,
    sourceWidth,
    sourceHeight,
    0,
    0,
    canvas.width,
    canvas.height
  );

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (result) => (result ? resolve(result) : reject(new Error("Could not crop that image"))),
      mime,
      0.92
    );
  });

  return new File([blob], fileName, { type: mime });
}
