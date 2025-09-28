#!/usr/bin/env python3
"""
Manual test script to verify file processing across different file types, subjects, and complexities.
This script creates test files and provides instructions for testing through the web interface.
"""

import os
import tempfile
from pathlib import Path

def create_test_files():
    """Create test files for different subjects and complexities"""
    test_dir = Path("test_files")
    test_dir.mkdir(exist_ok=True)
    
    # 1. Math Assignment (DOCX)
    math_content = """Math Assignment - Calculus I
Chapter 5: Integration

Problem 1: Find the indefinite integral of ∫(3x² + 2x - 5)dx

Problem 2: Evaluate the definite integral ∫₀²(x³ - x + 1)dx

Problem 3: Find the area under the curve y = x² from x = 0 to x = 3

Problem 4: Solve the differential equation dy/dx = 2x + 1 with initial condition y(0) = 3
"""
    
    with open(test_dir / "math_calculus.docx", "w", encoding="utf-8") as f:
        f.write(math_content)
    
    # 2. Science Assignment (TXT)
    science_content = """Biology Assignment - Cell Division

1. Describe the process of mitosis and identify the key stages.

2. Explain the difference between mitosis and meiosis.

3. What is the role of chromosomes in cell division?

4. Describe what happens during cytokinesis.

5. Compare and contrast animal and plant cell division.
"""
    
    with open(test_dir / "biology_cell_division.txt", "w", encoding="utf-8") as f:
        f.write(science_content)
    
    # 3. Literature Assignment (RTF)
    literature_content = """Literature Analysis - Shakespeare's Hamlet

Analyze the following themes in Hamlet:

1. Revenge and Justice: How does Hamlet's quest for revenge drive the plot?

2. Madness vs. Sanity: Is Hamlet truly mad or feigning madness?

3. Mortality and the Afterlife: How does Hamlet's contemplation of death affect his actions?

4. Family Relationships: Analyze the relationship between Hamlet and his parents.

Write a 500-word essay analyzing one of these themes in detail.
"""
    
    with open(test_dir / "literature_hamlet.rtf", "w", encoding="utf-8") as f:
        f.write(literature_content)
    
    # 4. History Assignment (CSV - as a question bank)
    history_data = """Question,Answer_Type,Subject
"What was the main cause of World War I?",Short_Answer,World_War_I
"Who was the leader of Nazi Germany?",Short_Answer,World_War_II
"Describe the impact of the Industrial Revolution on society.",Essay,Industrial_Revolution
"What were the key events of the French Revolution?",List,French_Revolution
"Explain the causes and effects of the Great Depression.",Essay,Great_Depression
"""
    
    with open(test_dir / "history_questions.csv", "w", encoding="utf-8") as f:
        f.write(history_data)
    
    # 5. Programming Assignment (Python)
    python_content = """# Programming Assignment - Data Structures

# TODO: Implement a binary search tree class
class BinarySearchTree:
    def __init__(self):
        # TODO: Initialize the root node
        pass
    
    def insert(self, value):
        # TODO: Insert a value into the BST
        pass
    
    def search(self, value):
        # TODO: Search for a value in the BST
        # Return True if found, False otherwise
        pass
    
    def delete(self, value):
        # TODO: Delete a value from the BST
        pass
    
    def inorder_traversal(self):
        # TODO: Return a list of values in inorder traversal
        pass

# TODO: Write test cases for your BST implementation
def test_binary_search_tree():
    # TODO: Create a BST and test all methods
    pass

# TODO: Implement a function to find the height of a BST
def find_height(bst):
    # TODO: Return the height of the BST
    pass
"""
    
    with open(test_dir / "programming_bst.py", "w", encoding="utf-8") as f:
        f.write(python_content)
    
    # 6. JavaScript Assignment
    js_content = """// JavaScript Assignment - DOM Manipulation

// TODO: Create a function that adds a new task to a todo list
function addTask(taskText) {
    // TODO: Create a new list item element
    // TODO: Set the text content
    // TODO: Add a delete button
    // TODO: Append to the todo list
}

// TODO: Create a function that removes a task from the list
function removeTask(taskElement) {
    // TODO: Remove the task element from the DOM
}

// TODO: Create a function that marks a task as completed
function completeTask(taskElement) {
    // TODO: Add a 'completed' class to the task
    // TODO: Toggle the completed state
}

// TODO: Implement a function to filter tasks by status
function filterTasks(status) {
    // TODO: Show/hide tasks based on status (all, active, completed)
}
"""
    
    with open(test_dir / "javascript_todo.js", "w", encoding="utf-8") as f:
        f.write(js_content)
    
    # 7. HTML Assignment
    html_content = """<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>TODO: Portfolio Website</title>
</head>
<body>
    <!-- TODO: Create a header section with your name and title -->
    <header>
        <!-- TODO: Add your name as an h1 -->
        <!-- TODO: Add a subtitle or tagline -->
    </header>
    
    <!-- TODO: Create a navigation menu -->
    <nav>
        <!-- TODO: Add links to different sections -->
    </nav>
    
    <!-- TODO: Create an about section -->
    <section id="about">
        <!-- TODO: Add a brief description about yourself -->
    </section>
    
    <!-- TODO: Create a projects section -->
    <section id="projects">
        <!-- TODO: List your projects with descriptions -->
    </section>
    
    <!-- TODO: Create a contact section -->
    <section id="contact">
        <!-- TODO: Add contact information -->
    </section>
    
    <!-- TODO: Add CSS styling -->
    <style>
        /* TODO: Style the header */
        /* TODO: Style the navigation */
        /* TODO: Style the sections */
        /* TODO: Add responsive design */
    </style>
</body>
</html>
"""
    
    with open(test_dir / "html_portfolio.html", "w", encoding="utf-8") as f:
        f.write(html_content)
    
    # 8. Complex Multi-Subject Assignment (Longer)
    complex_content = """Comprehensive Final Exam - Multiple Subjects
Student Name: _________________
Date: _________________

PART A: MATHEMATICS (25 points)
1. Solve the quadratic equation: x² - 5x + 6 = 0
2. Find the derivative of f(x) = 3x³ - 2x² + 5x - 1
3. Calculate the integral: ∫(2x + 3)dx from 0 to 2

PART B: SCIENCE (25 points)
4. Explain the process of photosynthesis in plants.
5. Describe the structure and function of DNA.
6. What is the difference between ionic and covalent bonds?

PART C: LITERATURE (25 points)
7. Analyze the theme of love in Shakespeare's Romeo and Juliet.
8. Compare and contrast the writing styles of two authors from different time periods.
9. Explain the significance of symbolism in a novel of your choice.

PART D: HISTORY (25 points)
10. Discuss the causes and consequences of the American Revolution.
11. Analyze the impact of the Industrial Revolution on society.
12. Explain the role of women in the Civil Rights Movement.

BONUS QUESTION (10 points)
Write a 200-word essay connecting themes from at least two of the subjects above.
"""
    
    with open(test_dir / "comprehensive_exam.txt", "w", encoding="utf-8") as f:
        f.write(complex_content)
    
    # 9. Simple Fill-in-the-Blank
    simple_content = """Vocabulary Quiz - English

Fill in the blanks with the correct words:

1. The __________ of the story was very exciting.
2. She felt __________ after winning the competition.
3. The __________ of the building was impressive.
4. He was __________ to hear the news.
5. The __________ of the problem was complex.

Word Bank: beginning, proud, architecture, surprised, solution
"""
    
    with open(test_dir / "simple_vocabulary.txt", "w", encoding="utf-8") as f:
        f.write(simple_content)
    
    print(f"✅ Created test files in {test_dir}/")
    print("\n📋 Test Files Created:")
    print("1. math_calculus.docx - Math problems with calculations")
    print("2. biology_cell_division.txt - Science short answers")
    print("3. literature_hamlet.rtf - Literature essay questions")
    print("4. history_questions.csv - History question bank")
    print("5. programming_bst.py - Python code completion")
    print("6. javascript_todo.js - JavaScript DOM manipulation")
    print("7. html_portfolio.html - HTML/CSS completion")
    print("8. comprehensive_exam.txt - Multi-subject complex exam")
    print("9. simple_vocabulary.txt - Simple fill-in-the-blank")
    
    print("\n🧪 Testing Instructions:")
    print("1. Start your AssignmentAI server")
    print("2. Go to the file upload interface")
    print("3. Upload each test file individually")
    print("4. Verify that questions are correctly identified")
    print("5. Check that answers are generated appropriately")
    print("6. Test the preview and download functionality")
    
    return test_dir

if __name__ == "__main__":
    create_test_files()
