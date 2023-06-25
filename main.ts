import { encodeBase, LOWER_ALPHA, UPPER_ALPHA } from "./baseEncoder.ts";
import {
  BlockQuoteNode,
  BreakNode,
  BubbleNode,
  CardNode,
  CenterNode,
  ColumnsNode,
  DocumentNode,
  EmbedNode,
  EmojiNode,
  FigureImageNode,
  FormattedTextNode,
  HeaderNode,
  HighTechAlertNode,
  HorizontalRuleNode,
  ImageNode,
  LinkNode,
  ListNode,
  Node,
  NodeVisitor,
  NoteNode,
  ParagraphNode,
  QuoteNode,
  StickerNode,
  StrikeThroughNode,
  TextNode,
  VideoNode,
  WarningNode,
} from "./deps.ts";

interface TextVisitingState {
  images: Map<string, string>;
  imagesReverse: Map<string, string>;
  imageCount: number;
  links: Map<string, string>;
  linksReverse: Map<string, string>;
  linkCount: number;
  numericDepth: number;
}

export class FixedWidthTextVisitor extends NodeVisitor {
  private width: number;
  private lines: string[];
  private lazyLines: string[];
  private breakLazy: boolean;
  private spaceLazy: boolean;
  private breakCount: number;
  private eatSpaces: boolean;
  private state: TextVisitingState;
  constructor(width: number) {
    super();
    this.width = width;
    this.lines = [];
    this.lazyLines = [];
    this.breakLazy = false;
    this.spaceLazy = false;
    this.breakCount = 0;
    this.eatSpaces = true;
    this.state = {
      images: new Map(),
      imagesReverse: new Map(),
      imageCount: 0,
      links: new Map(),
      linksReverse: new Map(),
      linkCount: 0,
      numericDepth: 0,
    };
  }

  private setState(state: TextVisitingState) {
    this.state = state;
  }

  protected text(node: TextNode): void {
    this.pushText(node.text);
  }

  protected formattedText(node: FormattedTextNode): void {
    this.pushBlockContentBegin();
    for (const line of node.text.split("\n")) {
      this.pushLine();
      this.eatSpaces = false;
      this.pushText(line);
    }
    this.pushBlockContentEnd();
  }

  // deno-lint-ignore no-unused-vars
  protected horizontalRule(node: HorizontalRuleNode): void {
    this.pushBlockContentBegin();
    this.pushText("-".repeat(this.width));
    this.pushBlockContentEnd();
  }

  // deno-lint-ignore no-unused-vars
  protected break_(node: BreakNode): void {
    this.breakCount++;
  }

  protected paragraph(node: ParagraphNode): void {
    this.pushBlockContentBegin();
    super.paragraph(node);
    this.pushBlockContentEnd();
  }

  protected list(node: ListNode): void {
    if (this.lines.length > 0) {
      this.breakLazy = true;
    }

    this.lazyLines = [];
    this.pushBlockContentBegin();

    if (node.style == "ordered") {
      let counter = 0;
      const widthOffset = 4 + this.counterToDepth(node.content.length).length;
      for (const item of node.content) {
        counter++;
        if (counter > 1) {
          this.lines.push("");
        }
        const counterText = this.counterToDepth(counter);
        const visitor = new FixedWidthTextVisitor(this.width - widthOffset);
        visitor.setState({
          ...this.state,
          numericDepth: this.state.numericDepth + 1,
        });
        visitor.visit({ type: "array", content: item.content });
        const lines = visitor.getLines();
        for (let i = 0; i < lines.length; i++) {
          if (i == 0) {
            this.lines.push(
              `${
                " ".repeat(widthOffset - counterText.length - 2)
              }${counterText}. ${lines[0]}`,
            );
          } else {
            if (lines[i] == "") {
              this.lines.push("");
            } else {
              this.lines.push(" ".repeat(widthOffset) + lines[i]);
            }
          }
        }
      }
    } else {
      for (const item of node.content) {
        const visitor = new FixedWidthTextVisitor(this.width - 5);
        visitor.setState({ ...this.state, numericDepth: 0 });
        visitor.visit({ type: "array", content: item.content });
        const lines = visitor.getLines();
        for (let i = 0; i < lines.length; i++) {
          if (i == 0) {
            this.lines.push("  *  " + lines[0]);
          } else {
            this.lines.push("     " + lines[i]);
          }
        }
      }
    }
    this.pushBlockContentEnd();
  }

