
let transactions = [];

// Get DOM elements for display and input
const balanceDisplay = document.getElementById('balance');
const incomeDisplay = document.getElementById('income');
const expenseDisplay = document.getElementById('expense');
const transactionList = document.getElementById('transaction-list');
const form = document.getElementById('transaction-form');
const descriptionInput = document.getElementById('description');
const amountInput = document.getElementById('amount');
const messageBox = document.getElementById('message-box');


function loadTransactions() {
    const savedTransactions = localStorage.getItem('expenseTrackerTransactions');

    // If data exists, parse it. Otherwise, 'transactions' remains an empty array.
    if (savedTransactions) {
        try {
            transactions = JSON.parse(savedTransactions);
        } catch (error) {
            console.error("Error parsing transactions from localStorage:", error);
            // Fallback to empty array if parsing fails
            transactions = [];
            showMessage('Error loading data. Data reset.', 'error');
        }
    }
}

/**
 * Saves the current 'transactions' array to the browser's localStorage.
 */
function saveTransactions() {
    // Convert the JavaScript array to a JSON string before saving
    localStorage.setItem('expenseTrackerTransactions', JSON.stringify(transactions));
}

// === 3. CORE DISPLAY AND CALCULATIONS ===

/**
 * Formats a number into currency string.
 * @param {number} num - The number to format.
 * @returns {string} - The formatted currency string.
 */
function formatCurrency(num) {
    // Change locale to 'en-IN' (English, India) and currency to 'INR' (Indian Rupee)
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
    }).format(num);
}

/**
 * Updates the balance, income, and expense display totals.
 */
function updateSummary() {
    // 1. Calculate the total amounts
    const amounts = transactions.map(t => t.amount);

    const totalIncome = amounts
        .filter(item => item > 0)
        .reduce((acc, item) => acc += item, 0);

    // Expenses are stored as negative numbers, so we sum them up and then negate the result
    // to display a positive total expense value.
    const totalExpense = amounts
        .filter(item => item < 0)
        .reduce((acc, item) => acc += item, 0);

    const netBalance = totalIncome + totalExpense;

    // 2. Update the DOM elements with the formatted values
    balanceDisplay.textContent = formatCurrency(netBalance);
    incomeDisplay.textContent = formatCurrency(totalIncome);
    // Use Math.abs() to display the expense total as a positive number
    expenseDisplay.textContent = formatCurrency(Math.abs(totalExpense));
}

/**
 * Displays a temporary alert message to the user.
 * @param {string} message - The text of the message.
 * @param {string} type - 'success', 'error', or 'info' for styling.
 */
function showMessage(message, type) {
    messageBox.textContent = message;
    messageBox.className = ''; // Reset classes
    
    let baseClasses = "p-3 rounded-lg font-medium mb-4 transition duration-300 ";

    if (type === 'error') {
        messageBox.className = baseClasses + 'bg-red-100 text-red-800 shadow-md';
    } else if (type === 'success') {
        messageBox.className = baseClasses + 'bg-green-100 text-green-800 shadow-md';
    } else { // info
        messageBox.className = baseClasses + 'bg-blue-100 text-blue-800 shadow-md';
    }

    messageBox.classList.remove('hidden');

    // Hide the message after 3 seconds
    setTimeout(() => {
        messageBox.classList.add('hidden');
    }, 3000);
}

// === 4. TRANSACTION RENDERING AND HANDLING ===

/**
 * Creates the HTML list item for a single transaction.
 * @param {object} transaction - The transaction object {id, description, amount, timestamp}.
 */
