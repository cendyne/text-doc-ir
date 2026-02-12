import { expect, test } from "bun:test";
import { FixedWidthTextVisitor } from "../main.ts";
import type { LinkNode } from "document-ir";

/* cSpell:disable */

test("lorem ipsum 40", () => {
  const visitor = new FixedWidthTextVisitor(40);
  visitor.visit({
    type: "text",
    text:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.",
  });
  expect(visitor.getLines()).toEqual([
    "Lorem ipsum dolor sit amet, consectetur",
    "adipiscing elit, sed do eiusmod tempor",
    "incididunt ut labore et dolore magna",
    "aliqua. Ut enim ad minim veniam, quis",
    "nostrud exercitation ullamco laboris",
    "nisi ut aliquip ex ea commodo consequat.",
    "Duis aute irure dolor in reprehenderit",
    "in voluptate velit esse cillum dolore eu",
    "fugiat nulla pariatur. Excepteur sint",
    "occaecat cupidatat non proident, sunt in",
    "culpa qui officia deserunt mollit anim",
    "id est laborum.",
  ]);
});

test("Base32 Force break", () => {
  const visitor = new FixedWidthTextVisitor(40);
  visitor.visit({
    type: "text",
    text:
      "KRUGKIDROVUWG2ZAMJZG653OEBTG66BANJ2W24DTEBXXMZLSEB2GQZJANRQXU6JAMRXWOLQ=",
  });
  expect(visitor.getLines()).toEqual([
    "KRUGKIDROVUWG2ZAMJZG653OEBTG66BANJ2W24DT",
    "EBXXMZLSEB2GQZJANRQXU6JAMRXWOLQ=",
  ]);
});

test("Lorem 1", () => {
  const visitor = new FixedWidthTextVisitor(40);
  visitor.visit({
    type: "text",
    text: "Lorem ipsum dolor sit amet, consectetur.",
  });
  expect(visitor.getLines()).toEqual([
    "Lorem ipsum dolor sit amet, consectetur.",
  ]);
});

test("Lorem 2", () => {
  const visitor = new FixedWidthTextVisitor(40);
  visitor.visit({
    type: "text",
    text:
      "Lorem ipsum dolor sit amet, consectetur. Lorem elsum dolor sit amet, consectetur.",
  });
  expect(visitor.getLines()).toEqual([
    "Lorem ipsum dolor sit amet, consectetur.",
    "Lorem elsum dolor sit amet, consectetur.",
  ]);
});

test("Lorem 3", () => {
  const visitor = new FixedWidthTextVisitor(40);
  visitor.visit({
    type: "text",
    text:
      "Lorem ipsum dolor sit amet, consectetur. Lorem elsum dolor sit amet, consectetur. Lorem ulsum dolor sit amet, consectetur.",
  });
  expect(visitor.getLines()).toEqual([
    "Lorem ipsum dolor sit amet, consectetur.",
    "Lorem elsum dolor sit amet, consectetur.",
    "Lorem ulsum dolor sit amet, consectetur.",
  ]);
});

test("Break long urls", () => {
  const visitor = new FixedWidthTextVisitor(40);
  visitor.visit({
    type: "formatted-text",
    text:
      "https://cendyne.dev/posts/2023-06-20-twitters-bot-problem-is-getting-weird-with-chatgpt.html\nhttps://cendyne.dev/posts/2023-05-29-a-path-to-niche-skillsets-and-community.html\nhttps://cendyne.dev/posts/2023-05-11-reverse-centaur-chickenization-chatgpt.html\nhttps://www.reddit.com/r/flipperzero/comments/14c8c6j/flipper_devices_getting_into_nfts/\nhttps://www.reddit.com/r/flipperzero/comments/14bh1qo/flipper_developers_confirm_flipper_inc_is_now_in/",
  });
  expect(visitor.getLines()).toEqual([
    "https://cendyne.dev/posts/2023-06-20-",
    "twitters-bot-problem-is-getting-weird-",
    "with-chatgpt.html",
    "https://cendyne.dev/posts/2023-05-29-a-",
    "path-to-niche-skillsets-and-",
    "community.html",
    "https://cendyne.dev/posts/2023-05-11-",
    "reverse-centaur-chickenization-",
    "chatgpt.html",
    "https://www.reddit.com/r/flipperzero/",
    "comments/14c8c6j/flipper_devices_getting",
    "_into_nfts/",
    "https://www.reddit.com/r/flipperzero/",
    "comments/14bh1qo/flipper_developers_",
    "confirm_flipper_inc_is_now_in/",
  ]);
});

test("Formatted Text with leading space", () => {
  const visitor = new FixedWidthTextVisitor(80);
  visitor.visit({
    type: "formatted-text",
    text:
      'GET https://c.cdyn.dev/PFCc64ah - Ok @ 1/22/2023, 5:21:33 PM\n  (log) Got Range request: 0 - : {"range":{"offset":0}}\n  (log) Range result: \'bytes 0-540152/540153\'\nGET https://c.cdyn.dev/PFCc64ah - Ok @ 1/22/2023, 5:21:36 PM\n  (log) Got Range request: 491520 - : {"range":{"offset":491520}}\n  (log) Range result: \'bytes 491520-540152/540153\'',
  });
  expect(visitor.getLines()).toEqual([
    "GET https://c.cdyn.dev/PFCc64ah - Ok @ 1/22/2023, 5:21:33 PM",
    '  (log) Got Range request: 0 - : {"range":{"offset":0}}',
    "  (log) Range result: 'bytes 0-540152/540153'",
    "GET https://c.cdyn.dev/PFCc64ah - Ok @ 1/22/2023, 5:21:36 PM",
    '  (log) Got Range request: 491520 - : {"range":{"offset":491520}}',
    "  (log) Range result: 'bytes 491520-540152/540153'",
  ]);
});

test("Styling is ignored", () => {
  const visitor = new FixedWidthTextVisitor(40);
  visitor.visit({
    type: "array",
    content: [
      { type: "text", text: "Lorem ipsum dolor sit " },
      {
        type: "definition-reference",
        content: [
          { type: "text", text: "amet" },
        ],
        definition: {
          abbreviation: [{ type: "text", text: "amet" }],
          key: "amet",
        },
      },
      { type: "text", text: ", " },
      {
        type: "italic",
        content: [
          { type: "text", text: "consectetur." },
        ],
      },
    ],
  });
  expect(visitor.getLines()).toEqual([
    "Lorem ipsum dolor sit amet, consectetur.",
  ]);
});

test("Spaces are not forgotten 1", () => {
  const visitor = new FixedWidthTextVisitor(40);
  visitor.visit({
    type: "array",
    content: [
      { type: "text", text: "Lorem ipsum dolor sit amet, " },
      { type: "text", text: "consectetur." },
    ],
  });
  expect(visitor.getLines()).toEqual([
    "Lorem ipsum dolor sit amet, consectetur.",
  ]);
});

test("Spaces are not forgotten 2", () => {
  const visitor = new FixedWidthTextVisitor(40);
  visitor.visit({
    type: "array",
    content: [
      { type: "text", text: "Lorem ipsum dolor sit amet," },
      { type: "text", text: " consectetur." },
    ],
  });
  expect(visitor.getLines()).toEqual([
    "Lorem ipsum dolor sit amet, consectetur.",
  ]);
});

test("Explicit Break 1", () => {
  const visitor = new FixedWidthTextVisitor(40);
  visitor.visit({
    type: "array",
    content: [
      { type: "text", text: "Lorem ipsum dolor sit amet," },
      { type: "break" },
      { type: "text", text: " consectetur." },
    ],
  });
  expect(visitor.getLines()).toEqual([
    "Lorem ipsum dolor sit amet,",
    "consectetur.",
  ]);
});

