"use client";

import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import { motion, AnimatePresence, Reorder } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  X,
  Upload,
  Trash2,
  ArrowUp,
  ArrowDown,
  Star,
  Download,
  Edit3,
  ImageIcon,
} from "lucide-react";
import { cn, downloadFile } from "@/lib/utils";
import { ConfirmModal } from "@/components/ui/ConfirmModal";

export interface GalleryImage {
  id: string;
  url: string;
  file?: File;
  name?: string;
  originalUrl?: string;
  originalName?: string;
}

interface ProductImageGalleryProps {
  images: GalleryImage[];
  onImagesChange?: (images: GalleryImage[]) => void;
  onCurrentImageChange?: (index: number) => void;
  editable?: boolean;
  productName?: string;
  aspectRatio?: string;
  className?: string;
  showDownload?: boolean;
}

function getFileName(image: GalleryImage, index: number, productName?: string) {
  if (image.name) return image.name;
  if (image.file) return image.file.name;
  try {
    const url = new URL(image.url);
    const path = url.pathname;
    const segments = path.split("/").filter(Boolean);
    const last = segments[segments.length - 1];
    if (last) return decodeURIComponent(last);
  } catch {}
  const base = productName ? productName.replace(/[^a-z0-9]/gi, "_") : "imagen";
  return `${base}_${index + 1}.jpg`;
}

