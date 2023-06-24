import { LOWER_ALPHA, UPPER_ALPHA, encodeBase } from "./baseEncoder.ts";
import {
  BreakNode,
  ColumnsNode,
  FormattedTextNode,
  HorizontalRuleNode,
  ListNode,
  NodeVisitor,
  ParagraphNode,
  TextNode,
} from "./deps.ts";

interface TextVisitingState {
  imageSet: Set<string>;
  images: Map<string, string>;
  linkSet: Set<string>;
  links: Map<string, string>;
  numericDepth: number;
}

export class FixedWidthTextVisitor extends NodeVisitor {
  private width: number;
  private lines: string[];
  private lazyLines: string[];
  private breakLazy: boolean;
  private state: TextVisitingState;
  constructor(width: number) {
    super();
    this.width = width;
    this.lines = [];
    this.lazyLines = [];
    this.breakLazy = false;
    this.state = {
      images: new Map(),
      imageSet: new Set(),
      links: new Map(),
      linkSet: new Set(),
      numericDepth: 0
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
    if (this.breakLazy) {
      this.lazyLines.push("");
    }
    this.breakLazy = true;
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
          this.lines.push('')
        }
        const counterText = this.counterToDepth(counter);
        const visitor = new FixedWidthTextVisitor(this.width - widthOffset);
        visitor.setState({...this.state, numericDepth: this.state.numericDepth + 1});
        visitor.visit({ type: "array", content: item.content });
        const lines = visitor.getLines();
        for (let i = 0; i < lines.length; i++) {
          if (i == 0) {
            this.lines.push(`${' '.repeat(widthOffset - counterText.length - 2)}${counterText}. ${lines[0]}`);
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
        visitor.setState({...this.state, numericDepth: 0});
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
      visitor.setState({...this.state, numericDepth: 0});
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

  private counterToDepth(counter : number): string {
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
    if (this.lazyLines.length > 0) {
      this.pushEndOfLineIfAnyContent();
    }
    if (this.breakLazy) {
      this.lines.push("");
    }
    for (const line of this.lazyLines) {
      this.lines.push(line);
    }
    this.lazyLines = [];
    this.breakLazy = false;
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
      if (line == "") {
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
      let sliceEnd = sliceStart + this.width - line.length;
      let slice = text.slice(sliceStart, sliceEnd);
      const nextChar = text.slice(sliceEnd, sliceEnd + 1);
      if (nextChar && nextChar.match(/[a-zA-Z0-9\.\?,]/)) {
        for (let i = 0; i < slice.length; i++) {
          const index = slice.length - 1 - i;
          const char = slice.charAt(index);
          if (char && char.match(/[ =\-_\/\\\n\r\t]/)) {
            sliceEnd -= i;
            slice = text.slice(sliceStart, sliceEnd);
            break;
          }
        }

        this.lines[index] = line + slice;
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
