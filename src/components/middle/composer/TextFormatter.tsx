import type { MutableRefObject, RefObject } from 'react';
import type { FC } from '../../../lib/teact/teact';
import React, {
  memo, useEffect, useRef, useState,
} from '../../../lib/teact/teact';

import type { ApiMessageEntityTypesDefault } from '../../../api/types';
import type { IAnchorPosition } from '../../../types';
import type { IconName } from '../../../types/icons';
import { ApiMessageEntityTypes } from '../../../api/types';

import buildClassName from '../../../util/buildClassName';
import captureEscKeyListener from '../../../util/captureEscKeyListener';
import { ensureProtocol } from '../../../util/ensureProtocol';
import getKeyFromEvent from '../../../util/getKeyFromEvent';
import stopEvent from '../../../util/stopEvent';
import { getOffsetByRange } from '../helpers/getOffsetByRange';

import useFlag from '../../../hooks/useFlag';
import useLastCallback from '../../../hooks/useLastCallback';
import useOldLang from '../../../hooks/useOldLang';
import useShowTransitionDeprecated from '../../../hooks/useShowTransitionDeprecated';
import useVirtualBackdrop from '../../../hooks/useVirtualBackdrop';

import Icon from '../../common/icons/Icon';
import Button from '../../ui/Button';
import { formattedText } from '../helpers/FormattedText';
import { textHistory } from '../helpers/TextHistory';

import './TextFormatter.scss';

export type OwnProps = {
  selectionOffsetRef: MutableRefObject<{ offset: number; length: number }>;
  inputRef: RefObject<HTMLDivElement>;
  setHtml: (html: string) => void;
  isOpen: boolean;
  anchorPosition?: IAnchorPosition;
  selectedRange?: Range;
  onClose: () => void;
};

type FormatterApiMessageEntityTypes = ApiMessageEntityTypesDefault | ApiMessageEntityTypes.TextUrl | ApiMessageEntityTypes.Blockquote;
type ISelectedTextFormats = { [key in FormatterApiMessageEntityTypes]?: boolean };
type Formats = { type: FormatterApiMessageEntityTypes; text: string }[];

