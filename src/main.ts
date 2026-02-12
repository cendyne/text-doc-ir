import { encodeBase, LOWER_ALPHA, UPPER_ALPHA } from "./baseEncoder.ts";
import type {
  AccordionGroupNode,
  AccordionTabNode,
  BlockQuoteNode,
  BoldNode,
  BreakNode,
  BubbleNode,
  CardNode,
  CenterNode,
  CodeBlockNode,
  CodeGroupNode,
  CodeNode,
  ColumnsNode,
  DateNode,
  DateTimeNode,
  DefinitionListNode,
  DefinitionNode,
  DefinitionReferenceNode,
  DocumentNode,
  EmbedNode,
  EmojiNode,
  FigureCaptionNode,
  FigureImageNode,
  FigureNode,
  FormattedTextNode,
  HeaderNode,
  HighTechAlertNode,
  HorizontalRuleNode,
  ImageNode,
  ItalicNode,
  LinkNode,
  ListNode,
  Node,
  NoteNode,
  ParagraphNode,
  PillNode,
  QuoteNode,
  RedactedNode,
  RegionNode,
  SecretNode,
  SmallerNode,
  SocialNode,
  StandardNode,
  StickerNode,
  StrikeThroughNode,
  SubTextNode,
  SuperTextNode,
  TableCellNode,
  TableNode,
  TableOfContentsNode,
  TextNode,
  TimeNode,
  TimeRangeNode,
  UnderlineNode,
  VideoNode,
  WarningNode,
} from "document-ir";
import { NodeVisitor } from "document-ir";