  protected columns(node: ColumnsNode): void {
    const count = node["column-count"];
    if (count == 1) {
      this.visit({ type: "array", content: node.columns[0] });
      return;
    }
    let consumedWidth = 0;
    const generalWidth = Math.floor((this.width - ((count - 1) * 2)) / count);
    const columns = [];
    let maxLines = 0;
    for (let i = 0; i < count; i++) {
      if (i > 0) {
        consumedWidth += 2;
      }
      const width = i == count - 1 ? this.width - consumedWidth : generalWidth;

      const visitor = new FixedWidthTextVisitor(width);
      visitor.setState({ ...this.state, numericDepth: 0 });
      visitor.visit({ type: "array", content: node.columns[i] });
      const lines = visitor.getLines();
      columns.push(lines);
      maxLines = Math.max(maxLines, lines.length);

      consumedWidth += width;
    }

    this.pushBlockContentBegin();
    for (let i = 0; i < maxLines; i++) {
      let line = "";
      for (let j = 0; j < count; j++) {
        if (j > 0) {
          line += "  ";
        }
        const colLine = columns[j][i] || "";
        line += colLine + " ".repeat(generalWidth - colLine.length);
      }
      this.lines.push(line.trimEnd());
    }
    this.pushBlockContentEnd();
  }

  protected link(node: LinkNode): void {
    super.link(node);
    if (this.state.linkCount == 83) {
      // console.log(JSON.stringify(this.state));
    }
    let key: string;
    if (this.state.links.has(node.url)) {
      key = this.state.links.get(node.url) || "unreachable";
    } else {
      this.state.linkCount++;
      key = `L${this.state.linkCount}`;
      this.state.links.set(node.url, key);
      this.state.linksReverse.set(key, node.url);
    }
    this.spaceLazy = true;
    this.pushText(`[${key}]`);
    this.spaceLazy = true;
  }

  protected image(node: ImageNode): void {
    let key: string;
    if (this.state.images.has(node.url)) {
      key = this.state.images.get(node.url) || "unreachable";
    } else {
      this.state.imageCount++;
      key = `I${this.state.imageCount}`;
      this.state.images.set(node.url, key);
      this.state.imagesReverse.set(key, node.url);
    }
    this.pushBlockContentBegin();
    this.pushText(`[${key}: `);
    this.pushText((node.alt || "unspecified").replaceAll(/[\n\r\t]/g, " "));
    this.pushText("]");
    this.pushBlockContentEnd();
  }

  protected figureImage(node: FigureImageNode): void {
    let key: string;
    if (this.state.images.has(node.url)) {
      key = this.state.images.get(node.url) || "unreachable";
    } else {
      this.state.imageCount++;
      key = `I${this.state.imageCount}`;
      this.state.images.set(node.url, key);
    }
    this.pushBlockContentBegin();
    this.pushText(`[${key}: `);
    this.pushText((node.alt || "unspecified").replaceAll(/[\n\r\t]/g, " "));
    this.pushText("]");
    this.pushBlockContentEnd();
    this.visit({
      type: "paragraph",
      content: node.content,
    });
  }

  protected emoji(node: EmojiNode): void {
    let key: string;
    if (this.state.images.has(node.url)) {
      key = this.state.images.get(node.url) || "unreachable";
    } else {
      this.state.imageCount++;
      key = `I${this.state.imageCount}`;
      this.state.images.set(node.url, key);
    }
    this.spaceLazy = true;
    this.pushText(
      `[${key}: ${(node.alt || "unspecified").replaceAll(/[\n\r\t]/g, " ")}]`,
    );
    this.spaceLazy = true;
  }

  protected video(node: VideoNode): void {
    this.image({
      type: "image",
      url: node.poster,
      alt: `Video: ${node.alt || "unspecified"}`,
    });
  }

  protected embed(node: EmbedNode): void {
    if (node.content.type == "youtube") {
      this.spaceLazy = true;
      this.link({
        type: "link",
        url: `https://youtu.be/${node.content.id}`,
        content: [{ type: "text", text: "Youtube Video" }],
      });
    }
  }

