"""
Assignment: Implement the function fibonacci(n) that returns the nth Fibonacci number.
Constraints: Use iterative approach; handle n>=0; fibonacci(0)=0, fibonacci(1)=1.
"""
def fibonacci(n):
def fibonacci(n):
    if n < 0:
        raise ValueError("Input must be a non-negative integer.")
    elif n == 0:
        return 0
    elif n == 1:
        return 1
    
    a, b = 0, 1
    for _ in range(2, n + 1):
        a, b = b, a + b
    return b