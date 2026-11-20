import { useEffect, useRef } from 'react';

const CANDIDATE_SELECTOR =
  'main h1, main h2, main h3, main h4, main p, main span, main th, main td, main li, footer p';
const EXCLUDED_ANCESTORS =
  'button, a, label, select, option, input, textarea, [role="dialog"], [data-no-inline-edit], .inline-toolbar';

const ICON_TRASH =
  '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>';
const ICON_IMAGE =
  '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.1-3.1a2 2 0 0 0-2.8 0L6 21"/></svg>';
const ICON_CHECK =
  '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg>';
const ICON_EYE =
  '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/></svg>';

function hashText(input: string) {
  let h = 5381;
  for (let i = 0; i < input.length; i++) h = ((h << 5) + h + input.charCodeAt(i)) | 0;
  return (h >>> 0).toString(36);
}

function makeKey(el: HTMLElement, text: string) {
  return `t_${el.tagName.toLowerCase()}_${hashText(text.trim())}`;
}

function isCandidate(el: HTMLElement) {
  if (el.children.length > 0) return false;
  if (!(el.textContent ?? '').trim()) return false;
  return !el.closest(EXCLUDED_ANCESTORS);
}

/** Replace the rendered text while keeping React's text nodes attached. */
function writeText(el: HTMLElement, value: string) {
  const nodes = Array.from(el.childNodes).filter((n) => n.nodeType === Node.TEXT_NODE);
  if (nodes.length === 0) {
    el.textContent = value;
    return;
  }
  nodes.forEach((n, i) => {
    n.nodeValue = i === 0 ? value : '';
  });
}

interface InlineEditorOptions {
  enabled: boolean;
  texts: Record<string, string>;
  images: Record<string, string>;
  onSetText: (key: string, value: string | null) => void;
  onSetHidden: (key: string, hidden: boolean) => void;
  onSetImage: (key: string, file: File | null) => void;
}

/**
 * Applies saved inline text/image edits for every visitor and, in admin mode,
 * makes leaf text editable with a touch-friendly toolbar (tap to edit).
 */
