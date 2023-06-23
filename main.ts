import {NodeVisitor, TextNode, FormattedTextNode } from './deps.ts'

export class FixedWidthTextVisitor extends NodeVisitor {
  private width: number;
  private lines: string[];
  constructor(width: number) {
    super();
    this.width = width;
    this.lines = [];
  }
  protected text(node: TextNode): void {
      this.pushText(node.text);
  }
  protected formattedText(node: FormattedTextNode): void {
      for (const line of node.text.split("\n")) {
        this.pushLine();
        this.pushText(line);
      }
  }
  private pushText(text: string) {
    let index = this.lines.length - 1;
    let line : string;
    if (index >= 0) {
      line = this.lines[index];
    } else {
      line = '';
      index = 0;
    }

    let sliceStart = 0;
    do {
      if (line == '') {
        // skip white space
        while (true) {
          const nextChar = text.slice(sliceStart, sliceStart + 1);
          if (nextChar == '') {
            break;
          }
          if (nextChar == ' ') {
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
            slice = text.slice(sliceStart, sliceEnd)
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
        if (nextChar == '') {
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
    if (lastIndex >= 0 && this.lines[lastIndex].endsWith(' ')) {
      const line = this.lines[lastIndex];
      this.lines[lastIndex] = line.trimEnd();
    }
    this.lines.push("");
  }
  public getLines() : readonly string[] {
    return this.lines;
  }
}