test("Explicit Break 2", () => {
  const visitor = new FixedWidthTextVisitor(40);
  visitor.visit({
    type: "array",
    content: [
      { type: "text", text: "Lorem ipsum dolor sit amet." },
      { type: "break" },
    ],
  });
  expect(visitor.getLines()).toEqual([
    "Lorem ipsum dolor sit amet.",
  ]);
});

test("Explicit Break 3", () => {
  const visitor = new FixedWidthTextVisitor(40);
  visitor.visit({
    type: "array",
    content: [
      { type: "break" },
      { type: "text", text: "Lorem ipsum dolor sit amet." },
    ],
  });
  expect(visitor.getLines()).toEqual([
    "Lorem ipsum dolor sit amet.",
  ]);
});

test("Explicit Break 4", () => {
  const visitor = new FixedWidthTextVisitor(40);
  visitor.visit({
    type: "array",
    content: [
      { type: "text", text: "Lorem ipsum dolor sit amet," },
      { type: "break" },
      { type: "break" },
      { type: "text", text: "consectetur." },
    ],
  });
  expect(visitor.getLines()).toEqual([
    "Lorem ipsum dolor sit amet,",
    "",
    "consectetur.",
  ]);
});

test("Explicit Break 5", () => {
  const visitor = new FixedWidthTextVisitor(40);
  visitor.visit({
    type: "array",
    content: [
      { type: "text", text: "Lorem ipsum dolor sit amet," },
      { type: "break" },
      { type: "break" },
      { type: "break" },
      { type: "text", text: "consectetur." },
    ],
  });
  expect(visitor.getLines()).toEqual([
    "Lorem ipsum dolor sit amet,",
    "",
    "",
    "consectetur.",
  ]);
});

test("Horizontal Rules", () => {
  const visitor = new FixedWidthTextVisitor(40);
  visitor.visit({
    type: "array",
    content: [
      {
        type: "paragraph",
        content: [{ type: "text", text: "Lorem ipsum dolor sit amet," }],
      },
      { type: "horizontal-rule" },
      {
        type: "paragraph",
        content: [{ type: "text", text: " consectetur." }],
      },
    ],
  });
  expect(visitor.getLines()).toEqual([
    "Lorem ipsum dolor sit amet,",
    "",
    "----------------------------------------",
    "",
    "consectetur.",
  ]);
});

test("First and only paragraph does not add blank lines", () => {
  const visitor = new FixedWidthTextVisitor(40);
  visitor.visit({
    type: "array",
    content: [
      {
        type: "paragraph",
        content: [
          {
            type: "text",
            text:
              "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
          },
        ],
      },
    ],
  });
  expect(visitor.getLines()).toEqual([
    "Lorem ipsum dolor sit amet, consectetur",
    "adipiscing elit, sed do eiusmod tempor",
    "incididunt ut labore et dolore magna",
    "aliqua.",
  ]);
});

test("Paragraphs have lines between", () => {
  const visitor = new FixedWidthTextVisitor(40);
  visitor.visit({
    type: "array",
    content: [
      {
        type: "paragraph",
        content: [
          {
            type: "text",
            text:
              "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
          },
        ],
      },
      {
        type: "paragraph",
        content: [
          {
            type: "text",
            text:
              "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
          },
        ],
      },
    ],
  });
  expect(visitor.getLines()).toEqual([
    "Lorem ipsum dolor sit amet, consectetur",
    "adipiscing elit, sed do eiusmod tempor",
    "incididunt ut labore et dolore magna",
    "aliqua.",
    "",
    "Lorem ipsum dolor sit amet, consectetur",
    "adipiscing elit, sed do eiusmod tempor",
    "incididunt ut labore et dolore magna",
    "aliqua.",
  ]);
});

test("Paragraphs and horizontal rule have lines between", () => {
  const visitor = new FixedWidthTextVisitor(40);
  visitor.visit({
    type: "array",
    content: [
      {
        type: "paragraph",
        content: [
          {
            type: "text",
            text:
              "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
          },
        ],
      },
      { type: "horizontal-rule" },
      {
        type: "paragraph",
        content: [
          {
            type: "text",
            text:
              "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
          },
        ],
      },
    ],
  });
  expect(visitor.getLines()).toEqual([
    "Lorem ipsum dolor sit amet, consectetur",
    "adipiscing elit, sed do eiusmod tempor",
    "incididunt ut labore et dolore magna",
    "aliqua.",
    "",
    "----------------------------------------",
    "",
    "Lorem ipsum dolor sit amet, consectetur",
    "adipiscing elit, sed do eiusmod tempor",
    "incididunt ut labore et dolore magna",
    "aliqua.",
  ]);
});

test("Numbered list - 1", () => {
  const visitor = new FixedWidthTextVisitor(40);
  visitor.visit({
    type: "array",
    content: [
      {
        type: "list",
        style: "ordered",
        content: [
          {
            type: "list-item",
            content: [
              {
                type: "paragraph",
                content: [{
                  type: "text",
                  text: "Lorem ipsum dolor sit amet,",
                }],
              },
              { type: "horizontal-rule" },
              {
                type: "paragraph",
                content: [{ type: "text", text: " consectetur." }],
              },
            ],
          },
          {
            type: "list-item",
            content: [
              {
                type: "text",
                text:
                  "https://cendyne.dev/posts/2023-06-20-twitters-bot-problem-is-getting-weird-with-chatgpt.html",
              },
            ],
          },
        ],
      },
    ],
  });
  expect(visitor.getLines()).toEqual([
    "  1. Lorem ipsum dolor sit amet,",
    "",
    "     -----------------------------------",
    "",
    "     consectetur.",
    "",
    "  2. https://cendyne.dev/posts/2023-06-",
    "     20-twitters-bot-problem-is-getting-",
    "     weird-with-chatgpt.html",
  ]);
});

test("Numbered list - 2", () => {
  const visitor = new FixedWidthTextVisitor(40);
  visitor.visit({
    type: "array",
    content: [
      {
        type: "list",
        style: "ordered",
        content: [
          {
            type: "list-item",
            content: [
              {
                type: "paragraph",
                content: [{
                  type: "text",
                  text:
                    "Lorem ipsum dolor sit amet, consectetur adipiscing eli.",
                }],
              },
              {
                type: "list",
                style: "ordered",
                content: [
                  {
                    type: "list-item",
                    content: [
                      {
                        type: "paragraph",
                        content: [{
                          type: "text",
                          text:
                            "Lorem ipsum dolor sit amet, consectetur adipiscing eli.",
                        }],
                      },
                      {
                        type: "paragraph",
                        content: [{
                          type: "text",
                          text:
                            "Lorem ipsum dolor sit amet, consectetur adipiscing eli.",
                        }],
                      },
                      {
                        type: "list",
                        style: "ordered",
                        content: [
                          {
                            type: "list-item",
                            content: [
                              {
                                type: "paragraph",
                                content: [{
                                  type: "text",
                                  text:
                                    "Lorem ipsum dolor sit amet, consectetur adipiscing eli.",
                                }],
                              },
                              {
                                type: "paragraph",
                                content: [{
                                  type: "text",
                                  text:
                                    "Lorem ipsum dolor sit amet, consectetur adipiscing eli.",
                                }],
                              },
                            ],
                          },
                        ],
                      },
                    ],
                  },
                ],
              },
            ],
          },
          {
            type: "list-item",
            content: [
              {
                type: "paragraph",
                content: [{
                  type: "text",
                  text:
                    "Lorem ipsum dolor sit amet, consectetur adipiscing eli.",
                }],
              },
            ],
          },
        ],
      },
    ],
  });
  expect(visitor.getLines()).toEqual([
    "  1. Lorem ipsum dolor sit amet,",
    "     consectetur adipiscing eli.",
    "",
    "       A. Lorem ipsum dolor sit amet,",
    "          consectetur adipiscing eli.",
    "",
    "          Lorem ipsum dolor sit amet,",
    "          consectetur adipiscing eli.",
    "",
    "            a. Lorem ipsum dolor sit",
    "               amet, consectetur",
    "               adipiscing eli.",
    "",
    "               Lorem ipsum dolor sit",
    "               amet, consectetur",
    "               adipiscing eli.",
    "",
    "  2. Lorem ipsum dolor sit amet,",
    "     consectetur adipiscing eli.",
  ]);
});

