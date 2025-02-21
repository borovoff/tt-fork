import type { ApiMessageEntityMentionName, ApiMessageEntityTextUrl } from '../api/types';
import type { CutEntity } from './BaseParser';
import { ApiMessageEntityTypes } from '../api/types';

import { SpecialParser } from './SpecialParser';

export class UrlParser extends SpecialParser {
  protected maxLength = 100;

  constructor(text: string, entity: CutEntity, i: number) {
    super(text, entity, i);
  }

  getEntity() {
    this.parse();

    return { e: this.entity, offset: this.i - this.startIndex };
  }

  private checkId(id: string) {
    const regex = /^\d+$/;
    if (!regex.test(id)) {
      this.error('Incorrect id');
    }
  }

  private checkUrl(url: string) {
    try {
      new URL(url);
    } catch {
      this.error('Url is not valid');
    }
  }

  private endUrl = () => {
    const url = this.text.slice(this.startIndex, this.i);
    ++this.i;
    if (url) {
      const emojiPrefix = 'tg://emoji?id=';
      if (this.entity.type === ApiMessageEntityTypes.CustomEmoji && url.startsWith(emojiPrefix)) {
        const id = url.replace(emojiPrefix, '');
        this.checkId(id);
        this.entity.documentId = id;

        return true;
      }

      if (this.entity.type !== ApiMessageEntityTypes.CustomEmoji) {
        const userPrefix = 'tg://user?id=';
        if (url.startsWith(userPrefix)) {
          const e = this.entity as ApiMessageEntityMentionName;
          const id = url.replace(userPrefix, '');
          this.checkId(id);
          e.userId = id;
          e.type = ApiMessageEntityTypes.MentionName;

          return true;
        }

        const e = this.entity as ApiMessageEntityTextUrl;
        this.checkUrl(url);
        e.url = url;

        return true;
      }

      this.error('Wrong url syntax');
    } else {
      this.error('The url is empty');
    }
  };

  protected charToAction = {
    '\\': this.escape,
    ')': this.endUrl,
  };
}
