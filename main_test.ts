import { assertEquals } from "https://deno.land/std@0.192.0/testing/asserts.ts";
import { FixedWidthTextVisitor } from "./main.ts";
import { LinkNode } from "./deps.ts";

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

Deno.test({name: 'Numbered list - 1', fn() {
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
    '',
    '  2. https://cendyne.dev/posts/2023-06-',
    '     20-twitters-bot-problem-is-getting-',
    '     weird-with-chatgpt.html',
  ]);
}});

Deno.test({name: 'Numbered list - 2', fn() {
  const visitor = new FixedWidthTextVisitor(40);
  visitor.visit({
    type: 'array',
    content: [
      {type: 'list', style: 'ordered', content: [
        {type: 'list-item', content: [
          {type: 'paragraph', content: [{type: 'text', text: 'Lorem ipsum dolor sit amet, consectetur adipiscing eli.'}]},
          {type: 'list', style: 'ordered', content: [
            {type: 'list-item', content: [
              {type: 'paragraph', content: [{type: 'text', text: 'Lorem ipsum dolor sit amet, consectetur adipiscing eli.'}]},
              {type: 'paragraph', content: [{type: 'text', text: 'Lorem ipsum dolor sit amet, consectetur adipiscing eli.'}]},
              {type: 'list', style: 'ordered', content: [
                {type: 'list-item', content: [
                  {type: 'paragraph', content: [{type: 'text', text: 'Lorem ipsum dolor sit amet, consectetur adipiscing eli.'}]},
                  {type: 'paragraph', content: [{type: 'text', text: 'Lorem ipsum dolor sit amet, consectetur adipiscing eli.'}]}
                ]}
              ]}
            ]}
          ]}
        ]},
        {type: 'list-item', content: [
          {type: 'paragraph', content: [{type: 'text', text: 'Lorem ipsum dolor sit amet, consectetur adipiscing eli.'}]}
        ]}
      ]}
    ]
  });
  assertEquals(visitor.getLines(), [
    '  1. Lorem ipsum dolor sit amet,',
    '     consectetur adipiscing eli.',
    '',
    '       A. Lorem ipsum dolor sit amet,',
    '          consectetur adipiscing eli.',
    '',
    '          Lorem ipsum dolor sit amet,',
    '          consectetur adipiscing eli.',
    '',
    '            a. Lorem ipsum dolor sit',
    '               amet, consectetur',
    '               adipiscing eli.',
    '',
    '               Lorem ipsum dolor sit',
    '               amet, consectetur',
    '               adipiscing eli.',
    '',
    '  2. Lorem ipsum dolor sit amet,',
    '     consectetur adipiscing eli.',
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


Deno.test({name: 'Columns 1', fn() {
  const visitor = new FixedWidthTextVisitor(40);
  visitor.visit({
    type: 'columns',
    'column-count': 1,
    columns: [
      [{type: 'text', text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.'}]
    ]
  });
  assertEquals(visitor.getLines(), [
    'Lorem ipsum dolor sit amet, consectetur',
    'adipiscing elit, sed do eiusmod tempor',
    'incididunt ut labore et dolore magna',
    'aliqua.',
  ]);
}});

Deno.test({name: 'Columns 2 - 1', fn() {
  const visitor = new FixedWidthTextVisitor(40);
  visitor.visit({
    type: 'columns',
    'column-count': 2,
    columns: [
      [{type: 'text', text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.'}],
      [{type: 'text', text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.'}]
    ]
  });
  assertEquals(visitor.getLines(), [
    'Lorem ipsum dolor    Lorem ipsum dolor',
    'sit amet,            sit amet,',
    'consectetur          consectetur',
    'adipiscing elit,     adipiscing elit,',
    'sed do eiusmod       sed do eiusmod',
    'tempor incididunt    tempor incididunt',
    'ut labore et dolore  ut labore et dolore',
    'magna aliqua.        magna aliqua.',
  ]);
}});

Deno.test({name: 'Columns 2 - 2', fn() {
  const visitor = new FixedWidthTextVisitor(40);
  visitor.visit({
    type: 'columns',
    'column-count': 2,
    columns: [
      [{type: 'text', text: 'Hello world'}],
      [{type: 'text', text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.'}]
    ]
  });
  assertEquals(visitor.getLines(), [
    'Hello world          Lorem ipsum dolor',
    '                     sit amet,',
    '                     consectetur',
    '                     adipiscing elit,',
    '                     sed do eiusmod',
    '                     tempor incididunt',
    '                     ut labore et dolore',
    '                     magna aliqua.',
  ]);
}});

Deno.test({name: 'Columns 2 - 3', fn() {
  const visitor = new FixedWidthTextVisitor(40);
  visitor.visit({
    type: 'columns',
    'column-count': 2,
    columns: [
      [{type: 'text', text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.'}],
      [{type: 'text', text: 'Hello world'}]
    ]
  });
  assertEquals(visitor.getLines(), [
    'Lorem ipsum dolor    Hello world',
    'sit amet,',
    'consectetur',
    'adipiscing elit,',
    'sed do eiusmod',
    'tempor incididunt',
    'ut labore et dolore',
    'magna aliqua.',
  ]);
}});


Deno.test({name: 'Emoji - 1', fn() {
  const visitor = new FixedWidthTextVisitor(40);
  visitor.visit({
    type: 'paragraph',
    content: [
      {type: 'text', text: 'Lorem ipsum dolor '},
      {type: 'emoji', alt: 'oooh', url: 'https://e.example/e'},
      {type: 'text', text: 'sit amet.'},
      {type: 'emoji', alt: 'oooh', url: 'https://e.example/e'},
    ]
  });
  assertEquals(visitor.getLines(), [
    'Lorem ipsum dolor [I1: oooh] sit amet.',
    '[I1: oooh]'
  ]);
}})

Deno.test({name: 'Emoji - 2', fn() {
  const visitor = new FixedWidthTextVisitor(40);
  visitor.visit({
    type: 'paragraph',
    content: [
      {type: 'emoji', alt: 'oooh', url: 'https://e.example/e'},
      {type: 'emoji', alt: 'aaah', url: 'https://e.example/j'},
    ]
  });
  assertEquals(visitor.getLines(), [
    '[I1: oooh] [I2: aaah]'
  ]);
}})

Deno.test({name: 'Image - 1', fn() {
  const visitor = new FixedWidthTextVisitor(40);
  visitor.visit({
    type: 'paragraph',
    content: [
      {type: 'image', alt: 'oooh', url: 'https://e.example/e'},
      {type: 'image', alt: 'oooh', url: 'https://e.example/e'}
    ]
  });
  assertEquals(visitor.getLines(), [
    '[I1: oooh]',
    '',
    '[I1: oooh]'
  ]);
}})

Deno.test({name: 'Image - 2', fn() {
  const visitor = new FixedWidthTextVisitor(40);
  visitor.visit({
    type: 'paragraph',
    content: [
      {type: 'image', alt: 'oooh', url: 'https://e.example/e'},
      {type: 'image', alt: 'aaah', url: 'https://e.example/j'}
    ]
  });
  assertEquals(visitor.getLines(), [
    '[I1: oooh]',
    '',
    '[I2: aaah]'
  ]);
}})

Deno.test({name: 'Figure Image - 1', fn() {
  const visitor = new FixedWidthTextVisitor(40);
  visitor.visit({
    type: 'figure-image',
    alt: 'oooh',
    url: 'https://e.example/e',
    width: 620,
    height: 920,
    content: [
      {type: 'text', text: 'Hello'}
    ]
  });
  assertEquals(visitor.getLines(), [
    '[I1: oooh]',
    '',
    'Hello'
  ]);
}})

Deno.test({name: 'Figure Image - 2', fn() {
  const visitor = new FixedWidthTextVisitor(40);
  visitor.visit({
    type: 'array',
    content: [
      {
        type: 'figure-image',
        alt: 'oooh',
        url: 'https://e.example/e',
        width: 620,
        height: 920,
        content: [
          {type: 'text', text: 'Hello'}
        ]
      },
      {
        type: 'figure-image',
        alt: 'oooh',
        url: 'https://e.example/e',
        width: 620,
        height: 920,
        content: [
          {type: 'text', text: 'Hello'}
        ]
      }
    ]
  });
  assertEquals(visitor.getLines(), [
    '[I1: oooh]',
    '',
    'Hello',
    '',
    '[I1: oooh]',
    '',
    'Hello'
  ]);
}})

Deno.test({name: 'Link - 1', fn() {
  const visitor = new FixedWidthTextVisitor(40);
  visitor.visit({
    type: 'paragraph',
    content: [
      {type: 'text', text: 'Lorem '},
      {type: 'link', url: 'https://e.example/e', content: [{
        type: 'text', text: 'ipsum dolor'
      }]},
      {type: 'text', text: 'sit amet.'}
    ]
  });
  assertEquals(visitor.getLines(), [
    'Lorem ipsum dolor [L1] sit amet.',
  ]);
}})

Deno.test({name: 'Link - 2', fn() {
  const visitor = new FixedWidthTextVisitor(40);
  visitor.visit({
    type: 'paragraph',
    content: [
      {type: 'text', text: 'Lorem '},
      {type: 'link', url: 'https://e.example/e', content: [{
        type: 'text', text: 'ipsum dolor'
      }]},
      {type: 'text', text: ' '},
      {type: 'link', url: 'https://e.example/j', content: [{
        type: 'text', text: 'sit'
      }]},
      {type: 'text', text: 'amet.'}
    ]
  });
  assertEquals(visitor.getLines(), [
    'Lorem ipsum dolor [L1] sit [L2] amet.',
  ]);
}})

Deno.test({name: 'Video', fn() {
  const visitor = new FixedWidthTextVisitor(40);
  visitor.visit({
    type: 'paragraph',
    content: [
      {type: 'text', text: 'Lorem '},
      {type: 'video', poster: 'https://e.example/e', alt: 'aaa', mp4: 'https://e.example/e'},
    ]
  });
  assertEquals(visitor.getLines(), [
    'Lorem',
    '[I1: Video: aaa]',
  ]);
}});

Deno.test({name: 'Youtube', fn() {
  const visitor = new FixedWidthTextVisitor(40);
  visitor.visit({
    type: 'paragraph',
    content: [
      {type: 'text', text: 'Lorem '},
      {type: 'embed', content: {
        type: 'youtube',
        id: 'aaaaaa'
      }},
    ]
  });
  assertEquals(visitor.getLines(), [
    'Lorem Youtube Video [L1]'
  ]);
}});


Deno.test({name: 'Header - 1', fn() {
  const visitor = new FixedWidthTextVisitor(40);
  visitor.visit({
    type: 'array',
    content: [
      {type: 'header', level: 1, content: [{type: 'text', text: 'Lorem Ipsum'}]},
    ]
  });
  assertEquals(visitor.getLines(), [
    'Lorem Ipsum',
    '==========='
  ]);
}});

Deno.test({name: 'Header - 2', fn() {
  const visitor = new FixedWidthTextVisitor(40);
  visitor.visit({
    type: 'array',
    content: [
      {type: 'header', level: 1, content: [{type: 'text', text: 'Lorem Ipsum'}]},
      {type: 'paragraph', content: [{type: 'text', text: 'dolor sit amet.'}]}
    ]
  });
  assertEquals(visitor.getLines(), [
    'Lorem Ipsum',
    '===========',
    '',
    'dolor sit amet.'
  ]);
}});

Deno.test({name: 'Header - 3', fn() {
  const visitor = new FixedWidthTextVisitor(40);
  visitor.visit({
    type: 'array',
    content: [
      {type: 'header', level: 1, content: [{type: 'text', text: 'Lorem Ipsum'}]},
      {type: 'paragraph', content: [{type: 'text', text: 'dolor sit amet.'}]},
      {type: 'header', level: 2, content: [{type: 'text', text: 'Ut enim ad minim veniam'}]},
      {type: 'paragraph', content: [{type: 'text', text: 'Quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.'}]}
    ]
  });
  assertEquals(visitor.getLines(), [
    'Lorem Ipsum',
    '===========',
    '',
    'dolor sit amet.',
    '',
    'Ut enim ad minim veniam',
    '-----------------------',
    '',
    'Quis nostrud exercitation ullamco',
    'laboris nisi ut aliquip ex ea commodo',
    'consequat.'
  ]);
}});

Deno.test({name: 'Regression - 1', fn() {
  const visitor = new FixedWidthTextVisitor(80);
  visitor.visit({type: 'array', content: [
    {type: 'paragraph', content: Array(82).fill('').map((v,i)=> {
      return {type: 'link', url: `https://${i}`, content: [{type: 'text', text: ''}]} as LinkNode;
    })},
    {
      type: "paragraph",
      content: [
        {
          type: "text",
          text: "When you see a custom anime cat girl speaking to you while creating open source 3D drivers for AArch64 Apple hardware, or read "
        },
        {
          type: "link",
          content: [
            {
              type: "text",
              text: "How to use a fork of the Go compiler with Nix"
            }
          ],
          url: "https://xeiaso.net/blog/go-fork-nix"
        },
        {
          type: "text",
          text: " ("
        },
        {
          type: "link",
          content: [
            {
              type: "text",
              text: "archived"
            }
          ],
          url: "https://archive.is/kwiTg"
        },
        {
          type: "text",
          text: ") by an orca dragon, shark, and a fox girl: do not make fun of it. These designs are personally created and represent either the self image of the author or the image they wish to be seen as, and are "
        },
        {
          type: "bold",
          content: [
            {
              type: "text",
              text: "very different"
            }
          ]
        },
        {
          type: "text",
          text: " from those that develop dysphoria or dysmorphia "
        },
        {
          type: "bold",
          content: [
            {
              type: "italic",
              content: [
                {
                  type: "text",
                  text: "because of technology or marketing"
                }
              ]
            }
          ]
        },
        {
          type: "text",
          text: " released by corporations. Unlike young girls that that feel body shame over "
        },
        {
          type: "link",
          content: [
            {
              type: "text",
              text: "not having a thin figure like a Barbie doll"
            }
          ],
          url: "https://www.teenvogue.com/story/barbie-body-image-study"
        },
        {
          type: "text",
          text: " ("
        },
        {
          type: "link",
          content: [
            {
              type: "text",
              text: "archived"
            }
          ],
          url: "https://archive.is/qB1GH"
        },
        {
          type: "text",
          text: ",) these personal images are carefully prepared with significant introspection."
        }
      ]
    }]
  });
  assertEquals(visitor.getLines(), [
    '[L1] [L2] [L3] [L4] [L5] [L6] [L7] [L8] [L9] [L10] [L11] [L12] [L13] [L14] [L15]',
    '[L16] [L17] [L18] [L19] [L20] [L21] [L22] [L23] [L24] [L25] [L26] [L27] [L28]',
    '[L29] [L30] [L31] [L32] [L33] [L34] [L35] [L36] [L37] [L38] [L39] [L40] [L41]',
    '[L42] [L43] [L44] [L45] [L46] [L47] [L48] [L49] [L50] [L51] [L52] [L53] [L54]',
    '[L55] [L56] [L57] [L58] [L59] [L60] [L61] [L62] [L63] [L64] [L65] [L66] [L67]',
    '[L68] [L69] [L70] [L71] [L72] [L73] [L74] [L75] [L76] [L77] [L78] [L79] [L80]',
    '[L81] [L82]',
    '',
    'When you see a custom anime cat girl speaking to you while creating open source',
    '3D drivers for AArch64 Apple hardware, or read How to use a fork of the Go',
    'compiler with Nix [L83] (archived [L84] ) by an orca dragon, shark, and a fox',
    "girl: do not make fun of it. These designs are personally created and represent",
    "either the self image of the author or the image they wish to be seen as, and",
    "are very different from those that develop dysphoria or dysmorphia because of",
    "technology or marketing released by corporations. Unlike young girls that that",
    "feel body shame over not having a thin figure like a Barbie doll [L85] (archived",
    '[L86] ,) these personal images are carefully prepared with significant',
    'introspection.'
  ]);
}})

Deno.test({name: 'Strike through', fn() {
  const visitor = new FixedWidthTextVisitor(40);
  visitor.visit({
    type: 'paragraph',
    content: [
      {type: 'text', text: 'Lorem ipsum '},
      {type: 'strike-through', content: [{type: 'text', text: 'dolor sit'}]},
      {type: 'text', text: 'amet.'}
    ]
  });
  assertEquals(visitor.getLines(), [
    'Lorem ipsum (Strike through: dolor sit)',
    'amet.',
  ]);
}});