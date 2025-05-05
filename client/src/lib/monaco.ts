import * as monaco from 'monaco-editor';

// Setup Monaco environment to handle web workers
self.MonacoEnvironment = {
  getWorkerUrl: function (_moduleId: string, label: string) {
    if (label === 'json') {
      return './json.worker.js';
    }
    if (label === 'css' || label === 'scss' || label === 'less') {
      return './css.worker.js';
    }
    if (label === 'html' || label === 'handlebars' || label === 'razor') {
      return './html.worker.js';
    }
    if (label === 'typescript' || label === 'javascript') {
      return './ts.worker.js';
    }
    return './editor.worker.js';
  },
  // Fallback implementation when web workers are not available
  getWorker: function() {
    return new Worker(
      // Use a base worker and include monaco as an inline dependency
      URL.createObjectURL(
        new Blob(
          [
            `
              self.importScripts('https://cdn.jsdelivr.net/npm/monaco-editor@0.36.1/min/vs/base/worker/workerMain.js');
            `
          ],
          { type: 'text/javascript' }
        )
      )
    );
  }
};

// This function will be called once the component is mounted
export function setupMonaco(
  container: HTMLElement,
  code: string,
  onChange: (value: string) => void
): monaco.editor.IStandaloneCodeEditor {
  // Register Solidity language if it hasn't been registered yet
  if (!monaco.languages.getLanguages().some(lang => lang.id === 'solidity')) {
    monaco.languages.register({ id: 'solidity' });
    
    // Define tokenizer for Solidity syntax highlighting
    monaco.languages.setMonarchTokensProvider('solidity', {
      tokenizer: {
        root: [
          [/\/\/.*$/, 'comment'],
          [/\/\*/, 'comment', '@comment'],
          [/\b(contract|function|struct|enum|mapping|address|uint|int|bool|string|bytes|event|modifier|require|revert|assert|constructor|payable|memory|storage|calldata|public|private|external|internal|view|pure|override|virtual|returns|emit|import|pragma|using|library|interface)\b/, 'keyword'],
          [/\b(msg|block|tx|abi|blockhash|gasleft|addmod|mulmod|keccak256|sha256|ripemd160|ecrecover)\b/, 'builtin'],
          [/\b(wei|gwei|ether|seconds|minutes|hours|days|weeks)\b/, 'builtin'],
          [/\b(0x[a-fA-F0-9]+)\b/, 'number.hex'],
          [/\b([0-9]+(\.[0-9]+)?)\b/, 'number'],
          [/"([^"\\]|\\.)*$/, 'string.invalid'],
          [/"/, 'string', '@string_double'],
          [/'/, 'string', '@string_single'],
        ],
        comment: [
          [/[^\/*]+/, 'comment'],
          [/\/\*/, 'comment', '@push'],
          [/\*\//, 'comment', '@pop'],
          [/[\/*]/, 'comment'],
        ],
        string_double: [
          [/[^\\"]+/, 'string'],
          [/\\./, 'string.escape'],
          [/"/, 'string', '@pop'],
        ],
        string_single: [
          [/[^\\']+/, 'string'],
          [/\\./, 'string.escape'],
          [/'/, 'string', '@pop'],
        ],
      }
    });

    // Define language configuration for Solidity
    monaco.languages.setLanguageConfiguration('solidity', {
      comments: {
        lineComment: '//',
        blockComment: ['/*', '*/'],
      },
      brackets: [
        ['{', '}'],
        ['[', ']'],
        ['(', ')'],
      ],
      autoClosingPairs: [
        { open: '{', close: '}' },
        { open: '[', close: ']' },
        { open: '(', close: ')' },
        { open: '"', close: '"' },
        { open: "'", close: "'" },
      ],
    });
  }

  // Add Solidity code completion provider
  monaco.languages.registerCompletionItemProvider('solidity', {
    provideCompletionItems: (model, position) => {
      // Calculate the word range at position
      const word = model.getWordUntilPosition(position);
      const range = {
        startLineNumber: position.lineNumber,
        endLineNumber: position.lineNumber,
        startColumn: word.startColumn,
        endColumn: word.endColumn
      };
      
      const suggestions = [
        {
          label: 'contract',
          kind: monaco.languages.CompletionItemKind.Keyword,
          insertText: 'contract ${1:Name} {\n\t$0\n}',
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          documentation: 'Contract declaration',
          range: range
        },
        {
          label: 'function',
          kind: monaco.languages.CompletionItemKind.Keyword,
          insertText: 'function ${1:name}(${2:params}) ${3:visibility} ${4:returns (${5:type})} {\n\t$0\n}',
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          documentation: 'Function declaration',
          range: range
        },
        {
          label: 'event',
          kind: monaco.languages.CompletionItemKind.Keyword,
          insertText: 'event ${1:Name}(${2:params});',
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          documentation: 'Event declaration',
          range: range
        },
        {
          label: 'modifier',
          kind: monaco.languages.CompletionItemKind.Keyword,
          insertText: 'modifier ${1:name}(${2:params}) {\n\t_;\n}',
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          documentation: 'Modifier declaration',
          range: range
        },
        {
          label: 'require',
          kind: monaco.languages.CompletionItemKind.Snippet,
          insertText: 'require(${1:condition}, "${2:error message}");',
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          documentation: 'Require statement',
          range: range
        },
        {
          label: 'mapping',
          kind: monaco.languages.CompletionItemKind.Snippet,
          insertText: 'mapping(${1:keyType} => ${2:valueType}) ${3:name};',
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          documentation: 'Mapping declaration',
          range: range
        },
        // Common data types
        {
          label: 'address',
          kind: monaco.languages.CompletionItemKind.Keyword,
          insertText: 'address',
          documentation: 'Address type',
          range: range
        },
        {
          label: 'uint256',
          kind: monaco.languages.CompletionItemKind.Keyword,
          insertText: 'uint256',
          documentation: '256-bit unsigned integer',
          range: range
        },
        {
          label: 'bytes32',
          kind: monaco.languages.CompletionItemKind.Keyword,
          insertText: 'bytes32',
          documentation: '32 bytes',
          range: range
        },
        {
          label: 'string',
          kind: monaco.languages.CompletionItemKind.Keyword,
          insertText: 'string',
          documentation: 'String type',
          range: range
        }
      ];
      
      return { suggestions };
    }
  });

  // Define a custom theme that better supports Solidity
  monaco.editor.defineTheme('solidity-dark', {
    base: 'vs-dark',
    inherit: true,
    rules: [
      { token: 'comment', foreground: '6A9955', fontStyle: 'italic' },
      { token: 'keyword', foreground: '569CD6', fontStyle: 'bold' },
      { token: 'number', foreground: 'B5CEA8' },
      { token: 'string', foreground: 'CE9178' },
      { token: 'builtin', foreground: '4EC9B0' },
    ],
    colors: {
      'editor.background': '#1E1E1E',
      'editor.foreground': '#D4D4D4',
      'editor.lineHighlightBackground': '#2D2D30',
      'editorCursor.foreground': '#AEAFAD',
      'editor.selectionBackground': '#264F78',
      'editor.inactiveSelectionBackground': '#3A3D41',
    }
  });

  // Create and configure the editor
  const editor = monaco.editor.create(container, {
    value: code,
    language: 'solidity',
    theme: 'solidity-dark',
    automaticLayout: true,
    minimap: { enabled: true },
    scrollBeyondLastLine: false,
    fontSize: 14,
    fontFamily: '"JetBrains Mono", monospace',
    lineNumbers: 'on',
    renderLineHighlight: 'all',
    scrollbar: {
      useShadows: false,
      verticalHasArrows: true,
      horizontalHasArrows: true,
      vertical: 'visible',
      horizontal: 'visible',
      verticalScrollbarSize: 10,
      horizontalScrollbarSize: 10,
    },
    autoIndent: 'full',
    formatOnPaste: true,
    formatOnType: true,
  });

  // Listen for content changes and propagate to the parent component
  editor.onDidChangeModelContent(() => {
    onChange(editor.getValue());
  });

  return editor;
}

// Function to dispose of the editor when the component unmounts
export function disposeMonaco(editor: monaco.editor.IStandaloneCodeEditor): void {
  if (editor) {
    editor.dispose();
  }
}