  protected header(node: HeaderNode): void {
    const startIndex = this.lines.length;
    super.header(node);
    const end = this.lines.length;
    let maxWidth = 1;
    for (let i = startIndex; i < end; i++) {
      const line = this.lines[i];
      maxWidth = Math.min(this.width, line.length);
    }
    this.pushLine();
    let border = "=";
    if (node.level == 2) {
      border = "-";
    } else if (node.level == 3) {
      border = "^";
    } else if (node.level == 4) {
      border = '"';
    } else if (node.level == 5) {
      border = "'";
    } else if (node.level == 6) {
      border = "`";
    }

    this.lines[this.lines.length - 1] = border.repeat(maxWidth);
    this.breakLazy = false;
    this.lazyLines = [""];
  }

  protected strikeThrough(node: StrikeThroughNode): void {
    this.pushText("(Strike through: ");
    super.strikeThrough(node);
    this.pushText(")");
  }

  protected note(node: NoteNode): void {
    this.paragraph({
      type: "paragraph",
      content: [
        { type: "text", text: "Note: " },
        ...node.content,
      ],
    });
  }

  protected center(node: CenterNode): void {
    const visitor = new FixedWidthTextVisitor(this.width);
    visitor.setState({ ...this.state, numericDepth: 0 });
    visitor.visit({
      type: "array",
      content: node.content,
    });
    this.pushBlockContentBegin();
    for (const line of visitor.getLines()) {
      this.pushEndOfLineIfAnyContent();
      this.lines[Math.max(0, this.lines.length - 1)] =
        " ".repeat(Math.floor((this.width - line.length) / 2)) + line;
    }
    this.pushBlockContentEnd();
  }

  protected warning(node: WarningNode): void {
    this.pushBlockContentBegin();

    const visitor = new FixedWidthTextVisitor(this.width - 2);
    visitor.setState({ ...this.state, numericDepth: 0 });
    visitor.visit({
      type: "array",
      content: node.content,
    });
    for (const line of visitor.getLines()) {
      this.pushEndOfLineIfAnyContent();
      this.lines[Math.max(0, this.lines.length - 1)] = "| " + line;
    }

    this.pushBlockContentEnd();
  }

  protected highTechAlert(node: HighTechAlertNode): void {
    this.pushBlockContentBegin();
    this.pushText("/");
    this.pushText("-".repeat(this.width - 2));
    this.pushText("\\");

    const centerVisitor = new FixedWidthTextVisitor(this.width - 4);
    centerVisitor.setState({ ...this.state, numericDepth: 0 });
    centerVisitor.center({
      type: "center",
      content: node.warning,
    });
    let anyWarningLines = false;
    for (const line of centerVisitor.getLines()) {
      anyWarningLines = true;
      this.pushEndOfLineIfAnyContent();
      this.lines[this.lines.length - 1] = "| " + line +
        " ".repeat(this.width - 4 - line.length) + " |";
    }
    if (anyWarningLines) {
      this.pushLine();
      this.pushText("|" + "-".repeat(this.width - 2) + "|");
    }

    const contentVisitor = new FixedWidthTextVisitor(this.width - 4);
    contentVisitor.setState({ ...this.state, numericDepth: 0 });
    contentVisitor.visit({
      type: "array",
      content: node.content,
    });
    for (const line of contentVisitor.getLines()) {
      this.pushEndOfLineIfAnyContent();
      this.lines[this.lines.length - 1] = "| " + line +
        " ".repeat(this.width - 4 - line.length) + " |";
    }

    this.pushEndOfLineIfAnyContent();
    this.pushText("\\");
    this.pushText("-".repeat(this.width - 2));
    this.pushText("/");
    this.pushBlockContentEnd();
  }

  protected blockQuote(node: BlockQuoteNode): void {
    this.pushBlockContentBegin();

    const visitor = new FixedWidthTextVisitor(this.width - 2);
    visitor.setState({ ...this.state, numericDepth: 0 });
    visitor.visit({
      type: "array",
      content: node.content,
    });
    for (const line of visitor.getLines()) {
      this.pushEndOfLineIfAnyContent();
      this.lines[Math.max(0, this.lines.length - 1)] = "> " + line;
    }

    this.pushBlockContentEnd();
  }

