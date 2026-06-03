import { useEffect, useRef, useState } from 'react';
import { ShareCard, type ShareCardPool } from './ShareCard';
import { buildShareText } from '../share/shareText';
import {
  canCopyImage,
  copyImageToClipboard,
  downloadPng,
} from '../share/shareImage';
import './ShareModal.css';

interface ShareModalProps {
  url: string;
  live: ShareCardPool;
  pinned?: ShareCardPool;
  onClose: () => void;
}

function poolHasDice(config: ShareCardPool['config']): boolean {
  return config.pool.red + config.pool.black + config.pool.white > 0;
}

export function ShareModal({ url, live, pinned, onClose }: ShareModalProps) {
  const captureRef = useRef<HTMLDivElement>(null);
  const flashTimeoutRef = useRef<number | undefined>(undefined);
  const [feedback, setFeedback] = useState<string>('');

  const hasDice =
    poolHasDice(live.config) || (pinned ? poolHasDice(pinned.config) : false);
  const imageCopyable = canCopyImage();

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  useEffect(() => {
    return () => {
      if (flashTimeoutRef.current !== undefined) {
        window.clearTimeout(flashTimeoutRef.current);
      }
    };
  }, []);

  const flash = (message: string) => {
    setFeedback(message);
    if (flashTimeoutRef.current !== undefined) {
      window.clearTimeout(flashTimeoutRef.current);
    }
    flashTimeoutRef.current = window.setTimeout(() => setFeedback(''), 2000);
  };

  const handleCopyLink = () => {
    navigator.clipboard?.writeText(url).then(
      () => flash('Link copied'),
      () => {}
    );
  };

  const handleCopyText = () => {
    const text = buildShareText({ url, live, pinned });
    navigator.clipboard?.writeText(text).then(
      () => flash('Text copied'),
      () => {}
    );
  };

  const handleCopyImage = async () => {
    if (!captureRef.current) return;
    try {
      await copyImageToClipboard(captureRef.current);
      flash('Image copied');
    } catch {
      flash('Could not copy image — try Download PNG');
    }
  };

  const handleDownload = async () => {
    if (!captureRef.current) return;
    try {
      await downloadPng(captureRef.current, 'legion-roller-card.png');
      flash('Downloaded');
    } catch {
      flash('Could not generate PNG');
    }
  };

  return (
    <div className="share-modal__backdrop" onClick={onClose}>
      <div
        className="share-modal__panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="share-modal-title"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="share-modal__header">
          <h2 id="share-modal-title">Share</h2>
          <button
            type="button"
            className="share-modal__close"
            aria-label="Close"
            onClick={onClose}
          >
            ×
          </button>
        </header>

        <div className="share-modal__preview">
          <ShareCard url={url} live={live} pinned={pinned} />
        </div>

        <div className="share-modal__actions">
          <button type="button" onClick={handleCopyLink}>
            Copy link
          </button>
          <button type="button" onClick={handleCopyText} disabled={!hasDice}>
            Copy text
          </button>
          {imageCopyable && (
            <button type="button" onClick={handleCopyImage} disabled={!hasDice}>
              Copy image
            </button>
          )}
          <button type="button" onClick={handleDownload} disabled={!hasDice}>
            Download PNG
          </button>
        </div>

        {feedback && <p className="share-modal__hint">{feedback}</p>}
        {!hasDice && (
          <p className="share-modal__hint">
            Add dice to share an image or text.
          </p>
        )}

        <div className="share-modal__offscreen" aria-hidden="true">
          <div ref={captureRef}>
            <ShareCard url={url} live={live} pinned={pinned} />
          </div>
        </div>
      </div>
    </div>
  );
}
