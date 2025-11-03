# AI Model Configuration by Subscription Tier

## Overview

AssignmentAI uses different OpenAI models based on user subscription tiers to optimize performance, cost, and capabilities for each plan level.

## Model Mapping

| Subscription Plan | AI Model       | Token Limit | Description                                         |
| ----------------- | -------------- | ----------- | --------------------------------------------------- |
| **Free**          | `gpt-5-nano`   | 100,000     | Fast, efficient model for basic assignments         |
| **Plus**          | `gpt-5-mini`   | 250,000     | Balanced performance and cost for enhanced features |
| **Pro**           | `gpt-5-mini`   | 500,000     | Advanced model for professional-grade assignments   |
| **Max**           | `gpt-5`        | 1,000,000   | Premium model for maximum quality and complexity    |

## Implementation Details

### Backend Configuration

The model selection is handled in `backend/app/services/payment_service.py`:

```python
model_mapping = {
    'price_free': {
        'model': 'gpt-5-nano',
        'token_limit': 100000
    },
    'price_plus': {
        'model': 'gpt-5-mini',
        'token_limit': 250000
    },
    'price_pro': {
        'model': 'gpt-5-mini',
        'token_limit': 500000
    },
    'price_max': {
        'model': 'gpt-5',
        'token_limit': 800000
    }
}
```

### Frontend Configuration

The frontend displays the appropriate model in `frontend/src/pages/Settings.tsx`:

```typescript
const subscriptionConfig: Record<SubscriptionPlan, SubscriptionConfig> = {
  free: {
    model: 'gpt-5-nano',
    tokenLimit: 100000,
    label: 'GPT-5 Nano',
  },
  plus: {
    model: 'gpt-5-mini',
    tokenLimit: 250000,
    label: 'GPT-5 Mini',
  },
  pro: {
    model: 'gpt-5-mini',
    tokenLimit: 500000,
    label: 'GPT-5 Mini',
  },
  max: {
    model: 'gpt-5',
    tokenLimit: 1000000,
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

### GPT-5 Mini (Plus & Pro Plans)

- **Speed**: Fast
- **Cost**: Low to Medium
- **Capabilities**: Good balance of quality and efficiency with advanced reasoning
- **Best for**: Most common assignment types (Plus) and complex assignments (Pro)
- **Difference**: Plus plan has 250,000 tokens/month, Pro plan has 500,000 tokens/month

### GPT-5 (Max Plan)

- **Speed**: Slower
- **Cost**: Highest
- **Capabilities**: Maximum quality and complexity
- **Best for**: Premium assignments, research papers, complex analysis

## Token Usage

Each subscription tier has a monthly token limit:

- **Free**: 100,000 tokens/month
- **Plus**: 250,000 tokens/month
- **Pro**: 500,000 tokens/month
- **Max**: 1,000,000 tokens/month

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
