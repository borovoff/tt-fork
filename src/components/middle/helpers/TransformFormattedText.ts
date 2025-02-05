import {ApiFormattedText, ApiMessageEntity} from "../../../api/types";
import parseHtmlAsFormattedText from "../../../util/parseHtmlAsFormattedText";
import {getTextWithEntitiesAsHtml} from "../../common/helpers/renderTextWithEntities";

export class TransformFormattedText implements ApiFormattedText {
  text: string
  entities?: ApiMessageEntity[]

  constructor({text, entities}: ApiFormattedText) {
    this.text = text
    this.entities = entities
  }

  static getFormattedText(html: string) {
    return new TransformFormattedText(parseHtmlAsFormattedText(html))
  }

  getHtml() {
    return getTextWithEntitiesAsHtml(this)
  }
}
