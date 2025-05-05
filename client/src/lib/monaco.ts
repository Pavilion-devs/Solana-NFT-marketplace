import * as monaco from 'monaco-editor';

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

  // Create and configure the editor
  const editor = monaco.editor.create(container, {
    value: code,
    language: 'solidity',
    theme: 'vs-dark',
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
