#include <stdio.h>
#include <stdlib.h>
#include <string.h>

// Example C file for testing the chat window functionality
// This file contains various complexity patterns for analysis

// Simple function with linear complexity
int sum_array(int arr[], int size) {
    int sum = 0;
    for (int i = 0; i < size; i++) {
        sum += arr[i];
    }
    return sum;
}

// Function with nested loops - O(n²) complexity
void bubble_sort(int arr[], int n) {
    for (int i = 0; i < n - 1; i++) {
        for (int j = 0; j < n - i - 1; j++) {
            if (arr[j] > arr[j + 1]) {
                // Swap elements
                int temp = arr[j];
                arr[j] = arr[j + 1];
                arr[j + 1] = temp;
            }
        }
    }
}

// Recursive function with exponential complexity
int fibonacci(int n) {
    if (n <= 1) {
        return n;
    }
    return fibonacci(n - 1) + fibonacci(n - 2);
}

// Function with multiple decision points
int categorize_number(int num) {
    if (num < 0) {
        return -1; // Negative
    } else if (num == 0) {
        return 0;  // Zero
    } else if (num % 2 == 0) {
        if (num > 100) {
            return 3; // Large even
        } else {
            return 2; // Small even
        }
    } else {
        if (num > 100) {
            return 5; // Large odd
        } else {
            return 4; // Small odd
        }
    }
}

// Function with string manipulation
char* reverse_string(char* str) {
    if (str == NULL) {
        return NULL;
    }
    
    int len = strlen(str);
    char* reversed = malloc(len + 1);
    
    if (reversed == NULL) {
        return NULL; // Memory allocation failed
    }
    
    for (int i = 0; i < len; i++) {
        reversed[i] = str[len - 1 - i];
    }
    reversed[len] = '\0';
    
    return reversed;
}

// Main function with various test cases
int main() {
    printf("CAnalyzerAI Chat Window Test File\n");
    printf("==================================\n\n");
    
    // Test array sum
    int numbers[] = {1, 2, 3, 4, 5};
    int size = sizeof(numbers) / sizeof(numbers[0]);
    printf("Sum of array: %d\n", sum_array(numbers, size));
    
    // Test sorting
    int sort_test[] = {64, 34, 25, 12, 22, 11, 90};
    int sort_size = sizeof(sort_test) / sizeof(sort_test[0]);
    printf("Before sorting: ");
    for (int i = 0; i < sort_size; i++) {
        printf("%d ", sort_test[i]);
    }
    printf("\n");
    
    bubble_sort(sort_test, sort_size);
    printf("After sorting: ");
    for (int i = 0; i < sort_size; i++) {
        printf("%d ", sort_test[i]);
    }
    printf("\n");
    
    // Test fibonacci
    printf("Fibonacci(10): %d\n", fibonacci(10));
    
    // Test categorization
    int test_nums[] = {-5, 0, 25, 50, 150, 75};
    int test_count = sizeof(test_nums) / sizeof(test_nums[0]);
    for (int i = 0; i < test_count; i++) {
        printf("Category of %d: %d\n", test_nums[i], categorize_number(test_nums[i]));
    }
    
    // Test string reversal
    char test_string[] = "Hello, World!";
    char* reversed = reverse_string(test_string);
    if (reversed != NULL) {
        printf("Original: %s\n", test_string);
        printf("Reversed: %s\n", reversed);
        free(reversed);
    }
    
    return 0;
}