test("Unordered list", () => {
  const visitor = new FixedWidthTextVisitor(40);
  visitor.visit({
    type: "array",
    content: [
      {
        type: "list",
        style: "unordered",
        content: [
          {
            type: "list-item",
            content: [
              {
                type: "paragraph",
                content: [{
                  type: "text",
                  text:
                    "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
                }],
              },
            ],
          },
          {
            type: "list-item",
            content: [
              {
                type: "text",
                text:
                  "KRUGKIDROVUWG2ZAMJZG653OEBTG66BANJ2W24DTEBXXMZLSEB2GQZJANRQXU6JAMRXWOLQ",
              },
            ],
          },
        ],
      },
    ],
  });
  expect(visitor.getLines()).toEqual([
    "  *  Lorem ipsum dolor sit amet,",
    "     consectetur adipiscing elit, sed do",
    "     eiusmod tempor incididunt ut labore",
    "     et dolore magna aliqua.",
    "  *  KRUGKIDROVUWG2ZAMJZG653OEBTG66BANJ2",
    "     W24DTEBXXMZLSEB2GQZJANRQXU6JAMRXWOL",
    "     Q",
  ]);
});

test("Columns 1", () => {
  const visitor = new FixedWidthTextVisitor(40);
  visitor.visit({
    type: "columns",
    "column-count": 1,
    columns: [
      [{
        type: "text",
        text:
          "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
      }],
    ],
  });
  expect(visitor.getLines()).toEqual([
    "Lorem ipsum dolor sit amet, consectetur",
    "adipiscing elit, sed do eiusmod tempor",
    "incididunt ut labore et dolore magna",
    "aliqua.",
  ]);
});

test("Columns 2 - 1", () => {
  const visitor = new FixedWidthTextVisitor(40);
  visitor.visit({
    type: "columns",
    "column-count": 2,
    columns: [
      [{
        type: "text",
        text:
          "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
      }],
      [{
        type: "text",
        text:
          "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
      }],
    ],
  });
  expect(visitor.getLines()).toEqual([
    "Lorem ipsum dolor    Lorem ipsum dolor",
    "sit amet,            sit amet,",
    "consectetur          consectetur",
    "adipiscing elit,     adipiscing elit,",
    "sed do eiusmod       sed do eiusmod",
    "tempor incididunt    tempor incididunt",
    "ut labore et dolore  ut labore et dolore",
    "magna aliqua.        magna aliqua.",
  ]);
});

test("Columns 2 - 2", () => {
  const visitor = new FixedWidthTextVisitor(40);
  visitor.visit({
    type: "columns",
    "column-count": 2,
    columns: [
      [{ type: "text", text: "Hello world" }],
      [{
        type: "text",
        text:
          "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
      }],
    ],
  });
  expect(visitor.getLines()).toEqual([
    "Hello world          Lorem ipsum dolor",
    "                     sit amet,",
    "                     consectetur",
    "                     adipiscing elit,",
    "                     sed do eiusmod",
    "                     tempor incididunt",
    "                     ut labore et dolore",
    "                     magna aliqua.",
  ]);
});

test("Columns 2 - 3", () => {
  const visitor = new FixedWidthTextVisitor(40);
  visitor.visit({
    type: "columns",
    "column-count": 2,
    columns: [
      [{
        type: "text",
        text:
          "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
      }],
      [{ type: "text", text: "Hello world" }],
    ],
  });
  expect(visitor.getLines()).toEqual([
    "Lorem ipsum dolor    Hello world",
    "sit amet,",
    "consectetur",
    "adipiscing elit,",
    "sed do eiusmod",
    "tempor incididunt",
    "ut labore et dolore",
    "magna aliqua.",
  ]);
});

test("Emoji - 1", () => {
  const visitor = new FixedWidthTextVisitor(40);
  visitor.visit({
    type: "paragraph",
    content: [
      { type: "text", text: "Lorem ipsum dolor " },
      { type: "emoji", alt: "oooh", url: "https://e.example/e" },
      { type: "text", text: "sit amet." },
      { type: "emoji", alt: "oooh", url: "https://e.example/e" },
    ],
  });
  expect(visitor.getLines()).toEqual([
    "Lorem ipsum dolor [I1: oooh] sit amet.",
    "[I1: oooh]",
  ]);
});

test("Emoji - 2", () => {
  const visitor = new FixedWidthTextVisitor(40);
  visitor.visit({
    type: "paragraph",
    content: [
      { type: "emoji", alt: "oooh", url: "https://e.example/e" },
      { type: "emoji", alt: "aaah", url: "https://e.example/j" },
    ],
  });
  expect(visitor.getLines()).toEqual([
    "[I1: oooh] [I2: aaah]",
  ]);
});

test("Image - 1", () => {
  const visitor = new FixedWidthTextVisitor(40);
  visitor.visit({
    type: "paragraph",
    content: [
      { type: "image", alt: "oooh", url: "https://e.example/e" },
      { type: "image", alt: "oooh", url: "https://e.example/e" },
    ],
  });
  expect(visitor.getLines()).toEqual([
    "[I1: oooh]",
    "",
    "[I1: oooh]",
  ]);
});

test("Image - 2", () => {
  const visitor = new FixedWidthTextVisitor(40);
  visitor.visit({
    type: "paragraph",
    content: [
      { type: "image", alt: "oooh", url: "https://e.example/e" },
      { type: "image", alt: "aaah", url: "https://e.example/j" },
    ],
  });
  expect(visitor.getLines()).toEqual([
    "[I1: oooh]",
    "",
    "[I2: aaah]",
  ]);
});

test("Figure Image - 1", () => {
  const visitor = new FixedWidthTextVisitor(40);
  visitor.visit({
    type: "figure-image",
    alt: "oooh",
    url: "https://e.example/e",
    width: 620,
    height: 920,
    content: [
      { type: "text", text: "Hello" },
    ],
  });
  expect(visitor.getLines()).toEqual([
    "[I1: oooh]",
    "",
    "Hello",
  ]);
});

test("Figure Image - 2", () => {
  const visitor = new FixedWidthTextVisitor(40);
  visitor.visit({
    type: "array",
    content: [
      {
        type: "figure-image",
        alt: "oooh",
        url: "https://e.example/e",
        width: 620,
        height: 920,
        content: [
          { type: "text", text: "Hello" },
        ],
      },
      {
        type: "figure-image",
        alt: "oooh",
        url: "https://e.example/e",
        width: 620,
        height: 920,
        content: [
          { type: "text", text: "Hello" },
        ],
      },
    ],
  });
  expect(visitor.getLines()).toEqual([
    "[I1: oooh]",
    "",
    "Hello",
    "",
    "[I1: oooh]",
    "",
    "Hello",
  ]);
});

test("Link - 1", () => {
  const visitor = new FixedWidthTextVisitor(40);
  visitor.visit({
    type: "paragraph",
    content: [
      { type: "text", text: "Lorem " },
      {
        type: "link",
        url: "https://e.example/e",
        content: [{
          type: "text",
          text: "ipsum dolor",
        }],
      },
      { type: "text", text: "sit amet." },
    ],
  });
  expect(visitor.getLines()).toEqual([
    "Lorem ipsum dolor [L1] sit amet.",
  ]);
});

