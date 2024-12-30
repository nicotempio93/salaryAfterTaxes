// script.js - Salary Calculator
document.addEventListener('DOMContentLoaded', () => {
    const salaryForm = document.getElementById('salary-form');
    
    salaryForm.addEventListener('submit', (e) => {
        e.preventDefault();
        calculateSalary();
    });
});

function calculateSalary() {
    const hoursWorked = parseFloat(document.getElementById('hoursWorked').value);
    const hourlyWage = parseFloat(document.getElementById('hourlyWage').value);
    const taxRate = parseFloat(document.querySelector('input[name="taxType"]:checked').value);
    
    if (isNaN(hoursWorked) || isNaN(hourlyWage)) {
        displayResult('Please enter valid numbers');
        return;
    }
    
    const salaryAfterTax = (hoursWorked * hourlyWage) * taxRate;
    displayResult(`Your salary after taxes will be ${salaryAfterTax.toFixed(2)} kr`);
}

function displayResult(message) {
    document.getElementById('result-display').textContent = message;
}

