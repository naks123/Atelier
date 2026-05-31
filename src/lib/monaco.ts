import type * as Monaco from 'monaco-editor'

let configured = false

export function configureLatexMonaco(monaco: typeof Monaco) {
  if (configured) {
    return
  }

  configured = true

  monaco.languages.register({ id: 'latex' })
  monaco.languages.setMonarchTokensProvider('latex', {
    tokenizer: {
      root: [
        [/%.*$/, 'comment'],
        [/\\[a-zA-Z@]+/, 'keyword'],
        [/\$(.|\n)*?\$/, 'string'],
        [/[{}()[\]]/, '@brackets'],
        [/[\^_&]/, 'operator'],
        [/\b(?:section|item|begin|end|href)\b/, 'keyword'],
      ],
    },
  })

  monaco.languages.setLanguageConfiguration('latex', {
    comments: {
      lineComment: '%',
    },
    autoClosingPairs: [
      { open: '{', close: '}' },
      { open: '[', close: ']' },
      { open: '(', close: ')' },
    ],
    surroundingPairs: [
      { open: '{', close: '}' },
      { open: '[', close: ']' },
      { open: '(', close: ')' },
      { open: '$', close: '$' },
    ],
  })

  monaco.editor.defineTheme('resume-atelier', {
    base: 'vs',
    inherit: true,
    rules: [
      { token: 'comment', foreground: '9ca3af' },
      { token: 'keyword', foreground: '0d8c6c', fontStyle: 'bold' },
      { token: 'string', foreground: '2563eb' },
      { token: 'operator', foreground: '4b5563' },
    ],
    colors: {
      'editor.background': '#ffffff',
      'editorLineNumber.foreground': '#c0c6cf',
      'editorLineNumber.activeForeground': '#6b7280',
      'editorCursor.foreground': '#202123',
      'editor.selectionBackground': '#dbeafe',
      'editor.inactiveSelectionBackground': '#eff6ff',
    },
  })
}
