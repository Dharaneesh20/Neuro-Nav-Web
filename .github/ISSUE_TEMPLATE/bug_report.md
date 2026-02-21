name: Bug Report
description: Report a bug in NeuroNav
labels: [bug]
assignees: []

body:
  - type: markdown
    attributes:
      value: |
        Thank you for reporting a bug! Please provide as much detail as possible to help us fix it quickly.

  - type: input
    id: title
    attributes:
      label: Title
      description: Brief description of the bug
      placeholder: e.g., "Calm score not updating on page refresh"
    validations:
      required: true

  - type: textarea
    id: description
    attributes:
      label: Description
      description: Detailed description of the bug
      placeholder: What happened? What did you expect to happen?
    validations:
      required: true

  - type: textarea
    id: steps
    attributes:
      label: Steps to Reproduce
      description: Steps to reproduce the issue
      placeholder: |
        1. Go to '...'
        2. Click on '...'
        3. See error
    validations:
      required: true

  - type: textarea
    id: expected
    attributes:
      label: Expected Behavior
      description: What should happen instead?
    validations:
      required: true

  - type: dropdown
    id: browser
    attributes:
      label: Browser
      description: Which browser are you using?
      options:
        - Chrome
        - Firefox
        - Safari
        - Edge
        - Other
    validations:
      required: true

  - type: dropdown
    id: os
    attributes:
      label: Operating System
      options:
        - Windows
        - macOS
        - Linux
        - Other
    validations:
      required: true

  - type: input
    id: version
    attributes:
      label: NeuroNav Version
      placeholder: e.g., v1.0.0
    validations:
      required: true

  - type: textarea
    id: logs
    attributes:
      label: Error Logs
      description: Console error messages or stack traces
      render: shell

  - type: textarea
    id: screenshots
    attributes:
      label: Screenshots
      description: If applicable, add screenshots of the issue

  - type: textarea
    id: additional
    attributes:
      label: Additional Context
      description: Any other information that might be helpful
