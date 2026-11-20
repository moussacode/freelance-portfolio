'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { ImageUp } from 'lucide-react';

const TYPES = ['image/png', 'image/jpeg', 'image/webp'];
const MAX = 2 * 1024 * 1024;

/**
 * Choix d'une image : glisser-déposer, coller (Ctrl+V) ou parcourir.
 * L'image n'est PAS envoyée ici : on renvoie le fichier et un aperçu local (blob:),
 * l'envoi se fait au moment d'« Enregistrer ». Le serveur revérifie le type réel et la taille.
 */
export function ImagePicker({
  preview,
  onPick,
  label = 'Image',
}: {
  preview: string | null;
  onPick: (file: File, preview: string) => void;
  label?: string;
}) {
  const id = useId();
  const input = useRef<HTMLInputElement>(null);
  const zone = useRef<HTMLDivElement>(null);
  const [over, setOver] = useState(false);
  const [error, setError] = useState('');

  const take = (file: File | undefined | null) => {
    if (!file) return;
    if (!TYPES.includes(file.type)) return setError('PNG, JPEG ou WebP uniquement (pas de SVG).');
    if (file.size > MAX) return setError('Image trop lourde : 2 Mo maximum.');
    setError('');
    onPick(file, URL.createObjectURL(file));
  };

  // Coller une image (Ctrl+V) pendant que le panneau est ouvert, hors champ de texte.
  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target?.closest('input, textarea') && target !== zone.current) return;
      const file = [...(e.clipboardData?.files ?? [])].find((f) => f.type.startsWith('image/'));
      if (file) {
        e.preventDefault();
        take(file);
      }
    };
    document.addEventListener('paste', onPaste);
    return () => document.removeEventListener('paste', onPaste);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="adm-picker-wrap">
      <div
        ref={zone}
        className="adm-picker"
        data-over={over || undefined}
        onDragOver={(e) => {
          e.preventDefault();
          setOver(true);
        }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setOver(false);
          take(e.dataTransfer.files?.[0]);
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {preview && <img className="adm-picker__img" src={preview} alt="" />}
        <div className="adm-picker__text">
          <ImageUp aria-hidden="true" />
          <p>
            <strong>Déposez l’image ici</strong>
            <br />
            ou collez-la (Ctrl + V) · PNG, JPEG, WebP · 2 Mo maximum
          </p>
          <button type="button" className="btn btn--small" onClick={() => input.current?.click()} aria-describedby={`${id}-err`}>
            {preview ? 'Choisir une autre image' : 'Choisir une image'}
          </button>
        </div>
        <input
          ref={input}
          type="file"
          accept={TYPES.join(',')}
          hidden
          aria-label={label}
          onChange={(e) => {
            take(e.target.files?.[0]);
            e.target.value = '';
          }}
        />
      </div>
      <p id={`${id}-err`} className="adm-help" role={error ? 'alert' : undefined}>
        {error && (
          <span className="adm-error adm-error--inline">
            <span className="adm-error__badge" aria-hidden="true" />
            {error}
          </span>
        )}
      </p>
    </div>
  );
}