test("Link - 2", () => {
  const visitor = new FixedWidthTextVisitor(40);
  visitor.visit({
    type: "paragraph",
    content: [
      { type: "text", text: "Lorem " },
      {
        type: "link",
        url: "https://e.example/e",
        content: [{
          type: "text",
          text: "ipsum dolor",
        }],
      },
      { type: "text", text: " " },
      {
        type: "link",
        url: "https://e.example/j",
        content: [{
          type: "text",
          text: "sit",
        }],
      },
      { type: "text", text: "amet." },
    ],
  });
  expect(visitor.getLines()).toEqual([
    "Lorem ipsum dolor [L1] sit [L2] amet.",
  ]);
});

test("Link - 3", () => {
  const visitor = new FixedWidthTextVisitor(40);
  visitor.visit({
    type: "paragraph",
    content: [
      { type: "text", text: "Lorem " },
      {
        type: "link",
        url: "https://e.example/e",
        content: [{
          type: "text",
          text: "ipsum dolor",
        }],
      },
      { type: "text", text: "." },
    ],
  });
  expect(visitor.getLines()).toEqual([
    "Lorem ipsum dolor [L1].",
  ]);
});

test("Link - 4", () => {
  const visitor = new FixedWidthTextVisitor(40);
  visitor.visit({
    type: "paragraph",
    content: [
      { type: "text", text: "Lorem (" },
      {
        type: "link",
        url: "https://e.example/e",
        content: [],
      },
      { type: "text", text: ")" },
    ],
  });
  expect(visitor.getLines()).toEqual([
    "Lorem ([L1])",
  ]);
});

test("Video", () => {
  const visitor = new FixedWidthTextVisitor(40);
  visitor.visit({
    type: "paragraph",
    content: [
      { type: "text", text: "Lorem " },
      {
        type: "video",
        poster: "https://e.example/e",
        alt: "aaa",
        mp4: "https://e.example/e",
      },
    ],
  });
  expect(visitor.getLines()).toEqual([
    "Lorem",
    "[I1: Video: aaa]",
  ]);
});

test("Youtube", () => {
  const visitor = new FixedWidthTextVisitor(40);
  visitor.visit({
    type: "paragraph",
    content: [
      { type: "text", text: "Lorem " },
      {
        type: "embed",
        content: {
          type: "youtube",
          id: "aaaaaa",
        },
      },
    ],
  });
  expect(visitor.getLines()).toEqual([
    "Lorem Youtube Video [L1]",
  ]);
});

test("Header - 1", () => {
  const visitor = new FixedWidthTextVisitor(40);
  visitor.visit({
    type: "array",
    content: [
      {
        type: "header",
        level: 1,
        content: [{ type: "text", text: "Lorem Ipsum" }],
      },
    ],
  });
  expect(visitor.getLines()).toEqual([
    "Lorem Ipsum",
    "===========",
  ]);
});

test("Header - 2", () => {
  const visitor = new FixedWidthTextVisitor(40);
  visitor.visit({
    type: "array",
    content: [
      {
        type: "header",
        level: 1,
        content: [{ type: "text", text: "Lorem Ipsum" }],
      },
      {
        type: "paragraph",
        content: [{ type: "text", text: "dolor sit amet." }],
      },
    ],
  });
  expect(visitor.getLines()).toEqual([
    "Lorem Ipsum",
    "===========",
    "",
    "dolor sit amet.",
  ]);
});

test("Header - 3", () => {
  const visitor = new FixedWidthTextVisitor(40);
  visitor.visit({
    type: "array",
    content: [
      {
        type: "header",
        level: 1,
        content: [{ type: "text", text: "Lorem Ipsum" }],
      },
      {
        type: "paragraph",
        content: [{ type: "text", text: "dolor sit amet." }],
      },
      {
        type: "header",
        level: 2,
        content: [{ type: "text", text: "Ut enim ad minim veniam" }],
      },
      {
        type: "paragraph",
        content: [{
          type: "text",
          text:
            "Quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.",
        }],
      },
    ],
  });
  expect(visitor.getLines()).toEqual([
    "Lorem Ipsum",
    "===========",
    "",
    "dolor sit amet.",
    "",
    "Ut enim ad minim veniam",
    "-----------------------",
    "",
    "Quis nostrud exercitation ullamco",
    "laboris nisi ut aliquip ex ea commodo",
    "consequat.",
  ]);
});

test("Regression - 1", () => {
  const visitor = new FixedWidthTextVisitor(80);
  visitor.visit({
    type: "array",
    content: [
      {
        type: "paragraph",
        content: Array(82).fill("").map((_v, i) => {
          return {
            type: "link",
            url: `https://${i}`,
            content: [{ type: "text", text: "" }],
          } as LinkNode;
        }),
      },
      {
        type: "paragraph",
        content: [
          {
            type: "text",
            text:
              "When you see a custom anime cat girl speaking to you while creating open source 3D drivers for AArch64 Apple hardware, or read ",
          },
          {
            type: "link",
            content: [
              {
                type: "text",
                text: "How to use a fork of the Go compiler with Nix",
              },
            ],
            url: "https://xeiaso.net/blog/go-fork-nix",
          },
          {
            type: "text",
            text: " (",
          },
          {
            type: "link",
            content: [
              {
                type: "text",
                text: "archived",
              },
            ],
            url: "https://archive.is/kwiTg",
          },
          {
            type: "text",
            text:
              ") by an orca dragon, shark, and a fox girl: do not make fun of it. These designs are personally created and represent either the self image of the author or the image they wish to be seen as, and are ",
          },
          {
            type: "bold",
            content: [
              {
                type: "text",
                text: "very different",
              },
            ],
          },
          {
            type: "text",
            text: " from those that develop dysphoria or dysmorphia ",
          },
          {
            type: "bold",
            content: [
              {
                type: "italic",
                content: [
                  {
                    type: "text",
                    text: "because of technology or marketing",
                  },
                ],
              },
            ],
          },
          {
            type: "text",
            text:
              " released by corporations. Unlike young girls that that feel body shame over ",
          },
          {
            type: "link",
            content: [
              {
                type: "text",
                text: "not having a thin figure like a Barbie doll",
              },
            ],
            url: "https://www.teenvogue.com/story/barbie-body-image-study",
          },
          {
            type: "text",
            text: " (",
          },
          {
            type: "link",
            content: [
              {
                type: "text",
                text: "archived",
              },
            ],
            url: "https://archive.is/qB1GH",
          },
          {
            type: "text",
            text:
              ",) these personal images are carefully prepared with significant introspection.",
          },
        ],
      },
    ],
  });
  expect(visitor.getLines()).toEqual([
    "[L1] [L2] [L3] [L4] [L5] [L6] [L7] [L8] [L9] [L10] [L11] [L12] [L13] [L14] [L15]",
    "[L16] [L17] [L18] [L19] [L20] [L21] [L22] [L23] [L24] [L25] [L26] [L27] [L28]",
    "[L29] [L30] [L31] [L32] [L33] [L34] [L35] [L36] [L37] [L38] [L39] [L40] [L41]",
    "[L42] [L43] [L44] [L45] [L46] [L47] [L48] [L49] [L50] [L51] [L52] [L53] [L54]",
    "[L55] [L56] [L57] [L58] [L59] [L60] [L61] [L62] [L63] [L64] [L65] [L66] [L67]",
    "[L68] [L69] [L70] [L71] [L72] [L73] [L74] [L75] [L76] [L77] [L78] [L79] [L80]",
    "[L81] [L82]",
    "",
    "When you see a custom anime cat girl speaking to you while creating open source",
    "3D drivers for AArch64 Apple hardware, or read How to use a fork of the Go",
    "compiler with Nix [L83] (archived [L84]) by an orca dragon, shark, and a fox",
    "girl: do not make fun of it. These designs are personally created and represent",
    "either the self image of the author or the image they wish to be seen as, and",
    "are very different from those that develop dysphoria or dysmorphia because of",
    "technology or marketing released by corporations. Unlike young girls that that",
    "feel body shame over not having a thin figure like a Barbie doll [L85] (archived",
    "[L86],) these personal images are carefully prepared with significant",
    "introspection.",
  ]);
});

