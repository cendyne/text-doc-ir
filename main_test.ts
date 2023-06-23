import { assertEquals } from "https://deno.land/std@0.192.0/testing/asserts.ts";
import { FixedWidthTextVisitor } from "./main.ts";

Deno.test({name: 'lorem ipsum 40', fn() {
  const visitor = new FixedWidthTextVisitor(40);
  visitor.visit({type: 'text', text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.'});
  assertEquals(visitor.getLines(), [
    'Lorem ipsum dolor sit amet, consectetur',
    'adipiscing elit, sed do eiusmod tempor',
    'incididunt ut labore et dolore magna',
    'aliqua. Ut enim ad minim veniam, quis',
    'nostrud exercitation ullamco laboris',
    'nisi ut aliquip ex ea commodo consequat.',
    'Duis aute irure dolor in reprehenderit',
    'in voluptate velit esse cillum dolore eu',
    'fugiat nulla pariatur. Excepteur sint',
    'occaecat cupidatat non proident, sunt in',
    'culpa qui officia deserunt mollit anim',
    'id est laborum.'
  ]);
}});

Deno.test({name: 'Base32 Force break', fn() {
  const visitor = new FixedWidthTextVisitor(40);
  visitor.visit({type: 'text', text: 'KRUGKIDROVUWG2ZAMJZG653OEBTG66BANJ2W24DTEBXXMZLSEB2GQZJANRQXU6JAMRXWOLQ='});
  assertEquals(visitor.getLines(), [
    'KRUGKIDROVUWG2ZAMJZG653OEBTG66BANJ2W24DT',
    'EBXXMZLSEB2GQZJANRQXU6JAMRXWOLQ='
  ]);
}});

Deno.test({name: 'Lorem 1', fn() {
  const visitor = new FixedWidthTextVisitor(40);
  visitor.visit({type: 'text', text: 'Lorem ipsum dolor sit amet, consectetur.'});
  assertEquals(visitor.getLines(), [
    'Lorem ipsum dolor sit amet, consectetur.'
  ]);
}});

Deno.test({name: 'Lorem 2', fn() {
  const visitor = new FixedWidthTextVisitor(40);
  visitor.visit({type: 'text', text: 'Lorem ipsum dolor sit amet, consectetur. Lorem elsum dolor sit amet, consectetur.'});
  assertEquals(visitor.getLines(), [
    'Lorem ipsum dolor sit amet, consectetur.',
    'Lorem elsum dolor sit amet, consectetur.'
  ]);
}});

Deno.test({name: 'Lorem 3', fn() {
  const visitor = new FixedWidthTextVisitor(40);
  visitor.visit({type: 'text', text: 'Lorem ipsum dolor sit amet, consectetur. Lorem elsum dolor sit amet, consectetur. Lorem ulsum dolor sit amet, consectetur.'});
  assertEquals(visitor.getLines(), [
    'Lorem ipsum dolor sit amet, consectetur.',
    'Lorem elsum dolor sit amet, consectetur.',
    'Lorem ulsum dolor sit amet, consectetur.',
  ]);
}});

Deno.test({name: 'Break long urls', fn() {
  const visitor = new FixedWidthTextVisitor(40);
  visitor.visit({type: 'formatted-text', text: 'https://cendyne.dev/posts/2023-06-20-twitters-bot-problem-is-getting-weird-with-chatgpt.html\nhttps://cendyne.dev/posts/2023-05-29-a-path-to-niche-skillsets-and-community.html\nhttps://cendyne.dev/posts/2023-05-11-reverse-centaur-chickenization-chatgpt.html\nhttps://www.reddit.com/r/flipperzero/comments/14c8c6j/flipper_devices_getting_into_nfts/\nhttps://www.reddit.com/r/flipperzero/comments/14bh1qo/flipper_developers_confirm_flipper_inc_is_now_in/'});
  assertEquals(visitor.getLines(), [
    'https://cendyne.dev/posts/2023-06-20-',
    'twitters-bot-problem-is-getting-weird-',
    'with-chatgpt.html',
    'https://cendyne.dev/posts/2023-05-29-a-',
    'path-to-niche-skillsets-and-',
    'community.html',
    'https://cendyne.dev/posts/2023-05-11-',
    'reverse-centaur-chickenization-',
    'chatgpt.html',
    'https://www.reddit.com/r/flipperzero/',
    'comments/14c8c6j/flipper_devices_getting',
    '_into_nfts/',
    'https://www.reddit.com/r/flipperzero/',
    'comments/14bh1qo/flipper_developers_',
    'confirm_flipper_inc_is_now_in/'
  ]);
}});

Deno.test({name: 'Styling is ignored', fn() {
  const visitor = new FixedWidthTextVisitor(40);
  visitor.visit({
    type: 'array',
    content: [
      {type: 'text', text: 'Lorem ipsum dolor sit amet, '},
      {type: 'italic', content: [
        {type: 'text', text: 'consectetur.'}
      ]}
    ]
  });
  assertEquals(visitor.getLines(), [
    'Lorem ipsum dolor sit amet, consectetur.',
  ]);
}});

Deno.test({name: 'Spaces are not forgotten 1', fn() {
  const visitor = new FixedWidthTextVisitor(40);
  visitor.visit({
    type: 'array',
    content: [
      {type: 'text', text: 'Lorem ipsum dolor sit amet, '},
      {type: 'text', text: 'consectetur.'}
    ]
  });
  assertEquals(visitor.getLines(), [
    'Lorem ipsum dolor sit amet, consectetur.',
  ]);
}});

Deno.test({name: 'Spaces are not forgotten 2', fn() {
  const visitor = new FixedWidthTextVisitor(40);
  visitor.visit({
    type: 'array',
    content: [
      {type: 'text', text: 'Lorem ipsum dolor sit amet,'},
      {type: 'text', text: ' consectetur.'}
    ]
  });
  assertEquals(visitor.getLines(), [
    'Lorem ipsum dolor sit amet, consectetur.',
  ]);
}});

Deno.test({name: 'Explicit Break 1', fn() {
  const visitor = new FixedWidthTextVisitor(40);
  visitor.visit({
    type: 'array',
    content: [
      {type: 'text', text: 'Lorem ipsum dolor sit amet,'},
      {type: 'break'},
      {type: 'text', text: ' consectetur.'},
    ]
  });
  assertEquals(visitor.getLines(), [
    'Lorem ipsum dolor sit amet,',
    'consectetur.',
  ]);
}});

Deno.test({name: 'Explicit Break 2', fn() {
  const visitor = new FixedWidthTextVisitor(40);
  visitor.visit({
    type: 'array',
    content: [
      {type: 'text', text: 'Lorem ipsum dolor sit amet.'},
      {type: 'break'}
    ]
  });
  assertEquals(visitor.getLines(), [
    'Lorem ipsum dolor sit amet.'
  ]);
}});

Deno.test({name: 'Explicit Break 3', fn() {
  const visitor = new FixedWidthTextVisitor(40);
  visitor.visit({
    type: 'array',
    content: [
      {type: 'break'},
      {type: 'text', text: 'Lorem ipsum dolor sit amet.'}
    ]
  });
  assertEquals(visitor.getLines(), [
    'Lorem ipsum dolor sit amet.'
  ]);
}});

Deno.test({name: 'Explicit Break 4', fn() {
  const visitor = new FixedWidthTextVisitor(40);
  visitor.visit({
    type: 'array',
    content: [
      {type: 'text', text: 'Lorem ipsum dolor sit amet,'},
      {type: 'break'},
      {type: 'break'},
      {type: 'text', text: 'consectetur.'},
    ]
  });
  assertEquals(visitor.getLines(), [
    'Lorem ipsum dolor sit amet,',
    '',
    '',
    'consectetur.'
  ]);
}});

Deno.test({name: 'Horizontal Rules', fn() {
  const visitor = new FixedWidthTextVisitor(40);
  visitor.visit({
    type: 'array',
    content: [
      {type: 'paragraph', content: [{type: 'text', text: 'Lorem ipsum dolor sit amet,'}]},
      {type: 'horizontal-rule'},
      {type: 'paragraph', content: [{type: 'text', text: ' consectetur.'}]},
    ]
  });
  assertEquals(visitor.getLines(), [
    'Lorem ipsum dolor sit amet,',
    '',
    '----------------------------------------',
    '',
    'consectetur.',
  ]);
}});

Deno.test({name: 'First and only paragraph does not add blank lines', fn() {
  const visitor = new FixedWidthTextVisitor(40);
  visitor.visit({
    type: 'array',
    content: [
      {type: 'paragraph', content: [
        {type: 'text', text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.'}
      ]}
    ]
  });
  assertEquals(visitor.getLines(), [
    'Lorem ipsum dolor sit amet, consectetur',
    'adipiscing elit, sed do eiusmod tempor',
    'incididunt ut labore et dolore magna',
    'aliqua.',
  ]);
}});

Deno.test({name: 'Paragraphs have lines between', fn() {
  const visitor = new FixedWidthTextVisitor(40);
  visitor.visit({
    type: 'array',
    content: [
      {type: 'paragraph', content: [
        {type: 'text', text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.'}
      ]},
      {type: 'paragraph', content: [
        {type: 'text', text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.'}
      ]}
    ]
  });
  assertEquals(visitor.getLines(), [
    'Lorem ipsum dolor sit amet, consectetur',
    'adipiscing elit, sed do eiusmod tempor',
    'incididunt ut labore et dolore magna',
    'aliqua.',
    '',
    'Lorem ipsum dolor sit amet, consectetur',
    'adipiscing elit, sed do eiusmod tempor',
    'incididunt ut labore et dolore magna',
    'aliqua.',
  ]);
}});

Deno.test({name: 'Paragraphs and horizontal rule have lines between', fn() {
  const visitor = new FixedWidthTextVisitor(40);
  visitor.visit({
    type: 'array',
    content: [
      {type: 'paragraph', content: [
        {type: 'text', text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.'}
      ]},
      {type: 'horizontal-rule'},
      {type: 'paragraph', content: [
        {type: 'text', text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.'}
      ]}
    ]
  });
  assertEquals(visitor.getLines(), [
    'Lorem ipsum dolor sit amet, consectetur',
    'adipiscing elit, sed do eiusmod tempor',
    'incididunt ut labore et dolore magna',
    'aliqua.',
    '',
    '----------------------------------------',
    '',
    'Lorem ipsum dolor sit amet, consectetur',
    'adipiscing elit, sed do eiusmod tempor',
    'incididunt ut labore et dolore magna',
    'aliqua.',
  ]);
}});

Deno.test({name: 'Numbered list', fn() {
  const visitor = new FixedWidthTextVisitor(40);
  visitor.visit({
    type: 'array',
    content: [
      {type: 'list', style: 'ordered', content: [
        {type: 'list-item', content: [
          {type: 'paragraph', content: [{type: 'text', text: 'Lorem ipsum dolor sit amet,'}]},
          {type: 'horizontal-rule'},
          {type: 'paragraph', content: [{type: 'text', text: ' consectetur.'}]},
        ]},
        {type: 'list-item', content: [
          {type: 'text', text: 'https://cendyne.dev/posts/2023-06-20-twitters-bot-problem-is-getting-weird-with-chatgpt.html'},
        ]}
      ]}
    ]
  });
  assertEquals(visitor.getLines(), [
    '  1. Lorem ipsum dolor sit amet,',
    '',
    '     -----------------------------------',
    '',
    '     consectetur.',
    '  2. https://cendyne.dev/posts/2023-06-',
    '     20-twitters-bot-problem-is-getting-',
    '     weird-with-chatgpt.html',
  ]);
}});


Deno.test({name: 'Unordered list', fn() {
  const visitor = new FixedWidthTextVisitor(40);
  visitor.visit({
    type: 'array',
    content: [
      {type: 'list', style: 'unordered', content: [
        {type: 'list-item', content: [
          {type: 'paragraph', content: [{type: 'text', text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.'}]},
        ]},
        {type: 'list-item', content: [
          {type: 'text', text: 'KRUGKIDROVUWG2ZAMJZG653OEBTG66BANJ2W24DTEBXXMZLSEB2GQZJANRQXU6JAMRXWOLQ'},
        ]}
      ]}
    ]
  });
  assertEquals(visitor.getLines(), [
    '  *  Lorem ipsum dolor sit amet,',
    '     consectetur adipiscing elit, sed do',
    '     eiusmod tempor incididunt ut labore',
    '     et dolore magna aliqua.',
    '  *  KRUGKIDROVUWG2ZAMJZG653OEBTG66BANJ2',
    '     W24DTEBXXMZLSEB2GQZJANRQXU6JAMRXWOL',
    '     Q',
  ]);
}});


