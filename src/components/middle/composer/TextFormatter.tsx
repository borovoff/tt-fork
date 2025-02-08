import type { FC } from '../../../lib/teact/teact';
import React, {
  memo, useEffect, useRef, useState,
} from '../../../lib/teact/teact';

import type { IAnchorPosition } from '../../../types';
import { ApiMessageEntityTypes, ApiMessageEntityTypesDefault } from '../../../api/types';

import { EDITABLE_INPUT_ID, STRICTERDOM_ENABLED } from '../../../config';
import buildClassName from '../../../util/buildClassName';
import captureEscKeyListener from '../../../util/captureEscKeyListener';
import { ensureProtocol } from '../../../util/ensureProtocol';
import getKeyFromEvent from '../../../util/getKeyFromEvent';
import stopEvent from '../../../util/stopEvent';

import useFlag from '../../../hooks/useFlag';
import useLastCallback from '../../../hooks/useLastCallback';
import useOldLang from '../../../hooks/useOldLang';
import useShowTransitionDeprecated from '../../../hooks/useShowTransitionDeprecated';
import useVirtualBackdrop from '../../../hooks/useVirtualBackdrop';

import Icon from '../../common/icons/Icon';
import Button from '../../ui/Button';

import './TextFormatter.scss';
import {disableStrict} from '../../../lib/fasterdom/stricterdom';
import {TransformFormattedText} from '../helpers/TransformFormattedText';
import {IconName} from '../../../types/icons';

export type OwnProps = {
  setHtml: (html: string) => void
  formattedText: TransformFormattedText
  setFormattedText: (text: TransformFormattedText) => void
  isOpen: boolean;
  anchorPosition?: IAnchorPosition;
  selectedRange?: Range;
  setSelectedRange: (range: Range) => void;
  onClose: () => void;
};

type FormatterApiMessageEntityTypes = ApiMessageEntityTypesDefault | ApiMessageEntityTypes.TextUrl
type ISelectedTextFormats = { [key in FormatterApiMessageEntityTypes]?: boolean }
type Formats = { type: FormatterApiMessageEntityTypes, text: string }[]

let textNodeToOffset = new Map()