test("Strike through", () => {
  const visitor = new FixedWidthTextVisitor(40);
  visitor.visit({
    type: "paragraph",
    content: [
      { type: "text", text: "Lorem ipsum " },
      {
        type: "strike-through",
        content: [{ type: "text", text: "dolor sit" }],
      },
      { type: "text", text: "amet." },
    ],
  });
  expect(visitor.getLines()).toEqual([
    "Lorem ipsum (Strike through: dolor sit)",
    "amet.",
  ]);
});

test("Block Quote", () => {
  const visitor = new FixedWidthTextVisitor(40);
  visitor.visit({
    type: "block-quote",
    content: [
      {
        type: "paragraph",
        content: [
          {
            type: "text",
            text:
              "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
          },
        ],
      },
    ],
  });
  expect(visitor.getLines()).toEqual([
    "> Lorem ipsum dolor sit amet,",
    "> consectetur adipiscing elit, sed do",
    "> eiusmod tempor incididunt ut labore et",
    "> dolore magna aliqua.",
  ]);
});

test("Warning", () => {
  const visitor = new FixedWidthTextVisitor(40);
  visitor.visit({
    type: "warning",
    content: [
      {
        type: "paragraph",
        content: [
          {
            type: "text",
            text:
              "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
          },
        ],
      },
    ],
  });
  expect(visitor.getLines()).toEqual([
    "| Lorem ipsum dolor sit amet,",
    "| consectetur adipiscing elit, sed do",
    "| eiusmod tempor incididunt ut labore et",
    "| dolore magna aliqua.",
  ]);
});

test("Note", () => {
  const visitor = new FixedWidthTextVisitor(40);
  visitor.visit({
    type: "note",
    content: [
      {
        type: "text",
        text:
          "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
      },
    ],
  });
  expect(visitor.getLines()).toEqual([
    "Note: Lorem ipsum dolor sit amet,",
    "consectetur adipiscing elit, sed do",
    "eiusmod tempor incididunt ut labore et",
    "dolore magna aliqua.",
  ]);
});

test("Center", () => {
  const visitor = new FixedWidthTextVisitor(40);
  visitor.visit({
    type: "center",
    content: [
      {
        type: "paragraph",
        content: [
          {
            type: "text",
            text:
              "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
          },
        ],
      },
    ],
  });
  expect(visitor.getLines()).toEqual([
    "Lorem ipsum dolor sit amet, consectetur",
    " adipiscing elit, sed do eiusmod tempor",
    "  incididunt ut labore et dolore magna",
    "                aliqua.",
  ]);
});

test("High Tech Alert", () => {
  const visitor = new FixedWidthTextVisitor(40);
  visitor.visit({
    type: "high-tech-alert",
    warning: [
      {
        type: "text",
        text: "Lorem ipsum dolor sit amet",
      },
    ],
    content: [
      {
        type: "text",
        text:
          "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
      },
    ],
  });
  expect(visitor.getLines()).toEqual([
    "/--------------------------------------\\",
    "|      Lorem ipsum dolor sit amet      |",
    "|--------------------------------------|",
    "| Lorem ipsum dolor sit amet,          |",
    "| consectetur adipiscing elit, sed do  |",
    "| eiusmod tempor incididunt ut labore  |",
    "| et dolore magna aliqua.              |",
    "\\--------------------------------------/",
  ]);
});

test("Block Quote", () => {
  const visitor = new FixedWidthTextVisitor(40);
  visitor.visit({
    type: "quote",
    name: "Soatok",
    icon: "https://e.example/e",
    content: [
      {
        type: "paragraph",
        content: [
          {
            type: "text",
            text:
              "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
          },
        ],
      },
    ],
  });
  expect(visitor.getLines()).toEqual([
    "> Soatok",
    ">",
    "> Lorem ipsum dolor sit amet,",
    "> consectetur adipiscing elit, sed do",
    "> eiusmod tempor incididunt ut labore et",
    "> dolore magna aliqua.",
  ]);
});

test("Bubble left", () => {
  const visitor = new FixedWidthTextVisitor(40);
  visitor.visit({
    type: "bubble",
    orientation: "left",
    content: [
      {
        type: "paragraph",
        content: [
          {
            type: "text",
            text:
              "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
          },
        ],
      },
    ],
  });
  expect(visitor.getLines()).toEqual([
    "| Lorem ipsum dolor sit amet,",
    "| consectetur adipiscing elit, sed do",
    "| eiusmod tempor incididunt ut labore",
    "| et dolore magna aliqua.",
  ]);
});

test("Bubble Right", () => {
  const visitor = new FixedWidthTextVisitor(40);
  visitor.visit({
    type: "bubble",
    orientation: "right",
    content: [
      {
        type: "paragraph",
        content: [
          {
            type: "text",
            text:
              "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
          },
        ],
      },
    ],
  });
  expect(visitor.getLines()).toEqual([
    "           Lorem ipsum dolor sit amet, |",
    "   consectetur adipiscing elit, sed do |",
    "   eiusmod tempor incididunt ut labore |",
    "               et dolore magna aliqua. |",
  ]);
});

test("Sticker Right", () => {
  const visitor = new FixedWidthTextVisitor(40);
  visitor.visit({
    type: "sticker",
    orientation: "right",
    character: "cendyne",
    name: "hello",
    content: [
      {
        type: "paragraph",
        content: [
          {
            type: "text",
            text:
              "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
          },
        ],
      },
    ],
  });
  expect(visitor.getLines()).toEqual([
    "/----------------------[cendyne: hello]\\",
    "|          Lorem ipsum dolor sit amet, |",
    "|  consectetur adipiscing elit, sed do |",
    "|  eiusmod tempor incididunt ut labore |",
    "|              et dolore magna aliqua. |",
    "\\--------------------------------------/",
  ]);
});

test("Sticker Left", () => {
  const visitor = new FixedWidthTextVisitor(40);
  visitor.visit({
    type: "sticker",
    orientation: "left",
    character: "cendyne",
    name: "hello",
    content: [
      {
        type: "paragraph",
        content: [
          {
            type: "text",
            text:
              "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
          },
        ],
      },
    ],
  });
  expect(visitor.getLines()).toEqual([
    "/[cendyne: hello]----------------------\\",
    "| Lorem ipsum dolor sit amet,          |",
    "| consectetur adipiscing elit, sed do  |",
    "| eiusmod tempor incididunt ut labore  |",
    "| et dolore magna aliqua.              |",
    "\\--------------------------------------/",
  ]);
});

test("Sticker Center", () => {
  const visitor = new FixedWidthTextVisitor(40);
  visitor.visit({
    type: "sticker",
    orientation: "center",
    character: "cendyne",
    name: "hello",
    content: [
      {
        type: "paragraph",
        content: [
          {
            type: "text",
            text:
              "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
          },
        ],
      },
    ],
  });
  expect(visitor.getLines()).toEqual([
    "/-----------[cendyne: hello]-----------\\",
    "|      Lorem ipsum dolor sit amet,     |",
    "|  consectetur adipiscing elit, sed do |",
    "|  eiusmod tempor incididunt ut labore |",
    "|        et dolore magna aliqua.       |",
    "\\--------------------------------------/",
  ]);
});