function addTransactionToDOM(transaction) {
    // Determine if it's income (positive) or expense (negative)
    const isIncome = transaction.amount > 0;
    const sign = isIncome ? '+' : '-';
    
    // Get the absolute value for display
    const absoluteAmount = Math.abs(transaction.amount);

    // Create the list item element
    const listItem = document.createElement('li');
    
    // Use the custom CSS classes for styling
    listItem.className = `flex justify-between items-center p-4 rounded-lg shadow-sm border-r-4 
                          ${isIncome ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50'}`;

    // Set the HTML content for the transaction item
    listItem.innerHTML = `
        <span class="text-gray-800 font-medium truncate">${transaction.description}</span>
        <div class="flex items-center space-x-3">
            <span class="font-semibold text-lg ${isIncome ? 'text-green-600' : 'text-red-600'}">
                ${sign}${formatCurrency(absoluteAmount)}
            </span>
            <button data-id="${transaction.id}" 
                    class="delete-btn text-gray-400 hover:text-red-600 transition duration-150 p-1 rounded-full hover:bg-red-100"
                    title="Delete Transaction">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 pointer-events-none" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd" />
                </svg>
            </button>
        </div>
    `;

    // Insert the new list item at the beginning (newest first)
    transactionList.prepend(listItem);
}

/**
 * Deletes a transaction from the array and updates local storage and the display.
 * @param {string} id - The ID of the transaction to delete.
 */
function deleteTransaction(id) {
    // Filter out the transaction with the matching ID
    transactions = transactions.filter(t => t.id !== id);
    
    // Save the updated array
    saveTransactions();

    // Re-render the entire list and summary
    init();

    showMessage('Transaction deleted successfully!', 'success');
}

/**
 * Re-renders all transactions in the list container.
 */
function renderTransactions() {
    // Clear the current list contents
    transactionList.innerHTML = '';
    
    if (transactions.length === 0) {
         transactionList.innerHTML = '<li class="text-gray-500 text-center p-4">No transactions recorded yet.</li>';
         return;
    }

    // Sort by timestamp (Newest first, descending)
    transactions.sort((a, b) => b.timestamp - a.timestamp);

    // Loop through the sorted array and add each item to the DOM
    transactions.forEach(addTransactionToDOM);
}


// === 5. EVENT HANDLERS ===

/**
 * Handles the form submission for adding a new transaction.
 * @param {Event} e - The submit event object.
 */
function handleFormSubmit(e) {
    e.preventDefault();

    const description = descriptionInput.value.trim();
    // Parse the amount as a floating-point number
    const amount = parseFloat(amountInput.value);

    // Basic validation
    if (description === '' || isNaN(amount) || amount === 0) {
        showMessage('Please enter a valid description and a non-zero amount.', 'error');
        return;
    }

    // Create a new transaction object
    const newTransaction = {
        // Use the current timestamp as a simple unique ID
        id: Date.now().toString(),
        description: description,
        amount: amount,
        timestamp: Date.now(), // Store timestamp for sorting
    };

    // Add to the global array
    transactions.push(newTransaction);
    
    // Save, update display, and clear inputs
    saveTransactions();
    init(); // Re-initializes and refreshes all parts of the app

    // Clear the form fields
    descriptionInput.value = '';
    amountInput.value = '';

    showMessage('Transaction added successfully!', 'success');
}

/**
 * Handles click events on the transaction list (specifically for delete buttons).
 * @param {Event} e - The click event object.
 */
function handleListClick(e) {
    // Check if the clicked element or its parent is the delete button
    const deleteButton = e.target.closest('.delete-btn');
    
    if (deleteButton) {
        // Get the transaction ID from the data attribute
        const idToDelete = deleteButton.dataset.id;
        
        // Confirm deletion (using a custom modal would be better than confirm() in production,
        // but for a simple local app, we use it for clarity)
        if (window.confirm('Are you sure you want to delete this transaction?')) {
             deleteTransaction(idToDelete);
        }
    }
}

// === 6. INITIALIZATION ===

/**
 * Initializes the application: loads data, sets up event listeners, and updates the UI.
 */
function init() {
    loadTransactions(); // Load data from localStorage
    updateSummary();    // Calculate and show totals
    renderTransactions();// Display the list
}

// Attach event listeners when the window has finished loading
window.onload = function() {
    // Attach event listeners to the form and the transaction list
    form.addEventListener('submit', handleFormSubmit);
    transactionList.addEventListener('click', handleListClick);

    // Start the application
    init();
};
