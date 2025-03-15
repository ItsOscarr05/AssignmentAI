# ai_models/model.py
import torch
import torch.nn as nn

def simple_model():
    model = nn.Sequential(
        nn.Linear(10, 128),
        nn.ReLU(),
        nn.Linear(128, 1),
        nn.Sigmoid()
    )
    return model