test("Definition", () => {
  const visitor = new FixedWidthTextVisitor(40);
  visitor.visit({
    type: "definition",
    abbreviation: [{ type: "text", text: "ABCD" }],
    title: [{ type: "text", text: "Alphabet" }],
    key: "abcd",
    content: [{
      type: "text",
      text: "A B C D E F G H I J K L M N O P Q R S T U V W X Y Z",
    }],
  });
  expect(visitor.getLines()).toEqual([
    "Alphabet (ABCD):",
    "  A B C D E F G H I J K L M N O P Q R S",
    "  T U V W X Y Z",
  ]);
});

test("Sticker Center", () => {
  const visitor = new FixedWidthTextVisitor(40);
  visitor.visit({
    type: "card",
    header: {
      type: "card-header",
      title: [{ type: "text", text: "Cendyne" }],
      username: "cendyne",
      usernameDomain: "furry.engineer",
    },
    content: {
      type: "card-content",
      content: [
        {
          type: "paragraph",
          content: [
            {
              type: "text",
              text:
                "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
            },
          ],
        },
      ],
    },
    media: {
      type: "card-media",
      content: [{
        type: "image",
        url: "https://e.example/e",
        alt: "Demo Image",
      }],
    },
    attribution: {
      type: "card-attribution",
      title: [{ type: "text", text: "Example Attribution Title" }],
      url: "https://e.example/e",
      date: "2023-06-24T17:14:53+00:00",
    },
  });
  expect(visitor.getLines()).toEqual([
    "/--------------------------------------\\",
    "|   Cendyne @cendyne@furry.engineer    |",
    "|--------------------------------------|",
    "| Lorem ipsum dolor sit amet,          |",
    "| consectetur adipiscing elit, sed do  |",
    "| eiusmod tempor incididunt ut labore  |",
    "| et dolore magna aliqua.              |",
    "|                                      |",
    "| [I1: Demo Image]                     |",
    "|                                      |",
    "| Example Attribution Title [L1] 6/24/ |",
    "| 2023                                 |",
    "\\--------------------------------------/",
  ]);
});

test("Document - 1", () => {
  const visitor = new FixedWidthTextVisitor(40);
  visitor.visit({
    type: "document",
    title: "Example Title",
    url: "/example",
    content: [
      {
        type: "toc",
        content: [{ type: "text", text: "Top Level Heading" }],
        hrefHtmlId: "id-here",
        date: {
          type: "date",
          isoDate: "2023-01-01",
          content: [{ type: "text", text: "January 1st" }],
        },
        children: [
          {
            type: "toc",
            content: [{ type: "text", text: "Sub Heading" }],
            href: "https://whatever.example/",
            children: [],
          },
        ],
      },
      { type: "text", text: "Lorem " },
      {
        type: "link",
        url:
          "https://cendyne.dev/posts/2023-06-20-twitters-bot-problem-is-getting-weird-with-chatgpt.json",
        content: [{
          type: "text",
          text: "ipsum dolor",
        }],
      },
      { type: "text", text: "sit amet." },
      {
        type: "image",
        alt: "Example Image",
        url:
          "https://media.tech.lgbt/media_attachments/files/110/588/972/540/677/028/original/b962a00b667e6b0b.png",
      },
    ],
    definitions: [
      {
        type: "definition",
        abbreviation: [{ type: "text", text: "DEF" }],
        title: [{ type: "text", text: "Definition" }],
        content: [{ type: "text", text: "A definition here" }],
        key: "def",
      },
    ],
  });
  expect(visitor.getLines()).toEqual([
    "             Example Title",
    "----------------------------------------",
    "",
    "/------ Table of contents ------\\",
    "| January 1st Top Level Heading |",
    "| * Sub Heading [L1]            |",
    "\\-------------------------------/",
    "",
    "Lorem ipsum dolor [L2] sit amet.",
    "[I1: Example Image]",
    "",
    "----------------------------------------",
    "",
    "Definition (DEF):",
    "  A definition here",
    "",
    " [L1]: https://whatever.example/",
    " [L2]: https://cendyne.dev/posts/2023-06",
    "       -20-twitters-bot-problem-is-",
    "       getting-weird-with-chatgpt.json",
    " [I1]: https://media.tech.lgbt/media_",
    "       attachments/files/110/588/972/540",
    "       /677/028/original/",
    "       b962a00b667e6b0b.png",
  ]);
});

test("Document - 2", () => {
  const visitor = new FixedWidthTextVisitor(40);
  visitor.visit({
    type: "document",
    title: "Example Title",
    url: "/example",
    content: [
      {
        type: "toc",
        content: [{ type: "text", text: "Top Level Heading" }],
        hrefHtmlId: "id-here",
        date: {
          type: "date",
          isoDate: "2023-01-01",
          content: [{ type: "text", text: "January 1st" }],
        },
        children: [
          {
            type: "toc",
            content: [{ type: "text", text: "Sub Heading" }],
            href: "https://whatever.example/",
            children: [],
          },
        ],
      },
      { type: "text", text: "Lorem " },
      {
        type: "link",
        url:
          "https://cendyne.dev/posts/2023-06-20-twitters-bot-problem-is-getting-weird-with-chatgpt.json",
        content: [{
          type: "text",
          text: "ipsum dolor",
        }],
      },
      { type: "text", text: "sit amet." },
      {
        type: "image",
        alt: "Example Image",
        url:
          "https://media.tech.lgbt/media_attachments/files/110/588/972/540/677/028/original/b962a00b667e6b0b.png",
      },
    ],
  });
  expect(visitor.getLines()).toEqual([
    "             Example Title",
    "----------------------------------------",
    "",
    "/------ Table of contents ------\\",
    "| January 1st Top Level Heading |",
    "| * Sub Heading [L1]            |",
    "\\-------------------------------/",
    "",
    "Lorem ipsum dolor [L2] sit amet.",
    "[I1: Example Image]",
    "",
    "----------------------------------------",
    "",
    " [L1]: https://whatever.example/",
    " [L2]: https://cendyne.dev/posts/2023-06",
    "       -20-twitters-bot-problem-is-",
    "       getting-weird-with-chatgpt.json",
    " [I1]: https://media.tech.lgbt/media_",
    "       attachments/files/110/588/972/540",
    "       /677/028/original/",
    "       b962a00b667e6b0b.png",
  ]);
});

test("Table of Contents - 1", () => {
  const visitor = new FixedWidthTextVisitor(40);
  visitor.visit({
    type: "toc",
    content: [{ type: "text", text: "Top Level Heading" }],
    hrefHtmlId: "id-here",
    date: {
      type: "date",
      isoDate: "2023-01-01",
      content: [{ type: "text", text: "January 1st" }],
    },
    children: [
      {
        type: "toc",
        content: [{ type: "text", text: "Sub Heading" }],
        href: "https://whatever.example/",
        children: [],
      },
    ],
  });
  expect(visitor.getLines()).toEqual([
    "/------ Table of contents ------\\",
    "| January 1st Top Level Heading |",
    "| * Sub Heading [L1]            |",
    "\\-------------------------------/",
  ]);
});

test("Table of Contents - 2", () => {
  const visitor = new FixedWidthTextVisitor(40);
  visitor.visit({
    "type": "toc",
    "children": [{
      "type": "toc",
      "children": [{
        "type": "toc",
        "children": [],
        "content": [{ "type": "text", "text": "Competition overview." }],
        "hrefHtmlId": "competition-overview.",
      }, {
        "type": "toc",
        "children": [],
        "content": [{ "type": "text", "text": "A PQC experiment at scale" }],
        "hrefHtmlId": "a-pqc-experiment-at-scale",
      }],
      "content": [{ "type": "text", "text": "The NIST competition" }],
      "hrefHtmlId": "the-nist-competition",
    }, {
      "type": "toc",
      "children": [],
      "content": [{ "type": "text", "text": "Panel discussion" }],
      "hrefHtmlId": "panel-discussion",
    }, {
      "type": "toc",
      "children": [],
      "content": [{ "type": "text", "text": "Final thoughts" }],
      "hrefHtmlId": "final-thoughts",
    }, {
      "type": "toc",
      "children": [],
      "content": [{ "type": "text", "text": "Acknowledgements" }],
      "hrefHtmlId": "acknowledgements",
    }],
    "content": [],
    "hrefHtmlId": "title",
  });
  expect(visitor.getLines()).toEqual([
    "/------ Table of contents ------\\",
    "| * The NIST competition        |",
    "|   * Competition overview.     |",
    "|   * A PQC experiment at scale |",
    "| * Panel discussion            |",
    "| * Final thoughts              |",
    "| * Acknowledgements            |",
    "\\-------------------------------/",
  ]);
});

