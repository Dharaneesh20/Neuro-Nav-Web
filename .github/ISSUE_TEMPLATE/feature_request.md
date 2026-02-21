name: Feature Request
description: Suggest a new feature for NeuroNav
labels: [enhancement]
assignees: []

body:
  - type: markdown
    attributes:
      value: |
        Thank you for suggesting a feature! Please provide clear details to help us understand your idea.

  - type: input
    id: title
    attributes:
      label: Feature Title
      description: Brief title for the feature
      placeholder: e.g., "Add dark mode theme"
    validations:
      required: true

  - type: textarea
    id: description
    attributes:
      label: Description
      description: Detailed description of the requested feature
      placeholder: What problem does this solve? How would it improve the app?
    validations:
      required: true

  - type: textarea
    id: use-case
    attributes:
      label: Use Case
      description: Real-world scenario where this feature would be useful
    validations:
      required: true

  - type: textarea
    id: implementation
    attributes:
      label: Proposed Implementation (Optional)
      description: How do you think this should be implemented?

  - type: dropdown
    id: priority
    attributes:
      label: Priority
      options:
        - Low
        - Medium
        - High
        - Critical
    validations:
      required: true

  - type: textarea
    id: additional
    attributes:
      label: Additional Context
      description: Any other information (screenshots, mockups, research, etc.)

  - type: checkboxes
    id: community
    attributes:
      label: Community Interest
      description: Is this a community-requested feature?
      options:
        - label: Yes, multiple users have requested this
        - label: No, this is my personal suggestion