  protected quote(node: QuoteNode): void {
    this.pushBlockContentBegin();

    const visitor = new FixedWidthTextVisitor(this.width - 2);
    visitor.setState({ ...this.state, numericDepth: 0 });
    visitor.visit({
      type: "array",
      content: [
        { type: "text", text: node.name },
        { type: "break" },
        { type: "break" },
        ...node.content,
      ],
    });
    for (const line of visitor.getLines()) {
      this.pushEndOfLineIfAnyContent();
      this.lines[Math.max(0, this.lines.length - 1)] = "> " + line;
    }
    this.pushBlockContentEnd();
  }

  protected bubble(node: BubbleNode): void {
    this.pushBlockContentBegin();

    const visitor = new FixedWidthTextVisitor(this.width - 4);
    visitor.setState({ ...this.state, numericDepth: 0 });
    visitor.visit({
      type: "array",
      content: [
        ...node.content,
      ],
    });
    for (const line of visitor.getLines()) {
      this.pushEndOfLineIfAnyContent();
      if (node.orientation == "left") {
        this.lines[Math.max(0, this.lines.length - 1)] = "| " + line;
      } else if (node.orientation == "right") {
        this.lines[Math.max(0, this.lines.length - 1)] =
          " ".repeat(this.width - 2 - line.length) + line + " |";
      }
    }
    this.pushBlockContentEnd();
  }

  protected sticker(node: StickerNode): void {
    this.pushBlockContentBegin();

    const visitor = new FixedWidthTextVisitor(this.width - 4);
    visitor.setState({ ...this.state, numericDepth: 0 });
    visitor.visit({
      type: "array",
      content: [
        ...(node.content || []),
      ],
    });
    this.pushEndOfLineIfAnyContent();
    const label = `[${node.character}: ${node.name}]`;
    if (node.orientation == "left") {
      this.lines[Math.max(0, this.lines.length - 1)] = "/" + label +
        "-".repeat(this.width - label.length - 2) + "\\";
    } else if (node.orientation == "right") {
      this.lines[Math.max(0, this.lines.length - 1)] = "/" +
        "-".repeat(this.width - label.length - 2) + label + "\\";
    } else if (node.orientation == "center") {
      const length = this.width - label.length - 2;
      const leftLength = Math.floor(length / 2);
      const rightLength = length - leftLength;
      this.lines[Math.max(0, this.lines.length - 1)] = "/" +
        "-".repeat(leftLength) + label + "-".repeat(rightLength) + "\\";
    }
    for (const line of visitor.getLines()) {
      this.pushEndOfLineIfAnyContent();
      const length = this.width - 3 - line.length;
      if (node.orientation == "left") {
        this.lines[Math.max(0, this.lines.length - 1)] = "| " + line +
          " ".repeat(length) + "|";
      } else if (node.orientation == "right") {
        this.lines[Math.max(0, this.lines.length - 1)] = "|" +
          " ".repeat(length) + line + " |";
      } else if (node.orientation == "center") {
        const leftLength = Math.floor(length / 2);
        const rightLength = length - leftLength;
        this.lines[Math.max(0, this.lines.length - 1)] = "|" +
          " ".repeat(leftLength + 1) + line + " ".repeat(rightLength) + "|";
      }
    }
    this.pushEndOfLineIfAnyContent();
    this.pushText("\\");
    this.pushText("-".repeat(this.width - 2));
    this.pushText("/");
    this.pushBlockContentEnd();
  }