const TextFormatter: FC<OwnProps> = ({
  selectionOffsetRef,
  inputRef,
  setHtml,
  isOpen,
  anchorPosition,
  selectedRange,
  onClose,
}) => {
  const formats: Formats = [
    { type: ApiMessageEntityTypes.Bold, text: 'Bold' },
    { type: ApiMessageEntityTypes.Italic, text: 'Italic' },
    { type: ApiMessageEntityTypes.Underline, text: 'Underlined' },
    { type: ApiMessageEntityTypes.Strike, text: 'Strikethrough' },
    { type: ApiMessageEntityTypes.Code, text: 'Monospace' },
    { type: ApiMessageEntityTypes.Spoiler, text: 'Spoiler' },
    { type: ApiMessageEntityTypes.Blockquote, text: 'Quote' },
  ];
  // eslint-disable-next-line no-null/no-null
  const containerRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line no-null/no-null
  const linkUrlInputRef = useRef<HTMLInputElement>(null);
  const { shouldRender, transitionClassNames } = useShowTransitionDeprecated(isOpen);
  const [isLinkControlOpen, openLinkControl, closeLinkControl] = useFlag();
  const [linkUrl, setLinkUrl] = useState('');
  const [isEditingLink, setIsEditingLink] = useState(false);
  const [inputClassName, setInputClassName] = useState<string | undefined>();
  const [selectedTextFormats, setSelectedTextFormats] = useState<ISelectedTextFormats>({});

  useEffect(() => (isOpen ? captureEscKeyListener(onClose) : undefined), [isOpen, onClose]);
  useVirtualBackdrop(
    isOpen,
    containerRef,
    onClose,
    true,
    undefined,
    false,
  );

  useEffect(() => {
    if (isLinkControlOpen) {
      linkUrlInputRef.current!.focus();
    } else {
      setLinkUrl('');
      setIsEditingLink(false);
    }
  }, [isLinkControlOpen]);

  useEffect(() => {
    if (!shouldRender) {
      closeLinkControl();
      setSelectedTextFormats({});
      setInputClassName(undefined);
    }
  }, [closeLinkControl, shouldRender]);

  useEffect(() => {
    if (!isOpen || !selectedRange) {
      return;
    }

    const { offset, length } = getOffsetByRange(inputRef.current, selectedRange);
    const types = formattedText?.getActiveTypes({ offset, length });

    if (types) {
      const fs = types.reduce((accumulator, current) => {
        if (current.type === ApiMessageEntityTypes.TextUrl) {
          setLinkUrl(current.url);
        }
        return { ...accumulator, [current.type]: true };
      }, {});
      setSelectedTextFormats(fs);
    }
  }, [isOpen, selectedRange, openLinkControl]);

  function updateInputStyles() {
    const input = linkUrlInputRef.current;
    if (!input) {
      return;
    }

    const { offsetWidth, scrollWidth, scrollLeft } = input;
    if (scrollWidth <= offsetWidth) {
      setInputClassName(undefined);
      return;
    }

    let className = '';
    if (scrollLeft < scrollWidth - offsetWidth) {
      className = 'mask-right';
    }
    if (scrollLeft > 0) {
      className += ' mask-left';
    }

    setInputClassName(className);
  }

  function handleLinkUrlChange(e: React.ChangeEvent<HTMLInputElement>) {
    setLinkUrl(e.target.value);
    updateInputStyles();
  }

  function getFormatButtonClassName(key: keyof ISelectedTextFormats) {
    return selectedTextFormats[key] ? 'active' : undefined;
  }

  const handleChangeFormat = useLastCallback((type: FormatterApiMessageEntityTypes) => {
    if (!selectedRange) {
      return;
    }

    const isActive = selectedTextFormats[type];

    const { offset, length } = getOffsetByRange(inputRef.current, selectedRange);
    selectionOffsetRef.current = { offset, length };

    const { entities, text } = formattedText;

    if (type === ApiMessageEntityTypes.TextUrl) {
      const url = linkUrl ? (ensureProtocol(linkUrl) || '').split('%').map(encodeURI).join('%') : linkUrl;
      formattedText.recalculateEntities({
        type, offset, length, url,
      }, !isActive);
    } else {
      formattedText.recalculateEntities({ type, offset, length }, !isActive);
    }

    textHistory.add(formattedText, { entities, text });
    formattedText.skipUpdate = true;
    const html = formattedText.getHtml();
    setHtml(html);

    setSelectedTextFormats((selectedFormats) => ({
      ...selectedFormats,
      [type]: !isActive,
    }));
  });

  const handleKeyDown = useLastCallback((e: KeyboardEvent) => {
    const HANDLERS_BY_KEY: Record<string, AnyToVoidFunction> = {
      k: openLinkControl,
      b: () => handleChangeFormat(ApiMessageEntityTypes.Bold),
      u: () => handleChangeFormat(ApiMessageEntityTypes.Underline),
      i: () => handleChangeFormat(ApiMessageEntityTypes.Italic),
      m: () => handleChangeFormat(ApiMessageEntityTypes.Code),
      s: () => handleChangeFormat(ApiMessageEntityTypes.Strike),
      p: () => handleChangeFormat(ApiMessageEntityTypes.Spoiler),
      '.': () => handleChangeFormat(ApiMessageEntityTypes.Blockquote),
    };

    const handler = HANDLERS_BY_KEY[getKeyFromEvent(e)];

    if (e.altKey || !(e.ctrlKey || e.metaKey) || !handler) {
      return;
    }

    e.preventDefault();
    e.stopPropagation();
    handler();
  });

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleKeyDown]);

  const lang = useOldLang();

  function handleContainerKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    if (e.key === 'Enter' && isLinkControlOpen) {
      handleChangeFormat(ApiMessageEntityTypes.TextUrl);
      e.preventDefault();
    }
  }

  if (!shouldRender) {
    return undefined;
  }

  const className = buildClassName(
    'TextFormatter',
    transitionClassNames,
    isLinkControlOpen && 'link-control-shown',
  );

  const linkUrlConfirmClassName = buildClassName(
    'TextFormatter-link-url-confirm',
    Boolean(linkUrl.length) && 'shown',
  );

  const style = anchorPosition
    ? `left: ${anchorPosition.x}px; top: ${anchorPosition.y}px;--text-formatter-left: ${anchorPosition.x}px;`
    : '';

  return (
    <div
      ref={containerRef}
      className={className}
      style={style}
      onKeyDown={handleContainerKeyDown}
      // Prevents focus loss when clicking on the toolbar
      onMouseDown={stopEvent}
    >
      <div className="TextFormatter-buttons">
        {formats.map((format) => (
          <Button
            key={format.type}
            color="translucent"
            ariaLabel={`${format.text} text`}
            className={getFormatButtonClassName(format.type)}
            onClick={() => handleChangeFormat(format.type)}
          >
            <Icon name={format.text.toLowerCase() as IconName} />
          </Button>
        ))}
        <div className="TextFormatter-divider" />
        <Button
          color="translucent"
          ariaLabel={lang('TextFormat.AddLinkTitle')}
          className={getFormatButtonClassName(ApiMessageEntityTypes.TextUrl)}
          onClick={openLinkControl}
        >
          <Icon name="link" />
        </Button>
      </div>

      <div className="TextFormatter-link-control">
        <div className="TextFormatter-buttons">
          <Button
            color="translucent"
            ariaLabel={lang('Cancel')}
            onClick={closeLinkControl}
          >
            <Icon name="arrow-left" />
          </Button>
          <div className="TextFormatter-divider" />

          <div
            className={buildClassName('TextFormatter-link-url-input-wrapper', inputClassName)}
          >
            <input
              ref={linkUrlInputRef}
              className="TextFormatter-link-url-input"
              type="text"
              value={linkUrl}
              placeholder="Enter URL..."
              autoComplete="off"
              inputMode="url"
              dir="auto"
              onChange={handleLinkUrlChange}
              onScroll={updateInputStyles}
            />
          </div>

          <div className={linkUrlConfirmClassName}>
            <div className="TextFormatter-divider" />
            <Button
              color="translucent"
              ariaLabel={lang('Save')}
              className="color-primary"
              onClick={() => handleChangeFormat(ApiMessageEntityTypes.TextUrl)}
            >
              <Icon name="check" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default memo(TextFormatter);