export function useInlineEditor(options: InlineEditorOptions) {
  const optsRef = useRef(options);
  optsRef.current = options;

  useEffect(() => {
    const { enabled } = options;
    let frame = 0;
    let activeEl: HTMLElement | null = null;

    const toolbar = document.createElement('div');
    toolbar.className = 'inline-toolbar';
    toolbar.setAttribute('contenteditable', 'false');
    toolbar.setAttribute('role', 'toolbar');
    toolbar.setAttribute('aria-label', 'أدوات تعديل النص');
    if (enabled) document.body.appendChild(toolbar);

    const renderToolbar = (el: HTMLElement) => {
      const key = el.dataset.inlineKey ?? '';
      const { texts, images } = optsRef.current;
      const hidden = texts[`${key}_hidden`] === '1';
      const hasImage = Boolean(images[key]);
      toolbar.innerHTML = `
        <button type="button" data-action="done" class="is-primary">${ICON_CHECK}<span>تم</span></button>
        <button type="button" data-action="image">${ICON_IMAGE}<span>${hasImage ? 'تغيير الصورة' : 'صورة'}</span></button>
        ${hasImage ? `<button type="button" data-action="remove-image">${ICON_TRASH}<span>حذف الصورة</span></button>` : ''}
        <button type="button" data-action="${hidden ? 'show' : 'hide'}" class="${hidden ? '' : 'is-danger'}">${hidden ? ICON_EYE : ICON_TRASH}<span>${hidden ? 'إظهار' : 'إخفاء'}</span></button>
      `;
    };

    const positionToolbar = () => {
      if (!activeEl) return;
      const rect = activeEl.getBoundingClientRect();
      const tbRect = toolbar.getBoundingClientRect();
      const top = rect.top + window.scrollY - tbRect.height - 8;
      const left = Math.min(
        Math.max(8, rect.right + window.scrollX - tbRect.width),
        window.scrollX + document.documentElement.clientWidth - tbRect.width - 8
      );
      toolbar.style.top = `${Math.max(window.scrollY + 8, top)}px`;
      toolbar.style.left = `${Math.max(8, left)}px`;
    };

    const openToolbar = (el: HTMLElement) => {
      activeEl = el;
      renderToolbar(el);
      toolbar.classList.add('is-open');
      positionToolbar();
    };

    const closeToolbar = () => {
      toolbar.classList.remove('is-open');
      activeEl = null;
    };

    const syncImage = (el: HTMLElement, url: string | undefined) => {
      const next = el.nextElementSibling as HTMLImageElement | null;
      const existing = next?.classList.contains('admin-inserted-img') ? next : null;
      if (!url) {
        existing?.remove();
        return;
      }
      if (existing) {
        if (existing.getAttribute('src') !== url) existing.src = url;
        return;
      }
      const img = document.createElement('img');
      img.src = url;
      img.alt = '';
      img.loading = 'lazy';
      img.className = 'admin-inserted-img';
      el.after(img);
    };

    const apply = () => {
      frame = 0;
      const { texts, images } = optsRef.current;
      const els = Array.from(document.querySelectorAll<HTMLElement>(CANDIDATE_SELECTOR)).filter(isCandidate);

      for (const el of els) {
        const current = el.textContent ?? '';
        if (
          el.dataset.inlineSource === undefined ||
          (current !== el.dataset.inlineSource && current !== el.dataset.inlineApplied && el !== document.activeElement)
        ) {
          el.dataset.inlineSource = current;
          el.dataset.inlineKey = makeKey(el, current);
          delete el.dataset.inlineApplied;
        }
        const key = el.dataset.inlineKey!;

        const override = texts[key];
        if (override !== undefined && el !== document.activeElement && current !== override) {
          writeText(el, override);
          el.dataset.inlineApplied = override;
        }

        const hidden = texts[`${key}_hidden`] === '1';
        el.classList.toggle('inline-hidden', hidden && !enabled);
        el.classList.toggle('inline-hidden-admin', hidden && enabled);

        syncImage(el, hidden ? undefined : images[key]);

        if (enabled) {
          if (el.contentEditable !== 'true') {
            el.contentEditable = 'true';
            el.spellcheck = false;
            el.classList.add('inline-editable');
          }
        } else if (el.classList.contains('inline-editable')) {
          el.contentEditable = 'inherit';
          el.classList.remove('inline-editable');
        }
      }
    };

    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(apply);
    };

    const commit = (el: HTMLElement) => {
      const key = el.dataset.inlineKey;
      if (!key) return;
      const value = (el.textContent ?? '').trim();
      const source = (el.dataset.inlineSource ?? '').trim();
      if (!value) {
        writeText(el, el.dataset.inlineApplied ?? el.dataset.inlineSource ?? '');
        return;
      }
      if (value === source) {
        optsRef.current.onSetText(key, null);
        delete el.dataset.inlineApplied;
      } else if (value !== el.dataset.inlineApplied) {
        el.dataset.inlineApplied = value;
        optsRef.current.onSetText(key, value);
      }
    };

    const onFocusIn = (e: FocusEvent) => {
      const el = e.target as HTMLElement;
      if (el.classList?.contains('inline-editable')) openToolbar(el);
    };

    const onFocusOut = (e: FocusEvent) => {
      const el = e.target as HTMLElement;
      if (!el.classList?.contains('inline-editable')) return;
      commit(el);
      const next = e.relatedTarget as Node | null;
      if (!next || !toolbar.contains(next)) {
        setTimeout(() => {
          if (document.activeElement !== activeEl && !toolbar.matches(':focus-within')) closeToolbar();
        }, 120);
      }
    };

    const onKeyDown = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement;
      if (!el.classList?.contains('inline-editable')) return;
      if (e.key === 'Enter' && !e.shiftKey && !e.isComposing && e.keyCode !== 229) {
        e.preventDefault();
        el.blur();
      }
      if (e.key === 'Escape') {
        writeText(el, el.dataset.inlineApplied ?? el.dataset.inlineSource ?? '');
        el.blur();
      }
    };

    const onToolbarPointerDown = (e: PointerEvent) => {
      e.preventDefault();
    };

    const onToolbarClick = (e: MouseEvent) => {
      const btn = (e.target as HTMLElement).closest('button');
      const el = activeEl;
      if (!btn || !el) return;
      const key = el.dataset.inlineKey;
      if (!key) return;
      const action = btn.dataset.action;
      const { onSetHidden, onSetImage } = optsRef.current;

      if (action === 'done') {
        el.blur();
        closeToolbar();
      } else if (action === 'hide') {
        commit(el);
        onSetHidden(key, true);
        el.blur();
        closeToolbar();
      } else if (action === 'show') {
        onSetHidden(key, false);
        el.blur();
        closeToolbar();
      } else if (action === 'remove-image') {
        onSetImage(key, null);
        closeToolbar();
      } else if (action === 'image') {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = () => {
          const file = input.files?.item(0);
          if (file) onSetImage(key, file);
        };
        input.click();
        closeToolbar();
      }
    };

    const observer = new MutationObserver(schedule);
    const roots = [document.querySelector('main'), document.querySelector('footer')].filter(Boolean) as Element[];
    roots.forEach((root) => observer.observe(root, { childList: true, subtree: true, characterData: true }));

    apply();

    if (enabled) {
      document.addEventListener('focusin', onFocusIn);
      document.addEventListener('focusout', onFocusOut);
      document.addEventListener('keydown', onKeyDown);
      toolbar.addEventListener('pointerdown', onToolbarPointerDown);
      toolbar.addEventListener('click', onToolbarClick);
      window.addEventListener('resize', positionToolbar);
    }

    return () => {
      observer.disconnect();
      if (frame) cancelAnimationFrame(frame);
      document.removeEventListener('focusin', onFocusIn);
      document.removeEventListener('focusout', onFocusOut);
      document.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('resize', positionToolbar);
      toolbar.remove();
      document.querySelectorAll<HTMLElement>('.inline-editable').forEach((el) => {
        el.contentEditable = 'inherit';
        el.classList.remove('inline-editable');
      });
    };
    // Re-run when saved edits change so overrides are re-applied.
  }, [options.enabled, options.texts, options.images]);
}