export function ProductImageGallery({
  images,
  onImagesChange,
  onCurrentImageChange,
  editable = false,
  productName = "producto",
  aspectRatio = "1 / 1",
  className,
  showDownload = false,
}: ProductImageGalleryProps) {
  const [current, setCurrent] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const mainRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const replaceRef = useRef<HTMLInputElement>(null);
  const [replaceTargetId, setReplaceTargetId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteName, setDeleteName] = useState("");

  useEffect(() => {
    onCurrentImageChange?.(current);
  }, [current, onCurrentImageChange]);

  const urls = useMemo(() => images.map((i) => i.url), [images]);

  useEffect(() => {
    setCurrent((prev) => Math.min(prev, Math.max(0, images.length - 1)));
  }, [images.length]);

  const goNext = useCallback(
    () => setCurrent((i) => (i + 1) % images.length),
    [images.length],
  );
  const goPrev = useCallback(
    () => setCurrent((i) => (i - 1 + images.length) % images.length),
    [images.length],
  );

  // Keyboard navigation
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!lightboxOpen) return;
      if (e.key === "Escape") setLightboxOpen(false);
      if (e.key === "ArrowLeft") goPrev();
      if (e.key === "ArrowRight") goNext();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightboxOpen, goNext, goPrev]);

  const notify = useCallback(
    (next: GalleryImage[]) => {
      onImagesChange?.(next);
    },
    [onImagesChange],
  );

  const handleMainSwipe = useCallback(
    (_: any, info: { offset: { x: number } }) => {
      if (images.length <= 1) return;
      if (info.offset.x < -40) goNext();
      else if (info.offset.x > 40) goPrev();
    },
    [goNext, goPrev, images.length],
  );

  const addFiles = (files: FileList | null) => {
    if (!files) return;
    const imageFiles = Array.from(files).filter((f) =>
      f.type.startsWith("image/"),
    );
    if (imageFiles.length === 0) return;
    const newItems: GalleryImage[] = imageFiles.map((file) => ({
      id: `new-${crypto.randomUUID ? crypto.randomUUID() : Date.now() + Math.random()}`,
      url: URL.createObjectURL(file),
      file,
      name: file.name,
    }));
    const next = [...images, ...newItems];
    notify(next);
    setCurrent(next.length - newItems.length);
  };

  const removeImage = (id: string) => {
    const next = images.filter((i) => i.id !== id);
    notify(next);
  };

  const setMain = (index: number) => {
    if (index === 0) return;
    const arr = [...images];
    const [selected] = arr.splice(index, 1);
    arr.unshift(selected);
    notify(arr);
    setCurrent(0);
  };

  const handleReorder = (next: GalleryImage[]) => {
    notify(next);
    setCurrent((prev) => {
      const id = images[prev]?.id;
      if (!id) return 0;
      return Math.max(
        0,
        next.findIndex((i) => i.id === id),
      );
    });
  };

  const replaceImage = (id: string, file: File) => {
    const index = images.findIndex((i) => i.id === id);
    if (index < 0) return;
    const next = [...images];
    next[index] = {
      ...next[index],
      url: URL.createObjectURL(file),
      file,
      name: file.name,
    };
    notify(next);
    setCurrent(index);
  };

  const updateName = (id: string, name: string) => {
    const index = images.findIndex((i) => i.id === id);
    if (index < 0) return;
    const next = [...images];
    const item = next[index];
    const originalName =
      item.originalName || getFileName(item, index, productName);
    next[index] = {
      ...item,
      name,
      originalUrl: item.originalUrl || item.url,
      originalName,
    };
    notify(next);
    setRenamingId(null);
  };

  const moveImage = (id: string, direction: -1 | 1) => {
    const index = images.findIndex((i) => i.id === id);
    if (index < 0) return;
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= images.length) return;
    const next = [...images];
    [next[index], next[newIndex]] = [next[newIndex], next[index]];
    handleReorder(next);
  };

  const askDelete = (id: string) => {
    const index = images.findIndex((i) => i.id === id);
    if (index < 0) return;
    setDeleteId(id);
    setDeleteName(getFileName(images[index], index, productName));
  };

  const executeDelete = () => {
    if (deleteId) removeImage(deleteId);
    setDeleteId(null);
    setDeleteName("");
  };

  const currentImage = images[current];
  const currentName = currentImage
    ? getFileName(currentImage, current, productName)
    : "";

  if (editable) {
    return (
      <div className={cn("space-y-4", className)}>
        {/* Compact cover preview */}
        {currentImage ? (
          <div
            className="group relative mx-auto max-w-md overflow-hidden rounded-2xl border border-border bg-white p-3 shadow-sm"
            style={{ maxHeight: "260px" }}
          >
            <div className="flex h-full items-center justify-center">
              <img
                src={currentImage.url}
                alt={productName}
                className="max-h-[220px] w-auto object-contain"
              />
            </div>
            <div className="absolute right-3 top-3 rounded-full bg-black/50 px-2 py-0.5 text-[11px] font-medium text-white">
              {current + 1} / {images.length}
            </div>
          </div>
        ) : null}

        {/* Add images button */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="flex items-center gap-1.5 rounded-xl border border-border bg-white px-4 py-2.5 text-sm font-semibold text-foreground shadow-sm transition-all hover:bg-gray-50"
          >
            <Upload className="h-4 w-4" /> Agregar imágenes
          </button>
          <input
            ref={fileRef}
            type="file"
            multiple
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              addFiles(e.target.files);
              e.currentTarget.value = "";
            }}
          />
        </div>

        {/* Image management grid */}
        {images.length > 0 && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {images.map((img, idx) => (
              <div
                key={img.id}
                className="group relative rounded-xl border border-border bg-white p-2 shadow-sm transition-all hover:shadow-md"
              >
                <button
                  type="button"
                  onClick={() => setCurrent(idx)}
                  className="relative block h-28 w-full overflow-hidden rounded-lg bg-gray-50"
                >
                  <img
                    src={img.url}
                    alt=""
                    className="h-full w-full object-contain p-1"
                  />
                  {idx === 0 && (
                    <span className="absolute left-1.5 top-1.5 rounded-full bg-primary px-1.5 py-0.5 text-[9px] font-bold text-white">
                      PORTADA
                    </span>
                  )}
                </button>

                <p className="mt-2 truncate px-1 text-xs font-medium text-foreground">
                  {getFileName(img, idx, productName)}
                </p>

                {/* Controls */}
                <div className="mt-2 flex flex-wrap items-center justify-center gap-1">
                  <button
                    type="button"
                    onClick={() => setMain(idx)}
                    disabled={idx === 0}
                    className="rounded-lg p-1.5 text-amber-500 transition-colors hover:bg-amber-50 disabled:opacity-40"
                    title={idx === 0 ? "Portada actual" : "Establecer portada"}
                  >
                    <Star className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setRenamingId(img.id)}
                    className="rounded-lg p-1.5 text-foreground transition-colors hover:bg-muted"
                    title="Renombrar"
                  >
                    <Edit3 className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setReplaceTargetId(img.id);
                      replaceRef.current?.click();
                    }}
                    className="rounded-lg p-1.5 text-foreground transition-colors hover:bg-muted"
                    title="Reemplazar"
                  >
                    <Upload className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      downloadFile(img.url, getFileName(img, idx, productName))
                    }
                    className="rounded-lg p-1.5 text-foreground transition-colors hover:bg-muted"
                    title="Descargar"
                  >
                    <Download className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => moveImage(img.id, -1)}
                    disabled={idx === 0}
                    className="rounded-lg p-1.5 text-foreground transition-colors hover:bg-muted disabled:opacity-40"
                    title="Mover arriba"
                  >
                    <ArrowUp className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => moveImage(img.id, 1)}
                    disabled={idx === images.length - 1}
                    className="rounded-lg p-1.5 text-foreground transition-colors hover:bg-muted disabled:opacity-40"
                    title="Mover abajo"
                  >
                    <ArrowDown className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => askDelete(img.id)}
                    className="rounded-lg p-1.5 text-red-500 transition-colors hover:bg-red-50"
                    title="Eliminar"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <input
          ref={replaceRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file && replaceTargetId) {
              replaceImage(replaceTargetId, file);
            }
            e.currentTarget.value = "";
            setReplaceTargetId(null);
          }}
        />

        {/* Rename modal */}
        {renamingId && (
          <RenameModal
            initial={(() => {
              const idx = images.findIndex((i) => i.id === renamingId);
              const img = images[idx];
              return img ? getFileName(img, idx, productName) : "";
            })()}
            onSave={(name) => updateName(renamingId, name)}
            onCancel={() => setRenamingId(null)}
          />
        )}

        <ConfirmModal
          open={!!deleteId}
          title="¿Eliminar imagen?"
          message={`¿Estás seguro de que deseas eliminar "${deleteName}"? Esta acción no se puede deshacer.`}
          confirmLabel="Eliminar"
          onConfirm={executeDelete}
          onCancel={() => setDeleteId(null)}
        />
      </div>
    );
  }

  if (images.length === 0 && !editable) {
    return (
      <div
        className={cn(
          "flex items-center justify-center rounded-2xl border border-border bg-muted/30",
          className,
        )}
        style={{ aspectRatio }}
      >
        <ImageIcon className="h-12 w-12 text-muted-foreground/30" />
      </div>
    );
  }

  return (
    <div className={cn("space-y-3", className)}>
      {/* Main image */}
      <div
        ref={mainRef}
        className={cn(
          "group relative overflow-hidden rounded-2xl border border-border bg-white shadow-sm",
          images.length > 0 ? "cursor-zoom-in" : "",
        )}
        style={{ aspectRatio }}
        onClick={() => images.length > 0 && setLightboxOpen(true)}
      >
        {currentImage ? (
          <AnimatePresence initial={false} mode="wait">
            <motion.img
              key={currentImage.url}
              src={currentImage.url}
              alt={productName}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.18 }}
              drag={images.length > 1 ? "x" : false}
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.15}
              onDragEnd={handleMainSwipe}
              className="h-full w-full object-contain p-4 sm:p-6"
            />
          </AnimatePresence>
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-2">
            <ImageIcon className="h-10 w-10 text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground">Sin imágenes</p>
          </div>
        )}

        {images.length > 0 && (
          <>
            <div className="absolute bottom-3 right-3 flex items-center gap-1 rounded-full bg-black/50 px-2.5 py-1 text-[11px] font-medium text-white opacity-0 transition-opacity group-hover:opacity-100">
              <ZoomIn className="h-3 w-3" /> Ampliar
            </div>

            {images.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    goPrev();
                  }}
                  className="absolute left-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-foreground shadow-md opacity-0 transition-all hover:scale-110 group-hover:opacity-100 sm:left-3"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    goNext();
                  }}
                  className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-foreground shadow-md opacity-0 transition-all hover:scale-110 group-hover:opacity-100 sm:right-3"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>

                <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 items-center gap-1.5">
                  {images.map((_, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setCurrent(i);
                      }}
                      className={cn(
                        "h-1.5 rounded-full transition-all",
                        i === current
                          ? "w-5 bg-primary"
                          : "w-1.5 bg-black/20 hover:bg-black/40",
                      )}
                    />
                  ))}
                </div>

                <div className="absolute right-3 top-3 rounded-full bg-black/50 px-2 py-0.5 text-[11px] font-medium text-white opacity-0 transition-opacity group-hover:opacity-100">
                  {current + 1} / {images.length}
                </div>
              </>
            )}

            {editable && (
              <div className="absolute left-3 top-3 flex gap-1.5 opacity-0 transition-opacity group-hover:opacity-100">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    downloadFile(currentImage.url, currentName);
                  }}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-foreground shadow-sm hover:bg-white"
                  title="Descargar imagen"
                >
                  <Download className="h-4 w-4" />
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Thumbnails */}
      {images.length > 0 && (
        <div className="flex items-center gap-2">
          <div className="flex flex-1 gap-2 overflow-x-auto pb-1 scrollbar-none">
            {editable ? (
              <Reorder.Group
                axis="x"
                values={images}
                onReorder={handleReorder}
                className="flex gap-2"
              >
                {images.map((img, idx) => (
                  <Reorder.Item
                    key={img.id}
                    value={img}
                    onDragStart={() => setDraggingId(img.id)}
                    onDragEnd={() => setDraggingId(null)}
                    whileDrag={{ scale: 1.05, zIndex: 50 }}
                    className={cn(
                      "relative h-[68px] w-[68px] shrink-0 cursor-move overflow-hidden rounded-xl border-2 bg-white transition-all sm:h-20 sm:w-20",
                      idx === current
                        ? "border-primary shadow-sm ring-2 ring-primary/20"
                        : "border-border opacity-70 hover:opacity-100",
                      draggingId === img.id && "opacity-60",
                    )}
                  >
                    <button
                      type="button"
                      onClick={() => setCurrent(idx)}
                      className="h-full w-full"
                    >
                      <img
                        src={img.url}
                        alt=""
                        className="h-full w-full object-contain p-1"
                      />
                    </button>
                    {idx === 0 && (
                      <span className="absolute left-1 top-1 rounded-full bg-primary px-1 py-0.5 text-[8px] font-bold text-white">
                        PORTADA
                      </span>
                    )}
                  </Reorder.Item>
                ))}
              </Reorder.Group>
            ) : (
              images.map((img, idx) => (
                <button
                  key={img.id}
                  type="button"
                  onClick={() => setCurrent(idx)}
                  className={cn(
                    "relative h-[68px] w-[68px] shrink-0 overflow-hidden rounded-xl border-2 bg-white transition-all sm:h-20 sm:w-20",
                    idx === current
                      ? "border-primary shadow-sm ring-2 ring-primary/20"
                      : "border-border opacity-70 hover:opacity-100",
                  )}
                >
                  <img
                    src={img.url}
                    alt=""
                    className="h-full w-full object-contain p-1"
                  />
                </button>
              ))
            )}
          </div>
        </div>
      )}

      {/* Admin toolbar */}
      {editable && (
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="flex items-center gap-1.5 rounded-xl border border-border bg-white px-3 py-2 text-xs font-semibold text-foreground shadow-sm transition-all hover:bg-gray-50"
          >
            <Upload className="h-3.5 w-3.5" /> Agregar imágenes
          </button>
          <input
            ref={fileRef}
            type="file"
            multiple
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              addFiles(e.target.files);
              e.currentTarget.value = "";
            }}
          />

          {currentImage && current > 0 && (
            <button
              type="button"
              onClick={() => setMain(current)}
              className="flex items-center gap-1.5 rounded-xl border border-primary/30 bg-primary/5 px-3 py-2 text-xs font-semibold text-primary transition-all hover:bg-primary/10"
            >
              <Star className="h-3.5 w-3.5" /> Establecer portada
            </button>
          )}

          {currentImage && (
            <>
              <button
                type="button"
                onClick={() => setRenamingId(currentImage.id)}
                className="flex items-center gap-1.5 rounded-xl border border-border bg-white px-3 py-2 text-xs font-semibold text-foreground shadow-sm transition-all hover:bg-gray-50"
              >
                <Edit3 className="h-3.5 w-3.5" /> Renombrar
              </button>
              <button
                type="button"
                onClick={() => {
                  setReplaceTargetId(currentImage.id);
                  replaceRef.current?.click();
                }}
                className="flex items-center gap-1.5 rounded-xl border border-border bg-white px-3 py-2 text-xs font-semibold text-foreground shadow-sm transition-all hover:bg-gray-50"
              >
                <Upload className="h-3.5 w-3.5" /> Reemplazar
              </button>
              <button
                type="button"
                onClick={() => removeImage(currentImage.id)}
                className="ml-auto flex items-center gap-1.5 rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-xs font-semibold text-red-600 transition-all hover:bg-red-100"
              >
                <Trash2 className="h-3.5 w-3.5" /> Eliminar
              </button>
              <input
                ref={replaceRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file && replaceTargetId) {
                    replaceImage(replaceTargetId, file);
                  }
                  e.currentTarget.value = "";
                  setReplaceTargetId(null);
                }}
              />
            </>
          )}
        </div>
      )}

      {/* Rename modal */}
      {renamingId && currentImage && (
        <RenameModal
          initial={getFileName(currentImage, current, productName)}
          onSave={(name) => updateName(renamingId, name)}
          onCancel={() => setRenamingId(null)}
        />
      )}

      {/* Lightbox */}
      <AnimatePresence>
        {lightboxOpen && currentImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setLightboxOpen(false)}
            className="fixed inset-0 z-[9999] flex cursor-zoom-out flex-col items-center justify-center bg-black/95 p-4"
          >
            <button
              type="button"
              onClick={() => setLightboxOpen(false)}
              className="absolute right-4 top-4 rounded-full bg-white/20 p-2.5 text-white backdrop-blur-sm transition-colors hover:bg-white/30 sm:right-6 sm:top-6"
            >
              <X className="h-6 w-6" />
            </button>

            <motion.img
              key={currentImage.url}
              src={currentImage.url}
              alt={productName}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              drag={images.length > 1 ? "x" : false}
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.15}
              onDragEnd={(_, info) => {
                if (images.length <= 1) return;
                if (info.offset.x < -60) goNext();
                else if (info.offset.x > 60) goPrev();
              }}
              onClick={(e) => e.stopPropagation()}
              className="max-h-[80vh] max-w-[90vw] select-none rounded-xl object-contain"
            />

            {images.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    goPrev();
                  }}
                  className="absolute left-3 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-sm transition-colors hover:bg-white/30 sm:left-6"
                >
                  <ChevronLeft className="h-6 w-6" />
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    goNext();
                  }}
                  className="absolute right-3 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-sm transition-colors hover:bg-white/30 sm:right-6"
                >
                  <ChevronRight className="h-6 w-6" />
                </button>

                <div className="absolute bottom-6 left-1/2 flex -translate-x-1/2 items-center gap-2">
                  {images.map((_, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setCurrent(i);
                      }}
                      className={cn(
                        "h-1.5 rounded-full transition-all",
                        i === current
                          ? "w-6 bg-white"
                          : "w-1.5 bg-white/40 hover:bg-white/70",
                      )}
                    />
                  ))}
                </div>
                <div className="absolute bottom-6 right-6 text-sm font-medium text-white/70">
                  {current + 1} / {images.length}
                </div>
              </>
            )}

            {showDownload && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  downloadFile(currentImage.url, currentName);
                }}
                className="absolute bottom-6 left-6 flex items-center gap-2 rounded-full bg-white/20 px-4 py-2 text-sm font-medium text-white backdrop-blur-sm transition-colors hover:bg-white/30"
              >
                <Download className="h-4 w-4" /> Descargar
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function RenameModal({
  initial,
  onSave,
  onCancel,
}: {
  initial: string;
  onSave: (name: string) => void;
  onCancel: () => void;
}) {
  const [value, setValue] = useState(initial);
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    ref.current?.focus();
    ref.current?.select();
  }, []);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div
        className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-bold text-foreground">Renombrar imagen</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Nombre del archivo al guardar o descargar.
        </p>
        <input
          ref={ref}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") onSave(value.trim() || initial);
            if (e.key === "Escape") onCancel();
          }}
          className="mt-4 w-full rounded-xl border border-border px-4 py-3 text-sm outline-none focus:border-primary"
        />
        <div className="mt-5 flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-xl border border-border px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => onSave(value.trim() || initial)}
            className="rounded-xl bg-primary px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary/90"
          >
            Guardar
          </button>
        </div>
      </div>
    </div>
  );
}