  protected card(node: CardNode): void {
    this.pushBlockContentBegin();
    this.pushText("/");
    this.pushText("-".repeat(this.width - 2));
    this.pushText("\\");

    let anyHeaderLines = false;
    if (node.header) {
      const centerVisitor = new FixedWidthTextVisitor(this.width - 4);
      centerVisitor.setState({ ...this.state, numericDepth: 0 });
      centerVisitor.center({
        type: "center",
        content: [
          ...node.header.title,
          ...(node.header.username &&
              [{
                type: "text",
                text: ` @${node.header.username}`,
              } as TextNode] || []),
          ...(node.header.username &&
              [{
                type: "text",
                text: `@${node.header.usernameDomain}`,
              } as TextNode] || []),
        ],
      });

      for (const line of centerVisitor.getLines()) {
        anyHeaderLines = true;
        this.pushEndOfLineIfAnyContent();
        this.lines[this.lines.length - 1] = "| " + line +
          " ".repeat(this.width - 4 - line.length) + " |";
      }
      if (anyHeaderLines) {
        this.pushLine();
        this.pushText("|" + "-".repeat(this.width - 2) + "|");
      }
    }

    const contentVisitor = new FixedWidthTextVisitor(this.width - 4);
    contentVisitor.setState({ ...this.state, numericDepth: 0 });
    const content: Node[] = [
      ...(node.content && node.content.content || []),
      ...(node.media && node.media.content || []),
    ];
    if (node.attribution) {
      let date: Date | undefined;
      if (node.attribution.date) {
        try {
          date = new Date(node.attribution.date);
        } catch (_e) {
          // Oh well
        }
      }
      content.push({
        type: "paragraph",
        content: [
          ...(node.attribution.title || []),
          ...(node.attribution.url && [{
                type: "link",
                url: node.attribution.url,
                content: [],
              } as LinkNode] || []),
          ...(node.attribution.archiveUrl && [{
                type: "link",
                url: node.attribution.archiveUrl,
                content: [],
              } as LinkNode] || []),
          ...(date && [{
                type: "text",
                text: date.toLocaleDateString(),
              }] as Node[] || []),
        ],
      });
    }
    contentVisitor.visit({
      type: "array",
      content,
    });
    for (const line of contentVisitor.getLines()) {
      this.pushEndOfLineIfAnyContent();
      this.lines[this.lines.length - 1] = "| " + line +
        " ".repeat(this.width - 4 - line.length) + " |";
    }

    this.pushEndOfLineIfAnyContent();
    this.pushText("\\");
    this.pushText("-".repeat(this.width - 2));
    this.pushText("/");
    this.pushBlockContentEnd();
  }

  protected document(node: DocumentNode): void {
    this.pushBlockContentBegin();
    let date: Date | undefined;
    try {
      if (node["pub-date"]) {
        date = new Date(node["pub-date"] * 1000);
      }
    } catch (_e) {
      // Nothing
    }
    this.center({
      type: "center",
      content: [
        { type: "text", text: node.title },
        { type: "break" },
        ...(date &&
            [{ type: "text", text: date.toDateString() }, {
              type: "break",
            }] as Node[] || []),
        ...(node.description &&
            [{ type: "text", text: node.description }] as Node[] || []),
        { type: "horizontal-rule" },
      ],
    });
    super.document(node);
    this.horizontalRule({ type: "horizontal-rule" });
    if (this.state.linkCount > 0) {
      const length = Math.max(7, `[L${this.state.linkCount}]: `.length);
      for (let i = 1; i <= this.state.linkCount; i++) {
        const label = `[L${i}]: `;
        const visitor = new FixedWidthTextVisitor(this.width - length);
        visitor.text({
          "type": "text",
          text: this.state.linksReverse.get(`L${i}`) || "",
        });
        let firstLine = true;
        for (const line of visitor.getLines()) {
          if (!firstLine) {
            this.lines.push(" ".repeat(length) + line);
          } else {
            this.lines.push(" ".repeat(length - label.length) + label + line);
            firstLine = false;
          }
        }
      }
    }

    if (this.state.imageCount > 0) {
      const length = Math.max(7, `[L${this.state.imageCount}]: `.length);
      for (let i = 1; i <= this.state.imageCount; i++) {
        const label = `[I${i}]: `;
        const visitor = new FixedWidthTextVisitor(this.width - length);
        visitor.text({
          "type": "text",
          text: this.state.imagesReverse.get(`I${i}`) || "",
        });
        let firstLine = true;
        for (const line of visitor.getLines()) {
          if (!firstLine) {
            this.lines.push(" ".repeat(length) + line);
          } else {
            this.lines.push(" ".repeat(length - label.length) + label + line);
            firstLine = false;
          }
        }
      }
    }
  }

  private counterToDepth(counter: number): string {
    const num = this.state.numericDepth % 3;
    if (num == 0) {
      return `${counter}`;
    } else if (num == 1) {
      return encodeBase(UPPER_ALPHA, counter, true);
    } else {
      return encodeBase(LOWER_ALPHA, counter, true);
    }
  }