// === Phase 9: Comprehensive Tests for New Node Types ===

// 1. Inline Formatting

test("SuperText renders with ^()", () => {
  const visitor = new FixedWidthTextVisitor(40);
  visitor.visit({
    type: "paragraph",
    content: [
      { type: "text", text: "E = mc" },
      { type: "super", content: [{ type: "text", text: "2" }] },
    ],
  });
  expect(visitor.getLines()).toEqual(["E = mc^(2)"]);
});

test("SubText renders with _()", () => {
  const visitor = new FixedWidthTextVisitor(40);
  visitor.visit({
    type: "paragraph",
    content: [
      { type: "text", text: "H" },
      { type: "sub", content: [{ type: "text", text: "2" }] },
      { type: "text", text: "O" },
    ],
  });
  expect(visitor.getLines()).toEqual(["H_(2)O"]);
});

test("Secret renders as spoiler", () => {
  const visitor = new FixedWidthTextVisitor(40);
  visitor.visit({
    type: "secret",
    content: [{ type: "text", text: "hidden text" }],
  });
  expect(visitor.getLines()).toEqual(["[SPOILER: hidden text]"]);
});

test("Redacted inline", () => {
  const visitor = new FixedWidthTextVisitor(40);
  visitor.visit({
    type: "paragraph",
    content: [
      { type: "text", text: "Name: " },
      { type: "redacted", style: "inline", content: [{ type: "text", text: "John" }] },
    ],
  });
  expect(visitor.getLines()).toEqual(["Name: [REDACTED]"]);
});

test("Redacted block", () => {
  const visitor = new FixedWidthTextVisitor(40);
  visitor.visit({
    type: "redacted",
    style: "block",
    content: [{ type: "text", text: "classified" }],
  });
  expect(visitor.getLines()).toEqual(["[REDACTED]"]);
});

test("Pill renders with brackets", () => {
  const visitor = new FixedWidthTextVisitor(40);
  visitor.visit({
    type: "paragraph",
    content: [
      { type: "text", text: "Status: " },
      { type: "pill", color: "green", content: [{ type: "text", text: "Active" }] },
    ],
  });
  expect(visitor.getLines()).toEqual(["Status: [Active]"]);
});

// 2. Temporal Nodes

test("Date renders children only", () => {
  const visitor = new FixedWidthTextVisitor(40);
  visitor.visit({
    type: "date",
    isoDate: "2024-01-15",
    content: [{ type: "text", text: "January 15, 2024" }],
  });
  expect(visitor.getLines()).toEqual(["January 15, 2024"]);
});

test("TimeRange renders children without metadata", () => {
  const visitor = new FixedWidthTextVisitor(40);
  visitor.visit({
    type: "time-range",
    notBefore: "2024-01-01",
    notAfter: "2024-12-31",
    content: [
      { type: "paragraph", content: [{ type: "text", text: "Limited time offer!" }] },
    ],
  });
  expect(visitor.getLines()).toEqual(["Limited time offer!"]);
});

// 3. Social Nodes

test("Tweet renders as link", () => {
  const visitor = new FixedWidthTextVisitor(80);
  visitor.visit({
    type: "document",
    title: "Test",
    url: "https://example.com",
    content: [
      { type: "paragraph", content: [
        { type: "tweet", id: "123456789" },
      ]},
    ],
  });
  const lines = visitor.getLines();
  expect(lines.some(l => l.includes("Tweet"))).toBe(true);
  expect(lines.some(l => l.includes("twitter.com/i/status/123456789"))).toBe(true);
});

test("Youtube renders as link", () => {
  const visitor = new FixedWidthTextVisitor(80);
  visitor.visit({
    type: "document",
    title: "Test",
    url: "https://example.com",
    content: [
      { type: "paragraph", content: [
        { type: "youtube", id: "dQw4w9WgXcQ" },
      ]},
    ],
  });
  const lines = visitor.getLines();
  expect(lines.some(l => l.includes("Youtube Video"))).toBe(true);
  expect(lines.some(l => l.includes("youtu.be/dQw4w9WgXcQ"))).toBe(true);
});

// 4. Standard Node

test("Standard node renders reference", () => {
  const visitor = new FixedWidthTextVisitor(80);
  visitor.visit({
    type: "document",
    title: "Test",
    url: "https://example.com",
    content: [
      { type: "paragraph", content: [
        { type: "standard", standard: "RFC", identifier: "7231", url: "https://tools.ietf.org/html/rfc7231", content: [] },
      ]},
    ],
  });
  const lines = visitor.getLines();
  expect(lines.some(l => l.includes("RFC 7231"))).toBe(true);
  expect(lines.some(l => l.includes("tools.ietf.org"))).toBe(true);
});

// 5. Code Node (basic)

test("Code node renders formatted text", () => {
  const visitor = new FixedWidthTextVisitor(40);
  visitor.visit({
    type: "code",
    content: [
      { type: "formatted-text", text: "const x = 1;\nconst y = 2;", language: "typescript" },
    ],
  });
  const lines = visitor.getLines();
  expect(lines).toContain("const x = 1;");
  expect(lines).toContain("const y = 2;");
});

// 6. Code with Line Numbers

test("Code with line numbers", () => {
  const visitor = new FixedWidthTextVisitor(40);
  visitor.visit({
    type: "code",
    lineNumbers: true,
    content: [
      { type: "formatted-text", text: "line one\nline two\nline three" },
    ],
  });
  const lines = visitor.getLines();
  expect(lines.some(l => l.includes("1 | line one"))).toBe(true);
  expect(lines.some(l => l.includes("2 | line two"))).toBe(true);
  expect(lines.some(l => l.includes("3 | line three"))).toBe(true);
});

// 7. Code with Diff

test("Code with diff markers", () => {
  const visitor = new FixedWidthTextVisitor(40);
  visitor.visit({
    type: "code",
    diff: true,
    content: [
      { type: "formatted-text", text: " context line\n-removed line\n+added line" },
    ],
  });
  const lines = visitor.getLines();
  expect(lines.some(l => l.includes("  context line"))).toBe(true);
  expect(lines.some(l => l.includes("- removed line"))).toBe(true);
  expect(lines.some(l => l.includes("+ added line"))).toBe(true);
});

// 8. Code with Diff + Line Numbers

test("Code with diff and line numbers", () => {
  const visitor = new FixedWidthTextVisitor(60);
  visitor.visit({
    type: "code",
    diff: true,
    lineNumbers: true,
    content: [
      { type: "formatted-text", text: " context\n-old line\n+new line\n another context" },
    ],
  });
  const lines = visitor.getLines();
  // Context lines should have both old and new line numbers
  // Removed lines should have only old number
  // Added lines should have only new number
  // Verify line numbers are present
  const hasOldAndNew = lines.some(l => /\d+\s+\d+\s+/.test(l));
  expect(hasOldAndNew).toBe(true);
});

// 9. Code Block with fileName

