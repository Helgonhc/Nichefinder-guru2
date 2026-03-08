---
name: piramyd-intelligence
description: Access to high-end Piramyd Cloud AI models (Llama-4, GPT-5.3, GLM-5). Used as a high-intelligence fallback or for specialized reasoning tasks.
version: 1.0.0
---

# Piramyd Intelligence Skill

This skill allows Antigravity agents to delegate complex reasoning or coding tasks to alternative high-performance models when the primary provider reaches its limits or when specific model capabilities (like Llama-4's 500k context) are required.

## Available Models

- **Llama-4-maverick**: High intelligence, 500k context. Best for architectural analysis.
- **gpt-5.3-codex**: Specialized in software engineering and code generation.
- **Glm-5**: Excellent for creative reasoning and Portuguese copywriting.
- **Minimax-m2.1**: Efficient and fast alternative.

## Usage

Agents should use the `piramyd_chat.py` script to interact with these models.

```bash
python .agent/skills/piramyd-intelligence/scripts/piramyd_chat.py --model <MODEL_ID> --prompt <PROMPT_TEXT>
```

## Security

The API key is stored in the workspace `.env` file as `PIRAMYD_API_KEY`.