  private pushBlockContentBegin() {
    this.pushLazyLines();
    if (this.lines.length > 0) {
      // Clear last line conditionally
      this.pushEndOfLineIfAnyContent();
    }
  }

  private pushBlockContentEnd() {
    this.lazyLines.push("");
  }

  private pushLazyLines() {
    let newLines = false;
    if (this.breakCount > 0) {
      this.breakCount--;
      if (
        this.lines[this.lines.length - 1] &&
        this.lines[this.lines.length - 1].length > 0
      ) {
        this.lines.push("");
      }
      while (this.breakCount > 0) {
        this.breakCount--;
        this.lines.push("");
      }
    }
    if (
      this.breakLazy && this.lines[this.lines.length - 1] &&
      this.lines[this.lines.length - 1].length > 0
    ) {
      this.lines.push("");
      newLines = true;
    }
    if (this.lazyLines.length > 0) {
      this.pushEndOfLineIfAnyContent();
      newLines = true;
    }
    for (const line of this.lazyLines) {
      this.lines.push(line);
      newLines = true;
    }
    if (!newLines && this.spaceLazy && this.lines.length > 0) {
      const lastLine = this.getLastLine();
      if (
        !lastLine.endsWith(" ") && lastLine.length < this.width &&
        lastLine.length > 0
      ) {
        this.lines[this.lines.length - 1] += " ";
      }
    }
    if (this.getLastLine().length == this.width) {
      this.lines.push("");
    }
    this.lazyLines = [];
    this.breakLazy = false;
    this.spaceLazy = false;
  }

  private pushEndOfLineIfAnyContent() {
    if (this.getLastLine() != "") {
      this.pushLine();
    }
  }

  private getLastLine() {
    if (this.lines.length == 0) {
      return "";
    }
    return this.lines[this.lines.length - 1];
  }

  private pushText(text: string) {
    this.pushLazyLines();
    let index = this.lines.length - 1;
    let line: string;
    if (index >= 0) {
      line = this.lines[index];
    } else {
      line = "";
      index = 0;
    }

    let sliceStart = 0;
    do {
      if ((line == "" && this.eatSpaces) || line.endsWith(" ")) {
        // skip white space
        while (true) {
          const nextChar = text.slice(sliceStart, sliceStart + 1);
          if (nextChar == "") {
            break;
          }
          if (nextChar == " ") {
            sliceStart++;
          } else {
            break;
          }
        }
      }
      this.eatSpaces = true;
      let sliceEnd = sliceStart + this.width - line.length;
      let slice = text.slice(sliceStart, sliceEnd);
      const nextChar = text.slice(sliceEnd, sliceEnd + 1);
      if (slice == "") {
        break;
      } else if (nextChar && nextChar.match(/[a-zA-Z0-9\.\?,\]\)]/)) {
        let success = false;
        for (let i = 0; i < slice.length; i++) {
          const index = slice.length - 1 - i;
          const char = slice.charAt(index);
          if (char && char.match(/[ =\-_\/\\\n\r\t]/)) {
            sliceEnd -= i;
            slice = text.slice(sliceStart, sliceEnd);
            success = true;
            break;
          }
        }

        if (success) {
          this.lines[index] = line + slice;
          if (this.lines[index].length > this.width) {
            console.log("oops 1");
          }
        } else {
          if (this.getLastLine().length > 0) {
            sliceEnd = sliceStart;
            this.lines[index] = line;
          } else {
            // No choice but to break it;
            this.lines[index] = line + slice;
          }
        }

        this.pushLine();
        index++;
        line = this.lines[index];
        sliceStart = sliceEnd;
      } else {
        this.lines[index] = line + slice;
        sliceStart = sliceEnd;
        if (nextChar == "") {
          break;
        }
      }

      if (this.lines[index].length == this.width) {
        this.pushLine();
        index++;
        line = this.lines[index];
      }
    } while (true);
  }

  private pushLine() {
    const lastIndex = this.lines.length - 1;
    if (lastIndex >= 0 && this.lines[lastIndex].endsWith(" ")) {
      const line = this.lines[lastIndex];
      this.lines[lastIndex] = line.trimEnd();
    }
    this.lines.push("");
  }

  public getLines(): readonly string[] {
    return this.lines;
  }
}