interface TextVisitingState {
  images: Map<string, string>;
  imagesReverse: Map<string, string>;
  imageCount: number;
  links: Map<string, string>;
  linksReverse: Map<string, string>;
  linkCount: number;
  numericDepth: number;
  tocDepth: number;
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
      tocDepth: 0,
    };
  }

  private setState(state: TextVisitingState) {
    this.state = state;
  }

  private restoreState(parent: FixedWidthTextVisitor) {
    parent.state.imageCount = this.state.imageCount;
    parent.state.linkCount = this.state.linkCount;
  }

  protected override choose(node: Node): void {
    switch (node.type) {
      case "code-block":
        return this.codeBlock(node);
      case "code-group":
        return this.codeGroup(node);
      case "accordion-group":
        return this.accordionGroup(node);
      case "pill":
        return this.pill(node);
      case "style":
        // Omit styles entirely
        return;
      case "script":
        // Omit scripts entirely
        return;
      default:
        return super.choose(node);
    }
  }

  protected override code(node: CodeNode): void {
    // Collect text from children
    const textVisitor = new FixedWidthTextVisitor(this.width);
    textVisitor.setState({ ...this.state, numericDepth: 0 });
    textVisitor.chooseChildren(node.content);
    const rawLines = textVisitor.getLines();
    textVisitor.restoreState(this);

    // Process lines based on diff and lineNumbers flags
    const lines = this.processCodeLines([...rawLines], node.diff ?? false, node.lineNumbers ?? false);

    this.pushBlockContentBegin();
    for (const line of lines) {
      this.pushLine();
      this.eatSpaces = false;
      this.pushText(line);
    }
    this.pushBlockContentEnd();
  }

  protected codeBlock(node: CodeBlockNode): void {
    if (node.collapsable && node.collapsed) {
      this.pushBlockContentBegin();
      this.pushText(`[Collapsed: ${node.fileName}]`);
      this.pushBlockContentEnd();
      return;
    }

    // Render the code content first to get the lines
    const codeVisitor = new FixedWidthTextVisitor(this.width - 4);
    codeVisitor.setState({ ...this.state, numericDepth: 0 });
    codeVisitor.code(node.content);
    const codeLines = codeVisitor.getLines();
    codeVisitor.restoreState(this);

    // Calculate box width
    const maxContentWidth = Math.max(...codeLines.map(l => l.length), node.fileName.length);
    const boxWidth = Math.min(this.width, maxContentWidth + 4);

    this.pushBlockContentBegin();

    // Header: /--- fileName ---\
    const headerPadding = Math.max(0, boxWidth - node.fileName.length - 4);
    const leftPad = Math.floor(headerPadding / 2);
    const rightPad = headerPadding - leftPad;
    this.pushText("/" + "-".repeat(leftPad) + " " + node.fileName + " " + "-".repeat(rightPad) + "\\");

    // Code lines in box
    for (const line of codeLines) {
      this.pushLine();
      this.eatSpaces = false;
      const padRight = Math.max(0, boxWidth - 4 - line.length);
      this.pushText("| " + line + " ".repeat(padRight) + " |");
    }

    // Footer
    this.pushLine();
    this.pushText("\\" + "-".repeat(boxWidth - 2) + "/");

    this.pushBlockContentEnd();
  }

  protected codeGroup(node: CodeGroupNode): void {
    for (const tab of node.tabs) {
      // Render header text
      const headerVisitor = new FixedWidthTextVisitor(this.width);
      headerVisitor.setState({ ...this.state, numericDepth: 0 });
      headerVisitor.chooseChildren(tab.header);
      const headerLines = headerVisitor.getLines();
      const headerText = headerLines.join(" ").trim();
      headerVisitor.restoreState(this);

      // Render code content
      const codeVisitor = new FixedWidthTextVisitor(this.width - 4);
      codeVisitor.setState({ ...this.state, numericDepth: 0 });
      codeVisitor.code(tab.content);
      const codeLines = codeVisitor.getLines();
      codeVisitor.restoreState(this);

      // Calculate box width
      const maxContentWidth = Math.max(...codeLines.map(l => l.length), headerText.length);
      const boxWidth = Math.min(this.width, maxContentWidth + 4);

      this.pushBlockContentBegin();

      // Header
      const headerPadding = Math.max(0, boxWidth - headerText.length - 4);
      const leftPad = Math.floor(headerPadding / 2);
      const rightPad = headerPadding - leftPad;
      this.pushText("/" + "-".repeat(leftPad) + " " + headerText + " " + "-".repeat(rightPad) + "\\");

      // Code lines
      for (const line of codeLines) {
        this.pushLine();
        this.eatSpaces = false;
        const padRight = Math.max(0, boxWidth - 4 - line.length);
        this.pushText("| " + line + " ".repeat(padRight) + " |");
      }

      // Footer
      this.pushLine();
      this.pushText("\\" + "-".repeat(boxWidth - 2) + "/");

      this.pushBlockContentEnd();
    }
  }

  protected accordionGroup(node: AccordionGroupNode): void {
    for (const tab of node.tabs) {
      this.accordionTab(tab);
    }
  }

  protected accordionTab(node: AccordionTabNode): void {
    if (node.open === false) {
      this.pushBlockContentBegin();
      const headerVisitor = new FixedWidthTextVisitor(this.width);
      headerVisitor.setState({ ...this.state, numericDepth: 0 });
      headerVisitor.chooseChildren(node.header);
      const headerText = headerVisitor.getLines().join(" ").trim();
      headerVisitor.restoreState(this);
      this.pushText(`[Collapsed: ${headerText}]`);
      this.pushBlockContentEnd();
      return;
    }

    // Render header as a sub-heading
    this.pushBlockContentBegin();
    this.chooseChildren(node.header);
    this.pushBlockContentEnd();

    // Render content
    this.pushBlockContentBegin();
    this.chooseChildren(node.content);
    this.pushBlockContentEnd();
  }

  protected pill(node: PillNode): void {
    this.pushText("[");
    this.chooseChildren(node.content);
    this.pushText("]");
  }

  protected override text(node: TextNode): void {
    this.pushText(node.text);
  }

  protected override formattedText(node: FormattedTextNode): void {
    this.pushBlockContentBegin();
    for (const line of node.text.split("\n")) {
      this.pushLine();
      this.eatSpaces = false;
      this.pushText(line);
    }
    this.pushBlockContentEnd();
  }

  protected override horizontalRule(_node: HorizontalRuleNode): void {
    this.pushBlockContentBegin();
    this.pushText("-".repeat(this.width));
    this.pushBlockContentEnd();
  }

  protected override break_(_node: BreakNode): void {
    this.breakCount++;
  }

  protected override paragraph(node: ParagraphNode): void {
    this.pushBlockContentBegin();
    super.paragraph(node);
    this.pushBlockContentEnd();
  }

  protected override list(node: ListNode): void {
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
        visitor.restoreState(this);
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
        visitor.restoreState(this);
      }
    }
    this.pushBlockContentEnd();
  }

  protected override columns(node: ColumnsNode): void {
    const count = node["column-count"];
    if (count == 1) {
      this.visit({ type: "array", content: node.columns[0]! });
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
      visitor.visit({ type: "array", content: node.columns[i]! });
      const lines = visitor.getLines();
      columns.push(lines);
      maxLines = Math.max(maxLines, lines.length);

      consumedWidth += width;
      visitor.restoreState(this);
    }

    this.pushBlockContentBegin();
    for (let i = 0; i < maxLines; i++) {
      let line = "";
      for (let j = 0; j < count; j++) {
        if (j > 0) {
          line += "  ";
        }
        const colLine = columns[j]?.[i] ?? "";
        line += colLine + " ".repeat(generalWidth - colLine.length);
      }
      this.lines.push(line.trimEnd());
    }
    this.pushBlockContentEnd();
  }

  protected override link(node: LinkNode): void {
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

    if (
      this.spaceLazy && this.lines.length > 0 &&
      this.lines[this.lines.length - 1]!.match(/[{\(\[]$/)
    ) {
      this.spaceLazy = false;
    }
    this.pushText(`[${key}]`);
    this.spaceLazy = true;
  }

  protected override image(node: ImageNode): void {
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

  protected override figureImage(node: FigureImageNode): void {
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

  protected override emoji(node: EmojiNode): void {
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

  protected override video(node: VideoNode): void {
    this.image({
      type: "image",
      url: node.poster,
      alt: `Video: ${node.alt || "unspecified"}`,
    });
  }

  protected override embed(node: EmbedNode): void {
    if (node.content.type == "youtube") {
      this.spaceLazy = true;
      this.link({
        type: "link",
        url: `https://youtu.be/${node.content.id}`,
        content: [{ type: "text", text: "Youtube Video" }],
      });
    }
  }

  protected override header(node: HeaderNode): void {
    const startIndex = this.lines.length;
    super.header(node);
    const end = this.lines.length;
    let maxWidth = 1;
    for (let i = startIndex; i < end; i++) {
      const line = this.lines[i]!;
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

  protected override strikeThrough(node: StrikeThroughNode): void {
    this.pushText("(Strike through: ");
    super.strikeThrough(node);
    this.pushText(")");
  }

  protected override superText(node: SuperTextNode): void {
    this.pushText("^(");
    super.superText(node);
    this.pushText(")");
  }

  protected override subText(node: SubTextNode): void {
    this.pushText("_(");
    super.subText(node);
    this.pushText(")");
  }

  protected override secret(node: SecretNode): void {
    this.pushText("[SPOILER: ");
    this.chooseChildren(node.content);
    this.pushText("]");
  }

  protected override redacted(node: RedactedNode): void {
    if (node.style === "block") {
      this.pushBlockContentBegin();
      this.pushText("[REDACTED]");
      this.pushBlockContentEnd();
    } else {
      this.pushText("[REDACTED]");
    }
  }

  protected override date(node: DateNode): void {
    this.chooseChildren(node.content);
  }

  protected override time(node: TimeNode): void {
    this.chooseChildren(node.content);
  }

  protected override datetime(node: DateTimeNode): void {
    this.chooseChildren(node.content);
  }

  protected override timeRange(node: TimeRangeNode): void {
    this.chooseChildren(node.content);
  }

  protected override figure(node: FigureNode): void {
    this.pushBlockContentBegin();
    this.chooseChildren(node.content);
    this.pushBlockContentEnd();
  }

  protected override figureCaption(node: FigureCaptionNode): void {
    this.pushBlockContentBegin();
    this.pushText("  ");
    this.eatSpaces = false;
    this.chooseChildren(node.content);
    this.pushBlockContentEnd();
  }

  protected override definitionList(node: DefinitionListNode): void {
    for (const def of node.content) {
      this.definition(def);
    }
  }

  protected override region(node: RegionNode): void {
    this.chooseChildren(node.content);
  }

  protected override social(node: SocialNode): void {
    switch (node.type) {
      case "tweet":
        this.link({
          type: "link",
          url: `https://twitter.com/i/status/${node.id}`,
          content: [{ type: "text", text: "Tweet" }],
        });
        break;
      case "toot":
        this.link({
          type: "link",
          url: node.id,
          content: [{ type: "text", text: "Toot" }],
        });
        break;
      case "vimeo":
        this.link({
          type: "link",
          url: `https://vimeo.com/${node.id}`,
          content: [{ type: "text", text: "Vimeo Video" }],
        });
        break;
      case "youtube":
        this.link({
          type: "link",
          url: `https://youtu.be/${node.id}`,
          content: [{ type: "text", text: "Youtube Video" }],
        });
        break;
    }
  }

  protected override standard(node: StandardNode): void {
    this.pushText(`${node.standard} ${node.identifier}`);
    if (node.url) {
      this.spaceLazy = true;
      this.link({
        type: "link",
        url: node.url,
        content: [],
      });
    }
    if (node.content.length > 0) {
      this.pushText(" ");
      this.chooseChildren(node.content);
    }
  }

  protected override table(node: TableNode): void {
    this.pushBlockContentBegin();

    // First, render each cell's content to determine column widths
    const rows: string[][][] = []; // rows[row][col] = lines[]
    const colCount = Math.max(...node.content.map(row => row.length));
    const colWidths: number[] = new Array(colCount).fill(0);
    const isHeaderRow: boolean[] = [];

    for (const row of node.content) {
      const renderedRow: string[][] = [];
      let hasHeader = false;
      for (let c = 0; c < row.length; c++) {
        const cell = row[c]!;
        if (cell.header) hasHeader = true;
        // Reserve space for borders: | col | col | = colCount * 3 + 1
        const availWidth = Math.max(
          5,
          Math.floor((this.width - colCount * 3 - 1) / colCount),
        );
        const visitor = new FixedWidthTextVisitor(availWidth);
        visitor.setState({ ...this.state, numericDepth: 0 });
        visitor.visit({ type: "array", content: cell.content });
        const lines = [...visitor.getLines()];
        renderedRow.push(lines);
        const maxLineLen = Math.max(...lines.map((l) => l.length), 0);
        colWidths[c] = Math.max(colWidths[c]!, maxLineLen);
        visitor.restoreState(this);
      }
      rows.push(renderedRow);
      isHeaderRow.push(hasHeader);
    }

    // Ensure minimum width
    for (let c = 0; c < colCount; c++) {
      colWidths[c] = Math.max(colWidths[c]!, 3);
    }

    // Helper to draw a separator line
    const separator = (char: string) => {
      return "+" +
        colWidths.map((w) => char.repeat(w + 2)).join("+") + "+";
    };

    // Render the table
    this.pushText(separator("-"));

    for (let r = 0; r < rows.length; r++) {
      const row = rows[r]!;
      const maxLines = Math.max(...row.map((cell) => cell.length), 1);

      for (let line = 0; line < maxLines; line++) {
        this.pushLine();
        let rowText = "|";
        for (let c = 0; c < colCount; c++) {
          const cellLines = row[c] || [];
          const cellLine = cellLines[line] || "";
          const width = colWidths[c]!;
          rowText += " " + cellLine +
            " ".repeat(width - cellLine.length) + " |";
        }
        this.pushText(rowText);
      }

      this.pushLine();
      if (isHeaderRow[r]) {
        this.pushText(separator("="));
      } else {
        this.pushText(separator("-"));
      }
    }

    this.pushBlockContentEnd();
  }

  protected override note(node: NoteNode): void {
    this.paragraph({
      type: "paragraph",
      content: [
        { type: "text", text: "Note: " },
        ...node.content,
      ],
    });
  }

  protected override center(node: CenterNode): void {
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
    visitor.restoreState(this);
    this.pushBlockContentEnd();
  }

  protected override warning(node: WarningNode): void {
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
    visitor.restoreState(this);

    this.pushBlockContentEnd();
  }

  protected override highTechAlert(node: HighTechAlertNode): void {
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
    centerVisitor.restoreState(this);

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
    contentVisitor.restoreState(this);
    this.pushBlockContentEnd();
  }

  protected override blockQuote(node: BlockQuoteNode): void {
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

    visitor.restoreState(this);
    this.pushBlockContentEnd();
  }

  protected override quote(node: QuoteNode): void {
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
    visitor.restoreState(this);
    this.pushBlockContentEnd();
  }

  protected override bubble(node: BubbleNode): void {
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
    visitor.restoreState(this);
    this.pushBlockContentEnd();
  }

  protected override sticker(node: StickerNode): void {
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
    visitor.restoreState(this);
    this.pushBlockContentEnd();
  }

  protected override card(node: CardNode): void {
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
      centerVisitor.restoreState(this);
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
    contentVisitor.restoreState(this);
    this.pushBlockContentEnd();
  }

  protected override definitionReference(node: DefinitionReferenceNode): void {
    this.visit({
      type: "array",
      content: [
        ...node.content,
      ],
    });
  }

  protected override definition(node: DefinitionNode): void {
    this.pushBlockContentBegin();
    this.chooseChildren(node.title);
    this.pushText(" (");
    this.chooseChildren(node.abbreviation);
    this.pushText("):");
    this.pushLine();

    const visitor = new FixedWidthTextVisitor(this.width - 2);
    visitor.setState({ ...this.state, numericDepth: 0 });
    visitor.visit({
      type: "array",
      content: node.content,
    });
    for (const line of visitor.getLines()) {
      this.pushEndOfLineIfAnyContent();
      this.lines[Math.max(0, this.lines.length - 1)] = "  " + line;
    }

    visitor.restoreState(this);

    this.pushBlockContentEnd();
  }

  protected override toc(node: TableOfContentsNode): void {
    if (this.state.tocDepth > 0) {
      const visitor = new FixedWidthTextVisitor(this.width - 3);
      visitor.setState({ ...this.state, tocDepth: this.state.tocDepth + 1 });

      if (node.date) {
        visitor.choose(node.date);
        visitor.pushText(" ");
      }
      visitor.chooseChildren(node.content);
      if (node.href && !node.href.startsWith("#")) {
        visitor.link({
          type: "link",
          url: node.href,
          content: [],
        });
        visitor.spaceLazy = true;
      }

      visitor.restoreState(this);

      visitor.visit({
        type: "array",
        content: node.children,
      });
      let counter = 0;
      for (const line of visitor.getLines()) {
        this.pushEndOfLineIfAnyContent();

        // First line gets a bullet point
        if (counter == 0) {
          this.lines[Math.max(0, this.lines.length - 1)] = "* " + line;
        } else {
          this.lines[Math.max(0, this.lines.length - 1)] = "  " + line;
        }

        counter++;
      }
      visitor.restoreState(this);
    } else {
      const visitor = new FixedWidthTextVisitor(this.width - 4);

      visitor.setState({ ...this.state, tocDepth: this.state.tocDepth + 1 });

      if (node.date) {
        visitor.choose(node.date);
        visitor.pushText(" ");
      }

      visitor.chooseChildren(node.content);
      if (node.href && !node.href.startsWith("#")) {
        visitor.link({
          type: "link",
          url: node.href,
          content: [],
        });
        visitor.spaceLazy = true;
      }
      visitor.pushLine();

      visitor.visit({
        type: "array",
        content: node.children,
      });

      const tocLen = " Table of contents ".length;
      const lines = visitor.getLines();
      const maxLength = lines.reduce(
        (prev, next) => Math.max(prev, next.length + 1),
        tocLen + 2,
      );

      const left = Math.floor((maxLength - tocLen) / 2) + 1;
      const right = maxLength - tocLen - left + 1;

      this.pushBlockContentBegin();

      this.lines[Math.max(0, this.lines.length - 1)] = "/" + "-".repeat(left) +
        " Table of contents " + "-".repeat(right) + "\\";

      for (const line of lines) {
        this.pushEndOfLineIfAnyContent();
        this.lines[Math.max(0, this.lines.length - 1)] = "| " + line +
          " ".repeat(maxLength - line.length) + "|";
      }

      this.pushEndOfLineIfAnyContent();
      this.lines[Math.max(0, this.lines.length - 1)] = "\\" +
        "-".repeat(maxLength + 1) + "/";

      visitor.restoreState(this);

      this.pushBlockContentEnd();
    }
  }

  protected override document(node: DocumentNode): void {
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
    this.beforeBlock();
    this.chooseChildren(node.content);
    this.afterBlock();
    this.horizontalRule({ type: "horizontal-rule" });
    this.beforeBlock();
    if (node.definitions) {
      this.chooseChildren(node.definitions);
    }
    this.afterBlock();
    this.pushLine();
    if (this.state.linkCount > 0) {
      this.beforeBlock();
      const max = this.state.linkCount;
      const length = Math.max(7, `[L${max}]: `.length);
      for (let i = 1; i <= max; i++) {
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
      if (this.state.imageCount == 0) {
        this.afterBlock();
      }
    }

    if (this.state.imageCount > 0) {
      if (this.state.linkCount == 0) {
        this.beforeBlock();
      }
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
    this.afterBlock();
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
        this.lines[this.lines.length - 1]!.length > 0
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
      this.lines[this.lines.length - 1]!.length > 0
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
    return this.lines[this.lines.length - 1]!;
  }

  private pushText(text: string) {
    if (this.spaceLazy && text.match(/^[\.,}\)\]]/)) {
      this.spaceLazy = false;
    }
    this.pushLazyLines();
    let index = this.lines.length - 1;
    let line: string;
    if (index >= 0) {
      line = this.lines[index]!;
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
          if (this.lines[index]!.length > this.width) {
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
        line = this.lines[index]!;
        sliceStart = sliceEnd;
      } else {
        this.lines[index] = line + slice;
        sliceStart = sliceEnd;
        if (nextChar == "") {
          break;
        }
      }

      if (this.lines[index]!.length == this.width) {
        this.pushLine();
        index++;
        line = this.lines[index]!;
      }
    } while (true);
  }

  private pushLine() {
    const lastIndex = this.lines.length - 1;
    if (lastIndex >= 0 && this.lines[lastIndex]!.endsWith(" ")) {
      const line = this.lines[lastIndex]!;
      this.lines[lastIndex] = line.trimEnd();
    }
    this.lines.push("");
  }

  private processCodeLines(rawLines: string[], diff: boolean, lineNumbers: boolean): string[] {
    if (!diff && !lineNumbers) {
      return rawLines;
    }

    interface ProcessedLine {
      text: string;
      prefix: string;     // '+', '-', or ' ' for diff
      oldNo: number | null;
      newNo: number | null;
    }

    let oldCounter = 0;
    let newCounter = 0;

    const processed: ProcessedLine[] = rawLines.map(line => {
      if (diff) {
        if (line.startsWith('+')) {
          newCounter++;
          return { text: line.slice(1), prefix: '+', oldNo: null, newNo: newCounter };
        }
        if (line.startsWith('-')) {
          oldCounter++;
          return { text: line.slice(1), prefix: '-', oldNo: oldCounter, newNo: null };
        }
        oldCounter++;
        newCounter++;
        return { text: line, prefix: ' ', oldNo: oldCounter, newNo: newCounter };
      } else {
        newCounter++;
        return { text: line, prefix: ' ', oldNo: null, newNo: newCounter };
      }
    });

    const result: string[] = [];

    if (lineNumbers && diff) {
      // Two-column line numbers for diff
      const maxOld = processed.reduce((m, p) => Math.max(m, p.oldNo ?? 0), 0);
      const maxNew = processed.reduce((m, p) => Math.max(m, p.newNo ?? 0), 0);
      const oldWidth = Math.max(String(maxOld).length, 1);
      const newWidth = Math.max(String(maxNew).length, 1);

      for (const line of processed) {
        const oldStr = line.oldNo !== null ? String(line.oldNo).padStart(oldWidth) : ' '.repeat(oldWidth);
        const newStr = line.newNo !== null ? String(line.newNo).padStart(newWidth) : ' '.repeat(newWidth);
        result.push(`${oldStr} ${newStr} ${line.prefix} ${line.text}`);
      }
    } else if (lineNumbers) {
      // Single column line numbers
      const maxLine = processed.length;
      const numWidth = String(maxLine).length;

      for (const line of processed) {
        const numStr = String(line.newNo ?? 0).padStart(numWidth);
        result.push(`${numStr} | ${line.text}`);
      }
    } else if (diff) {
      // Diff markers only, no line numbers
      for (const line of processed) {
        result.push(`${line.prefix} ${line.text}`);
      }
    }

    return result;
  }

  public getLines(): readonly string[] {
    return this.lines;
  }
}