const TextFormatter: FC<OwnProps> = ({
  setHtml,
  formattedText,
  setFormattedText,
  isOpen,
  anchorPosition,
  selectedRange,
  setSelectedRange,
  onClose,
}) => {
  const formats: Formats = [
    { type: ApiMessageEntityTypes.Bold, text: 'Bold' },
    { type: ApiMessageEntityTypes.Italic, text: 'Italic' },
    { type: ApiMessageEntityTypes.Underline, text: 'Underlined' },
    { type: ApiMessageEntityTypes.Strike, text: 'Strikethrough' },
    { type: ApiMessageEntityTypes.Code, text: 'Monospace' },
    { type: ApiMessageEntityTypes.Spoiler, text: 'Spoiler' }
  ]
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
    false
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
    // sometimes styles are not setted because of error inside stricterdom.ts
    if (STRICTERDOM_ENABLED) {
      disableStrict()
    }

    if (!isOpen || !selectedRange) {
      return;
    }

    const { startContainer, startOffset, endContainer, endOffset } = selectedRange

    getStartAndEnd()
    const offset = textNodeToOffset.get(startContainer) + startOffset
    const length = textNodeToOffset.get(endContainer) + endOffset - offset
    const types = formattedText.getActiveTypes({ offset, length })

    if (types) {
      const fs = types.reduce((accumulator, current) => {
        if (current.type === ApiMessageEntityTypes.TextUrl) {
          setLinkUrl(current.url)
        }
        return { ...accumulator, [current.type]: true }
      }, {})
      setSelectedTextFormats(fs)
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
    return selectedTextFormats[key] ? 'active' : undefined
  }

  const getStartAndEnd = (offset?: number, end?: number) => {
    textNodeToOffset = new Map()
    let element = document.getElementById(EDITABLE_INPUT_ID) as Node
    let index = 0
    let startContainer = element
    let startOffset = 0
    let endContainer = element
    let endOffset = 0

    const checkNode = (node: ChildNode) => {
      const { nodeType, textContent } = node
      if (nodeType === Node.COMMENT_NODE) {
        return
      }

      if (nodeType === Node.TEXT_NODE && textContent) {
        textNodeToOffset.set(node, index)
        const { length } = textContent
        if (offset !== undefined && end !== undefined) {
          const nodeEnd = index + length
          if (index <= offset && offset < nodeEnd) {
            startContainer = node
            startOffset = offset - index
          }

          if (index < end && end <= nodeEnd) {
            endContainer = node
            endOffset = end - index
          }
        }

        index += length
      }

      [...node.childNodes].forEach(checkNode)
    }

    [...element.childNodes].forEach(checkNode)

    return { startContainer, endContainer, startOffset, endOffset }
  }

  const handleChangeFormat = useLastCallback((type: FormatterApiMessageEntityTypes) => {
    if (!selectedRange) {
      return
    }

    const isActive = selectedTextFormats[type]

    getStartAndEnd()
    const offset = textNodeToOffset.get(selectedRange.startContainer) + selectedRange.startOffset
    const length = textNodeToOffset.get(selectedRange.endContainer) + selectedRange.endOffset - offset

    if (type === ApiMessageEntityTypes.TextUrl) {
      const url = linkUrl ? (ensureProtocol(linkUrl) || '').split('%').map(encodeURI).join('%') : linkUrl
      formattedText.recalculateEntities({ type, offset, length, url }, !isActive)
    } else {
      formattedText.recalculateEntities({ type, offset, length }, !isActive)
    }
    const html = formattedText.getHtml()
    console.log(formattedText.entities, formattedText.text)
    console.log(html)
    setHtml(html)
    setFormattedText(formattedText)

    setTimeout(() => {
      const { startContainer, endContainer, startOffset, endOffset } = getStartAndEnd(offset, offset + length)
      selectedRange.setStart(startContainer, startOffset)
      selectedRange.setEnd(endContainer, endOffset)
    }, 300)

    setSelectedTextFormats((selectedFormats) => ({
      ...selectedFormats,
      [type]: !isActive,
    }))
  });

  const handleKeyDown = useLastCallback((e: KeyboardEvent) => {
    const HANDLERS_BY_KEY: Record<string, AnyToVoidFunction> = {
      k: openLinkControl,
      b: () => handleChangeFormat(ApiMessageEntityTypes.Bold),
      u: () => handleChangeFormat(ApiMessageEntityTypes.Underline),
      i: () => handleChangeFormat(ApiMessageEntityTypes.Italic),
      m: () => handleChangeFormat(ApiMessageEntityTypes.Code),
      s: () => handleChangeFormat(ApiMessageEntityTypes.Strike),
      p: () => handleChangeFormat(ApiMessageEntityTypes.Spoiler)
    }

    const handler = HANDLERS_BY_KEY[getKeyFromEvent(e)]

    if (e.altKey || !(e.ctrlKey || e.metaKey) || !handler) {
      return
    }

    e.preventDefault()
    e.stopPropagation()
    handler()
  })

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleKeyDown]);

  const lang = useOldLang();

  function handleContainerKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    if (e.key === 'Enter' && isLinkControlOpen) {
      handleChangeFormat(ApiMessageEntityTypes.TextUrl)
      e.preventDefault()
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
      onMouseDown={stopEvent}>
      <div className="TextFormatter-buttons">
        {formats.map(format => 
          <Button
            key={format.type}
            color="translucent"
            ariaLabel={`${format.text} text`}
            className={getFormatButtonClassName(format.type)}
            onClick={() => handleChangeFormat(format.type)}>
            <Icon name={format.text.toLowerCase() as IconName} />
          </Button>
        )}
        <div className="TextFormatter-divider" />
        <Button 
          color="translucent" 
          ariaLabel={lang('TextFormat.AddLinkTitle')} 
          className={getFormatButtonClassName(ApiMessageEntityTypes.TextUrl)}
          onClick={openLinkControl}>
          <Icon name="link" />
        </Button>
      </div>

      <div className="TextFormatter-link-control">
        <div className="TextFormatter-buttons">
          <Button 
            color="translucent"
            ariaLabel={lang('Cancel')}
            onClick={closeLinkControl}>
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
