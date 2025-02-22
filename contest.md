## Introduction
I agree with team opinion that Composer should be redesigned 
But I decided to start from problems that should be done anyway and independently
1. Nested styling
2. Formatted text history (ctrl+z)
3. Markdown parser


## Nested styling
The first idea was to implement it on dom as it was but it's really hard to monitor that dom is ok and has best structure
Here I decided to use additional data structure
I chose ApiFormattedText as structure because it is simple and contains everything for comfortable using (entities intersection and etc)
The idea is to keep everything as it is but add saving to structure in WebPagePreview.tsx (there is links detection that already is parsing html)
Moreover I added to TextFormatter.tsx update of data structure here we need to call setHtml
Inside MessageInput.tsx we set innerHTML after that we have to restore selection


## Formatted text history (ctrl+z)
This additional data structure can also be used for history
The idea is to store only difference between text and entities
Also my friend advised to collapse letters to words
This incredible data structure allows to restore not only content but also selection or cursor position
I do saving in WebPagePreview.tsx and handle ctrl+z in MessageInput.tsx


## Markdow parser
If the parser detects any problem it just return the original text that can be sended
The detected problem is returned with offset that can be highlighted
For now I have added parser to the end of parseHtmlAsFormattedText and only launch it if there is no other entities
It is good to have 2 editing regimes so I added function that do reverse to markdown
I covered both function with tests/markdown.test.ts 


## Additional
There was some problems with Safari that insert double newlines <div><br> but if change style to inline-block it will insert \n
Also we need little workaround in Safari to Enter inside Blockquoute, I decided to rewrite Enter event  
To run away from styled block I decided to add textNode to the end and move to it