test("CodeBlock with fileName", () => {
  const visitor = new FixedWidthTextVisitor(40);
  visitor.visit({
    type: "code-block",
    fileName: "hello.ts",
    content: {
      type: "code",
      content: [
        { type: "formatted-text", text: "console.log('hello');" },
      ],
    },
  } as any);
  const lines = visitor.getLines();
  // Should have bordered box with fileName
  expect(lines.some(l => l.includes("hello.ts"))).toBe(true);
  expect(lines.some(l => l.startsWith("/"))).toBe(true);
  expect(lines.some(l => l.startsWith("\\"))).toBe(true);
  expect(lines.some(l => l.includes("console.log"))).toBe(true);
});

// 10. Collapsed CodeBlock

test("CodeBlock collapsed", () => {
  const visitor = new FixedWidthTextVisitor(40);
  visitor.visit({
    type: "code-block",
    fileName: "config.json",
    collapsable: true,
    collapsed: true,
    content: {
      type: "code",
      content: [
        { type: "formatted-text", text: '{"key": "value"}' },
      ],
    },
  } as any);
  const lines = visitor.getLines();
  expect(lines).toEqual(["[Collapsed: config.json]"]);
});

// 11. Code Group

test("CodeGroup with multiple tabs", () => {
  const visitor = new FixedWidthTextVisitor(40);
  visitor.visit({
    type: "code-group",
    tabs: [
      {
        type: "code-group-tab",
        header: [{ type: "text", text: "JavaScript" }],
        content: {
          type: "code",
          content: [{ type: "formatted-text", text: "const x = 1;" }],
        },
      },
      {
        type: "code-group-tab",
        header: [{ type: "text", text: "Python" }],
        content: {
          type: "code",
          content: [{ type: "formatted-text", text: "x = 1" }],
        },
      },
    ],
  } as any);
  const lines = visitor.getLines();
  expect(lines.some(l => l.includes("JavaScript"))).toBe(true);
  expect(lines.some(l => l.includes("Python"))).toBe(true);
  expect(lines.some(l => l.includes("const x = 1;"))).toBe(true);
  expect(lines.some(l => l.includes("x = 1"))).toBe(true);
});

// 12. Table

test("Simple table", () => {
  const visitor = new FixedWidthTextVisitor(40);
  visitor.visit({
    type: "table",
    content: [
      [
        { type: "table-cell", header: true, span: [1, 1], content: [{ type: "text", text: "Name" }] },
        { type: "table-cell", header: true, span: [1, 1], content: [{ type: "text", text: "Age" }] },
      ],
      [
        { type: "table-cell", span: [1, 1], content: [{ type: "text", text: "Alice" }] },
        { type: "table-cell", span: [1, 1], content: [{ type: "text", text: "30" }] },
      ],
    ],
  } as any);
  const lines = visitor.getLines();
  // Should have borders
  expect(lines.some(l => l.includes("+"))).toBe(true);
  // Header row should use = separator
  expect(lines.some(l => l.includes("="))).toBe(true);
  // Data should be present
  expect(lines.some(l => l.includes("Name"))).toBe(true);
  expect(lines.some(l => l.includes("Alice"))).toBe(true);
  expect(lines.some(l => l.includes("30"))).toBe(true);
});

// 13. Accordion

test("Accordion open tab", () => {
  const visitor = new FixedWidthTextVisitor(40);
  visitor.visit({
    type: "accordion-group",
    tabs: [
      {
        type: "accordion-tab",
        header: [{ type: "text", text: "Details" }],
        content: [{ type: "paragraph", content: [{ type: "text", text: "Some details here" }] }],
        open: true,
      },
    ],
  } as any);
  const lines = visitor.getLines();
  expect(lines.some(l => l.includes("Details"))).toBe(true);
  expect(lines.some(l => l.includes("Some details here"))).toBe(true);
});

test("Accordion collapsed tab", () => {
  const visitor = new FixedWidthTextVisitor(40);
  visitor.visit({
    type: "accordion-group",
    tabs: [
      {
        type: "accordion-tab",
        header: [{ type: "text", text: "FAQ" }],
        content: [{ type: "paragraph", content: [{ type: "text", text: "Answer" }] }],
        open: false,
      },
    ],
  } as any);
  const lines = visitor.getLines();
  expect(lines).toEqual(["[Collapsed: FAQ]"]);
});

// 14. Figure with Caption

test("Figure with image and caption", () => {
  const visitor = new FixedWidthTextVisitor(40);
  visitor.visit({
    type: "figure",
    content: [
      { type: "image", url: "https://example.com/img.png", alt: "A photo" },
      { type: "figure-caption", content: [{ type: "text", text: "Figure 1: A photo" }] },
    ],
  });
  const lines = visitor.getLines();
  expect(lines.some(l => l.includes("A photo"))).toBe(true);
  expect(lines.some(l => l.includes("Figure 1"))).toBe(true);
});

// 15. Region passes through

test("Region renders children without metadata", () => {
  const visitor = new FixedWidthTextVisitor(40);
  visitor.visit({
    type: "region",
    mode: "allow",
    regions: "US",
    content: [{ type: "paragraph", content: [{ type: "text", text: "US only content" }] }],
  });
  const lines = visitor.getLines();
  expect(lines).toEqual(["US only content"]);
  // Should NOT contain "allow" as metadata
  expect(lines.every(l => !l.includes("allow"))).toBe(true);
});

// 16. Style and Script are omitted

test("Style node produces no output", () => {
  const visitor = new FixedWidthTextVisitor(40);
  visitor.visit({
    type: "array",
    content: [
      { type: "style", source: "body { color: red }" },
      { type: "paragraph", content: [{ type: "text", text: "visible" }] },
    ],
  } as any);
  const lines = visitor.getLines();
  expect(lines.some(l => l.includes("visible"))).toBe(true);
  expect(lines.every(l => !l.includes("color"))).toBe(true);
});

// 17. Definition List

test("Definition list renders each definition", () => {
  const visitor = new FixedWidthTextVisitor(40);
  visitor.visit({
    type: "definition-list",
    content: [
      {
        type: "definition",
        key: "html",
        title: [{ type: "text", text: "HTML" }],
        abbreviation: [{ type: "text", text: "HTML" }],
        content: [{ type: "text", text: "HyperText Markup Language" }],
      },
    ],
  } as any);
  const lines = visitor.getLines();
  expect(lines.some(l => l.includes("HTML"))).toBe(true);
  expect(lines.some(l => l.includes("HyperText Markup Language"))).toBe(true);
});

// 18. Comprehensibility check at 80 chars

test("Complex document at 80 chars is readable", () => {
  const visitor = new FixedWidthTextVisitor(80);
  visitor.visit({
    type: "document",
    title: "Test Document",
    url: "https://example.com",
    description: "A test document with various node types",
    content: [
      { type: "header", level: 1, content: [{ type: "text", text: "Introduction" }] },
      { type: "paragraph", content: [
        { type: "text", text: "This is a test of various features including " },
        { type: "bold", content: [{ type: "text", text: "bold text" }] },
        { type: "text", text: " and " },
        { type: "italic", content: [{ type: "text", text: "italic text" }] },
        { type: "text", text: "." },
      ]},
      { type: "table", content: [
        [
          { type: "table-cell", header: true, span: [1,1], content: [{ type: "text", text: "Feature" }] },
          { type: "table-cell", header: true, span: [1,1], content: [{ type: "text", text: "Status" }] },
        ],
        [
          { type: "table-cell", span: [1,1], content: [{ type: "text", text: "Tables" }] },
          { type: "table-cell", span: [1,1], content: [{ type: "text", text: "Working" }] },
        ],
      ]},
    ],
  } as any);
  const lines = visitor.getLines();
  // Every line should be within width
  for (const line of lines) {
    expect(line.length).toBeLessThanOrEqual(80);
  }
  // Should contain key content
  expect(lines.some(l => l.includes("Introduction"))).toBe(true);
  expect(lines.some(l => l.includes("bold text"))).toBe(true);
  expect(lines.some(l => l.includes("Feature"))).toBe(true);
});
