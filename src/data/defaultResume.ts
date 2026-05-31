export const DEFAULT_RESUME_TITLE = 'Editorial Resume'

export const DEFAULT_LATEX_TEMPLATE = String.raw`\documentclass[10pt,letterpaper]{article}
\usepackage[margin=0.65in]{geometry}
\usepackage[hidelinks]{hyperref}
\usepackage{enumitem}
\usepackage{tabularx}
\usepackage{titlesec}
\usepackage{xcolor}
\pagestyle{empty}
\setlength{\parindent}{0pt}
\setlist[itemize]{leftmargin=1.25em, itemsep=0.18em, topsep=0.18em}
\titleformat{\section}{\large\bfseries\color{black}}{}{0em}{}[\titlerule]
\titlespacing*{\section}{0pt}{0.9em}{0.45em}

\newcommand{\resumeItem}[1]{\item #1}
\newcommand{\resumeSubheading}[4]{
  \textbf{#1} \hfill #2 \\
  \textit{#3} \hfill \textit{#4} \\
}

\begin{document}

{\Huge \textbf{Alex Morgan}} \\
\href{mailto:alex@email.com}{alex@email.com} $|$
(555) 123-4567 $|$
New York, NY $|$
\href{https://linkedin.com/in/alexmorgan}{linkedin.com/in/alexmorgan}

\section{Summary}
Product-minded software engineer with 5+ years of experience building customer-facing web applications, internal tooling, and resilient frontend systems.

\section{Experience}
\resumeSubheading{Senior Frontend Engineer}{2023 -- Present}{Northstar Studio}{Brooklyn, NY}
\begin{itemize}
  \resumeItem{Led the redesign of a portfolio analytics product used by 18,000+ monthly users, improving task completion by 27\%.}
  \resumeItem{Built a shared React component system with TypeScript, Storybook, and accessibility checks that reduced duplicate UI work across three teams.}
  \resumeItem{Partnered with product and support to define release quality standards, shrinking regressions in production by 35\%.}
\end{itemize}

\resumeSubheading{Software Engineer}{2020 -- 2023}{Paperline Labs}{Remote}
\begin{itemize}
  \resumeItem{Implemented live document editing tools, autosave workflows, and audit history views for compliance-heavy customer accounts.}
  \resumeItem{Migrated a legacy dashboard to modern React with incremental feature flags, improving Lighthouse performance from 58 to 91.}
\end{itemize}

\section{Projects}
\textbf{Resume Atelier} \hfill React, TypeScript, Firebase, LaTeX \\
Built a split-pane resume editor with autosave, browser-side LaTeX compilation, PDF preview, and multi-version resume management.

\section{Education}
\resumeSubheading{B.S. in Computer Science}{2016 -- 2020}{Purdue University}{West Lafayette, IN}

\section{Skills}
React, TypeScript, Firebase, Node.js, Tailwind CSS, Design Systems, Product Analytics, Accessibility, Testing, CI/CD

\end{document}
`
