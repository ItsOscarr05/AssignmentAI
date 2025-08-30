# AI Model Configuration by Subscription Tier

## Overview

AssignmentAI uses different OpenAI models based on user subscription tiers to optimize performance, cost, and capabilities for each plan level.

## Model Mapping

| Subscription Plan | AI Model        | Token Limit | Description                                         |
| ----------------- | --------------- | ----------- | --------------------------------------------------- |
| **Free**          | `gpt-5-nano`    | 30,000      | Fast, efficient model for basic assignments         |
| **Plus**          | `gpt-4.1-mini`  | 50,000      | Balanced performance and cost for enhanced features |
| **Pro**           | `gpt-4-turbo`   | 75,000      | Advanced model for professional-grade assignments   |
| **Max**           | `gpt-5`         | 100,000     | Premium model for maximum quality and complexity    |

## Implementation Details

### Backend Configuration

The model selection is handled in `backend/app/services/payment_service.py`:

```python
model_mapping = {
    'price_free': {
        'model': 'gpt-5-nano',
        'token_limit': 30000
    },
    'price_plus': {
        'model': 'gpt-4.1-mini',
        'token_limit': 50000
    },
    'price_pro': {
        'model': 'gpt-4-turbo',
        'token_limit': 75000
    },
    'price_max': {
        'model': 'gpt-5',
        'token_limit': 100000
    }
}
```

### Frontend Configuration

The frontend displays the appropriate model in `frontend/src/pages/Settings.tsx`:

```typescript
const subscriptionConfig: Record<SubscriptionPlan, SubscriptionConfig> = {
  free: {
    model: 'gpt-5-nano',
    tokenLimit: 30000,
    label: 'GPT-5 Nano',
  },
  plus: {
    model: 'gpt-4.1-mini',
    tokenLimit: 50000,
    label: 'GPT-4.1 Mini',
  },
  pro: {
    model: 'gpt-4-turbo',
    tokenLimit: 75000,
    label: 'GPT-4 Turbo',
  },
  max: {
    model: 'gpt-5',
    tokenLimit: 100000,
    label: 'GPT-5',
  },
};
```

### Environment Variables

Only one OpenAI API key is required in the `.env` file:

```env
OPENAI_API_KEY=${OPENAI_API_KEY}
OPENAI_MODEL=gpt-4.1-nano  # Default model (overridden by subscription)
```

## Model Characteristics

### GPT-5 Nano (Free Plan)

- **Speed**: Very fast
- **Cost**: Lowest
- **Capabilities**: Good for basic assignment generation
- **Best for**: Simple tasks, quick responses

### GPT-4.1 Mini (Plus Plan)

- **Speed**: Fast
- **Cost**: Low
- **Capabilities**: Good balance of quality and efficiency
- **Best for**: Most common assignment types

### GPT-4 Turbo (Pro Plan)

- **Speed**: Fast
- **Cost**: Medium
- **Capabilities**: Advanced reasoning and analysis
- **Best for**: Complex assignments, detailed analysis

### GPT-5 (Max Plan)

- **Speed**: Slower
- **Cost**: Highest
- **Capabilities**: Maximum quality and complexity
- **Best for**: Premium assignments, research papers, complex analysis

## Token Usage

Each subscription tier has a monthly token limit:

- **Free**: 30,000 tokens/month
- **Plus**: 50,000 tokens/month
- **Pro**: 75,000 tokens/month
- **Max**: 100,000 tokens/month

Token usage is tracked per user and resets monthly.

## Cost Optimization

This tiered approach ensures:

1. **Cost control**: Users get appropriate models for their needs
2. **Performance optimization**: Faster models for basic tasks
3. **Quality scaling**: Better models for premium users
4. **Resource efficiency**: Optimal use of API quotas

## Future Considerations

- Models can be easily updated by changing the mapping in `PaymentService`
- New models can be added without code changes
- Token limits can be adjusted per plan
- Additional model providers can be integrated

## Monitoring

Token usage is tracked in the `usage` table and can be monitored through:

- User dashboard
- Admin analytics
- Usage reports
- Billing integration
